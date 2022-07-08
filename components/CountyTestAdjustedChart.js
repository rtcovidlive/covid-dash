import {
  XYPlot,
  XAxis,
  YAxis,
  HorizontalGridLines,
  VerticalBarSeries,
} from "react-vis";
import { SplitLineSeries } from "../visualization/SplitLineSeries.js";
import _ from "lodash";
import { useLatestRun, useHistoricalRuns } from "../lib/data";
import { format } from "date-fns";
import { format as d3format } from "d3-format";
import { useState } from "react";

function groupByRunDate(data) {
  return _.groupBy(data, (d) => d["run.date"]);
}

export function CountyTestAdjustedChart(props) {
  const [lastDrawLocation, setLastDrawLocation] = useState(null);

  const { fips, width, height, showHistory } = props;
  const { data, error } = useCountyResults(fips);
  const { data: inputData, error: inputError } = useInputData(fips);

  const resultsGrouped = data && groupByRunDate(data);
  const resultsArray = data && _.toArray(resultsGrouped);

  const selectMeasure = (results, measure) => {
    return _.map(results, (r) => ({ date: r.date, y: r[measure] }));
  };

  const yDomain =
    data &&
    data.length &&
    inputData &&
    inputData.length &&
    (props.type == "cases"
      ? [
          0,
          _.max([
            _.maxBy(data, (d) => Number(d.infections)).infections,
            1.1 * _.maxBy(inputData, (d) => Number(d.cases)).cases,
          ]),
        ]
      : [
          0,
          _.max([
            _.maxBy(data, (d) => Number(d.deaths)).deaths,
            1.1 * _.maxBy(inputData, (d) => Number(d.deaths)).deaths,
          ]),
        ]);

  return (
    <XYPlot
      className="svg-container"
      width={width}
      height={height}
      getX={(d) => new Date(d.date).getTime()}
      getY={(d) => d.y}
      yDomain={yDomain}
      xType="time"
      style={{
        backgroundColor: "white",
      }}
    >
      <HorizontalGridLines tickTotal={3} />

      <YAxis
        tickTotal={3}
        tickFormat={props.type == "cases" ? d3format(".2s") : d3format(".1f")}
        style={{ line: { opacity: 0 } }}
      />
      <XAxis
        tickSize={0}
        tickFormat={(d) => format(d, "M/d")}
        style={{ line: { stroke: "black", strokeWidth: 1 } }}
      />

      {inputData && (
        <VerticalBarSeries
          data={selectMeasure(
            inputData,
            props.type === "cases" ? "cases" : "deaths"
          )}
          key={"casebars"}
          color={"rgba(50, 50, 0, 0)"}
          fill={"rgba(50, 50, 0, 0.1)"}
          opacity={1}
          barWidth={0.85}
        />
      )}

      {showHistory &&
        _.flatMap(resultsArray.slice(0, resultsArray.length - 1), (v, k) =>
          SplitLineSeries({
            dashLastNDays: 14,
            data: selectMeasure(
              v,
              props.type == "cases" ? "infections" : "deaths"
            ),
            key: "history-" + k,
            color: "rgba(0, 145, 255, 1)",
            opacity: 0.1,
            onNearestXY: null,
          })
        )}

      {SplitLineSeries({
        dashLastNDays: 14,
        data: selectMeasure(
          _.last(resultsArray),
          props.type == "cases" ? "infections" : "deaths"
        ),
        key: "present",
        color: "rgba(0, 145, 255, 1)",
        opacity: 1,
        onNearestXY: null,
      })}

      {showHistory &&
        _.flatMap(resultsArray.slice(0, resultsArray.length - 1), (v, k) =>
          SplitLineSeries({
            dashLastNDays: 14,
            data: selectMeasure(
              v,
              props.type == "cases" ? "cases.fitted" : "deaths.fitted"
            ),
            key: "history-" + k,
            color: "rgba(50, 50, 0, 1)",
            opacity: 0.1,
            onNearestXY: null,
          })
        )}

      {SplitLineSeries({
        dashLastNDays: 14,
        data: selectMeasure(
          _.last(resultsArray),
          props.type == "cases" ? "cases.fitted" : "deaths.fitted"
        ),
        key: "present",
        color: "rgba(50, 50, 0, 1)",
        opacity: 1,
        onNearestXY: null,
      })}
    </XYPlot>
  );
}
