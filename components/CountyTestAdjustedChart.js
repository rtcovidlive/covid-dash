import {
  XYPlot,
  XAxis,
  YAxis,
  HorizontalGridLines,
  VerticalGridLines,
  LineSeries,
  MarkSeries,
  VerticalBarSeries,
  Highlight,
} from "react-vis";
import _ from "lodash";
import { useCountyResults, useInputData } from "../lib/data";
import { format } from "date-fns";
import { useState } from "react";

function groupByRunDate(data) {
  return _.groupBy(data, (d) => d["run.date"]);
}

export function CountyTestAdjustedChart(props) {
  const [lastDrawLocation, setLastDrawLocation] = useState(null);

  const { fips, width, height } = props;
  const { data, error } = useCountyResults(fips);
  const { data: inputData, error: inputError } = useInputData(fips);

  const resultsGrouped = data && groupByRunDate(data);

  const selectMeasure = (results, measure) => {
    return _.map(results, (r) => ({ date: r.date, y: r[measure] }));
  };

  return (
    <XYPlot
      className="svg-container"
      width={width}
      height={height}
      getX={(d) => new Date(d.date).getTime()}
      getY={(d) => d.y}
      xType="time"
      style={{
        backgroundColor: "white",
        marginLeft: "-30px",
      }}
    >
      <HorizontalGridLines tickTotal={3} />

      <YAxis tickTotal={3} style={{ line: { opacity: 0 } }} />
      <XAxis
        tickSize={0}
        tickFormat={(d) => format(d, "M/d")}
        style={{ line: { stroke: "black", strokeWidth: 1 } }}
      />

      {_.map(resultsGrouped, (v, k) => (
        <LineSeries
          data={selectMeasure(v, "infections")}
          key={k}
          color={"rgba(0, 145, 255, 1)"}
          opacity={0.1}
        />
      ))}

      {_.map(resultsGrouped, (v, k) => (
        <LineSeries
          data={selectMeasure(v, "cases.fitted")}
          key={k}
          color={"rgba(50, 50, 0, 1"}
          opacity={0.1}
        />
      ))}

      {inputData && (
        <VerticalBarSeries
          data={selectMeasure(inputData, "cases")}
          key={"casebars"}
          color={"rgba(50, 50, 0, 0)"}
          fill={"rgba(50, 50, 0, 0.1)"}
          opacity={1}
          barWidth={0.85}
        />
      )}

      {/*<MarkSeries
        data={_.map(resultsGrouped, (d) => _.maxBy(d, (day) => day.date))}
        color={"black"}
        size={1}
      />*/}
    </XYPlot>
  );
}
