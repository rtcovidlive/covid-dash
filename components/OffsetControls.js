import React from "react";
import Dropdown from "./Dropdown";
import { Button } from "./Button";
import { Row, Col } from "./Grid";
import Constants from "lib/Constants";

export function OffsetControls(props) {
  function StateDropdownMenu() {
    let items = _.map(props.highlightOptions, (region) => {
      return { key: region, label: region };
    });
    return items;
  }

  let dropdownOptions = StateDropdownMenu();

  let options = [
    { o: -1 - Constants.daysOffsetSinceEnd, l: "Latest" },
    { o: -15 - Constants.daysOffsetSinceEnd, l: "2 Weeks Ago" },
    { o: -29 - Constants.daysOffsetSinceEnd, l: "1 Month Ago" },
    { o: -60 - Constants.daysOffsetSinceEnd, l: "2 Months Ago" },
    { o: -90 - Constants.daysOffsetSinceEnd, l: "3 Months Ago" },
  ];
  return (
    <div className="stacked-chart-controls">
      <Row>
        <Col size={props.isSmallScreen ? 24 : 18}>
          {_.map(options, (option) => {
            return (
              <Button
                key={option.o}
                width={130}
                shape="round"
                active={props.dayOffset === option.o}
                onClick={() =>
                  window.setTimeout(() => props.setDayOffset(option.o), 1)
                }
              >
                {option.l}
              </Button>
            );
          })}
        </Col>
        <Col size={6} style={{ textAlign: "right" }}>
          {!props.isSmallScreen && (
            <>
              <Dropdown
                options={dropdownOptions}
                onSelect={({ key }) => {
                  window.setTimeout(() => {
                    if (key === "All") {
                      props.setFilteredRegion(null);
                    } else {
                      props.setFilteredRegion(key);
                    }
                  }, 1);
                }}
              >
                <Button
                  width={130}
                  style={{ float: "right" }}
                  active={true}
                  shape={"round"}
                >
                  Filter
                </Button>
              </Dropdown>
            </>
          )}
        </Col>
      </Row>
    </div>
  );
}

export default OffsetControls;
