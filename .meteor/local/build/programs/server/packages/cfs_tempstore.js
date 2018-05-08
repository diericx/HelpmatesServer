(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var FS = Package['cfs:base-package'].FS;
var ECMAScript = Package.ecmascript.ECMAScript;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var _chunkPath, _fileReference;

var require = meteorInstall({"node_modules":{"meteor":{"cfs:tempstore":{"tempStore.js":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/cfs_tempstore/tempStore.js                                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
// ##Temporary Storage
//
// Temporary storage is used for chunked uploads until all chunks are received
// and all copies have been made or given up. In some cases, the original file
// is stored only in temporary storage (for example, if all copies do some
// manipulation in beforeSave). This is why we use the temporary file as the
// basis for each saved copy, and then remove it after all copies are saved.
//
// Every chunk is saved as an individual temporary file. This is safer than
// attempting to write multiple incoming chunks to different positions in a
// single temporary file, which can lead to write conflicts.
//
// Using temp files also allows us to easily resume uploads, even if the server
// restarts, and to keep the working memory clear.
// The FS.TempStore emits events that others are able to listen to
var EventEmitter = Npm.require('events').EventEmitter; // We have a special stream concating all chunk files into one readable stream


var CombinedStream = Npm.require('combined-stream');
/** @namespace FS.TempStore
 * @property FS.TempStore
 * @type {object}
 * @public
 * @summary An event emitter
 */


FS.TempStore = new EventEmitter(); // Create a tracker collection for keeping track of all chunks for any files that are currently in the temp store

var tracker = FS.TempStore.Tracker = new Mongo.Collection('cfs._tempstore.chunks');
/**
 * @property FS.TempStore.Storage
 * @type {StorageAdapter}
 * @namespace FS.TempStore
 * @private
 * @summary This property is set to either `FS.Store.FileSystem` or `FS.Store.GridFS`
 *
 * __When and why:__
 * We normally default to `cfs-filesystem` unless its not installed. *(we default to gridfs if installed)*
 * But if `cfs-gridfs` and `cfs-worker` is installed we default to `cfs-gridfs`
 *
 * If `cfs-gridfs` and `cfs-filesystem` is not installed we log a warning.
 * the user can set `FS.TempStore.Storage` them selfs eg.:
 * ```js
 *   // Its important to set `internal: true` this lets the SA know that we
 *   // are using this internally and it will give us direct SA api
 *   FS.TempStore.Storage = new FS.Store.GridFS('_tempstore', { internal: true });
 * ```
 *
 * > Note: This is considered as `advanced` use, its not a common pattern.
 */

FS.TempStore.Storage = null; // We will not mount a storage adapter until needed. This allows us to check for the
// existance of FS.FileWorker, which is loaded after this package because it
// depends on this package.

function mountStorage() {
  if (FS.TempStore.Storage) return; // XXX: We could replace this test, testing the FS scope for grifFS etc.
  // This is on the todo later when we get "stable"

  if (Package["cfs:gridfs"] && (Package["cfs:worker"] || !Package["cfs:filesystem"])) {
    // If the file worker is installed we would prefer to use the gridfs sa
    // for scalability. We also default to gridfs if filesystem is not found
    // Use the gridfs
    FS.TempStore.Storage = new FS.Store.GridFS('_tempstore', {
      internal: true
    });
  } else if (Package["cfs:filesystem"]) {
    // use the Filesystem
    FS.TempStore.Storage = new FS.Store.FileSystem('_tempstore', {
      internal: true
    });
  } else {
    throw new Error('FS.TempStore.Storage is not set: Install cfs:filesystem or cfs:gridfs or set it manually');
  }

  FS.debug && console.log('TempStore is mounted on', FS.TempStore.Storage.typeName);
}

function mountFile(fileObj, name) {
  if (!fileObj.isMounted()) {
    throw new Error(name + ' cannot work with unmounted file');
  }
} // We update the fileObj on progress


FS.TempStore.on('progress', function (fileObj, chunkNum, count, total, result) {
  FS.debug && console.log('TempStore progress: Received ' + count + ' of ' + total + ' chunks for ' + fileObj.name());
}); // XXX: TODO
// FS.TempStore.on('stored', function(fileObj, chunkCount, result) {
//   // This should work if we pass on result from the SA on stored event...
//   fileObj.update({ $set: { chunkSum: 1, chunkCount: chunkCount, size: result.size } });
// });
// Stream implementation

/**
 * @method _chunkPath
 * @private
 * @param {Number} [n] Chunk number
 * @returns {String} Chunk naming convention
 */

_chunkPath = function (n) {
  return (n || 0) + '.chunk';
};
/**
 * @method _fileReference
 * @param {FS.File} fileObj
 * @param {Number} chunk
 * @private
 * @returns {String} Generated SA specific fileKey for the chunk
 *
 * Note: Calling function should call mountStorage() first, and
 * make sure that fileObj is mounted.
 */


_fileReference = function (fileObj, chunk, existing) {
  // Maybe it's a chunk we've already saved
  existing = existing || tracker.findOne({
    fileId: fileObj._id,
    collectionName: fileObj.collectionName
  }); // Make a temporary fileObj just for fileKey generation

  var tempFileObj = new FS.File({
    collectionName: fileObj.collectionName,
    _id: fileObj._id,
    original: {
      name: _chunkPath(chunk)
    },
    copies: {
      _tempstore: {
        key: existing && existing.keys[chunk]
      }
    }
  }); // Return a fitting fileKey SA specific

  return FS.TempStore.Storage.adapter.fileKey(tempFileObj);
};
/**
 * @method FS.TempStore.exists
 * @param {FS.File} File object
 * @returns {Boolean} Is this file, or parts of it, currently stored in the TempStore
 */


FS.TempStore.exists = function (fileObj) {
  var existing = tracker.findOne({
    fileId: fileObj._id,
    collectionName: fileObj.collectionName
  });
  return !!existing;
};
/**
 * @method FS.TempStore.listParts
 * @param {FS.File} fileObj
 * @returns {Object} of parts already stored
 * @todo This is not yet implemented, milestone 1.1.0
 */


FS.TempStore.listParts = function fsTempStoreListParts(fileObj) {
  var self = this;
  console.warn('This function is not correctly implemented using SA in TempStore'); //XXX This function might be necessary for resume. Not currently supported.
};
/**
 * @method FS.TempStore.removeFile
 * @public
 * @param {FS.File} fileObj
 * This function removes the file from tempstorage - it cares not if file is
 * already removed or not found, goal is reached anyway.
 */


FS.TempStore.removeFile = function fsTempStoreRemoveFile(fileObj) {
  var self = this; // Ensure that we have a storage adapter mounted; if not, throw an error.

  mountStorage(); // If fileObj is not mounted or can't be, throw an error

  mountFile(fileObj, 'FS.TempStore.removeFile'); // Emit event

  self.emit('remove', fileObj);
  var chunkInfo = tracker.findOne({
    fileId: fileObj._id,
    collectionName: fileObj.collectionName
  });

  if (chunkInfo) {
    // Unlink each file
    FS.Utility.each(chunkInfo.keys || {}, function (key, chunk) {
      var fileKey = _fileReference(fileObj, chunk, chunkInfo);

      FS.TempStore.Storage.adapter.remove(fileKey, FS.Utility.noop);
    }); // Remove fileObj from tracker collection, too

    tracker.remove({
      _id: chunkInfo._id
    });
  }
};
/**
 * @method FS.TempStore.removeAll
 * @public
 * @summary This function removes all files from tempstorage - it cares not if file is
 * already removed or not found, goal is reached anyway.
 */


FS.TempStore.removeAll = function fsTempStoreRemoveAll() {
  var self = this; // Ensure that we have a storage adapter mounted; if not, throw an error.

  mountStorage();
  tracker.find().forEach(function (chunkInfo) {
    // Unlink each file
    FS.Utility.each(chunkInfo.keys || {}, function (key, chunk) {
      var fileKey = _fileReference({
        _id: chunkInfo.fileId,
        collectionName: chunkInfo.collectionName
      }, chunk, chunkInfo);

      FS.TempStore.Storage.adapter.remove(fileKey, FS.Utility.noop);
    }); // Remove from tracker collection, too

    tracker.remove({
      _id: chunkInfo._id
    });
  });
};
/**
 * @method FS.TempStore.createWriteStream
 * @public
 * @param {FS.File} fileObj File to store in temporary storage
 * @param {Number | String} [options]
 * @returns {Stream} Writeable stream
 *
 * `options` of different types mean differnt things:
 * * `undefined` We store the file in one part
 * *(Normal server-side api usage)*
 * * `Number` the number is the part number total
 * *(multipart uploads will use this api)*
 * * `String` the string is the name of the `store` that wants to store file data
 * *(stores that want to sync their data to the rest of the files stores will use this)*
 *
 * > Note: fileObj must be mounted on a `FS.Collection`, it makes no sense to store otherwise
 */


FS.TempStore.createWriteStream = function (fileObj, options) {
  var self = this; // Ensure that we have a storage adapter mounted; if not, throw an error.

  mountStorage(); // If fileObj is not mounted or can't be, throw an error

  mountFile(fileObj, 'FS.TempStore.createWriteStream'); // Cache the selector for use multiple times below

  var selector = {
    fileId: fileObj._id,
    collectionName: fileObj.collectionName
  }; // TODO, should pass in chunkSum so we don't need to use FS.File for it

  var chunkSum = fileObj.chunkSum || 1; // Add fileObj to tracker collection

  tracker.upsert(selector, {
    $setOnInsert: {
      keys: {}
    }
  }); // Determine how we're using the writeStream

  var isOnePart = false,
      isMultiPart = false,
      isStoreSync = false,
      chunkNum = 0;

  if (options === +options) {
    isMultiPart = true;
    chunkNum = options;
  } else if (options === '' + options) {
    isStoreSync = true;
  } else {
    isOnePart = true;
  } // XXX: it should be possible for a store to sync by storing data into the
  // tempstore - this could be done nicely by setting the store name as string
  // in the chunk variable?
  // This store name could be passed on the the fileworker via the uploaded
  // event
  // So the uploaded event can return:
  // undefined - if data is stored into and should sync out to all storage adapters
  // number - if a chunk has been uploaded
  // string - if a storage adapter wants to sync its data to the other SA's
  // Find a nice location for the chunk data


  var fileKey = _fileReference(fileObj, chunkNum); // Create the stream as Meteor safe stream


  var writeStream = FS.TempStore.Storage.adapter.createWriteStream(fileKey); // When the stream closes we update the chunkCount

  writeStream.safeOn('stored', function (result) {
    // Save key in tracker document
    var setObj = {};
    setObj['keys.' + chunkNum] = result.fileKey;
    tracker.update(selector, {
      $set: setObj
    });
    var temp = tracker.findOne(selector);

    if (!temp) {
      FS.debug && console.log('NOT FOUND FROM TEMPSTORE => EXIT (REMOVED)');
      return;
    } // Get updated chunkCount


    var chunkCount = FS.Utility.size(temp.keys); // Progress

    self.emit('progress', fileObj, chunkNum, chunkCount, chunkSum, result);
    var modifier = {
      $set: {}
    };

    if (!fileObj.instance_id) {
      modifier.$set.instance_id = process.env.COLLECTIONFS_ENV_NAME_UNIQUE_ID ? process.env[process.env.COLLECTIONFS_ENV_NAME_UNIQUE_ID] : process.env.METEOR_PARENT_PID;
    } // If upload is completed


    if (chunkCount === chunkSum) {
      // We no longer need the chunk info
      modifier.$unset = {
        chunkCount: 1,
        chunkSum: 1,
        chunkSize: 1
      }; // Check if the file has been uploaded before

      if (typeof fileObj.uploadedAt === 'undefined') {
        // We set the uploadedAt date
        modifier.$set.uploadedAt = new Date();
      } else {
        // We have been uploaded so an event were file data is updated is
        // called synchronizing - so this must be a synchronizedAt?
        modifier.$set.synchronizedAt = new Date();
      } // Update the fileObject


      fileObj.update(modifier); // Fire ending events

      var eventName = isStoreSync ? 'synchronized' : 'stored';
      self.emit(eventName, fileObj, result); // XXX is emitting "ready" necessary?

      self.emit('ready', fileObj, chunkCount, result);
    } else {
      // Update the chunkCount on the fileObject
      modifier.$set.chunkCount = chunkCount;
      fileObj.update(modifier);
    }
  }); // Emit errors

  writeStream.on('error', function (error) {
    FS.debug && console.log('TempStore writeStream error:', error);
    self.emit('error', error, fileObj);
  });
  return writeStream;
};
/**
  * @method FS.TempStore.createReadStream
  * @public
  * @param {FS.File} fileObj The file to read
  * @return {Stream} Returns readable stream
  *
  */


FS.TempStore.createReadStream = function (fileObj) {
  // Ensure that we have a storage adapter mounted; if not, throw an error.
  mountStorage(); // If fileObj is not mounted or can't be, throw an error

  mountFile(fileObj, 'FS.TempStore.createReadStream');
  FS.debug && console.log('FS.TempStore creating read stream for ' + fileObj._id); // Determine how many total chunks there are from the tracker collection

  var chunkInfo = tracker.findOne({
    fileId: fileObj._id,
    collectionName: fileObj.collectionName
  }) || {};
  var totalChunks = FS.Utility.size(chunkInfo.keys);

  function getNextStreamFunc(chunk) {
    return Meteor.bindEnvironment(function (next) {
      var fileKey = _fileReference(fileObj, chunk);

      var chunkReadStream = FS.TempStore.Storage.adapter.createReadStream(fileKey);
      next(chunkReadStream);
    }, function (error) {
      throw error;
    });
  } // Make a combined stream


  var combinedStream = CombinedStream.create(); // Add each chunk stream to the combined stream when the previous chunk stream ends

  var currentChunk = 0;

  for (var chunk = 0; chunk < totalChunks; chunk++) {
    combinedStream.append(getNextStreamFunc(chunk));
  } // Return the combined stream


  return combinedStream;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
require("/node_modules/meteor/cfs:tempstore/tempStore.js");

/* Exports */
Package._define("cfs:tempstore");

})();

//# sourceURL=meteor://💻app/packages/cfs_tempstore.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvY2ZzOnRlbXBzdG9yZS90ZW1wU3RvcmUuanMiXSwibmFtZXMiOlsiRXZlbnRFbWl0dGVyIiwiTnBtIiwicmVxdWlyZSIsIkNvbWJpbmVkU3RyZWFtIiwiRlMiLCJUZW1wU3RvcmUiLCJ0cmFja2VyIiwiVHJhY2tlciIsIk1vbmdvIiwiQ29sbGVjdGlvbiIsIlN0b3JhZ2UiLCJtb3VudFN0b3JhZ2UiLCJQYWNrYWdlIiwiU3RvcmUiLCJHcmlkRlMiLCJpbnRlcm5hbCIsIkZpbGVTeXN0ZW0iLCJFcnJvciIsImRlYnVnIiwiY29uc29sZSIsImxvZyIsInR5cGVOYW1lIiwibW91bnRGaWxlIiwiZmlsZU9iaiIsIm5hbWUiLCJpc01vdW50ZWQiLCJvbiIsImNodW5rTnVtIiwiY291bnQiLCJ0b3RhbCIsInJlc3VsdCIsIl9jaHVua1BhdGgiLCJuIiwiX2ZpbGVSZWZlcmVuY2UiLCJjaHVuayIsImV4aXN0aW5nIiwiZmluZE9uZSIsImZpbGVJZCIsIl9pZCIsImNvbGxlY3Rpb25OYW1lIiwidGVtcEZpbGVPYmoiLCJGaWxlIiwib3JpZ2luYWwiLCJjb3BpZXMiLCJfdGVtcHN0b3JlIiwia2V5Iiwia2V5cyIsImFkYXB0ZXIiLCJmaWxlS2V5IiwiZXhpc3RzIiwibGlzdFBhcnRzIiwiZnNUZW1wU3RvcmVMaXN0UGFydHMiLCJzZWxmIiwid2FybiIsInJlbW92ZUZpbGUiLCJmc1RlbXBTdG9yZVJlbW92ZUZpbGUiLCJlbWl0IiwiY2h1bmtJbmZvIiwiVXRpbGl0eSIsImVhY2giLCJyZW1vdmUiLCJub29wIiwicmVtb3ZlQWxsIiwiZnNUZW1wU3RvcmVSZW1vdmVBbGwiLCJmaW5kIiwiZm9yRWFjaCIsImNyZWF0ZVdyaXRlU3RyZWFtIiwib3B0aW9ucyIsInNlbGVjdG9yIiwiY2h1bmtTdW0iLCJ1cHNlcnQiLCIkc2V0T25JbnNlcnQiLCJpc09uZVBhcnQiLCJpc011bHRpUGFydCIsImlzU3RvcmVTeW5jIiwid3JpdGVTdHJlYW0iLCJzYWZlT24iLCJzZXRPYmoiLCJ1cGRhdGUiLCIkc2V0IiwidGVtcCIsImNodW5rQ291bnQiLCJzaXplIiwibW9kaWZpZXIiLCJpbnN0YW5jZV9pZCIsInByb2Nlc3MiLCJlbnYiLCJDT0xMRUNUSU9ORlNfRU5WX05BTUVfVU5JUVVFX0lEIiwiTUVURU9SX1BBUkVOVF9QSUQiLCIkdW5zZXQiLCJjaHVua1NpemUiLCJ1cGxvYWRlZEF0IiwiRGF0ZSIsInN5bmNocm9uaXplZEF0IiwiZXZlbnROYW1lIiwiZXJyb3IiLCJjcmVhdGVSZWFkU3RyZWFtIiwidG90YWxDaHVua3MiLCJnZXROZXh0U3RyZWFtRnVuYyIsIk1ldGVvciIsImJpbmRFbnZpcm9ubWVudCIsIm5leHQiLCJjaHVua1JlYWRTdHJlYW0iLCJjb21iaW5lZFN0cmVhbSIsImNyZWF0ZSIsImN1cnJlbnRDaHVuayIsImFwcGVuZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBLElBQUlBLGVBQWVDLElBQUlDLE9BQUosQ0FBWSxRQUFaLEVBQXNCRixZQUF6QyxDLENBRUE7OztBQUNBLElBQUlHLGlCQUFpQkYsSUFBSUMsT0FBSixDQUFZLGlCQUFaLENBQXJCO0FBRUE7Ozs7Ozs7O0FBTUFFLEdBQUdDLFNBQUgsR0FBZSxJQUFJTCxZQUFKLEVBQWYsQyxDQUVBOztBQUNBLElBQUlNLFVBQVVGLEdBQUdDLFNBQUgsQ0FBYUUsT0FBYixHQUF1QixJQUFJQyxNQUFNQyxVQUFWLENBQXFCLHVCQUFyQixDQUFyQztBQUVBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBcUJBTCxHQUFHQyxTQUFILENBQWFLLE9BQWIsR0FBdUIsSUFBdkIsQyxDQUVBO0FBQ0E7QUFDQTs7QUFDQSxTQUFTQyxZQUFULEdBQXdCO0FBRXRCLE1BQUlQLEdBQUdDLFNBQUgsQ0FBYUssT0FBakIsRUFB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QixDQUFkOztBQUNBLFVBQUlvRSxrQkFBa0JsRyxHQUFHQyxTQUFILENBQWFLLE9BQWIsQ0FBcUJxQyxPQUFyQixDQUE2QmlELGdCQUE3QixDQUE4Q2hELE9BQTlDLENBQXRCO0FBQ0FxRCxXQUFLQyxlQUFMO0FBQ0QsS0FKTSxFQUlKLFVBQVVQLEtBQVYsRUFBaUI7QUFDbEIsWUFBTUEsS0FBTjtBQUNELEtBTk0sQ0FBUDtBQU9ELEdBckIrQyxDQXVCaEQ7OztBQUNBLE1BQUlRLGlCQUFpQnBHLGVBQWVxRyxNQUFmLEVBQXJCLENBeEJnRCxDQTBCaEQ7O0FBQ0EsTUFBSUMsZUFBZSxDQUFuQjs7QUFDQSxPQUFLLElBQUl2RSxRQUFRLENBQWpCLEVBQW9CQSxRQUFRK0QsV0FBNUIsRUFBeUMvRCxPQUF6QyxFQUFrRDtBQUNoRHFFLG1CQUFlRyxNQUFmLENBQXNCUixrQkFBa0JoRSxLQUFsQixDQUF0QjtBQUNELEdBOUIrQyxDQWdDaEQ7OztBQUNBLFNBQU9xRSxjQUFQO0FBQ0QsQ0FsQ0QsQyIsImZpbGUiOiIvcGFja2FnZXMvY2ZzX3RlbXBzdG9yZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vICMjVGVtcG9yYXJ5IFN0b3JhZ2Vcbi8vXG4vLyBUZW1wb3Jhcnkgc3RvcmFnZSBpcyB1c2VkIGZvciBjaHVua2VkIHVwbG9hZHMgdW50aWwgYWxsIGNodW5rcyBhcmUgcmVjZWl2ZWRcbi8vIGFuZCBhbGwgY29waWVzIGhhdmUgYmVlbiBtYWRlIG9yIGdpdmVuIHVwLiBJbiBzb21lIGNhc2VzLCB0aGUgb3JpZ2luYWwgZmlsZVxuLy8gaXMgc3RvcmVkIG9ubHkgaW4gdGVtcG9yYXJ5IHN0b3JhZ2UgKGZvciBleGFtcGxlLCBpZiBhbGwgY29waWVzIGRvIHNvbWVcbi8vIG1hbmlwdWxhdGlvbiBpbiBiZWZvcmVTYXZlKS4gVGhpcyBpcyB3aHkgd2UgdXNlIHRoZSB0ZW1wb3JhcnkgZmlsZSBhcyB0aGVcbi8vIGJhc2lzIGZvciBlYWNoIHNhdmVkIGNvcHksIGFuZCB0aGVuIHJlbW92ZSBpdCBhZnRlciBhbGwgY29waWVzIGFyZSBzYXZlZC5cbi8vXG4vLyBFdmVyeSBjaHVuayBpcyBzYXZlZCBhcyBhbiBpbmRpdmlkdWFsIHRlbXBvcmFyeSBmaWxlLiBUaGlzIGlzIHNhZmVyIHRoYW5cbi8vIGF0dGVtcHRpbmcgdG8gd3JpdGUgbXVsdGlwbGUgaW5jb21pbmcgY2h1bmtzIHRvIGRpZmZlcmVudCBwb3NpdGlvbnMgaW4gYVxuLy8gc2luZ2xlIHRlbXBvcmFyeSBmaWxlLCB3aGljaCBjYW4gbGVhZCB0byB3cml0ZSBjb25mbGljdHMuXG4vL1xuLy8gVXNpbmcgdGVtcCBmaWxlcyBhbHNvIGFsbG93cyB1cyB0byBlYXNpbHkgcmVzdW1lIHVwbG9hZHMsIGV2ZW4gaWYgdGhlIHNlcnZlclxuLy8gcmVzdGFydHMsIGFuZCB0byBrZWVwIHRoZSB3b3JraW5nIG1lbW9yeSBjbGVhci5cblxuLy8gVGhlIEZTLlRlbXBTdG9yZSBlbWl0cyBldmVudHMgdGhhdCBvdGhlcnMgYXJlIGFibGUgdG8gbGlzdGVuIHRvXG52YXIgRXZlbnRFbWl0dGVyID0gTnBtLnJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcjtcblxuLy8gV2UgaGF2ZSBhIHNwZWNpYWwgc3RyZWFtIGNvbmNhdGluZyBhbGwgY2h1bmsgZmlsZXMgaW50byBvbmUgcmVhZGFibGUgc3RyZWFtXG52YXIgQ29tYmluZWRTdHJlYW0gPSBOcG0ucmVxdWlyZSgnY29tYmluZWQtc3RyZWFtJyk7XG5cbi8qKiBAbmFtZXNwYWNlIEZTLlRlbXBTdG9yZVxuICogQHByb3BlcnR5IEZTLlRlbXBTdG9yZVxuICogQHR5cGUge29iamVjdH1cbiAqIEBwdWJsaWNcbiAqIEBzdW1tYXJ5IEFuIGV2ZW50IGVtaXR0ZXJcbiAqL1xuRlMuVGVtcFN0b3JlID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4vLyBDcmVhdGUgYSB0cmFja2VyIGNvbGxlY3Rpb24gZm9yIGtlZXBpbmcgdHJhY2sgb2YgYWxsIGNodW5rcyBmb3IgYW55IGZpbGVzIHRoYXQgYXJlIGN1cnJlbnRseSBpbiB0aGUgdGVtcCBzdG9yZVxudmFyIHRyYWNrZXIgPSBGUy5UZW1wU3RvcmUuVHJhY2tlciA9IG5ldyBNb25nby5Db2xsZWN0aW9uKCdjZnMuX3RlbXBzdG9yZS5jaHVua3MnKTtcblxuLyoqXG4gKiBAcHJvcGVydHkgRlMuVGVtcFN0b3JlLlN0b3JhZ2VcbiAqIEB0eXBlIHtTdG9yYWdlQWRhcHRlcn1cbiAqIEBuYW1lc3BhY2UgRlMuVGVtcFN0b3JlXG4gKiBAcHJpdmF0ZVxuICogQHN1bW1hcnkgVGhpcyBwcm9wZXJ0eSBpcyBzZXQgdG8gZWl0aGVyIGBGUy5TdG9yZS5GaWxlU3lzdGVtYCBvciBgRlMuU3RvcmUuR3JpZEZTYFxuICpcbiAqIF9fV2hlbiBhbmQgd2h5Ol9fXG4gKiBXZSBub3JtYWxseSBkZWZhdWx0IHRvIGBjZnMtZmlsZXN5c3RlbWAgdW5sZXNzIGl0cyBub3QgaW5zdGFsbGVkLiAqKHdlIGRlZmF1bHQgdG8gZ3JpZGZzIGlmIGluc3RhbGxlZCkqXG4gKiBCdXQgaWYgYGNmcy1ncmlkZnNgIGFuZCBgY2ZzLXdvcmtlcmAgaXMgaW5zdGFsbGVkIHdlIGRlZmF1bHQgdG8gYGNmcy1ncmlkZnNgXG4gKlxuICogSWYgYGNmcy1ncmlkZnNgIGFuZCBgY2ZzLWZpbGVzeXN0ZW1gIGlzIG5vdCBpbnN0YWxsZWQgd2UgbG9nIGEgd2FybmluZy5cbiAqIHRoZSB1c2VyIGNhbiBzZXQgYEZTLlRlbXBTdG9yZS5TdG9yYWdlYCB0aGVtIHNlbGZzIGVnLjpcbiAqIGBgYGpzXG4gKiAgIC8vIEl0cyBpbXBvcnRhbnQgdG8gc2V0IGBpbnRlcm5hbDogdHJ1ZWAgdGhpcyBsZXRzIHRoZSBTQSBrbm93IHRoYXQgd2VcbiAqICAgLy8gYXJlIHVzaW5nIHRoaXMgaW50ZXJuYWxseSBhbmQgaXQgd2lsbCBnaXZlIHVzIGRpcmVjdCBTQSBhcGlcbiAqICAgRlMuVGVtcFN0b3JlLlN0b3JhZ2UgPSBuZXcgRlMuU3RvcmUuR3JpZEZTKCdfdGVtcHN0b3JlJywgeyBpbnRlcm5hbDogdHJ1ZSB9KTtcbiAqIGBgYFxuICpcbiAqID4gTm90ZTogVGhpcyBpcyBjb25zaWRlcmVkIGFzIGBhZHZhbmNlZGAgdXNlLCBpdHMgbm90IGEgY29tbW9uIHBhdHRlcm4uXG4gKi9cbkZTLlRlbXBTdG9yZS5TdG9yYWdlID0gbnVsbDtcblxuLy8gV2Ugd2lsbCBub3QgbW91bnQgYSBzdG9yYWdlIGFkYXB0ZXIgdW50aWwgbmVlZGVkLiBUaGlzIGFsbG93cyB1cyB0byBjaGVjayBmb3IgdGhlXG4vLyBleGlzdGFuY2Ugb2YgRlMuRmlsZVdvcmtlciwgd2hpY2ggaXMgbG9hZGVkIGFmdGVyIHRoaXMgcGFja2FnZSBiZWNhdXNlIGl0XG4vLyBkZXBlbmRzIG9uIHRoaXMgcGFja2FnZS5cbmZ1bmN0aW9uIG1vdW50U3RvcmFnZSgpIHtcblxuICBpZiAoRlMuVGVtcFN0b3JlLlN0b3JhZ2UpIHJldHVybjtcblxuICAvLyBYWFg6IFdlIGNvdWxkIHJlcGxhY2UgdGhpcyB0ZXN0LCB0ZXN0aW5nIHRoZSBGUyBzY29wZSBmb3IgZ3JpZkZTIGV0Yy5cbiAgLy8gVGhpcyBpcyBvbiB0aGUgdG9kbyBsYXRlciB3aGVuIHdlIGdldCBcInN0YWJsZVwiXG4gIGlmIChQYWNrYWdlW1wiY2ZzOmdyaWRmc1wiXSAmJiAoUGFja2FnZVtcImNmczp3b3JrZXJcIl0gfHwgIVBhY2thZ2VbXCJjZnM6ZmlsZXN5c3RlbVwiXSkpIHtcbiAgICAvLyBJZiB0aGUgZmlsZSB3b3JrZXIgaXMgaW5zdGFsbGVkIHdlIHdvdWxkIHByZWZlciB0byB1c2UgdGhlIGdyaWRmcyBzYVxuICAgIC8vIGZvciBzY2FsYWJpbGl0eS4gV2UgYWxzbyBkZWZhdWx0IHRvIGdyaWRmcyBpZiBmaWxlc3lzdGVtIGlzIG5vdCBmb3VuZFxuXG4gICAgLy8gVXNlIHRoZSBncmlkZnNcbiAgICBGUy5UZW1wU3RvcmUuU3RvcmFnZSA9IG5ldyBGUy5TdG9yZS5HcmlkRlMoJ190ZW1wc3RvcmUnLCB7IGludGVybmFsOiB0cnVlIH0pO1xuICB9IGVsc2UgaWYgKFBhY2thZ2VbXCJjZnM6ZmlsZXN5c3RlbVwiXSkge1xuXG4gICAgLy8gdXNlIHRoZSBGaWxlc3lzdGVtXG4gICAgRlMuVGVtcFN0b3JlLlN0b3JhZ2UgPSBuZXcgRlMuU3RvcmUuRmlsZVN5c3RlbSgnX3RlbXBzdG9yZScsIHsgaW50ZXJuYWw6IHRydWUgfSk7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdGUy5UZW1wU3RvcmUuU3RvcmFnZSBpcyBub3Qgc2V0OiBJbnN0YWxsIGNmczpmaWxlc3lzdGVtIG9yIGNmczpncmlkZnMgb3Igc2V0IGl0IG1hbnVhbGx5Jyk7XG4gIH1cblxuICBGUy5kZWJ1ZyAmJiBjb25zb2xlLmxvZygnVGVtcFN0b3JlIGlzIG1vdW50ZWQgb24nLCBGUy5UZW1wU3RvcmUuU3RvcmFnZS50eXBlTmFtZSk7XG59XG5cbmZ1bmN0aW9uIG1vdW50RmlsZShmaWxlT2JqLCBuYW1lKSB7XG4gIGlmICghZmlsZU9iai5pc01vdW50ZWQoKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihuYW1lICsgJyBjYW5ub3Qgd29yayB3aXRoIHVubW91bnRlZCBmaWxlJyk7XG4gIH1cbn1cblxuLy8gV2UgdXBkYXRlIHRoZSBmaWxlT2JqIG9uIHByb2dyZXNzXG5GUy5UZW1wU3RvcmUub24oJ3Byb2dyZXNzJywgZnVuY3Rpb24oZmlsZU9iaiwgY2h1bmtOdW0sIGNvdW50LCB0b3RhbCwgcmVzdWx0KSB7XG4gIEZTLmRlYnVnICYmIGNvbnNvbGUubG9nKCdUZW1wU3RvcmUgcHJvZ3Jlc3M6IFJlY2VpdmVkICcgKyBjb3VudCArICcgb2YgJyArIHRvdGFsICsgJyBjaHVua3MgZm9yICcgKyBmaWxlT2JqLm5hbWUoKSk7XG59KTtcblxuLy8gWFhYOiBUT0RPXG4vLyBGUy5UZW1wU3RvcmUub24oJ3N0b3JlZCcsIGZ1bmN0aW9uKGZpbGVPYmosIGNodW5rQ291bnQsIHJlc3VsdCkge1xuLy8gICAvLyBUaGlzIHNob3VsZCB3b3JrIGlmIHdlIHBhc3Mgb24gcmVzdWx0IGZyb20gdGhlIFNBIG9uIHN0b3JlZCBldmVudC4uLlxuLy8gICBmaWxlT2JqLnVwZGF0ZSh7ICRzZXQ6IHsgY2h1bmtTdW06IDEsIGNodW5rQ291bnQ6IGNodW5rQ291bnQsIHNpemU6IHJlc3VsdC5zaXplIH0gfSk7XG4vLyB9KTtcblxuLy8gU3RyZWFtIGltcGxlbWVudGF0aW9uXG5cbi8qKlxuICogQG1ldGhvZCBfY2h1bmtQYXRoXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtOdW1iZXJ9IFtuXSBDaHVuayBudW1iZXJcbiAqIEByZXR1cm5zIHtTdHJpbmd9IENodW5rIG5hbWluZyBjb252ZW50aW9uXG4gKi9cbl9jaHVua1BhdGggPSBmdW5jdGlvbihuKSB7XG4gIHJldHVybiAobiB8fCAwKSArICcuY2h1bmsnO1xufTtcblxuLyoqXG4gKiBAbWV0aG9kIF9maWxlUmVmZXJlbmNlXG4gKiBAcGFyYW0ge0ZTLkZpbGV9IGZpbGVPYmpcbiAqIEBwYXJhbSB7TnVtYmVyfSBjaHVua1xuICogQHByaXZhdGVcbiAqIEByZXR1cm5zIHtTdHJpbmd9IEdlbmVyYXRlZCBTQSBzcGVjaWZpYyBmaWxlS2V5IGZvciB0aGUgY2h1bmtcbiAqXG4gKiBOb3RlOiBDYWxsaW5nIGZ1bmN0aW9uIHNob3VsZCBjYWxsIG1vdW50U3RvcmFnZSgpIGZpcnN0LCBhbmRcbiAqIG1ha2Ugc3VyZSB0aGF0IGZpbGVPYmogaXMgbW91bnRlZC5cbiAqL1xuX2ZpbGVSZWZlcmVuY2UgPSBmdW5jdGlvbihmaWxlT2JqLCBjaHVuaywgZXhpc3RpbmcpIHtcbiAgLy8gTWF5YmUgaXQncyBhIGNodW5rIHdlJ3ZlIGFscmVhZHkgc2F2ZWRcbiAgZXhpc3RpbmcgPSBleGlzdGluZyB8fCB0cmFja2VyLmZpbmRPbmUoe2ZpbGVJZDogZmlsZU9iai5faWQsIGNvbGxlY3Rpb25OYW1lOiBmaWxlT2JqLmNvbGxlY3Rpb25OYW1lfSk7XG5cbiAgLy8gTWFrZSBhIHRlbXBvcmFyeSBmaWxlT2JqIGp1c3QgZm9yIGZpbGVLZXkgZ2VuZXJhdGlvblxuICB2YXIgdGVtcEZpbGVPYmogPSBuZXcgRlMuRmlsZSh7XG4gICAgY29sbGVjdGlvbk5hbWU6IGZpbGVPYmouY29sbGVjdGlvbk5hbWUsXG4gICAgX2lkOiBmaWxlT2JqLl9pZCxcbiAgICBvcmlnaW5hbDoge1xuICAgICAgbmFtZTogX2NodW5rUGF0aChjaHVuaylcbiAgICB9LFxuICAgIGNvcGllczoge1xuICAgICAgX3RlbXBzdG9yZToge1xuICAgICAgICBrZXk6IGV4aXN0aW5nICYmIGV4aXN0aW5nLmtleXNbY2h1bmtdXG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICAvLyBSZXR1cm4gYSBmaXR0aW5nIGZpbGVLZXkgU0Egc3BlY2lmaWNcbiAgcmV0dXJuIEZTLlRlbXBTdG9yZS5TdG9yYWdlLmFkYXB0ZXIuZmlsZUtleSh0ZW1wRmlsZU9iaik7XG59O1xuXG4vKipcbiAqIEBtZXRob2QgRlMuVGVtcFN0b3JlLmV4aXN0c1xuICogQHBhcmFtIHtGUy5GaWxlfSBGaWxlIG9iamVjdFxuICogQHJldHVybnMge0Jvb2xlYW59IElzIHRoaXMgZmlsZSwgb3IgcGFydHMgb2YgaXQsIGN1cnJlbnRseSBzdG9yZWQgaW4gdGhlIFRlbXBTdG9yZVxuICovXG5GUy5UZW1wU3RvcmUuZXhpc3RzID0gZnVuY3Rpb24oZmlsZU9iaikge1xuICB2YXIgZXhpc3RpbmcgPSB0cmFja2VyLmZpbmRPbmUoe2ZpbGVJZDogZmlsZU9iai5faWQsIGNvbGxlY3Rpb25OYW1lOiBmaWxlT2JqLmNvbGxlY3Rpb25OYW1lfSk7XG4gIHJldHVybiAhIWV4aXN0aW5nO1xufTtcblxuLyoqXG4gKiBAbWV0aG9kIEZTLlRlbXBTdG9yZS5saXN0UGFydHNcbiAqIEBwYXJhbSB7RlMuRmlsZX0gZmlsZU9ialxuICogQHJldHVybnMge09iamVjdH0gb2YgcGFydHMgYWxyZWFkeSBzdG9yZWRcbiAqIEB0b2RvIFRoaXMgaXMgbm90IHlldCBpbXBsZW1lbnRlZCwgbWlsZXN0b25lIDEuMS4wXG4gKi9cbkZTLlRlbXBTdG9yZS5saXN0UGFydHMgPSBmdW5jdGlvbiBmc1RlbXBTdG9yZUxpc3RQYXJ0cyhmaWxlT2JqKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgY29uc29sZS53YXJuKCdUaGlzIGZ1bmN0aW9uIGlzIG5vdCBjb3JyZWN0bHkgaW1wbGVtZW50ZWQgdXNpbmcgU0EgaW4gVGVtcFN0b3JlJyk7XG4gIC8vWFhYIFRoaXMgZnVuY3Rpb24gbWlnaHQgYmUgbmVjZXNzYXJ5IGZvciByZXN1bWUuIE5vdCBjdXJyZW50bHkgc3VwcG9ydGVkLlxufTtcblxuLyoqXG4gKiBAbWV0aG9kIEZTLlRlbXBTdG9yZS5yZW1vdmVGaWxlXG4gKiBAcHVibGljXG4gKiBAcGFyYW0ge0ZTLkZpbGV9IGZpbGVPYmpcbiAqIFRoaXMgZnVuY3Rpb24gcmVtb3ZlcyB0aGUgZmlsZSBmcm9tIHRlbXBzdG9yYWdlIC0gaXQgY2FyZXMgbm90IGlmIGZpbGUgaXNcbiAqIGFscmVhZHkgcmVtb3ZlZCBvciBub3QgZm91bmQsIGdvYWwgaXMgcmVhY2hlZCBhbnl3YXkuXG4gKi9cbkZTLlRlbXBTdG9yZS5yZW1vdmVGaWxlID0gZnVuY3Rpb24gZnNUZW1wU3RvcmVSZW1vdmVGaWxlKGZpbGVPYmopIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIC8vIEVuc3VyZSB0aGF0IHdlIGhhdmUgYSBzdG9yYWdlIGFkYXB0ZXIgbW91bnRlZDsgaWYgbm90LCB0aHJvdyBhbiBlcnJvci5cbiAgbW91bnRTdG9yYWdlKCk7XG5cbiAgLy8gSWYgZmlsZU9iaiBpcyBub3QgbW91bnRlZCBvciBjYW4ndCBiZSwgdGhyb3cgYW4gZXJyb3JcbiAgbW91bnRGaWxlKGZpbGVPYmosICdGUy5UZW1wU3RvcmUucmVtb3ZlRmlsZScpO1xuXG4gIC8vIEVtaXQgZXZlbnRcbiAgc2VsZi5lbWl0KCdyZW1vdmUnLCBmaWxlT2JqKTtcblxuICB2YXIgY2h1bmtJbmZvID0gdHJhY2tlci5maW5kT25lKHtcbiAgICBmaWxlSWQ6IGZpbGVPYmouX2lkLFxuICAgIGNvbGxlY3Rpb25OYW1lOiBmaWxlT2JqLmNvbGxlY3Rpb25OYW1lXG4gIH0pO1xuXG4gIGlmIChjaHVua0luZm8pIHtcblxuICAgIC8vIFVubGluayBlYWNoIGZpbGVcbiAgICBGUy5VdGlsaXR5LmVhY2goY2h1bmtJbmZvLmtleXMgfHwge30sIGZ1bmN0aW9uIChrZXksIGNodW5rKSB7XG4gICAgICB2YXIgZmlsZUtleSA9IF9maWxlUmVmZXJlbmNlKGZpbGVPYmosIGNodW5rLCBjaHVua0luZm8pO1xuICAgICAgRlMuVGVtcFN0b3JlLlN0b3JhZ2UuYWRhcHRlci5yZW1vdmUoZmlsZUtleSwgRlMuVXRpbGl0eS5ub29wKTtcbiAgICB9KTtcblxuICAgIC8vIFJlbW92ZSBmaWxlT2JqIGZyb20gdHJhY2tlciBjb2xsZWN0aW9uLCB0b29cbiAgICB0cmFja2VyLnJlbW92ZSh7X2lkOiBjaHVua0luZm8uX2lkfSk7XG5cbiAgfVxufTtcblxuLyoqXG4gKiBAbWV0aG9kIEZTLlRlbXBTdG9yZS5yZW1vdmVBbGxcbiAqIEBwdWJsaWNcbiAqIEBzdW1tYXJ5IFRoaXMgZnVuY3Rpb24gcmVtb3ZlcyBhbGwgZmlsZXMgZnJvbSB0ZW1wc3RvcmFnZSAtIGl0IGNhcmVzIG5vdCBpZiBmaWxlIGlzXG4gKiBhbHJlYWR5IHJlbW92ZWQgb3Igbm90IGZvdW5kLCBnb2FsIGlzIHJlYWNoZWQgYW55d2F5LlxuICovXG5GUy5UZW1wU3RvcmUucmVtb3ZlQWxsID0gZnVuY3Rpb24gZnNUZW1wU3RvcmVSZW1vdmVBbGwoKSB7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICAvLyBFbnN1cmUgdGhhdCB3ZSBoYXZlIGEgc3RvcmFnZSBhZGFwdGVyIG1vdW50ZWQ7IGlmIG5vdCwgdGhyb3cgYW4gZXJyb3IuXG4gIG1vdW50U3RvcmFnZSgpO1xuXG4gIHRyYWNrZXIuZmluZCgpLmZvckVhY2goZnVuY3Rpb24gKGNodW5rSW5mbykge1xuICAgIC8vIFVubGluayBlYWNoIGZpbGVcbiAgICBGUy5VdGlsaXR5LmVhY2goY2h1bmtJbmZvLmtleXMgfHwge30sIGZ1bmN0aW9uIChrZXksIGNodW5rKSB7XG4gICAgICB2YXIgZmlsZUtleSA9IF9maWxlUmVmZXJlbmNlKHtfaWQ6IGNodW5rSW5mby5maWxlSWQsIGNvbGxlY3Rpb25OYW1lOiBjaHVua0luZm8uY29sbGVjdGlvbk5hbWV9LCBjaHVuaywgY2h1bmtJbmZvKTtcbiAgICAgIEZTLlRlbXBTdG9yZS5TdG9yYWdlLmFkYXB0ZXIucmVtb3ZlKGZpbGVLZXksIEZTLlV0aWxpdHkubm9vcCk7XG4gICAgfSk7XG5cbiAgICAvLyBSZW1vdmUgZnJvbSB0cmFja2VyIGNvbGxlY3Rpb24sIHRvb1xuICAgIHRyYWNrZXIucmVtb3ZlKHtfaWQ6IGNodW5rSW5mby5faWR9KTtcbiAgfSk7XG59O1xuXG4vKipcbiAqIEBtZXRob2QgRlMuVGVtcFN0b3JlLmNyZWF0ZVdyaXRlU3RyZWFtXG4gKiBAcHVibGljXG4gKiBAcGFyYW0ge0ZTLkZpbGV9IGZpbGVPYmogRmlsZSB0byBzdG9yZSBpbiB0ZW1wb3Jhcnkgc3RvcmFnZVxuICogQHBhcmFtIHtOdW1iZXIgfCBTdHJpbmd9IFtvcHRpb25zXVxuICogQHJldHVybnMge1N0cmVhbX0gV3JpdGVhYmxlIHN0cmVhbVxuICpcbiAqIGBvcHRpb25zYCBvZiBkaWZmZXJlbnQgdHlwZXMgbWVhbiBkaWZmZXJudCB0aGluZ3M6XG4gKiAqIGB1bmRlZmluZWRgIFdlIHN0b3JlIHRoZSBmaWxlIGluIG9uZSBwYXJ0XG4gKiAqKE5vcm1hbCBzZXJ2ZXItc2lkZSBhcGkgdXNhZ2UpKlxuICogKiBgTnVtYmVyYCB0aGUgbnVtYmVyIGlzIHRoZSBwYXJ0IG51bWJlciB0b3RhbFxuICogKihtdWx0aXBhcnQgdXBsb2FkcyB3aWxsIHVzZSB0aGlzIGFwaSkqXG4gKiAqIGBTdHJpbmdgIHRoZSBzdHJpbmcgaXMgdGhlIG5hbWUgb2YgdGhlIGBzdG9yZWAgdGhhdCB3YW50cyB0byBzdG9yZSBmaWxlIGRhdGFcbiAqICooc3RvcmVzIHRoYXQgd2FudCB0byBzeW5jIHRoZWlyIGRhdGEgdG8gdGhlIHJlc3Qgb2YgdGhlIGZpbGVzIHN0b3JlcyB3aWxsIHVzZSB0aGlzKSpcbiAqXG4gKiA+IE5vdGU6IGZpbGVPYmogbXVzdCBiZSBtb3VudGVkIG9uIGEgYEZTLkNvbGxlY3Rpb25gLCBpdCBtYWtlcyBubyBzZW5zZSB0byBzdG9yZSBvdGhlcndpc2VcbiAqL1xuRlMuVGVtcFN0b3JlLmNyZWF0ZVdyaXRlU3RyZWFtID0gZnVuY3Rpb24oZmlsZU9iaiwgb3B0aW9ucykge1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgLy8gRW5zdXJlIHRoYXQgd2UgaGF2ZSBhIHN0b3JhZ2UgYWRhcHRlciBtb3VudGVkOyBpZiBub3QsIHRocm93IGFuIGVycm9yLlxuICBtb3VudFN0b3JhZ2UoKTtcblxuICAvLyBJZiBmaWxlT2JqIGlzIG5vdCBtb3VudGVkIG9yIGNhbid0IGJlLCB0aHJvdyBhbiBlcnJvclxuICBtb3VudEZpbGUoZmlsZU9iaiwgJ0ZTLlRlbXBTdG9yZS5jcmVhdGVXcml0ZVN0cmVhbScpO1xuXG4gIC8vIENhY2hlIHRoZSBzZWxlY3RvciBmb3IgdXNlIG11bHRpcGxlIHRpbWVzIGJlbG93XG4gIHZhciBzZWxlY3RvciA9IHtmaWxlSWQ6IGZpbGVPYmouX2lkLCBjb2xsZWN0aW9uTmFtZTogZmlsZU9iai5jb2xsZWN0aW9uTmFtZX07XG5cbiAgLy8gVE9ETywgc2hvdWxkIHBhc3MgaW4gY2h1bmtTdW0gc28gd2UgZG9uJ3QgbmVlZCB0byB1c2UgRlMuRmlsZSBmb3IgaXRcbiAgdmFyIGNodW5rU3VtID0gZmlsZU9iai5jaHVua1N1bSB8fCAxO1xuXG4gIC8vIEFkZCBmaWxlT2JqIHRvIHRyYWNrZXIgY29sbGVjdGlvblxuICB0cmFja2VyLnVwc2VydChzZWxlY3RvciwgeyRzZXRPbkluc2VydDoge2tleXM6IHt9fX0pO1xuXG4gIC8vIERldGVybWluZSBob3cgd2UncmUgdXNpbmcgdGhlIHdyaXRlU3RyZWFtXG4gIHZhciBpc09uZVBhcnQgPSBmYWxzZSwgaXNNdWx0aVBhcnQgPSBmYWxzZSwgaXNTdG9yZVN5bmMgPSBmYWxzZSwgY2h1bmtOdW0gPSAwO1xuICBpZiAob3B0aW9ucyA9PT0gK29wdGlvbnMpIHtcbiAgICBpc011bHRpUGFydCA9IHRydWU7XG4gICAgY2h1bmtOdW0gPSBvcHRpb25zO1xuICB9IGVsc2UgaWYgKG9wdGlvbnMgPT09ICcnK29wdGlvbnMpIHtcbiAgICBpc1N0b3JlU3luYyA9IHRydWU7XG4gIH0gZWxzZSB7XG4gICAgaXNPbmVQYXJ0ID0gdHJ1ZTtcbiAgfVxuXG4gIC8vIFhYWDogaXQgc2hvdWxkIGJlIHBvc3NpYmxlIGZvciBhIHN0b3JlIHRvIHN5bmMgYnkgc3RvcmluZyBkYXRhIGludG8gdGhlXG4gIC8vIHRlbXBzdG9yZSAtIHRoaXMgY291bGQgYmUgZG9uZSBuaWNlbHkgYnkgc2V0dGluZyB0aGUgc3RvcmUgbmFtZSBhcyBzdHJpbmdcbiAgLy8gaW4gdGhlIGNodW5rIHZhcmlhYmxlP1xuICAvLyBUaGlzIHN0b3JlIG5hbWUgY291bGQgYmUgcGFzc2VkIG9uIHRoZSB0aGUgZmlsZXdvcmtlciB2aWEgdGhlIHVwbG9hZGVkXG4gIC8vIGV2ZW50XG4gIC8vIFNvIHRoZSB1cGxvYWRlZCBldmVudCBjYW4gcmV0dXJuOlxuICAvLyB1bmRlZmluZWQgLSBpZiBkYXRhIGlzIHN0b3JlZCBpbnRvIGFuZCBzaG91bGQgc3luYyBvdXQgdG8gYWxsIHN0b3JhZ2UgYWRhcHRlcnNcbiAgLy8gbnVtYmVyIC0gaWYgYSBjaHVuayBoYXMgYmVlbiB1cGxvYWRlZFxuICAvLyBzdHJpbmcgLSBpZiBhIHN0b3JhZ2UgYWRhcHRlciB3YW50cyB0byBzeW5jIGl0cyBkYXRhIHRvIHRoZSBvdGhlciBTQSdzXG5cbiAgLy8gRmluZCBhIG5pY2UgbG9jYXRpb24gZm9yIHRoZSBjaHVuayBkYXRhXG4gIHZhciBmaWxlS2V5ID0gX2ZpbGVSZWZlcmVuY2UoZmlsZU9iaiwgY2h1bmtOdW0pO1xuXG4gIC8vIENyZWF0ZSB0aGUgc3RyZWFtIGFzIE1ldGVvciBzYWZlIHN0cmVhbVxuICB2YXIgd3JpdGVTdHJlYW0gPSBGUy5UZW1wU3RvcmUuU3RvcmFnZS5hZGFwdGVyLmNyZWF0ZVdyaXRlU3RyZWFtKGZpbGVLZXkpO1xuXG4gIC8vIFdoZW4gdGhlIHN0cmVhbSBjbG9zZXMgd2UgdXBkYXRlIHRoZSBjaHVua0NvdW50XG4gIHdyaXRlU3RyZWFtLnNhZmVPbignc3RvcmVkJywgZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgLy8gU2F2ZSBrZXkgaW4gdHJhY2tlciBkb2N1bWVudFxuICAgIHZhciBzZXRPYmogPSB7fTtcbiAgICBzZXRPYmpbJ2tleXMuJyArIGNodW5rTnVtXSA9IHJlc3VsdC5maWxlS2V5O1xuICAgIHRyYWNrZXIudXBkYXRlKHNlbGVjdG9yLCB7JHNldDogc2V0T2JqfSk7XG5cbiAgICB2YXIgdGVtcCA9IHRyYWNrZXIuZmluZE9uZShzZWxlY3Rvcik7XG5cbiAgICBpZiAoIXRlbXApIHtcbiAgICAgIEZTLmRlYnVnICYmIGNvbnNvbGUubG9nKCdOT1QgRk9VTkQgRlJPTSBURU1QU1RPUkUgPT4gRVhJVCAoUkVNT1ZFRCknKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBHZXQgdXBkYXRlZCBjaHVua0NvdW50XG4gICAgdmFyIGNodW5rQ291bnQgPSBGUy5VdGlsaXR5LnNpemUodGVtcC5rZXlzKTtcblxuICAgIC8vIFByb2dyZXNzXG4gICAgc2VsZi5lbWl0KCdwcm9ncmVzcycsIGZpbGVPYmosIGNodW5rTnVtLCBjaHVua0NvdW50LCBjaHVua1N1bSwgcmVzdWx0KTtcblxuICAgIHZhciBtb2RpZmllciA9IHsgJHNldDoge30gfTtcbiAgICBpZiAoIWZpbGVPYmouaW5zdGFuY2VfaWQpIHtcbiAgICAgIG1vZGlmaWVyLiRzZXQuaW5zdGFuY2VfaWQgPSBwcm9jZXNzLmVudi5DT0xMRUNUSU9ORlNfRU5WX05BTUVfVU5JUVVFX0lEID8gcHJvY2Vzcy5lbnZbcHJvY2Vzcy5lbnYuQ09MTEVDVElPTkZTX0VOVl9OQU1FX1VOSVFVRV9JRF0gOiBwcm9jZXNzLmVudi5NRVRFT1JfUEFSRU5UX1BJRDtcbiAgICB9XG5cbiAgICAvLyBJZiB1cGxvYWQgaXMgY29tcGxldGVkXG4gICAgaWYgKGNodW5rQ291bnQgPT09IGNodW5rU3VtKSB7XG4gICAgICAvLyBXZSBubyBsb25nZXIgbmVlZCB0aGUgY2h1bmsgaW5mb1xuICAgICAgbW9kaWZpZXIuJHVuc2V0ID0ge2NodW5rQ291bnQ6IDEsIGNodW5rU3VtOiAxLCBjaHVua1NpemU6IDF9O1xuXG4gICAgICAvLyBDaGVjayBpZiB0aGUgZmlsZSBoYXMgYmVlbiB1cGxvYWRlZCBiZWZvcmVcbiAgICAgIGlmICh0eXBlb2YgZmlsZU9iai51cGxvYWRlZEF0ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAvLyBXZSBzZXQgdGhlIHVwbG9hZGVkQXQgZGF0ZVxuICAgICAgICBtb2RpZmllci4kc2V0LnVwbG9hZGVkQXQgPSBuZXcgRGF0ZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gV2UgaGF2ZSBiZWVuIHVwbG9hZGVkIHNvIGFuIGV2ZW50IHdlcmUgZmlsZSBkYXRhIGlzIHVwZGF0ZWQgaXNcbiAgICAgICAgLy8gY2FsbGVkIHN5bmNocm9uaXppbmcgLSBzbyB0aGlzIG11c3QgYmUgYSBzeW5jaHJvbml6ZWRBdD9cbiAgICAgICAgbW9kaWZpZXIuJHNldC5zeW5jaHJvbml6ZWRBdCA9IG5ldyBEYXRlKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIFVwZGF0ZSB0aGUgZmlsZU9iamVjdFxuICAgICAgZmlsZU9iai51cGRhdGUobW9kaWZpZXIpO1xuXG4gICAgICAvLyBGaXJlIGVuZGluZyBldmVudHNcbiAgICAgIHZhciBldmVudE5hbWUgPSBpc1N0b3JlU3luYyA/ICdzeW5jaHJvbml6ZWQnIDogJ3N0b3JlZCc7XG4gICAgICBzZWxmLmVtaXQoZXZlbnROYW1lLCBmaWxlT2JqLCByZXN1bHQpO1xuXG4gICAgICAvLyBYWFggaXMgZW1pdHRpbmcgXCJyZWFkeVwiIG5lY2Vzc2FyeT9cbiAgICAgIHNlbGYuZW1pdCgncmVhZHknLCBmaWxlT2JqLCBjaHVua0NvdW50LCByZXN1bHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBVcGRhdGUgdGhlIGNodW5rQ291bnQgb24gdGhlIGZpbGVPYmplY3RcbiAgICAgIG1vZGlmaWVyLiRzZXQuY2h1bmtDb3VudCA9IGNodW5rQ291bnQ7XG4gICAgICBmaWxlT2JqLnVwZGF0ZShtb2RpZmllcik7XG4gICAgfVxuICB9KTtcblxuICAvLyBFbWl0IGVycm9yc1xuICB3cml0ZVN0cmVhbS5vbignZXJyb3InLCBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICBGUy5kZWJ1ZyAmJiBjb25zb2xlLmxvZygnVGVtcFN0b3JlIHdyaXRlU3RyZWFtIGVycm9yOicsIGVycm9yKTtcbiAgICBzZWxmLmVtaXQoJ2Vycm9yJywgZXJyb3IsIGZpbGVPYmopO1xuICB9KTtcblxuICByZXR1cm4gd3JpdGVTdHJlYW07XG59O1xuXG4vKipcbiAgKiBAbWV0aG9kIEZTLlRlbXBTdG9yZS5jcmVhdGVSZWFkU3RyZWFtXG4gICogQHB1YmxpY1xuICAqIEBwYXJhbSB7RlMuRmlsZX0gZmlsZU9iaiBUaGUgZmlsZSB0byByZWFkXG4gICogQHJldHVybiB7U3RyZWFtfSBSZXR1cm5zIHJlYWRhYmxlIHN0cmVhbVxuICAqXG4gICovXG5GUy5UZW1wU3RvcmUuY3JlYXRlUmVhZFN0cmVhbSA9IGZ1bmN0aW9uKGZpbGVPYmopIHtcbiAgLy8gRW5zdXJlIHRoYXQgd2UgaGF2ZSBhIHN0b3JhZ2UgYWRhcHRlciBtb3VudGVkOyBpZiBub3QsIHRocm93IGFuIGVycm9yLlxuICBtb3VudFN0b3JhZ2UoKTtcblxuICAvLyBJZiBmaWxlT2JqIGlzIG5vdCBtb3VudGVkIG9yIGNhbid0IGJlLCB0aHJvdyBhbiBlcnJvclxuICBtb3VudEZpbGUoZmlsZU9iaiwgJ0ZTLlRlbXBTdG9yZS5jcmVhdGVSZWFkU3RyZWFtJyk7XG5cbiAgRlMuZGVidWcgJiYgY29uc29sZS5sb2coJ0ZTLlRlbXBTdG9yZSBjcmVhdGluZyByZWFkIHN0cmVhbSBmb3IgJyArIGZpbGVPYmouX2lkKTtcblxuICAvLyBEZXRlcm1pbmUgaG93IG1hbnkgdG90YWwgY2h1bmtzIHRoZXJlIGFyZSBmcm9tIHRoZSB0cmFja2VyIGNvbGxlY3Rpb25cbiAgdmFyIGNodW5rSW5mbyA9IHRyYWNrZXIuZmluZE9uZSh7ZmlsZUlkOiBmaWxlT2JqLl9pZCwgY29sbGVjdGlvbk5hbWU6IGZpbGVPYmouY29sbGVjdGlvbk5hbWV9KSB8fCB7fTtcbiAgdmFyIHRvdGFsQ2h1bmtzID0gRlMuVXRpbGl0eS5zaXplKGNodW5rSW5mby5rZXlzKTtcblxuICBmdW5jdGlvbiBnZXROZXh0U3RyZWFtRnVuYyhjaHVuaykge1xuICAgIHJldHVybiBNZXRlb3IuYmluZEVudmlyb25tZW50KGZ1bmN0aW9uKG5leHQpIHtcbiAgICAgIHZhciBmaWxlS2V5ID0gX2ZpbGVSZWZlcmVuY2UoZmlsZU9iaiwgY2h1bmspO1xuICAgICAgdmFyIGNodW5rUmVhZFN0cmVhbSA9IEZTLlRlbXBTdG9yZS5TdG9yYWdlLmFkYXB0ZXIuY3JlYXRlUmVhZFN0cmVhbShmaWxlS2V5KTtcbiAgICAgIG5leHQoY2h1bmtSZWFkU3RyZWFtKTtcbiAgICB9LCBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gTWFrZSBhIGNvbWJpbmVkIHN0cmVhbVxuICB2YXIgY29tYmluZWRTdHJlYW0gPSBDb21iaW5lZFN0cmVhbS5jcmVhdGUoKTtcblxuICAvLyBBZGQgZWFjaCBjaHVuayBzdHJlYW0gdG8gdGhlIGNvbWJpbmVkIHN0cmVhbSB3aGVuIHRoZSBwcmV2aW91cyBjaHVuayBzdHJlYW0gZW5kc1xuICB2YXIgY3VycmVudENodW5rID0gMDtcbiAgZm9yICh2YXIgY2h1bmsgPSAwOyBjaHVuayA8IHRvdGFsQ2h1bmtzOyBjaHVuaysrKSB7XG4gICAgY29tYmluZWRTdHJlYW0uYXBwZW5kKGdldE5leHRTdHJlYW1GdW5jKGNodW5rKSk7XG4gIH1cblxuICAvLyBSZXR1cm4gdGhlIGNvbWJpbmVkIHN0cmVhbVxuICByZXR1cm4gY29tYmluZWRTdHJlYW07XG59O1xuIl19
