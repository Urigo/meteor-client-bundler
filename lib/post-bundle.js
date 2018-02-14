// Disable hot-code-push
if (Package.reload) {
  Reload._onMigrate(function () {
    return [false];
  });
}
