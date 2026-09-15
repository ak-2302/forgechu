import "./MemoTag.css"

const MemoTag = (props: {
  tag: string
}) => {
  return (
    <div className="memotag">
        #{props.tag}
    </div>
  );
};

export default MemoTag;
