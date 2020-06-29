import React from "react";
import { Title } from "./Typography";
import { Row } from "./Grid";

export const RTFooter = React.forwardRef(function (props, footerRef) {
  function knownIssue(html) {
    return { __html: html };
  }
  return (
    <Row className="rt-overview-footer">
      <div
        id="footer"
        className="rt-overview-footer-inner"
        ref={footerRef}
        style={{ maxWidth: props.maxWidth }}
      >
        <Title level={2}>
          Calculating R<sub>t</sub>
        </Title>
        <p>
          R<sub>t</sub> represents the effective reproduction rate of the virus
          calculated for each locale. It lets us estimate how many secondary
          infections are likely to occur from a single infection in a specific
          area. Values over 1.0 mean we should expect more cases in that area,
          values under 1.0 mean we should expect fewer.
        </p>
        <p>
          <a
            className="external-link"
            target="_new"
            onClick={() => {
              window.ga && window.ga("send", "event", "download", "rtcsv");
              window.open("https://d14wlfuexuxgcm.cloudfront.net/covid/rt.csv");
            }}
            href="https://d14wlfuexuxgcm.cloudfront.net/covid/rt.csv"
          >
            Download calculated R<sub>t</sub> values per-state
          </a>
        </p>
        <p>
          Read more in our <a href="/faq">FAQ</a>.
        </p>
        <p>
          Our <a href="https://github.com/rtcovidlive/covid-model">model code</a> and <a href="https://github.com/rtcovidlive/covid-dash">website source</a>
            {" "}are available on GitHub
          .
        </p>
        <p>
          Case count data from{" "}
          <a className="external-link" href="https://covidtracking.com">
            The COVID Tracking Project
          </a>
          .
        </p>
        <p>
          While we make a best effort to accurately describe R<sub>t</sub>,
          nothing can do that perfectly. Please calibrate with other sources,
          like{" "}
          <a href="https://epiforecasts.io/covid/posts/national/united-states/">
            epiforecasts.io
          </a>
          , as well.
        </p>
        {props.knownIssues && props.knownIssues.length > 0 && (
          <>
            <Title level={2}>Known Issues</Title>
            <ul id="known-issues">
              {_.map(props.knownIssues, (e, i) => {
                return (
                  <li key={i} dangerouslySetInnerHTML={knownIssue(e)}></li>
                );
              })}
            </ul>
          </>
        )}
        <p>
          While we may not be able to respond to every email, you can reach out{" "}
          <a href="mailto:hello@rt.live">here</a>.
        </p>
        <p>
          Model by <a href="https://twitter.com/kevin">Kevin Systrom</a> and{" "}
          <a href="https://twitter.com/tvladeck">Thomas Vladeck</a>. Powered by{" "}
          <a href="https://docs.pymc.io/">PyMC3</a>.
        </p>
        <p>
          Site built by <a href="https://twitter.com/mikeyk">Mike Krieger</a>,
          with thanks to Ryan O&rsquo;Rourke and Thomas Dimson.
        </p>
        <p>
          Visualizations built using <a href="https://d3js.org">d3</a>; site
          built using <a href="https://nextjs.org/">Next.js</a>.
        </p>
      </div>
    </Row>
  );
});
