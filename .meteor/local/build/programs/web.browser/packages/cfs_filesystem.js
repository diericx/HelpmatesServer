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
var FS = Package['cfs:base-package'].FS;

(function(){

/////////////////////////////////////////////////////////////////////////////
//                                                                         //
// packages/cfs_filesystem/packages/cfs_filesystem.js                      //
//                                                                         //
/////////////////////////////////////////////////////////////////////////////
                                                                           //
(function () {

///////////////////////////////////////////////////////////////////////
//                                                                   //
// packages/cfs:filesystem/filesystem.client.js                      //
//                                                                   //
///////////////////////////////////////////////////////////////////////
                                                                     //
// On the client we have just a shell                                // 1
FS.Store.FileSystem = function(name, options) {                      // 2
  var self = this;                                                   // 3
  if (!(self instanceof FS.Store.FileSystem))                        // 4
    throw new Error('FS.Store.FileSystem missing keyword "new"');    // 5
                                                                     // 6
  return new FS.StorageAdapter(name, options, {                      // 7
    typeName: 'storage.filesystem'                                   // 8
  });                                                                // 9
};                                                                   // 10
                                                                     // 11
///////////////////////////////////////////////////////////////////////

}).call(this);

/////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("cfs:filesystem");

})();
