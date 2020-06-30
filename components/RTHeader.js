import { useLayoutEffect } from "react";
import styled from "styled-components";
import { timeFormat } from "d3-time-format";
import Link from "next/link";
import { Row, Col } from "./Grid";
import { Title } from "./Typography";
import { ShareButtons } from "./ShareButtons";
import { Util } from "lib/Util";

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
  let shareOnTop = props.width < 768;
  let shareButtons = <ShareButtons href="https://rt.live" align="right" />;
  let navigationQuery = Util.getNavigationQuery(document.location.search);
  return (
    <>
      <div className="rt-header-wrapper">
        <HeaderInner>
          <Row>
            {shareOnTop && shareButtons}
            <Col size={shareOnTop ? 24 : 12}>
              <MainTitle level={1}>
                R<sub>t</sub> COVID-19{" "}
              </MainTitle>
            </Col>
            {!shareOnTop && <Col size={12}>{shareButtons}</Col>}
          </Row>
          <p>
            These are up-to-date values for R<sub>t</sub>, a key measure of how
            fast the virus is growing. It&rsquo;s the average number of people
            who become infected by an infectious person. If R<sub>t</sub> is
            above 1.0, the virus will spread quickly. When R<sub>t</sub> is
            below 1.0, the virus will stop spreading.{" "}
            <Link href="/faq" as="/faq">
              <a>Learn More</a>
            </Link>
            .
          </p>
          <div className="rt-header-updates">
            {props.areaName && (
              <Link
                href="/[countrycode]/[subarea]"
                as={{
                  pathname: `/us/${props.subArea}`,
                  query: navigationQuery,
                }}
              >
                <div
                  onClick={() => {
                    window.ga &&
                      window.ga("send", "event", "click", "header-state-promo");
                  }}
                  className="rt-header-update-entry rt-header-update-entry-alert"
                  style={{ marginRight: 12, marginBottom: 0, paddingRight: 12 }}
                >
                  See details about the spread in <b>{props.areaName}</b>
                </div>
              </Link>
            )}
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
          </div>
        </HeaderInner>
      </div>
    </>
  );
}

export default RTHeader;
