const Execa = require("execa");
const Fs = require("fs-extra");
const Path = require("path");
const Tmp = require("tmp");

before(function () {
  // Constants
  this.plainProjectDir = Tmp.dirSync({ unsafeCleanup: true }).name;
  this.testDir = Tmp.dirSync({ unsafeCleanup: true }).name;

  // Utils
  this.execBundler = Execa.sync.bind(null, Path.resolve(__dirname, "../cli"));
  this.getDataDir = (id) => Path.resolve(__dirname, "data", id);

  // Initializations
  Execa.sync("meteor", ["create", this.plainProjectDir]);
});

beforeEach(function () {
  // Copy the plain project into the test dir,
  // rather than recreating it over and over again
  Fs.removeSync(this.testDir);
  Fs.copySync(this.plainProjectDir, this.testDir);
});

// Test files
require("./bundler");