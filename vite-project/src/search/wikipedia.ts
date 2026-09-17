import type { Tag } from "../tags";
import type { WikipediaArticle, WikipediaResult } from "./types";

type PageQuery = {
  pages: {
    title: string;
    missing?: boolean;
    invalid?: boolean;
    extract?: string;
    description?: string;
    pageprops?: { disambiguation?: string; wikibase_item?: string };
  }[];
};

type SearchQuery = {
  searchinfo?: { suggestion?: string; rewrittenquery?: string };
  search: { title: string; redirecttitle?: string }[];
};

type Term = {
  original: string;
  normalized: string;
};

type PageLookup =
  | { status: "page"; article: WikipediaArticle; disambiguation: boolean }
  | { status: "notFound" }
  | { status: "failed" };

const API_URL = "https://ja.wikipedia.org/w/api.php";
const TIMEOUT_MS = 8000;
const EDGE_SYMBOLS = /^[\s?!.,？！．，。、・…~～〜"'“”‘’「」『』()（）【】]+|[\s?!.,？！．，。、・…~～〜"'“”‘’「」『』()（）【】]+$/g;
const QUESTION_ENDING = /(とは何ですか|とはなんですか|とは何か|とはなにか|とは何|とはなに|って何ですか|ってなんですか|って何|ってなに|ってなん|の違い|のちがい|とは)$/;
const COMPARISON_ENDING = /(の違いは|の違い|の差|って何が違う|は何が違う|はどう違う)$/;
const EXPLICIT_SEPARATOR = /\s*(?<![a-z])vs\.?(?![a-z])\s*|[\s、,，/／]+/i;
const CANDIDATE_LINE = /^(.+?)\s+[-–—]\s+(.+)$/;

const trimSymbols = (value: string) => value.replace(EDGE_SYMBOLS, "");

const cleanOriginal = (text: string) => trimSymbols(trimSymbols(text).replace(QUESTION_ENDING, ""));

const cleanQuery = (text: string) => cleanOriginal(text.normalize("NFKC"));

const stripComparison = (text: string) => trimSymbols(cleanOriginal(text).replace(COMPARISON_ENDING, ""));

const splitComparison = (text: string) => {
  const explicit = EXPLICIT_SEPARATOR.test(text);
  const parts = text
    .split(explicit ? EXPLICIT_SEPARATOR : "と")
    .map(trimSymbols)
    .filter(part => part !== "")
    .slice(0, 2);
  return { parts, explicit };
};

const normalizeForMatch = (value: string) => value.normalize("NFKC").toLowerCase().replace(/[\s・=＝–-]/g, "");

const matches = (query: string, name: string) => {
  const normalizedQuery = normalizeForMatch(query);
  const normalizedName = normalizeForMatch(name);
  return normalizedQuery !== "" && normalizedName !== "" && (normalizedQuery.includes(normalizedName) || normalizedName.includes(normalizedQuery));
};

const articleUrl = (title: string) => `https://ja.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(" ", "_"))}`;

const toCandidate = (title: string): WikipediaArticle => ({ title, extract: "", url: articleUrl(title) });

export const fetchApi = async <T>(apiUrl: string, params: Record<string, string>): Promise<T | null> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${apiUrl}?${new URLSearchParams({ format: "json", formatversion: "2", origin: "*", ...params })}`, {
      headers: { "Api-User-Agent": "GimonNote/0.1 (demo)" },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const data = (await response.json()) as T & { error?: unknown };
    return data.error ? null : data;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

const request = async <T>(params: Record<string, string>): Promise<T | null> => {
  const data = await fetchApi<{ query?: T }>(API_URL, { action: "query", ...params });
  return data?.query ?? null;
};

const fetchPage = async (title: string): Promise<PageLookup> => {
  const query = await request<PageQuery>({
    titles: title,
    redirects: "1",
    prop: "pageprops|extracts|description",
    ppprop: "disambiguation|wikibase_item",
    exintro: "1",
    explaintext: "1",
  });
  if (!query) return { status: "failed" };
  const page = query.pages[0];
  if (!page || page.missing || page.invalid) return { status: "notFound" };
  return {
    status: "page",
    article: {
      title: page.title,
      extract: page.extract ?? "",
      url: articleUrl(page.title),
      description: page.description,
      wikidataId: page.pageprops?.wikibase_item,
    },
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

const fetchDisambiguationCandidates = async (page: WikipediaArticle) => {
  const query = await request<PageQuery>({ titles: page.title, prop: "extracts", explaintext: "1" });
  const candidates: WikipediaArticle[] = [];
  for (const line of (query?.pages[0]?.extract ?? "").split("\n")) {
    const match = CANDIDATE_LINE.exec(line.trim());
    if (!match || match[1] === page.title || candidates.some(candidate => candidate.title === match[1])) continue;
    candidates.push({ ...toCandidate(match[1]), description: match[2] });
  }
  return candidates;
};

const complete = async (lookup: PageLookup, candidates: WikipediaArticle[]): Promise<WikipediaResult> => {
  if (lookup.status !== "page") return lookup;
  if (!lookup.disambiguation) {
    return { status: "found", articles: [lookup.article], candidates, disambiguation: false };
  }
  return { status: "found", articles: [lookup.article], candidates: await fetchDisambiguationCandidates(lookup.article), disambiguation: true };
};

const findExact = async (term: Term) => {
  const exact = await fetchPage(term.original);
  return exact.status === "notFound" && term.original !== term.normalized ? fetchPage(term.normalized) : exact;
};

export const fetchFullExtract = async (title: string) => {
  const query = await request<PageQuery>({ titles: title, prop: "extracts", explaintext: "1", exsectionformat: "wiki" });
  return query?.pages[0]?.extract ?? null;
};

export const fetchArticle = async (title: string) => complete(await fetchPage(title), []);

const resolveTerm = async (term: Term): Promise<WikipediaResult> => {
  const exact = await findExact(term);
  if (exact.status !== "notFound") return complete(exact, []);

  const firstSearch = await searchTitles(term.normalized);
  if (!firstSearch) return { status: "failed" };
  const suggestion = firstSearch.searchinfo?.suggestion;
  const retry = firstSearch.search.length === 0 && suggestion !== undefined;
  const search = retry ? await searchTitles(suggestion) : firstSearch;
  if (!search) return { status: "failed" };

  const queries = [term.normalized, retry ? suggestion : undefined, search.searchinfo?.rewrittenquery].filter(query => query !== undefined);
  const hits = search.search.filter(hit => queries.some(query => matches(query, hit.title) || (hit.redirecttitle !== undefined && matches(query, hit.redirecttitle))));
  if (hits.length === 0) return { status: "notFound" };

  const page = await fetchPage(hits[0].title);
  return complete(page, hits.slice(1, 3).map(hit => toCandidate(hit.title)));
};

const resolveTerms = async (texts: string[]): Promise<WikipediaResult> => {
  const terms = texts
    .map(part => ({ original: cleanOriginal(part), normalized: cleanQuery(part) }))
    .filter(term => term.original !== "" && term.normalized !== "");
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

export const searchWikipedia = async (text: string, tag: Tag | null): Promise<WikipediaResult> => {
  if (tag !== "ちがい") return resolveTerms([text]);

  const whole = stripComparison(text);
  const { parts, explicit } = splitComparison(whole);
  if (parts.length < 2) return resolveTerms([explicit && parts.length === 1 ? parts[0] : whole]);

  const result = await resolveTerms(parts);
  if (explicit || result.status !== "notFound") return result;
  const single = await resolveTerms([whole]);
  return single.status === "found" ? single : result;
};
