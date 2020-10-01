import React from "react";
import Head from "next/head";
export default function HeadTag(props) {
  var ogURL;
  if (props.countryCode && props.subarea) {
    ogURL = `https://covidestim.org/${props.countryCode}/${props.subarea}`;
  } else {
    ogURL = "https://covidestim.org/";
  }
  let ogTitle = props.pageTitle
    ? props.pageTitle.split(":")[0]
    : "covidestim: COVID-19 nowcasting";
  return (
    <Head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#000000" />
      <meta name="description" content="covidestim: COVID-19 nowcasting" />
      <meta property="og:url" content={ogURL} />
      <meta property="og:title" content={ogTitle} />
      <meta
        property="og:description"
        content="Up-to-date estimates of key covid-19 metrics for your county or state"
      />
      <meta
        property="og:image"
        content={props.shareImageURL || "https://covidestim.org/hero-new.png"}
      />
      <meta property="og:type" content="website" />
      <title>{props.pageTitle || "covidestim: COVID-19 nowcasting"}</title>
    </Head>
  );
}
