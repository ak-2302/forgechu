import "./SearchModeToggle.css";

export type SearchMode = "now" | "later";

const SearchModeToggle = (props: { value: SearchMode; onChange: (value: SearchMode) => void }) => (
  <div className="search-mode-toggle" role="group" aria-label="調べるタイミング">
    <button
      className="search-mode-toggle-button"
      type="button"
      aria-label="すぐ調べる"
      aria-pressed={props.value === "now"}
      onPointerDown={event => event.preventDefault()}
      onClick={() => props.onChange("now")}
    >
      すぐ<span className="search-mode-toggle-suffix">調べる</span>
    </button>
    <button
      className="search-mode-toggle-button"
      type="button"
      aria-label="あとで調べる"
      aria-pressed={props.value === "later"}
      onPointerDown={event => event.preventDefault()}
      onClick={() => props.onChange("later")}
    >
      あとで<span className="search-mode-toggle-suffix">調べる</span>
    </button>
  </div>
);

export default SearchModeToggle;
