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

SYSTEM_PROMPT = """
You are a professional dream analysis system combining Traditional Chinese dream interpretation, Jungian analytical psychology, emotion psychology, cognitive psychology, and narrative psychology.

Your task is to analyze the user's dream and output structured psychological and symbolic interpretation.

Always respond in Traditional Chinese (繁體中文).

STRICT OUTPUT RULE:
- Return ONLY valid JSON
- No markdown
- No explanation
- No extra text
- Output must strictly follow the schema

GENERAL PRINCIPLES:
1. Integrate multiple perspectives:
   - Traditional Chinese dream symbolism (民俗解夢)
   - Jungian psychology (archetypes, unconscious)
   - Emotion psychology (stress, anxiety, desire, suppression)
   - Cognitive psychology (memory, day residue, threat simulation)
   - Narrative psychology (story structure of the dream)

2. Do NOT overclaim certainty. Use words like "可能" or "象徵可能".
3. Do NOT predict real-world future events.
4. Focus on psychological meaning rather than superstition.
5. Keep interpretations grounded and non-deterministic.
}
"""


def build_prompt(form):
    clarity_map = {'fuzzy': '模糊', 'normal': '普通', 'clear': '清晰'}
    return (
        '請分析以下夢境，並回傳 JSON 格式的分析結果：\n\n'
        f'- 標題：{form.get("title") or "（無標題）"}\n'
        f'- 日期：{form.get("date", "")}\n'
        f'- 醒來後心情：{form.get("mood") or "（未填寫）"}\n'
        f'- 夢境清晰度：{clarity_map.get(form.get("clarity", ""), "普通")}\n'
        f'- 夢境類型：{form.get("dreamType") or "（未分類）"}\n'
        f'- 夢境內容：{form.get("content", "")}\n\n'
        '請回傳以下 JSON（只回傳 JSON，不要其他文字）：\n'
        '{\n'
        '  "summary": "夢境摘要，2-3 句話",\n'
        '  "zhougongInterpretation": "周公解夢解讀，150-250 字",\n'
        '  "themes": ["主題1", "主題2", "主題3"],\n'
        '  "emotions": [{"name": "情緒", "percentage": 數字}],\n'
        '  "symbols": [{"symbol": "元素", "meaning": "意義"}],\n'
        '  "keywords": ["詞1", "詞2", "詞3", "詞4"]\n'
        '}'
    )


def handler(event, context):
    try:
        if not GROQ_API_KEY:
            return {'statusCode': 500, 'headers': HEADERS,
                    'body': json.dumps({'success': False,
                        'error': '請設定 GROQ_API_KEY 環境變數（前往 console.groq.com 免費取得）'})}

        form = json.loads(event.get('body') or '{}')
        if not form.get('content', '').strip():
            return {'statusCode': 400, 'headers': HEADERS,
                    'body': json.dumps({'success': False, 'error': '請輸入夢境內容'})}

        payload = json.dumps({
            'model': GROQ_MODEL,
            'messages': [
                {'role': 'system', 'content': SYSTEM_PROMPT},
                {'role': 'user', 'content': build_prompt(form)},
            ],
            'max_tokens': 2048,
            'temperature': 0.7,
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

        with urllib.request.urlopen(req, timeout=55) as resp:
            result = json.loads(resp.read().decode('utf-8'))

        raw = result['choices'][0]['message']['content'].strip()
        raw = raw.replace('```json', '').replace('```', '').strip()
        analysis = json.loads(raw)

        return {'statusCode': 200, 'headers': HEADERS,
                'body': json.dumps({'success': True, 'analysis': analysis})}

    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        try:
            err_msg = json.loads(err_body).get('error', {}).get('message', err_body)
        except Exception:
            err_msg = err_body
        return {'statusCode': 500, 'headers': HEADERS,
                'body': json.dumps({'success': False, 'error': f'Groq API 錯誤：{err_msg}'})}
    except json.JSONDecodeError:
        return {'statusCode': 500, 'headers': HEADERS,
                'body': json.dumps({'success': False, 'error': 'AI 回傳格式錯誤，請再試一次'})}
    except Exception as e:
        return {'statusCode': 500, 'headers': HEADERS,
                'body': json.dumps({'success': False, 'error': str(e)})}
