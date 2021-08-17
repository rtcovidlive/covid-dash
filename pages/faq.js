import styled from "styled-components";
import { Title } from "components/Typography";
import dynamic from "next/dynamic";

const faqMarkdown = require("markdown/faq.md");

const FAQTitle = styled(Title)`
  font-size: 42px !important;
  font-weight: 800;
  margin-left: -3px !important;
  @media (max-width: 768px) {
    font-size: 34px !important;
    margin-top: 30px !important;
  }
`;

const FAQInner = styled.div`
  max-width: 900px;
`;

const FAQWrapper = styled.div`
  padding-left: 48px;
  margin: 0 auto 40px auto;
  max-width: 1500px;
  line-height: auto;
  color: black;

  h2 {
    margin: 20px 0px 4px 0px;
    line-height: 1.2;
  }
  p {
    margin: 0 !important;
  }
`;

const GoogleAnalyticsTag = dynamic(
  () => import("components/GoogleAnalyticsTag"),
  {
    ssr: false,
  }
);

function getMarkdown() {
  return { __html: faqMarkdown };
}

export default function FAQ() {
  return (
    <div className="App">
      <div className="main-content">
        <div className="rt-header-wrapper">
          <div className="rt-header">
            <FAQTitle level={1}>
              R<sub>t</sub> Live FAQ & Known Issues
            </FAQTitle>
          </div>
          <FAQWrapper>
            <FAQInner dangerouslySetInnerHTML={getMarkdown()} />
          </FAQWrapper>
        </div>
        <div className="rt-container-wrapper"></div>
      </div>
      <GoogleAnalyticsTag analyticsID="UA-163852138-1" />
    </div>
  );
}
