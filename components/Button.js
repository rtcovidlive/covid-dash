import styled from "styled-components";
import Constants from "lib/Constants";

const washColor = "#f7f6f3";
const buttonActiveBackground = "#eae9e6";
const textInactive = "rgba(0, 0, 0, 0.4)";
export const Button = styled.button`
  border: none;
  border-radius: ${(props) => (props.shape === "round" ? "32px" : "none")};
  background-color: ${washColor};
  color: ${(props) => (props.active ? "black" : textInactive)};
  box-sizing: border-box;
  display: inline-block;
  cursor: pointer;
  font-family: ${Constants.fontStack};
  height: 26px;
  margin: 0;
  outline-style: none;
  padding: 4px 16px;
  width: ${(props) => props.width + "px" || "auto"};
  text-align: center;
  font-size: 12px;
  white-space: nowrap;
  -webkit-appearance: none;
  -webkit-border-image: none;

  &:hover {
    background-color: ${buttonActiveBackground};
  }
`;
