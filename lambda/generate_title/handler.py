import json
import os
import urllib.request
import urllib.error

GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '')
GROQ_MODEL = os.environ.get('GROQ_MODEL', 'llama-3.1-8b-instant')
GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
}

SYSTEM_PROMPT = """你是一位擅長為夢境命名的文學詩人。
你的任務是根據夢境內容，生成一個充滿詩意、神秘感與情緒感的標題。

標題規則：
- 長度 10-20 個中文字
- 風格像短篇奇幻小說的章節名稱
- 有意境、有畫面感、有情緒
- 不要直白描述，要有隱喻和詩意
- 範例風格：「凌晨三點的海霧列車」、「遺失在雨中的藍色長廊」、「沒有出口的白色夢境」

只回傳 JSON：{"title": "標題"}，不要其他文字。"""


def handler(event, context):
    try:
        if not GROQ_API_KEY:
            return {'statusCode': 500, 'headers': HEADERS,
                    'body': json.dumps({'success': False, 'error': '請設定 GROQ_API_KEY'})}

        body = json.loads(event.get('body') or '{}')
        content = body.get('content', '').strip()
        mood = body.get('mood', '')
        dream_type = body.get('dreamType', '')

        if not content:
            return {'statusCode': 400, 'headers': HEADERS,
                    'body': json.dumps({'success': False, 'error': '請輸入夢境內容'})}

        user_prompt = (
            f'請為以下夢境生成標題：\n'
            f'- 心情：{mood or "（未填寫）"}\n'
            f'- 類型：{dream_type or "（未分類）"}\n'
            f'- 夢境內容：{content[:500]}\n\n'
            '只回傳 JSON：{"title": "標題"}'
        )

        payload = json.dumps({
            'model': GROQ_MODEL,
            'messages': [
                {'role': 'system', 'content': SYSTEM_PROMPT},
                {'role': 'user', 'content': user_prompt},
            ],
            'max_tokens': 64,
            'temperature': 0.9,
        }).encode('utf-8')

        req = urllib.request.Request(
            GROQ_API_URL,
            data=payload,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {GROQ_API_KEY}',
                'User-Agent': 'dream-journal/1.0',
            },
            method='POST',
        )

        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read().decode('utf-8'))

        raw = result['choices'][0]['message']['content'].strip()
        raw = raw.replace('```json', '').replace('```', '').strip()
        parsed = json.loads(raw)
        title = parsed.get('title', '')

        return {'statusCode': 200, 'headers': HEADERS,
                'body': json.dumps({'success': True, 'title': title})}

    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        try:
            err_msg = json.loads(err_body).get('error', {}).get('message', err_body)
        except Exception:
            err_msg = err_body
        return {'statusCode': 500, 'headers': HEADERS,
                'body': json.dumps({'success': False, 'error': f'Groq API 錯誤：{err_msg}'})}
    except Exception as e:
        return {'statusCode': 500, 'headers': HEADERS,
                'body': json.dumps({'success': False, 'error': str(e)})}
