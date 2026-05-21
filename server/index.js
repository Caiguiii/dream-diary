const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:7b';

const SYSTEM_PROMPT = `你是一位精通中國傳統夢境文化的分析師，結合數千年周公解夢的智慧與現代心理學知識。

你的分析風格：
1. 首先引用周公解夢中的傳統解釋，語氣溫和且充滿古典智慧
2. 結合榮格 (Jung) 的夢境心理學觀點，分析潛意識象徵
3. 識別夢中的情緒狀態與潛在壓力
4. 語氣溫和、富洞察力，不過度神秘化，以中性方式分析

重要規則：
- 必須用繁體中文回答
- 回答必須是有效的 JSON 格式，不包含任何 JSON 以外的文字、說明或 markdown 標記
- emotions 的 percentage 總和應接近 100`;

function buildPrompt(form) {
  const { title, content, date, mood, clarity, dreamType } = form;
  const clarityLabel = { fuzzy: '模糊', normal: '普通', clear: '清晰' };
  return `請分析以下夢境，並回傳 JSON 格式的分析結果：

夢境資訊：
- 標題：${title || '（無標題）'}
- 日期：${date}
- 醒來後心情：${mood || '（未填寫）'}
- 夢境清晰度：${clarityLabel[clarity] || clarity}
- 夢境類型：${dreamType || '（未分類）'}
- 夢境內容：${content}

請回傳以下 JSON 格式（只回傳 JSON，不要其他文字）：
{
  "title": "夢境標題，10-20字，要有詩意、神秘感、情緒感，像短篇小說章節名",
  "summary": "夢境摘要，2-3 句話，簡明扼要",
  "zhougongInterpretation": "周公解夢傳統解讀，結合心理學觀點，150-250 字",
  "themes": ["主題1", "主題2", "主題3"],
  "emotions": [
    { "name": "情緒名稱", "percentage": 數字 }
  ],
  "symbols": [
    { "symbol": "象徵元素", "meaning": "可能代表的意義" }
  ],
  "keywords": ["關鍵字1", "關鍵字2", "關鍵字3", "關鍵字4"]
}`;
}

async function callOllama(userPrompt) {
  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      stream: false,
      options: { temperature: 0.7 },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Ollama 錯誤 (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data.message?.content ?? '';
}

app.post('/api/analyze', async (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, error: '請輸入夢境內容' });
  }

  try {
    const raw = await callOllama(buildPrompt(req.body));
    // Strip markdown code fences if model wraps the JSON
    const jsonText = raw.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    const parsed = JSON.parse(jsonText);
    const { title = '', ...analysis } = parsed;
    res.json({ success: true, title, analysis });
  } catch (err) {
    console.error('Analysis error:', err);
    const isSyntax = err instanceof SyntaxError;
    const isConnection = err.cause?.code === 'ECONNREFUSED';
    let message;
    if (isConnection) {
      message = `無法連線 Ollama（${OLLAMA_URL}），請確認 Ollama 已啟動`;
    } else if (isSyntax) {
      message = 'AI 回傳格式錯誤，請再試一次（可嘗試換較大的模型）';
    } else {
      message = err.message || '分析失敗，請稍後再試';
    }
    res.status(500).json({ success: false, error: message });
  }
});

app.get('/api/health', async (_req, res) => {
  try {
    const r = await fetch(`${OLLAMA_URL}/api/tags`);
    const data = await r.json();
    const models = data.models?.map(m => m.name) ?? [];
    const modelReady = models.some(m => m.startsWith(MODEL.split(':')[0]));
    res.json({ ok: true, ollamaRunning: true, model: MODEL, modelReady, availableModels: models });
  } catch {
    res.json({ ok: false, ollamaRunning: false, model: MODEL });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🌙 夢境分析伺服器啟動於 http://localhost:${PORT}`);
  console.log(`🤖 使用模型：${MODEL}（Ollama: ${OLLAMA_URL}）`);
  console.log(`   若尚未下載模型，請執行：ollama pull ${MODEL}`);
});
