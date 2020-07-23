import "styles/App.scss";
import _ from "lodash";
import React, { useState, useEffect, useRef } from "react";
import HeadTag from "./HeadTag";
import PageConfig from "config/PageConfig";
import { useRouter } from "next/router";
import { DataFetchContext } from "lib/DataFetchContext";
import dynamic from "next/dynamic";
import { Util } from "lib/Util";
import DataFetcher from "lib/DataFetcher";

const GoogleAnalyticsTag = dynamic(() => import("./GoogleAnalyticsTag"), {
  ssr: false,
});
const mainContentRef = React.createRef();

export function RTBase(props) {
  const [rtData, setRTData] = useState(null);
  const [config, setConfig] = useState(null);
  const [contentWidth, setContentWidth] = useState(100);
  const router = useRouter();

  function getModelOverride() {
    let queryParams = Util.getQueryParams(document.location.search);
    return queryParams.model;
  }
  function useNewHeader() {
    let queryParams = Util.getQueryParams(document.location.search);
    return queryParams.newheader === "true";
  }
  useEffect(() => {
    if (!config) {
      return;
    }
    let override = getModelOverride();
    new DataFetcher(config).fetchLatest(override).then(
      (rtData) => setRTData(rtData),
      (err) => {
        // TODO handle error here;
        console.log("Data Fetching Error", err);
      }
    );
  }, [config]);
  useEffect(() => {
    var resizeTimer;
    function setNewWidth() {
      if (mainContentRef.current) {
        setContentWidth(mainContentRef.current.getBoundingClientRect().width);
      }
    }
    // TODO handle this padding more gracefully
    setNewWidth();
    window.addEventListener("resize", () => {
      if (resizeTimer) {
        window.clearTimeout(resizeTimer);
      }
      resizeTimer = window.setTimeout(() => {
        setNewWidth();
      }, 250);
    });
  }, [mainContentRef]);

  var countryCode;
  if (!config && (router.query.countrycode || props.countrycode)) {
    countryCode = (router.query.countrycode || props.countrycode).toLowerCase();
    setConfig(PageConfig[countryCode]);
  }
  var shareImageURL;
  if (config && props.subarea) {
    shareImageURL = config.getURLForShareImageGeneration(props.subarea);
  }
  return (
    <div className="App">
      <HeadTag
        pageTitle={props.pageTitle}
        shareImageURL={shareImageURL}
        countryCode={props.countrycode}
        subarea={props.subarea}
      />
      <div className="main-content" ref={mainContentRef}>
        <DataFetchContext.Provider value={rtData}>
          <DataFetchContext.Consumer>
            {(value) => {
              if (!value || !config) {
                return null;
              }
              let subProps = {
                width: contentWidth,
                config: config,
              };
              Object.assign(subProps, props);
              return React.createElement(props.contentClass, subProps);
            }}
          </DataFetchContext.Consumer>
        </DataFetchContext.Provider>
      </div>
      <GoogleAnalyticsTag analyticsID="UA-173420256-1" />
    </div>
  );
}
