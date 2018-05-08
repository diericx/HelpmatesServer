//////////////////////////////////////////////////////////////////////////
//                                                                      //
// This is a generated file. You can view the original                  //
// source in your browser if your browser supports source maps.         //
// Source maps are supported by all recent versions of Chrome, Safari,  //
// and Firefox, and by Internet Explorer 11.                            //
//                                                                      //
//////////////////////////////////////////////////////////////////////////


(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var HTTP = Package['cfs:http-methods'].HTTP;

/* Package-scope variables */
var _publishHTTP;

(function(){

/////////////////////////////////////////////////////////////////////////////////
//                                                                             //
// packages/cfs_http-publish/packages/cfs_http-publish.js                      //
//                                                                             //
/////////////////////////////////////////////////////////////////////////////////
                                                                               //
(function () {

///////////////////////////////////////////////////////////////////////////
//                                                                       //
// packages/cfs:http-publish/http.publish.client.api.js                  //
//                                                                       //
///////////////////////////////////////////////////////////////////////////
                                                                         //
// Client-side is not implemented                                        // 1
HTTP.publish = function() {                                              // 2
  throw new Error('HTTP.publish not implemented on client-side');        // 3
};                                                                       // 4
                                                                         // 5
HTTP.publishFormats = function() {                                       // 6
  throw new Error('HTTP.publishFormats not implemented on client-side'); // 7
};                                                                       // 8
                                                                         // 9
HTTP.unpublish = function() {                                            // 10
  throw new Error('HTTP.unpublish not implemented on client-side');      // 11
};                                                                       // 12
                                                                         // 13
///////////////////////////////////////////////////////////////////////////

}).call(this);

/////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("cfs:http-publish", {
  _publishHTTP: _publishHTTP
});

})();
