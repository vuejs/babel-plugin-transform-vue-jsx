var path = require('path')

module.exports = {
  target: 'web',
  entry: path.join(__dirname, 'index.js'),
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'babel-plugin-transform-vue-jsx.min.js',
    library: 'babel-plugin-transform-vue-jsx',
    libraryTarget: 'umd'
  },
  module: {
    rules: [
      {
        test: /\/jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  }
}
