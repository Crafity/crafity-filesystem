/*jslint bitwise: true, unparam: true, maxerr: 50, white: true */
/*globals exports:true, module, require, process, Filesystem */
/*!
 * crafity.filesystem
 * Copyright(c) 2011 Crafity
 * Copyright(c) 2011 Bart Riemens
 * Copyright(c) 2011 Galina Slavova
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var core = require('crafity-core')
	, fs = require('fs')
	, watch = require('watch')
	, pathUtil = require('path')
	, arrays = core.arrays
	, objects = core.objects;

/**
 * Framework name.
 */

exports.fullname = 'crafity.filesystem';

/**
 * Framework version.
 */

exports.version = '0.0.1';

/**
 *
 */

function Filesystem() {
	"use strict";
	var self = this;

	/**
	 *
	 */

	this.combine = function () {
		var args = arrays.toArray(arguments);
		return pathUtil.join.apply(pathUtil, args);
	};

	/**
	 *
	 */

	objects.extend(this, pathUtil);

	function File(path, file) {
		this.name = file;
		this.path = path;
		this.type = File;
	}

	File.prototype.typeName = "File";
	File.prototype.type = File;

	function Directory(path, directory) {
		this.name = directory;
		this.path = path;
		this.type = Directory;
	}

	Directory.prototype.typeName = "Directory";
	Directory.prototype.type = Directory;

	this.getAllFiles = function (path, pattern, deep, callback, synchronizer) {
		if (!path || typeof path !== 'string') {
			throw new Error("Path is not specified");
		}
		if (deep && deep instanceof Function && callback === undefined) {
			callback = deep;
			deep = false;
		}
		if (pattern && pattern instanceof Function && callback === undefined) {
			callback = pattern;
			pattern = undefined;
		}
		if (pattern && typeof pattern === 'boolean') {
			deep = pattern;
		}

		synchronizer = synchronizer || new core.Synchronizer();

		fs.readdir(path, synchronizer.register(function (err, objects) {
			if (err) { return callback(err); }

			objects.forEach(function (object) {
				fs.stat(self.combine(path, object), synchronizer.register(function (err, stat) {
					if (deep && stat.isDirectory()) {
						return process.nextTick(synchronizer.register(function () {
							callback(null, new Directory(path, object));
							return self.getAllFiles(self.combine(path, object), pattern, deep, callback, synchronizer);
						}));
					} else if (stat.isFile()) {
						if (!self.matchFilePattern(object, pattern)) { return; }
						return process.nextTick(synchronizer.register(function () {
							callback(null, new File(path, object));
						}));
					}
				}));
			});
		}));

		return synchronizer;
	};

	this.getAllFilesWithContent = function (path, pattern, deep, callback) {
		if (!path || typeof path !== 'string') {
			throw new Error("Path is not specified");
		}
		if (deep === true) {
			throw new Error("Deep searching is not yet implemented.")
		}
		if (deep && deep instanceof Function && callback === undefined) {
			callback = deep;
			deep = false;
		}
		if (pattern && pattern instanceof Function && callback === undefined) {
			callback = pattern;
			pattern = undefined;
		}
		if (pattern && typeof pattern === 'boolean') {
			deep = pattern;
		}

		self.getAllFiles(path, pattern, deep, function (err, files) {
			if (err) { return callback(err); }
			var synchronizer = new core.Synchronizer();

			files.forEach(function (file) {
				fs.readFile(self.combine(path, file), synchronizer.register(file));
			});

			synchronizer.onfinish(callback);
		});
	};

	var folders = {};
	this.watchFolder = function (folder, options, callback) {
		if (!callback) {
			callback = options;
			options = {}
		}
		options.ignoreDotFiles = options.ignoreDotFiles || true;
		options.filter = options.filter || function (f, stat) {
			try {
				if (!stat) {
					console.trace();
					console.log(f);
					return false;
				}
				if (stat.isDirectory()) { return false; }
				if (options.include && self.matchFilePattern(f, options.include)) {
					return false;
				}
				if (options.exclude && self.matchFilePattern(f, options.exclude)) {
					return true;
				}
				return true
			} catch (err) {
				console.log("Filter error", err.stack, err);
				return true;
			}
		};

		if (folders[folder]) {
			folders[folder].push(callback);
		} else {
			folders[folder] = [callback];
			watch.createMonitor(folder, options, function (monitor) {
				function onchange(f, stat) {
					if (options.include && !self.matchFilePattern(f, options.include)) {
						return;
					}
					if (options.exclude && self.matchFilePattern(f, options.exclude)) {
						return;
					}
					folders[folder].forEach(function (callback) {
						callback(f, stat);
					});
				}

				monitor.on("created", onchange);
				monitor.on("changed", onchange);
				monitor.on("removed", onchange);
			});
		}
	};

	this.matchFilePattern = function (filename, pattern) {
		if (!pattern || pattern === "*" || pattern === "*.*") { return true; }

		var patternParts = pattern.split('|')
			, patternPart
			, match = false
			, index;

		for (index in patternParts) {
			if (patternParts.hasOwnProperty(index)) {
				patternPart = patternParts[index];
				match = match || getExtensionPattern(patternPart).test(filename);
			}
		}
		return match;
	}
}

Filesystem.prototype = fs;

/**
 * Initialize module
 */

exports = (module.exports = new Filesystem());

var extensionPatterns = {};
function getExtensionPattern(pattern) {
	if (!extensionPatterns[pattern]) {
		extensionPatterns[pattern] = new RegExp("(^|\\/){1}(" + pattern.replace(".", "\\.").replace("*", "(\\w(\\.||\\ )*)+") + "){1}$", "i");
	}
	return extensionPatterns[pattern];
}
