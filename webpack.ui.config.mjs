import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VueLoaderPlugin } from 'vue-loader';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack from 'webpack';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootNodeModules = path.resolve(__dirname, '..', 'node_modules');

export default {
  mode: 'production',
  entry: path.resolve(__dirname, 'ui-src', 'main.ts'),
  output: {
    path: path.resolve(__dirname, 'ui'),
    filename: 'app.js',
    clean: false,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.vue', '.json'],
    modules: [rootNodeModules, 'node_modules'],
    alias: {
      '@': path.resolve(__dirname, 'ui-src'),
    },
  },
  resolveLoader: {
    modules: [rootNodeModules, 'node_modules'],
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
          appendTsSuffixTo: [/\.vue$/],
          transpileOnly: true,
          configFile: path.resolve(__dirname, '..', 'tsconfig.json'),
        },
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                config: path.resolve(__dirname, '..', 'postcss.config.js'),
              },
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new VueLoaderPlugin(),
    new MiniCssExtractPlugin({
      filename: 'app.css',
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'ui-src', 'index.html'),
      filename: 'index.html',
      inject: 'body',
      scriptLoading: 'defer',
    }),
    new webpack.DefinePlugin({
      __VUE_OPTIONS_API__: JSON.stringify(false),
      __VUE_PROD_DEVTOOLS__: JSON.stringify(false),
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false),
    }),
  ],
  performance: {
    hints: false,
  },
  stats: 'minimal',
};
