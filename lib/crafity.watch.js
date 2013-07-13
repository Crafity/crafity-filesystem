/*jslint node:true, bitwise: true, unparam: true, maxerr: 50, white: true, nomen: true */
/*!
 * crafity-config - Generic configuration provider
 * Copyright(c) 2011 Crafity
 * Copyright(c) 2011 Bart Riemens
 * Copyright(c) 2011 Galina Slavova
 * MIT Licensed
 */

// Changed by Crafity (2012)
//
//		Fixed a couple of issues and refactored existing code. Made it JSLint compliant.
//
// Copyright 2010-2011 Mikeal Rogers
// 
//    Licensed under the Apache License, Version 2.0 (the "License");
//    you may not use this file except in compliance with the License.
//    You may obtain a copy of the License at
// 
//        http://www.apache.org/licenses/LICENSE-2.0
// 
//    Unless required by applicable law or agreed to in writing, software
//    distributed under the License is distributed on an "AS IS" BASIS,
//    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//    See the License for the specific language governing permissions and
//    limitations under the License.
//

/**
 * Module dependencies.
 */

var fs = require('fs')
  , path = require('path')
  , events = require('events')
  ;

function walk(dir, options, callback) {
  "use strict";

  if (!callback) {
    callback = options;
    options = {};
  }
  if (!callback.files) { callback.files = {}; }
  if (!callback.pending) { callback.pending = 0; }
  callback.pending += 1;
  fs.stat(dir, function (err, stat) {
    try {
      if (err) { return callback(new Error(err)); }
      if (options.filter && options.filter(dir, stat)) { return; }
      callback.files[dir] = stat;
      fs.readdir(dir, function (err, files) {
        try {
          if (err) { return callback(new Error(err)); }
          files.forEach(function (f) {
            f = path.join(dir, f);
            callback.pending += 1;
            fs.stat(f, function (err, stat) {
              try {
                if (err) { return; }
                if (options.filter && options.filter(f, stat)) { return; }
                if (options.ignoreDotFiles && path.basename(f)[0] === '.') {return;}
                callback.files[f] = stat;
                if (stat.isDirectory()) { walk(f, options, callback); }
              } catch (ignore) {
                // Don't do anything
              } finally {
                callback.pending -= 1;
                if (callback.pending === 0) {
                  callback(null, callback.files);
                }
              }
            });
          });
        } finally {
          callback.pending -= 1;
          if (callback.pending === 0) { callback(null, callback.files); }
        }
      });
    } finally {
      callback.pending -= 1;
      if (callback.pending === 0) { callback(null, callback.files); }
    }
  });
}

exports.watchTree = function (root, options, callback) {
  "use strict";

  if (!callback) {
    callback = options;
    options = {};
  }
  walk(root, options, function (err, files) {
    if (err) { throw err; }
    var file
      , fileWatcher = function (f) {
        if (!files[f]) {
          return;
        }
        if (files[f].watching) { return; }
        files[f].watching = true;
        fs.watchFile(f, options, function (c, p) {
          if (c.nlink !== 0) {
            if (c.isDirectory()) {
              fs.readdir(f, function (err, nfiles) {
                if (err) { return; }
                nfiles.forEach(function (b) {
                  var file = path.join(f, b);
                  if (!files[file]) {
                    fs.stat(file, function (err, stat) {
                      if (err) { return; }
                      if (options.ignoreDotFiles && path.basename(file)[0] === '.') {return;}
                      if (options.filter && options.filter(file, stat)) {return;}
                      files[file] = stat;
                      fileWatcher(file);
                      callback(file, stat, null);
                    });
                  }
                });
              });
            } else {
              if (files[f].mtime.getTime() === c.mtime.getTime()) {
                return undefined;
              }
              files[f] = c;
              return callback(f, c, p);

            }
          } else {
            // unwatch removed files.
            delete files[f];
            fs.unwatchFile(f);
            return callback(f, c, p);
          }
        });

      };

    fileWatcher(root);

    for (file in files) {
      if (files.hasOwnProperty(file)) {
        fileWatcher(file);
      }
    }
    callback(files, null, null);
  });
};

exports.createMonitor = function (root, options, cb) {
  "use strict";

  if (!cb) {
    cb = options;
    options = {};
  }
  var monitor = new events.EventEmitter();
  monitor.setMaxListeners(50);
  exports.watchTree(root, options, function (f, curr, prev) {
    monitor.setMaxListeners(50);
    if (typeof f === "object" && prev === null && curr === null) {
      monitor.files = f;
      return cb(monitor);
    }
    if (curr && curr.nlink === 0) {
      return monitor.emit("removed", f, curr);
    }
    if (curr && !prev) {
      if (curr.atime.toString() === curr.mtime.toString() &&
        curr.atime.toString() === curr.ctime.toString()) {
        return monitor.emit("created", f, curr);
      }
      return undefined;
    }
    if (curr && prev) {
      monitor.emit("changed", f, curr, prev);
    }
  });
};

exports.walk = walk;
