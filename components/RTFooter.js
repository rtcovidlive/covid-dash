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
        <div style={{ marginTop: "25px", marginBottom: "25px" }}>
          <a href="https://publichealth.yale.edu/emd/">
            <img src="/ysph.png" width={Math.min(450, props.maxWidth)} />
          </a>
        </div>
        <div style={{ marginTop: "25px", marginBottom: "25px" }}>
          <a href="https://www.hsph.harvard.edu/global-health-and-population/">
            <img src="/hsph.png" width={Math.min(450, props.maxWidth)} />
          </a>
        </div>
        <p>
          The effective reproductive number (R<sub>t</sub>) is an important
          metric of epidemic growth. R<sub>t</sub> describes the average number
          of people that one individual is expected to infect, at any given
          timepoint in an epidemic. When R<sub>t</sub> is above 1, we expect
          cases to increase in the near future. When R<sub>t</sub> is below one,
          we expect cases to decrease in the near future.
        </p>

        <p>
          Calculating R<sub>t</sub> from the reported number of reported cases
          can be complicated. People are typically diagnosed after they have
          already spread the disease, and many are not diagnosed at all. As
          diagnostic guidelines loosen and testing availability improves, we
          expect to see more cases, though the underlying incidence of disease
          may or may not have changed. Lags in diagnosis, diagnostic delays, and
          changing diagnostic guidelines will all impact case reports, and bias
          estimates of R<sub>t</sub>.
        </p>

        <p>
          We can avoid these biases by estimating R<sub>t</sub> from the number
          of new infections each day. We estimate new infections using a
          statistical model that combines information about reported cases,
          reported deaths, the fraction of positive tests each day (an indicator
          of testing capacity), disease stage duration, and disease severity and
          mortality risks. Once we estimate the number of new infections each
          day, we can use that number to make a more robust estimate of R
          <sub>t</sub>. If you have access to line-list data, you may be able to
          achieve tighter estimates.
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
          ,{" "}
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
