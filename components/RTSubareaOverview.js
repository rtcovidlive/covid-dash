import React, { useState, useContext, useEffect, useLayoutEffect } from "react";
import styled from "styled-components";
import Dropdown from "./Dropdown";
import Link from "next/link";
import { Navigation } from "../lib/Navigation";
import { RTFooter } from "./RTFooter";
import _ from "lodash";
import { format } from "d3-format";
import { Row, Col } from "./Grid";
import { Title } from "./Typography";
import { DataFetchContext } from "lib/DataFetchContext";
import { StateRtChart } from "./StateRtChart";
import { TestAdjustedChart } from "./TestAdjustedChart";
import { CaseGrowthChart } from "./CaseGrowthChart";
import { ShareButtons } from "./ShareButtons";
import "../styles/subarea.scss";
import { Util } from "lib/Util";
import Constants from "lib/Constants";

const rtRef = React.createRef();

const Header = styled.div`
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
`;

const HeaderRow = styled(Row)`
  margin: 30px 0px 0px 0px;
  @media (max-width: 768px) {
    margin: 20px 0px 0px 0px;
  }
`;

const SubareaName = styled(Title)`
  font-size: 42px;
  margin-left: -3px;
  @media (max-width: 768px) {
    font-size: 28px;
    margin-top: 6px;
  }
`;

const Explanation = styled.p`
  margin: 0px 0px 10px 0px;
`;

const ChartTitle = styled(Title)`
  margin-top: 28px;
  margin-bottom: 6px;
  font-weight: bold;
  font-size: 18px;
`;

const StatLabel = styled.p`
  margin: 0px;
  font-size: 14px;
  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const StatNumber = styled.p`
  font-weight: 800;
  font-size: 22px;
  margin: 0px 0px 2px 0px;
  color: ${(props) => props.color || "rgba(0,0,0,1.0)"};
  @media (max-width: 768px) {
    font-size: 20px;
  }
`;
const StatContent = styled.div`
  padding: 20px 0px 0px 0px;
  line-height: 1.35;
  background-color: ${(props) => props.backgroundColor || "#FFF"};
  @media (max-width: 768px) {
    padding: 10px 0px 0px 0px;
  }
`;

const RTChartWrapper = styled.div`
  position: relative;
  left: -30px;
