const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: ['@react-native-async-storage/async-storage'],
      },
    },
    argv
  );

  // Fix for AsyncStorage module resolution - allow .js extensions to be optional
  if (!config.resolve) {
    config.resolve = {};
  }
  
  config.resolve.fullySpecified = false;
  config.resolve.extensions = [
    '.web.js',
    '.web.ts',
    '.web.tsx',
    '.js',
    '.ts',
    '.tsx',
    '.json',
    ...(config.resolve.extensions || []),
  ];

  // Fix for webpack module resolution - don't require file extensions
  if (!config.module) {
    config.module = {};
  }
  
  if (!config.module.rules) {
    config.module.rules = [];
  }

  // Add rule to handle .mjs and .js files without requiring extensions
  config.module.rules.push({
    test: /\.m?js$/,
    resolve: {
      fullySpecified: false,
    },
  });

  // Remove incompatible webpack-dev-server options for v4 compatibility
  if (config.devServer) {
    // Remove _assetEmittingPreviousFiles if it exists (not supported in webpack-dev-server v4)
    delete config.devServer._assetEmittingPreviousFiles;
  }

  return config;
};

