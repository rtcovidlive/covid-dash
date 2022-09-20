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
  Crosshair,
  Highlight,
  Hint,
  DiscreteColorLegend,
} from "react-vis";
import { SplitLineSeries } from "../visualization/SplitLineSeries.js";
import _ from "lodash";
import { Util } from "../lib/Util.js";
import {
  useLatestNeighborRuns,
  useHistoricalRuns,
  useLatestRun,
  useRun,
  useInputsForRun,
  useLatestEnclosedRuns,
} from "../lib/data";
import { format as d3format } from "d3-format";
import { max } from "d3-array";
import { utcFormat } from "d3-time-format";
import { utcDay } from "d3-time";
import { useState } from "react";
import { USCounties } from "../config/USCounties.js";
import { Alert } from "antd";
import styled from "styled-components";

const Explanation = styled.p`
  margin: 10px 0px 10px 30px;
`;

// @input str "outcome" Name of an outcome
//
// @output object, contains various aesthetic options that will be passed to
//   `react-vis` components.
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
        yDomain: [0, 1600],
        yAxisTicks: [0, 100, 200, 400, 800, 1200],
        yGridTicks: [0, 100, 200, 400, 800, 1200],
        yTickFormat: d3format(".3s"),
        strokeColor: "rgb(100, 125, 160)",
        fillColorConf: "rgb(125, 200, 255)",
        strokeColorEmphasis: "rgba(0, 145, 255, 1)",
      };
      break;
    }
    case "P100k_infections_cumulative": {
      conf = {
        shortName: "cumulative infections",
        yDomain: [0, 2].map((n) => 1e5 * n),
        yAxisTicks: [0, 0.33, 0.5, 0.67, 1.0, 1.5, 2].map((n) => 1e5 * n),
        yGridTicks: [0, 0.33, 0.5, 0.67, 1.0, 1.5, 2].map((n) => 1e5 * n),
        yTickFormat: d3format(".3s"),
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
        yTickFormat: d3format(".2r"),
        color: "rgba(50, 50, 0, 1.0)",
        fill: "rgba(50, 50, 0, 1.0)",
      };
      break;
    }
    case "hosp": {
      conf = {
        yTickFormat: d3format(".2s"),
        shortName: "hospitalizations",
      };
      break;
    }
    case "boost": {
      conf = {
        yTickFormat: d3format(".2s"),
        shortName: "boost+first-vax",
      };
      break;
    }
    default: {
      conf = {
        strokeColor: "rgb(56, 230, 252)",
        strokeColorEmphasis: "rgba(0, 145, 255, 1)",
      };
    }
  }

  return conf;
};

