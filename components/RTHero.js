import React, { useState, useEffect } from "react";
import { Button } from "./Button";
import { RTStackedChart } from "./RTStackedChart";
import { OffsetControls } from "./OffsetControls";
import Constants from "lib/Constants";
import { Util } from "lib/Util";

export const RTHero = React.forwardRef(function (props, ref) {
  let rtData = props.rtData;
  let rtRef = props.rtRef;
  const [r0Data, setR0Data] = useState([]);
  const [dayOffset, setDayOffset] = useState(-1 - Constants.daysOffsetSinceEnd);
  const [filteredRegion, setFilteredRegion] = useState(null);
  const [filteredSubareas, setFilteredSubareas] = useState(null);
  const [highlightedSubareas, setHighlightedSubareas] = useState(
    _.keys(props.config.subAreas)
  );
  let detectedState = Util.getCookie("statecode");

  const regionOptions = props.config.regionFilterOptions;
  function StateFilterControls(props) {
    return (
      <div className="stacked-chart-state-controls">
        {_.map(regionOptions, (option) => {
          let isActive =
            filteredRegion === option ||
            (option === "All" && filteredRegion === null);
          let selectionRegion = option === "All" ? null : option;
          return (
            <Button
              key={option}
              active={isActive}
              onClick={() => {
                isActive
                  ? setFilteredRegion(null)
                  : setFilteredRegion(selectionRegion);
              }}
              shape="round"
            >
              {option}
            </Button>
          );
        })}
      </div>
    );
  }

  function decorateDataWithSortIndex(data) {
    _.each(data, (e, i) => {
      e["sort"] = i;
    });
    return data;
  }

  useEffect(() => {
    let filteredR0s = _.filter(rtData.dataSeries, (series, identifier) => {
      return !filteredSubareas || filteredSubareas.indexOf(identifier) !== -1;
    });
    let sortedR0s = _.sortBy(filteredR0s, (state) => {
      return _.nth(state.series, -1 - Constants.daysOffsetSinceEnd).r0;
    });
    setR0Data(sortedR0s);
  }, [rtData, filteredSubareas]);

  useEffect(() => {
    let subareasToFocus = filteredRegion
      ? props.config.getSubareasForFilter(filteredRegion, rtData.dataSeries)
      : _.keys(props.config.subAreas);
    if (props.isSmallScreen) {
      setFilteredSubareas(subareasToFocus);
      // TODO: setActiveFilteredStates(_.keys(props.config.subAreas));
    } else {
      setFilteredSubareas(null);
      setHighlightedSubareas(subareasToFocus);
    }
  }, [filteredRegion, rtData, props.isSmallScreen]);
  return (
    <div className="stacked-chart-outer" ref={ref}>
      {props.isSmallScreen && <StateFilterControls />}
      {!props.isSmallScreen && (
        <OffsetControls
          highlightOptions={props.config.highlightOptions}
          filteredRegion={filteredRegion}
          lastUpdated={rtData.lastRTValueDate}
          setFilteredRegion={setFilteredRegion}
          setDayOffset={setDayOffset}
          dayOffset={dayOffset}
          isSmallScreen={props.isSmallScreen}
          label={props.config.subAreaType}
        />
      )}
      {props.isSmallScreen && (
        <>
          <RTStackedChart
            focusedStates={highlightedSubareas}
            offset={dayOffset}
            width={
              (rtRef.current && rtRef.current.getBoundingClientRect().width) ||
              props.width
            }
            height={480}
            config={props.config}
            onStateClicked={props.stateClickHandler}
            verticalMode={true}
            subAreas={props.config.subAreas}
            data={decorateDataWithSortIndex(r0Data)}
          />
          <OffsetControls
            highlightOptions={props.config.highlightOptions}
            filteredRegion={filteredRegion}
            setFilteredRegion={setFilteredRegion}
            setDayOffset={setDayOffset}
            lastUpdated={rtData.lastRTValueDate}
            dayOffset={dayOffset}
            label={props.config.subAreaType}
            isSmallScreen={props.isSmallScreen}
          />
        </>
      )}
      {!props.isSmallScreen && (
        <RTStackedChart
          focusedStates={highlightedSubareas}
          offset={dayOffset}
          width={
            (rtRef.current && rtRef.current.getBoundingClientRect().width) ||
            props.width
          }
          config={props.config}
          height={480}
          subAreas={props.config.subAreas}
          onStateClicked={props.stateClickHandler}
          verticalMode={false}
          data={decorateDataWithSortIndex(r0Data)}
        />
      )}
    </div>
  );
});

export default RTHero;
