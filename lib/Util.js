import _ from "lodash";
import Constants from "./Constants";
// TODO make configurable
import { StatesWithIssues } from "config/USStates";

export const Util = {
  uuidV4: function () {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        var r = (Math.random() * 16) | 0,
          v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  },

  getQueryParams: function (search) {
    let parts = search.indexOf("?") === 0 ? search.slice(1) : search;
    let queryParams = _.fromPairs(_.map(parts.split("&"), (e) => e.split("=")));
    return queryParams;
  },

  getNavigationQuery: function (search) {
    let modelOverride = this.getQueryParams(search)["model"];
    let adminCode = this.getQueryParams(search)["admin"];
    let navigationQuery = modelOverride ? { model: modelOverride } : {};
    if (adminCode) {
      navigationQuery["admin"] = adminCode;
    }
    return navigationQuery;
  },

  abbrState: function (input, to) {
    var states = [
      ["Arizona", "AZ"],
      ["Alabama", "AL"],
      ["Alaska", "AK"],
      ["Arkansas", "AR"],
      ["California", "CA"],
      ["Colorado", "CO"],
      ["Connecticut", "CT"],
      ["Delaware", "DE"],
      ["District of Columbia", "DC"],
      ["Florida", "FL"],
      ["Georgia", "GA"],
      ["Hawaii", "HI"],
      ["Idaho", "ID"],
      ["Illinois", "IL"],
      ["Indiana", "IN"],
      ["Iowa", "IA"],
      ["Kansas", "KS"],
      ["Kentucky", "KY"],
      ["Louisiana", "LA"],
      ["Maine", "ME"],
      ["Maryland", "MD"],
      ["Massachusetts", "MA"],
      ["Michigan", "MI"],
      ["Minnesota", "MN"],
      ["Mississippi", "MS"],
      ["Missouri", "MO"],
      ["Montana", "MT"],
      ["Nebraska", "NE"],
      ["Nevada", "NV"],
      ["New Hampshire", "NH"],
      ["New Jersey", "NJ"],
      ["New Mexico", "NM"],
      ["New York", "NY"],
      ["North Carolina", "NC"],
      ["North Dakota", "ND"],
      ["Ohio", "OH"],
      ["Oklahoma", "OK"],
      ["Oregon", "OR"],
      ["Pennsylvania", "PA"],
      ["Rhode Island", "RI"],
      ["South Carolina", "SC"],
      ["South Dakota", "SD"],
      ["Tennessee", "TN"],
      ["Texas", "TX"],
      ["Utah", "UT"],
      ["Vermont", "VT"],
      ["Virginia", "VA"],
      ["Washington", "WA"],
      ["West Virginia", "WV"],
      ["Wisconsin", "WI"],
      ["Wyoming", "WY"],
    ];

    if (to == "abbr" && input.length == 2) {
      return input;
    } else if (to == "abbr") {
      input = input.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
      for (let i = 0; i < states.length; i++) {
        if (states[i][0] == input) {
          return states[i][1];
        }
      }
    } else if (to == "name") {
      input = input.toUpperCase();
      for (let i = 0; i < states.length; i++) {
        if (states[i][1] == input) {
          return states[i][0];
        }
      }
    }
  },

  getCookie(cookieName) {
    let cookies = _.fromPairs(
      document.cookie
        .split(";")
        .map((e) => e.split("=").map((s) => s.replace(/ /g, "")))
    );
    return cookies[cookieName];
  },
  makeTranslation: function (x, y, rotationDeg) {
    return (
      "translate(" +
      x +
      "," +
      y +
      ")" +
      (rotationDeg !== undefined ? " rotate(" + rotationDeg + ")" : "")
    );
  },
  dateFromYYYYMMDD(d) {
    return Util.dateFromISO(new Date(d).toISOString(), 1);
  },

  dateFromISO: function (isoString, hourOverride) {
    let parts = _.map(isoString.split("-"), (e) => parseFloat(e));
    let date = new Date(parts[0], parts[1] - 1, parts[2], hourOverride || 0);
    return date;
  },
  colorCodeRt: function (state, val, low, high) {
    // TODO this won't work globally
    if (StatesWithIssues[state]) {
      return Constants.graphLineColor;
    }
    if (val >= 1) {
      return Constants.redColor;
    } else {
      return Constants.greenColor;
    }
  },
  logComponentChange(props, prevProps, state, prevState) {
    Object.entries(props).forEach(
      ([key, val]) =>
        prevProps[key] !== val && console.log(`Prop '${key}' changed`)
    );
    if (state) {
      Object.entries(state).forEach(
        ([key, val]) =>
          prevState[key] !== val && console.log(`State '${key}' changed`)
      );
    }
  },
  movingAvg(data, neighbors) {
    return data.map((val, idx, arr) => {
      let start = Math.max(0, idx - neighbors),
        end = idx + neighbors;
      let subset = arr.slice(start, end + 1);
      let sum = subset.reduce((a, b) => a + b);
      return sum / subset.length;
    });
  },
};
