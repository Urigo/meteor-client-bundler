var Fiber = require("fibers");
var Fs = require("fs");
var PrependFile = require("prepend-file");
var Tmp = require("tmp");
var Webpack = require("webpack");
var WebpackConfig = require("./webpack-config");

/*
  The browser-mocker is responsible for mocking a browser environment when we want to
  use Meteor on a non-browser environment. Originally created because of React-Native.
 **/

function mockBrowser(outputFile) {
  // We use fibers to synchronize an async task
  var fiber = Fiber.current;
  // A temporary file that will be used as the output for the webpack compiler
  var webpackOut = Tmp.tmpNameSync();

  // Start compiling
  Webpack(WebpackConfig(webpackOut), function (err, stats) {
    if (err) fiber.throwInto(err);

    // Start streaming chunks of data to the output file once compiling has finished
    Fs.createReadStream(webpackOut)
      .on("data", function (data) {
        PrependFile.sync(outputFile, data);
      })
      .on("end", function () {
        fiber.run(stats);
      })
      .on("error", function (err) {
        fiber.throwInto(err);
      });
  });

  // Stats should be returned later on
  return Fiber.yield();
}

module.exports = {
  mock: mockBrowser
};
