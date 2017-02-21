var Execa = require("execa");
var FindRoot = require("find-root");
var Fs = require("fs-extra");
var Merge = require("merge");
var Path = require("path");
var Tmp = require("tmp");
var DefaultBundlerConfig = require("./default-bundler-config.json");

/*
  Bundler's core logic
 */

var cwd = process.cwd();
var nodeModulesDir = Path.resolve(FindRoot(cwd), "node_modules");

function bundle(options) {
  var sourceDir = options.source &&
    Path.resolve(cwd, options.source);
  var destinationFile = options.destination ?
    Path.resolve(cwd, options.destination) :
    Path.resolve(nodeModulesDir, "meteor-client.js");
  var configFile = options.config ?
    Path.resolve(cwd, options.config) :
    Path.resolve(cwd, "meteor-client.config.json");

  // A temporary dir where the temporary Meteor project is gonna be created
  var tempDir = Tmp.dirSync({ unsafeCleanup: true }).name;

  // Create a dummy Meteor project in temp dir
  Execa.sync("meteor", ["create", tempDir], {
    stdio: "inherit"
  });

  try {
    var userConfig = require(configFile);
  }
  catch (e) {
    // Defaults to an empty object if file not found
    var userConfig = {};
  }

  // Config composed from CLI args
  var cliConfig = { runtime: {} };
  if (options.url) cliConfig.runtime.DDP_DEFAULT_CONNECTION_URL = options.url;

  // Compose complete config
  var config = Merge.recursive({}, DefaultBundlerConfig, userConfig, cliConfig);

  // The path to the packages file in the dummy Meteor project
  var tempPacksFile = Path.resolve(tempDir, ".meteor/packages");

  // If a packages file was provided, use it in the dummy project
  if (sourceDir) {
    var sourcePacksFile = Path.resolve(sourceDir, ".meteor/packages");
    var sourcePacksContent = Fs.readFileSync(sourcePacksFile).toString();
    // Write the composed content to the temp packages file
    Fs.writeFileSync(tempPacksFile, sourcePacksContent);
    //copy thec custom packages folder into the tempPacksDir if it exists
    var sourceCustomPackagesFolder = Path.resolve(sourceDir, "packages/")
    if(Fs.existsSync(sourceCustomPackagesFolder)){
      var tempCustomPackagesFolder = Path.resolve(tempDir, "packages/")
      Fs.mkdirSync(tempCustomPackagesFolder);
      try{
        Fs.copySync(sourceCustomPackagesFolder, tempCustomPackagesFolder);
      } catch(e){
        //remove all the wrongdoing in case of an error with copying
        Fs.removeSync(tempCustomPackagesFolder);
      }
    }
  }
  // Compose packages file based on provided config
  else {
    var tempPacksContent = config["import"].join("\n");
    Fs.writeFileSync(tempPacksFile, tempPacksContent);
  }

  // Install npm modules
  Execa.sync("meteor", ["npm", "install"], {
    cwd: tempDir,
    stdio: "inherit"
  });

  // Start building the packages
  Execa.sync("meteor", ["build", "--debug", "--directory", "."], {
    cwd: tempDir,
    stdio: "inherit"
  });

  // A necessary code snippet so the Meteor client can work properly
  var runtimeconfig = "__meteor_runtime_config__ = " +
    JSON.stringify(config["runtime"], null, 2) + ";\n\n";

  // In case we bundle into node_modules, ensue its existence
  if (!options.destination) {
    try {
      Fs.statSync(nodeModulesDir);
    }
    catch (e) {
      Fs.mkdirSync(nodeModulesDir);
    }
  }

  // Start composing the bundle, override if already exists
  Fs.writeFileSync(destinationFile, runtimeconfig);

  // Load essential meta-data regards our packages
  var buildPath = Path.resolve(tempDir, "bundle/programs/web.browser");
  var program = require(Path.resolve(buildPath, "program.json"));

  program.manifest
    // Keep client's packages files
    .filter(function (pack) {
      return pack.where == "client" &&
             pack.type == "js" &&
             Path.dirname(pack.path) == "packages"
    })
    // Append each package to destination file
    .forEach(function (pack) {
      var packFile = Path.resolve(buildPath, pack.path);
      var packContent = Fs.readFileSync(packFile).toString() + "\n\n";
      Fs.appendFileSync(destinationFile, packContent);
    });

  // Append post-bundle script
  var postBundleFile = Path.resolve(__dirname, "post-bundle.js");
  var postBundleContent = Fs.readFileSync(postBundleFile).toString();
  Fs.appendFileSync(destinationFile, postBundleContent);
}

module.exports = {
  bundle: bundle
};
