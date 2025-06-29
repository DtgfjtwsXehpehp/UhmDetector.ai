export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: Date;
  bio?: string;
  location?: string;
  website?: string;
  twitter?: string;
  github?: string;
}

export interface Session {
  id: string;
  userId: string;
  title: string;
  date: Date;
  duration: number; // in seconds
  transcription: string;
  fillerWordCount: FillerWordCount;
  clarityScore: number;
  suggestions?: Suggestion[];
}

export interface FillerWordCount {
  uhm: number;
  like: number;
  so: number;
  youKnow: number;
  total: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  avatarUrl?: string;
  clarityScore: number;
  sessionsCompleted: number;
  badges: number;
}

export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
  fillerWords: {
    word: string;
    index: number;
  }[];
}

export interface Suggestion {
  type: 'alternative' | 'tip';
  fillerWord?: string;
  alternatives?: string[];
  tip?: string;
  context?: string;
}

export interface AIAnalysis {
  suggestions: Suggestion[];
  patterns: {
    commonFillers: string[];
    frequentContexts: string[];
    improvement: number;
  };
}

export interface PracticeMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  goals: string[];
  prompts: string[];
}

export interface PracticeSession extends Session {
  modeId: string;
  completedGoals: string[];
  score: number;
}

export interface Testimonial {
  id: string;
  userId: string;
  userName: string;
  avatarUrl?: string;
  rating: number;
  text: string;
  role: string;
  date: Date;
  verified: boolean;
  sessionCount: number;
  averageClarity: number;
}

export interface SpeechAnalytics {
  wpm: number;
  sentiment: number;
  confidence: number;
  tone: 'positive' | 'neutral' | 'negative';
  pace: 'slow' | 'normal' | 'fast';
}

// Typing-related interfaces
export interface TypingTest {
  id: string;
  userId: string;
  text: string;
  mode: TypingMode;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in seconds
  wpm: number;
  accuracy: number;
  errors: number;
  date: Date;
  completedText: string;
  mistakes: TypingMistake[];
}

export interface TypingMistake {
  position: number;
  expected: string;
  typed: string;
  timestamp: number;
}

export interface TypingMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  textType: 'words' | 'sentences' | 'paragraphs' | 'code' | 'numbers';
  timeLimit?: number; // in seconds
  wordCount?: number;
}

export interface TypingStats {
  totalTests: number;
  averageWpm: number;
  averageAccuracy: number;
  bestWpm: number;
  bestAccuracy: number;
  totalTimeTyped: number; // in seconds
  improvementRate: number; // percentage
  commonMistakes: { [key: string]: number };
}

export interface TypingLeaderboard {
  userId: string;
  userName: string;
  avatarUrl?: string;
  bestWpm: number;
  averageWpm: number;
  testsCompleted: number;
  accuracy: number;
}