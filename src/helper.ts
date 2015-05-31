module libiconv {
    const enum Errno {
        E2BIG = 7,
        EILSEQ = 84,
        EINVAL = 22
    }

    function allocateUint8Array(input: Uint8Array) {
        let pointer = Module._malloc(input.length);
        Module.HEAPU8.set(input, pointer);
        return pointer;
    }
    function allocateInt32(input: number) {
        let pointer = Module._malloc(4);
        Module.setValue(pointer, input, "i32");
        return pointer;
    }

    let iconvOpen = Module.cwrap<(toCode: string, fromCode: string) => number>("iconv_open", "number", ["string", "string"]);
    let iconv = Module.cwrap
        <(pIconv: number, ppInput: number, pInputLeft: number, ppOutput: number, pOutputLeft: number) => number>
        ("iconv", "number", ["number", "number", "number", "number", "number"]);
    let iconvClose = Module.cwrap<(pIconv: number) => number>("iconv_close", "number", ["number"]);
    let getErrno = Module.cwrap<() => number>("get_errno", "number", []);

    export function convert(input: Uint8Array, fromCode: string, toCode: string) {
        let outputReservedLength = input.length * 4;

        let pInput = allocateUint8Array(input);
        let pOutput = Module._malloc(outputReservedLength);
        let ppInput = allocateInt32(pInput);
        let ppOutput = allocateInt32(pOutput);

        let pInputLeft = allocateInt32(input.length);
        let pOutputLeft = allocateInt32(outputReservedLength);

        let pIconv = iconvOpen(toCode, fromCode);
        let resultCode = iconv(pIconv, ppInput, pInputLeft, ppOutput, pOutputLeft);
        iconvClose(pIconv);

        let output = Module.HEAPU8.slice(pOutput, pOutput + outputReservedLength - Module.getValue(pOutputLeft, "i32"));

        for (let pointer of [pInput, pOutput, ppInput, ppOutput, pInputLeft, pOutputLeft])
            Module._free(pointer);

        if (resultCode === -1) {
            let errMessage: string;
            switch (getErrno()) {
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
            throw new Error(`libiconv.js: ${errMessage}`);
        }
        return output;
    }
}

declare module Module {
    function intArrayFromString(stringy: string, dontAddNull?: boolean, length?: number): number[];
    function intArrayToString(array: number[]|Uint8Array): string;
    function setValue(pointer: number, value: number, type: string): void;
    function getValue(pointer: number, type: string): number;

    function _free(byteOffset: number): void;
    function _malloc(size: number): number;
    var HEAPU8: Uint8Array;

    function cwrap<T extends Function>(identifier: string, returnType: string, argTypes: string[]): T;
}