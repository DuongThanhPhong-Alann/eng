export type Question = {
  id: string;
  number: number;
  section: string;
  prompt: string;
  sourceWord: string;
  answer: string;
  explanation: string;
  choices?: string[];
  sourceExamId?: string;
  sourceExamTitle?: string;
  sourceQuestionNumber?: number;
};

export type Exam = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  sourceFile: string;
  questionCount: number;
  questions: Question[];
};

export type AttemptSummary = {
  id: string;
  examId: string;
  examTitle: string;
  level: "choice" | "typing";
  status: "in_progress" | "completed";
  totalQuestions: number;
  answeredCount: number;
  correctCount: number | null;
  wrongCount: number | null;
  focusLossCount: number;
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
};

export type AttemptRecord = {
  _id: string;
  learnerId: string;
  examId: string;
  examTitle: string;
  level: "choice" | "typing";
  status: "in_progress" | "completed";
  totalQuestions: number;
  answeredCount: number;
  correctCount: number | null;
  wrongCount: number | null;
  focusLossCount: number;
  startedAt: Date;
  completedAt: Date | null;
  durationSeconds: number | null;
  ipAddress?: string | null;
  focusLossEvents?: {
    leftAt: Date;
    returnedAt: Date | null;
  }[];
  location?: {
    latitude: number;
    longitude: number;
    accuracyMeters: number;
    capturedAt: Date;
  } | null;
  answers: { questionId: string; submittedAnswer: string; isCorrect: boolean }[];
};

export type AttemptDetail = AttemptSummary & {
  ipAddress?: string | null;
  focusLossEvents?: {
    leftAt: string;
    returnedAt: string | null;
  }[];
  location?: {
    latitude: number;
    longitude: number;
    accuracyMeters: number;
    capturedAt: string;
  } | null;
  answers: {
    questionId: string;
    number: number;
    section: string;
    prompt: string;
    submittedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string;
  }[];
};
