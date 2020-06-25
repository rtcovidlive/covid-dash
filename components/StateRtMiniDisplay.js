import React from "react";
import styled from "styled-components";
import { Row, Col } from "./Grid";
import _ from "lodash";
import { format } from "d3-format";
import Constants from "lib/Constants";
import { Util } from "lib/Util";
import { Navigation } from "lib/Navigation";

const MiniDisplayContainer = styled(Row)`
  padding: 15px 15px;
  border: 1px solid;
  border-color: rgba(0, 0, 0, 0.05);
  line-height: 1.35;
  cursor: pointer;
  & :hover {
    box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.1);
    border-color: ${(props) => props.borderColor};
  }
  .svg-container {
    margin: 0;
  }
`;

const RTValue = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${(props) => props.color};
`;

const StateName = styled.p`
  margin: 0;
  font-size: 16px;
  width: 100%;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const StateRtMiniDisplay = React.forwardRef((props, ref) => {
  let offsetFromEnd = Constants.daysOffsetSinceEnd;
  let currentEntry = _.nth(props.data.series, -1 * (offsetFromEnd + 1));
  let rt = currentEntry.r0;
  let stateName = props.config.subAreas[props.subArea];
  let validEntries = _(props.data.series).dropRightWhile((e) => e.r0 === null);
  let sparkRTX = validEntries.map((e) => Util.dateFromYYYYMMDD(e.date));
  let sparkRTY = Util.movingAvg(
    validEntries.map((e) => e.r0),
    5
  );
  let dataColor = Util.colorCodeRt(props.subArea, rt);
  let sparkWidth = props.contentWidth * 0.225;
  let sparkHeight = 30;
  return (
    <MiniDisplayContainer
      borderColor={dataColor}
      ref={ref}
      onClick={(e) =>
        Navigation.navigateToSubArea(
          props.config.code,
          props.subArea,
          document.location.search
        )
      }
    >
      <Col size={13}>
        <Row>
          <StateName>{stateName}</StateName>
        </Row>
        <Row>
          <RTValue color={dataColor}>{format(".2f")(rt)} </RTValue>
        </Row>
      </Col>
      <Col size={2} verticalAlign="middle" textAlign="right">
        <Row>
          <span style={{ fontSize: 12 }} className="icon-chevron-right"></span>
        </Row>
      </Col>
    </MiniDisplayContainer>
  );
});
