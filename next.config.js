const isAWSDeploy = process.env.DEPLOY_TARGET === "aws";

module.exports = {
  /* config options here */
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    return config;
  },
  webpackDevMiddleware: (config) => {
    // Perform customizations to webpack dev middleware config
    // Important: return the modified config
    return config;
  },
  assetPrefix: isAWSDeploy ? "https://d1s7vqgr1bmmob.cloudfront.net" : "",
};
