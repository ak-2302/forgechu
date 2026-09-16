import "./MemoCard.css";
import MemoTag from "./MemoTag";


const MemoCard = (props: {
  textData: string;
  date: string;
  tags: string[];
  isNewMemo?: boolean;
}) => {
  return (
    <div
      className="memo-card"
      style={{
        color: props.isNewMemo ? "gray" : "black",
        borderStyle: props.isNewMemo ? "dotted" : "solid",
      }}
    >
      <div className="memo-text-row">
        <p className="memo-text">{props.textData}</p>
        <>
          {props.tags.map((tag) => (
            <MemoTag tag={tag}></MemoTag>
          ))}
        </>
      </div>
      <p className="memo-date">{props.date}</p>
    </div>
  );
};

export default MemoCard;
