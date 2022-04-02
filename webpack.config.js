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
        test: /\.(txt|xml)$/i,
        use: 'raw-loader',
      },
    ],
  },
};
