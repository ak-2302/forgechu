export type WikipediaArticle = {
  title: string;
  extract: string;
  url: string;
  description?: string;
  wikidataId?: string;
};

export type WikipediaResult =
  | { status: "found"; articles: WikipediaArticle[]; candidates: WikipediaArticle[]; disambiguation: boolean }
  | { status: "notFound" }
  | { status: "failed" };

export type WikipediaFound = Extract<WikipediaResult, { status: "found" }>;

export type AnswerFact = {
  label: string;
  value: string;
};

export type AnswerSection = {
  heading: string;
  sentences: string[];
};

export type AnswerTopic = "時期" | "場所" | "人物" | "方法" | "理由";

export type TagAnswer =
  | { kind: "facts"; facts: AnswerFact[]; description?: string }
  | { kind: "place"; facts: AnswerFact[]; mapUrl?: string; section?: AnswerSection }
  | { kind: "section"; heading: string; sentences: string[]; steps?: { heading: string; sentence: string }[] }
  | { kind: "unreadable"; topic: AnswerTopic };

export type SelectedArticle =
  | { status: "loading"; candidate: WikipediaArticle }
  | { status: "done"; candidate: WikipediaArticle; result: WikipediaFound; answer: TagAnswer | null; summary: string | null }
  | { status: "error"; candidate: WikipediaArticle };

export type MemoSearch =
  | { status: "loading" }
  | { status: "done"; result: WikipediaResult; answer: TagAnswer | null; summary: string | null; selected?: SelectedArticle }
  | { status: "error" };
