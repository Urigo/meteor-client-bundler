#!/usr/bin/env node
var Program = require("commander");
var Bundler = require("./bundler");
var Pack = require("./package.json");

/*
  Bundler CLI entry point
 */

Program
  .version(Pack.version)
  .description(Pack.description);

Program
  .command("bundle")
  .description("Bundles meteor-client")

  .option("--src, --source [sourceDir]", [
    "A path for a Meteor project which already exists. This is useful if you want the",
    "bundled packages to have the same versions as in the specified project. If not",
    "specified, packages file will be composed based on the provided config, and the",
    "the latest versions will be used."
  ]. join(" \n"))

  .option("--dst, --destination [destinationFile]", [
    "The path for the bundled module. Defaults to \"node_modules/meteor-client.js\"."
  ]. join(" \n"))

  .option("--cfg, --config [configFile]", [
    "The path for the bundler config file. Defaults to \"meteor-client.config.json\".",
    "For more information about the config file's schema, see the provided link below."
  ]. join(" \n"))

  .action(function (options) {
    Bundler.bundle(options);
  });

Program.on("--help", function (){
  console.log("For more information, see: " + Packs.repository.url);
});

Program.parse(process.argv);