import React from "react";

const tooltipRef = React.createRef();
function ChartTooltip(props) {
  return (
    <div
      className="tooltip"
      ref={tooltipRef}
      style={{
        pointerEvents: "none",
        display: "block",
        left: props.leftPosition + "px",
        top: props.topPosition + "px",
        opacity: props.showing ? 1.0 : 0.0,
        minWidth: props.minWidth,
      }}
    >
      <div className="tooltip-content">{props.contents}</div>
      <i></i>
    </div>
  );
}

export default ChartTooltip;
