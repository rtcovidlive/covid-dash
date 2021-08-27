import _ from "lodash";
import React, {
  useMemo,
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
import { utcFormat } from "d3-time-format";
import {
  differenceInDays,
  eachMonthOfInterval,
  eachWeekOfInterval,
  format as dateFormat,
} from "date-fns";
import { useCountyResults } from "../lib/data";
import { StateRtChart } from "./StateRtChart";
import { AddCounty } from "./AddCounty";
import { Button } from "antd";
import { Row, Col } from "./Grid";
import { Slider, Spin, Space, Alert } from "antd";
import { SelectOutlined, ZoomInOutlined } from "@ant-design/icons";
import { Util } from "lib/Util";
import { Title, HelperTitle } from "./Typography";

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
  return utcFormat("%Y-%m-%d")(obj);
};

function reformatMapData(data) {
  // Reimplementing `fromEpoch` here to avoid unneccessary construction of
  // large numbers of classes.
  const tf = utcFormat("%Y-%m-%d");

  const zipped = _.zipWith(
    data.Rt,
    data.date,
    data.infectionsPC,
    data.fips,
    data.seroprevalence,
    data.infections,
    (r, d, i, f, sp, inf) => ({
      r0: +r / 100,
      date: tf(new Date(d * 24 * 60 * 60 * 1000)),
      onsetsPC: i,
      cumulative: sp,
      onsets: inf,
      fips: f,
      identifier: f,
    })
  );

  // Delete states
  // const filtered = _.filter(zipped, (d) => !d.fips.startsWith("29"));

  const nested = nest()
    .key((d) => d.date)
    .key((d) => d.fips)
    .rollup((d) => d[0])
    .map(zipped);

  return nested;
}

//function dataForCounty(data, fips) {
//  let series = [];
//
//  data.each((vals, date) => {
//    let dataForDate = vals.get(fips);
//
//    if (dataForDate) series.push(dataForDate);
//  });
//
//  return {
//    identifier: fips,
//    series: _.sortBy(series, (d) => d.date),
//  };
//}
function identifyAndTransformLatestRun(data) {
  if (!data || !data.length) return data;

  const maxDate = _.maxBy(data, (d) => d["run.date"])["run.date"];

  const filtered = data.filter((d) => d["run.date"] == maxDate);

  const result = filtered.map(
    ({ PEI, date, fips, infections, infectionsPC, Rt }) => ({
      cumulative: +PEI * 100,
      date: date,
      fips: fips,
      identifier: fips,
      onsets: +infections,
      onsetsPC: +infectionsPC,
      r0: +Rt,
    })
  );
  return result;
}

