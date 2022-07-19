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
  useRun,
  useInputsForRun,
  useLatestEnclosedRuns,
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
        shortName: "booster",
      };
      break;
    }
    case "RR": {
      conf = {
        shortName: "risk-ratio",
        yDomain: [0, 1],
        yTickFormat: d3format(".1f"),
        color: "rgba(50, 50, 0, 1.0)",
        fill: "rgba(50, 50, 0, 1.0)",
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

const runWithSpecialOutcomes = function (run, outcomes, perDay = true) {
  return {
    ...run,
    timeseries: run.timeseries.map((d) =>
      addSpecialOutcomes(d, outcomes, run.geo_info.pop, perDay)
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
    showEnclosed,
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

  let { data: runsEnclosedRaw, error: errorEnclosed } = useLatestEnclosedRuns(
    showEnclosed ? props.geoName : null
  );

  const [value, setValue] = useState(false);
  const [modelRunDate, setModelRunDate] = useState(false);
  const [neighborKeys, setNeighborKeys] = useState(null);
  const [enclosedKeys, setEnclosedKeys] = useState(null);
  const [hintActiveSide, setHintActiveSide] = useState("R");

  let runLatest = runLatestRaw;
  let runsNeighbors = runsNeighborsRaw;
  let runsHistorical = runsHistoricalRaw;
  let runsEnclosed = runsEnclosedRaw;

  if (!runLatest) return null;

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

  const hasConf = runLatest && runLatest.method === "sampling";

  const quantiles = [
    ["_p97_5", "97.5%"],
    ["_p75", "75%"],
    ["", "median"],
    ["_p25", "25%"],
    ["_p2_5", "2.5%"],
  ];

  const logitScale = (k, n0) => (n) => 1 / (1 + Math.exp(-k * (n - n0)));

  const formatHint = (d) => {
    if (!showNeighbors)
      return [
        { title: "week ending", value: utcFormat("%b %e")(new Date(d.date)) },
        ...(hasConf
          ? quantiles.map(([suffix, name]) => ({
              title: `${conf.shortName || outcome}, ${name}`,
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

  const selectedHistoricalBaseColor = "rgb(227, 221, 204)";
  const selectedHistoricalEmphasisColor = "rgb(235, 225, 152)";
  const selectedHistoricalEmphasisStrokeColor = "rgb(143, 139, 109)";

  const historicalViewIsEnabled = showHistory && runsHistorical;

  const historicalSelectViewIsActive =
    showHistory && runsHistorical && modelRunDate;

  const neighborViewIsEnabled = showNeighbors && runsNeighbors;

  const enclosedViewIsEnabled = showEnclosed && runsEnclosed;

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

      {
        // runLatest.timeseries.map(d => {
        //   const datumBottom = Object.assign({}, d);
        //   const datumTop    = Object.assign({}, d);
        //   datumBottom[outcome] = 0;
        //   let data = [datumBottom, datumTop];
        //   return (
        //     <LineSeries
        //       data={data}
        //       color={"black"}
        //       size={5}
        //     />
        //   );
        // })
      }

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

      {value && <Hint value={value} format={formatHint} />}
      {modelRunDate && (
        <Hint
          value={modelRunDate}
          style={{ margin: "10px" }}
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
                ? "rgb(227, 219, 163)"
                : "rgb(186, 175, 101)"
            }
            opacity={enclosedKeys === run.geo_name ? 1.0 : 0.7}
            size={enclosedKeys === run.geo_name ? 9 : 6}
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

const outcomeMap = {
  cases: ["infections", "fitted_cases"],
  deaths: ["deaths", "fitted_deaths"],
  hosp: ["severe", "fitted_hospitalizations"],
  P100k_cases: ["P100k_infections", "P100k_fitted_cases"],
  P100k_deaths: ["P100k_deaths", "P100k_fitted_deaths"],
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

  const [maxDateSeen, setMaxDateSeen] = useState("1970-01-01");
  const [minDateSeen, setMinDateSeen] = useState("2300-01-01");

  const { data: runLatestRaw, error: errorRunLatest } = useLatestRun(
    props.geoName
  );
  const { data: runHistoricalRaw, error: errorRunHistorical } =
    useRun(historicalRunID);

  const { data: inputsLatestRaw, error: errorInputsLatest } =
    useInputsForRun(runID);

  const { data: inputsHistoricalRaw, error: errorInputsHistorical } =
    useInputsForRun(historicalRunID);

  if (!inputsLatestRaw) return null;

  const inputsLatest = inputsLatestRaw.map((d) =>
    addSpecialOutcomes(d, outcome, population)
  );

  let inputsHistorical = inputsHistoricalRaw;

  if (inputsHistorical)
    inputsHistorical = inputsHistorical.map((d) =>
      addSpecialOutcomes(d, outcome, population)
    );

  let runLatest = runLatestRaw;

  if (runLatest && fitToData && outcomeMap[outcome])
    runLatest = runWithSpecialOutcomes(runLatest, outcomeMap[outcome], true);

  const fitToDataIsActive = runLatest && fitToData && outcomeMap[outcome];
  const hasConf = runLatest && runLatest.method === "sampling";
  const conf = getSeriesConfig(outcome);

  let yDomain = conf.yDomain || [
    0,
    1.1 * max(inputsLatest, (d) => +d[outcome]),
  ];

  if (fitToData && barDomain && runLatest && outcomeMap[outcome] && hasConf)
    yDomain = [
      0,
      max(runLatest.timeseries, (d) => d[outcomeMap[outcome][0] + "_p97_5"]),
    ];
  else if (
    fitToData &&
    barDomain &&
    runLatest &&
    outcomeMap[outcome] &&
    !hasConf
  )
    yDomain = [0, max(runLatest.timeseries, (d) => d[outcomeMap[outcome][0]])];

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

      {outcome === "RR" && (
        <AreaSeries data={inputsLatest} color={"rgb(235,235,240)"} />
      )}

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
            data={runLatest.timeseries}
            key={"conf-area-95"}
            getY={(d) => d[o + "_p97_5"]}
            getY0={(d) => d[o + "_p2_5"]}
            color={i === 0 ? "lightgreen" : "grey"}
            style={{ mixBlendMode: "multiply" }}
            opacity={0.3}
            curve="curveCatmullRom"
          />,
          <AreaSeries
            data={runLatest.timeseries}
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
            data={runLatest.timeseries}
            key={`fit-to-data-${o}`}
            getY={(d) => d[o]}
            color={i === 0 ? "rgb(30, 130, 40)" : "black"}
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
