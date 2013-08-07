/*jslint node: true, bitwise: true, unparam: true, maxerr: 50, white: true, stupid: true */
"use strict";

/*!
 * crafity-core - Crafity core helper library
 * Copyright(c) 2013 Crafity
 * Copyright(c) 2013 Bart Riemens
 * Copyright(c) 2013 Galina Slavova
 * MIT Licensed
 */

/**
 * Test dependencies.
 */

var jstest = require('crafity-jstest').createContext("Testing crafity filesystem")
  , assert = jstest.assert
  , fs = require('../main.js');

/**
 * Run the tests
 */
jstest.run({

  'crafity.filesystem must be the same as the default fs module': function () {

    assert.isDefined(fs, "Expected fs to be defined");

    var proto = '__proto__';

    assert.areEqual(require('fs'), fs[proto], "Expected fs to be the standard module");
  },

  'Combine must be able to concat paths and filenames correctly': function () {

    assert.areEqual("foo/bar", fs.combine("foo", "bar"), '"foo", "bar"');
    assert.areEqual("foo/bar", fs.combine("foo/", "bar"), '"foo/", "bar"');
    assert.areEqual("foo/bar", fs.combine("foo", "/bar"), '"foo", "/bar"');
    assert.areEqual("foo/bar", fs.combine("foo/", "/bar"), '"foo/", "/bar"');
    assert.areEqual("/", fs.combine("/"), '"/"');
    assert.areEqual("/", fs.combine("/", "/"), '"/", "/"');
    assert.areEqual("/foo/bar", fs.combine("/", "foo/", "/bar"), '"/", "foo/", "/bar"');
    assert.areEqual("/foo/bar", fs.combine("/", "/foo/", "/bar"), '"/", "/foo/", "/bar"');
  },

  'crafity.fylesystem must have package.json file': function () {

    fs.readFile("./package.json", function (err, data) {
      assert.isDefined(data, "Expected package.json defined");
    });
  }

});

module.exports = jstest;
