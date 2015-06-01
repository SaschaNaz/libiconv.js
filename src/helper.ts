namespace libiconv {
    export enum Errno {
        E2BIG = 7,
        EILSEQ = 84,
        EINVAL = 22
    }
    export interface IconvError extends Error {
        code: string;
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
        let iconv = new Iconv(fromCode, toCode);
        let result = iconv.convert(input);
        iconv.close();
        return result;
    }

    export class Iconv {
        private _pIconv: number;

        constructor(public fromCode: string, public toCode: string) {
            this._pIconv = iconvOpen(toCode, fromCode); // Note: The order should always be reversed!
        }

        convert(input: Uint8Array) {
            let outputReservedLength = input.length * 4;

            let pInput = allocateUint8Array(input);
            let pOutput = Module._malloc(outputReservedLength);
            let ppInput = allocateInt32(pInput);
            let ppOutput = allocateInt32(pOutput);

            let pInputLeft = allocateInt32(input.length);
            let pOutputLeft = allocateInt32(outputReservedLength);

            let resultCode = iconv(this._pIconv, ppInput, pInputLeft, ppOutput, pOutputLeft);

            let output = Module.HEAPU8.slice(pOutput, pOutput + outputReservedLength - Module.getValue(pOutputLeft, "i32"));

            for (let pointer of [pInput, pOutput, ppInput, ppOutput, pInputLeft, pOutputLeft])
                Module._free(pointer);

            if (resultCode === -1) {
                let errMessage: string;
                let errno = getErrno();
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
                let error = <IconvError>new Error(`libiconv.js: ${errMessage}`);
                error.name = "IconvError";
                error.code = Errno[errno];
                throw error;
            }
            return output;
        }

        close() {
            iconvClose(this._pIconv);
        }
    }
}

declare namespace Module {
    function intArrayFromString(stringy: string, dontAddNull?: boolean, length?: number): number[];
    function intArrayToString(array: number[]|Uint8Array): string;
    function setValue(pointer: number, value: number, type: string): void;
    function getValue(pointer: number, type: string): number;

    function _free(byteOffset: number): void;
    function _malloc(size: number): number;
    var HEAPU8: Uint8Array;

    function cwrap<T extends Function>(identifier: string, returnType: string, argTypes: string[]): T;
}