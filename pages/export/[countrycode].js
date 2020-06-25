import "styles/export.scss";
import _ from "lodash";
import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { Title } from "components/Typography";
import { Row, Col } from "components/Grid";
import PageConfig from "config/PageConfig";
import DataFetcher from "lib/DataFetcher";
import { StateRtChart } from "components/StateRtChart";
import Constants from "lib/Constants";
import { Util } from "lib/Util";

export async function getStaticPaths() {
  let active = _.keys(PageConfig);
  return {
    fallback: false,
    paths: active.map((country) => {
      return {
        params: {
          countrycode: country,
        },
      };
    }),
  };
}

export async function getStaticProps({ params }) {
  return {
    props: {
      countrycode: params.countrycode,
    },
  };
}

function getModelOverride() {
  let queryParams = Util.getQueryParams(document.location.search);
  return queryParams.model;
}

export default function RTExportPage(props) {
  const [rtData, setRTData] = useState(null);
  const [config, setConfig] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (!config && (router.query.countrycode || props.countryCode)) {
      const countryCode = (
        router.query.countrycode || props.countryCode
      ).toLowerCase();
      setConfig(PageConfig[countryCode]);
    }
  }, [config]);

  useEffect(() => {
    if (!config) {
      return;
    }
    new DataFetcher(config).fetchLatest(getModelOverride()).then(
      (rtData) => setRTData(rtData),
      (err) => console.log(err)
    );
  }, [config]);

  if (!rtData) {
    return null;
  }

  let subArea = router.query.subarea.toUpperCase();

  let subareaData = rtData.dataSeries[subArea];
  if (!subareaData) {
    return;
  }
  let metricEntry = _.nth(
    subareaData.series,
    -1 * (1 + Constants.daysOffsetSinceEnd)
  );
  let lastRT = metricEntry.r0;
  let rT = format(".2f")(lastRT);
  let lastModelRun = timeFormat("%B %d")(rtData.modelLastRunDate);
  let component = (
    <Row className="export-single-area image-me" data-image-key={subArea}>
      <Col className="export-details" size={12}>
        <p className="export-last-run">{lastModelRun}</p>
        <p className="export-url">https://rt.live</p>

        <p className="export-title">{config.subAreas[subArea]}</p>
        <p
          className="export-rt-number"
          style={{ color: Util.colorCodeRt(subArea, lastRT) }}
        >
          R<sub>t</sub> {rT}
        </p>
        <p className="export-explanation">
          This is a measure of how many people become infected by each infected
          person in this location. Values below 1 mean the virus&rsquo; spread
          will slow down.
        </p>
      </Col>
      <Col className="export-chart" size={12}>
        <StateRtChart
          data={subareaData}
          yAxisPosition="inside"
          isHovered={true}
          width={280}
          height={260}
          xAxisPosition="inside"
        />
      </Col>
    </Row>
  );

  return <div style={{ width: 600 }}>{component}</div>;
}
