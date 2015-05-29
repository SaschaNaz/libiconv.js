/// <reference path="jake/node.d.ts" />
/// <reference path="jake/jake.d.ts" />

import fs = require("fs");

let cc = "emcc";
let iconvSource = "deps/libiconv/lib/iconv.c";
let iconvInclude = "-I support";
let iconvHelperDir = "src";
let iconvFlags = `${iconvInclude} -D ICONV_CONST=const`

let jakeExecOptionBag: jake.ExecOptions = {
    printStdout: true,
    printStderr: true
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

desc("Compile libiconv with Emscripten");
task("libiconv", () => {
    // --post-js src/helper.js
    jake.exec([`${cc} -o lib/libiconv.js ${iconvSource} -s EXPORTED_FUNCTIONS=['_iconv_open','_iconv','_iconv_close'] ${iconvFlags}`], jakeExecOptionBag, () => {
        complete();
    });
}, jakeAsyncTaskOptionBag);

desc("Builds libiconv.js");
task("default", ["helper", "libiconv"], () => {

});