`;

function addCumulativeSum(series, key) {
  var running = 0;
  for (var i = 0; i < series.length; i++) {
    let entry = series[i];
    running = entry[key] + running;
    entry[key + "_cumulative"] = running;
  }
}

function StatRow(props) {
  let series = _(props.data.series);
  addCumulativeSum(props.data.series, "tests_new");
  addCumulativeSum(props.data.series, "cases_new");
  var numFormat = format(",.0f");
  if (props.width < 768) {
    numFormat = (num) => {
      if (num > 1000000) {
        return format(".1f")(num / 1000000) + "M";
      } else if (num > 10000) {
        return Math.floor(num / 1000) + "K";
      } else if (num > 1000) {
        return format(".1f")(num / 1000) + "K";
      } else {
        return num;
      }
    };
  }
  let offsetRtEntry = series.nth(-1 * (Constants.daysOffsetSinceEnd + 1));
  let lastRt = format(".2f")(offsetRtEntry.r0);
  let testsTotal = numFormat(series.sumBy((e) => e.tests_new));
  let positiveTotal = numFormat(series.sumBy((e) => e.cases_new));
  let colsPerStat = 8;
  return (
    <Row style={{ maxWidth: 500 }}>
      <Col size={colsPerStat}>
        <StatContent round="left">
          <StatLabel>
            Current R<sub>t</sub>
          </StatLabel>
          <StatNumber color={Util.colorCodeRt(props.subarea, lastRt)}>
            {lastRt}
          </StatNumber>
        </StatContent>
      </Col>
      <Col size={colsPerStat}>
        <StatContent>
          <StatLabel>
            Cases{" "}
            <span style={{ visibility: "hidden" }}>
              <sub>t</sub>
            </span>
          </StatLabel>
          <StatNumber>{positiveTotal}</StatNumber>
        </StatContent>
      </Col>
      <Col size={colsPerStat}>
        <StatContent>
          <StatLabel>
            Tests{" "}
            <span style={{ visibility: "hidden" }}>
              <sub>t</sub>
            </span>
          </StatLabel>
          <StatNumber>{testsTotal}</StatNumber>
        </StatContent>
      </Col>
    </Row>
  );
}

export function RTSubareaOverview(props) {
  const rtData = useContext(DataFetchContext);
  const config = props.config;
  const [contentWidth, setContentWidth] = useState(null);

  let isSmallScreen = props.width <= 768;
  let chartHeight = isSmallScreen ? 280 : 350;
  let maxWidth = 980;
  let areaName = config.subAreas[props.subarea];
  let subAreaData = rtData.dataSeries[props.subarea];

  useLayoutEffect(() => {
    if (rtRef.current) {
      setContentWidth(rtRef.current.getBoundingClientRect().width);
    }
  }, [rtRef.current, props.width]);
  useLayoutEffect(() => {
    window.twttr && window.twttr.widgets.load();
    window.FB && window.FB.XFBML.parse();
  });
  let navigationQuery = Util.getNavigationQuery(document.location.search);
  let subareaMenuItems = [
    { key: "_overall", label: "Overall U.S." },
    ..._.map(config.subAreas, (val, key) => {
      return {
        key: key,
        label: val,
      };
    }),
  ];

  let shareRowOnTop = isSmallScreen;
  let shareOptions = (
    <Col
      size={shareRowOnTop ? 24 : 12}
      textAlign={shareRowOnTop ? "left" : "right"}
      verticalAlign="bottom"
    >
      <ShareButtons
        align={shareRowOnTop ? "left" : "right"}
        subarea={props.subarea}
        href={`https://rt.live/${props.config.code}/${props.subarea}?t=${rtData.modelLastRunDate.getTime()/1000}`}
      />
    </Col>
  );

  return (
    <>
      <div className="rt-container-wrapper">
        <div
          style={{ maxWidth: maxWidth }}
          className={
            "rt-container " +
            (isSmallScreen ? "rt-container-small" : "rt-container-wide")
          }
        >
          <div ref={rtRef} className="rt-subarea-page-inner">
            <Header>
              <HeaderRow>
                {shareRowOnTop && shareOptions}
                <Col size={shareRowOnTop ? 24 : 12}>
                  <Dropdown
                    options={subareaMenuItems}
                    minWidth={220}
                    onSelect={(e) => {
                      if (e.key === "_overall") {
                        Navigation.navigateToAreaOverview(
                          props.config.code,
                          document.location.search
                        );
                      } else {
                        Navigation.navigateToSubArea(
                          props.config.code,
                          e.key,
                          document.location.search
                        );
                      }
                    }}
                  >
                    <SubareaName level={1}>
                      {areaName}

                      <span
                        style={{ fontSize: "0.6em", marginLeft: 5 }}
                        className="icon-caret-down"
                      />
                    </SubareaName>
                  </Dropdown>
                </Col>
                {!shareRowOnTop && shareOptions}
              </HeaderRow>
              <StatRow
                config={config}
                data={subAreaData}
                width={contentWidth}
                subarea={props.subarea}
                isSmallScreen={isSmallScreen}
              />
            </Header>
            <ChartTitle level={2}>
              Effective Reproduction Rate &middot; R<sub>t</sub>
            </ChartTitle>
            <Explanation>
              R<sub>t</sub> is the average number of people who become infected
              by an infectious person. If it&rsquo;s above 1.0, COVID-19 will
              spread quickly. If it&rsquo;s below 1.0, infections will slow.{" "}
              <Link href="/faq" as="/faq">
                <a>Learn More</a>
              </Link>
              .{" "}
            </Explanation>
            {contentWidth && (
              <RTChartWrapper>
                <StateRtChart
                  data={subAreaData}
                  width={contentWidth + 40}
                  height={chartHeight}
                  drawOuterBorder={false}
                  yAxisPosition="left"
                  isHovered={true}
                  isOwnPage={true}
                />
              </RTChartWrapper>
            )}
            <ChartTitle level={2}>Positive Tests</ChartTitle>
            {contentWidth && (
              <CaseGrowthChart
                data={subAreaData}
                width={contentWidth + 40}
                height={chartHeight + 120}
              />
            )}
            <ChartTitle level={2}>
              Adjusted Positive Tests & Implied Infections
            </ChartTitle>
            <Explanation>
              We adjust positive tests for the number of tests done. Then, we
              calculate an implied infection curve. This uses a known
              distribution of how much time passes between infection and a
              confirmed positive report.
            </Explanation>
            {contentWidth && (
              <TestAdjustedChart
                data={subAreaData}
                width={contentWidth + 40}
                height={chartHeight + 80}
              />
            )}
          </div>
        </div>
      </div>
      <RTFooter maxWidth={maxWidth} />
    </>
  );
}
