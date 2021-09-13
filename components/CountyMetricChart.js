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
  Hint,
  DiscreteColorLegend,
} from "react-vis";
import _ from "lodash";
import {
  useStateResults,
  useCountyResults,
  useNeighboringStateResults,
  useNeighboringCountyResults,
  useInputData,
  useInputDataFromDate,
  useStateInputData,
  useStateInputDataFromDate,
} from "../lib/data";
import { format as d3format } from "d3-format";
import { max } from "d3-array";
import { utcFormat } from "d3-time-format";
import { timeDay } from "d3-time";
import { useState } from "react";
import sma from "sma";
import { USCounties } from "../config/USCounties.js";
import { Alert } from "antd";
import styled from "styled-components";

function groupBy(data, metric) {
  return _.groupBy(data, (d) => d[metric]);
}

const Explanation = styled.p`
  margin: 10px 0px 10px 30px;
`;

const getSeriesConfig = function (metric) {
  var conf;

  switch (metric) {
    case "Rt": {
      conf = {
        yDomain: [0, 2],
        yAxisTicks: [0.5, 1, 1.5],
        strokeColor: "gray",
        neighborStrokeColor: "rgb(56, 21, 105)",
        fillColorConf: "rgb(245, 179, 255)",
        strokeColorEmphasis: "rgb(234, 99, 255)",
      };
      break;
    }
    case "infectionsPC": {
      conf = {
        shortName: "IPC",
        yDomain: [0, 500],
        yAxisTicks: [0, 100, 200, 300, 400],
        strokeColor: "rgb(100, 125, 160)",
        fillColorConf: "rgb(125, 200, 255)",
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
        strokeColor: "rgb(100, 125, 160)",
        strokeColorEmphasis: "rgba(0, 145, 255, 1)",
        fillColorConf: "rgb(122, 192, 245)",
      };
      break;
    }
    case "cases": {
      conf = {
        yTickFormat: d3format(".2s"),
        color: "rgba(50, 50, 0, 0)",
        fill: "rgba(50, 50, 0, 0.5)",
      };
      break;
    }
    case "deaths": {
      conf = {
        yTickFormat: d3format(".1f"),
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
    state,
    stateAbbr,
    width,
    height,
    showNeighbors,
    showHistory,
    showExtent,
    routeToFIPS,
    routeToState,
  } = props;

  const { data: dataCounty, error: errorCounty } = useCountyResults(fips);
  const { data: dataState, error: errorState } = useStateResults(state);
  const { data: dataNeighborCounty, error: errorNeighborCounty } =
    useNeighboringCountyResults(
      fips,
      dataCounty
        ? _.maxBy(dataCounty, (d) => d["run.date"])["run.date"]
        : utcFormat("%Y-%m-%d")(new Date())
    );
  const { data: dataNeighborState, error: errorNeighborState } =
    useNeighboringStateResults(
      state,
      dataState
        ? _.maxBy(dataState, (d) => d["run.date"])["run.date"]
        : utcFormat("%Y-%m-%d")(new Date())
    );

  const key = state ? "state" : "fips";

  const data = key === "fips" ? dataCounty : dataState;
  const dataNeighbor = key === "fips" ? dataNeighborCounty : dataNeighborState;

  const [value, setValue] = useState(false);
  const [modelRunDate, setModelRunDate] = useState(false);
  const [neighborKeys, setNeighborKeys] = useState(null);

  const resultsGrouped = data && groupBy(data, "run.date");
  const resultsArray = data && _.toArray(resultsGrouped);

  const neighborResultsGrouped = dataNeighbor && groupBy(dataNeighbor, key);
  const neighborResultsArray =
    dataNeighbor && _.toArray(neighborResultsGrouped);

  const hasConf =
    key === "state" &&
    resultsArray &&
    resultsArray.length &&
    _.last(resultsArray)[0]["Rt.lo"] !== null &&
    _.last(resultsArray)[0]["Rt.lo"] !== "";

  const logitScale = (k, n0) => (n) => 1 / (1 + Math.exp(-k * (n - n0)));

  const formatHint = (d) => {
    if (!showNeighbors)
      return [
        { title: "Date", value: utcFormat("%b %e")(new Date(d.date)) },
        {
          title: conf.shortName || measure,
          value: conf.yTickFormat
            ? conf.yTickFormat(d[measure])
            : d3format(",.2f")(d[measure]),
        },
      ];
    else return [{ title: USCounties[d.fips].county, value: "Hmm" }];
  };

  const rundateFormatHint = (d) => [
    {
      title: "Age",
      value: `${timeDay.count(new Date(d["run.date"]), new Date())}d`,
    },
    {
      title: "Date",
      value: utcFormat("%b %e")(new Date(d["run.date"])),
    },
  ];

  const conf = getSeriesConfig(measure);

  const numSeries = showHistory ? _.keys(resultsGrouped).length : 1;

  const clipper = (d) =>
    showExtent === "all"
      ? d
      : _.filter(
          d,
          (v) => new Date(v.date) > timeDay.offset(new Date(), -8 * 30)
        );

  return (
    <XYPlot
      className="svg-container"
      yDomain={conf.yDomain}
      width={width}
      height={height}
      getX={(d) => new Date(d.date)}
      getY={(d) => d[measure]}
      xType="time"
      onMouseLeave={() => {
        setValue(false);
        setModelRunDate(false);
        setNeighborKeys(null);
      }}
      style={{
        backgroundColor: "white",
      }}
    >
      <HorizontalGridLines tickValues={conf.yGridTicks} />
      <VerticalGridLines
        style={{ opacity: 0.25 }}
        tickTotal={showExtent === "all" ? 18 : 5}
      />

      <YAxis
        tickTotal={3}
        tickValues={conf.yAxisTicks}
        style={{ line: { opacity: 0 } }}
        tickFormat={conf.yTickFormat}
      />
      <XAxis
        tickTotal={showExtent === "all" ? 18 : 5}
        tickFormat={(d) => utcFormat("%b %e")(d)}
      />

      {props.measure === "PEI" && (
        <AreaSeries
          data={clipper(_.last(resultsArray))}
          color={"rgb(235,235,240)"}
        />
      )}

      {key === "state" && hasConf && (
        <AreaSeries
          data={clipper(_.last(resultsArray))}
          key={"conf"}
          getY={(d) => d[measure + ".hi"]}
          getY0={(d) => d[measure + ".lo"]}
          color={conf.fillColorConf}
          opacity={0.7}
        />
      )}

      {showNeighbors &&
        _.map(neighborResultsArray, (v, k) => (
          <LineSeries
            data={clipper(v)}
            key={k + "neighbors"}
            color={conf.neighborStrokeColor || "black"}
            opacity={0.4}
            strokeWidth={"1.5px"}
            strokeStyle={"dashed"}
          />
        ))}

      {_.map(showHistory ? resultsArray : [_.last(resultsArray)], (v, k) => (
        <LineSeries
          data={clipper(v)}
          key={k}
          color={
            k === numSeries - 1 && conf.strokeColorEmphasis
              ? conf.strokeColorEmphasis
              : conf.strokeColor || "black"
          }
          opacity={0.2 + logitScale(12, 0.7)(k / (numSeries - 1)) / 0.7}
          strokeWidth={k === numSeries - 1 ? "4px" : "2px"}
          onNearestXY={(value) =>
            k === numSeries - 1 &&
            !showNeighbors &&
            !showHistory &&
            setValue(value)
          }
        />
      ))}

      {showHistory && (
        <MarkSeries
          data={_.map(resultsArray, _.last)}
          key={1000}
          color={conf.strokeColor}
          size={1}
          onNearestXY={(value) =>
            !showNeighbors && showHistory && setModelRunDate(value)
          }
        />
      )}

      {showNeighbors && neighborKeys && (
        <DiscreteColorLegend
          items={[
            {
              title:
                key === "fips"
                  ? `${USCounties[neighborKeys].county}, ${USCounties[neighborKeys].abbr}`
                  : `${neighborKeys}`,
              color: "rgba(0,0,0,0.7)",
            },
          ]}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
          }}
        />
      )}

      {value ? <Hint value={value} format={formatHint} /> : null}
      {modelRunDate && (
        <Hint
          value={modelRunDate}
          style={{ margin: "10px" }}
          format={rundateFormatHint}
        />
      )}

      {showNeighbors &&
        _.map(neighborResultsArray, (v, k) => (
          <LineSeries
            data={clipper(v)}
            key={1000 + k}
            color={neighborKeys === v[0][key] ? "black" : "transparent"}
            opacity={0.7}
            size={6}
            onSeriesMouseOver={(e) => setNeighborKeys(v[0][key])}
            onSeriesMouseOut={(e) => setNeighborKeys(null)}
            onSeriesClick={(e) =>
              key === "fips"
                ? routeToFIPS(USCounties[v[0].fips].abbr, v[0].fips)
                : routeToState(stateAbbr)
            }
            style={{ cursor: "pointer" }}
          />
        ))}
    </XYPlot>
  );
}

