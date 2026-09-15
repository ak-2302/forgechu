import "./MemoCard.css";
import MemoTag from "./MemoTag";

const MemoCard = (props: {
  textData: string;
  date: string;
  tags: string[];
}) => {
  return (
    <div className="memo-card">
      <div className="memo-text-row">
        <p className="memo-text">{props.textData}</p>
        <>
          {props.tags.map(tagging => (
            <MemoTag tag={ tagging }></MemoTag>
          ))}
        </>
      </div>
      <p className="memo-date">{props.date}</p>
    </div>
  );
};

export default MemoCard;
