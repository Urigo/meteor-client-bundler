// Disable hot-code-push
Meteor._reload.onMigrate(function () {
  return [false];
});
