import Link from "next/link";
import styled from "styled-components";
import React, { useState, useEffect } from "react";
import { VisualizationChart } from "./VisualizationChart";
import { StateRtChart } from "./StateRtChart";
import _ from "lodash";
import { format } from "d3-format";
import { Title } from "./Typography";
import { Row, Col } from "./Grid";
import Constants from "lib/Constants";
import { Util } from "lib/Util";

const DetailsLink = styled.a`
  background-color: white;
  font-size: 14px;
  cursor: pointer;
  text-align: right;
  font-weight: normal;

  :hover {
    font-weight: bold;
    text-decoration: underline;
  }
`;
const primaryColorScale = (region, i) => {
  return "black";
};
const secondaryColorScale = (region, i) => {
  return "rgba(0, 145, 255, 1)";
};
export const StateR0Display = React.forwardRef((props, ref) => {
  const [showCases, setShowCases] = useState(false);
  const [hovered, setIsHovered] = useState(false);
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
      }, 250);
    });
  }, [ref]);
  let numberFormat = format(",.2f");
  let offsetFromEnd = Constants.daysOffsetSinceEnd;
  let currentEntry = _.nth(props.data.series, -1 * (offsetFromEnd + 1));
  let previousEntry = _.nth(props.data.series, -1 * (offsetFromEnd + 2));
  let currentValue = numberFormat(currentEntry.r0);
  let currentHigh = numberFormat(currentEntry.r0_h50);
  let currentLow = numberFormat(currentEntry.r0_l50);
  let statColor = Util.colorCodeRt(
    props.data.identifier,
    currentValue,
    currentLow,
    currentHigh
  );
  let delta = currentEntry.r0 - previousEntry.r0;
  let deltaFormatted = numberFormat(Math.abs(delta));
  if (deltaFormatted.startsWith("0")) {
    deltaFormatted = deltaFormatted.slice(1);
  }

  let newFeatures = Util.getCookie("admin") === "bananastand";

  let chartHeight = contentWidth * 0.75;
  let alwaysShowCaseToggle = props.hasOwnRow;
  let navigationQuery = Util.getNavigationQuery(document.location.search);
  return (
    <div
      ref={ref}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ position: "relative" }}
      className={
        "state-rt-display " +
        (props.highlight === true ? "state-rt-display-highlighted" : "")
      }
    >
      <Row style={{ marginRight: 32 }}>
        <Col verticalAlign="middle" size={props.linkAvailable ? 16 : 24}>
          {props.stateInitials && (
            <span
              style={{
                backgroundColor: "#d9d9d9",
                padding: "0px 4px 0px 4px",
                borderRadius: "3px",
                marginRight: "5px",
                fontSize: "12px",
              }}
            >
              {props.stateInitials}
            </span>
          )}
          <Title className="state-rt-display-name" level={2}>
            {(props.config && props.config.subAreas[props.subArea]) ||
              props.subArea}
            {props.hasDataIssue && (
              <span>
                &nbsp;
                <span
                  className="link"
                  onClick={() =>
                    document
                      .getElementById("known-issues")
                      .scrollIntoView({ behavior: "smooth" })
                  }
                >
                  *{" "}
                </span>
              </span>
            )}
          </Title>{" "}
        </Col>
        {props.linkAvailable && (
          <Col verticalAlign="middle" textAlign="right" size={8}>
            <Link
              href={`/us/${props.subArea}`}
              as={{ pathname: `/us/${props.subArea}`, query: navigationQuery }}
              passHref
            >
              <DetailsLink>
                Details{" "}
                <span
                  style={{
                    fontSize: 9,
                    position: "relative",
                    top: 0.5,
                    color: "goldenrod",
                  }}
                  className="icon-chevron-right"
                ></span>
              </DetailsLink>
            </Link>
          </Col>
        )}
      </Row>
      {contentWidth && (
        <div
          style={{
            marginLeft: -4,
            marginTop: 4,
            pointerEvents: showCases ? "none" : "all",
            opacity: showCases ? 0.14 : 1.0,
          }}
        >
          <StateRtChart
            data={props.data}
            width={contentWidth}
            height={chartHeight}
            yAxisPosition={showCases ? "none" : "right"}
            yDomain={props.yDomain}
            drawOuterBorder={true}
            isHovered={hovered}
            isUnderlayed={showCases}
            enabledModes={props.enabledModes}
          />
        </div>
      )}
    </div>
  );
});
