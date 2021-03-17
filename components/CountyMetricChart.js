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

const getSeriesConfig = function (metric) {
  var conf;

  switch (metric) {
    case "Rt": {
      conf = {
        yDomain: [0, 2],
        strokeColor: "gray",
        strokeColorEmphasis: "rgb(234, 99, 255)",
      };
      break;
    }
    case "infectionsPC": {
      conf = {
        yDomain: [0, 500],
        strokeColor: "rgb(56, 230, 252)",
        strokeColorEmphasis: "rgba(0, 145, 255, 1)",
      };
      break;
    }
    case "PEI": {
      conf = {
        yDomain: [0, 1],
        strokeColor: "rgb(56, 230, 252)",
        strokeColorEmphasis: "rgba(0, 145, 255, 1)",
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
  const [lastDrawLocation, setLastDrawLocation] = useState(null);

  const { measure, fips, width, height } = props;
  const { data, error } = useAllRunResultsDev(fips);

  const resultsGrouped = data && groupByRunDate(data);

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
      yDomain={
        lastDrawLocation
          ? [lastDrawLocation.bottom, lastDrawLocation.top]
          : conf.yDomain
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

      <YAxis tickTotal={3} style={{ line: { opacity: 0 } }} />
      <XAxis tickFormat={(d) => format(d, "M/d")} />

      {_.map(_.toArray(resultsGrouped), (v, k) => (
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

      <MarkSeries
        data={_.map(resultsGrouped, (d) => _.maxBy(d, (day) => day.date))}
        color={conf.strokeColor || "black"}
        size={0.6}
        opacity={0.2}
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
