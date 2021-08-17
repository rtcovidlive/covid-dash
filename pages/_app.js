import "../styles/constants.scss";
import "../node_modules/react-vis/dist/style.css";
//import "~antd/dist/antd/less";
import "antd/dist/antd.css";
import "../styles/App.scss";
import "../styles/subarea.scss";

// This default export is required in a new `pages/_app.js` file.
export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
