import React, { useState } from "react";

export function EmailSignupForm(props) {
  const [email, setEmail] = useState("");
  const [zip, setZIP] = useState("");
  return (
    <div className="rt-email-signup" id="rt-email-signup">
      <form
        action="https://live.us4.list-manage.com/subscribe/post?u=8cadf1427ae18ebd74a08ce87&amp;id=4887470388"
        method="post"
        id="mc-embedded-subscribe-form"
        name="mc-embedded-subscribe-form"
        target="_blank"
        noValidate
      >
        <div>
          <div>
            <input
              placeholder="Email"
              type="email"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              name="EMAIL"
              id="mce-EMAIL"
            />
            <input
              type="text"
              value={zip}
              placeholder="Zip"
              onChange={(e) => setZIP(e.target.value)}
              name="ZIP"
              id="mce-ZIP"
            />
            <input
              type="submit"
              value="Submit"
              name="subscribe"
              id="mc-embedded-subscribe"
            />
          </div>
          <div
            style={{ position: "absolute", left: "-5000px" }}
            aria-hidden="true"
          >
            <input
              type="text"
              name="b_8cadf1427ae18ebd74a08ce87_4887470388"
              tabIndex="-1"
              defaultValue=""
            />
          </div>
        </div>
      </form>
    </div>
  );
}
