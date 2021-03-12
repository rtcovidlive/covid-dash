import { useLayoutEffect } from "react";
import styled from "styled-components";
import { timeFormat } from "d3-time-format";
import Link from "next/link";
import { Row, Col } from "./Grid";
import { Title } from "./Typography";
import { ShareButtons } from "./ShareButtons";
import { DiffOutlined, VerticalAlignBottomOutlined } from "@ant-design/icons";

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
            <div className="rt-header-update-entry rt-header-update-entry-yellow">
              <a
                href={"/updates.pdf"}
                style={{ color: "inherit", textDecoration: "inherit" }}
              >
                <DiffOutlined /> <strong>(2/10) New model changes</strong>
              </a>
            </div>
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
                <VerticalAlignBottomOutlined /> County estimates
              </a>
            </div>
            <div className="rt-header-update-entry rt-header-update-entry-alert">
              <a
                href={
                  "https://covidestim.s3.us-east-2.amazonaws.com/latest/state/estimates.csv"
                }
                style={{ color: "inherit", textDecoration: "inherit" }}
              >
                <VerticalAlignBottomOutlined /> State estimates
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
            model that combines published evidence on COVID-19 transmission,
            natural history and diagnosis with reported cases and deaths for
            over 3,000 locations within the United States. Our methodology can
            be found on{" "}
            <a href="https://www.medrxiv.org/content/10.1101/2020.06.17.20133983v1">
              medRxiv
            </a>
            , with regular updates to our model documented{" "}
            <a href="https://www.covidestim.org/updates.pdf">here</a>. You can
            run our model with your own data, using the{" "}
            <a href="https://pkg.covidestim.org/">covidestim</a> R package.
            State-level data is sourced from the{" "}
            <a href="https://covidtracking.com/">COVID Tracking Project</a>, and
            county-level data comes from{" "}
            <a href="https://github.com/CSSEGISandData/COVID-19">
              Johns Hopkins CSSE
            </a>
            . Our computational pipeline can be viewed at our GitHub{" "}
            <a href="https://github.com/covidestim">organization</a>. We fit
            county-level models using an optimization algorithm. We fit
            state-level models using a Hamiltonian Monte Carlo (HMC) algorithm
            to provide point estimates as well as measures of uncertainty. If
            HMC fitting does not converge for a state, the optimization
            algorithm is used instead that day, and the results will lack
            uncertainty intervals.
          </p>
          <p>
            <strong>3/12</strong>: Missouri data anomalies (documented{" "}
            <a href="https://github.com/CSSEGISandData/COVID-19/issues/3806">
              here
            </a>
            ) are preventing accurate county-level modeling. We will restore
            estimates when Missouri's Department of Health releases the
            necessary time series. State estimates are unimpacted at this time.
          </p>
        </HeaderInner>
      </div>
    </>
  );
}

export default RTHeader;
