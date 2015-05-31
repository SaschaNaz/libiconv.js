var libiconv;
(function (libiconv) {
    function allocateUint8Array(input) {
        var pointer = Module._malloc(input.length);
        Module.HEAPU8.set(input, pointer);
        return pointer;
    }
    function allocateInt32(input) {
        var pointer = Module._malloc(4);
        Module.setValue(pointer, input, "i32");
        return pointer;
    }
    var iconvOpen = Module.cwrap("iconv_open", "number", ["string", "string"]);
    var iconv = Module.cwrap("iconv", "number", ["number", "number", "number", "number", "number"]);
    var iconvClose = Module.cwrap("iconv_close", "number", ["number"]);
    var getErrno = Module.cwrap("get_errno", "number", []);
    function convert(input, fromCode, toCode) {
        var outputReservedLength = input.length * 4;
        var pInput = allocateUint8Array(input);
        var pOutput = Module._malloc(outputReservedLength);
        var ppInput = allocateInt32(pInput);
        var ppOutput = allocateInt32(pOutput);
        var pInputLeft = allocateInt32(input.length);
        var pOutputLeft = allocateInt32(outputReservedLength);
        var pIconv = iconvOpen(toCode, fromCode);
        var resultCode = iconv(pIconv, ppInput, pInputLeft, ppOutput, pOutputLeft);
        iconvClose(pIconv);
        var output = Module.HEAPU8.slice(pOutput, pOutput + outputReservedLength - Module.getValue(pOutputLeft, "i32"));
        for (var _i = 0, _a = [pInput, pOutput, ppInput, ppOutput, pInputLeft, pOutputLeft]; _i < _a.length; _i++) {
            var pointer = _a[_i];
            Module._free(pointer);
        }
        if (resultCode === -1) {
            var errMessage;
            switch (getErrno()) {
                case 7 /* E2BIG */:
                    errMessage = "Need more space. Please contact dev when this happens.";
                    break;
                case 84 /* EILSEQ */:
                    errMessage = "Illegal character sequence.";
                    break;
                case 22 /* EINVAL */:
                    errMessage = "Incomplete character sequence.";
                    break;
                default:
                    errMessage = "Unknown error";
                    break;
            }
            throw new Error("libiconv.js: " + errMessage);
        }
        return output;
    }
    libiconv.convert = convert;
})(libiconv || (libiconv = {}));
