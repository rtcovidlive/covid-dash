import _ from "lodash";
import { getActiveCountries } from "config/ActiveConfig";
import React, { useState, useEffect, useRef } from "react";
import { RTOverview } from "components/RTOverview";
import { RTBase } from "components/RTBase";

export async function getStaticPaths() {
  let active = getActiveCountries();
  return {
    fallback: false,
    paths: active.map((country) => {
      return {
        params: {
          countrycode: country.code,
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
