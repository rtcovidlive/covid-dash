import { LineSeries } from "react-vis";

// `SplitLineSeries` takes exactly the same props as `@d3/react-vis`'s
// LineSeries, and one additional integer, `dashLastNDays`. It returns
// an array of two <LineSeries> components, which represent partition of the
// data to be graphed into a "left" and a "right", where the "right" has
// the last `dashLastNDays + 1` elements. Styling is applied to make
// sure the right-hand <LineSeries> is dashed, or dotted if it's the case that
// the arguments to `SplieLineSeries` specify a dashed line.
export function SplitLineSeries(props) {
  const { key, strokeStyle, data, dashLastNDays, ...other } = props;

  if (!data || !data.length) return [];

  const len = data.length;

  const dataLeft = data.slice(0, len - dashLastNDays);
  const dataRight = data.slice(len - dashLastNDays - 1);

  const strokeStyleRight = strokeStyle === "dashed" ? null : "dashed";
  const strokeDasharrayRight = strokeStyle === "dashed" ? "1 1" : null;

  return [
    <LineSeries
      {...other} // Pass in all the other props
      key={key + "-left"}
      data={dataLeft}
      strokeStyle={strokeStyle} // Keep original stroke style
    />,
    <LineSeries
      {...other}
      key={key + "-right"}
      data={dataRight}
      strokeStyle={strokeStyleRight}
      strokeDasharray={strokeDasharrayRight}
    />,
  ];
}
