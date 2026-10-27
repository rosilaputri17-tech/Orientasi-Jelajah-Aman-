const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Izinkan file .wasm sebagai aset (dibutuhkan expo-sqlite di web)
config.resolver.assetExts.push("wasm");

// Header agar SharedArrayBuffer bisa dipakai di browser
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    middleware(req, res, next);
  };
};

module.exports = config;