'use strict';

const { resolve } = require('path');
const { NormalModuleReplacementPlugin } = require('webpack');
const nodeExternals = require('webpack-node-externals');
const NodemonPlugin = require('nodemon-webpack-plugin');

const packageJson = require('./package.json');

module.exports = (env = {}) => {
  const config = {
    entry: ['./src/main.ts'],
    externals: [nodeExternals()],
    mode: env.development ? 'development' : 'production',
    target: 'node',
    devtool: env.development ? 'inline-source-map' : false,
    node: {
      __dirname: false, // Fix for native node __dirname
      __filename: false, // Fix for native node __filename
    },
    output: {
      filename: `${packageJson.name}.js`,
      path: resolve(__dirname, 'dist'),
      clean: true,
    },
    resolve: {
      extensions: ['.ts', '.js'],
      modules: ['node_modules', 'src'],
    },
    stats: {
      modules: false, // We don't need to see this
    },
    ignoreWarnings: [{
      message: /^(?!CriticalDependenciesWarning$)/,
    }],
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    plugins: [
      // Use module replacement to use different configs for dev and prod
      new NormalModuleReplacementPlugin(
        /[\\/]src[\\/]config[\\/]config.ts$/, // [\\/] works on all operating systems.
        env.development ? 'config.dev.ts' : 'config.ts'
      ),
    ],
  };

  if (env.nodemon) {
    config.watch = true;
    config.plugins.push(new NodemonPlugin());
  }

  if (env.analyse) {
    const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

    config.plugins.push(
      new BundleAnalyzerPlugin({
        analyzerMode: 'static', // Generates file instead of starting a web server
      })
    );
  }

  return config;
};
