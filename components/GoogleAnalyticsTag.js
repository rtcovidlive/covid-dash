import { useState } from "react";
import useScript from "lib/useScript";
import { Util } from "lib/Util";

function GoogleAnalyticsTag(props) {
  const [loggedView, setLoggedView] = useState(false);
  const [loaded] = useScript("https://www.google-analytics.com/analytics.js");
  if (loaded) {
    if (!loggedView) {
      window.ga("create", props.analyticsID, "auto");
      window.ga("send", "pageview");
      let statecode = Util.getCookie("statecode");
      if (statecode) {
        window.ga("send", "event", "customization", "statecode", statecode);
      }
      setLoggedView(true);
    }
    return null;
  } else {
    window.ga = function () {};
  }
  return null;
}

export default GoogleAnalyticsTag;
