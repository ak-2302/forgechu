import "./MemoTag.css"

import { tagColors } from "../utils/tag";
const MemoTag = (props: {
  tag: string
}) => {
  return (
    <div className="memotag" style={{ backgroundColor: tagColors[props.tag] || "#D3D3D3" }}>
        #{props.tag}
    </div>
  );
};

export default MemoTag;
