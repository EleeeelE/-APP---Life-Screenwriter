
export interface Act1Data {
  high1: string;
  high2: string;
  high3: string;
}

export interface Act2Data {
  fact: string;
  notes: string;
}

export interface Act3Data {
  gratitude: string;
}

export interface Act4Data {
  // Map tip index to content string
  entries: Record<number, string>;
}

export interface Act5Data {
  goal1: string;
  goal2: string;
  goal3: string;
}

export interface FinalReport {
  directorsCut: string;
  scriptNotes: string;
  genreTag: string;
  stats: {
    narrative: number;
    control: number;
    insight: number;
  };
}

export interface ScreenplayState {
  act1: Act1Data;
  act2: Act2Data;
  act3: Act3Data;
  act4: Act4Data;
  act5: Act5Data;
}

export interface SavedReview {
  date: string; // YYYY-MM-DD
  state: ScreenplayState;
  report: FinalReport;
  timestamp: number;
}
