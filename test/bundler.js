describe("Bundler", function () {
  describe("bundle()", function () {
    it("Should take all the packages in source, bundle them by config, and write the " +
       "bundle to destination", function () {
      const dataDir = this.getDataDir("58864fa8f321c95adb91b973");
      const sourceDir = Path.resolve(dataDir, "source");
      const destinationFile = Path.resolve(this.testDir, "meteor-client.bundle.js");
      const configFile = Path.resolve(dataDir, "meteor-client.config.js");

      this.exec("meteor-client", ["bundle",
        `--source ${sourceDir}`,
        `--destination ${destinationFile}`,
        `--config ${configFile}`
      ]);

      // Runtime config
      let __meteor_runtime_config__;
      // Meteor packages
      let Package;
      // Global imports
      let _, Accounts, DDP, Meteor, Mongo, Tracker;

      eval(Fs.readFileSync(destinationFile));

      expect(__meteor_runtime_config__).to.deep.equal({
        "meteorEnv": {},
        "DDP_DEFAULT_CONNECTION_URL": "http://localhost:3000"
      });

      expect(_).to.equal(Package["underscore"]["_"]);
      expect(Accounts).to.equal(Package["accounts-base"]["Accounts"]);
      expect(DDP).to.equal(Package["ddp"]["DDP"]);
      expect(Meteor).to.equal(Package["meteor"]["Meteor"]);
      expect(Mongo).to.equal(Package["mongo"]["Mongo"]);
      expect(Tracker).to.equal(Package["tracker"]["Tracker"]);
    });
  });
});