(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var meteorInstall = Package['modules-runtime'].meteorInstall;

var require = meteorInstall({"node_modules":{"meteor":{"modules":{"server.js":function(require){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/modules/server.js                                                                                       //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
require("./install-packages.js");
require("./process.js");
require("./reify.js");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"install-packages.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/modules/install-packages.js                                                                             //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
function install(name, mainModule) {
  var meteorDir = {};

  // Given a package name <name>, install a stub module in the
  // /node_modules/meteor directory called <name>.js, so that
  // require.resolve("meteor/<name>") will always return
  // /node_modules/meteor/<name>.js instead of something like
  // /node_modules/meteor/<name>/index.js, in the rare but possible event
  // that the package contains a file called index.js (#6590).

  if (typeof mainModule === "string") {
    // Set up an alias from /node_modules/meteor/<package>.js to the main
    // module, e.g. meteor/<package>/index.js.
    meteorDir[name + ".js"] = mainModule;
  } else {
    // back compat with old Meteor packages
    meteorDir[name + ".js"] = function (r, e, module) {
      module.exports = Package[name];
    };
  }

  meteorInstall({
    node_modules: {
      meteor: meteorDir
    }
  });
}

// This file will be modified during computeJsOutputFilesMap to include
// install(<name>) calls for every Meteor package.

install("meteor");
install("meteor-base");
install("mobile-experience");
install("npm-mongo");
install("ecmascript-runtime");
install("modules-runtime");
install("modules", "meteor/modules/server.js");
install("ecmascript-runtime-server", "meteor/ecmascript-runtime-server/runtime.js");
install("babel-compiler");
install("ecmascript");
install("base64");
install("promise", "meteor/promise/server.js");
install("babel-runtime", "meteor/babel-runtime/babel-runtime.js");
install("url", "meteor/url/url_server.js");
install("http", "meteor/http/httpcall_server.js");
install("dynamic-import", "meteor/dynamic-import/server.js");
install("ejson", "meteor/ejson/ejson.js");
install("diff-sequence", "meteor/diff-sequence/diff.js");
install("geojson-utils", "meteor/geojson-utils/main.js");
install("id-map", "meteor/id-map/id-map.js");
install("random");
install("mongo-id");
install("ordered-dict", "meteor/ordered-dict/ordered_dict.js");
install("tracker");
install("minimongo", "meteor/minimongo/minimongo_server.js");
install("check", "meteor/check/match.js");
install("retry", "meteor/retry/retry.js");
install("callback-hook", "meteor/callback-hook/hook.js");
install("ddp-common");
install("reload");
install("socket-stream-client", "meteor/socket-stream-client/node.js");
install("ddp-client", "meteor/ddp-client/server/server.js");
install("underscore");
install("rate-limit", "meteor/rate-limit/rate-limit.js");
install("ddp-rate-limiter");
install("logging");
install("routepolicy");
install("boilerplate-generator", "meteor/boilerplate-generator/generator.js");
install("webapp-hashing");
install("webapp", "meteor/webapp/webapp_server.js");
install("ddp-server");
install("ddp");
install("allow-deny");
install("mongo-dev-server", "meteor/mongo-dev-server/server.js");
install("binary-heap");
install("insecure");
install("mongo");
install("blaze-html-templates");
install("reactive-var");
install("standard-minifier-css");
install("standard-minifier-js");
install("server-render", "meteor/server-render/server.js");
install("shim-common", "meteor/shim-common/server.js");
install("es5-shim", "meteor/es5-shim/server.js");
install("shell-server", "meteor/shell-server/main.js");
install("npm-bcrypt", "meteor/npm-bcrypt/wrapper.js");
install("accounts-base", "meteor/accounts-base/server_main.js");
install("sha");
install("srp");
install("email");
install("accounts-password");
install("accounts-ui");
install("erasaur:meteor-lodash");
install("jquery");
install("meteortoys:toykit");
install("msavin:mongol");
install("cfs:standard-packages");
install("deps");
install("cfs:base-package");
install("livedata");
install("mongo-livedata");
install("raix:eventemitter");
install("cfs:storage-adapter");
install("cfs:filesystem");
install("hot-code-push");
install("launch-screen");
install("observe-sequence");
install("htmljs");
install("blaze");
install("ui");
install("spacebars");
install("templating-compiler");
install("templating-runtime");
install("templating");
install("cfs:data-man");
install("cfs:file");
install("cfs:tempstore");
install("cfs:http-methods");
install("cfs:http-publish");
install("cfs:access-point");
install("cfs:reactive-property");
install("cfs:reactive-list");
install("cfs:power-queue");
install("cfs:upload-http");
install("cfs:collection");
install("cfs:collection-filters");
install("cfs:worker");
install("autoupdate");
install("service-configuration");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"process.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/modules/process.js                                                                                      //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
if (! global.process) {
  try {
    // The application can run `npm install process` to provide its own
    // process stub; otherwise this module will provide a partial stub.
    global.process = require("process");
  } catch (missing) {
    global.process = {};
  }
}

var proc = global.process;

if (Meteor.isServer) {
  // Make require("process") work on the server in all versions of Node.
  meteorInstall({
    node_modules: {
      "process.js": function (r, e, module) {
        module.exports = proc;
      }
    }
  });
} else {
  proc.platform = "browser";
  proc.nextTick = proc.nextTick || Meteor._setImmediate;
}

if (typeof proc.env !== "object") {
  proc.env = {};
}

var hasOwn = Object.prototype.hasOwnProperty;
for (var key in meteorEnv) {
  if (hasOwn.call(meteorEnv, key)) {
    proc.env[key] = meteorEnv[key];
  }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"reify.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/modules/reify.js                                                                                        //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
var Module = module.constructor;
var Mp = Module.prototype;
require("reify/lib/runtime").enable(Mp);
Mp.importSync = Mp.importSync || Mp.import;
Mp.import = Mp.import || Mp.importSync;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"node_modules":{"reify":{"lib":{"runtime":{"index.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// node_modules/meteor/modules/node_modules/reify/lib/runtime/index.js                                              //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
"use strict";

// This module should be compatible with PhantomJS v1, just like the other files
// in reify/lib/runtime. Node 4+ features like const/let and arrow functions are
// not acceptable here, and importing any npm packages should be contemplated
// with extreme skepticism.

var utils = require("./utils.js");
var Entry = require("./entry.js");

// The exports.enable method can be used to enable the Reify runtime for
// specific module objects, or for Module.prototype (where implemented),
// to make the runtime available throughout the entire module system.
exports.enable = function (mod) {
  if (typeof mod.export !== "function" ||
      typeof mod.importSync !== "function") {
    mod.export = moduleExport;
    mod.exportDefault = moduleExportDefault;
    mod.runSetters = runSetters;
    mod.watch = moduleWatch;

    // Used for copying the properties of a namespace object to
    // mod.exports to implement `export * from "module"` syntax.
    mod.makeNsSetter = moduleMakeNsSetter;

    // To be deprecated:
    mod.runModuleSetters = runSetters;
    mod.importSync = importSync;

    return true;
  }

  return false;
};

function moduleWatch(exported, setters, key) {
  utils.setESModule(this.exports);
  Entry.getOrCreate(this.exports, this);

  if (utils.isObject(setters)) {
    Entry.getOrCreate(exported).addSetters(this, setters, key);
  }
}

// If key is provided, it will be used to identify the given setters so
// that they can be replaced if module.importSync is called again with the
// same key. This avoids potential memory leaks from import declarations
// inside loops. The compiler generates these keys automatically (and
// deterministically) when compiling nested import declarations.
function importSync(id, setters, key) {
  return this.watch(this.require(id), setters, key);
}

// Register getter functions for local variables in the scope of an export
// statement. Pass true as the second argument to indicate that the getter
// functions always return the same values.
function moduleExport(getters, constant) {
  utils.setESModule(this.exports);
  var entry = Entry.getOrCreate(this.exports, this);
  entry.addGetters(getters, constant);
  if (this.loaded) {
    // If the module has already been evaluated, then we need to trigger
    // another round of entry.runSetters calls, which begins by calling
    // entry.runModuleGetters(module).
    entry.runSetters();
  }
}

// Register a getter function that always returns the given value.
function moduleExportDefault(value) {
  return this.export({
    default: function () {
      return value;
    }
  }, true);
}

// Platform-specific code should find a way to call this method whenever
// the module system is about to return module.exports from require. This
// might happen more than once per module, in case of dependency cycles,
// so we want Module.prototype.runSetters to run each time.
function runSetters(valueToPassThrough) {
  var entry = Entry.get(this.exports);
  if (entry !== null) {
    entry.runSetters();
  }

  if (this.loaded) {
    // If this module has finished loading, then we must create an Entry
    // object here, so that we can add this module to entry.ownerModules
    // by passing it as the second argument to Entry.getOrCreate.
    Entry.getOrCreate(this.exports, this);
  }

  // Assignments to exported local variables get wrapped with calls to
  // module.runSetters, so module.runSetters returns the
  // valueToPassThrough parameter to allow the value of the original
  // expression to pass through. For example,
  //
  //   export var a = 1;
  //   console.log(a += 3);
  //
  // becomes
  //
  //   module.export("a", () => a);
  //   var a = 1;
  //   console.log(module.runSetters(a += 3));
  //
  // This ensures module.runSetters runs immediately after the assignment,
  // and does not interfere with the larger computation.
  return valueToPassThrough;
}

// Returns a function that takes a namespace object and copies the
// properties of the namespace to module.exports, excluding any "default"
// property (by default, unless includeDefault is truthy), which is useful
// for implementing `export * from "module"`.
function moduleMakeNsSetter(includeDefault) {
  var module = this;
  // Discussion of why the "default" property is skipped:
  // https://github.com/tc39/ecma262/issues/948
  return function (namespace) {
    Object.keys(namespace).forEach(function (key) {
      if (includeDefault || key !== "default") {
        utils.copyKey(key, module.exports, namespace);
      }
    });
  };
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},"expo-server-sdk":{"package.json":function(require,exports){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// node_modules/expo-server-sdk/package.json                                                                        //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
exports.name = "expo-server-sdk";
exports.version = "2.3.3";
exports.main = "build/ExpoClient.js";

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"build":{"ExpoClient.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// node_modules/expo-server-sdk/build/ExpoClient.js                                                                 //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _toArray2 = require('babel-runtime/helpers/toArray');

var _toArray3 = _interopRequireDefault(_toArray2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _nodeFetch = require('node-fetch');

var _nodeFetch2 = _interopRequireDefault(_nodeFetch);

var _zlib = require('zlib');

var _zlib2 = _interopRequireDefault(_zlib);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var BASE_URL = 'https://exp.host'; /**
                                    * expo-server-sdk
                                    *
                                    * Use this if you are running Node on your server backend when you are working with Expo
                                    * https://expo.io
                                    *
                                    * 
                                    */

var BASE_API_URL = BASE_URL + '/--/api/v2';

/**
 * The max number of push notifications to be sent at once. Since we can't automatically upgrade
 * everyone using this library, we should strongly try not to decrease it.
 */
var PUSH_NOTIFICATION_CHUNK_LIMIT = 100;

// TODO: Eventually we'll want to have developers authenticate. Right now it's not necessary because
// push notifications are the only API we have and the push tokens are secret anyway.

var ExpoClient = function () {
  function ExpoClient() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, ExpoClient);

    this._httpAgent = options.httpAgent;
  }

  /**
   * Returns `true` if the token is an Expo push token
   */


  (0, _createClass3.default)(ExpoClient, [{
    key: 'sendPushNotificationAsync',


    /**
     * Sends the given message to its recipient via a push notification
     */
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(message) {
        var receipts;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.sendPushNotificationsAsync([message]);

              case 2:
                receipts = _context.sent;

                (0, _invariant2.default)(receipts.length === 1, 'Expected exactly one push receipt');
                return _context.abrupt('return', receipts[0]);

              case 5:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function sendPushNotificationAsync(_x2) {
        return _ref.apply(this, arguments);
      }

      return sendPushNotificationAsync;
    }()

    /**
     * Sends the given messages to their recipients via push notifications and returns an array of
     * push receipts. Each receipt corresponds to the message at its respective index (the nth receipt
     * is for the nth message).
     *
     * There is a limit on the number of push notifications you can send at once. Use
     * `chunkPushNotifications` to divide an array of push notification messages into appropriately
     * sized chunks.
     */

  }, {
    key: 'sendPushNotificationsAsync',
    value: function () {
      var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(messages) {
        var data, apiError;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this._requestAsync(BASE_API_URL + '/push/send', {
                  httpMethod: 'post',
                  body: messages,
                  shouldCompress: function shouldCompress(body) {
                    return body.length > 1024;
                  }
                });

              case 2:
                data = _context2.sent;

                if (!(!Array.isArray(data) || data.length !== messages.length)) {
                  _context2.next = 7;
                  break;
                }

                apiError = new Error('Expected Exponent to respond with ' + messages.length + ' ' + ((messages.length === 1 ? 'receipt' : 'receipts') + ' but got ') + ('' + data.length));

                apiError.data = data;
                throw apiError;

              case 7:
                return _context2.abrupt('return', data);

              case 8:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function sendPushNotificationsAsync(_x3) {
        return _ref2.apply(this, arguments);
      }

      return sendPushNotificationsAsync;
    }()
  }, {
    key: 'chunkPushNotifications',
    value: function chunkPushNotifications(messages) {
      var chunks = [];
      var chunk = [];
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = messages[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _message = _step.value;

          chunk.push(_message);
          if (chunk.length >= PUSH_NOTIFICATION_CHUNK_LIMIT) {
            chunks.push(chunk);
            chunk = [];
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      if (chunk.length) {
        chunks.push(chunk);
      }

      return chunks;
    }
  }, {
    key: '_requestAsync',
    value: function () {
      var _ref3 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(url, options) {
        var sdkVersion, fetchOptions, json, response, apiError, textBody, result, _apiError, _apiError2;

        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                sdkVersion = require('../package.json').version;
                fetchOptions = {
                  method: options.httpMethod,
                  body: JSON.stringify(options.body),
                  headers: new _nodeFetch.Headers({
                    Accept: 'application/json',
                    'Accept-Encoding': 'gzip, deflate',
                    'User-Agent': 'expo-server-sdk-node/' + sdkVersion
                  }),
                  agent: this._httpAgent
                };

                if (!(options.body != null)) {
                  _context3.next = 14;
                  break;
                }

                json = JSON.stringify(options.body);

                (0, _invariant2.default)(json != null, 'JSON request body must not be null');

                if (!options.shouldCompress(json)) {
                  _context3.next = 12;
                  break;
                }

                _context3.next = 8;
                return _gzipAsync(Buffer.from(json));

              case 8:
                fetchOptions.body = _context3.sent;

                fetchOptions.headers.set('Content-Encoding', 'gzip');
                _context3.next = 13;
                break;

              case 12:
                fetchOptions.body = json;

              case 13:

                fetchOptions.headers.set('Content-Type', 'application/json');

              case 14:
                _context3.next = 16;
                return (0, _nodeFetch2.default)(url, fetchOptions);

              case 16:
                response = _context3.sent;

                if (!(response.status !== 200)) {
                  _context3.next = 22;
                  break;
                }

                _context3.next = 20;
                return this._parseErrorResponseAsync(response);

              case 20:
                apiError = _context3.sent;
                throw apiError;

              case 22:
                _context3.next = 24;
                return response.text();

              case 24:
                textBody = _context3.sent;

                // We expect the API response body to be JSON
                result = void 0;
                _context3.prev = 26;

                result = JSON.parse(textBody);
                _context3.next = 36;
                break;

              case 30:
                _context3.prev = 30;
                _context3.t0 = _context3['catch'](26);
                _context3.next = 34;
                return this._getTextResponseErrorAsync(response, textBody);

              case 34:
                _apiError = _context3.sent;
                throw _apiError;

              case 36:
                if (!result.errors) {
                  _context3.next = 39;
                  break;
                }

                _apiError2 = this._getErrorFromResult(result);
                throw _apiError2;

              case 39:
                return _context3.abrupt('return', result.data);

              case 40:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this, [[26, 30]]);
      }));

      function _requestAsync(_x4, _x5) {
        return _ref3.apply(this, arguments);
      }

      return _requestAsync;
    }()
  }, {
    key: '_parseErrorResponseAsync',
    value: function () {
      var _ref4 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4(response) {
        var textBody, result, apiError;
        return _regenerator2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return response.text();

              case 2:
                textBody = _context4.sent;
                result = void 0;
                _context4.prev = 4;

                result = JSON.parse(textBody);
                _context4.next = 13;
                break;

              case 8:
                _context4.prev = 8;
                _context4.t0 = _context4['catch'](4);
                _context4.next = 12;
                return this._getTextResponseErrorAsync(response, textBody);

              case 12:
                return _context4.abrupt('return', _context4.sent);

              case 13:
                if (!(!result.errors || !Array.isArray(result.errors) || !result.errors.length)) {
                  _context4.next = 19;
                  break;
                }

                _context4.next = 16;
                return this._getTextResponseErrorAsync(response, textBody);

              case 16:
                apiError = _context4.sent;

                apiError.errorData = result;
                return _context4.abrupt('return', apiError);

              case 19:
                return _context4.abrupt('return', this._getErrorFromResult(result));

              case 20:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this, [[4, 8]]);
      }));

      function _parseErrorResponseAsync(_x6) {
        return _ref4.apply(this, arguments);
      }

      return _parseErrorResponseAsync;
    }()
  }, {
    key: '_getTextResponseErrorAsync',
    value: function () {
      var _ref5 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee5(response, text) {
        var apiError;
        return _regenerator2.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                apiError = new Error('Expo responded with an error with status code ' + response.status + ': ' + text);

                apiError.statusCode = response.status;
                apiError.errorText = text;
                return _context5.abrupt('return', apiError);

              case 4:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function _getTextResponseErrorAsync(_x7, _x8) {
        return _ref5.apply(this, arguments);
      }

      return _getTextResponseErrorAsync;
    }()

    /**
     * Returns an error for the first API error in the result, with an optional `others` field that
     * contains any other errors.
     */

  }, {
    key: '_getErrorFromResult',
    value: function _getErrorFromResult(result) {
      var _this = this;

      (0, _invariant2.default)(result.errors && result.errors.length > 0, 'Expected at least one error from Expo');

      var _result$errors = (0, _toArray3.default)(result.errors),
          errorData = _result$errors[0],
          otherErrorData = _result$errors.slice(1);

      var error = this._getErrorFromResultError(errorData);
      if (otherErrorData.length) {
        error.others = otherErrorData.map(function (data) {
          return _this._getErrorFromResultError(data);
        });
      }
      return error;
    }

    /**
     * Returns an error for a single API error
     */

  }, {
    key: '_getErrorFromResultError',
    value: function _getErrorFromResultError(errorData) {
      var error = new Error(errorData.message);
      error.code = errorData.code;

      if (errorData.details != null) {
        error.details = errorData.details;
      }

      if (errorData.stack != null) {
        error.serverStack = errorData.stack;
      }

      return error;
    }
  }], [{
    key: 'isExpoPushToken',
    value: function isExpoPushToken(token) {
      return typeof token === 'string' && (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[')) && token.endsWith(']');
    }

    /**
     * Legacy alias for isExpoPushToken
     */

  }, {
    key: 'isExponentPushToken',
    value: function isExponentPushToken(token) {
      return ExpoClient.isExpoPushToken(token);
    }
  }]);
  return ExpoClient;
}();

ExpoClient.pushNotificationChunkSizeLimit = PUSH_NOTIFICATION_CHUNK_LIMIT;
exports.default = ExpoClient;


function _gzipAsync(data) {
  return new Promise(function (resolve, reject) {
    _zlib2.default.gzip(data, function (error, result) {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}

module.exports = exports['default'];
//# sourceMappingURL=ExpoClient.js.map
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"@babel":{"runtime":{"package.json":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// node_modules/@babel/runtime/package.json                                                                         //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.exports = {
  "_from": "@babel/runtime@^7.0.0-beta.36",
  "_id": "@babel/runtime@7.0.0-beta.40",
  "_inBundle": false,
  "_integrity": "sha512-vIM68NUCWauZJTFoVUG1lggva1I8FLB9zFKwWG7Xjin4FkHpEKJv2y4x1DGVPVt93S5/zHSBj1bXYEuxOkFGzg==",
  "_location": "/@babel/runtime",
  "_phantomChildren": {},
  "_requested": {
    "type": "range",
    "registry": true,
    "raw": "@babel/runtime@^7.0.0-beta.36",
    "name": "@babel/runtime",
    "escapedName": "@babel%2fruntime",
    "scope": "@babel",
    "rawSpec": "^7.0.0-beta.36",
    "saveSpec": null,
    "fetchSpec": "^7.0.0-beta.36"
  },
  "_requiredBy": [
    "/"
  ],
  "_resolved": "https://registry.npmjs.org/@babel/runtime/-/runtime-7.0.0-beta.40.tgz",
  "_shasum": "8e3b8f1d2d8639d010e991a7e99c1d9ef578f886",
  "_spec": "@babel/runtime@^7.0.0-beta.36",
  "_where": "/Users/Zac/Documents/Code/GitHub/Meteor/helpmates",
  "author": {
    "name": "Sebastian McKenzie",
    "email": "sebmck@gmail.com"
  },
  "bundleDependencies": false,
  "dependencies": {
    "core-js": "^2.5.3",
    "regenerator-runtime": "^0.11.1"
  },
  "deprecated": false,
  "description": "babel selfContained runtime",
  "devDependencies": {
    "@babel/core": "7.0.0-beta.40",
    "@babel/helpers": "7.0.0-beta.40",
    "@babel/plugin-transform-runtime": "7.0.0-beta.40",
    "@babel/preset-env": "7.0.0-beta.40",
    "@babel/types": "7.0.0-beta.40"
  },
  "license": "MIT",
  "name": "@babel/runtime",
  "repository": {
    "type": "git",
    "url": "https://github.com/babel/babel/tree/master/packages/babel-runtime"
  },
  "version": "7.0.0-beta.40"
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"regenerator":{"index.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// node_modules/@babel/runtime/regenerator/index.js                                                                 //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
module.exports = require("regenerator-runtime");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"helpers":{"builtin":{"extends.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// node_modules/@babel/runtime/helpers/builtin/extends.js                                                           //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
function _extends() {
  module.exports = _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

module.exports = _extends;
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},"bcrypt":{"package.json":function(require,exports){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// node_modules/bcrypt/package.json                                                                                 //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
exports.name = "bcrypt";
exports.version = "1.0.3";
exports.main = "./bcrypt";

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"bcrypt.js":function(require,exports,module,__filename,__dirname){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// node_modules/bcrypt/bcrypt.js                                                                                    //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
'use strict';

var binary = require('node-pre-gyp');
var path = require('path');
var binding_path = binary.find(path.resolve(path.join(__dirname, './package.json')));
var bindings = require(binding_path);

var crypto = require('crypto');

var promises = require('./lib/promises');

/// generate a salt (sync)
/// @param {Number} [rounds] number of rounds (default 10)
/// @return {String} salt
module.exports.genSaltSync = function genSaltSync(rounds) {
    // default 10 rounds
    if (!rounds) {
        rounds = 10;
    } else if (typeof rounds !== 'number') {
        throw new Error('rounds must be a number');
    }

    return bindings.gen_salt_sync(rounds, crypto.randomBytes(16));
};

/// generate a salt
/// @param {Number} [rounds] number of rounds (default 10)
/// @param {Function} cb callback(err, salt)
module.exports.genSalt = function genSalt(rounds, ignore, cb) {
    // if callback is first argument, then use defaults for others
    if (typeof arguments[0] === 'function') {
        // have to set callback first otherwise arguments are overriden
        cb = arguments[0];
        rounds = 10;
    // callback is second argument
    } else if (typeof arguments[1] === 'function') {
        // have to set callback first otherwise arguments are overriden
        cb = arguments[1];
    }

    if (!cb) {
        return promises.promise(genSalt, this, [rounds, ignore]);
    }

    // default 10 rounds
    if (!rounds) {
        rounds = 10;
    } else if (typeof rounds !== 'number') {
        // callback error asynchronously
        return process.nextTick(function() {
            cb(new Error('rounds must be a number'));
        });
    }

    crypto.randomBytes(16, function(error, randomBytes) {
        if (error) {
            cb(error);
            return;
        }

        bindings.gen_salt(rounds, randomBytes, cb);
    });
};

/// hash data using a salt
/// @param {String} data the data to encrypt
/// @param {String} salt the salt to use when hashing
/// @return {String} hash
module.exports.hashSync = function hashSync(data, salt) {
    if (data == null || salt == null) {
        throw new Error('data and salt arguments required');
    }

    if (typeof data !== 'string' || (typeof salt !== 'string' && typeof salt !== 'number')) {
        throw new Error('data must be a string and salt must either be a salt string or a number of rounds');
    }

    if (typeof salt === 'number') {
        salt = module.exports.genSaltSync(salt);
    }

    return bindings.encrypt_sync(data, salt);
};

/// hash data using a salt
/// @param {String} data the data to encrypt
/// @param {String} salt the salt to use when hashing
/// @param {Function} cb callback(err, hash)
module.exports.hash = function hash(data, salt, cb) {
    if (typeof data === 'function') {
        return process.nextTick(function() {
            data(new Error('data must be a string and salt must either be a salt string or a number of rounds'));
        });
    }

    if (typeof salt === 'function') {
        return process.nextTick(function() {
            salt(new Error('data must be a string and salt must either be a salt string or a number of rounds'));
        });
    }

    // cb exists but is not a function
    // return a rejecting promise
    if (cb && typeof cb !== 'function') {
        return promises.reject(new Error('cb must be a function or null to return a Promise'));
    }

    if (!cb) {
        return promises.promise(hash, this, [data, salt]);
    }

    if (data == null || salt == null) {
        return process.nextTick(function() {
            cb(new Error('data and salt arguments required'));
        });
    }

    if (typeof data !== 'string' || (typeof salt !== 'string' && typeof salt !== 'number')) {
        return process.nextTick(function() {
            cb(new Error('data must be a string and salt must either be a salt string or a number of rounds'));
        });
    }


    if (typeof salt === 'number') {
        return module.exports.genSalt(salt, function(err, salt) {
            return bindings.encrypt(data, salt, cb);
        });
    }

    return bindings.encrypt(data, salt, cb);
};

/// compare raw data to hash
/// @param {String} data the data to hash and compare
/// @param {String} hash expected hash
/// @return {bool} true if hashed data matches hash
module.exports.compareSync = function compareSync(data, hash) {
    if (data == null || hash == null) {
        throw new Error('data and hash arguments required');
    }

    if (typeof data !== 'string' || typeof hash !== 'string') {
        throw new Error('data and hash must be strings');
    }

    return bindings.compare_sync(data, hash);
};

/// compare raw data to hash
/// @param {String} data the data to hash and compare
/// @param {String} hash expected hash
/// @param {Function} cb callback(err, matched) - matched is true if hashed data matches hash
module.exports.compare = function compare(data, hash, cb) {
    if (typeof data === 'function') {
        return process.nextTick(function() {
            data(new Error('data and hash arguments required'));
        });
    }

    if (typeof hash === 'function') {
        return process.nextTick(function() {
            hash(new Error('data and hash arguments required'));
        });
    }

    // cb exists but is not a function
    // return a rejecting promise
    if (cb && typeof cb !== 'function') {
        return promises.reject(new Error('cb must be a function or null to return a Promise'));
    }

    if (!cb) {
        return promises.promise(compare, this, [data, hash]);
    }

    if (data == null || hash == null) {
        return process.nextTick(function() {
            cb(new Error('data and hash arguments required'));
        });
    }

    if (typeof data !== 'string' || typeof hash !== 'string') {
        return process.nextTick(function() {
            cb(new Error('data and hash must be strings'));
        });
    }

    return bindings.compare(data, hash, cb);
};

/// @param {String} hash extract rounds from this hash
/// @return {Number} the number of rounds used to encrypt a given hash
module.exports.getRounds = function getRounds(hash) {
    if (hash == null) {
        throw new Error('hash argument required');
    }

    if (typeof hash !== 'string') {
        throw new Error('hash must be a string');
    }

    return bindings.get_rounds(hash);
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/modules/server.js");

/* Exports */
Package._define("modules", exports, {
  meteorInstall: meteorInstall
});

})();
