import React, { useContext, useState } from "react";
import { DataFetchContext } from "lib/DataFetchContext";
// TODO make config
import { StatesWithIssues } from "config/USStates";
import { Col, Row } from "./Grid";
import _ from "lodash";
import { StateR0Display } from "./StateR0Display";
import { RTFooter } from "./RTFooter";
import RTHeader from "./RTHeader";
import OverviewMapSuper from "./OverviewMap";
import { Util } from "lib/Util";
import Constants from "lib/Constants";
import { Radio } from "antd";
import { timeDay } from "d3-time";

const refsByState = {};
const mapRef = React.createRef();
const footerRef = React.createRef();
const rtRef = React.createRef();
const heroRef = React.createRef();

function stateClickHandler(stateCode) {
  let stateWidget = refsByState[stateCode].current;
  let offset = stateWidget.getBoundingClientRect();
  window.scrollBy({ top: offset.top - 50, behavior: "smooth" });
}

export function RTOverview(props) {
  let outcomeTypes = {
    infectionsPC: {
      enabledModes: [Constants.MetricOptions.TrueInfectionsPC],
      yDomain: [0, 800],
      id: "infectionsPC",
      label: "Infections (per 100k)",
      background:
        "linear-gradient(90deg, rgba(0, 0, 4, 0.25) 0%, rgba(140, 41, 129, 0.25) 20%, rgba(254, 159, 109, 0.25) 40%, rgba(249, 251, 216, 0.25) 60%, rgba(236, 248, 250, 0.25) 80%, rgba(210, 248, 255, 0.25) 100%)",
    },
    infections: {
      enabledModes: [Constants.MetricOptions.TrueInfections],
      yDomain: [0, 200000],
      yDomainCounty: [0, 10000],
      id: "infections",
      label: "Infections (raw)",
      background:
        "linear-gradient(90deg, rgba(0, 0, 4, 0.25) 0%, rgb(59, 15, 112, 0.25) 20%, rgb(140, 41, 129, 0.25) 40%, rgb(222, 73, 104, 0.25) 60%, rgb(254, 159, 109, 0.25) 80%, rgb(252, 253, 191, 0.25) 100%",
    },
    r0: {
      enabledModes: [Constants.MetricOptions.DerivedR0],
      yDomain: [0.2, 2],
      id: "r0",
      label: (
        <span>
          Effective reproduction number (R<sub>t</sub>)
        </span>
      ),
      background:
        "linear-gradient(90deg, rgba(26, 26, 26, 0.25) 0%, rgba(134, 134, 134, 0.25) 20%, rgba(223, 223, 223, 0.25) 40%, rgba(252, 216, 197, 0.25) 60%, rgba(213, 95, 80, 0.25) 80%, rgba(103, 0, 31, 0.25) 100%)",
    },
    seroprevalence: {
      enabledModes: [Constants.MetricOptions.Seroprevalence],
      yDomain: [0, 100],
      yDomainCounty: [0, 100],
      id: "seroprevalence",
      label: "Percent ever infected",
      background:
        "linear-gradient(90deg,  rgba(255, 255, 217, 0.25) 0%, rgba(213, 238, 179, 0.25) 20%, rgba(115, 201, 189, 0.25) 40%, rgba(40, 151, 191, 0.25) 60%, rgba(35, 78, 160, 0.25) 80%, rgba(8, 29, 88, 0.25) 100%)",
    },
  };

  const [selectedOutcome, useSelectedOutcome] = useState(
    outcomeTypes.infectionsPC
  );

  let handleRadioButton = function (name) {
    useSelectedOutcome(outcomeTypes[name]);
  };

  let isSmallScreen = props.width <= 768;
  let config = props.config;

  // TODO move to Context
  let adminQuery = Util.getQueryParams(document.location.search)["admin"];
  if (adminQuery) {
    document.cookie = `admin=${adminQuery}`;
  }

  const rtData = useContext(DataFetchContext);
  let lastUpdated = rtData.modelLastRunDate;
  const [clickedOnState, setClickedOnState] = useState(null);
  const [showExtent, setShowExtent] = useState("all");

  if (!rtData || !props.width) {
    return null;
  }

  const FROZEN_DATE = new Date("2021-12-02");

  const dateBounds =
    showExtent === "8mo"
      ? [
          timeDay.offset(FROZEN_DATE /*new Date()*/, -8 * 30),
          FROZEN_DATE /*new Date()*/,
        ]
      : [null, null];

  let isLgSize = props.width >= 991 && props.width < 1200;
  var colsPerChart;
  var smallColsPerChart;
  var spacerOffset = 4;
  var rowCount;
  if (props.width < 576) {
    colsPerChart = 24;
    smallColsPerChart = 24;
    rowCount = 1;
  } else if (props.width < 768) {
    colsPerChart = 12;
    smallColsPerChart = 8;
    rowCount = 2;
  } else if (props.width < 992) {
    colsPerChart = 11;
    smallColsPerChart = 8;
    spacerOffset = 2;
    rowCount = 2;
  } else if (props.width < 1200) {
    colsPerChart = 8;
    smallColsPerChart = 6;
    rowCount = 3;
  } else {
    colsPerChart = 6;
    smallColsPerChart = 4;
    rowCount = 4;
  }

  return (
    <>
      <RTHeader
        lastUpdated={lastUpdated}
        title={config.subAreaType}
        width={props.width}
        useNewHeader={props.newHeader}
      />
      <OverviewMapSuper
        ref={mapRef}
        width={props.width}
        selectedOutcome={selectedOutcome}
        colsPerChart={smallColsPerChart}
        isSmallScreen={isSmallScreen}
        rowCount={rowCount}
        spacerOffset={spacerOffset}
        dateBounds={dateBounds}
      />
      <div className="rt-container-wrapper">
        <div
          ref={rtRef}
          className={
            "rt-container " +
            (isSmallScreen ? "rt-container-small" : "rt-container-wide")
          }
        >
          <Row className="stacked-chart-controls">
            <Radio.Group
              value={selectedOutcome.id}
              onChange={(e) => handleRadioButton(e.target.value)}
            >
              {_.map(outcomeTypes, (outcome) => {
                const style = outcome.background
                  ? {
                      background: outcome.background,
                    }
                  : undefined;

                return (
                  <Radio.Button
                    value={outcome.id}
                    key={outcome.id}
                    style={style}
                  >
                    <strong>{outcome.label}</strong>
                  </Radio.Button>
                );
              })}
            </Radio.Group>
            <span style={{ padding: "5px" }}>Show:</span>
            <Radio.Group
              onChange={(e) => setShowExtent(e.target.value)}
              defaultValue="all"
              value={showExtent}
            >
              <Radio.Button value="all">All</Radio.Button>
              <Radio.Button value="8mo">Last 8mo</Radio.Button>
            </Radio.Group>
          </Row>
          <Row className="stacked-states-outer">
            {rtData &&
              _.map(
                _.sortBy(
                  _.keys(rtData.dataSeries),
                  (state) => config.subAreas[state]
                ),
                (state, i) => {
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
                  refsByState[state] = refsByState[state] || React.createRef();
                  return (
                    <Col
                      key={state}
                      size={colsPerChart}
                      align={align}
                      offset={align === "center" ? spacerOffset : 0}
                    >
                      <div className="stacked-state-wrapper">
                        <StateR0Display
                          ref={refsByState[state]}
                          config={config}
                          subArea={state}
                          runID={lastUpdated.getTime()}
                          hasDataIssue={StatesWithIssues[state]}
                          highlight={clickedOnState === state}
                          hasOwnRow={isSmallScreen}
                          data={rtData.dataSeries[state]}
                          enabledModes={selectedOutcome.enabledModes}
                          yDomain={selectedOutcome.yDomain}
                          contentWidth={props.width}
                          state={true}
                          dateBounds={dateBounds}
                        />
                      </div>
                    </Col>
                  );
                }
              )}
          </Row>
        </div>
      </div>
      <RTFooter
        ref={footerRef}
        knownIssues={config.knownIssues}
        maxWidth={1500}
      />
    </>
  );
}
