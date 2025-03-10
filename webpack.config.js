const path = require("path");
const Dotenv = require("dotenv-webpack");

module.exports = {
    entry: "./script.js",
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "public"),
        publicPath: "/",
    },
    mode: "production",
    resolve: {
        fallback: {
            "crypto": require.resolve("crypto-browserify"),
            "stream": require.resolve("stream-browserify"),
            "buffer": require.resolve("buffer/"),
            "path": require.resolve("path-browserify"),
            "os": require.resolve("os-browserify/browser"),
            "vm": require.resolve("vm-browserify")
        }
    },
    plugins: [
        new Dotenv({ systemvars: true }) // load env vars from .env
    ]
};