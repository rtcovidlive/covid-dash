import { useLayoutEffect } from "react";
import styled from "styled-components";
import { timeFormat } from "d3-time-format";
import { Row, Col } from "./Grid";
import { Title } from "./Typography";
import { ShareButtons } from "./ShareButtons";
import {
  DiffOutlined,
  ReadOutlined,
  VerticalAlignBottomOutlined,
} from "@ant-design/icons";
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
                <DiffOutlined /> <strong>Model changelog</strong>
              </a>
            </div>
            <div className="rt-header-update-entry rt-header-update-entry-orange">
              <a
                target="_blank"
                href="https://blog.covidestim.org/"
                style={{ color: "inherit", textDecoration: "inherit" }}
              >
                <ReadOutlined /> <strong>Read our blog</strong>
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
                href={"https://cdn.covidestim.org/latest/estimates.csv"}
                style={{ color: "inherit", textDecoration: "inherit" }}
              >
                <VerticalAlignBottomOutlined /> County estimates
              </a>
            </div>
            <div className="rt-header-update-entry rt-header-update-entry-alert">
              <a
                href={"https://cdn.covidestim.org/latest/state/estimates.csv"}
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
              <i>covidestim</i> tries to paint a complete, current, and granular
              picture of the U.S. COVID-19 epidemic
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
            . We fit counties using the{" "}
            <a href="https://en.wikipedia.org/wiki/Broyden%E2%80%93Fletcher%E2%80%93Goldfarb%E2%80%93Shanno_algorithm">
              BFGS
            </a>{" "}
            optimization algorithm, and state models using the slower{" "}
            <a href="https://en.wikipedia.org/wiki/Hamiltonian_Monte_Carlo">
              HMC
            </a>{" "}
            algorithm, which yields uncertainty intervals. When a state run
            takes too long, we rerun it with BFGS and use a{" "}
            <a href="https://blog.covidestim.org/posts/uncertainty-intervals/">
              method
            </a>{" "}
            to estimate the uncertainty.
          </p>
          {/*<strong>11/8:</strong> Model estimates for New Hampshire are
            currently unreliable due to a multi-week failure of the state's case
            reporting system. See{" "}
            <a href="https://github.com/CSSEGISandData/COVID-19/issues/4858">
              this GitHub issue
            </a>{" "}
            and this{" "}
            <a href="https://api.covidestim.org/latest_state_inputs?state=eq.New%20Hampshire&date=gt.2021-10-20&date=lte.2021-11-08&select=date,cases">
              stretch of model input data
            </a>
            .*/}
          {/*<span
              style={{
                borderRadius: 4,
                backgroundColor: "#ffad5c",
                padding: "4.5px 8px",
              }}
            >
              <strong>
                New blog post:{" "}
                <a
                  target="_blank"
                  href="https://blog.covidestim.org/posts/understanding-rt/"
                >
                  Understanding R<sub>t</sub>
                </a>
              </strong>
            </span>
            */}
        </HeaderInner>
      </div>
    </>
  );
}

export default RTHeader;
