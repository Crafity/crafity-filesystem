/*jslint node:true, white: true*/
require("../test/package.test.js").on("complete", function () {
  require("../test/crafity.filesystem.test.js").on("complete", function () {
    require("../test/FileCache.test.js");
  });  
});
