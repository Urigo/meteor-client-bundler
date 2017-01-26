# Meteor Client Bundler

`meteor-client-bundler` is a module bundler which will take a bunch of Atmosphere package and put them into a single module, so we can load Meteor's client scripts regardless of what framework we're using to run our server. This project was originally created due to [Ionic2CLI-Meteor-Whatsapp](https://github.com/Urigo/Ionic2CLI-Meteor-WhatsApp) and the urge to combine both Ionic along with Meteor, so we can enjoy Ionic's great client and Meteor's powerful DDP client.

## API

#### Bundling

    $ meteor-client bundle

##### Options

- **-src, --source [source-dir]** - A path for a Meteor project which already exists. This is useful if you want the bundled packages to have the same versions as in the specified project. If not specified, the packages specified in the config under the `import` field will be used instead.
- **-dst, --desination [destination-file]** - The path for the bundled module. Defaults to `node_modules/meteor-client.js`.
- **-cfg, --config [config-file]** - The path for the bundler config file. Defaults to `meteor-client.config.json`. An example config can be found in the [examples section](#examples). The config can contain the following fields:
  - **run-time** - The JSON which will directly be inserted to `__meteor_runtime_config__`.
  - **import** - The packages that we would like to inject to our bundle. This field is an array, whose keys are packages names and values are lists of dependencies. Note that order is critic! Otherwise the packages will be bundled in the wrong order.
  - **export** - The packages that we would like to define on the global scope. The keys of this field are packages names, and the values are lists with the properties that we would like to define on the global scope.

## Examples

#### Bundling

    $ meteor-client bundle --source ../api --destination meteor.bundle.js --config bundler.config.json

#### Config

```json
{
  "run-time": {
    "meteorEnv": {},
    "DDP_DEFAULT_CONNECTION_URL": "http://localhost:3000"
  },
  "import": {
    "meteor-base@1.0.4": [
      "underscore",
      "meteor",
      "modules-runtime",
      "modules",
      "promise",
      "babel-runtime",
      "ecmascript-runtime",
      "ecmascript",
      "base64",
      "ejson",
      "jquery",
      "check",
      "random",
      "tracker",
      "retry",
      "id-map",
      "ordered-dict",
      "geojson-utils",
      "diff-sequence",
      "mongo-id",
      "minimongo",
      "ddp-common",
      "ddp-client",
      "ddp",
      "allow-deny",
      "reactive-var",
      "mongo"
    ],
    npm-bcrypt: [],
    "accounts-base": [
      "callback-hook",
      "localstorage",
      "accounts-base",
      "service-configuration"
    ],
    "matb33:collection-hooks": [
      "matb33:collection-hooks"
    ],
    "mys:accounts-phone": [
      "sha",
      "srp",
      "mys:accounts-phone"
    ],
    "jalik:ufs": [
      "observe-sequence",
      "htmljs",
      "blaze",
      "spacebars",
      "templating-runtime",
      "templating",
      "matb33:collection-hooks",
      "jalik:ufs"
    ],
    "jalik:ufs-gridfs": [
      "jalik:ufs-gridfs"
    ]
  },
  "export": {
    "accounts-base": ["Accounts"],
    "ddp": ["DDP"],
    "meteor": ["Meteor"],
    "mongo": ["Mongo"],
    "tracker": ["Tracker"],
    "underscore": ["_"]
  }
}
```

## License

MIT