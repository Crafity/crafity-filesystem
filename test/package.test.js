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
  
var jstest = require('crafity-jstest')
	, assert = jstest.assert
	, context = jstest.createContext()
	, fs = require('fs')
	;

(function packageTests() {
	/**
	 * The tests
	 */
	var tests = {

		'package---> The module must have main.js file': function () {
			
			var main = require('../main');
			assert.isDefined(main, "Expected main to be defined");
		},

		'package---> The module must have a fullname': function () {
      var main = require('../main');
			assert.isDefined(main.fullname, "Expected fullname to be defined");
		},

		'package---> The module must have a version number': function () {
      var main = require('../main');
			assert.isDefined(main.version, "Expected version number to be defined");
		},

		'package---> The module must have package.json file': function (context) {
			fs.readFileSync("./package.json");
		},

		'package---> The module must have the same name as quoted in package.json': function () {

      var main = require('../main');
			var data = fs.readFileSync("./package.json")
				, json = JSON.parse(data.toString());

      assert.areEqual(main.fullname, json.name, "Expected module name to be the same in both places.");

		},

		'package---> The module must have the same version as quoted in package.json': function () {

      var main = require('../main');
			var data = fs.readFileSync("./package.json")
				, json = JSON.parse(data.toString());

			assert.isDefined(json.version, "Expected fs to be defined");
			assert.areEqual(main.version, json.version, "Expected the same module version!");
		}

	};

	/**
	 * Run the tests
	 */
	context.run(tests);

}());