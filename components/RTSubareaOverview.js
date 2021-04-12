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
import { CountyMetricChart, CountyInputChart } from "./CountyMetricChart";
import { CountyTestAdjustedChart } from "./CountyTestAdjustedChart";
import { TestAdjustedChart } from "./TestAdjustedChart";
import { CaseGrowthChart } from "./CaseGrowthChart";
import { ShareButtons } from "./ShareButtons";
import "../styles/subarea.scss";
import { Util } from "lib/Util";
import Constants from "lib/Constants";
import { Switch } from "antd";
import "../styles/antd.scss";
import { useCountyResults, useInputData } from "../lib/data";

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

const SubHeaderRow = styled(Row)`
  margin: 5px 0px 0px 0px;
  @media (max-width: 768px) {
    margin: 5px 0px 0px 0px;
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

const CountyName = styled(Title)`
  display: block;
  font-size: 28px;
  margin-left: -3px;
  @media (max-width: 768px) {
    font-size: 18px;
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

const StatLabel = styled.div`
  margin: 0px;
  font-size: 14px;
  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

const StatUnit = styled(StatLabel)`
  font-weight: normal;
  color: rgb(180, 180, 180);
  font-size: 12px;
`;

const StatNumber = styled.p`
  font-weight: 800;
  font-size: 22px;
  display: inline-block;
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

function CountyLatestResults(countyData) {
  if (!countyData || countyData.length === 0) return null;

  const maxDate = _.maxBy(countyData, "run.date")["run.date"];

  return _.filter(countyData, (d) => d["run.date"] === maxDate);
}

function CountyStatRowNumbers(countyData) {
  if (!countyData || countyData.length === 0) return null;

  const mostRecentCountyData = CountyLatestResults(countyData);

  return _.maxBy(mostRecentCountyData, "date");
}

function StateStatRow(props) {
  let series = _(props.data.series);
  addCumulativeSum(props.data.series, "tests_new");
  addCumulativeSum(props.data.series, "cases_new");
  var numFormat = format(",.0f");
  if (true || props.width < 768) {
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

  let positiveTotalRaw = series.sumBy((e) => e.cases_new);
  let positiveTotal = numFormat(positiveTotalRaw);

  let infectionsTotalRaw = series.sumBy((e) => e.onsets);
  let infectionsTotal = numFormat(infectionsTotalRaw);

  let infectionRate = format(".1f")(offsetRtEntry.onsetsPC);
  let colsPerStat = 6;
  return (
    <Row style={{ maxWidth: 700 }}>
      <Col size={colsPerStat}>
        <StatContent round="left">
          <StatLabel>
            State R<sub>t</sub>
          </StatLabel>
          <StatNumber color={Util.colorCodeRt(props.subarea, lastRt)}>
            {lastRt}
          </StatNumber>
        </StatContent>
      </Col>
      <Col size={colsPerStat}>
        <StatContent>
          <StatLabel>
            State infection rate{" "}
            <span style={{ visibility: "hidden" }}>
              <sub>t</sub>
            </span>
          </StatLabel>
          <StatNumber>
            {infectionRate}
            <StatUnit>inf/100k/day</StatUnit>
          </StatNumber>
        </StatContent>
      </Col>
      <Col size={colsPerStat}>
        <StatContent>
          <StatLabel>
            Total state cases{" "}
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
            Total state infections{" "}
            <span style={{ visibility: "hidden" }}>
              <sub>t</sub>
            </span>
          </StatLabel>
          <StatNumber>
            {infectionsTotal}{" "}
            <StatUnit>
              ({format(".2f")(infectionsTotalRaw / positiveTotalRaw)}x
              diagnoses)
            </StatUnit>
          </StatNumber>
        </StatContent>
      </Col>
    </Row>
  );
}

function CountyStatRow(props) {
  const {
    showHistory,
    setShowHistory,
    showNeighbors,
    setShowNeighbors,
  } = props;

  var numFormat = format(",.0f");
  if (true || props.width < 768) {
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

  const countyStats = CountyStatRowNumbers(props.countyData);
  const latestResults = CountyLatestResults(props.countyData);

  if (!countyStats || !props.countyInputData)
    return <Row style={{ maxWidth: 700 }}></Row>;

  let series = _(latestResults);
  let inputSeries = _(props.countyInputData);

  console.log(latestResults);
  let lastCountyRt = countyStats && format(".2f")(countyStats.Rt);

  let positiveTotalRaw = inputSeries.sumBy((e) => Number(e.cases));
  let positiveTotal = numFormat(inputSeries.sumBy((e) => Number(e.cases)));
  let infectionsTotalRaw = series.sumBy((e) => Number(e.infections));
  let infectionsTotal = numFormat(series.sumBy((e) => Number(e.infections)));
  let infectionRate = format(".1f")(countyStats.infectionsPC);
  let colsPerStat = 6;
  return (
    <>
      <Row style={{ maxWidth: 700 }}>
        {countyStats && (
          <Col size={colsPerStat}>
            <StatContent round="left">
              <StatLabel>
                County R<sub>t</sub>
              </StatLabel>
              <StatNumber color={Util.colorCodeRt(props.subarea, lastCountyRt)}>
                {lastCountyRt}
              </StatNumber>
            </StatContent>
          </Col>
        )}
        <Col size={colsPerStat}>
          <StatContent>
            <StatLabel>
              County infection rate{" "}
              <span style={{ visibility: "hidden" }}>
                <sub>t</sub>
              </span>
            </StatLabel>
            <StatNumber>{infectionRate}</StatNumber>
          </StatContent>
        </Col>
        <Col size={colsPerStat}>
          <StatContent>
            <StatLabel>Total county cases</StatLabel>
            <StatNumber>{positiveTotal}</StatNumber>
          </StatContent>
        </Col>
        <Col size={colsPerStat}>
          <StatContent>
            <StatLabel>
              Total county infections{" "}
              <span style={{ visibility: "hidden" }}>
                <sub>t</sub>
              </span>
            </StatLabel>
            <StatNumber>
              {infectionsTotal}{" "}
              <StatUnit>
                ({format(".2f")(infectionsTotalRaw / positiveTotalRaw)}x
                diagnoses)
              </StatUnit>
            </StatNumber>
          </StatContent>
        </Col>
      </Row>
      <Row style={{ maxWidth: 625 }}>
        <Col size={colsPerStat}>
          <StatContent>
            <StatLabel>Show history? </StatLabel>
            <StatNumber>
              <Switch
                checked={showHistory}
                onClick={(e) => setShowHistory(!showHistory)}
              />
            </StatNumber>
          </StatContent>
        </Col>
        <Col size={colsPerStat}>
          <StatContent>
            <StatLabel>Show neighbors? </StatLabel>
            <StatNumber>
              <Switch
                checked={showNeighbors}
                onClick={(e) => setShowNeighbors(!showNeighbors)}
              />
            </StatNumber>
          </StatContent>
        </Col>
      </Row>
    </>
  );
}

export function RTSubareaOverview(props) {
  const rtData = useContext(DataFetchContext);
  const config = props.config;
  const [contentWidth, setContentWidth] = useState(null);
  const [lastDrawLocation, setLastDrawLocation] = useState(null);

  // Show estimate history, and show latest result from all neighboring counties?
  const [showHistory, setShowHistory] = useState(false);
  const [showNeighbors, setShowNeighbors] = useState(false);

  const { data: countyData, error: countyDataError } = useCountyResults(
    props.fips
  );
  const { data: countyInputs, error: countyInputsError } = useInputData(
    props.fips
  );

  let isSmallScreen = props.width <= 768;
  let chartHeight = isSmallScreen ? 280 : 350;
  let maxWidth = 980;

  let areaName = config.subAreas[props.subarea];
  let countyName = props.fips
    ? config.counties[props.fips].county
    : `Overall ${props.subarea}`;

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

  let countyMenuItems = [
    {
      key: "_overall",
      abbr: props.subarea.toUpperCase(),
      label: `Overall ${props.subarea}`,
    },
    ..._.map(
      _.keyBy(
        _.filter(config.counties, (d) => d.abbr == props.subarea.toUpperCase()),
        (d) => d.fips
      ),
      (val, key) => {
        return {
          key: key,
          abbr: val.abbr,
          label: val.county,
        };
      }
    ),
  ];

  let nameLength = areaName.length;
  let shareRowOnTop = isSmallScreen && nameLength > 9;
  let shareOptions = (
    <Col
      size={shareRowOnTop ? 24 : 12}
      textAlign={shareRowOnTop ? "left" : "right"}
      verticalAlign="bottom"
    >
      <ShareButtons
        align={shareRowOnTop ? "left" : "right"}
        href={`https://covidestim.org/${props.config.code}/${props.subArea}`}
      />
    </Col>
  );

  const routeToFIPS = (abbr, fips) => {
    Navigation.navigateToCounty(
      props.config.code,
      abbr,
      fips,
      document.location.search
    );
  };

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
              <SubHeaderRow>
                <Col size={24}>
                  {true && (
                    <Dropdown
                      options={countyMenuItems}
                      minWidth={220}
                      onSelect={(e) => {
                        if (e.key === "_overall") {
                          Navigation.navigateToSubArea(
                            props.config.code,
                            e.abbr,
                            document.location.search
                          );
                        } else {
                          Navigation.navigateToCounty(
                            props.config.code,
                            e.abbr,
                            e.key,
                            document.location.search
                          );
                        }
                      }}
                    >
                      <CountyName level={1}>
                        {countyName}

                        <span
                          style={{ fontSize: "0.6em", marginLeft: 5 }}
                          className="icon-caret-down"
                        />
                      </CountyName>
                    </Dropdown>
                  )}
                </Col>
              </SubHeaderRow>
              <StateStatRow
                config={config}
                data={subAreaData}
                width={contentWidth}
                subarea={props.subarea}
                isSmallScreen={isSmallScreen}
                showHistory={showHistory}
                setShowHistory={setShowHistory}
                showNeighbors={showNeighbors}
                setShowNeighbors={setShowNeighbors}
              />
              {props.fips && (
                <CountyStatRow
                  config={config}
                  data={subAreaData}
                  countyData={countyData}
                  countyInputData={countyInputs}
                  width={contentWidth}
                  subarea={props.subarea}
                  isSmallScreen={isSmallScreen}
                  showHistory={showHistory}
                  setShowHistory={setShowHistory}
                  showNeighbors={showNeighbors}
                  setShowNeighbors={setShowNeighbors}
                />
              )}
            </Header>
            <ChartTitle level={2}>
              Effective Reproduction Number &middot; R<sub>t</sub>
            </ChartTitle>
            <Explanation>
              R<sub>t</sub> is the average number of people who will become
              infected by a person infected at time t. If it&rsquo;s above 1.0,
              COVID-19 cases will increase in the near future. If it&rsquo;s
              below 1.0, COVID-19 cases will decrease in the near future.
            </Explanation>
            {!props.fips && contentWidth && (
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
            {props.fips && contentWidth && (
              <RTChartWrapper>
                <CountyMetricChart
                  measure={"Rt"}
                  showNeighbors={showNeighbors}
                  showHistory={showHistory}
                  fips={props.fips}
                  width={contentWidth + 40}
                  height={chartHeight}
                  lastDrawLocation={lastDrawLocation}
                  setLastDrawLocation={setLastDrawLocation}
                  routeToFIPS={routeToFIPS}
                />
              </RTChartWrapper>
            )}
            <ChartTitle level={2}>Infections per capita</ChartTitle>
            <Explanation>
              Infections per capita is our best estimate of how many individuals
              get infected every day - including infections which are never
              diagnosed through testing and never manifest in testing data. This
              estimate is presented as infections, per 100,000 individuals, per
              day.
            </Explanation>
            {props.fips && contentWidth && (
              <RTChartWrapper>
                <CountyMetricChart
                  measure={"infectionsPC"}
                  showNeighbors={showNeighbors}
                  showHistory={showHistory}
                  fips={props.fips}
                  width={contentWidth + 40} // + 40}
                  height={chartHeight} //}
                  lastDrawLocation={lastDrawLocation}
                  setLastDrawLocation={setLastDrawLocation}
                  routeToFIPS={routeToFIPS}
                />
              </RTChartWrapper>
            )}
            {!props.fips && contentWidth && (
              <>
                <ChartTitle level={2}>Positive Tests</ChartTitle>
                <CaseGrowthChart
                  data={subAreaData}
                  width={contentWidth + 40}
                  height={chartHeight + 120}
                />
              </>
            )}
            <ChartTitle level={2}>Percent Ever Infected</ChartTitle>
            <Explanation>
              Percent ever infected is our estimate of the number of individuals
              in the county or state popululation who have been infected at
              least once with COVID-19.
            </Explanation>
            {props.fips && contentWidth && (
              <RTChartWrapper>
                <CountyMetricChart
                  measure={"PEI"}
                  showNeighbors={showNeighbors}
                  showHistory={showHistory}
                  fips={props.fips}
                  width={contentWidth + 40} // + 40}
                  height={chartHeight} //}
                  lastDrawLocation={lastDrawLocation}
                  setLastDrawLocation={setLastDrawLocation}
                  routeToFIPS={routeToFIPS}
                />
              </RTChartWrapper>
            )}
            {!props.fips && contentWidth && (
              <>
                <ChartTitle level={2}>Positive Tests</ChartTitle>
                <RTChartWrapper>
                  <CaseGrowthChart
                    data={subAreaData}
                    width={contentWidth + 40}
                    height={chartHeight + 120}
                  />
                </RTChartWrapper>
              </>
            )}
            {props.fips && contentWidth && (
              <>
                <ChartTitle level={2}>Model input data</ChartTitle>
                <Explanation>
                  The case (top) and death (bottom) data used in the latest
                  model run. Retrospective to this data are common to correct
                  previous errors, fix reporting delays, and sometimes include
                  other types of testing data.
                </Explanation>
                <RTChartWrapper>
                  <CountyInputChart
                    fips={props.fips}
                    measure={"cases"}
                    width={contentWidth + 40}
                    height={(chartHeight + 120) / 2}
                    lastDrawLocation={lastDrawLocation}
                    setLastDrawLocation={setLastDrawLocation}
                  />
                </RTChartWrapper>
                <RTChartWrapper>
                  <CountyInputChart
                    fips={props.fips}
                    measure={"deaths"}
                    width={contentWidth + 40}
                    height={(chartHeight + 120) / 2}
                    lastDrawLocation={lastDrawLocation}
                    setLastDrawLocation={setLastDrawLocation}
                  />
                </RTChartWrapper>
              </>
            )}
            <ChartTitle level={2}>
              Infections, fitted cases, and case data
            </ChartTitle>
            <Explanation>
              This chart shows how our estimated number of infections (blue)
              compares to raw case data, and to a fit of the case data produced
              during model execution. Here, you can see the effects of reporting
              delays as the "shift" between infections and fitted cases, and you
              can see the degree of case underascertainment as the gap between
              the testing data and the infections curve.
            </Explanation>
            {props.fips && contentWidth && (
              <RTChartWrapper>
                <CountyTestAdjustedChart
                  type={"cases"}
                  fips={props.fips}
                  width={contentWidth + 40}
                  height={chartHeight}
                  showHistory={showHistory}
                />
              </RTChartWrapper>
            )}
            {!props.fips && contentWidth && (
              <TestAdjustedChart
                data={subAreaData}
                width={contentWidth + 40}
                height={chartHeight + 170}
              />
            )}
            {props.fips && contentWidth && (
              <>
                <ChartTitle level={2}>
                  Deaths, fitted deaths, and reported death data
                </ChartTitle>
                <Explanation>
                  Death ascertainment is much higher than case ascertainment for
                  COVID-19 in the United States. However, incomplete
                  ascertainment, as well as reporting delays, are usually
                  evident in the following graph.
                </Explanation>
                <RTChartWrapper>
                  <CountyTestAdjustedChart
                    type={"deaths"}
                    fips={props.fips}
                    width={contentWidth + 40}
                    height={chartHeight}
                    showHistory={showHistory}
                  />
                </RTChartWrapper>
              </>
            )}
          </div>
        </div>
      </div>
      <RTFooter maxWidth={maxWidth} />
    </>
  );
}
