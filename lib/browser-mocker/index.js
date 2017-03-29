var Fiber = require("fibers");
var Fs = require("fs");
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
    if (err) return fiber.throwInto(err);

    // Start streaming chunks of data to the output file once compiling has finished
    var readStream = Fs.createReadStream(webpackOut);
    var writeStream = Fs.createWriteStream(outputFile, { flag: "a" });

    writeStream.on("finish", fiber.run.bind(fiber, stats));
    writeStream.on("error", fiber.throwInto.bind(fiber));

    readStream.pipe(writeStream);
  });

  // Stats should be returned later on
  return Fiber.yield();
}

module.exports = {
  mock: mockBrowser
};
