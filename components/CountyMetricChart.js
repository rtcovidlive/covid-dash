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
import { SplitLineSeries } from "../visualization/SplitLineSeries.js";
import _ from "lodash";
import {
  useLatestNeighborRuns,
  useHistoricalRuns,
  useLatestRun,
  useInputsForRun,
} from "../lib/data";
import { format as d3format } from "d3-format";
import { max } from "d3-array";
import { utcFormat } from "d3-time-format";
import { utcDay } from "d3-time";
import { useState } from "react";
import sma from "sma";
import { USCounties } from "../config/USCounties.js";
import { Alert } from "antd";
import styled from "styled-components";

const Explanation = styled.p`
  margin: 10px 0px 10px 30px;
`;

const getSeriesConfig = function (outcome) {
  var conf;

  switch (outcome) {
    case "r_t": {
      conf = {
        shortName: "Rt",
        yDomain: [0, 2],
        yAxisTicks: [0.5, 1, 1.5],
        strokeColor: "gray",
        neighborStrokeColor: "rgb(56, 21, 105)",
        fillColorConf: "rgb(245, 179, 255)",
        strokeColorEmphasis: "rgb(234, 99, 255)",
      };
      break;
    }
    case "P100k_infections": {
      conf = {
        shortName: "IPC",
        yDomain: [0, 800],
        yAxisTicks: [0, 100, 200, 300, 400, 600, 800],
        strokeColor: "rgb(100, 125, 160)",
        fillColorConf: "rgb(125, 200, 255)",
        strokeColorEmphasis: "rgba(0, 145, 255, 1)",
      };
      break;
    }
    case "PC_infections_cumulative": {
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

const addSpecialOutcomes = function (datum, outcome, pop) {
  const safeMul = (x, y) => (x === null || y === null ? null : x * y);
  const safeDiv = (x, y) => (x === null || y === null ? null : x / y);

  if (outcome.startsWith("PC_") && datum[outcome] === undefined) {
    const base_outcome = outcome.match(/^PC_(.*)$/)[1];

    const newKeys = [
      [`${outcome}_p2_5`, safeDiv(datum[`${base_outcome}_p2_5`], pop)],
      [`${outcome}_p25`, safeDiv(datum[`${base_outcome}_p25`], pop)],
      [`${outcome}`, safeDiv(datum[`${base_outcome}`], pop)],
      [`${outcome}_p75`, safeDiv(datum[`${base_outcome}_p75`], pop)],
      [`${outcome}_p97_5`, safeDiv(datum[`${base_outcome}_p97_5`], pop)],
    ];

    return { ...datum, ..._.fromPairs(newKeys) };
  } else if (outcome.startsWith("P100k_") && datum[outcome] === undefined) {
    const base_outcome = outcome.match(/^P100k_(.*)$/)[1];

    const newKeys = [
      [
        `${outcome}_p2_5`,
        safeMul(100000 / 7, safeDiv(datum[`${base_outcome}_p2_5`], pop)),
      ],
      [
        `${outcome}_p25`,
        safeMul(100000 / 7, safeDiv(datum[`${base_outcome}_p25`], pop)),
      ],
      [
        `${outcome}`,
        safeMul(100000 / 7, safeDiv(datum[`${base_outcome}`], pop)),
      ],
      [
        `${outcome}_p75`,
        safeMul(100000 / 7, safeDiv(datum[`${base_outcome}_p75`], pop)),
      ],
      [
        `${outcome}_p97_5`,
        safeMul(100000 / 7, safeDiv(datum[`${base_outcome}_p97_5`], pop)),
      ],
    ];

    return { ...datum, ..._.fromPairs(newKeys) };
  } else if (outcome.startsWith("P100k") || outcome.startsWith("PC_")) {
    return datum;
  } else {
    throw 'Outcome did not start with either "PC_" or "P100k"';
  }
};

const runWithSpecialOutcomes = function (run, outcome) {
  return {
    ...run,
    timeseries: run.timeseries.map((d) =>
      addSpecialOutcomes(d, outcome, run.geo_info.pop)
    ),
  };
};

export function CountyMetricChart(props) {
  const {
    outcome,
    geoName,
    stateAbbr,
    width,
    height,
    showNeighbors,
    showHistory,
    showExtent,
    routeToFIPS,
    routeToState,
  } = props;

  let { data: runLatestRaw, error } = useLatestRun(props.geoName);

  let { data: runsNeighborsRaw, error: errorNeighbors } = useLatestNeighborRuns(
    props.geoName
  );

  let { data: runsHistoricalRaw, error: errorHistorical } = useHistoricalRuns(
    props.geoName
  );

  const [value, setValue] = useState(false);
  const [modelRunDate, setModelRunDate] = useState(false);
  const [neighborKeys, setNeighborKeys] = useState(null);
  const [hintActiveSide, setHintActiveSide] = useState("R");

  let runLatest = runLatestRaw;
  let runsNeighbors = runsNeighborsRaw;
  let runsHistorical = runsHistoricalRaw;

  if (!runLatest) return null;

  if (props.outcome.startsWith("P100k_") || props.outcome.startsWith("PC_")) {
    if (runLatest) runLatest = runWithSpecialOutcomes(runLatest, props.outcome);

    if (runsNeighbors)
      runsNeighbors = runsNeighbors.map((d) =>
        runWithSpecialOutcomes(d, props.outcome)
      );

    if (runsHistorical)
      runsHistorical = runsHistorical.map((d) =>
        runWithSpecialOutcomes(d, props.outcome)
      );
  }

  const key = runLatest.geo_type === "state" ? "state" : "fips";

  const hasConf = runLatest && runLatest.method === "sampling";

  const logitScale = (k, n0) => (n) => 1 / (1 + Math.exp(-k * (n - n0)));

  const formatHint = (d) => {
    if (!showNeighbors)
      return [
        { title: "Date", value: utcFormat("%b %e")(new Date(d.date)) },
        {
          title: conf.shortName || outcome,
          value: conf.yTickFormat
            ? conf.yTickFormat(d[outcome])
            : d3format(",.2f")(d[outcome]),
        },
      ];
    else return [{ title: USCounties[d.geo_name].county, value: "Hmm" }];
  };

  const rundateFormatHint = (d) => [
    {
      title: "Run date",
      value: utcFormat("%b %e")(new Date(d.run_date)),
    },
    {
      title: "Age",
      value: `${utcDay.count(new Date(d.run_date), new Date())}d`,
    },
  ];

  const conf = getSeriesConfig(outcome);

  const numSeries =
    showHistory && runsHistorical ? runsHistorical.length + 1 : 1;

  const clipper = (d) =>
    showExtent === "all"
      ? d
      : _.filter(
          d,
          (v) => new Date(v.date) > utcDay.offset(new Date(), -3 * 30)
        );

  return (
    <XYPlot
      className="svg-container"
      yDomain={conf.yDomain}
      width={width}
      height={height}
      getX={(d) => new Date(d.date)}
      getY={(d) => d[outcome]}
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
        // tickTotal={showExtent === "all" ? 18 : 5}
        tickTotal={5}
        tickFormat={(d) => utcFormat("%b %e")(d)}
      />

      {props.outcome === "PC_infections_cumulative" && runLatest && (
        <AreaSeries
          data={clipper(runLatest.timeseries)}
          color={"rgb(235,235,240)"}
        />
      )}

      {key === "state" && hasConf && runLatest && (
        <AreaSeries
          data={clipper(runLatest.timeseries)}
          key={"conf"}
          getY={(d) => d[outcome + "_p97_5"]}
          getY0={(d) => d[outcome + "_p2_5"]}
          color={conf.fillColorConf}
          opacity={0.7}
        />
      )}

      {showNeighbors &&
        runsNeighbors &&
        _.flatMap(runsNeighbors, (v, k) =>
          SplitLineSeries({
            dashLastNWeeks: 2,
            data: clipper(v.timeseries),
            key: "neighbors-" + k,
            color: conf.neighborStrokeColor || "black",
            opacity: 0.4,
            strokeWidth: "1.5px",
            strokeStyle: "dashed",
          })
        )}

      {showHistory &&
        runsHistorical &&
        _.flatMap(runsHistorical, (v, k) => {
          return SplitLineSeries({
            dashLastNWeeks: 2,
            data: clipper(v.timeseries),
            key: "history-" + k,
            color: conf.strokeColor || "black",
            opacity: 0.2 + logitScale(12, 0.7)(k / (numSeries - 2)) / 0.7,
            strokeWidth: "2px",
            onNearestXY: null,
          });
        })}

      {runLatest &&
        SplitLineSeries({
          dashLastNWeeks: 2,
          data: clipper(runLatest.timeseries),
          key: "present-lineseries",
          color: conf.strokeColorEmphasis,
          strokeWidth: "4px",
          hintActiveSide,
          setHintActiveSide,
          onNearestXY: (value) => {
            !showNeighbors && !showHistory && setValue(value);
          },
        })}

      {showHistory && runLatest && runsHistorical && (
        <MarkSeries
          data={[runLatest, ...runsHistorical].map((d) => ({
            ..._.last(d.timeseries),
            run_date: d.run_date,
          }))}
          key={"markseries-historical-runs"}
          color={conf.strokeColor}
          size={1.7}
          onNearestXY={(value) =>
            !showNeighbors && showHistory && setModelRunDate(value)
          }
        />
      )}

      {runLatest && (
        <MarkSeries
          data={[runLatest].map((d) => ({
            ..._.last(d.timeseries),
            run_date: d.run_date,
          }))}
          key={"markseries-latest-run"}
          color={conf.strokeColorEmphasis}
          size={2.8}
        />
      )}

      {showNeighbors && runsNeighbors && neighborKeys !== null && (
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
        runsNeighbors &&
        _.map(runsNeighbors, (run, k) => (
          <LineSeries
            data={clipper(run.timeseries)}
            key={"neighbors-lineseries-" + k}
            color="black"
            opacity={neighborKeys === run.geo_name ? 0.7 : 0.3}
            size={6}
            onSeriesMouseOver={(e) => setNeighborKeys(run.geo_name)}
            onSeriesMouseOut={(e) => setNeighborKeys(null)}
            onSeriesClick={(e) =>
              key === "fips"
                ? routeToFIPS(USCounties[run.geo_name].abbr, run.geo_name)
                : routeToState(stateAbbr)
            }
            style={{ cursor: "pointer" }}
          />
        ))}
    </XYPlot>
  );
}

export function CountyInputChart(props) {
  const { outcome, geoName, runID, historicalRunID, width, height, barDomain } =
    props;

  const [maxDateSeen, setMaxDateSeen] = useState("1970-01-01");
  const [minDateSeen, setMinDateSeen] = useState("2300-01-01");

  const { data: inputsLatest, error: errorInputsLatest } =
    useInputsForRun(runID);

  const { data: inputsHistorical, error: errorInputsHistorical } =
    useInputsForRun(historicalRunID);

  if (!inputsLatest) return null;

  return (
    <XYPlot
      className="svg-container"
      width={width}
      height={height}
      getX={(d) => new Date(d.date).getTime()}
      getY={(d) => d[outcome]}
      xType="time"
      style={{
        backgroundColor: "white",
      }}
    >
      <XAxis tickFormat={(d) => utcFormat("%b %e")(d)} />

      {inputsHistorical && (
        <VerticalBarSeries
          data={inputsHistorical}
          key={"bars-historical"}
          color="pink"
          fill="pink"
          barWidth={0.92}
        />
      )}

      <VerticalBarSeries
        data={inputsLatest}
        key={"bars"}
        color="black"
        fill="black"
        opacity={1}
        barWidth={0.92}
      />
    </XYPlot>
  );

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
            outcome === "cases" ? "case" : "death"
          } data this far back for this ${fips ? "county" : "state"}`}
          type="error"
          showIcon
        />
      </Explanation>
    );

  const conf = getSeriesConfig(outcome);

  var sma_7d = sma(
    _.map(data, (s) => s[outcome]),
    7,
    (n) => n
  );

  sma_7d = [0, 0, 0, 0, 0, 0].concat(sma_7d); // First 6 elements aren't part of sma

  const sma_zipped = _.zipWith(
    _.map(data, (d) => d.date),
    sma_7d,
    (date, avg) => {
      var d = { date: date };
      d[outcome] = avg;
      return d;
    }
  );

  var sma_7d_latest = sma(
    _.map(latestData, (s) => s[outcome]),
    7,
    (n) => n
  );

  sma_7d_latest = [0, 0, 0, 0, 0, 0].concat(sma_7d_latest); // First 6 elements aren't part of sma

  const sma_zipped_latest = _.zipWith(
    _.map(latestData, (d) => d.date),
    sma_7d_latest,
    (date, avg) => {
      var d = { date: date };
      d[outcome] = avg;
      return d;
    }
  );

  const yDomainForEverything = data && [0, 1.1 * max(data, (d) => +d[outcome])];

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
      getY={(d) => d[outcome]}
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
