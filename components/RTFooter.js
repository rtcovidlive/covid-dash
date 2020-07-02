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
        <Title level={2}>Footer</Title>
        <p>
          Our model code is open source and{" "}
          <a href="https://github.com/covidestim">available on GitHub</a>.
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
          Contributors to this project include:{" "}
          <a href="http://tedcohenlab.org/Melanie-Chitwood/">
            Melanie H. Chitwood
          </a>
          , <a href="http://tedcohenlab.org/">Ted Cohen</a>,{" "}
          <a href="http://tedcohenlab.org/kenneth-gunasekera-ba/">
            Kenneth Gunasekera
          </a>
          ,{" "}
          <a href="http://tedcohenlab.org/joshua-havumaki-phd/">
            Joshua Havumaki
          </a>
          ,
          <a href="https://www.hsph.harvard.edu/nicolas-menzies/">
            Nicolas A. Menzies
          </a>
          ,{" "}
          <a href="https://medicine.yale.edu/profile/virginia_pitzer/">
            Virginia E. Pitzer
          </a>
          , <a href="http://tedcohenlab.org/marcus-russi/">Marcus Russi</a>,{" "}
          <a href="https://medicine.yale.edu/profile/joshua_warren/">
            Joshua L. Warren
          </a>
          , and{" "}
          <a href="https://medicine.yale.edu/profile/daniel_weinberger/">
            Daniel M. Weinberger
          </a>
          .
        </p>
        <p>
          Original site built by{" "}
          <a href="https://twitter.com/mikeyk">Mike Krieger</a>, with thanks to
          Ryan O&rsquo;Rourke and Thomas Dimson.
        </p>
        <p>
          Visualizations built using <a href="https://d3js.org">d3</a>; site
          built using <a href="https://nextjs.org/">Next.js</a>.
        </p>
      </div>
    </Row>
  );
});
