export type Clarity = 'fuzzy' | 'normal' | 'clear';

export interface DreamEmotion {
  name: string;
  percentage: number;
}

export interface DreamSymbol {
  symbol: string;
  meaning: string;
}

export interface DreamAnalysis {
  summary: string;
  zhougongInterpretation: string;
  themes: string[];
  emotions: DreamEmotion[];
  symbols: DreamSymbol[];
  keywords: string[];
}

export interface Dream {
  id: string;
  title: string;
  content: string;
  date: string;
  mood: string;
  clarity: Clarity;
  dreamType: string;
  analysis?: DreamAnalysis;
  createdAt: string;
}

export interface WeeklyReportData {
  weekStart: string;
  weekEnd: string;
  dreamCount: number;
  topEmotions: Array<{ name: string; count: number }>;
  topKeywords: string[];
  dreamTypeCounts: Array<{ type: string; count: number }>;
  moodSummary: string;
  dreamStory: string;
  generatedAt: string;
}
