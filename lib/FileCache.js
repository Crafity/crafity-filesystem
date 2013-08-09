/*jslint node:true, bitwise: true, unparam: true, maxerr: 50, white: true, nomen: true */
"use strict";
/*!
 * FileCache - Generational File Cache
 * Copyright(c) 2010-2013 Crafity
 * Copyright(c) 2010-2013 Bart Riemens
 * Copyright(c) 2010-2013 Galina Slavova
 * MIT Licensed
 */

var __fs = require('../main');

function FileCache(fs, cache) {
  this._size = 0;
  
  this._cache = cache || {};
  
  if (fs) {
    this._fs = fs;
  }
}

FileCache.prototype._fs = __fs;

FileCache.prototype.getSize = function () {
  return this._size;
};

FileCache.prototype.get = function (path, callback) {
  var self = this;

  if (self._cache[path] !== undefined) {
    return process.nextTick(function () {
      return callback(null, self._cache[path]);
    });
  }

  return self._fs.readFile(path, function (err, buffer) {
    if (err) { return callback(err); }

    var data = buffer.toString();

    self._cache[path] = data;
    self._size += data.length;

    return callback(null, self._cache[path]);
  });
};

module.exports = FileCache;
