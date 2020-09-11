import "styles/App.scss";
import _ from "lodash";
import React, { useState, useEffect, useRef, Fragment } from "react";
import DataFetcher from "lib/DataFetcher";
import { StateR0Display } from "./StateR0Display";
import axios from "axios";
import { decode } from "@ygoe/msgpack";
import { nest } from "d3-collection";
import { extent } from "d3-array";
import { timeFormat } from "d3-time-format";
import { StateRtChart } from "./StateRtChart";
import { Row, Col } from "./Grid";
import { Slider, Spin } from "antd";

import "../styles/antd.scss";

import {
  TooltipWrapper,
  TooltipDate,
  TooltipStat,
  TooltipLabel,
  RTSubareaChart,
  LegendContainer,
  LegendRow,
  LegendLine,
  LegendLabel,
} from "./RTSubareaChart";

import OverviewMap from "visualization/OverviewMap";

let toEpoch = (d) => Math.floor(new Date(d).valueOf() / (1000 * 60 * 60 * 24));

let fromEpoch = (d) => {
  let obj = new Date(d * 24 * 3600 * 1000);
  return timeFormat("%Y-%m-%d")(obj);
};

const refsByFIPS = {};

function reformatMapData(data) {
  const zipped = _.zipWith(
    data.Rt,
    data.date,
    data.infectionsPC,
    data.fips,
    (r, d, i, f) => ({
      r0: +r / 100,
      date: fromEpoch(d),
      onsets: i,
      fips: f,
      identifier: f,
    })
  );

  const nested = nest()
    .key((d) => d.date)
    .key((d) => d.fips)
    .rollup((d) => d[0])
    .map(zipped);

  return nested;
}

function dataForCounty(data, fips) {
  let series = [];

  data.each((vals, date) => {
    let dataForDate = vals.get(fips);

    if (dataForDate) series.push(dataForDate);
  });

  return {
    identifier: fips,
    series: _.sortBy(series, (d) => d.date),
  };
}

