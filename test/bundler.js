const Chai = require("chai");
const Path = require("path");

const expect = Chai.expect;

describe("Bundler", function () {
  describe("bundle()", function () {
    it("should take all the packages in source, bundle them by config, and write the " +
            "bundle to destination", function (done) {
      this.slow(80 * 1000);

      const dataDir = this.getDataDir("58864fa8f321c95adb91b973");
      const sourceDir = Path.resolve(dataDir, "source");
      const destinationFile = Path.resolve(this.testDir, "meteor-client.bundle.js");
      const configFile = Path.resolve(dataDir, "meteor-client.config.json");

      this.execBundler(["bundle",
        `--source=${sourceDir}`,
        `--destination=${destinationFile}`,
        `--config=${configFile}`
      ]);

      const expectedBundleFile = Path.resolve(dataDir, "meteor-client.bundle.js");
      expect(destinationFile).to.be.a.file().and.equal(expectedBundleFile);
    });

    it("should use packages specified in the config if no source was " +
       "provided", function () {
      this.slow(80 * 1000);

      const dataDir = this.getDataDir("5896074c1e4a1c27d165811b");
      const destinationFile = Path.resolve(this.testDir, "meteor-client.bundle.js");
      const configFile = Path.resolve(dataDir, "meteor-client.config.json");

      this.execBundler(["bundle",
        `--destination=${destinationFile}`,
        `--config=${configFile}`
      ]);

      const expectedBundleFile = Path.resolve(dataDir, "meteor-client.bundle.js");
      expect(destinationFile).to.be.a.file().and.equal(expectedBundleFile);
    });
  });
});