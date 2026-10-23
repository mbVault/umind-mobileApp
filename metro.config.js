const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

/** react-native-svg's `react-native` field points at `src/`, which breaks Metro on some setups. */
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "react-native-svg") {
    return {
      type: "sourceFile",
      filePath: path.resolve(__dirname, "node_modules/react-native-svg/lib/commonjs/index.js"),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
