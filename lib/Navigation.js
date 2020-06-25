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
};
