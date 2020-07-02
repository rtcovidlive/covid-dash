import { useLayoutEffect } from "react";
import styled from "styled-components";
import { timeFormat } from "d3-time-format";
import Link from "next/link";
import { Row, Col } from "./Grid";
import { Title } from "./Typography";
import { ShareButtons } from "./ShareButtons";

export const MainTitle = styled(Title)`
  margin-left: -3px !important;
  font-weight: 600;
  font-size: 42px;
  letter-spacing: -0.5px;
  @media (max-width: 768px) {
    margin-left: -1px !important;
    font-size: 34px !important;
  }
`;

export const HeaderInner = styled.div`
  margin: 25px auto 0 auto;
  max-width: 1500px;
  padding-left: 50px;
  @media (max-width: 768px) {
    padding-left: 10px;
    margin-top: 30px !important;
  }
  p {
    max-width: 1000px;
  }
`;

export function RTHeader(props) {
  useLayoutEffect(() => {
    window.twttr && window.twttr.widgets.load();
    window.FB && window.FB.XFBML.parse();
  });
  let shareButtons = (
    <ShareButtons href="https://covid-dash-murex.vercel.app/" align="right" />
  );
  return (
    <>
      <div className="rt-header-wrapper">
        <HeaderInner>
          <Row>
            {shareButtons}
            <Col size={24}>
              <MainTitle level={1}>
                covidestim · R<sub>t</sub> estimation
              </MainTitle>
            </Col>
          </Row>
          <p>
            The effective reproductive number (R<sub>t</sub>) is an important
            metric of epidemic growth. R<sub>t</sub> describes the average
            number of people that one individual is expected to infect, at any
            given timepoint in an epidemic. When R<sub>t</sub> is above 1, we
            expect cases to increase in the near future. When R<sub>t</sub> is
            below one, we expect cases to decrease in the near future.
          </p>

          <p>
            Calculating R<sub>t</sub> from the reported number of reported cases
            can be complicated. People are typically diagnosed after they have
            already spread the disease, and many are not diagnosed at all. As
            diagnostic guidelines loosen and testing availability improves, we
            expect to see more cases, though the underlying incidence of disease
            may or may not have changed. Lags in diagnosis, diagnostic delays,
            and changing diagnostic guidelines will all impact case reports, and
            bias estimates of R<sub>t</sub>.
          </p>

          <p>
            We can avoid these biases by estimating R<sub>t</sub> from the
            number of new infections each day. We estimate new infections using
            a statistical model that combines information about reported cases,
            reported deaths, the fraction of positive tests each day (an
            indicator of testing capacity), disease stage duration, and disease
            severity and mortality risks. Once we estimate the number of new
            infections each day, we can use that number to make a more robust
            estimate of R<sub>t</sub>. You can read a preprint of our
            methodology at{" "}
            <a href="https://www.medrxiv.org/content/10.1101/2020.06.17.20133983v1">
              medRxiv
            </a>
            . You can also run our model with your own data, using the{" "}
            <a href="https://github.com/covidestim/covidestim">
              covidestim R package
            </a>
            . If you have access to line-list data, you may be able to achieve
            tighter estimates. Our data source for the following estimates is
            the <a href="https://covidtracking.com/">COVID Tracking Project</a>.
            You can view every part of our data pipeline{" "}
            <a href="https://github.com/covidestim">here</a>.
          </p>
          <div className="rt-header-updates">
            <div
              onClick={() =>
                document
                  .getElementById("footer")
                  .scrollIntoView({ behavior: "smooth" })
              }
              className="rt-header-update-entry"
            >
              Data Last Updated:{" "}
              {timeFormat("%-m/%-d at %-I:%M%p")(props.lastUpdated)}
            </div>
            {/*
              <span
                className="rt-header-update-entry rt-header-update-entry-alert"
                onClick={() => window.open("/faq")}
                style={{ marginRight: 0, marginBottom: 0, paddingRight: 12 }}
              >
                Major site update June 25th
              </span>
            */}
          </div>
        </HeaderInner>
      </div>
    </>
  );
}

export default RTHeader;
