function plugin() {
  return {
    visitor: {
      ExpressionStatement(path) {
        // Rename these commonjs variables if they're declared in scope
        path.scope.rename("module");
        path.scope.rename("exports");
        path.scope.rename("require");
      }
    }
  }
};

module.exports = plugin;
