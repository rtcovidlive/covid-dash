import React from "react";
import styled from "styled-components";

export const Row = styled.div`
  display: flex;
  flex-flow: row wrap;
  > div {
    ${(props) => props.gutter && "padding-bottom: " + props.gutter + "px;"}
  }
`;

const cols = 24;
function calcBasis(size, gutter) {
  return `calc(${(100 * size) / cols + "%"} - ${gutter}px)`;
}

function flexJustify(textAlign) {
  switch (textAlign) {
    case "left":
      return "flex-start";
    case "center":
      return "center";
    case "right":
    default:
      return "flex-end";
  }
}

export const Col = styled.div`
  max-width: ${(props) => calcBasis(props.size, props.gutter || 0)};
  flex-grow: 0;
  flex-shrink: 0;
  box-sizing: border-box;
  margin-left: ${(props) => (props.offset ? calcBasis(props.offset) : 0)};
  ${(props) => props.gutter && "padding-bottom: " + props.gutter * 2 + "px;"}
  flex-basis: ${(props) => calcBasis(props.size, props.gutter || 0)};
  ${(props) =>
    !props.verticalAlign &&
    props.textAlign &&
    `text-align: ${props.textAlign};`}
  ${(props) =>
    props.verticalAlign &&
    props.textAlign &&
    `justify-content: ${flexJustify(props.textAlign)};`}
  ${(props) =>
    props.verticalAlign === "middle" && "display: flex; align-items: center;"}
`;
