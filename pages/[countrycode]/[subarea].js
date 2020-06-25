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
          _.map(_.keys(PageConfig[country].subAreas), (subArea) => {
            return [
              {
                params: {
                  countrycode: country,
                  subarea: subArea,
                },
              },
              {
                params: {
                  countrycode: country,
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
