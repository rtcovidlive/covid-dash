import {
  XYPlot,
  XAxis,
  YAxis,
  HorizontalGridLines,
  VerticalGridLines,
  VerticalBarSeries,
  LineSeries,
  MarkSeries,
  AreaSeries,
  Highlight,
} from "react-vis";
import _ from "lodash";
import {
  useCountyResults,
  useNeighboringCountyResults,
  useInputData,
} from "../lib/data";
import { format } from "date-fns";
import { format as d3format } from "d3-format";
import { useState } from "react";

function groupBy(data, metric) {
  return _.groupBy(data, (d) => d[metric]);
}

const getSeriesConfig = function (metric) {
  var conf;

  switch (metric) {
    case "Rt": {
      conf = {
        yDomain: [0, 2],
        yAxisTicks: [0.5, 1, 1.5],
        strokeColor: "gray",
        neighborStrokeColor: "rgb(56, 21, 105)",
        strokeColorEmphasis: "rgb(234, 99, 255)",
      };
      break;
    }
    case "infectionsPC": {
      conf = {
        yDomain: [0, 500],
        yAxisTicks: [0, 100, 200, 300, 400],
        strokeColor: "rgb(56, 230, 252)",
        strokeColorEmphasis: "rgba(0, 145, 255, 1)",
      };
      break;
    }
    case "PEI": {
      conf = {
        yDomain: [0, 1],
        yAxisTicks: [0, 0.33, 0.5, 0.67, 1.0],
        yGridTicks: [0, 0.33, 0.5, 0.67, 1.0],
        yTickFormat: d3format(".0%"),
        strokeColor: "rgb(56, 230, 252)",
        strokeColorEmphasis: "rgba(0, 145, 255, 1)",
      };
      break;
    }
    case "cases": {
      conf = {
        yTickFormat: d3format(".1s"),
        color: "rgba(50, 50, 0, 0)",
        fill: "rgba(50, 50, 0, 0.5)",
      };
      break;
    }
    case "deaths": {
      conf = {
        yTickFormat: d3format(".1s"),
        color: "rgba(50, 50, 0, 1.0)",
        fill: "rgba(50, 50, 0, 1.0)",
      };
      break;
    }
    default: {
      conf = {
        yDomain: [0, 10000],
        strokeColor: "rgb(56, 230, 252)",
        strokeColorEmphasis: "rgba(0, 145, 255, 1)",
      };
    }
  }

  return conf;
};

export function CountyMetricChart(props) {
  const {
    measure,
    fips,
    width,
    height,
    showNeighbors,
    lastDrawLocation,
    setLastDrawLocation,
  } = props;
  const { data, error } = useCountyResults(fips);
  const {
    data: dataNeighbor,
    error: errorNeighbor,
  } = useNeighboringCountyResults(fips, "2021-03-24");

  const resultsGrouped = data && groupBy(data, "run.date");
  const neighborResultsGrouped = dataNeighbor && groupBy(dataNeighbor, "fips");
  const resultsArray = data && _.toArray(resultsGrouped);
  const neighborResultsArray =
    dataNeighbor && _.toArray(neighborResultsGrouped);

  const logitScale = (k, n0) => (n) => 1 / (1 + Math.exp(-k * (n - n0)));

  const conf = getSeriesConfig(measure);

  const numSeries = _.keys(resultsGrouped).length;

  console.log(conf);

  return (
    <XYPlot
      className="svg-container"
      xDomain={
        lastDrawLocation && [lastDrawLocation.left, lastDrawLocation.right]
      }
      yDomain={conf.yDomain}
      width={width}
      height={height}
      getX={(d) => new Date(d.date)}
      getY={(d) => d[measure]}
      xType="time"
      style={{
        backgroundColor: "white",
      }}
    >
      <HorizontalGridLines tickValues={conf.yGridTicks} />

      <YAxis
        tickTotal={3}
        tickValues={conf.yAxisTicks}
        style={{ line: { opacity: 0 } }}
        tickFormat={conf.yTickFormat}
      />
      <XAxis tickFormat={(d) => format(d, "M/d")} />

      {props.measure === "PEI" && (
        <AreaSeries data={_.last(resultsArray)} color={"rgb(235,235,240)"} />
      )}

      {showNeighbors &&
        _.map(neighborResultsArray, (v, k) => (
          <LineSeries
            data={v}
            key={k}
            color={conf.neighborStrokeColor || "black"}
            opacity={0.4}
            strokeWidth={"1.5px"}
            strokeStyle={"dashed"}
          />
        ))}

      {_.map(resultsArray, (v, k) => (
        <LineSeries
          data={v}
          key={k}
          color={
            k === numSeries - 1 && conf.strokeColorEmphasis
              ? conf.strokeColorEmphasis
              : conf.strokeColor || "black"
          }
          opacity={logitScale(12, 0.7)(k / (numSeries - 1))}
          strokeWidth={k === numSeries - 1 ? "4px" : "2px"}
        />
      ))}

      <Highlight
        enableY={false}
        onBrushEnd={(area) => setLastDrawLocation(area)}
      />
    </XYPlot>
  );
}

export function CountyInputChart(props) {
  const {
    measure,
    fips,
    width,
    height,
    lastDrawLocation,
    setLastDrawLocation,
  } = props;
  const { data, error } = useInputData(fips);

  const conf = getSeriesConfig(measure);

  console.log("cdafdsa");
  console.log(conf);

  return (
    <XYPlot
      className="svg-container"
      xDomain={
        lastDrawLocation && [
          lastDrawLocation.left.getTime(),
          lastDrawLocation.right.getTime(),
        ]
      }
      yDomain={conf.yDomain}
      width={width}
      height={height}
      getX={(d) => new Date(d.date).getTime()}
      getY={(d) => d[measure]}
      xType="time"
      style={{
        backgroundColor: "white",
      }}
    >
      <HorizontalGridLines tickTotal={3} tickValues={conf.yGridTicks} />

      <YAxis
        tickTotal={3}
        tickValues={conf.yAxisTicks}
        style={{ line: { opacity: 0 } }}
        tickFormat={conf.yTickFormat}
      />
      <XAxis tickFormat={(d) => format(d, "M/d")} />

      <VerticalBarSeries
        data={data}
        key={"casebars"}
        color={conf.color}
        fill={conf.fill}
        opacity={1}
        barWidth={0.92}
      />

      <Highlight
        enableY={false}
        onBrushEnd={(area) => setLastDrawLocation(area)}
      />
    </XYPlot>
  );
}
