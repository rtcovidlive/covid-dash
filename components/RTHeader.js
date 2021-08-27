import { useLayoutEffect } from "react";
import styled from "styled-components";
import { timeFormat } from "d3-time-format";
import Link from "next/link";
import { Row, Col } from "./Grid";
import { Title } from "./Typography";
import { ShareButtons } from "./ShareButtons";
import { DiffOutlined, VerticalAlignBottomOutlined } from "@ant-design/icons";
import { Collapse } from "antd";
import { GithubOutlined } from "@ant-design/icons";

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
    font-size: 33px !important;
  }
`;

export const SubTitle = styled(Title)`
  font-weight: 600;
  font-size: 30;
  padding-left: 17px;
  display: inline-block;
  letter-spacing: -0.5px;
  @media (max-width: 768px) {
    display: block;
    padding-left: 0;
    margin-left: -1px !important;
    font-size: 22px !important;
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
  const { Panel } = Collapse;

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
              {props.width > 768 && (
                <MainTitle level={1}>
                  covidestim · COVID-19 nowcasting
                </MainTitle>
              )}
              {props.width <= 768 && (
                <>
                  <MainTitle level={1}>covidestim</MainTitle>
                  <SubTitle>COVID-19 nowcasting</SubTitle>
                </>
              )}
            </Col>
          </Row>
          <div className="rt-header-updates">
            <div className="rt-header-update-entry rt-header-update-entry-yellow">
              <a
                href={"/updates.pdf"}
                style={{ color: "inherit", textDecoration: "inherit" }}
              >
                <DiffOutlined /> <strong>(8/16) New model changes</strong>
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
            <strong>
              The <i>covidestim</i> project tries to paint the most complete,
              current, and granular picture possible of the U.S. COVID-19
              epidemic
            </strong>
            . We use an in-house statistical model that combines evidence on
            COVID-19 transmission, natural history and diagnosis with reported
            cases and deaths for nearly every state and county in the US. Our
            methodology can be found on{" "}
            <a href="https://www.medrxiv.org/content/10.1101/2020.06.17.20133983v2">
              medRxiv
            </a>
            , with regular updates to our model documented{" "}
            <a href="/updates.pdf">here</a>. You can run our model with your own
            data, using the <GithubOutlined />{" "}
            <a href="https://pkg.covidestim.org/">covidestim</a> R package.
            State- and county-level data are sourced from{" "}
            <a href="https://github.com/CSSEGISandData/COVID-19">
              Johns Hopkins CSSE
            </a>
            . We fit county-level models using an optimization algorithm. The
            state-level models are fit using a Hamiltonian Monte Carlo (HMC)
            algorithm to provide point estimates as well as measures of
            uncertainty. If HMC fitting does not converge for a state, the
            optimization algorithm is used instead that day, and the results
            will lack uncertainty intervals.
          </p>
          <p>
            <strong>Recent data quality issues</strong>: Florida no longer
            reports county-level deaths, so we don't use their county-level
            deaths data after June 5th. Nebraska hasn't consistently reported at
            the county-level since June, so we have archived their county-level
            estimates.
          </p>
          <div
            style={{
              backgroundColor: "rgb(29, 171, 252)",
              marginBottom: "20px",
              padding: "10px",
              maxWidth: "1000px",
            }}
          >
            <Collapse defaultActiveKey={[]} bordered={false}>
              <Panel
                key="1"
                header={
                  <strong>
                    Beginning August 27th: uncertainty estimates for all states.
                  </strong>
                }
              >
                We had been unable to publish uncertainty estimates for all
                states due to the time constraints we had for running the model
                (10 hours). We have now developed a method to compute
                uncertainty intervals for states which would normally not have
                uncertainty estimates. We use the available uncertainty
                estimates from other states to compute these intervals. More
                details <a href="/updates.pdf">here</a>.
              </Panel>
            </Collapse>
          </div>
        </HeaderInner>
      </div>
    </>
  );
}

export default RTHeader;
