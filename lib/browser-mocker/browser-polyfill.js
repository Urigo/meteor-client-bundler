var MockBrowser = require("mock-browser");

try {
  exports = module.exports = window;
}
catch (e) {
  exports = module.exports = MockBrowser.getWindow();
}

exports.document = exports.document || MockBrowser.getDocument();
exports.history = exports.history || MockBrowser.getHistory();
exports.localStorage = exports.localStorage || MockBrowser.getLocalStorage();
exports.location = exports.location || MockBrowser.getLocation();
exports.navigator = exports.navigator || MockBrowser.getNavigator();
exports.sessionStorage = exports.sessionStorage || MockBrowser.getSessionStorage();
