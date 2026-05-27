import json
import os
import urllib.request
import urllib.error
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import boto3
from boto3.dynamodb.conditions import Key

GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '')
GROQ_MODEL = os.environ.get('GROQ_MODEL', 'llama-3.3-70b-versatile')
GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
}

STORY_SYSTEM_PROMPT = """你是一位擅長書寫夢境故事的文學作家。
你的任務是根據使用者這一週的夢境，生成一篇屬於他們的「夢境週故事」。

故事要求：
- 長度 300-800 字
- 風格：療癒感、神秘感、敘事感，像短篇奇幻小說
- 融合本週所有夢境的元素、情緒、人物、場景
- 用第二人稱（「你」）書寫，讓讀者有代入感
- 語言優美流暢，有詩意，不要過度解釋
- 結尾要有溫暖或深刻的感悟

請直接輸出故事文字，不要 JSON，不要標題，不要解釋。"""


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


def to_decimal(obj):
    if isinstance(obj, float):
        return Decimal(str(obj))
    elif isinstance(obj, dict):
        return {k: to_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [to_decimal(i) for i in obj]
    return obj


def get_week_bounds(week_start_str):
    try:
        start = datetime.strptime(week_start_str, '%Y-%m-%d').replace(tzinfo=timezone.utc)
    except (ValueError, TypeError):
        today = datetime.now(timezone.utc)
        start = today - timedelta(days=today.weekday())
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=6)
    return start.strftime('%Y-%m-%d'), end.strftime('%Y-%m-%d')


def handler(event, context):
    try:
        user_id = event['requestContext']['authorizer']['jwt']['claims']['sub']

        params = event.get('queryStringParameters') or {}
        week_start_str = params.get('weekStart', '')
        week_start, week_end = get_week_bounds(week_start_str)

        # ── Check DynamoDB cache first ─────────────────────────────────────────
        cache_id = f'report_{week_start}'
        cached = table.get_item(Key={'userId': user_id, 'id': cache_id}).get('Item')
        if cached and cached.get('reportData'):
            report = cached['reportData']
            return {
                'statusCode': 200, 'headers': HEADERS,
                'body': json.dumps(report, cls=DecimalEncoder, ensure_ascii=False)
            }

        # ── Query user dreams for this week ────────────────────────────────────
        response = table.query(KeyConditionExpression=Key('userId').eq(user_id))
        all_dreams = response.get('Items', [])
        week_dreams = [d for d in all_dreams if week_start <= d.get('date', '') <= week_end]

        dream_count = len(week_dreams)

        if dream_count == 0:
            empty = {
                'weekStart': week_start, 'weekEnd': week_end,
                'dreamCount': 0, 'topEmotions': [], 'topKeywords': [],
                'dreamTypeCounts': [], 'moodSummary': '',
                'dreamStory': '', 'generatedAt': datetime.now(timezone.utc).isoformat(),
            }
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(empty)}

        # ── Compute stats ──────────────────────────────────────────────────────
        emotion_map, kw_freq, type_map = {}, {}, {}
        for d in week_dreams:
            analysis = d.get('analysis') or {}
            for em in analysis.get('emotions', []):
                name = em.get('name', '')
                if name:
                    emotion_map[name] = emotion_map.get(name, 0) + 1
            for kw in analysis.get('keywords', []):
                if kw:
                    kw_freq[kw] = kw_freq.get(kw, 0) + 1
            dream_type = d.get('dreamType', '')
            if dream_type:
                type_map[dream_type] = type_map.get(dream_type, 0) + 1

        top_emotions = sorted([{'name': k, 'count': v} for k, v in emotion_map.items()], key=lambda x: -x['count'])[:5]
        top_keywords = [k for k, _ in sorted(kw_freq.items(), key=lambda x: -x[1])][:8]
        dream_type_counts = sorted([{'type': k, 'count': v} for k, v in type_map.items()], key=lambda x: -x['count'])

        # ── Generate dream story via Groq ──────────────────────────────────────
        dream_story = ''
        mood_summary = ''

        if GROQ_API_KEY:
            dreams_text = '\n\n'.join([
                f'【{d.get("date", "")}】{d.get("title", "無題")}\n'
                f'心情：{d.get("mood", "未填寫")} | 類型：{d.get("dreamType", "未分類")}\n'
                f'內容：{d.get("content", "")[:200]}'
                for d in sorted(week_dreams, key=lambda x: x.get('date', ''))
            ])
            user_prompt = (
                f'以下是使用者本週（{week_start} 至 {week_end}）的 {dream_count} 個夢境：\n\n'
                f'{dreams_text}\n\n'
                f'主要情緒：{"、".join([e["name"] for e in top_emotions[:3]])}\n'
                f'關鍵詞：{"、".join(top_keywords[:5])}\n\n'
                '請根據以上內容，為使用者創作一篇充滿詩意的「夢境週故事」。'
            )
            payload = json.dumps({
                'model': GROQ_MODEL,
                'messages': [
                    {'role': 'system', 'content': STORY_SYSTEM_PROMPT},
                    {'role': 'user', 'content': user_prompt},
                ],
                'max_tokens': 1500,
                'temperature': 0.85,
            }).encode('utf-8')
            req = urllib.request.Request(
                GROQ_API_URL, data=payload,
                headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {GROQ_API_KEY}', 'User-Agent': 'dream-journal/1.0'},
                method='POST',
            )
            with urllib.request.urlopen(req, timeout=55) as resp:
                result = json.loads(resp.read().decode('utf-8'))
            dream_story = result['choices'][0]['message']['content'].strip()
            moods = [d.get('mood', '') for d in week_dreams if d.get('mood')]
            if moods:
                mood_summary = f'本週以{"、".join(set(moods[:3]))}為主要情緒狀態'

        report_data = {
            'weekStart': week_start,
            'weekEnd': week_end,
            'dreamCount': dream_count,
            'topEmotions': top_emotions,
            'topKeywords': top_keywords,
            'dreamTypeCounts': dream_type_counts,
            'moodSummary': mood_summary,
            'dreamStory': dream_story,
            'generatedAt': datetime.now(timezone.utc).isoformat(),
        }

        # ── Save to DynamoDB cache ─────────────────────────────────────────────
        try:
            table.put_item(Item=to_decimal({
                'userId': user_id,
                'id': cache_id,
                'reportData': report_data,
                'generatedAt': report_data['generatedAt'],
            }))
        except Exception:
            pass  # cache save failure is non-fatal

        return {
            'statusCode': 200, 'headers': HEADERS,
            'body': json.dumps(report_data, cls=DecimalEncoder, ensure_ascii=False)
        }

    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        try:
            err_msg = json.loads(err_body).get('error', {}).get('message', err_body)
        except Exception:
            err_msg = err_body
        return {'statusCode': 500, 'headers': HEADERS, 'body': json.dumps({'error': f'Groq API 錯誤：{err_msg}'})}
    except Exception as e:
        return {'statusCode': 500, 'headers': HEADERS, 'body': json.dumps({'error': str(e)})}
