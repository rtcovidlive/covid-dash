import React, { useEffect, useState } from "react";
import Constants from "lib/Constants";

const THRESHOLD = 250;

export function ScrollToTopPill(props) {
  const [isShown, setIsShown] = useState(false);
  useEffect(() => {
    window.addEventListener("scroll", (e) => {
      if (!props.target.current) {
        return;
      }
      let targetDistance =
        -1 * props.target.current.getBoundingClientRect().bottom;
      if (targetDistance >= THRESHOLD) {
        setIsShown(true);
      } else {
        setIsShown(false);
      }
    });
  }, []);
  return (
    <div
      style={{
        margin: "0 auto",
        transition: "top 0.3s",
        position: "fixed",
        left: "50%",
        textAlign: "center",
        pointerEvents: "none",
        top: isShown ? 20 : -40,
      }}
    >
      <span
        className="scroll-to-top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        ↑ Scroll to top
        {props.children}
      </span>
    </div>
  );
}
