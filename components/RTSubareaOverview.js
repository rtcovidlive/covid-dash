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
import { Util } from "lib/Util";
import Constants from "lib/Constants";
import { Switch, DatePicker, Tooltip, BackTop, Radio } from "antd";
import { useStateResults, useCountyResults, useInputData } from "../lib/data";
import { USStatesByCode } from "../config/USStates";

const rtRef = React.createRef();

const Header = styled.div`
  padding-bottom: 10px;
`;

const HeaderRow = styled(Row)`
  margin: 30px 0px 10px 0px;
  @media (max-width: 768px) {
    margin: 20px 0px 10px 0px;
  }
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
`;

const SubHeaderRow = styled(Row)`
  margin: 20px 0px 10px 0px;
  @media (max-width: 768px) {
    margin: 20px 0px 10px 0px;
  }
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
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

const ColorLabel = styled.span`
  display: inline-block;
  border-radius: 3.5px;
  color: white;
  font-weight: 400;
  padding: 0px 5px;
  background-color: black;
`;

const ColorLabelGrey = styled(ColorLabel)`
  background-color: grey;
`;

const ColorLabelBlue = styled(ColorLabel)`
  background-color: rgb(0, 145, 255);
`;

const ColorLabelBrown = styled(ColorLabel)`
  background-color: rgb(179, 109, 25);
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
  padding: 5px 0px 0px 0px;
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
    <Row style={{ maxWidth: 700, ...props.style }}>
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
  const numFormat = (num) => {
    if (num > 1000000) {
      return format(".1f")(num / 1000000) + "M";
    } else if (num > 10000) {
      return Math.floor(num / 1000) + "K";
    } else if (num > 1000) {
      return format(".1f")(num / 1000) + "K";
    } else {
      return format(".1f")(num);
    }
  };

  const countyStats = CountyStatRowNumbers(props.countyData);
  const latestResults = CountyLatestResults(props.countyData);

  if (!countyStats || !props.countyInputData)
    return <Row style={{ maxWidth: 700 }}></Row>;

  let series = _(latestResults);
  let inputSeries = _(props.countyInputData);

  let lastCountyRt = countyStats && format(".2f")(countyStats.Rt);

  let positiveTotalRaw = inputSeries.sumBy((e) => Number(e.cases));
  let positiveTotal = numFormat(inputSeries.sumBy((e) => Number(e.cases)));
  let infectionsTotalRaw = series.sumBy((e) => Number(e.infections));
  let infectionsTotal = numFormat(series.sumBy((e) => Number(e.infections)));
  let infectionRate = format(".1f")(countyStats.infectionsPC);
  let colsPerStat = 6;
  return (
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
          <StatNumber>
            {infectionRate}
            <StatUnit>inf/100k/day</StatUnit>
          </StatNumber>
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
  );
}

function ControlRow(props) {
  const {
    showHistory,
    setShowHistory,
    showNeighbors,
    setShowNeighbors,
    showExtent,
    setShowExtent,
  } = props;

  let colsPerStat = 6;
  return (
    <Row style={{ maxWidth: 625 }}>
      <Col size={colsPerStat}>
        <Tooltip
          placement="top"
          title="Display a selection of historical model runs"
        >
          <StatContent style={{ paddingTop: 20 }}>
            <StatLabel>Show history?</StatLabel>
            <StatNumber>
              <Switch
                checked={showHistory}
                onClick={(e) => setShowHistory(!showHistory)}
              />
            </StatNumber>
          </StatContent>
        </Tooltip>
      </Col>
      <Col size={colsPerStat}>
        <Tooltip
          placement="top"
          title="Display latest estimates from all neighboring areas"
        >
          <StatContent style={{ paddingTop: 20 }}>
            <StatLabel>Show neighbors?</StatLabel>
            <StatNumber>
              <Switch
                checked={showNeighbors}
                onClick={(e) => setShowNeighbors(!showNeighbors)}
              />
            </StatNumber>
          </StatContent>
        </Tooltip>
      </Col>
      <Col size={colsPerStat}>
        <StatContent style={{ paddingTop: 20 }}>
          <StatLabel>Data display</StatLabel>
          <StatNumber>
            <Radio.Group
              onChange={(e) => setShowExtent(e.target.value)}
              defaultValue="all"
              size={"small"}
              value={showExtent}
            >
              <Radio.Button value="all">All</Radio.Button>
              <Radio.Button value="8mo">Last 8mo</Radio.Button>
            </Radio.Group>
          </StatNumber>
        </StatContent>
      </Col>
    </Row>
  );
}

