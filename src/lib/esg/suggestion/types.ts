export type Band = 'E' | 'S' | 'G' | 'SEG_overall';

export interface SuggestionFocus {
  band?: Band;          // choose one band or SEG_overall
  sdgs?: string[];      // e.g., ["SDG3","SDG4"]
}

export interface SuggestionTargets {
  hours?: number;                 // target total volunteer hours
  participants?: number;          // target unique participants
  orgScoreDelta?: number;         // target score delta (pre-multiplied by G)
}

export interface SuggestionConstraints {
  budget?: number;
  maxEvents?: number;
  riskAllowed?: ('low'|'medium'|'high')[];
  weekendsOnly?: boolean;
}

export interface SuggestionRequest {
  focus: SuggestionFocus;
  targets: SuggestionTargets;
  constraints?: SuggestionConstraints;
  snapshotId?: string; // optional: pick a specific OrganizationMetricSnapshot; else use latest
}

export interface SuggestedEvent {
  templateId: string;
  name: string;
  sdgs: string[];
  participants: number;
  durationHours: number;
  predictedDelta: {
    E: number; H: number; Q: number; V: number; S: number; C: number; G: number;
    overall: number; // (E+H+Q+V+S+C)*G*100 delta
  };
  warnings?: string[];
}

export interface SuggestionResult {
  plan: SuggestedEvent[];
  totals: { hours: number; participants: number; cost: number };
  predictedDelta: { E: number; H: number; Q: number; V: number; S: number; C: number; G: number; overall: number };
  sdgsCovered: string[];
  meets: { hours?: boolean; participants?: boolean; orgScoreDelta?: boolean; deadline: boolean };
  warnings: string[];
}
