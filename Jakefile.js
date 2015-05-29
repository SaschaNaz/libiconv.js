/// <reference path="jake/node.d.ts" />
/// <reference path="jake/jake.d.ts" />
var cc = "emcc";
var iconvSource = "deps/libiconv/lib/iconv.c";
var iconvInclude = "-I support";
var iconvHelperDir = "src";
var iconvFlags = iconvInclude + " -D ICONV_CONST=const";
var jakeExecOptionBag = {
    printStdout: true,
    printStderr: true
};
var jakeAsyncTaskOptionBag = {
    async: true
};
desc("Compile libiconv with Emscripten");
task("libiconv", function () {
    // --post-js src/helper.js
    jake.exec([(cc + " -o lib/libiconv.js " + iconvSource + " -s EXPORTED_FUNCTIONS=['_iconv_open','_iconv','_iconv_close'] " + iconvFlags)], jakeExecOptionBag, function () {
        complete();
    });
}, jakeAsyncTaskOptionBag);
desc("Compile helper script");
task("helper", function () {
    process.chdir(iconvHelperDir);
    jake.exec(["tsc"], jakeExecOptionBag, function () {
        process.chdir("..");
        complete();
    });
}, jakeAsyncTaskOptionBag);
desc("Builds libiconv.js");
task("default", ["libiconv", "helper"], function () {
});
