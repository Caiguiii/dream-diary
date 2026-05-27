# 瑪莉蓮夢錄 — 專案說明文件

## 目錄

1. [專案簡介](#1-專案簡介)
2. [功能清單](#2-功能清單)
3. [技術棧](#3-技術棧)
4. [AWS 服務說明](#4-aws-服務說明)
5. [系統架構圖](#5-系統架構圖)
6. [API 端點](#6-api-端點)
7. [Lambda 函式說明](#7-lambda-函式說明)
8. [資料結構](#8-資料結構)
9. [前端頁面結構](#9-前端頁面結構)
10. [部署流程](#10-部署流程)

---

## 1. 專案簡介

**瑪莉蓮夢錄** 是一款 AI 驅動的夢境日記 Web App。  
使用者每天記錄夢境後，AI 會自動分析情緒、象徵、關鍵字，並生成文學風格標題。  
每週日可生成一份 AI 夢境週報，以奇幻短篇小說形式回顧本週的夢境旅程。

---

## 2. 功能清單

### 核心功能

| 功能 | 說明 |
|------|------|
| **夢境記錄** | 輸入夢境內容、日期、心情（7 種）、清晰度、夢境類型（8 種） |
| **AI 分析** | 自動生成夢境摘要、周公解夢、情緒分析、象徵元素、關鍵字 |
| **AI 標題生成** | 以文學詩意風格自動命名夢境，可重生成或手動編輯 |
| **夢境日記** | 瀏覽所有夢境記錄，支援關鍵字搜尋、夢境類型篩選 |
| **夢境詳情** | 查看完整 AI 分析報告，可在線編輯標題 |
| **統計分析** | 情緒趨勢圖（Recharts）、情緒頻率、夢境類型分佈、關鍵字、象徵統計；支援本週 / 本月 / 本年 / 全部篩選 |
| **AI 夢境週報** | 每週日解鎖，生成一次性 AI 夢境故事，永久保存，不可重新生成 |
| **雲端同步** | 登入後自動同步資料到 DynamoDB，跨裝置存取 |
| **離線模式** | 未登入時資料儲存於 localStorage，體驗不中斷 |

### 帳號功能

| 功能 | 說明 |
|------|------|
| **電子信箱註冊 / 登入** | 透過 Amazon Cognito 管理身份驗證 |
| **JWT 授權** | 所有 API 呼叫附帶 Cognito JWT Token |
| **自動同步** | 登入後立即從雲端拉取所有夢境資料 |
| **登出清除** | 登出時清除本地 localStorage 資料 |

### 週報機制

- **平日（週一至週六）**：顯示等待畫面，倒數至週日，展示本週累積夢境數與情緒
- **週日**：解鎖生成按鈕，AI 分析本週所有夢境並生成奇幻故事
- **已生成**：永久快取，重新登入不重複呼叫 AI

---

## 3. 技術棧

### 前端

| 技術 | 版本 | 用途 |
|------|------|------|
| React | 18 | UI 框架 |
| TypeScript | 5 | 型別安全 |
| Vite | 5 | 建置工具 |
| React Router | v6 | SPA 路由 |
| Tailwind CSS | 3 | 樣式（Morandi 自訂色系） |
| Recharts | 2 | 統計圖表（折線、長條、圓餅） |
| amazon-cognito-identity-js | 6 | 前端 Cognito SDK |

### 後端

| 技術 | 版本 | 用途 |
|------|------|------|
| Python | 3.12 | Lambda Runtime |
| Groq API | — | LLM 推理（免費 API） |
| llama-3.3-70b-versatile | — | 夢境分析、週報生成 |
| llama-3.1-8b-instant | — | 標題生成（快速輕量） |
| AWS SAM | — | IaC 部署工具 |

### 設計系統

- **Morandi 莫蘭迪色系**：`#EDE8DE`（背景）、`#C4815A`（主色調）、`#C4A875`（金色）
- **Glassmorphism**：`backdrop-filter: blur()` + 半透明白色背景
- **字體**：-apple-system / PingFang TC / Noto Serif TC（故事文字）

---

## 4. AWS 服務說明

### Amazon Cognito

- **User Pool**：管理使用者帳號，以 Email 為識別碼
- **認證流程**：`ALLOW_USER_PASSWORD_AUTH` + `ALLOW_USER_SRP_AUTH`
- **Pre Sign-Up Lambda Trigger**：自動確認使用者（跳過 Email 驗證步驟）
- **JWT Token**：登入後取得 ID Token，附加在所有 API 請求的 `Authorization` Header

### Amazon DynamoDB

- **資料表名稱**：`DreamJournal`
- **計費模式**：隨需（PAY_PER_REQUEST），無固定費用
- **分區鍵**：`userId`（String）— 對應 Cognito 使用者 ID
- **排序鍵**：`id`（String）— 夢境唯一識別碼
- **每條資料**：包含完整夢境內容、AI 分析結果、日期、情緒、清晰度等

### AWS Lambda（7 個函式）

| 函式 | Runtime | Timeout | 觸發來源 |
|------|---------|---------|---------|
| `AnalyzeDreamFunction` | Python 3.12 | 60s | API Gateway POST /analyze |
| `GenerateTitleFunction` | Python 3.12 | 20s | API Gateway POST /generate-title |
| `WeeklyReportFunction` | Python 3.12 | 60s | API Gateway GET /weekly-report |
| `ListDreamsFunction` | Python 3.12 | 15s | API Gateway GET /dreams |
| `SaveDreamFunction` | Python 3.12 | 15s | API Gateway POST /dreams |
| `DeleteDreamFunction` | Python 3.12 | 15s | API Gateway DELETE /dreams/{id} |
| `PreSignUpFunction` | Python 3.12 | 15s | Cognito Pre Sign-Up Trigger |

### Amazon API Gateway（HTTP API）

- **類型**：HTTP API（V2，低延遲、低成本）
- **授權器**：JWT Authorizer（驗證 Cognito JWT Token）
- **CORS**：允許所有來源（`*`）
- **Stage**：`prod`

### Amazon S3

- **Bucket**：`dream-journal-{AccountId}-ap-northeast-1`
- **用途**：儲存前端靜態檔案（`index.html`, JS, CSS）
- **存取控制**：僅允許 CloudFront（OAC，Origin Access Control）存取，不公開

### Amazon CloudFront

- **Distribution ID**：`E2GNP8D808Z2ZX`
- **用途**：CDN 分發前端靜態資源，全球加速
- **HTTPS**：強制 redirect to HTTPS
- **SPA 路由**：403 / 404 錯誤皆回傳 `index.html`（支援前端路由）
- **快取策略**：Managed Cache Policy（`658327ea`）

### AWS SAM（Serverless Application Model）

- **template.yaml**：定義所有 AWS 資源（IaC）
- **sam build**：打包 Lambda 函式
- **sam deploy**：部署所有資源到 AWS

---

## 5. 系統架構圖

```
┌─────────────────────────────────────────────────────────────────────┐
│                           使用者瀏覽器                                │
│                                                                     │
│   React SPA (Vite)  ─────  localStorage (離線快取)                  │
│   ├── 夢境記錄 / 日記 / 統計 / 週報                                   │
│   └── Cognito SDK (JWT 管理)                                        │
└────────────┬──────────────────────────────┬────────────────────────┘
             │ HTTPS                        │ HTTPS (靜態資源)
             ▼                              ▼
┌────────────────────────┐    ┌─────────────────────────────────┐
│   Amazon CloudFront    │    │   Amazon CloudFront             │
│   (CDN 全球加速)        │    │   → Amazon S3                   │
│   Distribution:        │    │     index.html / JS / CSS       │
│   E2GNP8D808Z2ZX       │    └─────────────────────────────────┘
└────────────┬───────────┘
             │ API 請求 (JWT Authorization Header)
             ▼
┌────────────────────────────────────────────────────────────────┐
│              Amazon API Gateway HTTP API (prod stage)          │
│                                                                │
│  JWT Authorizer ─── Amazon Cognito User Pool                  │
│                                                                │
│  POST   /analyze          →  AnalyzeDreamFunction             │
│  POST   /generate-title   →  GenerateTitleFunction            │
│  GET    /weekly-report    →  WeeklyReportFunction             │
│  GET    /dreams           →  ListDreamsFunction               │
│  POST   /dreams           →  SaveDreamFunction                │
│  DELETE /dreams/{id}      →  DeleteDreamFunction              │
└────────────┬───────────────────────────────────────────────────┘
             │ Lambda Invoke
             ▼
┌────────────────────────────────────────────────────────────────┐
│                   AWS Lambda (Python 3.12)                     │
│                                                                │
│  AnalyzeDreamFunction                                          │
│  ├── 接收夢境內容、心情、類型                                    │
│  ├── 呼叫 Groq API (llama-3.3-70b-versatile)                  │
│  └── 回傳 分析結果 + 標題                                       │
│                                                                │
│  GenerateTitleFunction                                         │
│  ├── 接收夢境內容                                               │
│  ├── 呼叫 Groq API (llama-3.1-8b-instant)                     │
│  └── 回傳 詩意標題                                              │
│                                                                │
│  WeeklyReportFunction                                          │
│  ├── 查詢 DynamoDB 取得本週所有夢境                              │
│  ├── 統計情緒 / 關鍵字 / 類型                                    │
│  ├── 呼叫 Groq API (llama-3.3-70b-versatile) 生成故事          │
│  └── 回傳 週報資料                                              │
│                                                                │
│  ListDreamsFunction  →  DynamoDB Query (by userId)            │
│  SaveDreamFunction   →  DynamoDB PutItem                      │
│  DeleteDreamFunction →  DynamoDB DeleteItem                   │
│  PreSignUpFunction   →  自動確認使用者（Cognito Trigger）        │
└────────────┬───────────────────────────┬───────────────────────┘
             │ Read / Write              │ AI 推理
             ▼                          ▼
┌───────────────────────┐   ┌──────────────────────────────────┐
│  Amazon DynamoDB      │   │  Groq Cloud API                  │
│  Table: DreamJournal  │   │  (外部第三方，免費額度)            │
│  PK: userId           │   │  llama-3.3-70b-versatile         │
│  SK: id               │   │  llama-3.1-8b-instant            │
│  (PAY_PER_REQUEST)    │   └──────────────────────────────────┘
└───────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                  Amazon Cognito                                │
│  User Pool: DreamJournalUserPool                              │
│  ├── 使用者帳號管理（Email / Password）                         │
│  ├── JWT ID Token 簽發                                         │
│  └── Pre Sign-Up Lambda Trigger（自動確認）                    │
└────────────────────────────────────────────────────────────────┘
```

### 資料流（記錄夢境）

```
使用者輸入夢境
      │
      ▼
前端 InputPage
      │ POST /analyze (JWT)
      ▼
API Gateway → AnalyzeDreamFunction
      │
      ├── Groq API (llama-3.3-70b)
      │     └── 回傳 JSON: { summary, emotions, symbols, keywords, title }
      │
      ▼
前端收到分析結果
      │
      ├── 儲存到 localStorage（立即）
      │
      └── POST /dreams (JWT) → SaveDreamFunction → DynamoDB PutItem
```

### 資料流（夢境週報）

```
使用者點擊「生成週報」（僅週日可用）
      │
      ▼
前端 WeeklyReportPage
      │ 檢查 localStorage 快取 → 命中則直接顯示（不呼叫 API）
      │
      │ GET /weekly-report?weekStart=YYYY-MM-DD (JWT)
      ▼
API Gateway → WeeklyReportFunction
      │
      ├── DynamoDB Query（取得該週所有夢境）
      ├── 統計情緒 / 關鍵字 / 類型
      ├── Groq API → 生成 300-800 字奇幻故事
      │
      ▼
前端收到週報
      └── 儲存到 localStorage（{ weekId, generated: true, generatedAt, reportData }）
              └── 往後直接讀取快取，不重複呼叫 AI
```

---

## 6. API 端點

所有端點需附帶 `Authorization: <CognitoIdToken>` Header。

| Method | Path | 說明 | Lambda |
|--------|------|------|--------|
| `GET` | `/dreams` | 取得所有夢境列表 | ListDreamsFunction |
| `POST` | `/dreams` | 儲存夢境 | SaveDreamFunction |
| `DELETE` | `/dreams/{id}` | 刪除夢境 | DeleteDreamFunction |
| `POST` | `/analyze` | AI 分析夢境 + 生成標題 | AnalyzeDreamFunction |
| `POST` | `/generate-title` | 重新生成標題 | GenerateTitleFunction |
| `GET` | `/weekly-report?weekStart=` | 生成週報 | WeeklyReportFunction |

---

## 7. Lambda 函式說明

### AnalyzeDreamFunction
- **模型**：`llama-3.3-70b-versatile`（Groq）
- **輸入**：`{ content, mood, date, clarity, dreamType }`
- **輸出**：`{ success, title, analysis: { summary, zhougongInterpretation, themes, emotions, symbols, keywords } }`
- **JSON Schema**：使用結構化 JSON output 確保格式穩定

### GenerateTitleFunction
- **模型**：`llama-3.1-8b-instant`（Groq，快速輕量）
- **輸入**：`{ content, mood, dreamType }`
- **輸出**：`{ success, title }`
- **Timeout**：20 秒

### WeeklyReportFunction
- **模型**：`llama-3.3-70b-versatile`（Groq）
- **流程**：DynamoDB Query → 統計運算 → Groq 生成故事
- **輸出**：`{ weekStart, weekEnd, dreamCount, topEmotions, topKeywords, dreamTypeCounts, moodSummary, dreamStory, generatedAt }`
- **Timeout**：60 秒
- **權限**：`DynamoDBReadPolicy`

### PreSignUpFunction
- **觸發**：Cognito Pre Sign-Up Trigger
- **功能**：設定 `event['response']['autoConfirmUser'] = True`，跳過 Email 驗證

---

## 8. 資料結構

### Dream（夢境）

```typescript
interface Dream {
  id: string;           // 唯一 ID（timestamp + random）
  title: string;        // AI 生成標題（可編輯）
  content: string;      // 夢境內容
  date: string;         // YYYY-MM-DD
  mood: string;         // "😊 愉快" | "😌 平靜" | ...（7 種）
  clarity: 'fuzzy' | 'normal' | 'clear';
  dreamType: string;    // "日常" | "奇幻" | "驚悚" | ...（8 種）
  analysis?: DreamAnalysis;
  createdAt: string;    // ISO 8601
}
```

### DreamAnalysis（AI 分析）

```typescript
interface DreamAnalysis {
  summary: string;               // 夢境摘要
  zhougongInterpretation: string; // 周公解夢
  themes: string[];              // 主題標籤
  emotions: Array<{ name: string; percentage: number }>;
  symbols: Array<{ symbol: string; meaning: string }>;
  keywords: string[];
}
```

### WeeklyCacheEntry（週報快取）

```typescript
interface WeeklyCacheEntry {
  weekId: string;          // "2026-W21"
  generated: boolean;      // 是否已生成
  generatedAt: string;     // ISO 8601
  reportData: WeeklyReportData;
}
```

### DynamoDB 資料格式

```json
{
  "userId": "ap-northeast-1:xxxx-xxxx",
  "id": "lk3abc12",
  "title": "消失在霧中的列車",
  "content": "...",
  "date": "2026-05-22",
  "mood": "😌 平靜",
  "clarity": "normal",
  "dreamType": "奇幻",
  "analysis": { ... },
  "createdAt": "2026-05-22T02:00:00.000Z"
}
```

---

## 9. 前端頁面結構

```
/landing     進入頁（Morandi 暖色調，CTA 按鈕）
/login       登入 / 註冊（Cognito，glass-morandi 卡片）
/            首頁（本週心情格、快速操作、最近夢境）
/input       記錄夢境（表單 → AI 分析 → 標題預覽 → 儲存）
/diary       夢境日記（搜尋、類型篩選、夢境列表）
/analysis/:id  夢境詳情（AI 分析報告、可編輯標題）
/stats       統計（週/月/年/全部；情緒趨勢、類型分佈、關鍵字）
/weekly      夢境週報（週日解鎖、AI 故事、歷史週次）
```

### 路由保護

- `ProtectedRoute`：Cognito 已設定但未登入 → 導向 `/landing`
- `PublicRoute`：已登入 → 導向 `/`（避免重複進入 Landing / Login）

---

## 10. 部署流程

### 後端（Lambda + DynamoDB + API Gateway）

```bash
# 打包所有 Lambda 函式
sam build

# 部署到 AWS（首次）
sam deploy --guided

# 更新部署
sam deploy
```

### 前端（S3 + CloudFront）

```bash
# 建置
npm run build

# 上傳到 S3
aws s3 sync dist/ s3://dream-journal-{AccountId}-ap-northeast-1 --delete

# 清除 CloudFront 快取（立即生效）
aws cloudfront create-invalidation --distribution-id E2GNP8D808Z2ZX --paths "/*"
```

### 環境變數（`.env`）

```env
VITE_API_URL=https://{ApiId}.execute-api.ap-northeast-1.amazonaws.com/prod
VITE_COGNITO_USER_POOL_ID=ap-northeast-1_xxxxxxx
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 成本估算（月）

| 服務 | 免費額度 | 估計費用（低使用量） |
|------|---------|-----------------|
| CloudFront | 1TB 傳輸 / 10M 請求 | $0 |
| S3 | 5GB 儲存 | $0 |
| Lambda | 1M 請求 / 400,000 GB-s | $0 |
| DynamoDB | 25GB / 200M 請求 | $0 |
| API Gateway | 1M HTTP API 請求 | $0 |
| Cognito | 50,000 MAU | $0 |
| **Groq API** | 免費額度（速率限制） | $0 |
| **合計** | | **≈ $0 / 月** |

> 在個人或小規模使用下，所有 AWS 服務均在免費額度內。

---

*文件最後更新：2026-05-22*
