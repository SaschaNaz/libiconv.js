var libiconv;
(function (libiconv) {
    (function (Errno) {
        Errno[Errno["E2BIG"] = 7] = "E2BIG";
        Errno[Errno["EILSEQ"] = 84] = "EILSEQ";
        Errno[Errno["EINVAL"] = 22] = "EINVAL";
    })(libiconv.Errno || (libiconv.Errno = {}));
    var Errno = libiconv.Errno;
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
        var iconv = new Iconv(fromCode, toCode);
        var result = iconv.convert(input);
        iconv.close();
        return result;
    }
    libiconv.convert = convert;
    var Iconv = (function () {
        function Iconv(fromCode, toCode) {
            this.fromCode = fromCode;
            this.toCode = toCode;
            this._pIconv = iconvOpen(toCode, fromCode); // Note: The order should always be reversed!
        }
        Iconv.prototype.convert = function (input) {
            var outputReservedLength = input.length * 4;
            var pInput = allocateUint8Array(input);
            var pOutput = Module._malloc(outputReservedLength);
            var ppInput = allocateInt32(pInput);
            var ppOutput = allocateInt32(pOutput);
            var pInputLeft = allocateInt32(input.length);
            var pOutputLeft = allocateInt32(outputReservedLength);
            var resultCode = iconv(this._pIconv, ppInput, pInputLeft, ppOutput, pOutputLeft);
            var output = Module.HEAPU8.slice(pOutput, pOutput + outputReservedLength - Module.getValue(pOutputLeft, "i32"));
            for (var _i = 0, _a = [pInput, pOutput, ppInput, ppOutput, pInputLeft, pOutputLeft]; _i < _a.length; _i++) {
                var pointer = _a[_i];
                Module._free(pointer);
            }
            if (resultCode === -1) {
                var errMessage;
                var errno = getErrno();
                switch (errno) {
                    case Errno.E2BIG:
                        errMessage = "Need more space. Please contact dev when this happens.";
                        break;
                    case Errno.EILSEQ:
                        errMessage = "Illegal character sequence.";
                        break;
                    case Errno.EINVAL:
                        errMessage = "Incomplete character sequence.";
                        break;
                    default:
                        errMessage = "Unknown error";
                        break;
                }
                var error = new Error("libiconv.js: " + errMessage);
                error.name = "IconvError";
                error.code = Errno[errno];
                throw error;
            }
            return output;
        };
        Iconv.prototype.close = function () {
            iconvClose(this._pIconv);
        };
        return Iconv;
    })();
    libiconv.Iconv = Iconv;
})(libiconv || (libiconv = {}));
