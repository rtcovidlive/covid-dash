import "styles/App.scss";
import _ from "lodash";
import React, {
  useState,
  useEffect,
  useRef,
  PureComponent,
  Fragment,
} from "react";
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
import { Util } from "lib/Util";

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

function reformatMapData(data) {
  // Reimplementing `fromEpoch` here to avoid unneccessary construction of
  // large numbers of classes.
  const tf = timeFormat("%Y-%m-%d");

  const zipped = _.zipWith(
    data.Rt,
    data.date,
    data.infectionsPC,
    data.fips,
    (r, d, i, f) => ({
      r0: +r / 100,
      date: tf(new Date(d * 24 * 60 * 60 * 1000)),
      onsetsPC: i,
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

  const [hoverFips, setHoverFips] = useState([]);
  const [fips, setFips] = useState([]);

  const url = "https://covidestim.s3.us-east-2.amazonaws.com/map-demo.pack.gz";
  const albersURL =
    "https://covidestim.s3.us-east-2.amazonaws.com/counties-albers-10m.json";

  let addFips = (info) => {
    if (_.findIndex(fips, (d) => info.fips === d.fips) === -1)
      setFips(fips.concat([info]));
  };

  let addHoverFips = (info) => {
    setHoverFips([info]);
  };

  let removeFips = (fipsToRemove) => {
    setFips(_.filter(fips, (f) => f.fips !== fipsToRemove));
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

  if (dataIsLoaded && boundsIsLoaded && contentWidth) {
    return (
      <Fragment>
        <Col size={24} align="center" ref={ref}>
          <OverviewMapChart
            data={data}
            width={contentWidth}
            height={Math.floor(0.625 * contentWidth)}
            addFips={addFips}
            addHoverFips={addHoverFips}
            dateToDisplay={dateToDisplay}
            selectedOutcome={props.selectedOutcome}
            marginLeft={0}
          />
        </Col>
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
        <TrayCharts
          key="traychart-1"
          selectedCounties={hoverFips}
          mapData={mapData}
          rowCount={props.rowCount}
          colsPerChart={props.colsPerChart}
          isSmallScreen={props.isSmallScreen}
          selectedOutcome={props.selectedOutcome}
          contentWidth={contentWidth}
          isHover={true}
        />
        <TrayCharts
          key="traychart-2"
          selectedCounties={fips}
          mapData={mapData}
          rowCount={props.rowCount}
          colsPerChart={props.colsPerChart}
          isSmallScreen={props.isSmallScreen}
          selectedOutcome={props.selectedOutcome}
          contentWidth={contentWidth}
          handleRemoveFIPS={removeFips}
          isHover={false}
        />
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

let modeMap = function (modes) {
  return _.map(modes, (mode) => {
    if (mode === "True infections") return "True infections per 100k no UI";
    if (mode === "True infections per 100k")
      return "True infections per 100k no UI";
    if (mode === "True infections per 100k no UI") return mode;

    if (mode === "Infection rate") return "Infection rate no UI";
    if (mode === "Infection rate no UI") return mode;

    return "Infection rate no UI";
  });
};

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

    if (
      this.props.dateToDisplay != nextProps.dateToDisplay ||
      this.props.selectedOutcome != nextProps.selectedOutcome
    ) {
      this.handleMetricChange(
        nextProps.dateToDisplay,
        modeMap(nextProps.selectedOutcome.enabledModes)
      );
    }

    return false;
  }

  handleMouseover(data) {
    // let tooltipContents = (
    //   <TooltipWrapper>
    //     <TooltipLabel>{data.dataPoint.properties.name}</TooltipLabel>
    //   </TooltipWrapper>
    // );
    // this.setState({
    //   tooltipX: data.x,
    //   tooltipY: data.y,
    //   tooltipShowing: true,
    //   tooltipContents: tooltipContents,
    // });
  }
}

export class TrayCharts extends PureComponent {
  modes(selectedOutcome) {
    return modeMap(selectedOutcome.enabledModes);
  }

  render() {
    let props = this.props;
    let modes = this.modes(props.selectedOutcome);
    let refsByFIPS = {};

    return _.map(props.selectedCounties, (county, i) => {
      const fips = county.fips;
      const data = dataForCounty(props.mapData, fips);

      const stateAbbr = Util.abbrState(county.state, "abbr");

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

      if (data.series.length === 0)
        return (
          <Col key={fips + "0"} size={props.colsPerChart} align="left">
            No data!
          </Col>
        );

      return (
        <Col
          key={`${fips},${this.props.isHover ? "-1" : "-0"}`}
          size={props.colsPerChart}
          align={align}
          offset={align === "center" ? props.spacerOffset : 0}
        >
          <div
            className="stacked-state-wrapper"
            onClick={
              this.props.handleRemoveFIPS
                ? (e) => this.props.handleRemoveFIPS(fips)
                : null
            }
          >
            <StateR0Display
              ref={refsByFIPS[fips]}
              config={null}
              subArea={`${county.name}, ${stateAbbr}`}
              highlight={false}
              hasOwnRow={props.isSmallScreen}
              data={data}
              enabledModes={modes}
              yDomain={
                modes[0] === "True infections per 100k no UI"
                  ? [0, 400]
                  : [0.5, 1.5]
              }
              contentWidth={props.contentWidth}
            />
          </div>
        </Col>
      );
    });
  }
}
