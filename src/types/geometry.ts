export type AppSection = 'home' | 'encyclopedia' | 'lab' | 'activities' | 'museum';

export type EraId =
  | 'ancient'
  | 'greek'
  | 'islamic'
  | 'medieval'
  | 'renaissance'
  | 'modern'
  | 'contemporary';

export interface EraSubTopic {
  id: string;
  title: string;
  locationOrFocus: string;
  narrative: string;
  achievements: string[];
  keyInsight: string;
}

export interface KeyDate {
  year: string;
  event: string;
}

export interface TheoremRule {
  title: string;
  formula: string;
  explanation: string;
}

export interface SolvedExample {
  title: string;
  problem: string;
  steps: string[];
  finalAnswer: string;
}

export interface EraQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface HistoricalEra {
  id: EraId;
  orderNumber: string;
  title: string;
  period: string;
  subtitle: string;
  bannerImage: string;
  summary: string;
  diagramType:
    | 'egyptian-rope'
    | 'euclid-pythagoras'
    | 'biruni-earth'
    | 'medieval-ratio'
    | 'renaissance-perspective'
    | 'cartesian-plane'
    | 'noneuclidean-curvatures';
  diagramCaption: string;
  subTopics: EraSubTopic[];
  keyDates: KeyDate[];
  scientistIds: string[];
  theorems: TheoremRule[];
  solvedExamples: SolvedExample[];
  comprehensionQuiz: EraQuizQuestion[];
}

export interface Scientist {
  id: string;
  name: string;
  latinName: string;
  eraId: EraId;
  eraLabel: string;
  lifespan: string;
  origin: string;
  title: string;
  biography: string;
  majorWorks: string[];
  discoveries: string[];
  theorems: string[];
  signatureFormula: string;
  motif:
    | 'thales'
    | 'pythagoras'
    | 'euclid'
    | 'archimedes'
    | 'khwarizmi'
    | 'thabit'
    | 'biruni'
    | 'haytham'
    | 'khayyam'
    | 'fibonacci'
    | 'davinci'
    | 'descartes'
    | 'fermat'
    | 'gauss'
    | 'lobachevsky'
    | 'riemann';
}

export type ActivityCategory =
  | 'mcq'
  | 'true-false'
  | 'puzzle'
  | 'scientists'
  | 'math-challenge';

export interface ActivityQuestion {
  id: string;
  category: ActivityCategory;
  difficulty: 'أساسي' | 'متوسط' | 'متقدم';
  points: number;
  question: string;
  hint?: string;
  options?: string[];
  correctAnswerIndex?: number;
  correctBoolean?: boolean;
  numericAnswer?: number;
  numericTolerance?: number;
  unit?: string;
  explanation: string;
}

export interface TeamScore {
  id: string;
  name: string;
  score: number;
  correctCount: number;
}

export interface UserProgress {
  studentName: string;
  totalPoints: number;
  exploredEras: EraId[];
  completedEraQuizzes: string[];
  solvedLabChallenges: string[];
  completedExperiments: string[];
  answeredActivityIds: string[];
  correctActivityIds: string[];
  visitedScientists: string[];
}