export const OverviewMapSuper = React.forwardRef((props, ref) => {
  const [mapData, setMapData] = useState(null);
  const [dataIsLoaded, setDataIsLoaded] = useState(false);

  const [dateMinMax, setDateMinMax] = useState([null, null]);
  const [dateToDisplay, setDateToDisplay] = useState(null);

  const [mapBoundaries, setMapBoundaries] = useState(null);
  const [boundsIsLoaded, setBoundsIsLoaded] = useState(false);

  const [hoverFips, setHoverFips] = useState(null);
  const [fips, setFips] = useState([]);

  const url = "https://covidestim.s3.us-east-2.amazonaws.com/map-demo.pack.gz";
  const albersURL =
    "https://covidestim.s3.us-east-2.amazonaws.com/counties-albers-10m.json";

  let addFips = (newFips) => {
    if (fips.indexOf(newFips) === -1) setFips([newFips].concat(fips));
  };

  let addHoverFips = (newFips) => {
    setHoverFips(newFips);
  };

  useEffect(() => {
    axios.get(url, { responseType: "arraybuffer" }).then(
      (result) => {
        let decoded = decode(result.data);
        let reformatted = reformatMapData(decoded);

        // Minimum, maximum date in the timeseries
        let [min, max] = extent(reformatted.keys());

        setMapData(reformatted);
        setDateMinMax(["2020-02-01", max]);
        setDateToDisplay(max);
        setDataIsLoaded(true);
      },
      (error) => setDataIsLoaded(false)
    );
  }, []);

  useEffect(() => {
    axios.get(albersURL).then(
      (result) => {
        setMapBoundaries(result.data);
        setBoundsIsLoaded(true);
      },
      (error) => setBoundsIsLoaded(false)
    );
  }, []);

  let data = { mapData: mapData, mapBoundaries: mapBoundaries };

  const [contentWidth, setContentWidth] = useState(null);
  useEffect(() => {
    // TODO duplicated from index.js
    var resizeTimer;
    function setNewWidth() {
      if (ref.current) {
        setContentWidth(Math.ceil(ref.current.getBoundingClientRect().width));
      }
    }
    setNewWidth();
    window.addEventListener("resize", () => {
      if (resizeTimer) {
        window.clearTimeout(resizeTimer);
      }
      resizeTimer = window.setTimeout(() => {
        setNewWidth();
      }, 500);
    });
  }, [ref]);

  let handleSliderChange = (val) => {
    setDateToDisplay(fromEpoch(val));
  };

  let modes = _.map(props.selectedOutcome.enabledModes, (mode) => {
    if (mode === "True infections") return "True infections no UI";
    if (mode === "Infection rate") return "Infection rate no UI";

    if (mode === "True infections no UI") return mode;
    if (mode === "Infection rate no UI") return mode;

    return "Infection rate no UI";
  });

  if (dataIsLoaded && boundsIsLoaded && contentWidth) {
    return (
      <Fragment>
        <Col size={24}>
          <Slider
            defaultValue={toEpoch(dateMinMax[1])}
            tooltipVisible={true}
            min={toEpoch(dateMinMax[0])}
            max={toEpoch(dateMinMax[1])}
            tipFormatter={fromEpoch}
            onChange={handleSliderChange}
          />
        </Col>
        <Col size={24} align="center" ref={ref}>
          <OverviewMapChart
            data={data}
            width={contentWidth}
            height={Math.floor(0.625 * contentWidth)}
            addFips={addFips}
            addHoverFips={addHoverFips}
            dateToDisplay={dateToDisplay}
          />
        </Col>
        {hoverFips &&
          _.map([hoverFips, ...fips], (fips, i) => {
            const data = dataForCounty(mapData, fips);
            // selectedOutcome.enabledModes
            var align;
            switch (i % props.rowCount) {
              case 0:
                align = "left";
                break;
              case props.rowCount - 1:
                align = "right";
                break;
              default:
                align = "center";
                break;
            }
            refsByFIPS[fips] = refsByFIPS[fips] || React.createRef();
            if (data.series.length > 0)
              return (
                <Col
                  key={fips + (i === 0)}
                  size={props.colsPerChart}
                  align={align}
                  offset={align === "center" ? props.spacerOffset : 0}
                >
                  <div className="stacked-state-wrapper">
                    <StateR0Display
                      ref={refsByFIPS[fips]}
                      config={null}
                      subArea={fips}
                      highlight={false}
                      hasOwnRow={props.isSmallScreen}
                      data={data}
                      enabledModes={modes}
                      yDomain={
                        modes[0] === "True infections no UI"
                          ? [0, 400]
                          : [0.5, 1.5]
                      }
                      contentWidth={contentWidth}
                    />
                  </div>
                </Col>
              );
            else
              return (
                <Col key={fips} size={props.colsPerChart} align="left">
                  No data
                </Col>
              );
          })}
      </Fragment>
    );
  } else {
    return (
      <Col size={24} ref={ref}>
        <Spin size="large" tip="Loading map..." />
      </Col>
    );
  }
});

export default OverviewMapSuper;

export class OverviewMapChart extends RTSubareaChart {
  constructor(props) {
    super(props);
    this._vizClass = OverviewMap;
    this.overflow = "hidden";
    this._vizType = "OverviewMap";
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (
      this.props.width != nextProps.width ||
      this.props.height != nextProps.height
    )
      return true;

    if (this.state != nextState) return true;

    if (this.props.dateToDisplay != nextProps.dateToDisplay)
      this.handleDateChange(nextProps.dateToDisplay);

    return false;
  }

  handleMouseover(data) {
    // let tooltipContents = (
    //   <TooltipWrapper>
    //     <TooltipDate>
    //       {this._timeFormat(Util.dateFromISO(data.dataPoint.date))}
    //     </TooltipDate>
    //     <TooltipLabel>Positive (Reported)</TooltipLabel>
    //     <TooltipStat color={this.state.viz._mainChartStroke} opacity={0.7}>
    //       {this._numberFormat(data.dataPoint.cases_new)}
    //     </TooltipStat>
    //     <TooltipLabel>Testing Volume</TooltipLabel>
    //     <TooltipStat color={this.state.viz._testChartDark}>
    //       {this._numberFormat(data.dataPoint.tests_new)}
    //     </TooltipStat>
    //   </TooltipWrapper>
    // );
    let tooltipContents = (
      <TooltipWrapper>
        <TooltipLabel>{data.dataPoint.properties.name}</TooltipLabel>
      </TooltipWrapper>
    );
    this.setState({
      tooltipX: data.x,
      tooltipY: data.y,
      tooltipShowing: true,
      tooltipContents: tooltipContents,
    });
  }
}
