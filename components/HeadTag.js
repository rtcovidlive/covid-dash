import React from "react";
import Head from "next/head";
export default function HeadTag(props) {
  var ogURL;
  if (props.countryCode && props.subarea) {
    ogURL = `https://rt.live/${props.countryCode}/${props.subarea}`;
  } else {
    ogURL = "https://rt.live/";
  }
  let ogTitle = props.pageTitle ? props.pageTitle.split(":")[0] : "Rt COVID-19";
  return (
    <Head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#000000" />
      <meta name="description" content="Rt: Effective Reproduction Number" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:creator" content="@kevin" />
      <meta property="og:url" content={ogURL} />
      <meta property="og:title" content={ogTitle} />
      <meta
        property="og:description"
        content="Up-to-date values for Rt — the number to watch to measure COVID spread."
      />
      <meta
        property="og:image"
        content={props.shareImageURL || "https://rt.live/hero-screen.png?1"}
      />
      <meta property="og:type" content="website" />
      <title>{props.pageTitle || "Rt: Effective Reproduction Number"}</title>
    </Head>
  );
}
