/*jslint node: true, bitwise: true, unparam: true, maxerr: 50, white: true, stupid: true */
"use strict";

/*!
 * crafity-filesystem - Crafity File Cache tests
 * Copyright(c) 2010-2013 Crafity
 * Copyright(c) 2010-2013 Bart Riemens
 * Copyright(c) 2010-2013 Galina Slavova
 * MIT Licensed
 */

/**
 * Test dependencies.
 */

var jstest = require('crafity-jstest').createContext("Testing crafity file cache")
  , assert = jstest.assert
  , fs = require('../main.js')
  , testFilePath = 'test/resources/test.txt'
  ;

/**
 * Run the tests
 */
jstest.run({

  'Instantiate a file cache and request a file': function (test) {
    test.async(1000);

    var FileCache = require('../lib/FileCache.js')
      , fileCache = new FileCache();

    fileCache.getSize();

    fileCache.get(testFilePath, function (err, buffer) {
      if (err) { throw err; }
      fileCache.get(testFilePath, function (err, buffer) {
        test.complete(err);
      });
    });

    //assert.areEqual("123".length, fileCache.getSize(), "Expected another content size");
  },
  "Request a cached file and ensure it is not loaded from disk": function (test) {
    test.async(1000);

    var FileCache = require('../lib/FileCache.js')
      , fsMock = {
        readFileCount: 0,
        readFile: function readFile(path, callback) {
          fsMock.readFileCount += 1;
          callback(null, "");
        }
      }
      , cacheMock = {}
      , fileCache = new FileCache(fsMock, cacheMock)
      ;

    fileCache.get(testFilePath, function (err, buffer) {
      if (err) { throw err; }
      fileCache.get(testFilePath, function (err, buffer) {
        if (err) { throw err; }

        assert.areEqual(1, fsMock.readFileCount, "Expected only one read file call");

        return test.complete();
      });
    });

  }

});

module.exports = jstest;
