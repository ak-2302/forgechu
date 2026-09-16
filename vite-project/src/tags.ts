export const TAGS = ["とは", "方法", "なぜ", "いつ", "どこ", "だれ", "ちがい"] as const;

export type Tag = (typeof TAGS)[number];

export const TAG_KEY: Record<Tag, string> = {
  とは: "what",
  方法: "how",
  なぜ: "why",
  いつ: "when",
  どこ: "where",
  だれ: "who",
  ちがい: "which",
};
