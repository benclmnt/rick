/* eslint-disable */
module.exports = {
  target: 'webworker',
  entry: './src',
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: 'html-loader',
      },
      {
        enforce: 'pre',
        test: /\.js$/i,
        loader: 'source-map-loader',
      },
    ],
  },
};
