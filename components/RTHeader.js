import { useLayoutEffect } from "react";
import styled from "styled-components";
import { timeFormat } from "d3-time-format";
import Link from "next/link";
import { Row, Col } from "./Grid";
import { Title } from "./Typography";
import { ShareButtons } from "./ShareButtons";
import { DiffOutlined, VerticalAlignBottomOutlined } from "@ant-design/icons";
import { Collapse } from "antd";

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
              <MainTitle level={1}>covidestim · COVID-19 nowcasting</MainTitle>
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
              medRxiv{" "}
            </a>
            , with regular updates to our model documented{" "}
            <a href="/updates.pdf">here</a>. You can run our model with your own
            data, using the <a href="https://pkg.covidestim.org/">covidestim</a>{" "}
            R package, possibly in concert with our{" "}
            <a href="https://github.com/covidestim">data pipeline</a>. State-
            and county-level data are sourced from{" "}
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
            Delaware: recent results are{" "}
            <a href="https://github.com/CSSEGISandData/COVID-19/issues/4461">
              currently unreliable
            </a>
            . Florida no longer reports county-level deaths, so we don't use
            their county-level deaths data after June 5th. Nebraska no longer
            consistently reports cases or deaths, and we are in the process of
            archiving their estimates.
          </p>
          <div
            style={{
              backgroundColor: "rgb(29, 171, 252)",
              marginBottom: "20px",
              padding: "10px",
            }}
          >
            <p
              style={{
                backgroundColor: "rgb(16, 90, 251)",
                padding: "8px",
                color: "white",
              }}
            >
              <strong>
                August 16: We've begun using a new model which takes into
                account county- and state-level vaccination data
              </strong>
            </p>
            <Collapse defaultActiveKey={[]} bordered={false}>
              <Panel
                header="Vaccinations started 8 months ago. Why are vaccines only now included in the model?"
                key="1"
              >
                <p>
                  Because Covidestim performs automated daily model runs, we
                  need reliable data sources for any data that went in our
                  model. Data sources that consistently report the vaccination
                  coverage by age group at the county level were not available
                  until a couple months ago.
                </p>
                <p>
                  We have now combined multiple data sources to make vaccination
                  data suitable for our new model. Now that we have developed
                  and evaluated this model update, we are releasing it.
                </p>
              </Panel>
              <Panel
                header="How does the inclusion of vaccination data change how Covidestim works?
"
                key="2"
              >
                <p>
                  The probability of dying from a COVID-19 infection is lower
                  after vaccination. Using the vaccination coverage data, we
                  adjust the modeled probability of dying if infected for each
                  county and state over time. See our{" "}
                  <a href="/updates.pdf">model updates</a> for a more detailed
                  explanation.
                </p>
              </Panel>
              <Panel header="How does this update change the results?" key="3">
                <p>The results have primarily changed in two ways:</p>
                <ol>
                  <li>
                    Earlier in the pandemic (throughout 2020), the estimated
                    daily infections during peaks are, for some counties, lower
                    than the estimates from the previous version of the model.
                    Consequently, these counties also show a lower ‘percent ever
                    infected’.
                  </li>
                  <li>
                    For the period since vaccinations started (early 2021), our
                    new model produces slightly higher estimates of the number
                    of infections than the previous version of the model did.
                  </li>
                </ol>
                <p>
                  You can compare the new and old models using the “Show
                  history” toggle on the county-level pages. This functionality
                  will soon be available for states, too.
                </p>
              </Panel>
              <Panel
                header="The new results are different. Does this new model invalidate the output from old model runs that did not include vaccinations?"
                key="4"
              >
                <p>
                  We do not know the true number of infections in a county or
                  state. Both versions of the Covidestim model produce estimates
                  of the number of infections and Rt based on observed data and
                  several assumptions. We think the new estimates better
                  represent the number of infections in a county, because it
                  takes the changes in mortality into account.
                </p>
              </Panel>
              <Panel
                header="Where can I find more information about the changes made?"
                key="5"
              >
                <p>
                  Take a look at our <a href="/updates.pdf">model updates</a>{" "}
                  document. If you'd like to look at the source code, the key
                  code diff is{" "}
                  <a href="https://github.com/covidestim/covidestim/compare/107322535ec8f1e253a9dd7413e495611765635d...1d9fad480e157b3001ed69e363f04050ea095c69">
                    here
                  </a>
                  , and there are many other changes to other repositories in
                  our <a href="https://github.com/covidestim">organization</a>.
                  See the <a href="#footer">bottom</a> of the page for details
                  on the project
                </p>
              </Panel>
            </Collapse>
          </div>
        </HeaderInner>
      </div>
    </>
  );
}

export default RTHeader;
