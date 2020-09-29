import { useLayoutEffect } from "react";
import styled from "styled-components";
import { timeFormat } from "d3-time-format";
import Link from "next/link";
import { Row, Col } from "./Grid";
import { Title } from "./Typography";
import { ShareButtons } from "./ShareButtons";

export const MainTitle = styled(Title)`
  font-weight: 600;
  font-size: 36px;
  padding-left: 17px;
  display: inline-block;
  letter-spacing: -0.5px;
  @media (max-width: 768px) {
    display: block;
    padding-left: 0;
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
    <ShareButtons href="https://covidestim.org/" align="right" />
  );
  return (
    <>
      <div className="rt-header-wrapper">
        <HeaderInner>
          {shareButtons}
          <Row>
            <Col size={24}>
              <img
                src="icon.png"
                style={{ height: "60px", width: "60px", verticalAlign: "top" }}
              />
              <MainTitle level={1}>covidestim · COVID-19 nowcasting</MainTitle>
            </Col>
          </Row>
          <div className="rt-header-updates">
            <div
              onClick={() =>
                document
                  .getElementById("footer")
                  .scrollIntoView({ behavior: "smooth" })
              }
              className="rt-header-update-entry"
            >
              Last model run:{" "}
              {timeFormat("%-m/%-d at %-I:%M%p")(props.lastUpdated)}
            </div>
            <div className="rt-header-update-entry rt-header-update-entry-alert">
              <a
                href={
                  "https://covidestim.s3.us-east-2.amazonaws.com/latest/estimates.csv"
                }
                style={{ color: "inherit", textDecoration: "inherit" }}
              >
                ⬇ County estimates
              </a>
            </div>
            <div className="rt-header-update-entry rt-header-update-entry-alert">
              <a
                href={
                  "https://covidestim.s3.us-east-2.amazonaws.com/latest/state/estimates.csv"
                }
                style={{ color: "inherit", textDecoration: "inherit" }}
              >
                ⬇ State estimates
              </a>
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
          <p>
            We make estimates about the COVID-19 epidemic using a statistical
            model that combines information about reported cases, reported
            deaths, disease stage duration, and disease severity and mortality
            risks. You can read a preprint of our methodology at{" "}
            <a href="https://www.medrxiv.org/content/10.1101/2020.06.17.20133983v1">
              medRxiv
            </a>
            . You can also run our model with your own data, using the{" "}
            <a href="https://pkg.covidestim.org">covidestim R package</a>. Our
            data source for the following estimates is the{" "}
            <a href="https://covidtracking.com/">COVID Tracking Project</a>, and
            our dashboard was adapted from{" "}
            <a href="https://github.com/rtcovidlive/covid-dash">covid-dash</a>.
            Our computational pipeline can be viewed at our{" "}
            <a href="https://github.com/covidestim">GitHub organization</a>.
          </p>
        </HeaderInner>
      </div>
    </>
  );
}

export default RTHeader;
