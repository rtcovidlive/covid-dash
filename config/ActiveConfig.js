import PageConfig from "config/PageConfig";
import _ from "lodash";

export function getDefaultCountry() {
  let env = process.env["DEFAULT_COUNTRY"] || getActiveCountries()[0].code;
  return env;
}

export function getActiveCountries() {
  let env = process.env["ACTIVE_COUNTRIES"] || "us";
  let splitEnv = env.split(",");
  return _.filter(PageConfig, (obj, key) => {
    return splitEnv.indexOf(key) !== -1;
  });
}
