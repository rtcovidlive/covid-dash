import React, { useContext, useState } from "react";
import { DataFetchContext } from "lib/DataFetchContext";
// TODO make config
import { StatesWithIssues } from "config/USStates";
import { Col, Row } from "./Grid";
import _ from "lodash";
import { StateR0Display } from "./StateR0Display";
import { ScrollToTopPill } from "./ScrollToTopPill";
import { RTFooter } from "./RTFooter";
import RTHeader from "./RTHeader";
import OverviewMapSuper from "./OverviewMap";
import RTHero from "./RTHero";
import { Util } from "lib/Util";
import Constants from "lib/Constants";
import { Button } from "./Button";

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
    infections: {
      enabledModes: [Constants.MetricOptions.TrueInfections],
      yDomain: [0, 100000],
      id: "infections",
      label: "Estimated infections",
    },
    infectionsPC: {
      enabledModes: [Constants.MetricOptions.TrueInfectionsPC],
      yDomain: [0, 400],
      id: "infectionsPC",
      label: "Estimated infections per 100k",
    },
    r0: {
      enabledModes: [Constants.MetricOptions.DerivedR0],
      yDomain: [0.2, 2],
      id: "r0",
      label: (
        <span>
          R<sub>t</sub>
        </span>
      ),
    },
    seroprevalence: {
      enabledModes: [Constants.MetricOptions.Seroprevalence],
      yDomain: [0, 40],
      id: "seroprevalence",
      label: "Estimated seroprevalence",
    },
  };

  const [selectedOutcome, useSelectedOutcome] = useState(
    outcomeTypes.infections
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

  if (!rtData || !props.width) {
    return null;
  }

  let isLgSize = props.width >= 991 && props.width < 1200;
  var colsPerChart;
  var spacerOffset = 4;
  var rowCount;
  if (props.width < 576) {
    colsPerChart = 24;
    rowCount = 1;
  } else if (props.width < 768) {
    colsPerChart = 12;
    rowCount = 2;
  } else if (props.width < 992) {
    colsPerChart = 11;
    spacerOffset = 2;
    rowCount = 2;
  } else if (props.width < 1200) {
    colsPerChart = 8;
    rowCount = 3;
  } else {
    colsPerChart = 6;
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
      <div className="rt-container-wrapper">
        <div className="rt-container rt-container-wide">
          <Row className="stacked-states-outer">
            <Col size={24}>
              <OverviewMapSuper ref={mapRef} />
            </Col>
          </Row>
        </div>
      </div>
      <div className="rt-container-wrapper">
        <div
          ref={rtRef}
          className={
            "rt-container " +
            (isSmallScreen ? "rt-container-small" : "rt-container-wide")
          }
        >
          <Row className="stacked-chart-controls">
            {_.map(outcomeTypes, (outcome) => {
              return (
                <Button
                  onClick={() => handleRadioButton(outcome.id)}
                  key={outcome.id}
                  active={selectedOutcome.id === outcome.id}
                  shape="round"
                >
                  <input
                    checked={selectedOutcome.id === outcome.id}
                    type="radio"
                    id={outcome.id}
                    name={outcome.id}
                    value={outcome.id}
                    readOnly
                  />
                  <label htmlFor={outcome.id}>{outcome.label}</label>
                </Button>
              );
            })}
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
                        />
                      </div>
                    </Col>
                  );
                }
              )}
          </Row>
          <RTHero
            ref={heroRef}
            rtData={rtData}
            rtRef={rtRef}
            config={config}
            isSmallScreen={isSmallScreen}
            stateClickHandler={stateClickHandler}
          />
        </div>
      </div>
      <RTFooter
        ref={footerRef}
        knownIssues={config.knownIssues}
        maxWidth={1500}
      />
      <ScrollToTopPill target={heroRef} />
    </>
  );
}
