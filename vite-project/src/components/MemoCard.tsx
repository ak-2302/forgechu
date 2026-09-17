import type { MemoSearch, WikipediaArticle } from "../search/types";
import type { Tag } from "../tags";
import "./MemoCard.css";
import MemoOption from "./MemoOption";
import MemoTag from "./MemoTag";
import SearchResult from "./SearchResult";

const MemoCard = (props: {
  textData: string;
  date: string;
  tags: Tag[];
  onEdit?: () => void;
  search?: MemoSearch;
  onSelectCandidate?: (candidate: WikipediaArticle) => void;
  onBackToCandidates?: () => void;
  onDelete?: () => void;
}) => {
  const searchQuery = [props.textData.trim(), ...props.tags].filter(Boolean).join(' ');
  const searchUrl = `https://www.google.com/search?${new URLSearchParams({ q: searchQuery })}`;

  return (
    <div className="memo-card">
      <a
        className="memo-search-button"
        href={searchUrl}
        target="_blank"
        rel="noopener noreferrer external"
        aria-label={`${searchQuery}をGoogleで検索（別画面で開きます）`}
        title="Googleで検索"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m16 16 5 5" />
        </svg>
      </a>
      <MemoOption onEdit={props.onEdit} onDelete={props.onDelete} />
      <div className="memo-text-row">
        <p className="memo-text">{props.textData}</p>
        <>
          {props.tags.map(tagging => (
            <MemoTag key={tagging} tag={tagging}></MemoTag>
          ))}
        </>
      </div>
      <p className="memo-date">{props.date}</p>
      {props.search && <SearchResult search={props.search} onSelectCandidate={props.onSelectCandidate} onBackToCandidates={props.onBackToCandidates} />}
    </div>
  );
};

export default MemoCard;