// @input object "datum" an object representing model output, or model input,
//   for a particular day or week.
//
// @input string-array or string "outcomeNames" the name or names of outcomes
//   that need to be computed from outcomes that already exist in "datum".
//   These new outcomes are always per-capita, or per-100k versions of existing
//   outcomes.
//
// @input Number "pop" the population size of the geography that is represented
//   by "datum".
//
// @input bool "perDay" When calculating per-capita and per-100k metrics,
//   "perDay" == true will divide the outcomes by 7, in order to convert from
//   weekly rates to daily rates.
//
// @return object, the modified datum with new keys "outcomeNames".
const addSpecialOutcomes = function (datum, outcomeNames, pop, perDay = true) {
  const safeMul = (x, y) => (x === null || y === null ? null : x * y);
  const safeDiv = (x, y) => (x === null || y === null ? null : x / y);
  let newKeys = [];
  const outcomes = Array.isArray(outcomeNames) ? outcomeNames : [outcomeNames];

  for (const outcome of outcomes) {
    if (outcome.startsWith("PC_") && datum[outcome] === undefined) {
      const base_outcome = outcome.match(/^PC_(.*)$/)[1];

      newKeys = newKeys.concat([
        [`${outcome}_p2_5`, safeDiv(datum[`${base_outcome}_p2_5`], pop)],
        [`${outcome}_p25`, safeDiv(datum[`${base_outcome}_p25`], pop)],
        [`${outcome}`, safeDiv(datum[`${base_outcome}`], pop)],
        [`${outcome}_p75`, safeDiv(datum[`${base_outcome}_p75`], pop)],
        [`${outcome}_p97_5`, safeDiv(datum[`${base_outcome}_p97_5`], pop)],
      ]);
    } else if (
      outcome.startsWith("P100k_") &&
      datum[outcome] === undefined &&
      !perDay
    ) {
      const base_outcome = outcome.match(/^P100k_(.*)$/)[1];

      newKeys = newKeys.concat([
        [
          `${outcome}_p2_5`,
          safeMul(100000, safeDiv(datum[`${base_outcome}_p2_5`], pop)),
        ],
        [
          `${outcome}_p25`,
          safeMul(100000, safeDiv(datum[`${base_outcome}_p25`], pop)),
        ],
        [`${outcome}`, safeMul(100000, safeDiv(datum[`${base_outcome}`], pop))],
        [
          `${outcome}_p75`,
          safeMul(100000, safeDiv(datum[`${base_outcome}_p75`], pop)),
        ],
        [
          `${outcome}_p97_5`,
          safeMul(100000, safeDiv(datum[`${base_outcome}_p97_5`], pop)),
        ],
      ]);
    } else if (
      outcome.startsWith("P100k_") &&
      datum[outcome] === undefined &&
      perDay
    ) {
      const base_outcome = outcome.match(/^P100k_(.*)$/)[1];

      newKeys = newKeys.concat([
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
      ]);
    }
  }
  return { ...datum, ..._.fromPairs(newKeys) };
};

// This takes a run, as returned by one of the use*Run() functions, and maps
// its timeseries data through `addSpecialOutcomes`.
const runWithSpecialOutcomes = function (run, outcomes, perDay = true) {
  return {
    ...run,
    timeseries: run.timeseries.map((d) =>
      addSpecialOutcomes(d, outcomes, run.geo_info.pop, perDay)
    ),
  };
};