const CountyInputView = function (props) {
  const { fips, width, height, lastDrawLocation, setLastDrawLocation } = props;

  const [inputDataDate, setInputDataDate] = useState(null);

  const onDateChange = (date, dateString) => {
    if (dateString.length > 0) setInputDataDate(dateString);
    else setInputDataDate(null);
  };

  return (
    <>
      <DatePicker onChange={onDateChange} placeholder="Choose a date" />
      <RTChartWrapper>
        <CountyInputChart
          date={inputDataDate}
          fips={fips}
          measure={"cases"}
          width={width}
          height={height}
          lastDrawLocation={lastDrawLocation}
          setLastDrawLocation={setLastDrawLocation}
        />
      </RTChartWrapper>
      <RTChartWrapper>
        <CountyInputChart
          date={inputDataDate}
          fips={fips}
          measure={"deaths"}
          width={width}
          height={height}
          lastDrawLocation={lastDrawLocation}
          setLastDrawLocation={setLastDrawLocation}
        />
      </RTChartWrapper>
    </>
  );
};

export function RTSubareaOverview(props) {
  const rtData = useContext(DataFetchContext);
  const config = props.config;
  const [contentWidth, setContentWidth] = useState(null);
  const [lastDrawLocation, setLastDrawLocation] = useState(null);

  // Show estimate history, and show latest result from all neighboring counties?
  const [showHistory, setShowHistory] = useState(false);
  const [showNeighbors, setShowNeighbors] = useState(false);
  const [showExtent, setShowExtent] = useState("all");

  let isSmallScreen = props.width <= 768;
  let chartHeight = isSmallScreen ? 280 : 350;
  let maxWidth = 980;

  let areaName = config.subAreas[props.subarea];
  let countyName = props.fips
    ? config.counties[props.fips].county
    : `${props.subarea}`;

  const { data: stateData, error: stateDataError } = useStateResults(areaName);

  const { data: countyData, error: countyDataError } = useCountyResults(
    props.fips
  );
  const { data: countyInputs, error: countyInputsError } = useInputData(
    props.fips
  );

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
    { key: "_overall", label: "←🏠 Home" },
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
      label: `↑ ${USStatesByCode[props.subarea]}`,
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

  const routeToState = (abbr) => {
    Navigation.navigateToSubArea(
      props.config.code,
      abbr,
      document.location.search
    );
  };

  const backtopStyle = {
    height: 40,
    width: 40,
    lineHeight: "40px",
    borderRadius: 4,
    backgroundColor: "#1088e9",
    color: "#fff",
    textAlign: "center",
    fontSize: 14,
  };

  return (
    <>
      {props.fips && (
        <BackTop>
          <div style={backtopStyle}>↑ top</div>
        </BackTop>
      )}
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
                <Col size={24}>
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
                    <SubareaName
                      level={1}
                      style={{ opacity: props.fips ? 0.38 : 1 }}
                    >
                      {areaName}

                      <span
                        style={{ fontSize: "0.6em", marginLeft: 5 }}
                        className="icon-caret-down"
                      />
                    </SubareaName>
                  </Dropdown>
                </Col>
              </HeaderRow>
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
                style={{ opacity: props.fips ? 0.38 : 1 }}
              />
              <SubHeaderRow>
                <Col size={24}>
                  {!props.fips && <div>See county-level results: </div>}
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
              {props.fips && (
                <CountyStatRow
                  config={config}
                  data={subAreaData}
                  countyData={countyData}
                  countyInputData={countyInputs}
                  width={contentWidth}
                  subarea={props.subarea}
                  isSmallScreen={isSmallScreen}
                />
              )}
              <ControlRow
                showHistory={showHistory}
                setShowHistory={setShowHistory}
                showNeighbors={showNeighbors}
                setShowNeighbors={setShowNeighbors}
                showExtent={showExtent}
                setShowExtent={setShowExtent}
              />
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
            {contentWidth && (
              <RTChartWrapper>
                <CountyMetricChart
                  measure={"Rt"}
                  showNeighbors={showNeighbors}
                  showHistory={showHistory}
                  showExtent={showExtent}
                  fips={props.fips}
                  state={!props.fips && areaName}
                  stateAbbr={props.subarea}
                  width={contentWidth + 40}
                  height={chartHeight}
                  lastDrawLocation={lastDrawLocation}
                  setLastDrawLocation={setLastDrawLocation}
                  routeToFIPS={routeToFIPS}
                  routeToState={routeToState}
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
            {contentWidth && (
              <RTChartWrapper>
                <CountyMetricChart
                  measure={"infectionsPC"}
                  showNeighbors={showNeighbors}
                  showHistory={showHistory}
                  showExtent={showExtent}
                  fips={props.fips}
                  state={!props.fips && areaName}
                  stateAbbr={props.subarea}
                  width={contentWidth + 40} // + 40}
                  height={chartHeight} //}
                  lastDrawLocation={lastDrawLocation}
                  setLastDrawLocation={setLastDrawLocation}
                  routeToFIPS={routeToFIPS}
                  routeToState={routeToState}
                />
              </RTChartWrapper>
            )}
            {contentWidth && (
              <>
                <ChartTitle level={2}>Percent Ever Infected</ChartTitle>
                <Explanation>
                  Percent ever infected is our estimate of the number of
                  individuals in the county or state population who have been
                  infected at least once with COVID-19.
                </Explanation>
                <RTChartWrapper>
                  <CountyMetricChart
                    measure={"PEI"}
                    showNeighbors={showNeighbors}
                    showHistory={showHistory}
                    showExtent={showExtent}
                    fips={props.fips}
                    state={!props.fips && areaName}
                    stateAbbr={props.subarea}
                    width={contentWidth + 40} // + 40}
                    height={chartHeight} //}
                    lastDrawLocation={lastDrawLocation}
                    setLastDrawLocation={setLastDrawLocation}
                    routeToState={routeToState}
                  />
                </RTChartWrapper>
              </>
            )}
            {props.fips && contentWidth && (
              <>
                <ChartTitle level={2}>Model input data</ChartTitle>
                <Explanation>
                  The <ColorLabelGrey>case</ColorLabelGrey> and{" "}
                  <ColorLabel>death</ColorLabel> data used in the latest model
                  run, and the 7-day{" "}
                  <ColorLabelBrown>moving average</ColorLabelBrown>.
                  Retrospective edits to this data are common to correct
                  previous errors. These edits (and the errors that precede
                  them) can influence our estimates a lot. You can use the
                  dropdown to inspect archived model input data to see if this
                  may be the case.
                </Explanation>
                <CountyInputView
                  fips={props.fips}
                  width={contentWidth + 40}
                  height={(chartHeight + 120) / 2}
                  lastDrawLocation={lastDrawLocation}
                  setLastDrawLocation={setLastDrawLocation}
                />
              </>
            )}
            <ChartTitle level={2}>
              Infections, fitted cases, and case data
            </ChartTitle>
            <Explanation>
              This chart shows how our estimated number of{" "}
              <ColorLabelBlue>infections</ColorLabelBlue> compares to{" "}
              <ColorLabelGrey>case data</ColorLabelGrey>, and to a{" "}
              <ColorLabel>fitted cases</ColorLabel> timeseries produced during
              model execution. Here, you can see the effects of reporting delays
              as the "shift" between infections and fitted cases, and you can
              see the degree of case underascertainment as the gap between the
              testing data and the infections curve.
            </Explanation>
            {props.fips && contentWidth && (
              <RTChartWrapper>
                <CountyTestAdjustedChart
                  type={"cases"}
                  fips={props.fips}
                  width={contentWidth + 40}
                  height={chartHeight}
                  showHistory={showHistory}
                  showExtent={showExtent}
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
                  evident in the following graph, which shows{" "}
                  <ColorLabelBlue>deaths</ColorLabelBlue>,{" "}
                  <ColorLabel>fitted deaths</ColorLabel>, and{" "}
                  <ColorLabelGrey>death data</ColorLabelGrey>.
                </Explanation>
                <RTChartWrapper>
                  <CountyTestAdjustedChart
                    type={"deaths"}
                    fips={props.fips}
                    width={contentWidth + 40}
                    height={chartHeight}
                    showHistory={showHistory}
                    showExtent={showExtent}
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
