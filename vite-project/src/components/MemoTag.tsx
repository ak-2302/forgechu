import "./MemoTag.css"

const MemoTag = (props: {
  tag: string
}) => {
  return (
    <div className="memotag" data-question-tag={props.tag}>
        #{props.tag}
    </div>
  );
};

export default MemoTag;
