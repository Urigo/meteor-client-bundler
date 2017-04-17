// Disable hot-code-push
if (Package.reload) {
  Meteor._reload.onMigrate(function () {
    return [false];
  });
}
