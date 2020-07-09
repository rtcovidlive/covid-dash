import React from "react";
import _ from "lodash";
import PageConfig from "config/PageConfig";
import { RTBase } from "components/RTBase";
import { RTSubareaOverview } from "components/RTSubareaOverview";
import { getActiveCountries } from "config/ActiveConfig";

export async function getStaticPaths() {
  let active = getActiveCountries();
  let staticPaths = {
    fallback: false,
    paths: _.flatten(
      active.map((country) => {
        return _.flatten(
          _.map(_.keys(country.subAreas), (subArea) => {
            return [
              {
                params: {
                  countrycode: country.code,
                  subarea: subArea,
                },
              },
              {
                params: {
                  countrycode: country.code,
                  subarea: subArea.toLowerCase(),
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
      subareaName:
        PageConfig[params.countrycode].subAreas[params.subarea.toUpperCase()],
    },
  };
}
export default function StatePage(props) {
  let contentClass = RTSubareaOverview;
  let title = `${props.subareaName} Rt: COVID Reproduction Rate`;
  return <RTBase pageTitle={title} contentClass={contentClass} {...props} />;
}
