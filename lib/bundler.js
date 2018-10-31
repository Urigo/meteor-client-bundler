var Babel = require("babel-core");
var Execa = require("execa");
var FindRoot = require("find-root");
var Fs = require("fs");
var Merge = require("merge");
var Path = require("path");
var Tmp = require("tmp");
var DefaultBundlerConfig = require("./default-bundler-config.json");
var EscapeCommonJSPlugin = require("./escape-commonjs-plugin");
var rimraf = require("rimraf");

/*
  Bundler's core logic
 */

var cwd = process.cwd();
var rootDir = FindRoot(cwd);
var nodeModulesDir = Path.resolve(rootDir, "node_modules");

function bundle(options) {
  var sourceDir = options.source &&
    Path.resolve(cwd, options.source);
  var packsDir = options.packsDir &&
    Path.resolve(cwd, options.packsDir);
  var destinationFile = options.destination ?
    Path.resolve(cwd, options.destination) :
    Path.resolve(nodeModulesDir, "meteor-client.js");
  var configFile = options.config ?
    Path.resolve(cwd, options.config) :
    Path.resolve(rootDir, "meteor-client.config.json");

  try {
    var userConfig = require(configFile);
  } catch (e) {
    // Defaults to an empty object if file not found
    var userConfig = {};
  }

  // The release can be specified either by options or by the config file
  var release = options.release || userConfig.release;

  // If no specific release was provided, try to figure it out
  if (!release) {
    if (sourceDir) {
      release = Execa.sync("meteor", ["--version"], {
        cwd: sourceDir
      });
    } else {
      release = Execa.sync("meteor", ["--version"]);
    }

    // E.g. "Meteor 1.6-beta.26" will result in "1.6-beta.26"
    release = release.stdout.split(' ').pop();
  }

  // A temporary dir where the temporary Meteor project is gonna be created
  var tempDir = Tmp.dirSync({
    unsafeCleanup: true
  }).name;

  // Create a dummy Meteor project in temp dir
  Execa.sync("meteor", ["--release", release, "create", tempDir], {
    stdio: "inherit"
  });

  // Config composed from CLI args
  var cliConfig = {
    runtime: {}
  };
  if (options.url) cliConfig.runtime.DDP_DEFAULT_CONNECTION_URL = options.url;

  // Compose complete config
  var config = Merge.recursive({}, DefaultBundlerConfig, userConfig, cliConfig);

  // The path to the packages file in the dummy Meteor project
  var tempPacksFile = Path.resolve(tempDir, ".meteor/packages");

  // If a packages file was provided, use it in the dummy project
  if (sourceDir) {
    var METEOR_PACKAGE_DIRS = packsDir || Path.resolve(sourceDir, "packages");
    var sourcePacksFile = Path.resolve(sourceDir, ".meteor/packages");
    var sourcePacksContent = Fs.readFileSync(sourcePacksFile).toString();
    // Write the composed content to the temp packages file
    Fs.writeFileSync(tempPacksFile, sourcePacksContent);
  }
  // Compose packages file based on provided config
  else {
    var METEOR_PACKAGE_DIRS = packsDir || Path.resolve(rootDir, "packages");
    var tempPacksContent = config["import"].join("\n");
    Fs.writeFileSync(tempPacksFile, tempPacksContent);
  }

  // Install npm modules
  if (config.npmInstall) {
    Execa.sync("meteor", ["npm", "install"], {
      cwd: tempDir,
      stdio: "inherit"
    });
  } else {
    rimraf.sync(Path.join(tempDir, 'node_modules'));
  }

  if (config.npmPackages) {
    for (const dependency of config.npmPackages) {
      Execa.sync("meteor", ["npm", "install", dependency], {
        cwd: tempDir,
        stdio: "inherit"
      });
    }
  }


  // Start building the packages
  Execa.sync("meteor", ["build", "--debug", "--directory", "."], {
    cwd: tempDir,
    stdio: "inherit",
    env: Merge({
      METEOR_PACKAGE_DIRS: METEOR_PACKAGE_DIRS
    }, process.env)
  });

  // A necessary code snippet so the Meteor client can work properly
  var runtimeconfig = "__meteor_runtime_config__ = Object.assign(" +
    JSON.stringify(config["runtime"], null, 2) + ", window.__meteor_runtime_config__);\n\n";

  // In case we bundle into node_modules, ensue its existence
  if (!options.destination || config.generateNodeModules) {
    try {
      Fs.statSync(nodeModulesDir);
    } catch (e) {
      Fs.mkdirSync(nodeModulesDir);
    }
  }

  if (config.generateNodeModules) {
    const meteorModulesDir = Path.resolve(nodeModulesDir, 'meteor');
    try {
      Fs.statSync(meteorModulesDir);
    } catch (e) {
      Fs.mkdirSync(meteorModulesDir);
    }
    const packageListPath = Path.resolve(tempDir, ".meteor/versions");
    const packageListData = Fs.readFileSync(packageListPath, 'utf8');
    const packagesWithVersions = packageListData.split("\n");
    for (const packageWithVersion of packagesWithVersions) {
      const packageName = packageWithVersion.split('@')[0];
      if (packageName) {
        const packageModulePath = Path.resolve(meteorModulesDir, `${packageName}.js`);
        try {
          Fs.writeFileSync(packageModulePath, `module.exports = Package['${packageName}'];`, {
            flag: 'wx'
          });
        } catch (e) {}
      }
    }
    const packageJsonPath = Path.resolve(meteorModulesDir, `package.json`);
    Fs.writeFileSync(packageJsonPath, `{ "name": "meteor", "version": "${release}" }`);
  }

  if (config.writeRuntimeConfig) {
    // Start composing the bundle, override if already exists
    Fs.writeFileSync(destinationFile, runtimeconfig);
  } else {
    Fs.writeFileSync(destinationFile, '');
 }

  // Load essential meta-data regards our packages
  var buildPath = Path.resolve(tempDir, "bundle/programs/" + config.arch);
  var program = require(Path.resolve(buildPath, "program.json"));

  program.manifest
    // Keep client's packages files
    .filter(function (pack) {
      return (
          pack.where === "client" &&
          pack.type === "js" &&
          Path.dirname(pack.path) === "packages") ||
        pack.path.indexOf('global-imports') > -1
    })

    // Append each package to destination file
    .forEach(function (pack) {
      var packFile = Path.resolve(buildPath, pack.path);
      var packContent = Fs.readFileSync(packFile).toString() + "\n\n";

      if (config.escapeCommonJS) {
        if (config.externalNpmPackages) {
          for (const packageName of config.externalNpmPackages) {
            packContent = packContent.split(`require("${packageName}`).join(`unescapedRequire("${packageName}`);
            packContent = packContent.split(`require('${packageName}`).join(`unescapedRequire('${packageName}`);
          }
        }
        // Escapes commonJS functions so they won't be transformed a second time, mostly
        // because of React-Native's packager.
        // See: https://github.com/Urigo/meteor-client-bundler/issues/10
        packContent = Babel.transform(packContent, {
          ast: false,
          comments: true,
          compact: false,
          filename: packFile,
          plugins: [EscapeCommonJSPlugin],
          sourceType: "script"
        }).code;
        if (config.externalNpmPackages) {
          for (const packageName of config.externalNpmPackages) {
            packContent = packContent.split(`unescapedRequire("${packageName}`).join(`require("${packageName}`);
            packContent = packContent.split(`unescapedRequire('${packageName}`).join(`require('${packageName}`);
          }
        }
      }

      Fs.appendFileSync(destinationFile, packContent);
    });

  if (config.disableReload) {
    // Append post-bundle script
    var postBundleFile = Path.resolve(__dirname, "post-bundle.js");
    var postBundleContent = Fs.readFileSync(postBundleFile).toString();
    Fs.appendFileSync(destinationFile, postBundleContent);
  }
}

module.exports = {
  bundle: bundle
};
