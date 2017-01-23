var ChildProcess = require("child_process");
var FindNodeModules = require("find-node-modules");
var Fs = require("fs");
var Path = require("path");
var Tmp = require("tmp");

/*
  Bundler's core logic
 */

var exec = ChildProcess.execFileSync.bind(ChildProcess);

// Will clean all temp files automatically once process is destroyed
Tmp.setGracefulCleanup();

function bundle(options) {
  var sourceDir = options.source &&
    Path.resolve(options.source)
  var destinationFile = options.destination ?
    Path.resolve(options.destination) :
    Path.resolve(FindNodeModules()[0], "meteor-client.js");
  var configFile = options.config ?
    Path.resolve(options.config) :
    Path.resolve(__dirname, "meteor-client.config.json");

  if (!sourceDir)
    throw Error("Source dir must be provided");

  var config = require(configFile);

  // A temporary dir where the temporary Meteor project is gonna be created
  var tempDir = Tmp.dirSync({ unsafeCleanup: true }).name;
  // Raw packages dir of the built Meteor project
  var packsDir = Path.resolve(tempDir, "bundle/programs/web.browser/packages");

  // Create a dummy Meteor project in temp dir
  exec("meteor", ["create", tempDir], {
    stdio: "inherit"
  });

  // Eliminate duplicate packages names and preserve their order
  var packs = Object.keys(config["import"]).reduce(function (packs, packsBatch) {
    config["import"][packsBatch].forEach(function (pack) {
      packs[pack] = true;
    });

    return packs;
  }, {});

  packs = Object.keys(packs);

  // If a packages file was provided, use it in the dummy project
  if (sourceDir) {
    var sourcePacksFile = Path.resolve(sourceDir, ".meteor/packages");
    var sourcePacksContent = Fs.readFileSync(sourcePacksFile).toString();
  }
  // If not, create one based on the packages in the provided config
  else {
    var sourcePacksContent = packs.join("\n");
  }

  // The path to the packages file in the dummy Meteor project
  var tempPacksFile = Path.resolve(tempDir, ".meteor/packages");
  // Write the composed content to the temp packages file
  Fs.writeFileSync(tempPacksFile, sourcePacksContent);

  // Install npm modules
  exec("npm", ["install"], {
    cwd: tempDir,
    stdio: "inherit"
  });

  // Start building the packages
  exec("meteor", ["build", "--debug", "."], {
    cwd: tempDir,
    stdio: "inherit"
  });

  // Unpack the built project
  var tarFile = Path.resolve(tempDir, Path.basename(tempDir)) + ".tar.gz";

  // Extract tar so we can access the built project
  exec("tar", ["-zxf", tarFile], {
    cwd: tempDir
  });

  // A necessary code snippet so the Meteor client can work properly
  var runtimeconfig = "__meteor_runtime_config__ = " +
    JSON.stringify(config["run-time"], null, 2) + ";\n\n";

  // Start composing the bundle, override if already exists
  Fs.writeFileSync(destinationFile, runtimeconfig);

  // Append all specified packages
  packs.forEach(function (pack) {
    var packFileName = pack.replace(':', '_') + '.js';
    var packFile = Path.resolve(packsDir, packFileName);
    var packContent = Fs.readFileSync(packFile) + "\n\n";
    Fs.appendFileSync(destinationFile, packContent);
  });

  // Get all packages names we"d like to export
  var packagesNames = Object.keys(config["export"]);
  // Go through all packages names and compose an exportation line
  // e.g. Accounts = Package["accounts-base"]["Accounts"];
  var bundleExports = packagesNames.reduce(function (lines, packageName) {
    var packageExports = config["export"][packageName];

    packageExports.forEach(function (objectName) {
      lines.push(objectName +
        " = Package[\"" + packageName + "\"][\"" + objectName + "\"]");
    });

    return lines;
  }, [])
    // Add an empty string so the next rule would apply on the last line as well
    .concat("")
    // Add a semi-colon and a line skip after each composed line
    .join(";\n");

  // Append export into bundle
  Fs.appendFileSync(destinationFile, bundleExports);
}

module.exports = {
  bundle: bundle
};
