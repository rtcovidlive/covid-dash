import {
  XYPlot,
  XAxis,
  YAxis,
  HorizontalGridLines,
  VerticalGridLines,
  LineSeries,
  MarkSeries,
  Highlight,
} from "react-vis";
import _ from "lodash";
import { useAllRunResultsDev } from "../lib/data";
import { format } from "date-fns";
import { useState } from "react";

function groupByRunDate(data) {
  return _.groupBy(data, (d) => d["run.date"]);
}

export function CountyRtChart(props) {
  const [lastDrawLocation, setLastDrawLocation] = useState(null);

  const { measure, fips, width, height } = props;
  const { data, error } = useAllRunResultsDev(fips);

  const resultsGrouped = data && groupByRunDate(data);

  return (
    <XYPlot
      className="svg-container"
      xDomain={
        lastDrawLocation && [lastDrawLocation.left, lastDrawLocation.right]
      }
      yDomain={
        lastDrawLocation
          ? [lastDrawLocation.bottom, lastDrawLocation.top]
          : [0, 2]
      }
      width={width}
      height={height}
      getX={(d) => new Date(d.date)}
      getY={(d) => d[measure]}
      xType="time"
      style={{
        backgroundColor: "white",
      }}
    >
      <HorizontalGridLines />

      <YAxis />
      <XAxis tickFormat={(d) => format(d, "M/dd")} />

      {_.map(resultsGrouped, (v, k) => (
        <LineSeries data={v} key={k} color="black" opacity={0.1} />
      ))}

      <MarkSeries
        data={_.map(resultsGrouped, (d) => _.maxBy(d, (day) => day.date))}
        color="red"
        size={1}
      />

      <Highlight
        onBrushEnd={(area) => setLastDrawLocation(area)}
        onDrag={(area) => {
          setLastDrawLocation({
            bottom: lastDrawLocation.bottom + (area.top - area.bottom),
            left: lastDrawLocation.left - (area.right - area.left),
            right: lastDrawLocation.right - (area.right - area.left),
            top: lastDrawLocation.top + (area.top - area.bottom),
          });
        }}
      />
    </XYPlot>
  );
}
