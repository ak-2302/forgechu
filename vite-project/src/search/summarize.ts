import type { Tag } from "../tags";
import type { TagAnswer, WikipediaResult } from "./types";

type SummarizerOptions = {
  type: "tldr" | "key-points";
  format: "plain-text";
  length: "short";
  expectedInputLanguages: string[];
  outputLanguage: string;
};

declare const Summarizer: {
  availability: (options: SummarizerOptions) => Promise<"available" | "downloading" | "downloadable" | "unavailable">;
  create: (options: SummarizerOptions) => Promise<{
    summarize: (input: string, options?: { context?: string }) => Promise<string>;
    destroy: () => void;
  }>;
};

const KEY_POINT_TAGS: Tag[] = ["方法", "なぜ", "ちがい"];

export const summarize = async (result: WikipediaResult, tag: Tag | null, answer: TagAnswer | null): Promise<string | null> => {
  if (result.status !== "found" || result.disambiguation || !("Summarizer" in globalThis)) return null;
  const section = answer?.kind === "section" ? answer : null;
  if (section?.steps) return null;
  const input = section
    ? section.sentences.join("\n")
    : result.articles.map(article => `${article.title}\n${article.extract}`).join("\n\n");
  const context = section ? `「${result.articles[0].title}」の記事の「${section.heading}」の章から抜き出した文章です。` : undefined;
  const options: SummarizerOptions = {
    type: tag && KEY_POINT_TAGS.includes(tag) ? "key-points" : "tldr",
    format: "plain-text",
    length: "short",
    expectedInputLanguages: ["ja"],
    outputLanguage: "ja",
  };

  try {
    if (await Summarizer.availability(options) !== "available") return null;
    const summarizer = await Summarizer.create(options);
    try {
      return (await summarizer.summarize(input, { context })).trim() || null;
    } finally {
      summarizer.destroy();
    }
  } catch {
    return null;
  }
};
