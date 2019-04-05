const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const appPath = filepath => path.resolve(__dirname, filepath);

const optimization = {
  minimize: true,
  minimizer: [
    new TerserPlugin({
      terserOptions: {
        warnings: false,
        compress: {
          comparisons: false,
          drop_console: true,
        },
        parse: {},
        mangle: true,
        output: {
          comments: false,
          ascii_only: true,
        },
      },
      parallel: true,
      cache: true,
      sourceMap: false,
    }),
  ],
  nodeEnv: 'production',
  sideEffects: true,
};

const devConfig = {
  mode: 'development',
  devServer: {
    host: 'localhost',
    watchContentBase: true,
    stats: {
      modules: false,
      children: false,
      chunks: false,
    },
    port: '3000',
    disableHostCheck: true,
    publicPath: '/',
    historyApiFallback: {
      disableDotRule: true,
    },
    hot: true,
  },
};

const prodConfig = {
  mode: 'production',
  optimization
};

module.exports = (env, argv) => {
  const isProduction = (argv.mode === 'production');
  console.log("build mode:", argv.mode)
  const appEnv = require('./.env.' + argv.mode + '.js');

  return {
    entry: './src/index.js',
    output: {
      // path: appPath('../dist'),
      filename: '[name].js?v=[hash]',
      chunkFilename: '[name].chunk.js?v=[hash]',
      publicPath: '/',
      // globalObject: 'this',
    },
    devtool: 'inline-source-map',
    resolve: {
      alias: {
        '@assets': appPath('src/assets'),
        '@common': appPath('src/common'),
        '@src': appPath('src'),
      },
      extensions: ['.js', '.jsx', '.css', '.png', '.jpg', '.gif', '.jpeg', '.svg'],
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env': JSON.stringify({
          ...appEnv,
          isProduction,
          NODE_ENV: argv.mode,
          DEBUG: !isProduction,
        }),
      }),
      new HtmlWebpackPlugin({
        chunks: ['main', 'vendors~main'],
        minify: isProduction
          ? {
            collapseWhitespace: true,
            preserveLineBreaks: true,
            removeComments: true,
          }
          : null,
        filename: 'index.html',
        template: appPath('./public/index.html'),
        favicon: appPath('./public/favicon.ico'),
      }),
      new CopyWebpackPlugin([
        // relative path is from src
        {from: './public/manifest.json', to: './'}, // <- your path to manifest
        {from: './public/img', to: './img'}, // <- your path to manifest
      ])
    ],
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: [/node_modules/, /constant-chain-web-js/],
          use: 'babel-loader'
        },
        {
          test: /\.html$/,
          use: [
            {
              loader: 'html-loader',
              options: {minimize: isProduction},
            },
          ],
        },
        {
          test: /\.(png|gif|jpe?g|webp)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
          use: [
            'image-webpack-loader',
            {
              loader: 'file-loader',
              options: {
                name: '[hash].[ext]',
                outputPath: 'images/',
                verbose: false,
              },
            },
          ],
        },
        {
          test: /\.(scss|css)$/,
          use: [
            "style-loader", // creates style nodes from JS strings
            "css-loader", // translates CSS into CommonJS
            "sass-loader" // compiles Sass to CSS, using Node Sass by default
          ]
        },
        {
          test: /.svg$/,
          use: ['@svgr/webpack', 'url-loader'],
        }
      ],
    },
    ...isProduction ? prodConfig : devConfig
  }
}
