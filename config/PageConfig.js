import { USStatesByCode } from "./USStates";
import { CountriesByCode } from "./Countries";
import Constants from "lib/Constants";

// TODO these should be in a better place
const LOOPBACK_PORT = process.env["NODE_PORT"] || 3300;
export const BASE_URL =
  process.env["NODE_ENV"] === "development"
    ? process.env["DEV_HOST"] || `http://localhost:${LOOPBACK_PORT}`
    : "https://covid-dash-murex.vercel.app";
//: // : "https://rt.live";

console.log(`Base URL is ${BASE_URL}`);

export const LOOPBACK_BASE_URL =
  process.env["DEV_HOST"] || `http://localhost:${LOOPBACK_PORT}`;
// export const CDN_ROOT = "https://d14wlfuexuxgcm.cloudfront.net/covid";
// export const CDN_ROOT = `${BASE_URL}`;
export const CDN_ROOT = "https://covidestim.github.io/covidestim-products";

class Config {
  constructor(
    code,
    title,
    subAreaType,
    dataPath,
    subSets,
    subAreas,
    regionFilterOptions,
    highlightOptions,
    knownIssues = []
  ) {
    this.code = code;
    this.title = title;
    this.subSets = subSets;
    this.subAreaType = subAreaType;
    this.subAreas = subAreas;
    this.regionFilterOptions = regionFilterOptions;
    this.dataURLBase = `${CDN_ROOT}/${dataPath}`;
    this.highlightOptions = highlightOptions;
    this.knownIssues = knownIssues;
  }

  getURLForShareImageGeneration(subArea) {
    let dt = new Date().getTime();
    return `${BASE_URL}/api/share/card?area=${this.code}&subarea=${subArea}&r=${dt}`;
  }
  getCDNURLForShareImage(subArea, runID) {
    if (!this.subAreas[subArea]) {
      throw new Error(`Invalid subarea: ${subArea}`);
    }
    return `${CDN_ROOT}/covid/shareimg/${this.code}/${subArea}/${runID}.png`;
  }

  getTwitterShareIntentURL(subArea, runID) {
    let shareURL = encodeURIComponent(
      `${BASE_URL}/share/${this.code}/${subArea}?r=${runID}`
    );
    return `https://twitter.com/share/?url=${shareURL}`;
  }

  getSubareasForFilter(filter, data) {
    if (filter === "All") {
      return null;
    }
    let entry = this.subSets[filter];
    if (_.isArray(entry)) {
      return entry;
    } else {
      let result = entry(data);
      return result;
    }
  }
}

function US() {
  let ussubSets = {
    "Ten Largest": ["CA", "TX", "FL", "NY", "PA", "IL", "OH", "GA", "NC", "MI"],
    West: [
      "AK",
      "AZ",
      "CA",
      "CO",
      "HI",
      "ID",
      "MT",
      "NV",
      "NM",
      "OR",
      "UT",
      "WA",
      "WY",
    ],
    Midwest: [
      "IL",
      "IN",
      "IA",
      "KS",
      "MI",
      "MO",
      "MN",
      "NE",
      "ND",
      "OH",
      "SD",
      "WI",
    ],
    South: [
      "AL",
      "AR",
      "DC",
      "FL",
      "GA",
      "KY",
      "LA",
      "MS",
      "OK",
      "NC",
      "SC",
      "TN",
      "TX",
      "VA",
      "WV",
    ],
    Reopened: (data) => {
      let matchingSeries = _.filter(data, (subarea) => {
        return (
          _.findIndex(
            subarea.annotations,
            (o) => o.type === Constants.InterventionTypes.ShelterEnded
          ) >= 0
        );
      });
      return _.map(matchingSeries, (e) => e.identifier);
    },
    "Never Sheltered": (data) => {
      let matchingSeries = _.filter(data, (subarea) => {
        return !_(subarea.annotations).some(
          (e) =>
            e.type === Constants.InterventionTypes.ShelterInPlace ||
            e.type === Constants.InterventionTypes.ShelterEnded
        );
      });
      return _.map(matchingSeries, (e) => e.identifier);
    },
    "N. East": [
      "ME",
      "NH",
      "VT",
      "NY",
      "MA",
      "MD",
      "RI",
      "CT",
      "NJ",
      "PA",
      "DE",
    ],
  };
  ussubSets["Northeast"] = ussubSets["N. East"];
  let knownIssues = [];
  const stateDropdownOptions = [
    "All",
    "Ten Largest",
    "Never Sheltered",
    "Reopened",
    "Northeast",
    "West",
    "Midwest",
    "South",
  ];
  return new Config(
    "us",
    "U.S. States",
    "State",
    "current_summary",
    ussubSets,
    USStatesByCode,
    [
      "All",
      "Reopened",
      "Never Sheltered",
      "N. East",
      "West",
      "Midwest",
      "South",
    ],
    stateDropdownOptions,
    knownIssues
  );
}

function Global() {
  let subsets = {
    "North America": ["US", "CA", "MX"],
  };

  return new Config(
    "global",
    "Top Countries",
    "Country",
    "https://d14wlfuexuxgcm.cloudfront.net/covid/topcountries_for_js",
    subsets,
    CountriesByCode,
    ["All", "N. America"],
    ["G-7", "N. America", "S. America", "Africa"],
    []
  );
}

function PageConfigInner() {
  this.us = US();
  this.global = Global();
}

const PageConfig = new PageConfigInner();
export default PageConfig;
