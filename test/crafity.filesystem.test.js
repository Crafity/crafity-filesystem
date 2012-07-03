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
	, fs = require('../main.js');

// Print out the name of the test module
console.log("Testing 'main.js' in crafity-filesystem... ");

/**
 * The tests
 */
var tests = {

	'crafity.filesystem must be the same as the default fs module': function () {

		assert.isDefined(fs, "Expected fs to be defined");
		assert.areEqual(require('fs'), fs.__proto__, "Expected fs to be the standard module");
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

	'crafity.fylesystem must be the fullname of this module': function () {
		
		assert.areEqual("crafity.filesystem", fs.fullname(), "Expected module name is crafity.filesystem!");
	},

	'crafity.fylesystem must have package.json file': function () {

		fs.readFile("./package.json", function (err, data) {
			assert.isDefined(data, "Expected package.json defined");
		});
	},

	'crafity.fylesystem must have the same version as quoted in package.json': function () {

		fs.readFile("./package.json", function (err, data) {
			var json = JSON.parse(data.toString());
//			console.log("json", json);

			assert.isDefined(json.version, "Expected fs to be defined");
			assert.areEqual(fs.version(), json.version, "Expected the same module version!");
		});
	}

};

/**
 * Run the tests
 */
context.run(tests);
