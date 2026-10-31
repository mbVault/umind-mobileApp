export type AuthStackParamList = {
  Splash: undefined;
  Pathway: undefined;
  PsychologistEntry: undefined;
  Welcome: undefined;
  Alias: undefined;
  RecoveryKey: undefined;
  LifeStage: undefined;
  Personalization: undefined;
  ThemeCity: undefined;
  Recover: undefined;
  Trial: undefined;
};

export type SaathiReflectParams = {
  entryDate: string;
  causes: string[];
  prompt?: string;
  body: string;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  Profile: undefined;
  Payments: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Saathi: { reflect?: SaathiReflectParams } | undefined;
  Diary: undefined;
  Listen: { category?: string } | undefined;
  Experts: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};
