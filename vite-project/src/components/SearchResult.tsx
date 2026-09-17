import { useId, useState } from "react";
import type { MemoSearch, WikipediaArticle } from "../search/types";
import "./SearchResult.css";

const EXCERPT_LENGTH = 120;

const excerpt = (text: string) => text.length > EXCERPT_LENGTH ? `${text.slice(0, EXCERPT_LENGTH)}…` : text;

const ArticleLinks = (props: { articles: WikipediaArticle[] }) => (
  <ul className="search-result-list">
    {props.articles.map((article, index) => (
      <li key={`${index}-${article.url}`}>
        <a href={article.url} target="_blank" rel="noopener noreferrer">{article.title}</a>
      </li>
    ))}
  </ul>
);

const SearchResultBody = (props: { search: MemoSearch }) => {
  if (props.search.status === "loading") {
    return <p className="search-result-status">調べています…</p>;
  }
  if (props.search.status === "error" || props.search.result.status !== "found") {
    return <p className="search-result-status">適切な検索結果が見つかりませんでした。検索ボタンから検索してください。</p>;
  }

  const { articles, candidates, disambiguation } = props.search.result;

  if (disambiguation) {
    return (
      <>
        <p className="search-result-status">いくつかの意味があります。</p>
        <ArticleLinks articles={[...articles, ...candidates]} />
      </>
    );
  }

  const fallback = articles.length > 1
    ? articles.map(article => `${article.title}：${excerpt(article.extract)}`).join("\n")
    : excerpt(articles[0].extract);

  return (
    <>
      <p className="search-result-summary">{props.search.summary ?? fallback}</p>
      <p className="search-result-source">
        Wikipedia
        {articles.map((article, index) => (
          <a key={`${index}-${article.url}`} href={article.url} target="_blank" rel="noopener noreferrer">「{article.title}」</a>
        ))}
        より
      </p>
      {candidates.length > 0 && (
        <>
          <p className="search-result-label">他の候補</p>
          <ArticleLinks articles={candidates} />
        </>
      )}
    </>
  );
};

const SearchResult = (props: { search: MemoSearch }) => {
  const [isOpen, setIsOpen] = useState(true);
  const bodyId = useId();

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
      <div className="search-result-body" id={bodyId} hidden={!isOpen} aria-live="polite">
        <SearchResultBody search={props.search} />
      </div>
    </div>
  );
};

export default SearchResult;
