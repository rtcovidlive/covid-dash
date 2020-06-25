import React, { useLayoutEffect, useRef, useState } from "react";
import _ from "lodash";
import styled from "styled-components";

function calcWidth(props) {
  return props.minWidth
    ? Math.max(props.childRect.width, props.minWidth)
    : props.childRect.width;
}

const DropdownWrapper = styled.ul`
  position: absolute;
  text-align: left;
  margin: 0;
  width: ${(props) => calcWidth(props)}px;
  background-color: white;
  left: ${(props) => props.childRect.left}px;
  top: ${(props) => props.childRect.top + props.childRect.height + 2}px;
  z-index: 9999999;
  box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.12);
  padding: 2px 0px !important;
  pointer-events: ${(props) => (props.showing ? "auto" : "none")};
  opacity: ${(props) => (props.showing ? 1.0 : 0.0)};
  max-height: 600px;
  overflow: auto;
`;

const DropdownEntry = styled.li`
  list-style-type: none;
  margin: 0;
  cursor: pointer;
  padding: 4px 16px;
  &:hover {
    background-color: rgba(0, 0, 0, 0.075);
  }
`;

const OuterWrapper = styled.div`
  display: inline-block;
  position: relative;
  cursor: pointer;
`;

export default function Dropdown(props) {
  const [childRect, setChildRect] = useState(null);
  const [showing, setShowing] = useState(false);
  const childRef = useRef();
  const dropdownRef = useRef();

  useLayoutEffect(() => {
    let actualEl = childRef.current.firstChild;
    let handleBodyClick = (e) => {
      if (
        !dropdownRef.current.contains(e.target) &&
        !childRef.current.contains(e.target)
      ) {
        setShowing(false);
      }
    };
    document.body.addEventListener("click", handleBodyClick);
    setChildRect({
      left: actualEl.offsetLeft,
      top: actualEl.offsetTop,
      width: actualEl.offsetWidth,
      height: actualEl.offsetHeight,
    });
    return () => {
      document.body.removeEventListener("click", handleBodyClick);
    };
  }, [childRef.current]);
  let options = _.map(props.options, (option) => {
    return (
      <DropdownEntry
        onClick={(e) => {
          setShowing(false);
          props.onSelect(option);
        }}
        key={option.key}
      >
        {option.label}
      </DropdownEntry>
    );
  });
  return (
    <OuterWrapper>
      <div
        ref={childRef}
        onClick={(e) => {
          setShowing(!showing);
        }}
      >
        {props.children}
      </div>
      {childRect && (
        <DropdownWrapper
          ref={dropdownRef}
          childRect={childRect}
          showing={showing}
          minWidth={props.minWidth}
        >
          {options}
        </DropdownWrapper>
      )}
    </OuterWrapper>
  );
}
