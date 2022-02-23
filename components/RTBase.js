import _ from "lodash";
import React, { useState, useEffect, useRef } from "react";
import HeadTag from "./HeadTag";
import PageConfig from "config/PageConfig";
import { useRouter } from "next/router";
import { DataFetchContext } from "lib/DataFetchContext";
import dynamic from "next/dynamic";
import { Util } from "lib/Util";
import DataFetcher from "lib/DataFetcher";
import { SWRConfig } from "swr";
import { Modal } from "antd";

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
  useEffect(() => {
    function info() {
      Modal.info({
        title: "Pausing our nowcasting service",
        content: (
          <div>
            <p>To our users:</p>
            <p>
              Since early Jan 2022, we have been working to implement several
              important changes to our model to address differences in natural
              history of disease and changes in immunity associated with the
              emergence and spread of SARS-CoV-2 omicron variants. These changes
              require large structural modifications and extensive testing.
            </p>
            <p>
              We have elected to remove our nowcasts beginning in early Dec.
              2021 and temporarily halt our daily model runs while we work on
              this more stable version of our model for the omicron and
              post-omicron era. We apologize for any disruptions, and want to
              assure you that we are working nonstop to get Covidestim back up
              and running with current nowcast estimates in the next few weeks.
              Thanks for your patience and understanding.{" "}
              <b>This change will occur on Wednesday, March 2.</b>
            </p>
            <p>
              <i>Wednesday, Feb 23</i>
            </p>
          </div>
        ),
        onOk() {},
      });
    }

    info();
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
      <SWRConfig
        value={{
          refreshInterval: 0,
          dedupingInterval: 1000 * 60 * 60,
          revalidateOnFocus: false,
        }}
      >
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
      </SWRConfig>
      <GoogleAnalyticsTag analyticsID="UA-173420256-1" />
    </div>
  );
}
