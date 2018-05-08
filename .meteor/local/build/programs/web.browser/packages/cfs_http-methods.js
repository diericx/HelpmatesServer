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

/* Package-scope variables */
var HTTP, _methodHTTP;

(function(){

///////////////////////////////////////////////////////////////////////
//                                                                   //
// packages/cfs_http-methods/http.methods.client.api.js              //
//                                                                   //
///////////////////////////////////////////////////////////////////////
                                                                     //
HTTP = Package.http && Package.http.HTTP || {};

// Client-side simulation is not yet implemented
HTTP.methods = function() {
  throw new Error('HTTP.methods not implemented on client-side');
};

///////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("cfs:http-methods", {
  HTTP: HTTP,
  _methodHTTP: _methodHTTP
});

})();
