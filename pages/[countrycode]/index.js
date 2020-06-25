import _ from "lodash";
import React, { useState, useEffect, useRef } from "react";
import PageConfig from "config/PageConfig";
import { RTOverview } from "components/RTOverview";
import { RTBase } from "components/RTBase";

export async function getStaticPaths() {
  let active = _.keys(PageConfig);
  return {
    fallback: false,
    paths: active.map((country) => {
      return {
        params: {
          countrycode: country,
        },
      };
    }),
  };
}

export async function getStaticProps({ params }) {
  return {
    props: {
      countrycode: params.countrycode,
    },
  };
}

export default function RTPage(props) {
  let contentClass = RTOverview;
  return (
    <RTBase
      countrycode={props.countrycode}
      subarea={props.subarea}
      contentClass={contentClass}
    />
  );
}
