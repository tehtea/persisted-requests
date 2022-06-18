const webpack = require('webpack');
const path = require('path');

const testCode = 'tests/**/*.spec.ts';

module.exports = function(config) {
  config.set({
    frameworks: ['jasmine-ajax', 'jasmine'],
    browsers: ['Chrome', 'Firefox', 'Safari'],
    files: [
      testCode,
    ],
    mime: {
      'text/x-typescript': ['ts'],
    },
    preprocessors: {
      [testCode]: ['webpack', 'sourcemap'],
    },
    plugins: [
      'karma-coverage',
      'karma-coverage-istanbul-reporter',
      'karma-chrome-launcher',
      'karma-safari-launcher',
      'karma-firefox-launcher',
      'karma-webpack',
      'karma-jasmine',
      'karma-jasmine-ajax',
      'karma-sourcemap-loader',
    ],
    reporters: ['coverage-istanbul'],
    coverageIstanbulReporter: {
      'reports': ['html', 'text-summary', 'lcovonly'],
      'dir': 'coverage',
      'fixWebpackSourcePaths': true,
      'report-config': {
        html: {outdir: 'html'},
      },
    },
    webpack: {
      devtool: false,
      mode: 'development',
      module: {
        rules: [
          {
            test: /\.ts$/,
            loader: 'ts-loader',
          },
          // add this for generating coverage using Istanbul
          {
            test: /\.ts$/,
            exclude: [path.resolve(__dirname, 'test')],
            enforce: 'post',
            use: {
              loader: 'istanbul-instrumenter-loader',
              options: {esModules: true},
            },
          },
        ],
      },
      plugins: [
        new webpack.SourceMapDevToolPlugin({
          test: /\.(ts|js|css)($|\?)/i,
        }),
      ],
      resolve: {
        extensions: ['.ts', '.js'],
      },
    },
    webpackMiddleware: {
      logLevel: 'error',
    },
  });
};