export const OverviewMapSuper = React.forwardRef((props, ref) => {
  const [mapData, setMapData] = useState(null);
  const [dataLoadProgress, setDataLoadProgress] = useState(0);
  const [dataIsLoaded, setDataIsLoaded] = useState(false);

  const [dateMinMax, setDateMinMax] = useState([null, null]);
  const [dateToDisplay, setDateToDisplay] = useState(null);

  const [mapBoundaries, setMapBoundaries] = useState(null);
  const [boundsIsLoaded, setBoundsIsLoaded] = useState(false);

  let cookieFips = Util.getCookie("fips")
    ? decodeURIComponent(Util.getCookie("fips"))
        .split(",")
        .map((d) => _.zipObject(["fips", "name", "state"], d.split("+")))
    : [];

  const [hoverFips, setHoverFips] = useState([]);
  const [fips, setFips] = useState(cookieFips);

  const url =
    "https://covidestim.s3.us-east-2.amazonaws.com/latest/summary.pack.gz";
  const albersURL =
    "https://covidestim.s3.us-east-2.amazonaws.com/counties-albers-10m.json";

  const clearFips = () => {
    setFips([]);
    document.cookie = `fips=${encodeURIComponent("")}`;
  };

  let addFips = (info) => {
    if (_.findIndex(fips, (d) => info.fips === d.fips) === -1) {
      const newFips = fips.concat([info]);
      setFips(newFips);

      const str = newFips
        .map((d) => [d.fips, d.name, d.state].join("+"))
        .join(",");

      document.cookie = `fips=${encodeURIComponent(str)}`;
    }
  };

  let addHoverFips = (info) => {
    setHoverFips([info]);
  };

  let addHoverFipsThrottled = useMemo(
    (info) => _.throttle(addHoverFips, 500),
    []
  );

  let removeFips = (fipsToRemove) => {
    const newFips = _.filter(fips, (f) => f.fips !== fipsToRemove);
    setFips(newFips);

    const str = newFips
      .map((d) => [d.fips, d.name, d.state].join("+"))
      .join(",");

    document.cookie = `fips=${encodeURIComponent(str)}`;
  };

  useEffect(() => {
    const config = {
      onDownloadProgress: function (e) {
        setDataLoadProgress(e.loaded / 10000000);
      },
      responseType: "arraybuffer",
    };
    axios.get(url, config).then(
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

  const svgWidth = contentWidth;
  let svgHeight = Math.floor(Math.min(550, 0.33 * contentWidth));

  if (svgWidth < 500) svgHeight = svgWidth;

  let sliderMarks = ([min, max]) => {
    let months = eachWeekOfInterval({
      start: new Date(min),
      end: new Date(max),
    });

    if (svgWidth < 500) months = _.filter(months, (d) => d.getUTCDate() < 8);

    // Allow tick marks on the slider for months if on a mobile device, and
    // weeks if on a wider-screen device
    let monthsFormatted = _.zipObject(
      _.map(months, toEpoch),
      _.map(months, (d, i) => {
        if (d.getUTCDate() < 8 && i < 2 && props.width > 768)
          return <strong>{utcFormat("%b")(d) + " '20"}</strong>;
        else if (
          d.getUTCDate() < 8 &&
          d.getMonth() === 0 &&
          d.getFullYear() === 2021 &&
          props.width > 768
        )
          return <strong>Jan '21</strong>;
        else if (d.getUTCDate() < 8 && svgWidth >= 500)
          return utcFormat("%b")(d);
        else if (d.getUTCDate() < 8 && svgWidth < 500 && i % 2 === 0)
          return utcFormat("%b")(d);
        else return "";
      })
    );

    // Add on day-name of latest date of model data
    // monthsFormatted[toEpoch(max)] = dateFormat(new Date(max), "eee");
    if (svgWidth >= 500)
      monthsFormatted[toEpoch(max)] = utcFormat("%a")(new Date(max));
    else monthsFormatted[toEpoch(max)] = "";

    return monthsFormatted;
  };

  if (dataIsLoaded && boundsIsLoaded && contentWidth) {
    return (
      <Fragment>
        <div className="rt-container-wrapper-map">
          <Col size={24} align="center" ref={ref}>
            <OverviewMapChart
              data={data}
              width={svgWidth}
              height={svgHeight}
              addFips={addFips}
              addHoverFips={addHoverFipsThrottled}
              dateToDisplay={dateToDisplay}
              selectedOutcome={props.selectedOutcome}
              marginLeft={0}
            />
          </Col>
        </div>
        <div className="rt-container-wrapper">
          <div className="rt-container rt-container-wide">
            <Row className="stacked-states-outer">
              <Col size={24}>
                <Slider
                  marks={sliderMarks(dateMinMax)}
                  step={null}
                  defaultValue={toEpoch(dateMinMax[1])}
                  tooltipVisible={true}
                  min={toEpoch(dateMinMax[0])}
                  max={toEpoch(dateMinMax[1])}
                  tipFormatter={(epoch) => {
                    const d = new Date(epoch * 24 * 3600 * 1000);
                    const md = utcFormat("%b %d")(d);

                    const diff = differenceInDays(new Date(), d);

                    if (diff <= 40) return `${md}, ${diff}d ago`;

                    return md;
                  }}
                  onChange={handleSliderChange}
                />
              </Col>
              <Col size={props.colsPerChart}>
                <AddCounty addFips={addFips} />
                {fips.length > 1 && (
                  <Button onClick={clearFips} type="dashed" danger>
                    Clear all counties
                  </Button>
                )}
              </Col>
              {!props.isSmallScreen && (
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
                  dateBounds={props.dateBounds}
                />
              )}
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
                dateBounds={props.dateBounds}
              />
            </Row>
          </div>
        </div>
      </Fragment>
    );
  } else {
    return (
      <Col size={24} ref={ref}>
        <div style={{ margin: "50px" }}>
          <Spin
            size="large"
            tip={
              <>
                <p>
                  {boundsIsLoaded ? <strong>Loaded</strong> : "Loading"}{" "}
                  boundaries
                </p>
                <p>
                  {dataIsLoaded ? <strong>Loaded</strong> : "Loading"} model
                  data{" "}
                  {dataIsLoaded
                    ? ""
                    : `(${
                        parseFloat(100 * dataLoadProgress).toFixed(0) + "%"
                      })`}
                </p>
              </>
            }
          />
        </div>
      </Col>
    );
  }
});

export default OverviewMapSuper;

let modeMap = function (modes) {
  return _.map(modes, (mode) => {
    if (mode === "True infections") return "True infections no UI";
    if (mode === "True infections no UI") return mode;

    if (mode === "True infections per 100k")
      return "True infections per 100k no UI";
    if (mode === "True infections per 100k no UI") return mode;

    if (mode === "Infection rate") return "Infection rate no UI";
    if (mode === "Infection rate no UI") return mode;

    if (mode === "Seroprevalence") return "Seroprevalence no UI";
    if (mode === "Seroprevalence no UI") return mode;

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
      console.log("changing metric to");
      console.log(modeMap(nextProps.selectedOutcome.enabledModes));
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

export function TrayCharts(props) {
  function mapModes(selectedOutcome) {
    return modeMap(selectedOutcome.enabledModes);
  }

  let modes = mapModes(props.selectedOutcome);
  let refsByFIPS = {};

  const countyCharts = _.map(props.selectedCounties, (county, i) => (
    <TrayChartsItem
      county={county}
      i={i}
      colsPerChart={props.colsPerChart}
      align={props.align}
      spacerOffset={props.spacerOffset}
      rowCount={props.rowCount}
      isSmallScreen={props.isSmallScreen}
      modes={modes}
      contentWidth={props.contentWidth}
      selectedOutcome={props.selectedOutcome}
      isHover={props.isHover}
      handleRemoveFIPS={props.handleRemoveFIPS}
      ref={refsByFIPS[county.fips] || React.createRef()}
      dateBounds={props.dateBounds}
    />
  ));

  if (props.selectedCounties.length === 0) return null;
  else return [...countyCharts];
}
///////////////
///////////////
///////////////
///////////////
function TrayChartsItem({
  county,
  i,
  colsPerChart,
  align,
  spacerOffset,
  rowCount,
  ref,
  isSmallScreen,
  modes,
  contentWidth,
  isHover,
  selectedOutcome,
  handleRemoveFIPS,
  dateBounds,
}) {
  const fips = county.fips;

  const { data, error } = useCountyResults(fips);

  if (!data)
    return (
      <Col
        key={`${fips},loading`}
        size={colsPerChart}
        align={align}
        offset={align === "center" ? spacerOffset : 0}
      >
        <div className="stacked-state-wrapper">
          <div style={{ margin: 50 }}>
            <Spin size="large" />
          </div>
        </div>
      </Col>
    );

  if (!data.length)
    return (
      <Col
        key={`${fips},nope`}
        size={colsPerChart}
        align={align}
        offset={align === "center" ? spacerOffset : 0}
      >
        <div className="stacked-state-wrapper">
          <Alert
            message="Error"
            type="error"
            message={`We have no results for ${county.name}`}
            showIcon
            style={{ margin: 5, cursor: "pointer" }}
            onClick={(e) => handleRemoveFIPS && handleRemoveFIPS(fips)}
          />
        </div>
      </Col>
    );

  const reformattedData = {
    identifier: fips,
    series: identifyAndTransformLatestRun(data),
  };

  const stateAbbr = Util.abbrState(county.state, "abbr");

  var align;
  switch (i % rowCount) {
    case 0:
      align = "left";
      break;
    case rowCount - 1:
      align = "right";
      break;
    default:
      align = "center";
      break;
  }

  return (
    <Col
      key={`${fips},${isHover ? "-1" : "-0"}`}
      size={colsPerChart}
      align={align}
      offset={align === "center" ? spacerOffset : 0}
    >
      <div className="stacked-state-wrapper">
        <StateR0Display
          ref={ref || React.createRef()}
          config={null}
          stateInitials={stateAbbr}
          subArea={`${county.name}`}
          fips={fips}
          highlight={false}
          hasOwnRow={isSmallScreen}
          data={reformattedData}
          enabledModes={modes}
          yDomain={selectedOutcome.yDomainCounty || selectedOutcome.yDomain}
          contentWidth={contentWidth}
          state={false}
          removeButton={handleRemoveFIPS ? (e) => handleRemoveFIPS(fips) : null}
          dateBounds={dateBounds}
        />
      </div>
    </Col>
  );
}
