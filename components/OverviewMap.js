import "styles/App.scss";
import _ from "lodash";
import React, { useState, useEffect, useRef } from "react";
import DataFetcher from "lib/DataFetcher";
import axios from "axios";
import { decode } from "@ygoe/msgpack";

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

export const OverviewMapSuper = React.forwardRef((props, ref) => {
  const [mapData, setMapData] = useState(null);
  const [dataIsLoaded, setDataIsLoaded] = useState(false);

  const [mapBoundaries, setMapBoundaries] = useState(null);
  const [boundsIsLoaded, setBoundsIsLoaded] = useState(false);

  const [fips, setFips] = useState(null);

  const url = "https://covidestim.s3.us-east-2.amazonaws.com/map-demo.pack.gz";
  const albersURL =
    "https://covidestim.s3.us-east-2.amazonaws.com/counties-albers-10m.json";

  useEffect(() => {
    axios.get(url, { responseType: "arraybuffer" }).then(
      (result) => {
        let decoded = decode(result.data);

        setMapData(decoded);
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

  if (dataIsLoaded && boundsIsLoaded && contentWidth) {
    return (
      <div ref={ref}>
        <OverviewMapChart
          data={data}
          width={contentWidth}
          height={Math.floor(0.625 * contentWidth)}
          setFips={setFips}
        />
        {fips && <span>{fips}</span>}
      </div>
    );
  } else {
    return <div ref={ref}> it's not loaded </div>;
  }
});

export default OverviewMapSuper;

export class OverviewMapChart extends RTSubareaChart {
  constructor(props) {
    super(props);
    this._vizClass = OverviewMap;
    this.overflow = "hidden";
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (
      this.props.width != nextProps.width ||
      this.props.height != nextProps.height
    )
      return true;

    if (this.state != nextState) return true;

    return false;
  }

  renderLegend() {
    return <LegendContainer>Lol</LegendContainer>;
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
        <TooltipStat color={"blue"}>{this._numberFormat(1337)}</TooltipStat>
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
