const Chai = require("chai");
const Fs = require("fs-extra");
const Path = require("path");

const expect = Chai.expect;

describe("Bundler", function () {
  describe("bundle()", function () {
    it("should take all the packages in source, bundle them by config, and write the " +
       "bundle to destination", function () {
      this.slow(60 * 1000);

      const dataDir = this.getDataDir("58864fa8f321c95adb91b973");
      const sourceDir = Path.resolve(dataDir, "source");
      const destinationFile = Path.resolve(this.testDir, "meteor-client.bundle.js");
      const configFile = Path.resolve(dataDir, "meteor-client.config.json");

      this.bundler(["bundle",
        `--source=${sourceDir}`,
        `--destination=${destinationFile}`,
        `--config=${configFile}`
      ]);

      let _, __meteor_runtime_config__, Package;

      eval(Fs.readFileSync(destinationFile).toString());

      expect(__meteor_runtime_config__).to.deep.equal({
        "meteorEnv": {},
        "DDP_DEFAULT_CONNECTION_URL": "http://localhost:3000"
      });

      expect(_).to.equal(Package.underscore._);
    });

    it("should use packages specified in the config if no source was " +
       "provided", function () {
      this.slow(70 * 1000);

      const dataDir = this.getDataDir("58864fa8f321c95adb91b973");
      const sourceDir = Path.resolve(dataDir, "source");
      const destinationFile = Path.resolve(this.testDir, "meteor-client.bundle.js");
      const configFile = Path.resolve(dataDir, "meteor-client.config.json");

      this.bundler(["bundle",
        `--destination=${destinationFile}`,
        `--config=${configFile}`
      ]);

      let _, __meteor_runtime_config__, Package;

      eval(Fs.readFileSync(destinationFile).toString());

      expect(__meteor_runtime_config__).to.deep.equal({
        "meteorEnv": {},
        "DDP_DEFAULT_CONNECTION_URL": "http://localhost:3000"
      });

      expect(_).to.equal(Package.underscore._);
    });
  });
});