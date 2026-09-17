import type { Tag } from "../tags";
import { buildComparison } from "./compare";
import { findSection, parseSections, splitSentences, type Section } from "./sections";
import type { AnswerFact, AnswerSection, TagAnswer, WikipediaArticle, WikipediaResult } from "./types";
import { coordinateOf, entityIdsOf, fetchClaims, fetchLabels, isUnknown, timesOf, type Claims } from "./wikidata";
import { fetchFullExtract } from "./wikipedia";

const DATE_PROPERTIES = [
  ["P571", "設立・成立"],
  ["P580", "開始"],
  ["P577", "公開"],
  ["P585", "時点"],
  ["P575", "発見・発明"],
  ["P569", "生年"],
  ["P570", "没年"],
] as const;

const HISTORY_HEADINGS = /歴史|沿革|背景/;
const PLACE_HEADINGS = /地理|所在地|位置/;
const METHOD_HEADINGS = /製法|方法|手順|作り方/;
const REASON_HEADINGS = /理由|原因|背景/;
const YEAR = /\d{1,4}年|世紀|明治|大正|昭和|平成|令和/;

const loadClaims = (article: WikipediaArticle) => article.wikidataId ? fetchClaims(article.wikidataId) : Promise.resolve(null);

const loadSections = async (article: WikipediaArticle) => {
  const extract = await fetchFullExtract(article.title);
  return extract ? parseSections(extract) : [];
};

const labelFacts = (label: string, ids: string[], labels: Record<string, string>): AnswerFact[] => {
  const names = ids.flatMap(id => labels[id] ? [labels[id]] : []);
  return names.length > 0 ? [{ label, value: names.join("、") }] : [];
};

const dateFacts = (claims: Claims, property: string, label: string, allowUnknown: boolean): AnswerFact[] => {
  const times = timesOf(claims, property);
  if (times.length > 0) return [{ label, value: times.join("、") }];
  return allowUnknown && isUnknown(claims, property) ? [{ label, value: "不明" }] : [];
};

const sectionSentences = (sections: Section[], keywords: RegExp, count: number, filter: (sentence: string) => boolean = () => true): AnswerSection | null => {
  const found = findSection(sections, keywords);
  if (!found) return null;
  const sentences = [found.section, ...found.children]
    .flatMap(section => splitSentences(section.text))
    .filter(filter)
    .slice(0, count);
  return sentences.length > 0 ? { heading: found.section.heading, sentences } : null;
};

const answerWhen = async (article: WikipediaArticle): Promise<TagAnswer> => {
  const claims = await loadClaims(article);
  const facts = claims ? DATE_PROPERTIES.flatMap(([property, label]) => dateFacts(claims, property, label, false)) : [];
  if (facts.length > 0) return { kind: "facts", facts };
  const section = sectionSentences(await loadSections(article), HISTORY_HEADINGS, 2, sentence => YEAR.test(sentence));
  return section ? { kind: "section", ...section } : { kind: "unreadable", topic: "時期" };
};

const answerWhere = async (article: WikipediaArticle): Promise<TagAnswer> => {
  const [claims, sections] = await Promise.all([loadClaims(article), loadSections(article)]);
  const countries = claims ? entityIdsOf(claims, "P17") : [];
  const locations = claims ? entityIdsOf(claims, "P131").filter(id => !countries.includes(id)) : [];
  const labels = await fetchLabels([...countries, ...locations]);
  const facts = [...labelFacts("国", countries, labels), ...labelFacts("所在地", locations, labels)];
  const coordinate = claims ? coordinateOf(claims) : null;
  const mapUrl = coordinate
    ? `https://www.openstreetmap.org/?mlat=${coordinate.latitude}&mlon=${coordinate.longitude}#map=12/${coordinate.latitude}/${coordinate.longitude}`
    : undefined;
  const section = sectionSentences(sections, PLACE_HEADINGS, 1) ?? undefined;
  if (facts.length === 0 && !mapUrl && !section) return { kind: "unreadable", topic: "場所" };
  return { kind: "place", facts, mapUrl, section };
};

const answerWho = async (article: WikipediaArticle): Promise<TagAnswer> => {
  const claims = await loadClaims(article);
  if (!claims) return { kind: "unreadable", topic: "人物" };
  const occupations = entityIdsOf(claims, "P106");
  const nationalities = entityIdsOf(claims, "P27");
  const labels = await fetchLabels([...occupations, ...nationalities]);
  const facts = [
    ...labelFacts("職業", occupations, labels),
    ...labelFacts("国籍", nationalities, labels),
    ...dateFacts(claims, "P569", "生年", true),
    ...dateFacts(claims, "P570", "没年", true),
  ];
  return facts.length > 0 ? { kind: "facts", facts } : { kind: "unreadable", topic: "人物" };
};

const answerHow = async (article: WikipediaArticle): Promise<TagAnswer> => {
  const found = findSection(await loadSections(article), METHOD_HEADINGS);
  if (!found) return { kind: "unreadable", topic: "方法" };
  const steps = found.children
    .filter(child => child.level === found.section.level + 1)
    .flatMap(child => {
      const sentence = splitSentences(child.text)[0];
      return sentence ? [{ heading: child.heading, sentence }] : [];
    });
  if (steps.length > 0) return { kind: "section", heading: found.section.heading, sentences: [], steps };
  const sentences = splitSentences(found.section.text).slice(0, 2);
  return sentences.length > 0 ? { kind: "section", heading: found.section.heading, sentences } : { kind: "unreadable", topic: "方法" };
};

const answerWhy = async (article: WikipediaArticle): Promise<TagAnswer> => {
  const section = sectionSentences(await loadSections(article), REASON_HEADINGS, 2);
  return section ? { kind: "section", ...section } : { kind: "unreadable", topic: "理由" };
};

const buildAnswer = (article: WikipediaArticle, tag: Tag | null): Promise<TagAnswer | null> => {
  switch (tag) {
    case "とは":
      return Promise.resolve(article.description ? { kind: "facts", facts: [], description: article.description } : null);
    case "いつ":
      return answerWhen(article);
    case "どこ":
      return answerWhere(article);
    case "だれ":
      return answerWho(article);
    case "方法":
      return answerHow(article);
    case "なぜ":
      return answerWhy(article);
    default:
      return Promise.resolve(null);
  }
};

export const answerFor = async (result: WikipediaResult, tag: Tag | null) => {
  if (result.status !== "found" || result.disambiguation) return null;
  try {
    if (tag === "ちがい" && result.articles.length === 2) {
      const [first, second] = result.articles;
      return first.title === second.title ? null : await buildComparison(first, second);
    }
    if (result.articles.length !== 1) return null;
    return await buildAnswer(result.articles[0], tag);
  } catch {
    return null;
  }
};
