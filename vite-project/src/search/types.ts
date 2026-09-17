export type WikipediaArticle = {
  title: string;
  extract: string;
  url: string;
};

export type WikipediaResult =
  | { status: "found"; articles: WikipediaArticle[]; candidates: WikipediaArticle[]; disambiguation: boolean }
  | { status: "notFound" }
  | { status: "failed" };

export type MemoSearch =
  | { status: "loading" }
  | { status: "done"; result: WikipediaResult; summary: string | null }
  | { status: "error" };
