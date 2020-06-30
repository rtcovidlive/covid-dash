import React, { useState, useLayoutEffect } from "react";
import useScript from "lib/useScript";
import styled from "styled-components";

const ShareButtonWrapper = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
  position: relative;
  left: -3px;
  justify-content: ${(props) =>
    props.align === "left" ? "flex-start" : "flex-end"};
`;

const ShareButtonInner = styled.div`
  display: inline-block;
  height: 30px;
`;

const TwitterWrapper = styled.div`
  vertical-align: bottom;
  display: inline-block;
  height: 20px;
  margin-right: 4px;
  margin-top: 2px;
`;

function twitterTemplate(href) {
  return {
    __html: `<a
            href="https://twitter.com/share?ref_src=twsrc%5Etfw"
            class="twitter-share-button"
            data-url=${href}
            data-show-count="true"
          ></a>`,
  };
}

export function ShareButtons(props) {
  const [twtrScript, twtrErr] = useScript(
    "https://platform.twitter.com/widgets.js"
  );
  const [fbScript, fbErr] = useScript(
    "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v3.0"
  );
  let twitterRef = React.createRef();
  useLayoutEffect(() => {
    if (!twitterRef.current) {
      return;
    }
    twitterRef.current.innerHTML = twitterTemplate(props.href).__html;
    window.twttr && window.twttr.widgets.load();
  }, [props.href]);
  return (
    <ShareButtonWrapper align={props.align || "right"}>
      <ShareButtonInner>
        <TwitterWrapper
          ref={twitterRef}
          dangerouslySetInnerHTML={twitterTemplate(props.href)}
        ></TwitterWrapper>
        <div
          className="fb-share-button"
          data-href={props.href}
          data-layout="button"
        ></div>
      </ShareButtonInner>
    </ShareButtonWrapper>
  );
}