export function CountyInputChart(props) {
  const { measure, state, fips, width, height, date, barDomain } = props;

  const [maxDateSeen, setMaxDateSeen] = useState("1970-01-01");
  const [minDateSeen, setMinDateSeen] = useState("2100-01-01");

  const { data: latestCountyData, error: latestCountyError } =
    useInputData(fips);
  const { data: dataCounty, error: errorCounty } = date
    ? useInputDataFromDate(fips, date)
    : useInputData(fips);

  const { data: latestStateData, error: latestStateError } =
    useStateInputData(state);
  const { data: dataState, error: errorState } = date
    ? useStateInputDataFromDate(state, date)
    : useStateInputData(state);

  const latestData = fips ? latestCountyData : latestStateData;
  const latestError = fips ? latestCountyError : latestStateError;
  const data = fips ? dataCounty : dataState;
  const error = fips ? errorCounty : errorState;

  if (data && data.length > 0) {
    const maxDateForRunDate = _.maxBy(data, (d) => d.date).date;
    const minDateForRunDate = _.minBy(data, (d) => d.date).date;

    if (new Date(maxDateForRunDate) > new Date(maxDateSeen)) {
      setMaxDateSeen(maxDateForRunDate);
    }

    if (new Date(minDateForRunDate) < new Date(minDateSeen)) {
      setMinDateSeen(minDateForRunDate);
    }
  }

  if (data && data.length === 0)
    return (
      <Explanation>
        <Alert
          message="No data"
          description={`We don't have archived ${
            measure === "cases" ? "case" : "death"
          } data this far back for this ${fips ? "county" : "state"}`}
          type="error"
          showIcon
        />
      </Explanation>
    );

  const conf = getSeriesConfig(measure);

  var sma_7d = sma(
    _.map(data, (s) => s[measure]),
    7,
    (n) => n
  );

  sma_7d = [0, 0, 0, 0, 0, 0].concat(sma_7d); // First 6 elements aren't part of sma

  const sma_zipped = _.zipWith(
    _.map(data, (d) => d.date),
    sma_7d,
    (date, avg) => {
      var d = { date: date };
      d[measure] = avg;
      return d;
    }
  );

  var sma_7d_latest = sma(
    _.map(latestData, (s) => s[measure]),
    7,
    (n) => n
  );

  sma_7d_latest = [0, 0, 0, 0, 0, 0].concat(sma_7d_latest); // First 6 elements aren't part of sma

  const sma_zipped_latest = _.zipWith(
    _.map(latestData, (d) => d.date),
    sma_7d_latest,
    (date, avg) => {
      var d = { date: date };
      d[measure] = avg;
      return d;
    }
  );

  const yDomainForEverything = data && [0, 1.1 * max(data, (d) => +d[measure])];

  return (
    <XYPlot
      className="svg-container"
      xDomain={
        maxDateSeen &&
        minDateSeen && [
          new Date(minDateSeen).getTime(),
          new Date(maxDateSeen).getTime(),
        ]
      }
      yDomain={barDomain ? yDomainForEverything : null}
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
      <XAxis tickFormat={(d) => utcFormat("%b %e")(d)} />

      <VerticalBarSeries
        data={data}
        key={"casebars"}
        color={conf.color}
        fill={conf.fill}
        opacity={1}
        barWidth={0.92}
      />

      <LineSeries data={sma_zipped_latest} color="rgb(179, 109, 25)" />
      {date && <LineSeries data={sma_zipped} color="magenta" />}
      {date && <MarkSeries data={[_.last(sma_zipped)]} color="magenta" />}
    </XYPlot>
  );
}
