import { VisualizationChart } from "./VisualizationChart";
import Constants from "lib/Constants";

export function StateRtChart(props) {
  const primaryColorScale = (i) => {
    return "black";
  };
  var rightPadding;
  var leftPadding = 4;
  switch (props.yAxisPosition) {
    case "right":
      if (props.isOwnPage) {
        leftPadding = 0;
        rightPadding = 20;
      } else {
        leftPadding = 4;
        rightPadding = 30;
      }
      break;
    case "left":
      rightPadding = 4;
      leftPadding = 30;
      break;
    case "none":
      rightPadding = 4;
      break;
    default:
      rightPadding = 4;
      break;
  }
  var bottomPadding;
  if (props.xAxisPosition === "inside") {
    bottomPadding = 0;
  } else {
    bottomPadding = 20;
  }
  return (
    <VisualizationChart
      data={[props.data]}
      enabledModes={[Constants.MetricOptions.DerivedR0]}
      logScale={false}
      indexing={Constants.IndexingOptions.ByDate}
      singleStateView={true}
      highlightXAxisValue={1.0}
      showAnnotations={true}
      forceYDomain={props.yDomain}
      isHovered={props.isHovered}
      colorScales={[primaryColorScale]}
      annotationsFontSize={props.isOwnPage ? 11 : 10}
      drawOuterBorder={props.drawOuterBorder}
      yAxisPosition={props.yAxisPosition}
      xAxisPosition={props.xAxisPosition}
      isUnderlayed={props.isUnderlayed}
      useNewAnnotationStyle={props.isOwnPage}
      width={props.width}
      height={props.height}
      margin={{
        left: leftPadding,
        right: rightPadding,
        top: 0,
        bottom: bottomPadding,
      }}
    />
  );
}
