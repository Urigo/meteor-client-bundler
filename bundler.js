var Execa = require("execa");
var FindNodeModules = require("find-node-modules");
var Fs = require("fs");
var Path = require("path");
var Tmp = require("tmp");

/*
  Bundler's core logic
 */

var cwd = process.cwd();
var node_modules = FindNodeModules({ cwd: cwd, relative: false })[0];

// Will clean all temp files automatically once process is destroyed
Tmp.setGracefulCleanup();

function bundle(options) {
  var sourceDir = options.source &&
    Path.resolve(cwd, options.source);
  var destinationFile = options.destination ?
    Path.resolve(cwd, options.destination) :
    Path.resolve(node_modules, "meteor-client.js");
  var configFile = options.config ?
    Path.resolve(cwd, options.config) :
    Path.resolve(cwd, "meteor-client.config.json");

  var config = require(configFile);
  var importedPackages = Object.keys(config["import"]);
  var exportedPackages = Object.keys(config["export"]);

  // A temporary dir where the temporary Meteor project is gonna be created
  var tempDir = Tmp.dirSync({ unsafeCleanup: true }).name;
  // Raw packages dir of the built Meteor project
  var packsDir = Path.resolve(tempDir, "bundle/programs/web.browser/packages");

  // Create a dummy Meteor project in temp dir
  Execa.sync("meteor", ["create", tempDir], {
    stdio: "inherit"
  });

  // Eliminate duplicate dependencies names and preserve their order
  var dependencies = importedPackages.reduce(function (dependencies, pack) {
    config["import"][pack].forEach(function (dependency) {
      dependencies[dependency] = true;
    });

    return dependencies;
  }, {});

  dependencies = Object.keys(dependencies);

  // If a packages file was provided, use it in the dummy project
  if (sourceDir) {
    var sourcePacksFile = Path.resolve(sourceDir, ".meteor/packages");
    var sourcePacksContent = Fs.readFileSync(sourcePacksFile).toString();
    // The path to the packages file in the dummy Meteor project
    var tempPacksFile = Path.resolve(tempDir, ".meteor/packages");
    // Write the composed content to the temp packages file
    Fs.writeFileSync(tempPacksFile, sourcePacksContent);
  }
  // Compose packages file based on provided config
  else {
    Execa.sync("meteor", ["add"].concat(importedPackages), {
      cwd: tempDir,
      stdio: "inherit"
    });
  }

  // Install npm modules
  Execa.sync("meteor", ["npm", "install"], {
    cwd: tempDir,
    stdio: "inherit"
  });

  // Start building the packages
  Execa.sync("meteor", ["build", "--debug", "."], {
    cwd: tempDir,
    stdio: "inherit"
  });

  // Unpack the built project
  var tarFile = Path.resolve(tempDir, Path.basename(tempDir)) + ".tar.gz";

  // Extract tar so we can access the built project
  Execa.sync("tar", ["-zxf", tarFile], {
    cwd: tempDir
  });

  // A necessary code snippet so the Meteor client can work properly
  var runtimeconfig = "__meteor_runtime_config__ = " +
    JSON.stringify(config["run-time"], null, 2) + ";\n\n";

  // Start composing the bundle, override if already exists
  Fs.writeFileSync(destinationFile, runtimeconfig);

  // Append all specified packages
  dependencies.forEach(function (dependency) {
    var packFileName = dependency.replace(':', '_') + '.js';
    var packFile = Path.resolve(packsDir, packFileName);

    try {
      // Check if file exists
      Fs.lstatSync(packFile);
    }
    catch (e) {
      // If file doesn't exist, escape
      return;
    }

    var packContent = Fs.readFileSync(packFile) + "\n\n";
    Fs.appendFileSync(destinationFile, packContent);
  });

  // Go through all exported packages names and compose an exportation line
  // e.g. Accounts = Package["accounts-base"]["Accounts"];
  var bundleExports = exportedPackages.reduce(function (lines, packageName) {
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
