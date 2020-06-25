const SentryWebpackPlugin = require("@sentry/webpack-plugin");
const withSass = require("@zeit/next-sass");
const withSourceMaps = require("@zeit/next-source-maps")({
  devtool: "hidden-source-map",
});
const isAWSDeploy = process.env.DEPLOY_TARGET === "aws";

module.exports = withSass(
  withSourceMaps({
    /* config options here */
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
      // Note: we provide webpack above so you should not `require` it
      // Perform customizations to webpack config
      // Important: return the modified config
      if (isAWSDeploy) {
        config.plugins.push(
          new webpack.DefinePlugin({
            "process.env.SENTRY_RELEASE": JSON.stringify(buildId),
          })
        );
        config.plugins.push(
          new SentryWebpackPlugin({
            include: ".next",
            ignore: ["node_modules"],
            urlPrefix: "~/_next",
            release: buildId,
          })
        );
      }
      config.module.rules.push({
        test: /\.css$/,
        loader: "style-loader!css-loader",
      });
      config.module.rules.push({
        test: /\.md$/,
        use: [
          {
            loader: "html-loader",
          },
          {
            loader: "markdown-loader",
            options: {},
          },
        ],
      });
      return config;
    },
    webpackDevMiddleware: (config) => {
      // Perform customizations to webpack dev middleware config
      // Important: return the modified config
      return config;
    },
    assetPrefix: isAWSDeploy ? "https://d1s7vqgr1bmmob.cloudfront.net" : "",
  })
);
