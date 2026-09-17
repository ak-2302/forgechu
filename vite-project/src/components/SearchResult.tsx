import { useId, useRef, useState } from "react";
import type { AnswerFact, MemoSearch, SelectedArticle, TagAnswer, WikipediaArticle, WikipediaFound } from "../search/types";
import "./SearchResult.css";

type SearchResultProps = {
  search: MemoSearch;
  onSelectCandidate?: (candidate: WikipediaArticle) => void;
  onBackToCandidates?: () => void;
};

const EXCERPT_LENGTH = 120;

const excerpt = (text: string) => text.length > EXCERPT_LENGTH ? `${text.slice(0, EXCERPT_LENGTH)}…` : text;

const CandidateList = (props: { candidates: WikipediaArticle[]; onSelect: (candidate: WikipediaArticle) => void }) => (
  <ul className="search-result-list">
    {props.candidates.map((candidate, index) => (
      <li key={`${index}-${candidate.url}`}>
        <button className="search-result-candidate" type="button" onClick={() => props.onSelect(candidate)}>
          <span className="search-result-candidate-title">{candidate.title}</span>
          {candidate.description && <span className="search-result-candidate-description">{candidate.description}</span>}
        </button>
      </li>
    ))}
  </ul>
);

const Source = (props: { articles: WikipediaArticle[] }) => (
  <p className="search-result-source">
    Wikipedia
    {props.articles.map((article, index) => (
      <a key={`${index}-${article.url}`} href={article.url} target="_blank" rel="noopener noreferrer">「{article.title}」</a>
    ))}
    より
    {props.articles.length === 1 && (
      <a className="search-result-more" href={props.articles[0].url} target="_blank" rel="noopener noreferrer">続きを読む</a>
    )}
  </p>
);

const FactList = (props: { facts: AnswerFact[] }) => (
  <dl className="search-result-facts">
    {props.facts.map(fact => (
      <div key={fact.label} className="search-result-fact">
        <dt>{fact.label}</dt>
        <dd>{fact.value}</dd>
      </div>
    ))}
  </dl>
);

const Answer = (props: { answer: TagAnswer; summary: string | null }) => {
  const { answer } = props;

  if (answer.kind === "unreadable") {
    return <p className="search-result-status search-result-answer">この記事から{answer.topic}は読み取れませんでした。</p>;
  }

  if (answer.kind === "section") {
    return (
      <div className="search-result-answer">
        <p className="search-result-label">「{answer.heading}」の章より</p>
        {answer.steps ? (
          <ol className="search-result-steps">
            {answer.steps.map((step, index) => (
              <li key={`${index}-${step.heading}`}>
                <span className="search-result-step-heading">{step.heading}</span>：{step.sentence}
              </li>
            ))}
          </ol>
        ) : (
          <p className="search-result-summary">{props.summary ?? answer.sentences.join("\n")}</p>
        )}
      </div>
    );
  }

  if (answer.kind === "place") {
    return (
      <div className="search-result-answer">
        {answer.facts.length > 0 && <FactList facts={answer.facts} />}
        {answer.mapUrl && (
          <p>
            <a href={answer.mapUrl} target="_blank" rel="noopener noreferrer">地図で見る（OpenStreetMap）</a>
          </p>
        )}
        {answer.section && (
          <>
            <p className="search-result-label">「{answer.section.heading}」の章より</p>
            <p className="search-result-summary">{answer.section.sentences.join("\n")}</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="search-result-answer">
      {answer.description && <p className="search-result-description">{answer.description}</p>}
      {answer.facts.length > 0 && <FactList facts={answer.facts} />}
    </div>
  );
};

const FoundView = (props: { result: WikipediaFound; answer: TagAnswer | null; summary: string | null; onSelect: (candidate: WikipediaArticle) => void }) => {
  const { articles, candidates, disambiguation } = props.result;

  if (disambiguation) {
    return (
      <>
        <p className="search-result-status">{candidates.length > 0 ? "いくつかの意味があります。" : "候補を読み取れませんでした。"}</p>
        {candidates.length > 0 && <CandidateList candidates={candidates} onSelect={props.onSelect} />}
        <Source articles={articles} />
      </>
    );
  }

  const fallback = articles.length > 1
    ? articles.map(article => `${article.title}：${excerpt(article.extract)}`).join("\n")
    : excerpt(articles[0].extract);

  const introSummary = props.answer?.kind === "section" ? null : props.summary;

  return (
    <>
      {props.answer && <Answer answer={props.answer} summary={props.summary} />}
      {props.answer && props.answer.kind !== "unreadable" && <p className="search-result-label">記事の冒頭</p>}
      <p className="search-result-summary">{introSummary ?? fallback}</p>
      <Source articles={articles} />
      {candidates.length > 0 && (
        <>
          <p className="search-result-label">他の候補</p>
          <CandidateList candidates={candidates} onSelect={props.onSelect} />
        </>
      )}
    </>
  );
};

const SelectedView = (props: { selected: SelectedArticle; onSelect: (candidate: WikipediaArticle) => void; onBack: () => void }) => {
  const { candidate } = props.selected;

  return (
    <>
      <button className="search-result-back" type="button" onClick={props.onBack}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5" />
          <path d="m12 19-7-7 7-7" />
        </svg>
        候補一覧に戻る
      </button>
      {props.selected.status === "loading" && <p className="search-result-status">「{candidate.title}」を読み込んでいます…</p>}
      {props.selected.status === "error" && (
        <>
          <p className="search-result-status">「{candidate.title}」の記事を取得できませんでした。</p>
          <p className="search-result-source">
            <a href={candidate.url} target="_blank" rel="noopener noreferrer">Wikipediaで「{candidate.title}」を開く</a>
          </p>
        </>
      )}
      {props.selected.status === "done" && <FoundView result={props.selected.result} answer={props.selected.answer} summary={props.selected.summary} onSelect={props.onSelect} />}
    </>
  );
};

const SearchResultBody = (props: { search: MemoSearch; onSelect: (candidate: WikipediaArticle) => void; onBack: () => void }) => {
  if (props.search.status === "loading") {
    return <p className="search-result-status">調べています…</p>;
  }
  if (props.search.status === "error" || props.search.result.status !== "found") {
    return <p className="search-result-status">適切な検索結果が見つかりませんでした。検索ボタンから検索してください。</p>;
  }
  if (props.search.selected) {
    return <SelectedView selected={props.search.selected} onSelect={props.onSelect} onBack={props.onBack} />;
  }
  return <FoundView result={props.search.result} answer={props.search.answer} summary={props.search.summary} onSelect={props.onSelect} />;
};

const SearchResult = (props: SearchResultProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const bodyId = useId();
  const bodyRef = useRef<HTMLDivElement>(null);

  const selectCandidate = (candidate: WikipediaArticle) => {
    props.onSelectCandidate?.(candidate);
    bodyRef.current?.focus();
  };

  const backToCandidates = () => {
    props.onBackToCandidates?.();
    bodyRef.current?.focus();
  };

  return (
    <div className="search-result">
      <button
        className="search-result-toggle"
        type="button"
        aria-expanded={isOpen}
        aria-controls={bodyId}
        onClick={() => setIsOpen(current => !current)}
      >
        <svg className="search-result-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
        すぐに調べた結果
      </button>
      <div className="search-result-body" id={bodyId} ref={bodyRef} tabIndex={-1} hidden={!isOpen} aria-live="polite">
        <SearchResultBody search={props.search} onSelect={selectCandidate} onBack={backToCandidates} />
      </div>
    </div>
  );
};

export default SearchResult;
