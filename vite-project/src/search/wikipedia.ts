import type { Tag } from "../tags";
import type { WikipediaArticle, WikipediaResult } from "./types";

type PageQuery = {
  pages: {
    title: string;
    missing?: boolean;
    invalid?: boolean;
    extract?: string;
    pageprops?: { disambiguation?: string };
  }[];
};

type SearchQuery = {
  searchinfo?: { suggestion?: string; rewrittenquery?: string };
  search: { title: string; redirecttitle?: string }[];
};

type PageLookup =
  | { status: "page"; article: WikipediaArticle; disambiguation: boolean }
  | { status: "notFound" }
  | { status: "failed" };

const API_URL = "https://ja.wikipedia.org/w/api.php";
const TIMEOUT_MS = 8000;
const EDGE_SYMBOLS = /^[\s?!.,。、・…~〜"'“”‘’「」『』()【】]+|[\s?!.,。、・…~〜"'“”‘’「」『』()【】]+$/g;
const QUESTION_ENDING = /(とは何ですか|とはなんですか|とは何か|とはなにか|とは何|とはなに|って何ですか|ってなんですか|って何|ってなに|ってなん|の違い|のちがい|とは)$/;

const trimSymbols = (value: string) => value.replace(EDGE_SYMBOLS, "");

const cleanQuery = (text: string) => trimSymbols(trimSymbols(text.normalize("NFKC")).replace(QUESTION_ENDING, ""));

const normalizeForMatch = (value: string) => value.normalize("NFKC").toLowerCase().replace(/[\s・=＝–-]/g, "");

const matches = (query: string, name: string) => {
  const normalizedQuery = normalizeForMatch(query);
  const normalizedName = normalizeForMatch(name);
  return normalizedQuery !== "" && normalizedName !== "" && (normalizedQuery.includes(normalizedName) || normalizedName.includes(normalizedQuery));
};

const articleUrl = (title: string) => `https://ja.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(" ", "_"))}`;

const toCandidate = (title: string): WikipediaArticle => ({ title, extract: "", url: articleUrl(title) });

const request = async <T>(params: Record<string, string>): Promise<T | null> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${API_URL}?${new URLSearchParams({ action: "query", format: "json", formatversion: "2", origin: "*", ...params })}`, {
      headers: { "Api-User-Agent": "GimonNote/0.1 (demo)" },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { query?: T; error?: unknown };
    return data.error || !data.query ? null : data.query;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

const fetchPage = async (title: string): Promise<PageLookup> => {
  const query = await request<PageQuery>({
    titles: title,
    redirects: "1",
    prop: "pageprops|extracts",
    ppprop: "disambiguation",
    exintro: "1",
    explaintext: "1",
  });
  if (!query) return { status: "failed" };
  const page = query.pages[0];
  if (!page || page.missing || page.invalid) return { status: "notFound" };
  return {
    status: "page",
    article: { title: page.title, extract: page.extract ?? "", url: articleUrl(page.title) },
    disambiguation: page.pageprops?.disambiguation !== undefined,
  };
};

const searchTitles = (query: string) => request<SearchQuery>({
  list: "search",
  srsearch: query,
  srlimit: "3",
  srprop: "redirecttitle",
  srinfo: "suggestion|rewrittenquery",
  srenablerewrites: "1",
});

const complete = async (term: string, lookup: PageLookup, candidates: WikipediaArticle[]): Promise<WikipediaResult> => {
  if (lookup.status !== "page") return lookup;
  if (!lookup.disambiguation) {
    return { status: "found", articles: [lookup.article], candidates, disambiguation: false };
  }
  const search = await searchTitles(term);
  const others = (search?.search ?? [])
    .filter(hit => hit.title !== lookup.article.title)
    .slice(0, 3)
    .map(hit => toCandidate(hit.title));
  return { status: "found", articles: [lookup.article], candidates: others, disambiguation: true };
};

const resolveTerm = async (term: string): Promise<WikipediaResult> => {
  const exact = await fetchPage(term);
  if (exact.status !== "notFound") return complete(term, exact, []);

  const firstSearch = await searchTitles(term);
  if (!firstSearch) return { status: "failed" };
  const suggestion = firstSearch.searchinfo?.suggestion;
  const retry = firstSearch.search.length === 0 && suggestion !== undefined;
  const search = retry ? await searchTitles(suggestion) : firstSearch;
  if (!search) return { status: "failed" };

  const queries = [term, retry ? suggestion : undefined, search.searchinfo?.rewrittenquery].filter(query => query !== undefined);
  const hits = search.search.filter(hit => queries.some(query => matches(query, hit.title) || (hit.redirecttitle !== undefined && matches(query, hit.redirecttitle))));
  if (hits.length === 0) return { status: "notFound" };

  const page = await fetchPage(hits[0].title);
  return complete(term, page, hits.slice(1, 3).map(hit => toCandidate(hit.title)));
};

export const searchWikipedia = async (text: string, tag: Tag | null): Promise<WikipediaResult> => {
  const query = cleanQuery(text);
  const terms = (tag === "ちがい" ? query.split(/と|vs|・/i) : [query])
    .map(trimSymbols)
    .filter(term => term !== "");
  if (terms.length === 0) return { status: "notFound" };

  const results = await Promise.all(terms.map(resolveTerm));
  if (results.some(result => result.status === "failed")) return { status: "failed" };
  const found = results.filter(result => result.status === "found");
  if (found.length < results.length) return { status: "notFound" };

  return {
    status: "found",
    articles: found.flatMap(result => result.articles),
    candidates: found.flatMap(result => result.candidates),
    disambiguation: found.some(result => result.disambiguation),
  };
};
