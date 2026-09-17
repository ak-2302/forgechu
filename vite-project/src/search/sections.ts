export type Section = {
  level: number;
  heading: string;
  text: string;
};

const HEADING = /^(={2,})\s*(.+?)\s*\1$/;
const EXCLUDED_HEADINGS = /脚注|注釈|出典|参考文献|関連項目|外部リンク/;

export const parseSections = (extract: string) => {
  const sections: Section[] = [{ level: 1, heading: "", text: "" }];
  for (const line of extract.split("\n")) {
    const match = HEADING.exec(line.trim());
    if (match) {
      sections.push({ level: match[1].length, heading: match[2], text: "" });
    } else {
      sections[sections.length - 1].text += `${line}\n`;
    }
  }
  return sections.filter(section => !EXCLUDED_HEADINGS.test(section.heading));
};

export const findSection = (sections: Section[], keywords: RegExp) => {
  const index = sections.findIndex(section => section.heading !== "" && keywords.test(section.heading));
  if (index < 0) return null;
  const section = sections[index];
  const end = sections.findIndex((other, otherIndex) => otherIndex > index && other.level <= section.level);
  return { section, children: sections.slice(index + 1, end < 0 ? sections.length : end) };
};

export const splitSentences = (text: string) => text
  .split(/(?<=。)|\n+/)
  .map(sentence => sentence.trim())
  .filter(sentence => sentence !== "");
