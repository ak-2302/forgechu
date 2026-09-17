import { fetchApi } from "./wikipedia";

type DataValue =
  | { type: "wikibase-entityid"; value: { id: string } }
  | { type: "time"; value: { time: string; precision: number } }
  | { type: "globecoordinate"; value: { latitude: number; longitude: number } };

type Statement = {
  rank: "preferred" | "normal" | "deprecated";
  mainsnak: { snaktype: "value" | "somevalue" | "novalue"; datavalue?: DataValue };
  qualifiers?: Record<string, unknown[]>;
};

export type Claims = Record<string, Statement[]>;

type EntitiesResponse = {
  entities?: Record<string, { claims?: Claims; labels?: Record<string, { value: string }> }>;
};

const API_URL = "https://www.wikidata.org/w/api.php";
const MAX_IDS = 50;
const TIME_PATTERN = /^([+-])(\d+)-(\d{2})-(\d{2})/;

export const fetchClaims = async (id: string) => {
  const data = await fetchApi<EntitiesResponse>(API_URL, { action: "wbgetentities", ids: id, props: "claims", languages: "ja" });
  return data?.entities?.[id]?.claims ?? null;
};

export const fetchLabels = async (ids: string[]): Promise<Record<string, string>> => {
  const unique = [...new Set(ids)].slice(0, MAX_IDS);
  if (unique.length === 0) return {};
  const data = await fetchApi<EntitiesResponse>(API_URL, { action: "wbgetentities", ids: unique.join("|"), props: "labels", languages: "ja" });
  return Object.fromEntries(
    Object.entries(data?.entities ?? {}).flatMap(([id, entity]) => entity.labels?.ja ? [[id, entity.labels.ja.value]] : []),
  );
};

const bestStatements = (claims: Claims, property: string) => {
  const statements = (claims[property] ?? []).filter(statement => statement.rank !== "deprecated");
  const preferred = statements.filter(statement => statement.rank === "preferred");
  return preferred.length > 0 ? preferred : statements.filter(statement => !statement.qualifiers?.P582);
};

const valuesOf = (claims: Claims, property: string) => bestStatements(claims, property).flatMap(statement =>
  statement.mainsnak.snaktype === "value" && statement.mainsnak.datavalue ? [statement.mainsnak.datavalue] : [],
);

const formatTime = (time: string, precision: number) => {
  const match = TIME_PATTERN.exec(time);
  if (!match) return null;
  const era = match[1] === "-" ? "紀元前" : "";
  const year = Number(match[2]);
  const month = Number(match[3]);
  const day = Number(match[4]);
  if (precision >= 11 && month > 0 && day > 0) return `${era}${year}年${month}月${day}日`;
  if (precision >= 10 && month > 0) return `${era}${year}年${month}月`;
  if (precision >= 9) return `${era}${year}年`;
  if (precision === 8) return `${era}${Math.floor(year / 10) * 10}年代`;
  return `${era}${year}年頃`;
};

export const entityIdsOf = (claims: Claims, property: string) => valuesOf(claims, property).flatMap(value =>
  value.type === "wikibase-entityid" ? [value.value.id] : [],
);

export const timesOf = (claims: Claims, property: string) => valuesOf(claims, property).flatMap(value => {
  if (value.type !== "time") return [];
  const text = formatTime(value.value.time, value.value.precision);
  return text ? [text] : [];
});

export const coordinateOf = (claims: Claims) => valuesOf(claims, "P625").flatMap(value =>
  value.type === "globecoordinate" ? [value.value] : [],
)[0] ?? null;

export const isUnknown = (claims: Claims, property: string) => bestStatements(claims, property).some(statement =>
  statement.mainsnak.snaktype === "somevalue",
);
