module.exports = {
  apps: [
    {
      name: "totalsupply",
      script: "./dist/totalsupply/src/index.js",
      env: {
        PORT: 3000,
        SERVICE_URL: "service.klayr.xyz",
        NODE_ENV: "production",
      },
    },
    {
      name: "circulatingsupply",
      script: "./dist/circulatingsupply/src/index.js",
      env: {
        PORT: 3001,
        SERVICE_URL: "service.klayr.xyz",
        NODE_ENV: "production",
      },
    },
    {
      name: "mainnet-cache",
      script: "./dist/cacher/src/index.js",
      env: {
        PORT: 3002,
        SERVICE_URL: "service.klayr.xyz",
        SSL: false,
      },
    },
    {
      name: "testnet-cache",
      script: "./dist/cacher/src/index.js",
      env: {
        PORT: 3003,
        SERVICE_URL: "service.klayr.xyz",
        SSL: false,
      },
    },
  ],
};
