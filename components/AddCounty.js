import { useState } from "react";
import { Input, AutoComplete } from "antd";
import { PlusSquareOutlined, FlagOutlined } from "@ant-design/icons";
import { USCounties } from "../config/USCounties";
import _ from "lodash";

const renderCounty = (county) => (
  <div
    key={county.fips}
    style={{
      display: "flex",
      justifyContent: "space-between",
    }}
  >
    <span>
      <PlusSquareOutlined /> {county.county}
    </span>
    <span>
      <FlagOutlined /> <strong>{county.abbr}</strong>
    </span>
  </div>
);

const options = _.map(USCounties, (county) => ({
  label: renderCounty(county),
  key: county.fips,
  value: `${county.county}, ${county.abbr}`,
  ...county,
  state: county.abbr,
  name: county.county.replace(" County", ""),
}));

const filterFn = (inputValue, county) => {
  const lower = _.toLower(inputValue);

  const startsWithName = _.startsWith(
    _.toLower(`${county.county}, ${county.abbr}`),
    lower
  );
  const startsWithFIPS = lower.length > 1 && _.startsWith(county.fips, lower);
  const startsWithAbbr = inputValue.length == 2 && inputValue === county.abbr;

  if (_.toUpper(inputValue) === inputValue) return startsWithAbbr;

  return startsWithName || startsWithFIPS || startsWithAbbr;
};

const searchResult = (query) =>
  _.sortBy(
    _.filter(options, (countyEl) => filterFn(query, countyEl)),
    "abbr"
  );

export const AddCounty = ({ addFips }) => {
  const [options, setOptions] = useState([]);

  const handleSearch = (query) => {
    setOptions(query ? searchResult(query) : []);
  };

  return (
    <AutoComplete
      dropdownMatchSelectWidth={250}
      style={{ margin: "20px 7px 7px 0px" }}
      options={options}
      onSearch={handleSearch}
      onSelect={(value, c) =>
        addFips({ fips: c.fips, state: c.state, name: c.name })
      }
      defaultActiveFirstOption={true}
      allowClear={true}
    >
      <Input.Search
        size="medium"
        placeholder="Search counties..."
        enterButton
      />
    </AutoComplete>
  );
};
