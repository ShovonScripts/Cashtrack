const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// expo-sqlite loads a WebAssembly build of SQLite on web. Metro needs to treat
// `.wasm` as an asset so that import resolves. Required for web support, which
// Expo currently marks as alpha.
config.resolver.assetExts.push('wasm');

// Send Cross-Origin Isolation headers required by expo-sqlite on web during development
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
