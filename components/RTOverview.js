import React, { useContext, useState } from "react";
import { DataFetchContext } from "lib/DataFetchContext";
import { useRouter } from "next/router";
import { StatesWithIssues } from "config/USStates";
import { Col, Row } from "./Grid";
import _ from "lodash";
import { StateR0Display } from "./StateR0Display";
import { ScrollToTopPill } from "./ScrollToTopPill";
import { RTFooter } from "./RTFooter";
import RTHeader from "./RTHeader";
import RTHero from "./RTHero";
import { Util } from "lib/Util";

const refsByState = {};
const footerRef = React.createRef();
const rtRef = React.createRef();
const heroRef = React.createRef();

function stateClickHandler(router, stateCode) {
  let navigationQuery = Util.getNavigationQuery(document.location.search);
  router.push("/[countrycode]/[subarea]", {
    pathname: `/us/${stateCode}`,
    query: navigationQuery,
  });
}

export function RTOverview(props) {
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
  let detectedState = Util.getCookie("statecode");
  let router = useRouter();
  return (
    <>
      <RTHeader
        lastUpdated={lastUpdated}
        title={config.subAreaType}
        width={props.width}
        areaName={detectedState && config.subAreas[detectedState]}
        subArea={detectedState}
        useNewHeader={props.newHeader}
      />
      <div className="rt-container-wrapper">
        <div
          ref={rtRef}
          className={
            "rt-container " +
            (isSmallScreen ? "rt-container-small" : "rt-container-wide")
          }
        >
          <RTHero
            ref={heroRef}
            rtData={rtData}
            rtRef={rtRef}
            config={config}
            isSmallScreen={isSmallScreen}
            stateClickHandler={(stateCode) => {
              stateClickHandler(router, stateCode);
            }}
          />
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
                          contentWidth={props.width}
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
      <ScrollToTopPill target={heroRef} />
    </>
  );
}
