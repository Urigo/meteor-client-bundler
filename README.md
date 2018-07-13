# Meteor Client Bundler

`meteor-client-bundler` is a module bundler which will take a bunch of Atmosphere package and put them into a single module, so we can load Meteor's client scripts regardless of what framework we're using to run our server. This project was originally created due to [Ionic2CLI-Meteor-Whatsapp](https://github.com/Urigo/Ionic2CLI-Meteor-WhatsApp) and the urge to combine both Ionic along with Meteor, so we can enjoy Ionic's great client and Meteor's powerful DDP client.

### API

#### Bundling

    $ meteor-client bundle

- **-s, --source [source-dir]** - A path for a Meteor project which already exists. This is useful if you want the bundled packages to have the same versions as in the specified project. If not specified, the packages specified in the config under the `import` field will be used instead.
- **-d, --desination [destination-file]** - The path for the bundled module. Defaults to `node_modules/meteor-client.js`.
- **-c, --config [config-file]** - The path for the bundler config file. Defaults to `meteor-client.config.json`. An example config can be found in the [examples section](#examples). The config can contain the following fields:
  - **runtime** - Meteor’s runtime config. Most commonly used to set the URL of the Meteor server we would like to interface with, which defaults to `localhost:3000`.
  - **import** - A list of packages we would like to include in our bundle. Will most likely contain the `meteor-base` package, as it’s the core file of Meteor’s client, and without it, there will be no Meteor whatsoever.
- **--url [connection-url]** - DDP default connection URL.
- **--packs-dir [packages-dir]** - Export `METEOR_PACKAGE_DIRS`. Defaults to the `packages` directory under the root directory of the project. For more information, see [reference](https://docs.meteor.com/environment-variables.html#METEOR-PACKAGE-DIRS).
- **-r, --release [meteor-release]** - Use a specific release of Meteor. Defaults to the globally installed release or the one used in the specified source directory.

### Example

#### Command

    $ meteor-client bundle --destination meteor.bundle.js --config bundler.config.json

#### Config

```json
{
  "release": "1.5.2",
  "runtime": {
    "DDP_DEFAULT_CONNECTION_URL": "http://1.0.0.127:8100"
  },
  "import": [
    "accounts-base",
    "mys:accounts-phone",
    "jalik:ufs@0.7.1_1",
    "jalik:ufs-gridfs@0.1.4"
  ],
  "npmPackages": []
}
```

#### Integrating With React Native

See [React Native Meteor Boilerplate](https://github.com/DAB0mB/ReactNativeMeteorBoilerplate).

### Integrating with Angular CLI

See [Angular CLI - Meteor Example](https://github.com/Urigo/angular-meteor/tree/master/examples/AngularCLI)

### License

MIT
