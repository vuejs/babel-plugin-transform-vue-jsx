module.exports = {
  entry: './example.js',
  output: {
    path: __dirname,
    filename: 'example.build.js'
  },
  module: {
    loaders: [
      { test: /\.js$/, loader: 'babel', exclude: /node_modules/ }
    ]
  }
}
