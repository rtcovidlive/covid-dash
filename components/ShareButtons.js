import React, { useState, useContext, useEffect, useLayoutEffect } from "react";
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

export function ShareButtons(props) {
  const [twtrScript, twtrErr] = useScript(
    "https://platform.twitter.com/widgets.js"
  );
  const [fbScript, fbErr] = useScript(
    "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v3.0"
  );
  return (
    <ShareButtonWrapper align={props.align || "right"}>
      <ShareButtonInner>
        <TwitterWrapper>
          <a
            href="https://twitter.com/share?ref_src=twsrc%5Etfw"
            className="twitter-share-button"
            data-url={props.href}
            data-show-count="true"
          ></a>
        </TwitterWrapper>
        <div
          className="fb-share-button"
          data-href={props.href}
          data-layout="button_count"
        ></div>
      </ShareButtonInner>
    </ShareButtonWrapper>
  );
}
