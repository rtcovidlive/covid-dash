import Router from "next/router";
import { Util } from "./Util";

export const Navigation = {
  navigateToAreaOverview(configCode, docSearch) {
    let query = Util.getNavigationQuery(docSearch);
    Router.push(`/index`, {
      pathname: `/`,
      query: query,
    });
  },
  navigateToSubArea(configCode, subArea, docSearch) {
    let query = Util.getNavigationQuery(docSearch);
    Router.push(`/[countrycode]/[subarea]`, {
      pathname: `/${configCode}/${subArea}`,
      query: query,
    });
  },
  navigateToCounty(configCode, subArea, fips, docSearch) {
    let query = Util.getNavigationQuery(docSearch);
    Router.push(`/[countrycode]/[subarea]/[fips]`, {
      pathname: `/${configCode}/${subArea}/${fips}`,
      query: query,
    });
  },
};
