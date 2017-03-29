var Path = require("path");

function getConfig(output) {
  var dir = Path.dirname(output);
  var fileName = Path.basename(output);

  return {
    entry: [
      require.resolve("./entry-script"),
    ],
    output: {
      path: dir,
      filename: fileName
    },
    resolve: {
      extensions: [".js"]
    }
  }
}

module.exports = getConfig;
