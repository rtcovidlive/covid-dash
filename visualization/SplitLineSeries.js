import { LineSeries } from "react-vis";
import { useState } from "react";

// `SplitLineSeries` takes exactly the same props as `@d3/react-vis`'s
// LineSeries, and one additional integer, `dashLastNDays`. It returns
// an array of two <LineSeries> components, which represent partition of the
// data to be graphed into a "left" and a "right", where the "right" has
// the last `dashLastNDays + 1` elements. Styling is applied to make
// sure the right-hand <LineSeries> is dashed, or dotted if it's the case that
// the arguments to `SplieLineSeries` specify a dashed line.
//
// Additionally, an `onNearestXY` prop may be passed, along with
// `hintActiveSide` and `setHintActiveSide`. These state variables are meant to
// signal which side ("L" or "R") of the "split" is being hovered over. This
// is neccessary because otherwise the two different `<LineSeries/>` will
// clobber the callback function `onNearestXY` because both `<LineSeries/>`
// will always fire the event regardless of how close the cursor is to their
// actual SVG elements!
export function SplitLineSeries(props) {
  const { key, strokeStyle, data, dashLastNDays, onNearestXY, ...other } =
    props;

  if (!data || !data.length) return [];

  // May be undefined - in that case, `onNearestXY` is never called.
  const hintActiveSide = props.hintActiveSide;
  const setHintActiveSide = props.setHintActiveSide;

  const len = data.length;

  // Split one "line" into two lines, with the right line constituting the
  // final `dashLastNDays` observations of data.
  const dataLeft = data.slice(0, len - dashLastNDays);
  const dataRight = data.slice(len - dashLastNDays - 1);

  // Handle the case when the caller is already using a dashed strokestyle;
  // this is the case for the `<LineSeries/>` which represent results for
  // neighboring states or counties.
  const strokeStyleRight = strokeStyle === "dashed" ? null : "dashed";
  const strokeDasharrayRight = strokeStyle === "dashed" ? "1 1" : null;

  return [
    <LineSeries
      {...other} // Pass in all the other props
      key={key + "-left"}
      data={dataLeft}
      strokeStyle={strokeStyle} // Keep original stroke style
      // Before calling the callback, verify that our side is "active" (being
      // hovered over).
      onNearestXY={(value) =>
        hintActiveSide === "L" && onNearestXY && onNearestXY(value)
      }
      onSeriesMouseOver={(e) =>
        hintActiveSide === "R" && setHintActiveSide("L")
      }
    />,
    <LineSeries
      {...other}
      key={key + "-right"}
      data={dataRight}
      strokeStyle={strokeStyleRight}
      strokeDasharray={strokeDasharrayRight}
      onNearestXY={(value) =>
        hintActiveSide === "R" && onNearestXY && onNearestXY(value)
      }
      onSeriesMouseOver={(e) =>
        hintActiveSide === "L" && setHintActiveSide("R")
      }
    />,
  ];
}
