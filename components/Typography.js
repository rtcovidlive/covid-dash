import styled from "styled-components";

const LEVEL_TO_FONT_SIZE = {
  1: "36px",
  2: "24px",
  3: "18px",
};

const LEVEL_TO_FONT_WEIGHT = {
  1: "700",
  2: "700",
  3: "500",
};

const LEVEL_TO_LINE_HEIGHT = {
  1: 1.35,
  2: 1.35,
  3: 1.35,
};

export const Title = styled.h1`
  font-size: ${(props) => LEVEL_TO_FONT_SIZE[props.level]};
  line-height: ${(props) => LEVEL_TO_LINE_HEIGHT[props.level]};
  font-weight: ${(props) => LEVEL_TO_FONT_WEIGHT[props.level]};
  color: black;
  margin: 0;
`;

export const HelperTitle = styled.h1`
  font-size: ${(props) => LEVEL_TO_FONT_SIZE[props.level]};
  line-height: ${(props) => LEVEL_TO_LINE_HEIGHT[props.level]};
  font-weight: 500;
  color: rgba(0, 0, 0, 0.4);
  margin: 0;
`;
