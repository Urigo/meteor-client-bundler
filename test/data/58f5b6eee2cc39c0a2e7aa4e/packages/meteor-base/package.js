Package.describe({
  name: 'meteor-base',
  version: '1.1.0',
  // Brief, one-line summary of the package.
  summary: 'Packages that every Meteor app needs',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.imply([
    // Super basic stuff about where your code is running and async utilities
    'meteor',
  ]);
});