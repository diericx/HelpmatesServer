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
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var check = Package.check.check;
var Match = Package.check.Match;
var DDP = Package['ddp-client'].DDP;
var EJSON = Package.ejson.EJSON;
var EventEmitter = Package['raix:eventemitter'].EventEmitter;
var Mongo = Package.mongo.Mongo;

/* Package-scope variables */
var _storageAdapters;

(function(){

///////////////////////////////////////////////////////////////////////////////////
//                                                                               //
// packages/cfs_storage-adapter/storageAdapter.client.js                         //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //
/* global FS, _storageAdapters:true, EventEmitter */

// #############################################################################
//
// STORAGE ADAPTER
//
// #############################################################################

_storageAdapters = {};

FS.StorageAdapter = function(name, options, api) {
  var self = this;

  // Check the api
  if (typeof api === 'undefined') {
    throw new Error('FS.StorageAdapter please define an api');
  }

  // store reference for easy lookup by name
  if (typeof _storageAdapters[name] !== 'undefined') {
    throw new Error('Storage name already exists: "' + name + '"');
  } else {
    _storageAdapters[name] = self;
  }

  // extend self with options and other info
  FS.Utility.extend(this, options || {}, {
    name: name
  });

  // XXX: TODO, add upload feature here...
  // we default to ddp upload but really let the SA like S3Cloud overwrite to
  // implement direct client to s3 upload

};

FS.StorageAdapter.prototype = new EventEmitter();

///////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("cfs:storage-adapter");

})();
