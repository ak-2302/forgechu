import "./MemoTag.css"
import { TAG_KEY, type Tag } from "../tags"

const MemoTag = (props: {
  tag: Tag
}) => {
  return (
    <div className="memotag" data-tag={TAG_KEY[props.tag]}>
        #{props.tag}
    </div>
  );
};

export default MemoTag;
