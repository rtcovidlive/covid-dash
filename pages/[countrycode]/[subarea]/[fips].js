import React from "react";
import _ from "lodash";
import PageConfig from "config/PageConfig";
import { RTBase } from "components/RTBase";
import { RTSubareaOverview } from "components/RTSubareaOverview";

export async function getStaticPaths() {
  let active = _.keys(PageConfig);
  let staticPaths = {
    fallback: false,
    paths: _.flatten(
      active.map((country) => {
        return _.flatten(
          _.map(PageConfig[country].counties, (county) => {
            return [
              {
                params: {
                  countrycode: country,
                  subarea: county.abbr,
                  fips: county.fips,
                },
              },
              {
                params: {
                  countrycode: country,
                  subarea: county.abbr.toLowerCase(),
                  fips: county.fips,
                },
              },
            ];
          })
        );
      })
    ),
  };
  return staticPaths;
}

export async function getStaticProps({ params }) {
  return {
    props: {
      countrycode: params.countrycode,
      subarea: params.subarea.toUpperCase(),
      fips: params.fips,
      subareaName:
        PageConfig[params.countrycode].subAreas[params.subarea.toUpperCase()],
      countyName: _.find(
        PageConfig["us"].counties,
        (d) => d.fips == params.fips
      ).county,
    },
  };
}
export default function StatePage(props) {
  let contentClass = RTSubareaOverview;
  let title = `${props.subareaName} Rt: COVID Reproduction Rate`;
  return <RTBase pageTitle={title} contentClass={contentClass} {...props} />;
}
