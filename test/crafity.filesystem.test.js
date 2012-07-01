/*!
 * crafity.filesystem.test - Filesystem tests
 * Copyright(c) 2011 Crafity
 * Copyright(c) 2011 Bart Riemens
 * Copyright(c) 2011 Galina Slavova
 * MIT Licensed
 */

/**
 * Test dependencies.
 */
var jstest = require('crafity-jstest')
	, assert = jstest.assert
	, context = jstest.createContext()
	, fs = require('../lib/crafity.filesystem');

// Print out the name of the test module
console.log("Testing 'crafity.filesystem.js'... ");

/**
 * The tests
 */
var tests = {

	'crafity.filesystem must be the same as the default fs module': function () {

		assert.isDefined(fs,
			"Expected fs to be defined");

		assert.areEqual(require('fs'), fs.__proto__,
			"Expected fs to be the standard module");

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

	}

};

/**
 * Run the tests
 */
context.run(tests);
