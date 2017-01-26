const ChildProcess = require("child_process");
const Fs = require("fs-extra");
const Path = require("path");
const Tmp = require("tmp");

before(function () {
  // Setup
  Tmp.setGracefulCleanup();

  // Constants
  this.plainProjectDir = Tmp.dirSync({ unsafeCleanup: true }).name;
  this.testDir = Tmp.dirSync({ unsafeCleanup: true }).name;

  // Utils
  this.exec = ChildProcess.execFileSync.bind(ChildProcess);
  this.bundler = this.exec.bind(null, Path.resolve(__dirname, "../cli"));
  this.getDataDir = (id) => Path.resolve(__dirname, "data", id);

  // Initializations
  this.exec("meteor", ["create", this.plainProjectDir]);
});

beforeEach(function () {
  // Copy the plain project into the test dir,
  // rather than recreating it over and over again
  Fs.removeSync(this.testDir);
  Fs.copySync(this.plainProjectDir, this.testDir);
});

// Test files
require("./bundler");