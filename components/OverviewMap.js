import "styles/App.scss";
import _ from "lodash";
import React, { useState, useEffect, useRef } from "react";
import DataFetcher from "lib/DataFetcher";
import axios from "axios";
import { decode } from "@ygoe/msgpack";

import { LegendContainer, RTSubareaChart } from "./RTSubareaChart";

import OverviewMap from "visualization/OverviewMap";

export function OverviewMapSuper(props) {
  const [mapData, setMapData] = useState(null);
  const [dataIsLoaded, setDataIsLoaded] = useState(false);

  const [mapBoundaries, setMapBoundaries] = useState(null);
  const [boundsIsLoaded, setBoundsIsLoaded] = useState(false);

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

  if (dataIsLoaded && boundsIsLoaded) {
    return <OverviewMapChart data={data} width={975} height={610} />;
  } else {
    return <div>Loading map...</div>;
  }
}

export default OverviewMapSuper;

export class OverviewMapChart extends RTSubareaChart {
  constructor(props) {
    super(props);
    this._vizClass = OverviewMap;
    this.overflow = "hidden";
  }

  renderLegend() {
    return <LegendContainer>Lol</LegendContainer>;
  }

  handleMouseover(data) {
    console.log("handleMouseover(data) called");
  }
}
