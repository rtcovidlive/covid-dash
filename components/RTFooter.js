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
        <div style={{ marginTop: "25px", marginBottom: "25px" }}>
          <a href="https://med.stanford.edu/covid19.html">
            <img src="/stanford.png" width={Math.min(450, props.maxWidth)} />
          </a>
        </div>
        <p>
          This project was supported by{" "}
          <a href="https://govtribe.com/award/federal-grant-award/project-grant-nu38ot000297">
            Cooperative Agreement NU38OT000297
          </a>{" "}
          from the Centers for Disease Control and Prevention (CDC) and the
          Council of State and Territorial Epidemiologists (CSTE), and does not
          necessarily represent the views of CDC or CSTE.
        </p>
        <p>
          The effective reproductive number (R<sub>t</sub>) is an important
          metric of epidemic growth. R<sub>t</sub> is the average number of
          people that an individual infected on day <i>t</i> is expected to go
          on to infect. When R<sub>t</sub> is above 1, we expect cases to
          increase in the near future. When R<sub>t</sub> is below one, we
          expect cases to decrease in the near future.
        </p>

        <p>
          Calculating R<sub>t</sub> from the reported number of reported cases
          is complicated. People are typically diagnosed after they have already
          spread the disease, and many are not diagnosed at all. As diagnostic
          guidelines loosen and testing availability improves, we expect to see
          more cases, though the underlying incidence of disease may or may not
          have changed. Lags in diagnosis, diagnostic delays, and changing
          diagnostic guidelines will all impact case reports, and bias estimates
          of R<sub>t</sub>.
        </p>

        <p>
          We can avoid these biases by estimating R<sub>t</sub> from the number
          of new infections each day. We estimate new infections using a
          statistical model that combines information about reported cases,
          reported deaths, the percentage of the population vaccinated, disease
          stage duration, and disease severity and mortality risks.{" "}
          <strong>
            Our infections metric takes into account the delays mentioned above,
            and includes individuals who haven't tested positive
          </strong>
          . Once we estimate the number of new infections each day, we can use
          that number to produce a more robust estimate of R<sub>t</sub>.{" "}
          <strong>
            Present-day estimates of R<sub>t</sub> are highly uncertain, and can
            change dramatically over time
          </strong>
          . We feel most confident about results for dates which are at least 14
          days in the past. Additionally, R<sub>t</sub> is easy to misinterpret.
          In many cases, we expect users will find our{" "}
          <i>Infections per capita</i> metric to be more useful. See{" "}
          <a href="https://www.nature.com/articles/d41586-020-02009-w">here</a>{" "}
          for a discussion of the pitfalls of R<sub>t</sub>.
        </p>
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
          <a href="https://www.hsph.harvard.edu/menzies-lab/people/fayette-klaassen/">
            Fayette Klaassen
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
          <a href="https://med.stanford.edu/profiles/joshua-salomon">
            Joshua Salomon
          </a>
          ,{" "}
          <a href="https://www.hsph.harvard.edu/menzies-lab/people/nicole-swartwood/">
            Nicole Swartwood
          </a>
          ,{" "}
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
          Compute and computational support provided by the{" "}
          <a href="https://research.computing.yale.edu/">
            Yale Center for Research Computing
          </a>
          . We use <a href="https://nextflow.io/">Nextflow</a> for
          orchestration.
        </p>
        <p>
          Original site built by{" "}
          <a href="https://twitter.com/mikeyk">Mike Krieger</a>, with thanks to
          Ryan O&rsquo;Rourke and Thomas Dimson.
        </p>
        <p>
          Visualizations built using <a href="https://d3js.org">d3</a> and{" "}
          <a href="https://github.com/uber/react-vis">react-vis</a>; site built
          using <a href="https://nextjs.org/">Next.js</a>.
        </p>
      </div>
    </Row>
  );
});
