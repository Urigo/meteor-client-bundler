function plugin() {
  return {
    visitor: {
      ExpressionStatement: {
        enter(path) {
          // Rename these commonjs variables if they're declared in scope
          path.scope.rename("module");
          path.scope.rename("exports");
          path.scope.rename("require");
        }
      },

      Block: {
        enter(path) {
          // Remove all 'use strict' directives since they may cause problems
          var directives = path.node.directives;

          for (var i = directives.length - 1; i >= 0; i--) {
            var directive = directives[i];

            if (directive.value.value == 'use strict') {
              directives.splice(i, 1);
            }
          }
        }
      }
    }
  }
};

module.exports = plugin;
