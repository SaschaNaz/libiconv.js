/// <reference path="jake/node.d.ts" />
/// <reference path="jake/jake.d.ts" />

import fs = require("fs");

let cc = "emcc";
let iconvSource = "deps/libiconv/lib/iconv.c";
let iconvInclude = "-I support";
let iconvHelperDir = "src";
let iconvDefinitions = "-D ICONV_CONST=const -D LIBICONV_PLUG=1";
let iconvExportedFunctions = "-s EXPORTED_FUNCTIONS=['_iconv_open','_iconv','_iconv_close']";

let iconvCommonParameters = `${iconvSource} ${iconvExportedFunctions} ${iconvInclude} ${iconvDefinitions}`;

let jakeExecOptionBag: jake.ExecOptions = {
    printStdout: true,
    printStderr: true,
    breakOnError: true
};
let jakeAsyncTaskOptionBag: jake.TaskOptions = {
    async: true
}

desc("Compile helper script");
task("helper", () => {
    process.chdir(iconvHelperDir);
    jake.exec(["tsc"], jakeExecOptionBag, () => {
        process.chdir("..");
        complete();
    });
}, jakeAsyncTaskOptionBag);

desc("Compile libiconv with Emscripten, with helper.js separated");
task("libiconv-base", () => {
    // --post-js src/helper.js
    jake.exec([`${cc} -o lib/libiconv-base.js ${iconvCommonParameters}`], jakeExecOptionBag, () => {
        complete();
    });
}, jakeAsyncTaskOptionBag);

desc("Compile libiconv with Emscripten");
task("libiconv", () => {
    jake.exec([`${cc} --post-js src/helper.js -o lib/libiconv.js ${iconvCommonParameters}`], jakeExecOptionBag, () => {
        complete();
    });
}, jakeAsyncTaskOptionBag);

desc("Builds libiconv.js, with helper.js separated");
task("base", ["helper", "libiconv-base"], () => {

});

desc("Builds libiconv.js");
task("default", ["helper", "libiconv"], () => {

});