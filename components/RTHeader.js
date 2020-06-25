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
  let shareOnTop = props.width < 768;
  let shareButtons = <ShareButtons href="https://rt.live" align="right" />;
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
            <span
              className="rt-header-update-entry rt-header-update-entry-alert"
              onClick={() => window.open("/faq")}
              style={{ marginRight: 0, marginBottom: 0, paddingRight: 12 }}
            >
              Major site update June 25th
            </span>
            <p>
              We&rsquo;ve added detailed pages for each state, showing testing
              volume and our test-adjusted positive case count. Click Details
              next to the state name.
            </p>
          </div>
        </HeaderInner>
      </div>
    </>
  );
}

export default RTHeader;
