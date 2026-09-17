export type WikipediaArticle = {
  title: string;
  extract: string;
  url: string;
  description?: string;
};

export type WikipediaResult =
  | { status: "found"; articles: WikipediaArticle[]; candidates: WikipediaArticle[]; disambiguation: boolean }
  | { status: "notFound" }
  | { status: "failed" };

export type WikipediaFound = Extract<WikipediaResult, { status: "found" }>;

export type SelectedArticle =
  | { status: "loading"; candidate: WikipediaArticle }
  | { status: "done"; candidate: WikipediaArticle; result: WikipediaFound; summary: string | null }
  | { status: "error"; candidate: WikipediaArticle };

export type MemoSearch =
  | { status: "loading" }
  | { status: "done"; result: WikipediaResult; summary: string | null; selected?: SelectedArticle }
  | { status: "error" };
