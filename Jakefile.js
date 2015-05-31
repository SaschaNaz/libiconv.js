/// <reference path="jake/node.d.ts" />
/// <reference path="jake/jake.d.ts" />
var cc = "emcc";
var iconvSource = "deps/libiconv/lib/iconv.c src/helper.c";
var iconvInclude = "-I support";
var iconvHelperDir = "src";
var iconvDefinitions = "-D ICONV_CONST=const -D LIBICONV_PLUG=1";
var iconvExportedFunctions = "-s EXPORTED_FUNCTIONS=['_iconv_open','_iconv','_iconv_close','_get_errno']";
var iconvCommonParameters = iconvSource + " " + iconvExportedFunctions + " " + iconvInclude + " " + iconvDefinitions;
var jakeExecOptionBag = {
    printStdout: true,
    printStderr: true,
    breakOnError: true
};
var jakeAsyncTaskOptionBag = {
    async: true
};
desc("Compile helper script");
task("helper", function () {
    process.chdir(iconvHelperDir);
    jake.exec(["tsc"], jakeExecOptionBag, function () {
        process.chdir("..");
        complete();
    });
}, jakeAsyncTaskOptionBag);
desc("Compile libiconv with Emscripten, with helper.js separated");
task("libiconv-base", function () {
    // --post-js src/helper.js
    jake.exec([(cc + " -o lib/libiconv-base.js " + iconvCommonParameters)], jakeExecOptionBag, function () {
        complete();
    });
}, jakeAsyncTaskOptionBag);
desc("Compile libiconv with Emscripten");
task("libiconv", function () {
    jake.exec([(cc + " --post-js src/helper.js -o lib/libiconv.js " + iconvCommonParameters)], jakeExecOptionBag, function () {
        complete();
    });
}, jakeAsyncTaskOptionBag);
desc("Builds libiconv.js, with helper.js separated");
task("base", ["helper", "libiconv-base"], function () {
});
desc("Builds libiconv.js");
task("default", ["helper", "libiconv"], function () {
});
