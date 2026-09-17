import { findSection, parseSections, splitSentences, type Section } from "./sections";
import type { ComparisonSentence, TagAnswer, WikipediaArticle } from "./types";
import { entityIdsOf, fetchClaimsFor, fetchLabels, quantitiesOf, timesOf, type Claims } from "./wikidata";
import { fetchFullExtract } from "./wikipedia";

type Row = {
  label: string;
  property: string;
  type: "entity" | "time" | "quantity";
};

type Kind = {
  properties: string[];
  rows: Row[];
};

type Candidate = ComparisonSentence & {
  index: number;
  score: number;
};

const COMPARISON_HEADINGS = /違い|比較|相違/;
const RELATED_HEADINGS = /定義|類似/;
const CONTRAST_WORDS = /比べ|比較|違い|異な|区別|対し|一方/;
const CATEGORY_WORDS = /定義|分類|扱い/;
const PREFACE_WORDS = /(以下|次|下記)の(とおり|通り|ような|ように|定義|内容|項目|条件|もの)/;
const PREFACE_ENDINGS = /(となっている|になっている|とおり|通り|である)。$/;
const QUALIFIER = /\s*\(.+\)$/;
const MIN_LENGTH = 10;
const MAX_LENGTH = 150;
const MAX_COMMAS = 5;
const SENTENCE_COUNT = 2;
const SHORT_LENGTH = 100;

const KINDS: Kind[] = [
  {
    properties: ["P106", "P569"],
    rows: [
      { label: "職業", property: "P106", type: "entity" },
      { label: "国籍", property: "P27", type: "entity" },
      { label: "生年", property: "P569", type: "time" },
      { label: "没年", property: "P570", type: "time" },
    ],
  },
  {
    properties: ["P625"],
    rows: [
      { label: "国", property: "P17", type: "entity" },
      { label: "所在地", property: "P131", type: "entity" },
      { label: "人口", property: "P1082", type: "quantity" },
      { label: "設立", property: "P571", type: "time" },
    ],
  },
];

const loadSections = async (article: WikipediaArticle) => {
  const extract = await fetchFullExtract(article.title);
  return extract ? parseSections(extract) : [];
};

const namesOf = (title: string) => [...new Set([title, title.replace(QUALIFIER, "")])].filter(name => name.length > 1);

const scoreOf = (text: string, lead: boolean, related: boolean) =>
  (CONTRAST_WORDS.test(text) ? 3 : 0)
  + (CATEGORY_WORDS.test(text) ? 2 : 0)
  + (related ? 2 : 0)
  + (lead ? 1 : 0)
  - (text.length > MAX_LENGTH ? 2 : 0)
  - ((text.match(/、/g)?.length ?? 0) >= MAX_COMMAS ? 2 : 0)
  - (PREFACE_WORDS.test(text) && PREFACE_ENDINGS.test(text) ? 4 : 0);

const findMentions = (sections: Section[], title: string): ComparisonSentence[] => {
  const names = namesOf(title);
  if (names.length === 0) return [];
  const candidates: Candidate[] = [];
  let path: string[] = [];
  for (const section of sections) {
    path = [...path.slice(0, section.level - 1), section.heading];
    const related = path.some(heading => RELATED_HEADINGS.test(heading));
    for (const text of splitSentences(section.text)) {
      if (!text.endsWith("。") || text.length < MIN_LENGTH || !names.some(name => text.includes(name))) continue;
      if (candidates.some(candidate => candidate.text === text)) continue;
      candidates.push({ heading: section.heading, text, index: candidates.length, score: scoreOf(text, section.heading === "", related) });
    }
  }
  return candidates
    .toSorted((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, SENTENCE_COUNT)
    .map(candidate => ({ heading: candidate.heading, text: candidate.text }));
};

const truncate = (text: string) => text.length > SHORT_LENGTH ? `${text.slice(0, SHORT_LENGTH)}…` : text;

export const shortenSentence = (text: string) => {
  let depth = 0;
  let result = "";
  for (const char of text) {
    if (char === "（" || char === "(") {
      if (depth === 0 && char === "(") result = result.trimEnd();
      depth++;
    } else if (char === "）" || char === ")") {
      depth--;
      if (depth < 0) return truncate(text);
    } else if (depth === 0) {
      result += char;
    }
  }
  return truncate(depth === 0 ? result : text);
};

const comparisonSection = (article: WikipediaArticle, sections: Section[], mentioned: string[]) => {
  const found = findSection(sections, COMPARISON_HEADINGS);
  if (!found) return [];
  const sentences = [found.section, ...found.children]
    .flatMap(section => splitSentences(section.text))
    .slice(0, SENTENCE_COUNT)
    .filter(sentence => !mentioned.includes(sentence));
  return sentences.length > 0 ? [{ article: article.title, heading: found.section.heading, sentences }] : [];
};

const entityIds = (claims: Claims, row: Row) => {
  const ids = entityIdsOf(claims, row.property);
  if (row.property !== "P131") return ids;
  const countries = entityIdsOf(claims, "P17");
  return ids.filter(id => !countries.includes(id));
};

const rawValues = (claims: Claims, row: Row) => {
  if (row.type === "entity") return entityIds(claims, row);
  return row.type === "time" ? timesOf(claims, row.property) : quantitiesOf(claims, row.property);
};

const joinValues = (values: string[]) => values.length > 0 ? values.join("、") : null;

const compareFacts = async (pair: [Claims, Claims]) => {
  const kind = KINDS.find(candidate => pair.every(claims => candidate.properties.some(property => claims[property] !== undefined)));
  if (!kind) return [];
  const rows = kind.rows.map(row => ({ row, values: pair.map(claims => rawValues(claims, row)) }));
  if (!rows.some(({ values }) => values.every(value => value.length > 0))) return [];

  const ids = rows.flatMap(({ row, values }) => row.type === "entity" ? values.flat() : []);
  const labels = ids.length > 0 ? await fetchLabels(ids) : {};
  const facts = rows
    .map(({ row, values }) => ({
      label: row.label,
      values: values.map(value => joinValues(row.type === "entity" ? value.flatMap(id => labels[id] ? [labels[id]] : []) : value)) as [string | null, string | null],
    }))
    .filter(fact => fact.values.some(value => value !== null));
  return facts.some(fact => fact.values.every(value => value !== null)) ? facts : [];
};

export const buildComparison = async (first: WikipediaArticle, second: WikipediaArticle): Promise<TagAnswer> => {
  const ids = [first.wikidataId, second.wikidataId].filter(id => id !== undefined);
  const [firstSections, secondSections, claims] = await Promise.all([loadSections(first), loadSections(second), fetchClaimsFor(ids)]);

  const mentions = [
    { from: first.title, about: second.title, sentences: findMentions(firstSections, second.title) },
    { from: second.title, about: first.title, sentences: findMentions(secondSections, first.title) },
  ].filter(mention => mention.sentences.length > 0);
  const mentioned = mentions.flatMap(mention => mention.sentences.map(sentence => sentence.text));
  const sections = [...comparisonSection(first, firstSections, mentioned), ...comparisonSection(second, secondSections, mentioned)];

  const firstClaims = first.wikidataId ? claims[first.wikidataId] : undefined;
  const secondClaims = second.wikidataId ? claims[second.wikidataId] : undefined;
  const facts = firstClaims && secondClaims ? await compareFacts([firstClaims, secondClaims]) : [];

  if (mentions.length === 0 && sections.length === 0 && facts.length === 0) return { kind: "unreadable", topic: "違い" };
  return { kind: "comparison", titles: [first.title, second.title], mentions, sections, facts };
};
