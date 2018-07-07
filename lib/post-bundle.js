// Disable hot-code-push
if (Package.reload) {
  Package.reload.Reload._onMigrate(function () {
    return [false];
  });
}