import type { Tag } from "../tags";
import "./MemoCard.css";
import MemoOption from "./MemoOption";
import MemoTag from "./MemoTag";

const MemoCard = (props: {
  textData: string;
  date: string;
  tags: Tag[];
  onDelete?: () => void;
}) => {
  return (
    <div className="memo-card">
      <MemoOption onDelete={props.onDelete} />
      <div className="memo-text-row">
        <p className="memo-text">{props.textData}</p>
        <>
          {props.tags.map(tagging => (
            <MemoTag key={tagging} tag={tagging}></MemoTag>
          ))}
        </>
      </div>
      <p className="memo-date">{props.date}</p>
    </div>
  );
};

export default MemoCard;
