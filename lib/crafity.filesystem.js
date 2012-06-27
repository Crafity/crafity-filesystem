/*jslint node:true, bitwise: true, unparam: true, maxerr: 50, white: true */
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
	, EventEmitter = require('events').EventEmitter
	, arrays = core.arrays
	, objects = core.objects
	;

/**
 * Framework name.
 */

exports.fullname = 'crafity.filesystem';

/**
 * Framework version.
 */

exports.version = '0.0.1';

/**
 * Initialize module
 */

var extensionPatterns = {};
function getExtensionPattern(pattern) {
	"use strict";
	
	if (!extensionPatterns[pattern]) {
		extensionPatterns[pattern] = new RegExp("(^|\\/){1}(" + pattern.replace(".", "\\.").replace("*", "(\\w(\\.||\\ )*)+") + "){1}$", "i");
	}
	return extensionPatterns[pattern];
}

function Filesystem() {
	"use strict";
	var self = this
		, folders = {}
		;

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

	function File(parent, path, file) {
		var internal = this;
		this.name = file;
		this.path = path;
		this.type = File;
		this.data = null;
		this.getParent = function getParent() {
			return parent;
		};
		this.readContent = function (callback) {
			if (internal.data) {
				return callback(null, internal.data);
			} else {
				fs.readFile(self.combine(path, file), function (err, data) {
					return callback(err, data ? internal.data = data : null);
				});
			}
		};
		this.dispose = function () {
			internal.data = undefined;
		};
	}

	File.prototype = new EventEmitter();
	File.prototype.typeName = "File";
	File.prototype.type = File;

	function Directory(parent, path, directory) {
		this.name = directory;
		this.path = path;
		this.type = Directory;
		this.files = [];
		this.directories = [];
		this.getParent = function getParent() {
			return parent;
		};
		this.dispose = function () {};
		this.level = 0;
	}

	Directory.prototype = new EventEmitter();
	Directory.prototype.typeName = "Directory";
	Directory.prototype.type = Directory;

	this.getAllFiles = function (path, pattern, deep, callback, directory) {
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

		var currentDirectory = directory || new Directory(null, path, ".")
			, localSynchronizer = new core.Synchronizer()
			, publicSynchronizer = new core.Synchronizer()
			;
		
		process.nextTick(localSynchronizer.register(function () {
			callback(null, currentDirectory);
		}));

		fs.readdir(path, localSynchronizer.register(function (err, objects) {
			if (err) { return callback(err); }

			objects.forEach(function (object) {
				fs.stat(self.combine(path, object), localSynchronizer.register(function (err, stat) {
					if (deep && stat.isDirectory()) {
						return process.nextTick(localSynchronizer.register(function () {
							var dir = new Directory(currentDirectory, path, object);
							dir.level = currentDirectory.level + 1;
							currentDirectory.directories.push(dir);
							self.getAllFiles(self.combine(path, object), pattern, deep, callback, dir)
								.on("finished", localSynchronizer.register(function () { }));
						}));
					} else if (stat.isFile()) {
						if (!self.matchFilePattern(object, pattern)) { return; }
						return process.nextTick(localSynchronizer.register(function () {
							var file = new File(currentDirectory, path, object);
							currentDirectory.files.push(file);
							callback(null, file);
						}));
					}
				}));
			});

		}));

		localSynchronizer.onfinish(publicSynchronizer.register(function () {
			currentDirectory.emit('complete');
		}));

		return publicSynchronizer;
	};

	this.getAllFilesWithContent = function (path, pattern, deep, callback) {
		if (!path || typeof path !== 'string') {
			throw new Error("Path is not specified");
		}
		if (deep === true) {
			throw new Error("Deep searching is not yet implemented.");
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

	this.watchFolder = function (folder, options, callback) {
		if (!callback) {
			callback = options;
			options = {};
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
				return true;
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
	};
}

Filesystem.prototype = fs;

module.exports = new Filesystem();