// This is the graph component that is used for all of the charts on the state
// or county detail pages, besides the charts at the bottom that show input
// data. Those graphs are implemented by the <CountyInputChart/> component.
//
// @param string "outcome" Outcome to display.
// @param string "geoName" Name of the geography.
// @param string "stateAbbr" Abbreviation of state, or of the enclosing state.
// @param int "width" width of graph
// @param int "height" heigh of graph
// @param bool "showNeighbors" Show estimates of neighbors?
// @param bool "showHistory" Show estimates from historical runs of the same geo?
// @param bool "showEnclosed" Show estimates of enclosed (county) geographies?
// @param string "showExtent" If "all", show all data. If "3mo", show last 3 months
// @param fn "routeToFIPS" Function that routes the user to an arbitrary county detail page
// @param fn "routeToState" Function that routes the user to an arbitrary state detail page
export function CountyMetricChart(props) {
  const {
    outcome,
    geoName,
    stateAbbr,
    width,
    height,
    showNeighbors,
    showHistory,
    showEnclosed,
    showExtent,
    routeToFIPS,
    routeToState,
  } = props;

  // See SWR library docs for how this pattern works. Under the hood, this is hoo
  // a React hook.
  let { data: runLatestRaw, error } = useLatestRun(props.geoName);

  let { data: runsNeighborsRaw, error: errorNeighbors } = useLatestNeighborRuns(
    props.geoName
  );

  let { data: runsHistoricalRaw, error: errorHistorical } = useHistoricalRuns(
    props.geoName
  );

  // See SWR library docs for this pattern. This code conditionally fetches,
  // possibly from SWR's cache, the latest enclosed runs, but only if the user
  // has asked for that to happen. This saves bandwidth/improves page
  // responsiveness.
  let { data: runsEnclosedRaw, error: errorEnclosed } = useLatestEnclosedRuns(
    showEnclosed ? props.geoName : null
  );

  const [value, setValue] = useState(false);
  const [modelRunDate, setModelRunDate] = useState(false);
  const [neighborKeys, setNeighborKeys] = useState(null);
  const [enclosedKeys, setEnclosedKeys] = useState(null);
  const [hintActiveSide, setHintActiveSide] = useState("R");

  if (runLatestRaw && runLatestRaw.code) return <h1>No data</h1>;

  let runLatest = runLatestRaw;
  let runsNeighbors = runsNeighborsRaw;
  let runsHistorical = runsHistoricalRaw;
  let runsEnclosed = runsEnclosedRaw;

  if (!runLatest) return null;

  // Handle the case where we need to compute per-capita or per-100k rates
  // for the data that we've grabbed from the API (the API does not return any
  // data as per-capita.
  if (props.outcome.startsWith("P100k_") || props.outcome.startsWith("PC_")) {
    const perDay = props.outcome.endsWith("infections_cumulative")
      ? false
      : true;

    if (runLatest)
      runLatest = runWithSpecialOutcomes(runLatest, props.outcome, perDay);

    if (runsNeighbors)
      runsNeighbors = runsNeighbors.map((d) =>
        runWithSpecialOutcomes(d, props.outcome, perDay)
      );

    if (runsHistorical)
      runsHistorical = runsHistorical.map((d) =>
        runWithSpecialOutcomes(d, props.outcome, perDay)
      );

    if (runsEnclosed)
      runsEnclosed = runsEnclosed.map((d) =>
        runWithSpecialOutcomes(d, props.outcome, perDay)
      );
  }

  const key = runLatest.geo_type === "state" ? "state" : "fips";

  const hasConf = runLatest && runLatest.geo_type === "state";

  const quantiles = [
    ["_p97_5", "97.5"],
    ["_p75", "75"],
    ["", "median"],
    ["_p25", "25"],
    ["_p2_5", "2.5"],
  ];

  const logitScale = (k, n0) => (n) => 1 / (1 + Math.exp(-k * (n - n0)));

  const formatHint = (d) => {
    if (!showNeighbors)
      return [
        { title: "week ending", value: utcFormat("%b %e")(new Date(d.date)) },
        ...(hasConf
          ? quantiles.map(([suffix, name]) => ({
              title: `${name}`,
              value: conf.yTickFormat
                ? conf.yTickFormat(d[outcome + suffix])
                : d3format(",.2f")(d[outcome + suffix]),
            }))
          : [
              {
                title: conf.shortName || outcome,
                value: conf.yTickFormat
                  ? conf.yTickFormat(d[outcome])
                  : d3format(",.2f")(d[outcome]),
              },
            ]),
      ];
    else return [{ title: USCounties[d.geo_name].county, value: "Hmm" }];
  };

  const getHintContent = (d) => {
    let formatted = formatHint(d);
    return (
      <div className="hintContent rv-hint__content">
        <div className="hintHeader">
          {formatted[0].title}
          <h2>{formatted[0].value}</h2>
        </div>
        {formatted.length == 2 && (
          <table>
            <tbody>
              <tr>
                <td>
                  <b>{formatted[1].title}</b>
                </td>
                <td className="text-right">
                  <b>{formatted[1].value}</b>
                </td>
              </tr>
            </tbody>
          </table>
        )}
        {formatted.length > 2 && (
          <table>
            <tbody>
              <tr>
                <th>Percentile</th>
                <th className="text-right">Value</th>
              </tr>
              <tr>
                <td>{formatted[1].title}</td>
                <td className="text-right">{formatted[1].value}</td>
              </tr>
              <tr>
                <td>{formatted[2].title}</td>
                <td className="text-right">{formatted[2].value}</td>
              </tr>
              <tr>
                <td>
                  <b>{formatted[3].title}</b>
                </td>
                <td className="text-right">
                  <b>{formatted[3].value}</b>
                </td>
              </tr>
              <tr>
                <td>{formatted[4].title}</td>
                <td className="text-right">{formatted[4].value}</td>
              </tr>
              <tr>
                <td>{formatted[5].title}</td>
                <td className="text-right">{formatted[5].value}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    );
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

  // The "1" accounts for the latest run, which is always shown for all of the
  // different use cases for this component.
  const numSeries =
    showHistory && runsHistorical ? runsHistorical.length + 1 : 1;

  // Takes timeseries data and clips it to the last 3mo, if called for.
  const clipper = (d) =>
    showExtent === "all"
      ? d
      : _.filter(
          d,
          (v) => new Date(v.date) > utcDay.offset(new Date(), -3 * 30)
        );

  const selectedHistoricalBaseColor = "rgb(227, 221, 204)";
  const selectedHistoricalEmphasisColor = "rgb(235, 225, 152)";
  const selectedHistoricalEmphasisStrokeColor = "rgb(143, 139, 109)";

  const historicalViewIsEnabled = showHistory && runsHistorical;
  const neighborViewIsEnabled = showNeighbors && runsNeighbors;
  const enclosedViewIsEnabled = showEnclosed && runsEnclosed;

  const historicalSelectViewIsActive =
    showHistory && runsHistorical && modelRunDate;

  return (
    <XYPlot
      className="svg-container"
      yDomain={conf.yDomain}
      width={width}
      height={height}
      getX={(d) => new Date(d.date)}
      getY={(d) => d[outcome]}
      xType="time-utc"
      onMouseLeave={() => {
        setValue(false);
        setModelRunDate(false);
        setNeighborKeys(null);
        setEnclosedKeys(null);
      }}
      style={{
        backgroundColor: "white",
      }}
    >
      <HorizontalGridLines tickValues={conf.yGridTicks} />
      {outcome == "r_t" && (
        <HorizontalGridLines
          tickValues={[1]}
          style={{ stroke: "rgb(204, 81, 69)" }}
        />
      )}
      {outcome == "P100k_infections_cumulative" && (
        <HorizontalGridLines
          tickValues={[1e5]}
          style={{ stroke: "rgb(204, 81, 69)" }}
        />
      )}
      <VerticalGridLines
        style={{ opacity: 0.25 }}
        tickValues={runLatest.timeseries.map((d) => new Date(d.date))}
      />

      <YAxis
        tickTotal={3}
        tickValues={conf.yAxisTicks}
        style={{ line: { opacity: 0 } }}
        left={10}
        tickFormat={conf.yTickFormat}
      />
      <XAxis
        // tickTotal={showExtent === "all" ? 18 : 5}
        tickTotal={5}
        tickFormat={(d) => utcFormat("%b %e")(d)}
      />

      {/* The order of all of the following components is pretty sensitive. */}
      {props.outcome === "P100k_infections_cumulative" && (
        <AreaSeries
          data={clipper(runLatest.timeseries)}
          color={"rgb(235,235,240)"}
        />
      )}

      {hasConf && [
        <AreaSeries
          data={clipper(runLatest.timeseries)}
          key={"conf"}
          getY={(d) => d[outcome + "_p97_5"]}
          getY0={(d) => d[outcome + "_p2_5"]}
          color={conf.fillColorConf}
          style={{ mixBlendMode: "multiply" }}
          opacity={0.7}
          curve="curveCatmullRom"
        />,
        <AreaSeries
          data={clipper(runLatest.timeseries)}
          key={"conf-area-25-75"}
          getY={(d) => d[outcome + "_p75"]}
          getY0={(d) => d[outcome + "_p25"]}
          color={conf.fillColorConf}
          style={{ mixBlendMode: "multiply" }}
          opacity={0.7}
          curve="curveCatmullRom"
        />,
      ]}

      {neighborViewIsEnabled &&
        _.flatMap(runsNeighbors, (v, k) =>
          SplitLineSeries({
            dashLastNWeeks: 2,
            data: clipper(v.timeseries),
            key: "neighbors-" + k,
            color: conf.neighborStrokeColor || "black",
            opacity: 0.4,
            strokeWidth: "1.5px",
            strokeStyle: "dashed",
            curve: "curveCatmullRom",
          })
        )}

      {historicalViewIsEnabled &&
        !historicalSelectViewIsActive &&
        _.flatMap(runsHistorical, (v, k) => {
          return SplitLineSeries({
            dashLastNWeeks: 2,
            data: clipper(v.timeseries),
            key: "history-" + k,
            color: conf.strokeColor || "black",
            opacity: 0.2 + logitScale(12, 0.7)(k / (numSeries - 2)) / 0.7,
            strokeWidth: "2px",
            onNearestXY: null,
            curve: "curveCatmullRom",
          });
        })}

      {SplitLineSeries({
        dashLastNWeeks: 2,
        data: clipper(runLatest.timeseries),
        key: "present-lineseries",
        color: conf.strokeColorEmphasis,
        strokeWidth: "4px",
        hintActiveSide,
        setHintActiveSide,
        curve: "curveCatmullRom",
        onNearestXY: (value) => {
          !showNeighbors && !showHistory && !showEnclosed && setValue(value);
        },
      })}

      {historicalSelectViewIsActive &&
        hasConf &&
        runsHistorical
          .filter(({ run_date }) => run_date === modelRunDate.run_date)
          .map(({ timeseries }) => {
            const commonProps = {
              data: clipper(timeseries),
              style: { mixBlendMode: "multiply" },
              color: "rgb(200, 200, 200)",
              opacity: 0.9,
              curve: "curveCatmullRom",
            };

            return [
              <AreaSeries
                key="conf-historical"
                getY={(d) => d[outcome + "_p97_5"]}
                getY0={(d) => d[outcome + "_p2_5"]}
                {...commonProps}
              />,
              <AreaSeries
                key={"conf-historical-25-75"}
                getY={(d) => d[outcome + "_p75"]}
                getY0={(d) => d[outcome + "_p25"]}
                {...commonProps}
              />,
            ];
          })}

      {historicalSelectViewIsActive &&
        runsHistorical
          .filter(({ run_date }) => run_date === modelRunDate.run_date)
          .map(({ timeseries }) =>
            SplitLineSeries({
              dashLastNWeeks: 2,
              data: clipper(timeseries),
              key: "historical-lineseries",
              color: selectedHistoricalBaseColor,
              strokeWidth: "4px",
              curve: "curveCatmullRom",
            })
          )}

      {historicalViewIsEnabled && (
        <MarkSeries
          data={[runLatest, ...runsHistorical].map((d) => ({
            ..._.last(d.timeseries),
            run_date: d.run_date,
          }))}
          key={"markseries-historical-runs"}
          color={
            historicalSelectViewIsActive
              ? selectedHistoricalEmphasisColor
              : conf.strokeColor
          }
          stroke={
            historicalSelectViewIsActive
              ? selectedHistoricalEmphasisStrokeColor
              : conf.strokeColor
          }
          size={historicalSelectViewIsActive ? 4 : 1.7}
          onNearestXY={(value) =>
            !showNeighbors && showHistory && setModelRunDate(value)
          }
        />
      )}

      <MarkSeries
        data={[runLatest].map((d) => ({
          ..._.last(d.timeseries),
          run_date: d.run_date,
        }))}
        key={"markseries-latest-run"}
        color={conf.strokeColorEmphasis}
        size={2.8}
      />

      {/* CURSOR MARKER */}
      {value === false ? null : (
        <MarkSeries data={[value]} opacity={1} stroke={"#ffffff"} />
      )}
      {value === false ? null : (
        <Crosshair values={[value]} className="cursorMarker-line">
          {/* Divs inside Crosshair Component required to prevent value box render */}
          <div></div>
        </Crosshair>
      )}

      {neighborViewIsEnabled && neighborKeys !== null && (
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

      {!neighborViewIsEnabled &&
        enclosedViewIsEnabled &&
        enclosedKeys !== null && (
          <DiscreteColorLegend
            items={[
              {
                title: USCounties[enclosedKeys].county,
                color: "rgba(227, 219, 163)",
              },
            ]}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
            }}
          />
        )}

      {value && (
        <Hint
          value={value}
          format={formatHint}
          style={{ margin: 10 }}
          align={{ horizontal: "auto", vertical: "auto" }}
        >
          {getHintContent(value)}
        </Hint>
      )}
      {modelRunDate && (
        <Hint
          value={modelRunDate}
          style={{ margin: "5px" }}
          align={{ horizontal: "right", vertical: "bottom" }}
          format={rundateFormatHint}
        />
      )}

      {enclosedViewIsEnabled &&
        runsEnclosed.map((run) => (
          <LineSeries
            data={clipper(run.timeseries)}
            key={"enclosed-lineseries-" + run.geo_name}
            color={
              enclosedKeys === run.geo_name
                ? "rgb(191, 152, 69)"
                : "rgb(186, 175, 101)"
            }
            opacity={enclosedKeys === run.geo_name ? 1.0 : 0.7}
            size={enclosedKeys === run.geo_name ? 9 : 6}
            curve="curveCatmullRom"
            onSeriesMouseOver={(e) => setEnclosedKeys(run.geo_name)}
            onSeriesMouseOut={(e) => setEnclosedKeys(null)}
            onSeriesClick={(e) =>
              routeToFIPS(USCounties[run.geo_name].abbr, run.geo_name)
            }
            style={{ cursor: "pointer", mixBlendMode: "multiply" }}
          />
        ))}

      {neighborViewIsEnabled &&
        _.map(runsNeighbors, (run, k) => (
          <LineSeries
            data={clipper(run.timeseries)}
            key={"neighbors-lineseries-" + run.geo_name}
            color="black"
            opacity={neighborKeys === run.geo_name ? 0.7 : 0.3}
            size={6}
            curve="curveCatmullRom"
            onSeriesMouseOver={(e) => setNeighborKeys(run.geo_name)}
            onSeriesMouseOut={(e) => setNeighborKeys(null)}
            onSeriesClick={(e) =>
              key === "fips"
                ? routeToFIPS(USCounties[run.geo_name].abbr, run.geo_name)
                : routeToState(Util.abbrState(neighborKeys, "abbr"))
            }
            style={{ cursor: "pointer" }}
          />
        ))}
    </XYPlot>
  );
}

// This maps between input-data names ("cases", "deaths", etc) and model outcomes
// that the user has the option of viewing alongside input data.
const outcomeMap = {
  cases: ["infections", "fitted_cases"],
  deaths: ["deaths"], // Not showing fitted_deaths
  hosp: ["severe", "fitted_hospitalizations"],
  P100k_cases: ["P100k_infections", "P100k_fitted_cases"],
  P100k_deaths: ["P100k_deaths"], // Not showing fitted deaths
  P100k_hosp: ["P100k_severe", "P100k_fitted_hospitalizations"],
};

export function CountyInputChart(props) {
  const {
    outcome,
    geoName,
    runID,
    historicalRunID,
    fitToData,
    width,
    height,
    barDomain,
    population,
  } = props;

  // Data from latest run
  const { data: runLatestRaw, error: errorRunLatest } = useLatestRun(geoName);

  // Data from historical run, if the ID passed was not null
  const { data: runHistoricalRaw, error: errorRunHistorical } =
    useRun(historicalRunID);

  // Inputs from the latest run
  const { data: inputsLatestRaw, error: errorInputsLatest } =
    useInputsForRun(runID);

  // Inputs from historical run, if ID passed was not null
  const { data: inputsHistoricalRaw, error: errorInputsHistorical } =
    useInputsForRun(historicalRunID);

  // Don't bother rendering anything unless we at least have the input data
  if (!inputsLatestRaw) return null;

  const inputsLatest = inputsLatestRaw.map((d) =>
    addSpecialOutcomes(d, outcome, population, true)
  );

  let inputsHistorical = inputsHistoricalRaw;

  if (inputsHistorical)
    inputsHistorical = inputsHistorical.map((d) =>
      addSpecialOutcomes(d, outcome, population, true)
    );

  let runLatest = runLatestRaw;
  let runHistorical = runHistoricalRaw;

  // Here we select which run will be used if `fitToData` is enabled. If
  // a historical run has been selected by the user, we always choose to
  // display that over the most recent run.
  let run = runLatest;
  if (runLatest && !runHistorical && fitToData && outcomeMap[outcome])
    run = runWithSpecialOutcomes(runLatest, outcomeMap[outcome], true);
  else if (runHistorical && fitToData && outcomeMap[outcome])
    run = runWithSpecialOutcomes(runHistorical, outcomeMap[outcome], true);

  const fitToDataIsActive = run && fitToData && outcomeMap[outcome];
  const hasConf = run && run.geo_type === "state";
  const conf = getSeriesConfig(outcome);

  let yDomain = conf.yDomain || [
    0,
    1.1 * max(inputsLatest, (d) => +d[outcome]),
  ];

  // Use the largest UI for the selected outcome if a UI is available
  if (fitToData && barDomain && run && outcomeMap[outcome] && hasConf)
    yDomain = [
      0,
      max(run.timeseries, (d) => d[outcomeMap[outcome][0] + "_p97_5"]),
    ];
  else if (fitToData && barDomain && run && outcomeMap[outcome] && !hasConf)
    yDomain = [0, max(run.timeseries, (d) => d[outcomeMap[outcome][0]])];

  return (
    <XYPlot
      className="svg-container"
      width={width}
      height={height}
      margin={{ left: 40 }}
      yDomain={yDomain}
      getX={(d) => new Date(d.date).getTime()}
      getY={(d) => d[outcome]}
      xType="time-utc"
      style={{
        backgroundColor: "white",
      }}
    >
      <HorizontalGridLines tickValues={conf.yGridTicks} />
      <VerticalGridLines
        style={{ opacity: 0.25 }}
        tickValues={inputsLatest.map((d) => new Date(d.date))}
      />
      <YAxis tickFormat={conf.yTickFormat} title={conf.shortName || outcome} />

      <XAxis
        tickLabelAngle={-45}
        height={100}
        tickTotal={5}
        tickFormat={(d) => utcFormat("%b %e")(d)}
      />

      <LineSeries
        data={inputsLatest}
        key={"bars-latest"}
        curve="curveStepBefore"
        color="#bbb"
        opacity={1}
      />

      <MarkSeries
        data={inputsLatest}
        key={"marks-latest"}
        color="black"
        fill="black"
        size={1.2}
      />

      {fitToDataIsActive &&
        hasConf &&
        outcomeMap[outcome].map((o, i) => [
          <AreaSeries
            data={run.timeseries}
            key={"conf-area-95"}
            getY={(d) => d[o + "_p97_5"]}
            getY0={(d) => d[o + "_p2_5"]}
            color={i === 0 ? "lightgreen" : "grey"}
            style={{ mixBlendMode: "multiply" }}
            opacity={0.3}
            curve="curveCatmullRom"
          />,
          <AreaSeries
            data={run.timeseries}
            key={"conf-area-25-75"}
            getY={(d) => d[o + "_p75"]}
            getY0={(d) => d[o + "_p25"]}
            color={i === 0 ? "lightgreen" : "grey"}
            style={{ mixBlendMode: "multiply" }}
            opacity={0.6}
            curve="curveCatmullRom"
          />,
        ])}

      {fitToDataIsActive &&
        outcomeMap[outcome].map((o, i) => (
          <LineSeries
            data={run.timeseries}
            key={`fit-to-data-${o}`}
            getY={(d) => d[o]}
            color={i === 0 ? "rgb(30, 130, 40)" : "black"}
            curve="curveCatmullRom"
          />
        ))}

      {inputsHistorical && (
        <LineSeries
          data={inputsHistorical}
          key={"bars-historical"}
          curve="curveStepBefore"
          color="magenta"
          size={2}
        />
      )}

      {inputsHistorical && (
        <MarkSeries
          data={[_.last(inputsHistorical)]}
          key={"marks-historical"}
          color="magenta"
          size={1.2}
        />
      )}
    </XYPlot>
  );
}
