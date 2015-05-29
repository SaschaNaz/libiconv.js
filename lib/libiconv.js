// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = (typeof Module !== 'undefined' ? Module : null) || {};

// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  if (!Module['print']) Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  if (!Module['printErr']) Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };

  var nodeFS = require('fs');
  var nodePath = require('path');

  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };

  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };

  Module['load'] = function load(f) {
    globalEval(read(f));
  };

  if (!Module['thisProgram']) {
    if (process['argv'].length > 1) {
      Module['thisProgram'] = process['argv'][1].replace(/\\/g, '/');
    } else {
      Module['thisProgram'] = 'unknown-program';
    }
  }

  Module['arguments'] = process['argv'].slice(2);

  if (typeof module !== 'undefined') {
    module['exports'] = Module;
  }

  process['on']('uncaughtException', function(ex) {
    // suppress ExitStatus exceptions from showing an error
    if (!(ex instanceof ExitStatus)) {
      throw ex;
    }
  });
}
else if (ENVIRONMENT_IS_SHELL) {
  if (!Module['print']) Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm

  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }

  Module['readBinary'] = function readBinary(f) {
    if (typeof readbuffer === 'function') {
      return new Uint8Array(readbuffer(f));
    }
    var data = read(f, 'binary');
    assert(typeof data === 'object');
    return data;
  };

  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };

  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof console !== 'undefined') {
    if (!Module['print']) Module['print'] = function print(x) {
      console.log(x);
    };
    if (!Module['printErr']) Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    if (!Module['print']) Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }

  if (ENVIRONMENT_IS_WORKER) {
    Module['load'] = importScripts;
  }

  if (typeof Module['setWindowTitle'] === 'undefined') {
    Module['setWindowTitle'] = function(title) { document.title = title };
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}

function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
if (!Module['thisProgram']) {
  Module['thisProgram'] = './this.program';
}

// *** Environment setup code ***

// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];

// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];

// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}



// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in: 
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at: 
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html

//========================================
// Runtime code shared with compiler
//========================================

var Runtime = {
  setTempRet0: function (value) {
    tempRet0 = value;
  },
  getTempRet0: function () {
    return tempRet0;
  },
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  STACK_ALIGN: 16,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (!vararg && (type == 'i64' || type == 'double')) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      assert(args.length == sig.length-1);
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      assert(('dynCall_' + sig) in Module, 'bad function pointer type - no table for sig \'' + sig + '\'');
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      assert(sig.length == 1);
      assert(('dynCall_' + sig) in Module, 'bad function pointer type - no table for sig \'' + sig + '\'');
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    var source = Pointer_stringify(code);
    if (source[0] === '"') {
      // tolerate EM_ASM("..code..") even though EM_ASM(..code..) is correct
      if (source.indexOf('"', 1) === source.length-1) {
        source = source.substr(1, source.length-2);
      } else {
        // something invalid happened, e.g. EM_ASM("..code($0)..", input)
        abort('invalid EM_ASM input |' + source + '|. Please use EM_ASM(..code..) (no quotes) or EM_ASM({ ..code($0).. }, input) (to input values)');
      }
    }
    try {
      // Module is the only 'upvar', which we provide directly. We also provide FS for legacy support.
      var evalled = eval('(function(Module, FS) { return function(' + args.join(',') + '){ ' + source + ' } })')(Module, typeof FS !== 'undefined' ? FS : null);
    } catch(e) {
      Module.printErr('error in executing inline EM_ASM code: ' + e + ' on: \n\n' + source + '\n\nwith args |' + args + '| (make sure to use the right one out of EM_ASM, EM_ASM_ARGS, etc.)');
      throw e;
    }
    return Runtime.asmConstCache[code] = evalled;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[sig]) {
      Runtime.funcWrappers[sig] = {};
    }
    var sigCache = Runtime.funcWrappers[sig];
    if (!sigCache[func]) {
      sigCache[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return sigCache[func];
  },
  getCompilerSetting: function (name) {
    throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work';
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+15)&-16);(assert((((STACKTOP|0) < (STACK_MAX|0))|0))|0); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + (assert(!staticSealed),size))|0;STATICTOP = (((STATICTOP)+15)&-16); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + (assert(DYNAMICTOP > 0),size))|0;DYNAMICTOP = (((DYNAMICTOP)+15)&-16); if (DYNAMICTOP >= TOTAL_MEMORY) { var success = enlargeMemory(); if (!success) return 0; }; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 16))*(quantum ? quantum : 16); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*4294967296.0)) : ((+((low>>>0)))+((+((high|0)))*4294967296.0))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}


Module['Runtime'] = Runtime;









//========================================
// Runtime essentials
//========================================

var __THREW__ = 0; // Used in checking for thrown exceptions.

var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;

var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;

function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  var func = Module['_' + ident]; // closure exported function
  if (!func) {
    try {
      func = eval('_' + ident); // explicit lookup
    } catch(e) {}
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}

var cwrap, ccall;
(function(){
  var JSfuncs = {
    // Helpers for cwrap -- it can't refer to Runtime directly because it might
    // be renamed by closure, instead it calls JSfuncs['stackSave'].body to find
    // out what the minified function name is.
    'stackSave': function() {
      Runtime.stackSave()
    },
    'stackRestore': function() {
      Runtime.stackRestore()
    },
    // type conversion from js to c
    'arrayToC' : function(arr) {
      var ret = Runtime.stackAlloc(arr.length);
      writeArrayToMemory(arr, ret);
      return ret;
    },
    'stringToC' : function(str) {
      var ret = 0;
      if (str !== null && str !== undefined && str !== 0) { // null string
        // at most 4 bytes per UTF-8 code point, +1 for the trailing '\0'
        ret = Runtime.stackAlloc((str.length << 2) + 1);
        writeStringToMemory(str, ret);
      }
      return ret;
    }
  };
  // For fast lookup of conversion functions
  var toC = {'string' : JSfuncs['stringToC'], 'array' : JSfuncs['arrayToC']};

  // C calling interface. 
  ccall = function ccallFunc(ident, returnType, argTypes, args) {
    var func = getCFunc(ident);
    var cArgs = [];
    var stack = 0;
    assert(returnType !== 'array', 'Return type should not be "array".');
    if (args) {
      for (var i = 0; i < args.length; i++) {
        var converter = toC[argTypes[i]];
        if (converter) {
          if (stack === 0) stack = Runtime.stackSave();
          cArgs[i] = converter(args[i]);
        } else {
          cArgs[i] = args[i];
        }
      }
    }
    var ret = func.apply(null, cArgs);
    if (returnType === 'string') ret = Pointer_stringify(ret);
    if (stack !== 0) Runtime.stackRestore(stack);
    return ret;
  }

  var sourceRegex = /^function\s*\(([^)]*)\)\s*{\s*([^*]*?)[\s;]*(?:return\s*(.*?)[;\s]*)?}$/;
  function parseJSFunc(jsfunc) {
    // Match the body and the return value of a javascript function source
    var parsed = jsfunc.toString().match(sourceRegex).slice(1);
    return {arguments : parsed[0], body : parsed[1], returnValue: parsed[2]}
  }
  var JSsource = {};
  for (var fun in JSfuncs) {
    if (JSfuncs.hasOwnProperty(fun)) {
      // Elements of toCsource are arrays of three items:
      // the code, and the return value
      JSsource[fun] = parseJSFunc(JSfuncs[fun]);
    }
  }

  
  cwrap = function cwrap(ident, returnType, argTypes) {
    argTypes = argTypes || [];
    var cfunc = getCFunc(ident);
    // When the function takes numbers and returns a number, we can just return
    // the original function
    var numericArgs = argTypes.every(function(type){ return type === 'number'});
    var numericRet = (returnType !== 'string');
    if ( numericRet && numericArgs) {
      return cfunc;
    }
    // Creation of the arguments list (["$1","$2",...,"$nargs"])
    var argNames = argTypes.map(function(x,i){return '$'+i});
    var funcstr = "(function(" + argNames.join(',') + ") {";
    var nargs = argTypes.length;
    if (!numericArgs) {
      // Generate the code needed to convert the arguments from javascript
      // values to pointers
      funcstr += 'var stack = ' + JSsource['stackSave'].body + ';';
      for (var i = 0; i < nargs; i++) {
        var arg = argNames[i], type = argTypes[i];
        if (type === 'number') continue;
        var convertCode = JSsource[type + 'ToC']; // [code, return]
        funcstr += 'var ' + convertCode.arguments + ' = ' + arg + ';';
        funcstr += convertCode.body + ';';
        funcstr += arg + '=' + convertCode.returnValue + ';';
      }
    }

    // When the code is compressed, the name of cfunc is not literally 'cfunc' anymore
    var cfuncname = parseJSFunc(function(){return cfunc}).returnValue;
    // Call the function
    funcstr += 'var ret = ' + cfuncname + '(' + argNames.join(',') + ');';
    if (!numericRet) { // Return type can only by 'string' or 'number'
      // Convert the result to a string
      var strgfy = parseJSFunc(function(){return Pointer_stringify}).returnValue;
      funcstr += 'ret = ' + strgfy + '(ret);';
    }
    if (!numericArgs) {
      // If we had a stack, restore it
      funcstr += JSsource['stackRestore'].body.replace('()', '(stack)') + ';';
    }
    funcstr += 'return ret})';
    return eval(funcstr);
  };
})();
Module["cwrap"] = cwrap;
Module["ccall"] = ccall;


function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[((ptr)>>0)]=value; break;
      case 'i8': HEAP8[((ptr)>>0)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;


function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[((ptr)>>0)];
      case 'i8': return HEAP8[((ptr)>>0)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)>>0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    assert(type, 'Must know what type to store in allocate!');

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}
Module['allocate'] = allocate;

function Pointer_stringify(ptr, /* optional */ length) {
  if (length === 0 || !ptr) return '';
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = 0;
  var t;
  var i = 0;
  while (1) {
    assert(ptr + i < TOTAL_MEMORY);
    t = HEAPU8[(((ptr)+(i))>>0)];
    hasUtf |= t;
    if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;

  var ret = '';

  if (hasUtf < 128) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  return Module['UTF8ToString'](ptr);
}
Module['Pointer_stringify'] = Pointer_stringify;

// Given a pointer 'ptr' to a null-terminated ASCII-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function AsciiToString(ptr) {
  var str = '';
  while (1) {
    var ch = HEAP8[((ptr++)>>0)];
    if (!ch) return str;
    str += String.fromCharCode(ch);
  }
}
Module['AsciiToString'] = AsciiToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in ASCII form. The copy will require at most str.length+1 bytes of space in the HEAP.

function stringToAscii(str, outPtr) {
  return writeAsciiToMemory(str, outPtr, false);
}
Module['stringToAscii'] = stringToAscii;

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the a given array that contains uint8 values, returns
// a copy of that string as a Javascript String object.

function UTF8ArrayToString(u8Array, idx) {
  var u0, u1, u2, u3, u4, u5;

  var str = '';
  while (1) {
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
    u0 = u8Array[idx++];
    if (!u0) return str;
    if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
    u1 = u8Array[idx++] & 63;
    if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
    u2 = u8Array[idx++] & 63;
    if ((u0 & 0xF0) == 0xE0) {
      u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
    } else {
      u3 = u8Array[idx++] & 63;
      if ((u0 & 0xF8) == 0xF0) {
        u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | u3;
      } else {
        u4 = u8Array[idx++] & 63;
        if ((u0 & 0xFC) == 0xF8) {
          u0 = ((u0 & 3) << 24) | (u1 << 18) | (u2 << 12) | (u3 << 6) | u4;
        } else {
          u5 = u8Array[idx++] & 63;
          u0 = ((u0 & 1) << 30) | (u1 << 24) | (u2 << 18) | (u3 << 12) | (u4 << 6) | u5;
        }
      }
    }
    if (u0 < 0x10000) {
      str += String.fromCharCode(u0);
    } else {
      var ch = u0 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    }
  }
}
Module['UTF8ArrayToString'] = UTF8ArrayToString;

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function UTF8ToString(ptr) {
  return UTF8ArrayToString(HEAPU8, ptr);
}
Module['UTF8ToString'] = UTF8ToString;

// Copies the given Javascript String object 'str' to the given byte array at address 'outIdx',
// encoded in UTF8 form and null-terminated. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outU8Array: the array to copy to. Each index in this array is assumed to be one 8-byte element.
//   outIdx: The starting offset in the array to begin the copying.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null 
//                    terminator, i.e. if maxBytesToWrite=1, only the null terminator will be written and nothing else.
//                    maxBytesToWrite=0 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0)) // Parameter maxBytesToWrite is not optional. Negative values, 0, null, undefined and false each don't write out any bytes.
    return 0;

  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
    if (u <= 0x7F) {
      if (outIdx >= endIdx) break;
      outU8Array[outIdx++] = u;
    } else if (u <= 0x7FF) {
      if (outIdx + 1 >= endIdx) break;
      outU8Array[outIdx++] = 0xC0 | (u >> 6);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0xFFFF) {
      if (outIdx + 2 >= endIdx) break;
      outU8Array[outIdx++] = 0xE0 | (u >> 12);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0x1FFFFF) {
      if (outIdx + 3 >= endIdx) break;
      outU8Array[outIdx++] = 0xF0 | (u >> 18);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0x3FFFFFF) {
      if (outIdx + 4 >= endIdx) break;
      outU8Array[outIdx++] = 0xF8 | (u >> 24);
      outU8Array[outIdx++] = 0x80 | ((u >> 18) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else {
      if (outIdx + 5 >= endIdx) break;
      outU8Array[outIdx++] = 0xFC | (u >> 30);
      outU8Array[outIdx++] = 0x80 | ((u >> 24) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 18) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    }
  }
  // Null-terminate the pointer to the buffer.
  outU8Array[outIdx] = 0;
  return outIdx - startIdx;
}
Module['stringToUTF8Array'] = stringToUTF8Array;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF8 form. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8(str, outPtr, maxBytesToWrite) {
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
}
Module['stringToUTF8'] = stringToUTF8;

// Returns the number of bytes the given Javascript string takes if encoded as a UTF8 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF8(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
    if (u <= 0x7F) {
      ++len;
    } else if (u <= 0x7FF) {
      len += 2;
    } else if (u <= 0xFFFF) {
      len += 3;
    } else if (u <= 0x1FFFFF) {
      len += 4;
    } else if (u <= 0x3FFFFFF) {
      len += 5;
    } else {
      len += 6;
    }
  }
  return len;
}
Module['lengthBytesUTF8'] = lengthBytesUTF8;

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function UTF16ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16 form. The copy will require at most str.length*4+2 bytes of space in the HEAP.
// Use the function lengthBytesUTF16() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null 
//                    terminator, i.e. if maxBytesToWrite=2, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<2 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF16(str, outPtr, maxBytesToWrite) {
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF16(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 2) return 0;
  maxBytesToWrite -= 2; // Null terminator.
  var startPtr = outPtr;
  var numCharsToWrite = (maxBytesToWrite < str.length*2) ? (maxBytesToWrite / 2) : str.length;
  for (var i = 0; i < numCharsToWrite; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[((outPtr)>>1)]=codeUnit;
    outPtr += 2;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[((outPtr)>>1)]=0;
  return outPtr - startPtr;
}
Module['stringToUTF16'] = stringToUTF16;

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF16(str) {
  return str.length*2;
}
Module['lengthBytesUTF16'] = lengthBytesUTF16;

function UTF32ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32 form. The copy will require at most str.length*4+4 bytes of space in the HEAP.
// Use the function lengthBytesUTF32() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null 
//                    terminator, i.e. if maxBytesToWrite=4, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<4 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF32(str, outPtr, maxBytesToWrite) {
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF32(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 4) return 0;
  var startPtr = outPtr;
  var endPtr = startPtr + maxBytesToWrite - 4;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++i);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[((outPtr)>>2)]=codeUnit;
    outPtr += 4;
    if (outPtr + 4 > endPtr) break;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[((outPtr)>>2)]=0;
  return outPtr - startPtr;
}
Module['stringToUTF32'] = stringToUTF32;

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF32(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i);
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) ++i; // possibly a lead surrogate, so skip over the tail surrogate.
    len += 4;
  }

  return len;
}
Module['lengthBytesUTF32'] = lengthBytesUTF32;

function demangle(func) {
  var hasLibcxxabi = !!Module['___cxa_demangle'];
  if (hasLibcxxabi) {
    try {
      var buf = _malloc(func.length);
      writeStringToMemory(func.substr(1), buf);
      var status = _malloc(4);
      var ret = Module['___cxa_demangle'](buf, 0, 0, status);
      if (getValue(status, 'i32') === 0 && ret) {
        return Pointer_stringify(ret);
      }
      // otherwise, libcxxabi failed, we can try ours which may return a partial result
    } catch(e) {
      // failure when using libcxxabi, we can try ours which may return a partial result
    } finally {
      if (buf) _free(buf);
      if (status) _free(status);
      if (ret) _free(ret);
    }
  }
  var i = 3;
  // params, etc.
  var basicTypes = {
    'v': 'void',
    'b': 'bool',
    'c': 'char',
    's': 'short',
    'i': 'int',
    'l': 'long',
    'f': 'float',
    'd': 'double',
    'w': 'wchar_t',
    'a': 'signed char',
    'h': 'unsigned char',
    't': 'unsigned short',
    'j': 'unsigned int',
    'm': 'unsigned long',
    'x': 'long long',
    'y': 'unsigned long long',
    'z': '...'
  };
  var subs = [];
  var first = true;
  function dump(x) {
    //return;
    if (x) Module.print(x);
    Module.print(func);
    var pre = '';
    for (var a = 0; a < i; a++) pre += ' ';
    Module.print (pre + '^');
  }
  function parseNested() {
    i++;
    if (func[i] === 'K') i++; // ignore const
    var parts = [];
    while (func[i] !== 'E') {
      if (func[i] === 'S') { // substitution
        i++;
        var next = func.indexOf('_', i);
        var num = func.substring(i, next) || 0;
        parts.push(subs[num] || '?');
        i = next+1;
        continue;
      }
      if (func[i] === 'C') { // constructor
        parts.push(parts[parts.length-1]);
        i += 2;
        continue;
      }
      var size = parseInt(func.substr(i));
      var pre = size.toString().length;
      if (!size || !pre) { i--; break; } // counter i++ below us
      var curr = func.substr(i + pre, size);
      parts.push(curr);
      subs.push(curr);
      i += pre + size;
    }
    i++; // skip E
    return parts;
  }
  function parse(rawList, limit, allowVoid) { // main parser
    limit = limit || Infinity;
    var ret = '', list = [];
    function flushList() {
      return '(' + list.join(', ') + ')';
    }
    var name;
    if (func[i] === 'N') {
      // namespaced N-E
      name = parseNested().join('::');
      limit--;
      if (limit === 0) return rawList ? [name] : name;
    } else {
      // not namespaced
      if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
      var size = parseInt(func.substr(i));
      if (size) {
        var pre = size.toString().length;
        name = func.substr(i + pre, size);
        i += pre + size;
      }
    }
    first = false;
    if (func[i] === 'I') {
      i++;
      var iList = parse(true);
      var iRet = parse(true, 1, true);
      ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
    } else {
      ret = name;
    }
    paramLoop: while (i < func.length && limit-- > 0) {
      //dump('paramLoop');
      var c = func[i++];
      if (c in basicTypes) {
        list.push(basicTypes[c]);
      } else {
        switch (c) {
          case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
          case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
          case 'L': { // literal
            i++; // skip basic type
            var end = func.indexOf('E', i);
            var size = end - i;
            list.push(func.substr(i, size));
            i += size + 2; // size + 'EE'
            break;
          }
          case 'A': { // array
            var size = parseInt(func.substr(i));
            i += size.toString().length;
            if (func[i] !== '_') throw '?';
            i++; // skip _
            list.push(parse(true, 1, true)[0] + ' [' + size + ']');
            break;
          }
          case 'E': break paramLoop;
          default: ret += '?' + c; break paramLoop;
        }
      }
    }
    if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
    if (rawList) {
      if (ret) {
        list.push(ret + '?');
      }
      return list;
    } else {
      return ret + flushList();
    }
  }
  var parsed = func;
  try {
    // Special-case the entry point, since its name differs from other name mangling.
    if (func == 'Object._main' || func == '_main') {
      return 'main()';
    }
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    parsed = parse();
  } catch(e) {
    parsed += '?';
  }
  if (parsed.indexOf('?') >= 0 && !hasLibcxxabi) {
    Runtime.warnOnce('warning: a problem occurred in builtin C++ name demangling; build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling');
  }
  return parsed;
}

function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}

function jsStackTrace() {
  var err = new Error();
  if (!err.stack) {
    // IE10+ special cases: It does have callstack info, but it is only populated if an Error object is thrown,
    // so try that as a special-case.
    try {
      throw new Error(0);
    } catch(e) {
      err = e;
    }
    if (!err.stack) {
      return '(no stack trace available)';
    }
  }
  return err.stack.toString();
}

function stackTrace() {
  return demangleAll(jsStackTrace());
}
Module['stackTrace'] = stackTrace;

// Memory management

var PAGE_SIZE = 4096;

function alignMemoryPage(x) {
  if (x % 4096 > 0) {
    x += (4096 - (x % 4096));
  }
  return x;
}

var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk

function enlargeMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.');
}


var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;


var totalMemory = 64*1024;
while (totalMemory < TOTAL_MEMORY || totalMemory < 2*TOTAL_STACK) {
  if (totalMemory < 16*1024*1024) {
    totalMemory *= 2;
  } else {
    totalMemory += 16*1024*1024
  }
}
if (totalMemory !== TOTAL_MEMORY) {
  Module.printErr('increasing TOTAL_MEMORY to ' + totalMemory + ' to be compliant with the asm.js spec (and given that TOTAL_STACK=' + TOTAL_STACK + ')');
  TOTAL_MEMORY = totalMemory;
}



// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'JS engine does not provide full typed array support');


var buffer = new ArrayBuffer(TOTAL_MEMORY);

HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);

// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');

Module['HEAP'] = HEAP;
Module['buffer'] = buffer;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited

var runtimeInitialized = false;
var runtimeExited = false;

function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
  runtimeExited = true;
}

function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;

function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;

// Tools


function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var len = length > 0 ? length : lengthBytesUTF8(stringy)+1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) u8array.length = numBytesWritten;
  return u8array;
}
Module['intArrayFromString'] = intArrayFromString;

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
        assert(false, 'Character code ' + chr + ' (' + String.fromCharCode(chr) + ')  at offset ' + i + ' not in 0x00-0xFF.');
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;

function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))>>0)]=chr;
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[((buffer++)>>0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; ++i) {
    assert(str.charCodeAt(i) === str.charCodeAt(i)&0xff);
    HEAP8[((buffer++)>>0)]=str.charCodeAt(i);
  }
  // Null-terminate the pointer to the HEAP.
  if (!dontAddNull) HEAP8[((buffer)>>0)]=0;
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;

function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}

// check for imul support, and also for correctness ( https://bugs.webkit.org/show_bug.cgi?id=126345 )
if (!Math['imul'] || Math['imul'](0xffffffff, 5) !== -5) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];


if (!Math['clz32']) Math['clz32'] = function(x) {
  x = x >>> 0;
  for (var i = 0; i < 32; i++) {
    if (x & (1 << (31 - i))) return i;
  }
  return 32;
};
Math.clz32 = Math['clz32']

var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;
var Math_clz32 = Math.clz32;

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
var runDependencyTracking = {};

function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(function() {
        if (ABORT) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
          return;
        }
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            Module.printErr('still waiting on run dependencies:');
          }
          Module.printErr('dependency: ' + dep);
        }
        if (shown) {
          Module.printErr('(end of list)');
        }
      }, 10000);
    }
  } else {
    Module.printErr('warning: run dependency added without ID');
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    Module.printErr('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data


var memoryInitializer = null;

// === Body ===





STATIC_BASE = 8;

STATICTOP = STATIC_BASE + 125504;
  /* global initializers */ __ATINIT__.push();
  

/* memory initializer */ allocate([117,116,102,56,0,0,200,119,99,104,97,114,116,0,0,198,117,99,115,50,0,117,99,115,50,98,101,0,0,196,117,99,115,50,108,101,0,0,197,117,116,102,49,54,0,117,116,102,49,54,98,101,0,0,194,117,116,102,49,54,108,101,0,0,193,117,99,115,52,0,117,99,115,52,98,101,0,117,116,102,51,50,0,117,116,102,51,50,98,101,0,0,192,117,99,115,52,108,101,0,117,116,102,51,50,108,101,0,0,195,97,115,99,105,105,0,117,115,97,115,99,105,105,0,105,115,111,54,52,54,0,105,115,111,54,52,54,117,115,0,0,199,101,117,99,106,112,0,0,208,115,104,105,102,116,106,105,115,0,115,106,105,115,0,0,209,103,98,49,56,48,51,48,0,0,216,103,98,107,0,0,217,103,98,50,51,49,50,0,0,218,98,105,103,53,0,98,105,103,102,105,118,101,0,99,112,57,53,48,0,98,105,103,53,104,107,115,99,115,0,0,224,101,117,99,107,114,0,107,115,99,53,54,48,49,0,107,115,120,49,48,48,49,0,99,112,57,52,57,0,0,232,105,115,111,56,56,53,57,49,0,108,97,116,105,110,49,0,0,128,105,115,111,56,56,53,57,50,0,0,32,0,84,0,137,18,0,32,1,6,0,0,152,65,134,26,127,0,48,72,32,0,88,32,201,18,0,36,17,198,35,0,156,81,198,26,128,80,66,136,32,90,0,0,192,4,0,16,113,1,0,29,0,112,2,0,41,0,0,192,7,33,48,1,5,0,0,88,1,0,0,94,208,1,128,29,0,0,128,6,0,91,0,0,0,5,0,20,129,1,0,30,0,128,2,0,42,0,0,0,8,34,52,17,5,0,0,92,1,0,0,95,212,1,192,29,0,0,144,70,36,105,115,111,56,56,53,57,51,0,0,32,0,212,0,9,0,0,4,48,3,0,0,244,64,70,11,63,0,16,64,32,0,216,0,0,0,0,0,64,3,0,0,248,80,134,11,64,0,16,128,32,0,0,0,64,0,0,108,144,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,188,0,0,0,43,0,0,0,0,0,200,33,6,0,0,0,0,64,0,0,112,160,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,192,0,0,0,44,0,0,0,0,0,204,49,70,36,105,115,111,56,56,53,57,52,0,0,32,0,84,48,4,23,0,220,96,4,0,0,152,49,66,12,108,0,48,8,0,0,88,32,73,23,0,224,112,196,35,0,156,65,130,12,109,72,65,200,20,17,0,0,0,0,0,0,0,192,14,29,0,112,2,0,37,0,0,64,14,33,56,65,69,16,0,0,0,0,0,0,224,1,0,0,0,184,1,7,0,18,0,0,0,0,0,0,0,0,15,30,0,128,2,0,38,0,0,128,14,34,60,81,133,16,0,0,0,0,0,0,228,1,0,0,0,188,17,71,36,105,115,111,56,56,53,57,53,0,0,32,0,136,51,14,57,229,152,115,14,58,233,168,179,14,59,237,0,224,206,59,240,196,35,207,60,244,212,99,207,61,248,228,163,207,62,252,244,227,207,63,0,5,36,208,64,4,21,100,208,65,8,37,164,208,66,12,53,228,208,67,16,69,36,209,68,20,85,100,209,69,24,101,164,209,70,28,117,228,209,71,32,133,36,210,72,36,149,100,210,73,40,165,164,210,74,44,181,228,210,75,53,194,20,147,76,51,209,84,147,77,55,225,148,147,78,59,13,192,83,79,105,115,111,56,56,53,57,54,0,0,32,0,4,16,64,0,0,4,16,64,0,1,4,16,64,0,115,1,16,64,0,1,4,16,64,0,1,4,16,64,0,1,4,16,0,93,1,4,16,64,93,1,216,117,23,94,121,233,181,23,95,125,249,245,23,96,129,9,54,24,97,133,25,118,24,98,137,41,182,24,99,141,57,246,88,0,1,4,16,64,0,144,69,38,217,100,148,85,102,217,101,152,101,166,217,102,156,117,230,217,103,160,133,38,90,0,1,4,16,64,0,1,4,16,64,0,1,4,16,64,0,105,115,111,56,56,53,57,55,0,0,32,0,144,88,34,0,51,210,8,0,0,0,0,160,9,0,0,0,16,128,136,0,0,0,0,0,155,112,210,9,0,158,124,2,10,0,161,0,32,202,40,164,148,98,202,41,168,164,162,202,42,172,180,226,202,43,176,196,34,203,44,180,212,18,128,45,183,224,146,139,46,187,240,210,139,47,191,0,19,140,48,195,16,83,140,49,199,32,147,140,50,203,48,211,140,51,207,64,19,141,52,211,80,83,141,53,215,96,147,141,54,219,112,211,141,55,223,128,19,78,0,105,115,111,56,56,53,57,56,0,0,32,0,4,0,0,0,0,0,0,0,0,0,0,192,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,240,0,0,0,0,0,64,0,1,4,16,64,0,1,4,16,64,0,1,4,16,64,0,1,4,16,64,0,1,4,16,64,0,1,4,16,64,0,1,4,16,64,0,1,4,16,192,136,83,81,85,149,85,87,97,149,149,86,91,113,213,149,87,95,129,21,150,88,99,145,85,150,89,103,161,149,150,90,107,177,213,86,0,1,120,248,97,0,105,115,111,56,56,53,57,57,0,0,80,45,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,244,64,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,46,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,248,80,6,0,105,115,111,56,56,53,57,49,48,0,0,32,0,84,48,66,12,57,220,16,4,0,70,132,96,6,27,131,0,0,135,20,0,88,64,130,12,58,224,32,4,0,71,136,112,70,27,132,136,24,199,20,17,0,0,0,0,0,0,0,192,14,29,0,112,2,0,37,0,0,0,0,0,56,65,5,0,0,0,0,128,27,0,224,1,0,0,0,0,0,0,0,18,0,0,0,0,0,0,0,0,15,30,0,128,2,0,38,0,0,0,0,0,60,81,5,0,0,0,0,192,27,0,228,1,0,0,0,0,0,192,16,105,115,111,56,56,53,57,49,49,0,116,105,115,54,50,48,0,0,32,0,188,6,91,108,178,205,70,91,109,182,221,134,91,110,186,237,198,91,111,190,253,6,92,112,194,13,71,92,113,198,29,135,92,114,202,45,199,92,115,206,61,7,93,116,210,77,71,93,117,214,93,135,93,118,218,109,199,93,119,222,125,7,94,120,226,141,71,94,121,230,157,135,94,0,1,4,16,64,122,234,173,199,94,123,238,189,7,95,124,242,205,71,95,125,246,221,135,95,126,250,237,199,95,127,254,253,7,96,128,2,14,72,96,129,1,4,16,64,0,105,115,111,56,56,53,57,49,51,0,0,32,0,160,8,0,0,0,164,8,0,0,13,0,192,5,0,0,0,0,192,2,0,0,0,0,0,39,2,0,0,0,16,0,208,5,0,0,0,0,128,3,21,236,16,193,5,0,0,112,194,8,29,0,240,71,9,49,4,145,131,17,102,48,225,4,0,84,0,0,0,0,120,40,1,6,28,0,4,50,8,0,22,240,32,1,6,0,0,128,2,9,30,0,0,136,9,50,8,161,195,17,103,52,241,4,0,85,0,0,0,0,121,44,17,70,28,0,8,66,72,137,105,115,111,56,56,53,57,49,52,0,0,32,0,24,120,32,0,27,112,128,32,0,20,2,96,97,130,26,2,0,128,31,10,46,248,2,12,12,54,8,128,131,21,62,120,33,132,27,98,152,97,132,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,122,0,0,0,0,0,0,0,128,132,0,0,0,0,0,0,0,192,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,123,0,0,0,0,0,0,0,192,132,0,0,0,0,0,0,0,208,7,0,105,115,111,56,56,53,57,49,53,0,108,97,116,105,110,57,0,0,36,51,2,96,6,0,103,0,0,0,0,0,0,0,0,0,0,0,0,0,0,131,0,0,0,0,132,0,0,0,0,88,100,225,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,105,115,111,56,56,53,57,49,54,0,0,32,0,84,96,129,18,51,166,104,6,0,103,0,160,8,0,127,0,0,72,32,0,0,208,193,18,131,160,8,0,0,132,120,176,8,0,88,100,225,135,32,0,0,0,192,4,0,92,0,0,0,0,0,0,0,0,0,0,0,0,0,33,48,1,0,0,0,88,1,0,24,118,0,0,0,0,0,156,192,8,0,0,0,0,0,5,0,96,0,0,0,0,0,0,0,0,0,0,0,0,0,34,52,1,0,0,0,92,1,64,24,119,0,0,0,0,0,160,208,8,0,99,112,49,50,53,48,0,119,105,110,100,111,119,115,49,50,53,48,0,0,0,51,6,96,98,0,41,182,168,226,138,1,184,104,198,139,96,168,49,200,31,1,144,88,226,137,40,178,8,98,136,1,216,120,6,140,97,172,65,8,32,0,60,2,137,18,0,84,0,0,0,0,0,64,6,0,0,0,0,64,32,0,0,32,201,18,0,0,0,0,0,0,88,80,6,0,72,80,146,132,32,90,0,0,192,4,0,16,113,1,0,29,0,112,2,0,41,0,0,192,7,33,48,1,5,0,0,88,1,0,0,94,208,1,128,29,0,0,128,6,0,91,0,0,0,5,0,20,129,1,0,30,0,128,2,0,42,0,0,0,8,34,52,17,5,0,0,92,1,0,0,95,212,1,192,29,0,0,144,70,36,99,112,49,50,53,49,0,119,105,110,100,111,119,115,49,50,53,49,0,0,0,227,144,99,162,76,41,182,168,226,138,51,186,168,206,139,235,180,195,206,59,49,145,88,226,137,40,178,8,98,136,1,216,136,19,140,57,237,164,83,79,0,184,195,83,58,0,248,4,0,0,226,0,80,14,0,0,0,0,0,58,0,0,112,78,77,63,1,0,0,0,48,213,56,19,0,55,153,67,147,77,240,196,35,207,60,244,212,99,207,61,248,228,163,207,62,252,244,227,207,63,0,5,36,208,64,4,21,100,208,65,8,37,164,208,66,12,53,228,208,67,16,69,36,209,68,20,85,100,209,69,24,101,164,209,70,28,117,228,209,71,32,133,36,210,72,36,149,100,210,73,40,165,164,210,74,44,181,228,210,75,99,112,49,50,53,50,0,119,105,110,100,111,119,115,49,50,53,50,0,0,0,51,6,96,98,33,41,182,168,226,138,142,184,104,198,139,88,4,48,72,0,1,144,88,226,137,40,178,8,98,136,147,216,120,6,140,89,4,64,136,31,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,99,112,49,50,53,51,0,119,105,110,100,111,119,115,49,50,53,51,0,0,0,51,6,96,98,33,41,182,168,226,138,1,184,24,192,139,1,4,16,64,0,1,144,88,226,137,40,178,8,98,136,1,216,24,0,140,1,4,16,64,0,0,112,210,9,0,0,0,0,0,0,0,0,16,0,0,0,0,0,128,136,0,0,0,0,0,155,0,0,0,0,158,124,2,10,0,161,0,32,202,40,164,148,98,202,41,168,164,162,202,42,172,180,226,202,43,176,196,34,203,44,180,212,18,128,45,183,224,146,139,46,187,240,210,139,47,191,0,19,140,48,195,16,83,140,49,199,32,147,140,50,203,48,211,140,51,207,64,19,141,52,211,80,83,141,53,215,96,147,141,54,219,112,211,141,55,223,128,19,78,0,99,112,49,50,53,52,0,119,105,110,100,111,119,115,49,50,53,52,0,0,0,51,6,96,98,33,41,182,168,226,138,142,184,104,198,139,88,4,16,64,0,1,144,88,226,137,40,178,8,98,136,147,216,120,6,140,89,4,16,128,31,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,45,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,244,64,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,46,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,248,80,6,0,99,112,49,50,53,53,0,119,105,110,100,111,119,115,49,50,53,53,0,0,0,51,6,96,98,33,41,182,168,226,138,142,184,24,192,139,1,4,16,64,0,1,144,88,226,137,40,178,8,98,136,147,216,24,0,140,1,4,16,64,0,0,0,0,0,0,49,2,0,0,0,0,0,192,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,240,0,0,0,0,0,0,0,64,5,37,212,80,68,21,101,212,81,72,37,21,128,82,75,49,213,148,83,79,65,21,149,84,110,189,5,87,92,114,5,16,64,0,1,4,16,64,0,83,81,85,149,85,87,97,149,149,86,91,113,213,149,87,95,129,21,150,88,99,145,85,150,89,103,161,149,150,90,107,177,213,86,0,1,120,248,97,0,99,112,49,50,53,54,0,119,105,110,100,111,119,115,49,50,53,54,0,0,0,51,146,102,98,33,41,182,168,226,138,142,184,56,218,139,88,148,134,154,105,170,145,88,226,137,40,178,8,98,136,169,217,120,26,140,89,112,216,225,106,0,204,5,0,0,0,0,0,0,0,0,0,192,26,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,23,0,0,0,0,64,93,173,217,117,23,94,121,233,181,23,95,125,249,245,23,96,129,9,54,24,97,133,25,118,24,98,137,41,182,24,0,140,53,230,216,99,144,69,38,217,100,0,80,6,64,101,150,93,134,25,0,0,0,0,0,0,153,105,6,0,0,155,113,214,153,103,0,124,6,26,0,161,1,32,26,0,0,120,248,161,107,99,112,49,50,53,55,0,119,105,110,100,111,119,115,49,50,53,55,0,0,0,51,6,96,98,0,41,182,168,226,138,1,184,24,192,139,1,16,240,136,2,1,144,88,226,137,40,178,8,98,136,1,216,24,0,140,1,24,32,73,0,0,4,0,0,0,0,4,0,0,0,13,0,192,5,0,0,0,0,192,2,0,0,0,0,0,0,0,0,0,0,16,0,208,5,0,0,0,0,128,3,21,236,16,193,5,0,0,112,194,8,29,0,240,71,9,49,4,145,131,17,102,48,225,4,0,84,0,0,0,0,120,40,1,6,28,0,4,50,8,0,22,240,32,1,6,0,0,128,2,9,30,0,0,136,9,50,8,161,195,17,103,52,241,4,0,85,0,0,0,0,121,44,17,70,28,0,8,66,72,36,99,112,49,50,53,56,0,119,105,110,100,111,119,115,49,50,53,56,0,0,0,51,6,96,98,33,41,182,168,226,138,142,184,24,192,139,88,4,16,64,0,1,144,88,226,137,40,178,8,98,136,147,216,24,0,140,89,4,16,128,31,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,4,0,0,0,0,0,0,0,0,0,0,149,0,0,0,0,33,0,128,9,0,0,24,2,0,0,0,0,0,0,0,0,32,114,9,0,0,0,0,0,5,0,0,0,0,0,0,0,0,0,0,150,0,0,0,0,34,0,144,9,0,0,28,2,0,0,0,0,0,0,0,0,36,34,35,0,107,111,105,56,114,0,0,0,62,254,8,100,144,66,14,73,100,145,70,30,137,164,153,103,162,153,166,154,107,178,217,38,143,110,222,136,99,142,58,238,40,64,143,7,32,144,192,3,73,42,185,36,76,76,54,233,228,147,80,70,41,229,148,84,86,105,229,149,88,102,169,165,56,91,114,217,165,151,95,130,25,166,152,99,146,89,102,1,46,65,20,145,73,20,85,68,210,68,37,97,148,145,70,27,113,212,145,71,31,189,4,82,72,34,141,100,145,68,44,173,116,17,74,45,165,116,146,74,14,193,19,143,65,244,212,67,208,60,5,225,147,143,62,251,240,211,143,63,255,60,4,80,64,2,13,100,143,60,12,45,116,15,66,13,37,116,144,66,107,111,105,56,117,0,0,0,62,254,8,100,144,66,14,73,100,145,70,30,137,164,153,103,162,153,166,154,107,178,217,38,143,110,222,136,99,142,58,238,40,64,143,7,32,144,192,3,73,42,185,36,76,51,53,89,147,77,80,70,41,229,148,84,254,100,229,149,88,102,169,165,56,229,112,121,14,58,95,130,25,166,152,99,250,84,102,1,46,65,20,145,73,20,85,68,210,68,37,97,148,145,70,27,113,212,145,71,31,189,4,82,72,34,141,100,145,68,44,173,116,17,74,45,165,116,146,74,14,193,19,143,65,244,212,67,208,60,5,225,147,143,62,251,240,211,143,63,255,60,4,80,64,2,13,100,143,60,12,45,116,15,66,13,37,116,144,66,0,0,0,0,0,0,0,0,0,48,1,48,2,48,12,255,14,255,251,48,26,255,27,255,31,255,1,255,155,48,156,48,180,0,64,255,168,0,62,255,227,255,63,255,253,48,254,48,157,48,158,48,3,48,221,78,5,48,6,48,7,48,252,48,21,32,16,32,15,255,92,0,28,48,22,32,92,255,38,32,37,32,24,32,25,32,28,32,29,32,8,255,9,255,20,48,21,48,59,255,61,255,91,255,93,255,8,48,9,48,10,48,11,48,12,48,13,48,14,48,15,48,16,48,17,48,11,255,18,34,177,0,215,0,247,0,29,255,96,34,28,255,30,255,102,34,103,34,30,34,52,34,66,38,64,38,176,0,50,32,51,32,3,33,229,255,4,255,162,0,163,0,5,255,3,255,6,255,10,255,32,255,167,0,6,38,5,38,203,37,207,37,206,37,199,37,198,37,161,37,160,37,179,37,178,37,189,37,188,37,59,32,18,48,146,33,144,33,145,33,147,33,19,48,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,34,11,34,134,34,135,34,130,34,131,34,42,34,41,34,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,39,34,40,34,172,0,210,33,212,33,0,34,3,34,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,34,165,34,18,35,2,34,7,34,97,34,82,34,106,34,107,34,26,34,61,34,29,34,53,34,43,34,44,34,0,0,0,0,0,0,0,0,0,0,0,0,0,0,43,33,48,32,111,38,109,38,106,38,32,32,33,32,182,0,0,0,0,0,0,0,0,0,239,37,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,255,17,255,18,255,19,255,20,255,21,255,22,255,23,255,24,255,25,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,33,255,34,255,35,255,36,255,37,255,38,255,39,255,40,255,41,255,42,255,43,255,44,255,45,255,46,255,47,255,48,255,49,255,50,255,51,255,52,255,53,255,54,255,55,255,56,255,57,255,58,255,0,0,0,0,0,0,0,0,0,0,0,0,65,255,66,255,67,255,68,255,69,255,70,255,71,255,72,255,73,255,74,255,75,255,76,255,77,255,78,255,79,255,80,255,81,255,82,255,83,255,84,255,85,255,86,255,87,255,88,255,89,255,90,255,0,0,0,0,0,0,0,0,65,48,66,48,67,48,68,48,69,48,70,48,71,48,72,48,73,48,74,48,75,48,76,48,77,48,78,48,79,48,80,48,81,48,82,48,83,48,84,48,85,48,86,48,87,48,88,48,89,48,90,48,91,48,92,48,93,48,94,48,95,48,96,48,97,48,98,48,99,48,100,48,101,48,102,48,103,48,104,48,105,48,106,48,107,48,108,48,109,48,110,48,111,48,112,48,113,48,114,48,115,48,116,48,117,48,118,48,119,48,120,48,121,48,122,48,123,48,124,48,125,48,126,48,127,48,128,48,129,48,130,48,131,48,132,48,133,48,134,48,135,48,136,48,137,48,138,48,139,48,140,48,141,48,142,48,143,48,144,48,145,48,146,48,147,48,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,161,48,162,48,163,48,164,48,165,48,166,48,167,48,168,48,169,48,170,48,171,48,172,48,173,48,174,48,175,48,176,48,177,48,178,48,179,48,180,48,181,48,182,48,183,48,184,48,185,48,186,48,187,48,188,48,189,48,190,48,191,48,192,48,193,48,194,48,195,48,196,48,197,48,198,48,199,48,200,48,201,48,202,48,203,48,204,48,205,48,206,48,207,48,208,48,209,48,210,48,211,48,212,48,213,48,214,48,215,48,216,48,217,48,218,48,219,48,220,48,221,48,222,48,223,48,224,48,225,48,226,48,227,48,228,48,229,48,230,48,231,48,232,48,233,48,234,48,235,48,236,48,237,48,238,48,239,48,240,48,241,48,242,48,243,48,244,48,245,48,246,48,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,145,3,146,3,147,3,148,3,149,3,150,3,151,3,152,3,153,3,154,3,155,3,156,3,157,3,158,3,159,3,160,3,161,3,163,3,164,3,165,3,166,3,167,3,168,3,169,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,177,3,178,3,179,3,180,3,181,3,182,3,183,3,184,3,185,3,186,3,187,3,188,3,189,3,190,3,191,3,192,3,193,3,195,3,196,3,197,3,198,3,199,3,200,3,201,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,4,17,4,18,4,19,4,20,4,21,4,1,4,22,4,23,4,24,4,25,4,26,4,27,4,28,4,29,4,30,4,31,4,32,4,33,4,34,4,35,4,36,4,37,4,38,4,39,4,40,4,41,4,42,4,43,4,44,4,45,4,46,4,47,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,4,49,4,50,4,51,4,52,4,53,4,81,4,54,4,55,4,56,4,57,4,58,4,59,4,60,4,61,4,62,4,63,4,64,4,65,4,66,4,67,4,68,4,69,4,70,4,71,4,72,4,73,4,74,4,75,4,76,4,77,4,78,4,79,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,37,2,37,12,37,16,37,24,37,20,37,28,37,44,37,36,37,52,37,60,37,1,37,3,37,15,37,19,37,27,37,23,37,35,37,51,37,43,37,59,37,75,37,32,37,47,37,40,37,55,37,63,37,29,37,48,37,37,37,56,37,66,37], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);
/* memory initializer */ allocate([156,78,22,85,3,90,63,150,192,84,27,97,40,99,246,89,34,144,117,132,28,131,80,122,170,96,225,99,37,110,237,101,102,132,166,130,245,155,147,104,39,87,161,101,113,98,155,91,208,89,123,134,244,152,98,125,190,125,142,155,22,98,159,124,183,136,137,91,181,94,9,99,151,102,72,104,199,149,141,151,79,103,229,78,10,79,77,79,157,79,73,80,242,86,55,89,212,89,1,90,9,92,223,96,15,97,112,97,19,102,5,105,186,112,79,117,112,117,251,121,173,125,239,125,195,128,14,132,99,136,2,139,85,144,122,144,59,83,149,78,165,78,223,87,178,128,193,144,239,120,0,78,241,88,162,110,56,144,50,122,40,131,139,130,47,156,65,81,112,83,189,84,225,84,224,86,251,89,21,95,242,152,235,109,228,128,45,133,98,150,112,150,160,150,251,151,11,84,243,83,135,91,207,112,189,127,194,143,232,150,111,83,92,157,186,122,17,78,147,120,252,129,38,110,24,86,4,85,29,107,26,133,59,156,229,89,169,83,102,109,220,116,143,149,66,86,145,78,75,144,242,150,79,131,12,153,225,83,182,85,48,91,113,95,32,102,243,102,4,104,56,108,243,108,41,109,91,116,200,118,78,122,52,152,241,130,91,136,96,138,237,146,178,109,171,117,202,118,197,153,166,96,1,139,138,141,178,149,142,105,173,83,134,81,18,87,48,88,68,89,180,91,246,94,40,96,169,99,244,99,191,108,20,111,142,112,20,113,89,113,213,113,63,115,1,126,118,130,209,130,151,133,96,144,91,146,27,157,105,88,188,101,90,108,37,117,249,81,46,89,101,89,128,95,220,95,188,98,250,101,42,106,39,107,180,107,139,115,193,127,86,137,44,157,14,157,196,158,161,92,150,108,123,131,4,81,75,92,182,97,198,129,118,104,97,114,89,78,250,79,120,83,105,96,41,110,79,122,243,151,11,78,22,83,238,78,85,79,61,79,161,79,115,79,160,82,239,83,9,86,15,89,193,90,182,91,225,91,209,121,135,102,156,103,182,103,76,107,179,108,107,112,194,115,141,121,190,121,60,122,135,123,177,130,219,130,4,131,119,131,239,131,211,131,102,135,178,138,41,86,168,140,230,143,78,144,30,151,138,134,196,79,232,92,17,98,89,114,59,117,229,129,189,130,254,134,192,140,197,150,19,153,213,153,203,78,26,79,227,137,222,86,74,88,202,88,251,94,235,95,42,96,148,96,98,96,208,97,18,98,208,98,57,101,65,155,102,102,176,104,119,109,112,112,76,117,134,118,117,125,165,130,249,135,139,149,142,150,157,140,241,81,190,82,22,89,179,84,179,91,22,93,104,97,130,105,175,109,141,120,203,132,87,136,114,138,167,147,184,154,108,109,168,153,217,134,163,87,255,103,206,134,14,146,131,82,135,86,4,84,211,94,225,98,185,100,60,104,56,104,187,107,114,115,186,120,107,122,154,137,210,137,107,141,3,143,237,144,163,149,148,150,105,151,102,91,179,92,125,105,77,152,78,152,155,99,32,123,43,106,127,106,182,104,13,156,95,111,114,82,157,85,112,96,236,98,59,109,7,110,209,110,91,132,16,137,68,143,20,78,57,156,246,83,27,105,58,106,132,151,42,104,92,81,195,122,178,132,220,145,140,147,91,86,40,157,34,104,5,131,49,132,165,124,8,82,197,130,230,116,126,78,131,79,160,81,210,91,10,82,216,82,231,82,251,93,154,85,42,88,230,89,140,91,152,91,219,91,114,94,121,94,163,96,31,97,99,97,190,97,219,99,98,101,209,103,83,104,250,104,62,107,83,107,87,108,34,111,151,111,69,111,176,116,24,117,227,118,11,119,255,122,161,123,33,124,233,125,54,127,240,127,157,128,102,130,158,131,179,137,204,138,171,140,132,144,81,148,147,149,145,149,162,149,101,150,211,151,40,153,24,130,56,78,43,84,184,92,204,93,169,115,76,118,60,119,169,92,235,127,11,141,193,150,17,152,84,152,88,152,1,79,14,79,113,83,156,85,104,86,250,87,71,89,9,91,196,91,144,92,12,94,126,94,204,95,238,99,58,103,215,101,226,101,31,103,203,104,196,104,95,106,48,94,197,107,23,108,125,108,127,117,72,121,99,91,0,122,0,125,189,95,143,137,24,138,180,140,119,141,204,142,29,143,226,152,14,154,60,155,128,78,125,80,0,81,147,89,156,91,47,98,128,98,236,100,58,107,160,114,145,117,71,121,169,127,251,135,188,138,112,139,172,99,202,131,160,151,9,84,3,84,171,85,84,104,88,106,112,138,39,120,117,103,205,158,116,83,162,91,26,129,80,134,6,144,24,78,69,78,199,78,17,79,202,83,56,84,174,91,19,95,37,96,81,101,61,103,66,108,114,108,227,108,120,112,3,116,118,122,174,122,8,123,26,125,254,124,102,125,231,101,91,114,187,83,69,92,232,93,210,98,224,98,25,99,32,110,90,134,49,138,221,141,248,146,1,111,166,121,90,155,168,78,171,78,172,78,155,79,160,79,209,80,71,81,246,122,113,81,246,81,84,83,33,83,127,83,235,83,172,85,131,88,225,92,55,95,74,95,47,96,80,96,109,96,31,99,89,101,75,106,193,108,194,114,237,114,239,119,248,128,5,129,8,130,78,133,247,144,225,147,255,151,87,153,90,154,240,78,221,81,45,92,129,102,109,105,64,92,242,102,117,105,137,115,80,104,129,124,197,80,228,82,71,87,254,93,38,147,164,101,35,107,61,107,52,116,129,121,189,121,75,123,202,125,185,130,204,131,127,136,95,137,57,139,209,143,209,145,31,84,128,146,93,78,54,80,229,83,58,83,215,114,150,115,233,119,230,130,175,142,198,153,200,153,210,153,119,81,26,97,94,134,176,85,122,122,118,80,211,91,71,144,133,150,50,78,219,106,231,145,81,92,72,92,152,99,159,122,147,108,116,151,97,143,170,122,138,113,136,150,130,124,23,104,112,126,81,104,108,147,242,82,27,84,171,133,19,138,164,127,205,142,225,144,102,83,136,136,65,121,194,79,190,80,17,82,68,81,83,85,45,87,234,115,139,87,81,89,98,95,132,95,117,96,118,97,103,97,169,97,178,99,58,100,108,101,111,102,66,104,19,110,102,117,61,122,251,124,76,125,153,125,75,126,107,127,14,131,74,131,205,134,8,138,99,138,102,139,253,142,26,152,143,157,184,130,206,143,232,155,135,82,31,98,131,100,192,111,153,150,65,104,145,80,32,107,122,108,84,111,116,122,80,125,64,136,35,138,8,103,246,78,57,80,38,80,101,80,124,81,56,82,99,82,167,85,15,87,5,88,204,90,250,94,178,97,248,97,243,98,114,99,28,105,41,106,125,114,172,114,46,115,20,120,111,120,121,125,12,119,169,128,139,137,25,139,226,140,210,142,99,144,117,147,122,150,85,152,19,154,120,158,67,81,159,83,179,83,123,94,38,95,27,110,144,110,132,115,254,115,67,125,55,130,0,138,250,138,80,150,78,78,11,80,228,83,124,84,250,86,209,89,100,91,241,93,171,94,39,95,56,98,69,101,175,103,86,110,208,114,202,124,180,136,161,128,225,128,240,131,78,134,135,138,232,141,55,146,199,150,103,152,19,159,148,78,146,78,13,79,72,83,73,84,62,84,47,90,140,95,161,95,159,96,167,104,142,106,90,116,129,120,158,138,164,138,119,139,144,145,94,78,201,155,164,78,124,79,175,79,25,80,22,80,73,81,108,81,159,82,185,82,254,82,154,83,227,83,17,84,14,84,137,85,81,87,162,87,125,89,84,91,93,91,143,91,229,93,231,93,247,93,120,94,131,94,154,94,183,94,24,95,82,96,76,97,151,98,216,98,167,99,59,101,2,102,67,102,244,102,109,103,33,104,151,104,203,105,95,108,42,109,105,109,47,110,157,110,50,117,135,118,108,120,63,122,224,124,5,125,24,125,94,125,177,125,21,128,3,128,175,128,177,128,84,129,143,129,42,130,82,131,76,136,97,136,27,139,162,140,252,140,202,144,117,145,113,146,63,120,252,146,164,149,77,150,5,152,153,153,216,154,59,157,91,82,171,82,247,83,8,84,213,88,247,98,224,111,106,140,95,143,185,158,75,81,59,82,74,84,253,86,64,122,119,145,96,157,210,158,68,115,9,111,112,129,17,117,253,95,218,96,168,154,219,114,188,143,100,107,3,152,202,78,240,86,100,87,190,88,90,90,104,96,199,97,15,102,6,102,57,104,177,104,247,109,213,117,58,125,110,130,66,155,155,78,80,79,201,83,6,85,111,93,230,93,238,93,251,103,153,108,115,116,2,120,80,138,150,147,223,136,80,87,167,94,43,99,181,80,172,80,141,81,0,103,201,84,94,88,187,89,176,91,105,95,77,98,161,99,61,104,115,107,8,110,125,112,199,145,128,114,21,120,38,120,109,121,142,101,48,125,220,131,193,136,9,143,155,150,100,82,40,87,80,103,106,127,161,140,180,81,66,87,42,150,58,88,138,105,180,128,178,84,14,93,252,87,149,120,250,157,92,79,74,82,139,84,62,100,40,102,20,103,245,103,132,122,86,123,34,125,47,147,92,104,173,155,57,123,25,83,138,81,55,82,223,91,246,98,174,100,230,100,45,103,186,107,169,133,209,150,144,118,214,155,76,99,6,147,171,155,191,118,82,102,9,78,152,80,194,83,113,92,232,96,146,100,99,101,95,104,230,113,202,115,35,117,151,123,130,126,149,134,131,139,219,140,120,145,16,153,172,101,171,102,139,107,213,78,212,78,58,79,127,79,58,82,248,83,242,83,227,85,219,86,235,88,203,89,201,89,255,89,80,91,77,92,2,94,43,94,215,95,29,96,7,99,47,101,92,91,175,101,189,101,232,101,157,103,98,107,123,107,15,108,69,115,73,121,193,121,248,124,25,125,43,125,162,128,2,129,243,129,150,137,94,138,105,138,102,138,140,138,238,138,199,140,220,140,204,150,252,152,111,107,139,78,60,79,141,79,80,81,87,91,250,91,72,97,1,99,66,102,33,107,203,110,187,108,62,114,189,116,212,117,193,120,58,121,12,128,51,128,234,129,148,132,158,143,80,108,127,158,15,95,88,139,43,157,250,122,248,142,141,91,235,150,3,78,241,83,247,87,49,89,201,90,164,91,137,96,127,110,6,111,190,117,234,140,159,91,0,133,224,123,114,80,244,103,157,130,97,92,74,133,30,126,14,130,153,81,4,92,104,99,102,141,156,101,110,113,62,121,23,125,5,128,29,139,202,142,110,144,199,134,170,144,31,80,250,82,58,92,83,103,124,112,53,114,76,145,200,145,43,147,229,130,194,91,49,95,249,96,59,78,214,83,136,91,75,98,49,103,138,107,233,114,224,115,46,122,107,129,163,141,82,145,150,153,18,81,215,83,106,84,255,91,136,99,57,106,172,125,0,151,218,86,206,83,104,84,151,91,49,92,222,93,238,79,1,97,254,98,50,109,192,121,203,121,66,125,77,126,210,127,237,129,31,130,144,132,70,136,114,137,144,139,116,142,47,143,49,144,75,145,108,145,198,150,156,145,192,78,79,79,69,81,65,83,147,95,14,98,212,103,65,108,11,110,99,115,38,126,205,145,131,146,212,83,25,89,191,91,209,109,93,121,46,126,155,124,126,88,159,113,250,81,83,136,240,143,202,79,251,92,37,102,172,119,227,122,28,130,255,153,198,81,170,95,236,101,111,105,137,107,243,109,150,110,100,111,254,118,20,125,225,93,117,144,135,145,6,152,230,81,29,82,64,98,145,102,217,102,26,110,182,94,210,125,114,127,248,102,175,133,247,133,248,138,169,82,217,83,115,89,143,94,144,95,85,96,228,146,100,150,183,80,31,81,221,82,32,83,71,83,236,83,232,84,70,85,49,85,23,86,104,89,190,89,60,90,181,91,6,92,15,92,17,92,26,92,132,94,138,94,224,94,112,95,127,98,132,98,219,98,140,99,119,99,7,102,12,102,45,102,118,102,126,103,162,104,31,106,53,106,188,108,136,109,9,110,88,110,60,113,38,113,103,113,199,117,1,119,93,120,1,121,101,121,240,121,224,122,17,123,167,124,57,125,150,128,214,131,139,132,73,133,93,136,243,136,31,138,60,138,84,138,115,138,97,140,222,140,164,145,102,146,126,147,24,148,156,150,152,151,10,78,8,78,30,78,87,78,151,81,112,82,206,87,52,88,204,88,34,91,56,94,197,96,254,100,97,103,86,103,68,109,182,114,115,117,99,122,184,132,114,139,184,145,32,147,49,86,244,87,254,152,237,98,13,105,150,107,237,113,84,126,119,128,114,130,230,137,223,152,85,135,177,143,59,92,56,79,225,79,181,79,7,85,32,90,221,91,233,91,195,95,78,97,47,99,176,101,75,102,238,104,155,105,120,109,241,109,51,117,185,117,31,119,94,121,230,121,51,125,227,129,175,130,170,133,170,137,58,138,171,142,155,143,50,144,221,145,7,151,186,78,193,78,3,82,117,88,236,88,11,92,26,117,61,92,78,129,10,138,197,143,99,150,109,151,37,123,207,138,8,152,98,145,243,86,168,83,23,144,57,84,130,87,37,94,168,99,52,108,138,112,97,119,139,124,224,127,112,136,66,144,84,145,16,147,24,147,143,150,94,116,196,154,7,93,105,93,112,101,162,103,168,141,219,150,110,99,73,103,25,105,197,131,23,152,192,150,254,136,132,111,122,100,248,91,22,78,44,112,93,117,47,102,196,81,54,82,226,82,211,89,129,95,39,96,16,98,63,101,116,101,31,102,116,102,242,104,22,104,99,107,5,110,114,114,31,117,219,118,190,124,86,128,240,88,253,136,127,137,160,138,147,138,203,138,29,144,146,145,82,151,89,151,137,101,14,122,6,129,187,150,45,94,220,96,26,98,165,101,20,102,144,103,243,119,77,122,77,124,62,126,10,129,172,140,100,141,225,141,95,142,169,120,7,82,217,98,165,99,66,100,152,98,45,138,131,122,192,123,172,138,234,150,118,125,12,130,73,135,217,78,72,81,67,83,96,83,163,91,2,92,22,92,221,93,38,98,71,98,176,100,19,104,52,104,201,108,69,109,23,109,211,103,92,111,78,113,125,113,203,101,127,122,173,123,218,125,74,126,168,127,122,129,27,130,57,130,166,133,110,138,206,140,245,141,120,144,119,144,173,146,145,146,131,149,174,155,77,82,132,85,56,111,54,113,104,81,133,121,85,126,179,129,206,124,76,86,81,88,168,92,170,99,254,102,253,102,90,105,217,114,143,117,142,117,14,121,86,121,223,121,151,124,32,125,68,125,7,134,52,138,59,150,97,144,32,159,231,80,117,82,204,83,226,83,9,80,170,85,238,88,79,89,61,114,139,91,100,92,29,83,227,96,243,96,92,99,131,99,63,99,187,99,205,100,233,101,249,102,227,93,205,105,253,105,21,111,229,113,137,78,233,117,248,118,147,122,223,124,207,125,156,125,97,128,73,131,88,131,108,132,188,132,251,133,197,136,112,141,1,144,109,144,151,147,28,151,18,154,207,80,151,88,142,97,211,129,53,133,8,141,32,144,195,79,116,80,71,82,115,83,111,96,73,99,95,103,44,110,179,141,31,144,215,79,94,92,202,140,207,101,154,125,82,83,150,136,118,81,195,99,88,91,107,91,10,92,13,100,81,103,92,144,214,78,26,89,42,89,112,108,81,138,62,85,21,88,165,89,240,96,83,98,193,103,53,130,85,105,64,150,196,153,40,154,83,79,6,88,254,91,16,128,177,92,47,94,133,95,32,96,75,97,52,98,255,102,240,108,222,110,206,128,127,129,212,130,139,136,184,140,0,144,46,144,138,150,219,158,219,155,227,78,240,83,39,89,44,123,141,145,76,152,249,157,221,110,39,112,83,83,68,85,133,91,88,98,158,98,211,98,162,108,239,111,34,116,23,138,56,148,193,111,254,138,56,131,231,81,248,134,234,83,233,83,70,79,84,144,176,143,106,89,49,129,253,93,234,122,191,143,218,104,55,140,248,114,72,156,61,106,176,138,57,78,88,83,6,86,102,87,197,98,162,99,230,101,78,107,225,109,91,110,173,112,237,119,239,122,170,123,187,125,61,128,198,128,203,134,149,138,91,147,227,86,199,88,62,95,173,101,150,102,128,106,181,107,55,117,199,138,36,80,229,119,48,87,27,95,101,96,122,102,96,108,244,117,26,122,110,127,244,129,24,135,69,144,179,153,201,123,92,117,249,122,81,123,196,132,16,144,233,121,146,122,54,131,225,90,64,119,45,78,242,78,153,91,224,95,189,98,60,102,241,103,232,108,107,134,119,136,59,138,78,145,243,146,208,153,23,106,38,112,42,115,231,130,87,132,175,140,1,78,70,81,203,81,139,85,245,91,22,94,51,94,129,94,20,95,53,95,107,95,180,95,242,97,17,99,162,102,29,103,110,111,82,114,58,117,58,119,116,128,57,129,120,129,118,135,191,138,220,138,133,141,243,141,154,146,119,149,2,152,229,156,197,82,87,99,244,118,21,103,136,108,205,115,195,140,174,147,115,150,37,109,156,88,14,105,204,105,253,143,154,147,219,117,26,144,90,88,2,104,180,99,251,105,67,79,44,111,216,103,187,143,38,133,180,125,84,147,63,105,112,111,106,87,247,88,44,91,44,125,42,114,10,84,227,145,180,157,173,78,78,79,92,80,117,80,67,82,158,140,72,84,36,88,154,91,29,94,149,94,173,94,247,94,31,95,140,96,181,98,58,99,208,99,175,104,64,108,135,120,142,121,11,122,224,125,71,130,2,138,230,138,68,142,19,144,184,144,45,145,216,145,14,159,229,108,88,100,226,100,117,101,244,110,132,118,27,123,105,144,209,147,186,110,242,84,185,95,164,100,77,143,237,143,68,146,120,81,107,88,41,89,85,92,151,94,251,109,143,126,28,117,188,140,226,142,91,152,185,112,29,79,191,107,177,111,48,117,251,150,78,81,16,84,53,88,87,88,172,89,96,92,146,95,151,101,92,103,33,110,123,118,223,131,237,140,20,144,253,144,77,147,37,120,58,120,170,82,166,94,31,87,116,89,18,96,18,80,90,81,172,81,205,81,0,82,16,85,84,88,88,88,87,89,149,91,246,92,139,93,188,96,149,98,45,100,113,103,67,104,188,104,223,104,215,118,216,109,111,110,155,109,111,112,200,113,83,95,216,117,119,121,73,123,84,123,82,123,214,124,113,125,48,82,99,132,105,133,228,133,14,138,4,139,70,140,15,142,3,144,15,144,25,148,118,150,45,152,48,154,216,149,205,80,213,82,12,84,2,88,14,92,167,97,158,100,30,109,179,119,229,122,244,128,4,132,83,144,133,146,224,92,7,157,63,83,151,95,179,95,156,109,121,114,99,119,191,121,228,123,210,107,236,114,173,138,3,104,97,106,248,81,129,122,52,105,74,92,246,156,235,130,197,91,73,145,30,112,120,86,111,92,199,96,102,101,140,108,90,140,65,144,19,152,81,84,199,102,13,146,72,89,163,144,133,81,77,78,234,81,153,133,14,139,88,112,122,99,75,147,98,105,180,153,4,126,119,117,87,83,96,105,223,142,227,150,93,108,140,78,60,92,16,95,233,143,2,83,209,140,137,128,121,134,255,94,229,101,115,78,101,81,130,89,63,92,238,151,251,78,138,89,205,95,141,138,225,111,176,121,98,121,231,91,113,132,43,115,177,113,116,94,245,95,123,99,154,100,195,113,152,124,67,78,252,94,75,78,220,87,162,86,169,96,195,111,13,125,253,128,51,129,191,129,178,143,151,137,164,134,244,93,138,98,173,100,135,137,119,103,226,108,62,109,54,116,52,120,70,90,117,127,173,130,172,153,243,79,195,94,221,98,146,99,87,101,111,103,195,118,76,114,204,128,186,128,41,143,77,145,13,80,249,87,146,90,133,104,115,105,100,113,253,114,183,140,242,88,224,140,106,150,25,144,127,135,228,121,231,119,41,132,47,79,101,82,90,83,205,98,207,103,202,108,125,118,148,123,149,124,54,130,132,133,235,143,221,102,32,111,6,114,27,126,171,131,193,153,166,158,253,81,177,123,114,120,184,123,135,128,72,123,232,106,97,94,140,128,81,117,96,117,107,81,98,146,140,110,122,118,151,145,234,154,16,79,112,127,156,98,79,123,165,149,233,156,122,86,89,88,228,134,188,150,52,79,36,82,74,83,205,83,219,83,6,94,44,100,145,101,127,103,62,108,78,108,72,114,175,114,237,115,84,117,65,126,44,130,233,133,169,140,196,123,198,145,105,113,18,152,239,152,61,99,105,102,106,117,228,118,208,120,67,133,238,134,42,83,81,83,38,84,131,89,135,94,124,95,178,96,73,98,121,98,171,98,144,101,212,107,204,108,178,117,174,118,145,120,216,121,203,125,119,127,165,128,171,136,185,138,187,140,127,144,94,151,219,152,11,106,56,124,153,80,62,92,174,95,135,103,216,107,53,116,9,119,142,127,59,159,202,103,23,122,57,83,139,117,237,154,102,95,157,129,241,131,152,128,60,95,197,95,98,117,70,123,60,144,103,104,235,89,155,90,16,125,126,118,44,139,245,79,106,95,25,106,55,108,2,111,226,116,104,121,104,136,85,138,121,140,223,94,207,99,197,117,210,121,215,130,40,147,242,146,156,132,237,134,45,156,193,84,108,95,140,101,92,109,21,112,167,140,211,140,59,152,79,101,246,116,13,78,216,78,224,87,43,89,102,90,204,91,168,81,3,94,156,94,22,96,118,98,119,101,167,101,110,102,110,109,54,114,38,123,80,129,154,129,153,130,92,139,160,140,230,140,116,141,28,150,68,150,174,79,171,100,102,107,30,130,97,132,106,133,232,144,1,92,83,105,168,152,122,132,87,133,15,79,111,82,169,95,69,94,13,103,143,121,121,129,7,137,134,137,245,109,23,95,85,98,184,108,207,78,105,114,146,155,6,82,59,84,116,86,179,88,164,97,110,98,26,113,110,89,137,124,222,124,27,125,240,150,135,101,94,128,25,78,117,79,117,81,64,88,99,94,115,94,10,95,196,103,38,78,61,133,137,149,91,150,115,124,1,152,251,80,193,88,86,118,167,120,37,82,165,119,17,133,134,123,79,80,9,89,71,114,199,123,232,125,186,143,212,143,77,144,191,79,201,82,41,90,1,95,173,151,221,79,23,130,234,146,3,87,85,99,105,107,43,117,220,136,20,143,66,122,223,82,147,88,85,97,10,98,174,102,205,107,63,124,233,131,35,80,248,79,5,83,70,84,49,88,73,89,157,91,240,92,239,92,41,93,150,94,177,98,103,99,62,101,185,101,11,103,213,108,225,108,249,112,50,120,43,126,222,128,179,130,12,132,236,132,2,135,18,137,42,138,74,140,166,144,210,146,253,152,243,156,108,157,79,78,161,78,141,80,86,82,74,87,168,89,61,94,216,95,217,95,63,98,180,102,27,103,208,103,210,104,146,81,33,125,170,128,168,129,0,139,140,140,191,140,126,146,50,150,32,84,44,152,23,83,213,80,92,83,168,88,178,100,52,103,103,114,102,119,70,122,230,145,195,82,161,108,134,107,0,88,76,94,84,89,44,103,251,127,225,81,198,118,105,100,232,120,84,155,187,158,203,87,185,89,39,102,154,103,206,107,233,84,217,105,85,94,156,129,149,103,170,155,254,103,82,156,93,104,166,78,227,79,200,83,185,98,43,103,171,108,196,143,173,79,109,126,191,158,7,78,98,97,128,110,43,111,19,133,115,84,42,103,69,155,243,93,149,123,172,92,198,91,28,135,74,110,209,132,20,122,8,129,153,89,141,124,17,108,32,119,217,82,34,89,33,113,95,114,219,119,39,151,97,157,11,105,127,90,24,90,165,81,13,84,125,84,14,102,223,118,247,143,152,146,244,156,234,89,93,114,197,110,77,81,201,104,191,125,236,125,98,151,186,158,120,100,33,106,2,131,132,89,95,91,219,107,27,115,242,118,178,125,23,128,153,132,50,81,40,103,217,158,238,118,98,103,255,82,5,153,36,92,59,98,126,124,176,140,79,85,182,96,11,125,128,149,1,83,95,78,182,81,28,89,58,114,54,128,206,145,37,95,226,119,132,83,121,95,4,125,172,133,51,138,141,142,86,151,243,103,174,133,83,148,9,97,8,97,185,108,82,118,237,138,56,143,47,85,81,79,42,81,199,82,203,83,165,91,125,94,160,96,130,97,214,99,9,103,218,103,103,110,140,109,54,115,55,115,49,117,80,121,213,136,152,138,74,144,145,144,245,144,196,150,141,135,21,89,136,78,89,79,14,78,137,138,63,143,16,152,173,80,124,94,150,89,185,91,184,94,218,99,250,99,193,100,220,102,74,105,216,105,11,109,182,110,148,113,40,117,175,122,138,127,0,128,73,132,201,132,129,137,33,139,10,142,101,144,125,150,10,153,126,97,145,98,50,107,131,108,116,109,204,127,252,127,192,109,133,127,186,135,248,136,101,103,177,131,60,152,247,150,27,109,97,125,61,132,106,145,113,78,117,83,80,93,4,107,235,111,205,133,45,134,167,137,41,82,15,84,101,92,78,103,168,104,6,116,131,116,226,117,207,136,225,136,204,145,226,150,120,150,139,95,135,115,203,122,78,132,160,99,101,117,137,82,65,109,156,110,9,116,89,117,107,120,146,124,134,150,220,122,141,159,182,79,110,97,197,101,92,134,134,78,174,78,218,80,33,78,204,81,238,91,153,101,129,104,188,109,31,115,66,118,173,119,28,122,231,124,111,130,210,138,124,144,207,145,117,150,24,152,155,82,209,125,43,80,152,83,151,103,203,109,208,113,51,116,232,129,42,143,163,150,87,156,159,158,96,116,65,88,153,109,47,125,94,152,228,78,54,79,139,79,183,81,177,82,186,93,28,96,178,115,60,121,211,130,52,146,183,150,246,150,10,151,151,158,98,159,166,102,116,107,23,82,163,82,200,112,194,136,201,94,75,96,144,97,35,111,73,113,62,124,244,125,111,128,238,132,35,144,44,147,66,84,111,155,211,106,137,112,194,140,239,141,50,151,180,82,65,90,202,94,4,95,23,103,124,105,148,105,106,109,15,111,98,114,252,114,237,123,1,128,126,128,75,135,206,144,109,81,147,158,132,121,139,128,50,147,214,138,45,80,140,84,113,138,106,107,196,140,7,129,209,96,160,103,242,157,153,78,152,78,16,156,107,138,193,133,104,133,0,105,126,110,151,120,85,129,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,95,16,78,21,78,42,78,49,78,54,78,60,78,63,78,66,78,86,78,88,78,130,78,133,78,107,140,138,78,18,130,13,95,142,78,158,78,159,78,160,78,162,78,176,78,179,78,182,78,206,78,205,78,196,78,198,78,194,78,215,78,222,78,237,78,223,78,247,78,9,79,90,79,48,79,91,79,93,79,87,79,71,79,118,79,136,79,143,79,152,79,123,79,105,79,112,79,145,79,111,79,134,79,150,79,24,81,212,79,223,79,206,79,216,79,219,79,209,79,218,79,208,79,228,79,229,79,26,80,40,80,20,80,42,80,37,80,5,80,28,79,246,79,33,80,41,80,44,80,254,79,239,79,17,80,6,80,67,80,71,80,3,103,85,80,80,80,72,80,90,80,86,80,108,80,120,80,128,80,154,80,133,80,180,80,178,80,201,80,202,80,179,80,194,80,214,80,222,80,229,80,237,80,227,80,238,80,249,80,245,80,9,81,1,81,2,81,22,81,21,81,20,81,26,81,33,81,58,81,55,81,60,81,59,81,63,81,64,81,82,81,76,81,84,81,98,81,248,122,105,81,106,81,110,81,128,81,130,81,216,86,140,81,137,81,143,81,145,81,147,81,149,81,150,81,164,81,166,81,162,81,169,81,170,81,171,81,179,81,177,81,178,81,176,81,181,81,189,81,197,81,201,81,219,81,224,81,85,134,233,81,237,81,240,81,245,81,254,81,4,82,11,82,20,82,14,82,39,82,42,82,46,82,51,82,57,82,79,82,68,82,75,82,76,82,94,82,84,82,106,82,116,82,105,82,115,82,127,82,125,82,141,82,148,82,146,82,113,82,136,82,145,82,168,143,167,143,172,82,173,82,188,82,181,82,193,82,205,82,215,82,222,82,227,82,230,82,237,152,224,82,243,82,245,82,248,82,249,82,6,83,8,83,56,117,13,83,16,83,15,83,21,83,26,83,35,83,47,83,49,83,51,83,56,83,64,83,70,83,69,83,23,78,73,83,77,83,214,81,94,83,105,83,110,83,24,89,123,83,119,83,130,83,150,83,160,83,166,83,165,83,174,83,176,83,182,83,195,83,18,124,217,150,223,83,252,102,238,113,238,83,232,83,237,83,250,83,1,84,61,84,64,84,44,84,45,84,60,84,46,84,54,84,41,84,29,84,78,84,143,84,117,84,142,84,95,84,113,84,119,84,112,84,146,84,123,84,128,84,118,84,132,84,144,84,134,84,199,84,162,84,184,84,165,84,172,84,196,84,200,84,168,84,171,84,194,84,164,84,190,84,188,84,216,84,229,84,230,84,15,85,20,85,253,84,238,84,237,84,250,84,226,84,57,85,64,85,99,85,76,85,46,85,92,85,69,85,86,85,87,85,56,85,51,85,93,85,153,85,128,85,175,84,138,85,159,85,123,85,126,85,152,85,158,85,174,85,124,85,131,85,169,85,135,85,168,85,218,85,197,85,223,85,196,85,220,85,228,85,212,85,20,86,247,85,22,86,254,85,253,85,27,86,249,85,78,86,80,86,223,113,52,86,54,86,50,86,56,86,107,86,100,86,47,86,108,86,106,86,134,86,128,86,138,86,160,86,148,86,143,86,165,86,174,86,182,86,180,86,194,86,188,86,193,86,195,86,192,86,200,86,206,86,209,86,211,86,215,86,238,86,249,86,0,87,255,86,4,87,9,87,8,87,11,87,13,87,19,87,24,87,22,87,199,85,28,87,38,87,55,87,56,87,78,87,59,87,64,87,79,87,105,87,192,87,136,87,97,87,127,87,137,87,147,87,160,87,179,87,164,87,170,87,176,87,195,87,198,87,212,87,210,87,211,87,10,88,214,87,227,87,11,88,25,88,29,88,114,88,33,88,98,88,75,88,112,88,192,107,82,88,61,88,121,88,133,88,185,88,159,88,171,88,186,88,222,88,187,88,184,88,174,88,197,88,211,88,209,88,215,88,217,88,216,88,229,88,220,88,228,88,223,88,239,88,250,88,249,88,251,88,252,88,253,88,2,89,10,89,16,89,27,89,166,104,37,89,44,89,45,89,50,89,56,89,62,89,210,122,85,89,80,89,78,89,90,89,88,89,98,89,96,89,103,89,108,89,105,89,120,89,129,89,157,89,94,79,171,79,163,89,178,89,198,89,232,89,220,89,141,89,217,89,218,89,37,90,31,90,17,90,28,90,9,90,26,90,64,90,108,90,73,90,53,90,54,90,98,90,106,90,154,90,188,90,190,90,203,90,194,90,189,90,227,90,215,90,230,90,233,90,214,90,250,90,251,90,12,91,11,91,22,91,50,91,208,90,42,91,54,91,62,91,67,91,69,91,64,91,81,91,85,91,90,91,91,91,101,91,105,91,112,91,115,91,117,91,120,91,136,101,122,91,128,91,131,91,166,91,184,91,195,91,199,91,201,91,212,91,208,91,228,91,230,91,226,91,222,91,229,91,235,91,240,91,246,91,243,91,5,92,7,92,8,92,13,92,19,92,32,92,34,92,40,92,56,92,57,92,65,92,70,92,78,92,83,92,80,92,79,92,113,91,108,92,110,92,98,78,118,92,121,92,140,92,145,92,148,92,155,89,171,92,187,92,182,92,188,92,183,92,197,92,190,92,199,92,217,92,233,92,253,92,250,92,237,92,140,93,234,92,11,93,21,93,23,93,92,93,31,93,27,93,17,93,20,93,34,93,26,93,25,93,24,93,76,93,82,93,78,93,75,93,108,93,115,93,118,93,135,93,132,93,130,93,162,93,157,93,172,93,174,93,189,93,144,93,183,93,188,93,201,93,205,93,211,93,210,93,214,93,219,93,235,93,242,93,245,93,11,94,26,94,25,94,17,94,27,94,54,94,55,94,68,94,67,94,64,94,78,94,87,94,84,94,95,94,98,94,100,94,71,94,117,94,118,94,122,94,188,158,127,94,160,94,193,94,194,94,200,94,208,94,207,94,214,94,227,94,221,94,218,94,219,94,226,94,225,94,232,94,233,94,236,94,241,94,243,94,240,94,244,94,248,94,254,94,3,95,9,95,93,95,92,95,11,95,17,95,22,95,41,95,45,95,56,95,65,95,72,95,76,95,78,95,47,95,81,95,86,95,87,95,89,95,97,95,109,95,115,95,119,95,131,95,130,95,127,95,138,95,136,95,145,95,135,95,158,95,153,95,152,95,160,95,168,95,173,95,188,95,214,95,251,95,228,95,248,95,241,95,221,95,179,96,255,95,33,96,96,96,25,96,16,96,41,96,14,96,49,96,27,96,21,96,43,96,38,96,15,96,58,96,90,96,65,96,106,96,119,96,95,96,74,96,70,96,77,96,99,96,67,96,100,96,66,96,108,96,107,96,89,96,129,96,141,96,231,96,131,96,154,96,132,96,155,96,150,96,151,96,146,96,167,96,139,96,225,96,184,96,224,96,211,96,180,96,240,95,189,96,198,96,181,96,216,96,77,97,21,97,6,97,246,96,247,96,0,97,244,96,250,96,3,97,33,97,251,96,241,96,13,97,14,97,71,97,62,97,40,97,39,97,74,97,63,97,60,97,44,97,52,97,61,97,66,97,68,97,115,97,119,97,88,97,89,97,90,97,107,97,116,97,111,97,101,97,113,97,95,97,93,97,83,97,117,97,153,97,150,97,135,97,172,97,148,97,154,97,138,97,145,97,171,97,174,97,204,97,202,97,201,97,247,97,200,97,195,97,198,97,186,97,203,97,121,127,205,97,230,97,227,97,246,97,250,97,244,97,255,97,253,97,252,97,254,97,0,98,8,98,9,98,13,98,12,98,20,98,27,98,30,98,33,98,42,98,46,98,48,98,50,98,51,98,65,98,78,98,94,98,99,98,91,98,96,98,104,98,124,98,130,98,137,98,126,98,146,98,147,98,150,98,212,98,131,98,148,98,215,98,209,98,187,98,207,98,255,98,198,98,212,100,200,98,220,98,204,98,202,98,194,98,199,98,155,98,201,98,12,99,238,98,241,98,39,99,2,99,8,99,239,98,245,98,80,99,62,99,77,99,28,100,79,99,150,99,142,99,128,99,171,99,118,99,163,99,143,99,137,99,159,99,181,99,107,99,105,99,190,99,233,99,192,99,198,99,227,99,201,99,210,99,246,99,196,99,22,100,52,100,6,100,19,100,38,100,54,100,29,101,23,100,40,100,15,100,103,100,111,100,118,100,78,100,42,101,149,100,147,100,165,100,169,100,136,100,188,100,218,100,210,100,197,100,199,100,187,100,216,100,194,100,241,100,231,100,9,130,224,100,225,100,172,98,227,100,239,100,44,101,246,100,244,100,242,100,250,100,0,101,253,100,24,101,28,101,5,101,36,101,35,101,43,101,52,101,53,101,55,101,54,101,56,101,75,117,72,101,86,101,85,101,77,101,88,101,94,101,93,101,114,101,120,101,130,101,131,101,138,139,155,101,159,101,171,101,183,101,195,101,198,101,193,101,196,101,204,101,210,101,219,101,217,101,224,101,225,101,241,101,114,103,10,102,3,102,251,101,115,103,53,102,54,102,52,102,28,102,79,102,68,102,73,102,65,102,94,102,93,102,100,102,103,102,104,102,95,102,98,102,112,102,131,102,136,102,142,102,137,102,132,102,152,102,157,102,193,102,185,102,201,102,190,102,188,102,196,102,184,102,214,102,218,102,224,102,63,102,230,102,233,102,240,102,245,102,247,102,15,103,22,103,30,103,38,103,39,103,56,151,46,103,63,103,54,103,65,103,56,103,55,103,70,103,94,103,96,103,89,103,99,103,100,103,137,103,112,103,169,103,124,103,106,103,140,103,139,103,166,103,161,103,133,103,183,103,239,103,180,103,236,103,179,103,233,103,184,103,228,103,222,103,221,103,226,103,238,103,185,103,206,103,198,103,231,103,156,106,30,104,70,104,41,104,64,104,77,104,50,104,78,104,179,104,43,104,89,104,99,104,119,104,127,104,159,104,143,104,173,104,148,104,157,104,155,104,131,104,174,106,185,104,116,104,181,104,160,104,186,104,15,105,141,104,126,104,1,105,202,104,8,105,216,104,34,105,38,105,225,104,12,105,205,104,212,104,231,104,213,104,54,105,18,105,4,105,215,104,227,104,37,105,249,104,224,104,239,104,40,105,42,105,26,105,35,105,33,105,198,104,121,105,119,105,92,105,120,105,107,105,84,105,126,105,110,105,57,105,116,105,61,105,89,105,48,105,97,105,94,105,93,105,129,105,106,105,178,105,174,105,208,105,191,105,193,105,211,105,190,105,206,105,232,91,202,105,221,105,187,105,195,105,167,105,46,106,145,105,160,105,156,105,149,105,180,105,222,105,232,105,2,106,27,106,255,105,10,107,249,105,242,105,231,105,5,106,177,105,30,106,237,105,20,106,235,105,10,106,18,106,193,106,35,106,19,106,68,106,12,106,114,106,54,106,120,106,71,106,98,106,89,106,102,106,72,106,56,106,34,106,144,106,141,106,160,106,132,106,162,106,163,106,151,106,23,134,187,106,195,106,194,106,184,106,179,106,172,106,222,106,209,106,223,106,170,106,218,106,234,106,251,106,5,107,22,134,250,106,18,107,22,107,49,155,31,107,56,107,55,107,220,118,57,107,238,152,71,107,67,107,73,107,80,107,89,107,84,107,91,107,95,107,97,107,120,107,121,107,127,107,128,107,132,107,131,107,141,107,152,107,149,107,158,107,164,107,170,107,171,107,175,107,178,107,177,107,179,107,183,107,188,107,198,107,203,107,211,107,223,107,236,107,235,107,243,107,239,107,190,158,8,108,19,108,20,108,27,108,36,108,35,108,94,108,85,108,98,108,106,108,130,108,141,108,154,108,129,108,155,108,126,108,104,108,115,108,146,108,144,108,196,108,241,108,211,108,189,108,215,108,197,108,221,108,174,108,177,108,190,108,186,108,219,108,239,108,217,108,234,108,31,109,77,136,54,109,43,109,61,109,56,109,25,109,53,109,51,109,18,109,12,109,99,109,147,109,100,109,90,109,121,109,89,109,142,109,149,109,228,111,133,109,249,109,21,110,10,110,181,109,199,109,230,109,184,109,198,109,236,109,222,109,204,109,232,109,210,109,197,109,250,109,217,109,228,109,213,109,234,109,238,109,45,110,110,110,46,110,25,110,114,110,95,110,62,110,35,110,107,110,43,110,118,110,77,110,31,110,67,110,58,110,78,110,36,110,255,110,29,110,56,110,130,110,170,110,152,110,201,110,183,110,211,110,189,110,175,110,196,110,178,110,212,110,213,110,143,110,165,110,194,110,159,110,65,111,17,111,76,112,236,110,248,110,254,110,63,111,242,110,49,111,239,110,50,111,204,110,62,111,19,111,247,110,134,111,122,111,120,111,129,111,128,111,111,111,91,111,243,111,109,111,130,111,124,111,88,111,142,111,145,111,194,111,102,111,179,111,163,111,161,111,164,111,185,111,198,111,170,111,223,111,213,111,236,111,212,111,216,111,241,111,238,111,219,111,9,112,11,112,250,111,17,112,1,112,15,112,254,111,27,112,26,112,116,111,29,112,24,112,31,112,48,112,62,112,50,112,81,112,99,112,153,112,146,112,175,112,241,112,172,112,184,112,179,112,174,112,223,112,203,112,221,112,217,112,9,113,253,112,28,113,25,113,101,113,85,113,136,113,102,113,98,113,76,113,86,113,108,113,143,113,251,113,132,113,149,113,168,113,172,113,215,113,185,113,190,113,210,113,201,113,212,113,206,113,224,113,236,113,231,113,245,113,252,113,249,113,255,113,13,114,16,114,27,114,40,114,45,114,44,114,48,114,50,114,59,114,60,114,63,114,64,114,70,114,75,114,88,114,116,114,126,114,130,114,129,114,135,114,146,114,150,114,162,114,167,114,185,114,178,114,195,114,198,114,196,114,206,114,210,114,226,114,224,114,225,114,249,114,247,114,15,80,23,115,10,115,28,115,22,115,29,115,52,115,47,115,41,115,37,115,62,115,78,115,79,115,216,158,87,115,106,115,104,115,112,115,120,115,117,115,123,115,122,115,200,115,179,115,206,115,187,115,192,115,229,115,238,115,222,115,162,116,5,116,111,116,37,116,248,115,50,116,58,116,85,116,63,116,95,116,89,116,65,116,92,116,105,116,112,116,99,116,106,116,118,116,126,116,139,116,158,116,167,116,202,116,207,116,212,116,241,115,224,116,227,116,231,116,233,116,238,116,242,116,240,116,241,116,248,116,247,116,4,117,3,117,5,117,12,117,14,117,13,117,21,117,19,117,30,117,38,117,44,117,60,117,68,117,77,117,74,117,73,117,91,117,70,117,90,117,105,117,100,117,103,117,107,117,109,117,120,117,118,117,134,117,135,117,116,117,138,117,137,117,130,117,148,117,154,117,157,117,165,117,163,117,194,117,179,117,195,117,181,117,189,117,184,117,188,117,177,117,205,117,202,117,210,117,217,117,227,117,222,117,254,117,255,117,252,117,1,118,240,117,250,117,242,117,243,117,11,118,13,118,9,118,31,118,39,118,32,118,33,118,34,118,36,118,52,118,48,118,59,118,71,118,72,118,70,118,92,118,88,118,97,118,98,118,104,118,105,118,106,118,103,118,108,118,112,118,114,118,118,118,120,118,124,118,128,118,131,118,136,118,139,118,142,118,150,118,147,118,153,118,154,118,176,118,180,118,184,118,185,118,186,118,194,118,205,118,214,118,210,118,222,118,225,118,229,118,231,118,234,118,47,134,251,118,8,119,7,119,4,119,41,119,36,119,30,119,37,119,38,119,27,119,55,119,56,119,71,119,90,119,104,119,107,119,91,119,101,119,127,119,126,119,121,119,142,119,139,119,145,119,160,119,158,119,176,119,182,119,185,119,191,119,188,119,189,119,187,119,199,119,205,119,215,119,218,119,220,119,227,119,238,119,252,119,12,120,18,120,38,121,32,120,42,121,69,120,142,120,116,120,134,120,124,120,154,120,140,120,163,120,181,120,170,120,175,120,209,120,198,120,203,120,212,120,190,120,188,120,197,120,202,120,236,120,231,120,218,120,253,120,244,120,7,121,18,121,17,121,25,121,44,121,43,121,64,121,96,121,87,121,95,121,90,121,85,121,83,121,122,121,127,121,138,121,157,121,167,121,75,159,170,121,174,121,179,121,185,121,186,121,201,121,213,121,231,121,236,121,225,121,227,121,8,122,13,122,24,122,25,122,32,122,31,122,128,121,49,122,59,122,62,122,55,122,67,122,87,122,73,122,97,122,98,122,105,122,157,159,112,122,121,122,125,122,136,122,151,122,149,122,152,122,150,122,169,122,200,122,176,122,182,122,197,122,196,122,191,122,131,144,199,122,202,122,205,122,207,122,213,122,211,122,217,122,218,122,221,122,225,122,226,122,230,122,237,122,240,122,2,123,15,123,10,123,6,123,51,123,24,123,25,123,30,123,53,123,40,123,54,123,80,123,122,123,4,123,77,123,11,123,76,123,69,123,117,123,101,123,116,123,103,123,112,123,113,123,108,123,110,123,157,123,152,123,159,123,141,123,156,123,154,123,139,123,146,123,143,123,93,123,153,123,203,123,193,123,204,123,207,123,180,123,198,123,221,123,233,123,17,124,20,124,230,123,229,123,96,124,0,124,7,124,19,124,243,123,247,123,23,124,13,124,246,123,35,124,39,124,42,124,31,124,55,124,43,124,61,124,76,124,67,124,84,124,79,124,64,124,80,124,88,124,95,124,100,124,86,124,101,124,108,124,117,124,131,124,144,124,164,124,173,124,162,124,171,124,161,124,168,124,179,124,178,124,177,124,174,124,185,124,189,124,192,124,197,124,194,124,216,124,210,124,220,124,226,124,59,155,239,124,242,124,244,124,246,124,250,124,6,125,2,125,28,125,21,125,10,125,69,125,75,125,46,125,50,125,63,125,53,125,70,125,115,125,86,125,78,125,114,125,104,125,110,125,79,125,99,125,147,125,137,125,91,125,143,125,125,125,155,125,186,125,174,125,163,125,181,125,199,125,189,125,171,125,61,126,162,125,175,125,220,125,184,125,159,125,176,125,216,125,221,125,228,125,222,125,251,125,242,125,225,125,5,126,10,126,35,126,33,126,18,126,49,126,31,126,9,126,11,126,34,126,70,126,102,126,59,126,53,126,57,126,67,126,55,126,50,126,58,126,103,126,93,126,86,126,94,126,89,126,90,126,121,126,106,126,105,126,124,126,123,126,131,126,213,125,125,126,174,143,127,126,136,126,137,126,140,126,146,126,144,126,147,126,148,126,150,126,142,126,155,126,156,126,56,127,58,127,69,127,76,127,77,127,78,127,80,127,81,127,85,127,84,127,88,127,95,127,96,127,104,127,105,127,103,127,120,127,130,127,134,127,131,127,136,127,135,127,140,127,148,127,158,127,157,127,154,127,163,127,175,127,178,127,185,127,174,127,182,127,184,127,113,139,197,127,198,127,202,127,213,127,212,127,225,127,230,127,233,127,243,127,249,127,220,152], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+6852);
/* memory initializer */ allocate([6,128,4,128,11,128,18,128,24,128,25,128,28,128,33,128,40,128,63,128,59,128,74,128,70,128,82,128,88,128,90,128,95,128,98,128,104,128,115,128,114,128,112,128,118,128,121,128,125,128,127,128,132,128,134,128,133,128,155,128,147,128,154,128,173,128,144,81,172,128,219,128,229,128,217,128,221,128,196,128,218,128,214,128,9,129,239,128,241,128,27,129,41,129,35,129,47,129,75,129,139,150,70,129,62,129,83,129,81,129,252,128,113,129,110,129,101,129,102,129,116,129,131,129,136,129,138,129,128,129,130,129,160,129,149,129,164,129,163,129,95,129,147,129,169,129,176,129,181,129,190,129,184,129,189,129,192,129,194,129,186,129,201,129,205,129,209,129,217,129,216,129,200,129,218,129,223,129,224,129,231,129,250,129,251,129,254,129,1,130,2,130,5,130,7,130,10,130,13,130,16,130,22,130,41,130,43,130,56,130,51,130,64,130,89,130,88,130,93,130,90,130,95,130,100,130,98,130,104,130,106,130,107,130,46,130,113,130,119,130,120,130,126,130,141,130,146,130,171,130,159,130,187,130,172,130,225,130,227,130,223,130,210,130,244,130,243,130,250,130,147,131,3,131,251,130,249,130,222,130,6,131,220,130,9,131,217,130,53,131,52,131,22,131,50,131,49,131,64,131,57,131,80,131,69,131,47,131,43,131,23,131,24,131,133,131,154,131,170,131,159,131,162,131,150,131,35,131,142,131,135,131,138,131,124,131,181,131,115,131,117,131,160,131,137,131,168,131,244,131,19,132,235,131,206,131,253,131,3,132,216,131,11,132,193,131,247,131,7,132,224,131,242,131,13,132,34,132,32,132,189,131,56,132,6,133,251,131,109,132,42,132,60,132,90,133,132,132,119,132,107,132,173,132,110,132,130,132,105,132,70,132,44,132,111,132,121,132,53,132,202,132,98,132,185,132,191,132,159,132,217,132,205,132,187,132,218,132,208,132,193,132,198,132,214,132,161,132,33,133,255,132,244,132,23,133,24,133,44,133,31,133,21,133,20,133,252,132,64,133,99,133,88,133,72,133,65,133,2,134,75,133,85,133,128,133,164,133,136,133,145,133,138,133,168,133,109,133,148,133,155,133,234,133,135,133,156,133,119,133,126,133,144,133,201,133,186,133,207,133,185,133,208,133,213,133,221,133,229,133,220,133,249,133,10,134,19,134,11,134,254,133,250,133,6,134,34,134,26,134,48,134,63,134,77,134,85,78,84,134,95,134,103,134,113,134,147,134,163,134,169,134,170,134,139,134,140,134,182,134,175,134,196,134,198,134,176,134,201,134,35,136,171,134,212,134,222,134,233,134,236,134,223,134,219,134,239,134,18,135,6,135,8,135,0,135,3,135,251,134,17,135,9,135,13,135,249,134,10,135,52,135,63,135,55,135,59,135,37,135,41,135,26,135,96,135,95,135,120,135,76,135,78,135,116,135,87,135,104,135,110,135,89,135,83,135,99,135,106,135,5,136,162,135,159,135,130,135,175,135,203,135,189,135,192,135,208,135,214,150,171,135,196,135,179,135,199,135,198,135,187,135,239,135,242,135,224,135,15,136,13,136,254,135,246,135,247,135,14,136,210,135,17,136,22,136,21,136,34,136,33,136,49,136,54,136,57,136,39,136,59,136,68,136,66,136,82,136,89,136,94,136,98,136,107,136,129,136,126,136,158,136,117,136,125,136,181,136,114,136,130,136,151,136,146,136,174,136,153,136,162,136,141,136,164,136,176,136,191,136,177,136,195,136,196,136,212,136,216,136,217,136,221,136,249,136,2,137,252,136,244,136,232,136,242,136,4,137,12,137,10,137,19,137,67,137,30,137,37,137,42,137,43,137,65,137,68,137,59,137,54,137,56,137,76,137,29,137,96,137,94,137,102,137,100,137,109,137,106,137,111,137,116,137,119,137,126,137,131,137,136,137,138,137,147,137,152,137,161,137,169,137,166,137,172,137,175,137,178,137,186,137,189,137,191,137,192,137,218,137,220,137,221,137,231,137,244,137,248,137,3,138,22,138,16,138,12,138,27,138,29,138,37,138,54,138,65,138,91,138,82,138,70,138,72,138,124,138,109,138,108,138,98,138,133,138,130,138,132,138,168,138,161,138,145,138,165,138,166,138,154,138,163,138,196,138,205,138,194,138,218,138,235,138,243,138,231,138,228,138,241,138,20,139,224,138,226,138,247,138,222,138,219,138,12,139,7,139,26,139,225,138,22,139,16,139,23,139,32,139,51,139,171,151,38,139,43,139,62,139,40,139,65,139,76,139,79,139,78,139,73,139,86,139,91,139,90,139,107,139,95,139,108,139,111,139,116,139,125,139,128,139,140,139,142,139,146,139,147,139,150,139,153,139,154,139,58,140,65,140,63,140,72,140,76,140,78,140,80,140,85,140,98,140,108,140,120,140,122,140,130,140,137,140,133,140,138,140,141,140,142,140,148,140,124,140,152,140,29,98,173,140,170,140,189,140,178,140,179,140,174,140,182,140,200,140,193,140,228,140,227,140,218,140,253,140,250,140,251,140,4,141,5,141,10,141,7,141,15,141,13,141,16,141,78,159,19,141,205,140,20,141,22,141,103,141,109,141,113,141,115,141,129,141,153,141,194,141,190,141,186,141,207,141,218,141,214,141,204,141,219,141,203,141,234,141,235,141,223,141,227,141,252,141,8,142,9,142,255,141,29,142,30,142,16,142,31,142,66,142,53,142,48,142,52,142,74,142,71,142,73,142,76,142,80,142,72,142,89,142,100,142,96,142,42,142,99,142,85,142,118,142,114,142,124,142,129,142,135,142,133,142,132,142,139,142,138,142,147,142,145,142,148,142,153,142,170,142,161,142,172,142,176,142,198,142,177,142,190,142,197,142,200,142,203,142,219,142,227,142,252,142,251,142,235,142,254,142,10,143,5,143,21,143,18,143,25,143,19,143,28,143,31,143,27,143,12,143,38,143,51,143,59,143,57,143,69,143,66,143,62,143,76,143,73,143,70,143,78,143,87,143,92,143,98,143,99,143,100,143,156,143,159,143,163,143,173,143,175,143,183,143,218,143,229,143,226,143,234,143,239,143,135,144,244,143,5,144,249,143,250,143,17,144,21,144,33,144,13,144,30,144,22,144,11,144,39,144,54,144,53,144,57,144,248,143,79,144,80,144,81,144,82,144,14,144,73,144,62,144,86,144,88,144,94,144,104,144,111,144,118,144,168,150,114,144,130,144,125,144,129,144,128,144,138,144,137,144,143,144,168,144,175,144,177,144,181,144,226,144,228,144,72,98,219,144,2,145,18,145,25,145,50,145,48,145,74,145,86,145,88,145,99,145,101,145,105,145,115,145,114,145,139,145,137,145,130,145,162,145,171,145,175,145,170,145,181,145,180,145,186,145,192,145,193,145,201,145,203,145,208,145,214,145,223,145,225,145,219,145,252,145,245,145,246,145,30,146,255,145,20,146,44,146,21,146,17,146,94,146,87,146,69,146,73,146,100,146,72,146,149,146,63,146,75,146,80,146,156,146,150,146,147,146,155,146,90,146,207,146,185,146,183,146,233,146,15,147,250,146,68,147,46,147,25,147,34,147,26,147,35,147,58,147,53,147,59,147,92,147,96,147,124,147,110,147,86,147,176,147,172,147,173,147,148,147,185,147,214,147,215,147,232,147,229,147,216,147,195,147,221,147,208,147,200,147,228,147,26,148,20,148,19,148,3,148,7,148,16,148,54,148,43,148,53,148,33,148,58,148,65,148,82,148,68,148,91,148,96,148,98,148,94,148,106,148,41,146,112,148,117,148,119,148,125,148,90,148,124,148,126,148,129,148,127,148,130,149,135,149,138,149,148,149,150,149,152,149,153,149,160,149,168,149,167,149,173,149,188,149,187,149,185,149,190,149,202,149,246,111,195,149,205,149,204,149,213,149,212,149,214,149,220,149,225,149,229,149,226,149,33,150,40,150,46,150,47,150,66,150,76,150,79,150,75,150,119,150,92,150,94,150,93,150,95,150,102,150,114,150,108,150,141,150,152,150,149,150,151,150,170,150,167,150,177,150,178,150,176,150,180,150,182,150,184,150,185,150,206,150,203,150,201,150,205,150,77,137,220,150,13,151,213,150,249,150,4,151,6,151,8,151,19,151,14,151,17,151,15,151,22,151,25,151,36,151,42,151,48,151,57,151,61,151,62,151,68,151,70,151,72,151,66,151,73,151,92,151,96,151,100,151,102,151,104,151,210,82,107,151,113,151,121,151,133,151,124,151,129,151,122,151,134,151,139,151,143,151,144,151,156,151,168,151,166,151,163,151,179,151,180,151,195,151,198,151,200,151,203,151,220,151,237,151,79,159,242,151,223,122,246,151,245,151,15,152,12,152,56,152,36,152,33,152,55,152,61,152,70,152,79,152,75,152,107,152,111,152,112,152,113,152,116,152,115,152,170,152,175,152,177,152,182,152,196,152,195,152,198,152,233,152,235,152,3,153,9,153,18,153,20,153,24,153,33,153,29,153,30,153,36,153,32,153,44,153,46,153,61,153,62,153,66,153,73,153,69,153,80,153,75,153,81,153,82,153,76,153,85,153,151,153,152,153,165,153,173,153,174,153,188,153,223,153,219,153,221,153,216,153,209,153,237,153,238,153,241,153,242,153,251,153,248,153,1,154,15,154,5,154,226,153,25,154,43,154,55,154,69,154,66,154,64,154,67,154,62,154,85,154,77,154,91,154,87,154,95,154,98,154,101,154,100,154,105,154,107,154,106,154,173,154,176,154,188,154,192,154,207,154,209,154,211,154,212,154,222,154,223,154,226,154,227,154,230,154,239,154,235,154,238,154,244,154,241,154,247,154,251,154,6,155,24,155,26,155,31,155,34,155,35,155,37,155,39,155,40,155,41,155,42,155,46,155,47,155,50,155,68,155,67,155,79,155,77,155,78,155,81,155,88,155,116,155,147,155,131,155,145,155,150,155,151,155,159,155,160,155,168,155,180,155,192,155,202,155,185,155,198,155,207,155,209,155,210,155,227,155,226,155,228,155,212,155,225,155,58,156,242,155,241,155,240,155,21,156,20,156,9,156,19,156,12,156,6,156,8,156,18,156,10,156,4,156,46,156,27,156,37,156,36,156,33,156,48,156,71,156,50,156,70,156,62,156,90,156,96,156,103,156,118,156,120,156,231,156,236,156,240,156,9,157,8,157,235,156,3,157,6,157,42,157,38,157,175,157,35,157,31,157,68,157,21,157,18,157,65,157,63,157,62,157,70,157,72,157,93,157,94,157,100,157,81,157,80,157,89,157,114,157,137,157,135,157,171,157,111,157,122,157,154,157,164,157,169,157,178,157,196,157,193,157,187,157,184,157,186,157,198,157,207,157,194,157,217,157,211,157,248,157,230,157,237,157,239,157,253,157,26,158,27,158,30,158,117,158,121,158,125,158,129,158,136,158,139,158,140,158,146,158,149,158,145,158,157,158,165,158,169,158,184,158,170,158,173,158,97,151,204,158,206,158,207,158,208,158,212,158,220,158,222,158,221,158,224,158,229,158,232,158,239,158,244,158,246,158,247,158,249,158,251,158,252,158,253,158,7,159,8,159,183,118,21,159,33,159,44,159,62,159,74,159,82,159,84,159,99,159,95,159,96,159,97,159,102,159,103,159,108,159,106,159,119,159,114,159,118,159,149,159,156,159,160,159,47,88,199,105,89,144,100,116,220,81,153,113,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,78,4,78,5,78,6,78,15,78,18,78,23,78,31,78,32,78,33,78,35,78,38,78,41,78,46,78,47,78,49,78,51,78,53,78,55,78,60,78,64,78,65,78,66,78,68,78,70,78,74,78,81,78,85,78,87,78,90,78,91,78,98,78,99,78,100,78,101,78,103,78,104,78,106,78,107,78,108,78,109,78,110,78,111,78,114,78,116,78,117,78,118,78,119,78,120,78,121,78,122,78,123,78,124,78,125,78,127,78,128,78,129,78,130,78,131,78,132,78,133,78,135,78,138,78,144,78,150,78,151,78,153,78,156,78,157,78,158,78,163,78,170,78,175,78,176,78,177,78,180,78,182,78,183,78,184,78,185,78,188,78,189,78,190,78,200,78,204,78,207,78,208,78,210,78,218,78,219,78,220,78,224,78,226,78,230,78,231,78,233,78,237,78,238,78,239,78,241,78,244,78,248,78,249,78,250,78,252,78,254,78,0,79,2,79,3,79,4,79,5,79,6,79,7,79,8,79,11,79,12,79,18,79,19,79,20,79,21,79,22,79,28,79,29,79,33,79,35,79,40,79,41,79,44,79,45,79,46,79,49,79,51,79,53,79,55,79,57,79,59,79,62,79,63,79,64,79,65,79,66,79,68,79,69,79,71,79,72,79,73,79,74,79,75,79,76,79,82,79,84,79,86,79,97,79,98,79,102,79,104,79,106,79,107,79,109,79,110,79,113,79,114,79,117,79,119,79,120,79,121,79,122,79,125,79,128,79,129,79,130,79,133,79,134,79,135,79,138,79,140,79,142,79,144,79,146,79,147,79,149,79,150,79,152,79,153,79,154,79,156,79,158,79,159,79,161,79,162,79,164,79,171,79,173,79,176,79,177,79,178,79,179,79,180,79,182,79,183,79,184,79,185,79,186,79,187,79,188,79,189,79,190,79,192,79,193,79,194,79,198,79,199,79,200,79,201,79,203,79,204,79,205,79,210,79,211,79,212,79,213,79,214,79,217,79,219,79,224,79,226,79,228,79,229,79,231,79,235,79,236,79,240,79,242,79,244,79,245,79,246,79,247,79,249,79,251,79,252,79,253,79,255,79,0,80,1,80,2,80,3,80,4,80,5,80,6,80,7,80,8,80,9,80,10,80,11,80,14,80,16,80,17,80,19,80,21,80,22,80,23,80,27,80,29,80,30,80,32,80,34,80,35,80,36,80,39,80,43,80,47,80,48,80,49,80,50,80,51,80,52,80,53,80,54,80,55,80,56,80,57,80,59,80,61,80,63,80,64,80,65,80,66,80,68,80,69,80,70,80,73,80,74,80,75,80,77,80,80,80,81,80,82,80,83,80,84,80,86,80,87,80,88,80,89,80,91,80,93,80,94,80,95,80,96,80,97,80,98,80,99,80,100,80,102,80,103,80,104,80,105,80,106,80,107,80,109,80,110,80,111,80,112,80,113,80,114,80,115,80,116,80,117,80,120,80,121,80,122,80,124,80,125,80,129,80,130,80,131,80,132,80,134,80,135,80,137,80,138,80,139,80,140,80,142,80,143,80,144,80,145,80,146,80,147,80,148,80,149,80,150,80,151,80,152,80,153,80,154,80,155,80,156,80,157,80,158,80,159,80,160,80,161,80,162,80,164,80,166,80,170,80,171,80,173,80,174,80,175,80,176,80,177,80,179,80,180,80,181,80,182,80,183,80,184,80,185,80,188,80,189,80,190,80,191,80,192,80,193,80,194,80,195,80,196,80,197,80,198,80,199,80,200,80,201,80,202,80,203,80,204,80,205,80,206,80,208,80,209,80,210,80,211,80,212,80,213,80,215,80,216,80,217,80,219,80,220,80,221,80,222,80,223,80,224,80,225,80,226,80,227,80,228,80,229,80,232,80,233,80,234,80,235,80,239,80,240,80,241,80,242,80,244,80,246,80,247,80,248,80,249,80,250,80,252,80,253,80,254,80,255,80,0,81,1,81,2,81,3,81,4,81,5,81,8,81,9,81,10,81,12,81,13,81,14,81,15,81,16,81,17,81,19,81,20,81,21,81,22,81,23,81,24,81,25,81,26,81,27,81,28,81,29,81,30,81,31,81,32,81,34,81,35,81,36,81,37,81,38,81,39,81,40,81,41,81,42,81,43,81,44,81,45,81,46,81,47,81,48,81,49,81,50,81,51,81,52,81,53,81,54,81,55,81,56,81,57,81,58,81,59,81,60,81,61,81,62,81,66,81,71,81,74,81,76,81,78,81,79,81,80,81,82,81,83,81,87,81,88,81,89,81,91,81,93,81,94,81,95,81,96,81,97,81,99,81,100,81,102,81,103,81,105,81,106,81,111,81,114,81,122,81,126,81,127,81,131,81,132,81,134,81,135,81,138,81,139,81,142,81,143,81,144,81,145,81,147,81,148,81,152,81,154,81,157,81,158,81,159,81,161,81,163,81,166,81,167,81,168,81,169,81,170,81,173,81,174,81,180,81,184,81,185,81,186,81,190,81,191,81,193,81,194,81,195,81,197,81,200,81,202,81,205,81,206,81,208,81,210,81,211,81,212,81,213,81,214,81,215,81,216,81,217,81,218,81,220,81,222,81,223,81,226,81,227,81,229,81,230,81,231,81,232,81,233,81,234,81,236,81,238,81,241,81,242,81,244,81,247,81,254,81,4,82,5,82,9,82,11,82,12,82,15,82,16,82,19,82,20,82,21,82,28,82,30,82,31,82,33,82,34,82,35,82,37,82,38,82,39,82,42,82,44,82,47,82,49,82,50,82,52,82,53,82,60,82,62,82,68,82,69,82,70,82,71,82,72,82,73,82,75,82,78,82,79,82,82,82,83,82,85,82,87,82,88,82,89,82,90,82,91,82,93,82,95,82,96,82,98,82,99,82,100,82,102,82,104,82,107,82,108,82,109,82,110,82,112,82,113,82,115,82,116,82,117,82,118,82,119,82,120,82,121,82,122,82,123,82,124,82,126,82,128,82,131,82,132,82,133,82,134,82,135,82,137,82,138,82,139,82,140,82,141,82,142,82,143,82,145,82,146,82,148,82,149,82,150,82,151,82,152,82,153,82,154,82,156,82,164,82,165,82,166,82,167,82,174,82,175,82,176,82,180,82,181,82,182,82,183,82,184,82,185,82,186,82,187,82,188,82,189,82,192,82,193,82,194,82,196,82,197,82,198,82,200,82,202,82,204,82,205,82,206,82,207,82,209,82,211,82,212,82,213,82,215,82,217,82,218,82,219,82,220,82,221,82,222,82,224,82,225,82,226,82,227,82,229,82,230,82,231,82,232,82,233,82,234,82,235,82,236,82,237,82,238,82,239,82,241,82,242,82,243,82,244,82,245,82,246,82,247,82,248,82,251,82,252,82,253,82,1,83,2,83,3,83,4,83,7,83,9,83,10,83,11,83,12,83,14,83,17,83,18,83,19,83,20,83,24,83,27,83,28,83,30,83,31,83,34,83,36,83,37,83,39,83,40,83,41,83,43,83,44,83,45,83,47,83,48,83,49,83,50,83,51,83,52,83,53,83,54,83,55,83,56,83,60,83,61,83,64,83,66,83,68,83,70,83,75,83,76,83,77,83,80,83,84,83,88,83,89,83,91,83,93,83,101,83,104,83,106,83,108,83,109,83,114,83,118,83,121,83,123,83,124,83,125,83,126,83,128,83,129,83,131,83,135,83,136,83,138,83,142,83,143,83,144,83,145,83,146,83,147,83,148,83,150,83,151,83,153,83,155,83,156,83,158,83,160,83,161,83,164,83,167,83,170,83,171,83,172,83,173,83,175,83,176,83,177,83,178,83,179,83,180,83,181,83,183,83,184,83,185,83,186,83,188,83,189,83,190,83,192,83,195,83,196,83,197,83,198,83,199,83,206,83,207,83,208,83,210,83,211,83,213,83,218,83,220,83,221,83,222,83,225,83,226,83,231,83,244,83,250,83,254,83,255,83,0,84,2,84,5,84,7,84,11,84,20,84,24,84,25,84,26,84,28,84,34,84,36,84,37,84,42,84,48,84,51,84,54,84,55,84,58,84,61,84,63,84,65,84,66,84,68,84,69,84,71,84,73,84,76,84,77,84,78,84,79,84,81,84,90,84,93,84,94,84,95,84,96,84,97,84,99,84,101,84,103,84,105,84,106,84,107,84,108,84,109,84,110,84,111,84,112,84,116,84,121,84,122,84,126,84,127,84,129,84,131,84,133,84,135,84,136,84,137,84,138,84,141,84,145,84,147,84,151,84,152,84,156,84,158,84,159,84,160,84,161,84,162,84,165,84,174,84,176,84,178,84,181,84,182,84,183,84,185,84,186,84,188,84,190,84,195,84,197,84,202,84,203,84,214,84,216,84,219,84,224,84,225,84,226,84,227,84,228,84,235,84,236,84,239,84,240,84,241,84,244,84,245,84,246,84,247,84,248,84,249,84,251,84,254,84,0,85,2,85,3,85,4,85,5,85,8,85,10,85,11,85,12,85,13,85,14,85,18,85,19,85,21,85,22,85,23,85,24,85,25,85,26,85,28,85,29,85,30,85,31,85,33,85,37,85,38,85,40,85,41,85,43,85,45,85,50,85,52,85,53,85,54,85,56,85,57,85,58,85,59,85,61,85,64,85,66,85,69,85,71,85,72,85,75,85,76,85,77,85,78,85,79,85,81,85,82,85,83,85,84,85,87,85,88,85,89,85,90,85,91,85,93,85,94,85,95,85,96,85,98,85,99,85,104,85,105,85,107,85,111,85,112,85,113,85,114,85,115,85,116,85,121,85,122,85,125,85,127,85,133,85,134,85,140,85,141,85,142,85,144,85,146,85,147,85,149,85,150,85,151,85,154,85,155,85,158,85,160,85,161,85,162,85,163,85,164,85,165,85,166,85,168,85,169,85,170,85,171,85,172,85,173,85,174,85,175,85,176,85,178,85,180,85,182,85,184,85,186,85,188,85,191,85,192,85,193,85,194,85,195,85,198,85,199,85,200,85,202,85,203,85,206,85,207,85,208,85,213,85,215,85,216,85,217,85,218,85,219,85,222,85,224,85,226,85,231,85,233,85,237,85,238,85,240,85,241,85,244,85,246,85,248,85,249,85,250,85,251,85,252,85,255,85,2,86,3,86,4,86,5,86,6,86,7,86,10,86,11,86,13,86,16,86,17,86,18,86,19,86,20,86,21,86,22,86,23,86,25,86,26,86,28,86,29,86,32,86,33,86,34,86,37,86,38,86,40,86,41,86,42,86,43,86,46,86,47,86,48,86,51,86,53,86,55,86,56,86,58,86,60,86,61,86,62,86,64,86,65,86,66,86,67,86,68,86,69,86,70,86,71,86,72,86,73,86,74,86,75,86,79,86,80,86,81,86,82,86,83,86,85,86,86,86,90,86,91,86,93,86,94,86,95,86,96,86,97,86,99,86,101,86,102,86,103,86,109,86,110,86,111,86,112,86,114,86,115,86,116,86,117,86,119,86,120,86,121,86,122,86,125,86,126,86,127,86,128,86,129,86,130,86,131,86,132,86,135,86,136,86,137,86,138,86,139,86,140,86,141,86,144,86,145,86,146,86,148,86,149,86,150,86,151,86,152,86,153,86,154,86,155,86,156,86,157,86,158,86,159,86,160,86,161,86,162,86,164,86,165,86,166,86,167,86,168,86,169,86,170,86,171,86,172,86,173,86,174,86,176,86,177,86,178,86,179,86,180,86,181,86,182,86,184,86,185,86,186,86,187,86,189,86,190,86,191,86,192,86,193,86,194,86,195,86,196,86,197,86,198,86,199,86,200,86,201,86,203,86,204,86,205,86,206,86,207,86,208,86,209,86,210,86,211,86,213,86,214,86,216,86,217,86,220,86,227,86,229,86,230,86,231,86,232,86,233,86,234,86,236,86,238,86,239,86,242,86,243,86,246,86,247,86,248,86,251,86,252,86,0,87,1,87,2,87,5,87,7,87,11,87,12,87,13,87,14,87,15,87,16,87,17,87,18,87,19,87,20,87,21,87,22,87,23,87,24,87,25,87,26,87,27,87,29,87,30,87,32,87,33,87,34,87,36,87,37,87,38,87,39,87,43,87,49,87,50,87,52,87,53,87,54,87,55,87,56,87,60,87,61,87,63,87,65,87,67,87,68,87,69,87,70,87,72,87,73,87,75,87,82,87,83,87,84,87,85,87,86,87,88,87,89,87,98,87,99,87,101,87,103,87,108,87,110,87,112,87,113,87,114,87,116,87,117,87,120,87,121,87,122,87,125,87,126,87,127,87,128,87,129,87,135,87,136,87,137,87,138,87,141,87,142,87,143,87,144,87,145,87,148,87,149,87,150,87,151,87,152,87,153,87,154,87,156,87,157,87,158,87,159,87,165,87,168,87,170,87,172,87,175,87,176,87,177,87,179,87,181,87,182,87,183,87,185,87,186,87,187,87,188,87,189,87,190,87,191,87,192,87,193,87,196,87,197,87,198,87,199,87,200,87,201,87,202,87,204,87,205,87,208,87,209,87,211,87,214,87,215,87,219,87,220,87,222,87,225,87,226,87,227,87,229,87,230,87,231,87,232,87,233,87,234,87,235,87,236,87,238,87,240,87,241,87,242,87,243,87,245,87,246,87,247,87,251,87,252,87,254,87,255,87,1,88,3,88,4,88,5,88,8,88,9,88,10,88,12,88,14,88,15,88,16,88,18,88,19,88,20,88,22,88,23,88,24,88,26,88,27,88,28,88,29,88,31,88,34,88,35,88,37,88,38,88,39,88,40,88,41,88,43,88,44,88,45,88,46,88,47,88,49,88,50,88,51,88,52,88,54,88,55,88,56,88,57,88,58,88,59,88,60,88,61,88,62,88,63,88,64,88,65,88,66,88,67,88,69,88,70,88,71,88,72,88,73,88,74,88,75,88,78,88,79,88,80,88,82,88,83,88,85,88,86,88,87,88,89,88,90,88,91,88,92,88,93,88,95,88,96,88,97,88,98,88,99,88,100,88,102,88,103,88,104,88,105,88,106,88,109,88,110,88,111,88,112,88,113,88,114,88,115,88,116,88,117,88,118,88,119,88,120,88,121,88,122,88,123,88,124,88,125,88,127,88,130,88,132,88,134,88,135,88,136,88,138,88,139,88,140,88,141,88,142,88,143,88,144,88,145,88,148,88,149,88,150,88,151,88,152,88,155,88,156,88,157,88,160,88,161,88,162,88,163,88,164,88,165,88,166,88,167,88,170,88,171,88,172,88,173,88,174,88,175,88,176,88,177,88,178,88,179,88,180,88,181,88,182,88,183,88,184,88,185,88,186,88,187,88,189,88,190,88,191,88,192,88,194,88,195,88,196,88,198,88,199,88,200,88,201,88,202,88,203,88,204,88,205,88,206,88,207,88,208,88,210,88,211,88,212,88,214,88,215,88,216,88,217,88,218,88,219,88,220,88,221,88,222,88,223,88,224,88,225,88,226,88,227,88,229,88,230,88,231,88,232,88,233,88,234,88,237,88,239,88,241,88,242,88,244,88,245,88,247,88,248,88,250,88,251,88,252,88,253,88,254,88,255,88,0,89,1,89,3,89,5,89,6,89,8,89,9,89,10,89,11,89,12,89,14,89,16,89,17,89,18,89,19,89,23,89,24,89,27,89,29,89,30,89,32,89,33,89,34,89,35,89,38,89,40,89,44,89,48,89,50,89,51,89,53,89,54,89,59,89,61,89,62,89,63,89,64,89,67,89,69,89,70,89,74,89,76,89,77,89,80,89,82,89,83,89,89,89,91,89,92,89,93,89,94,89,95,89,97,89,99,89,100,89,102,89,103,89,104,89,105,89,106,89,107,89,108,89,109,89,110,89,111,89,112,89,113,89,114,89,117,89,119,89,122,89,123,89,124,89,126,89,127,89,128,89,133,89,137,89,139,89,140,89,142,89,143,89,144,89,145,89,148,89,149,89,152,89,154,89,155,89,156,89,157,89,159,89,160,89,161,89,162,89,166,89,167,89,172,89,173,89,176,89,177,89,179,89,180,89,181,89,182,89,183,89,184,89,186,89,188,89,189,89,191,89,192,89,193,89,194,89,195,89,196,89,197,89,199,89,200,89,201,89,204,89,205,89,206,89,207,89,213,89,214,89,217,89,219,89,222,89,223,89,224,89,225,89,226,89,228,89,230,89,231,89,233,89,234,89,235,89,237,89,238,89,239,89,240,89,241,89,242,89,243,89,244,89,245,89,246,89,247,89,248,89,250,89,252,89,253,89,254,89,0,90,2,90,10,90,11,90,13,90,14,90,15,90,16,90,18,90,20,90,21,90,22,90,23,90,25,90,26,90,27,90,29,90,30,90,33,90,34,90,36,90,38,90,39,90,40,90,42,90,43,90,44,90,45,90,46,90,47,90,48,90,51,90,53,90,55,90,56,90,57,90,58,90,59,90,61,90,62,90,63,90,65,90,66,90,67,90,68,90,69,90,71,90,72,90,75,90,76,90,77,90,78,90,79,90,80,90,81,90,82,90,83,90,84,90,86,90,87,90,88,90,89,90,91,90,92,90,93,90,94,90,95,90,96,90,97,90,99,90,100,90,101,90,102,90,104,90,105,90,107,90,108,90,109,90,110,90,111,90,112,90,113,90,114,90,115,90,120,90,121,90,123,90,124,90,125,90,126,90,128,90,129,90,130,90,131,90,132,90,133,90,134,90,135,90,136,90,137,90,138,90,139,90,140,90,141,90,142,90,143,90,144,90,145,90,147,90,148,90,149,90,150,90,151,90,152,90,153,90,156,90,157,90,158,90,159,90,160,90,161,90,162,90,163,90,164,90,165,90,166,90,167,90,168,90,169,90,171,90,172,90,173,90,174,90,175,90,176,90,177,90,180,90,182,90,183,90,185,90,186,90,187,90,188,90,189,90,191,90,192,90,195,90,196,90,197,90,198,90,199,90,200,90,202,90,203,90,205,90,206,90,207,90,208,90,209,90,211,90,213,90,215,90,217,90,218,90,219,90,221,90,222,90,223,90,226,90,228,90,229,90,231,90,232,90,234,90,236,90,237,90,238,90,239,90,240,90,242,90,243,90,244,90,245,90,246,90,247,90,248,90,249,90,250,90,251,90,252,90,253,90,254,90,255,90,0,91,1,91,2,91,3,91,4,91,5,91,6,91,7,91,8,91,10,91,11,91,12,91,13,91,14,91,15,91,16,91,17,91,18,91,19,91,20,91,21,91,24,91,25,91,26,91,27,91,28,91,29,91,30,91,31,91,32,91,33,91,34,91,35,91,36,91,37,91,38,91,39,91,40,91,41,91,42,91,43,91,44,91,45,91,46,91,47,91,48,91,49,91,51,91,53,91,54,91,56,91,57,91,58,91,59,91,60,91,61,91,62,91,63,91,65,91,66,91,67,91,68,91,69,91,70,91,71,91,72,91,73,91,74,91,75,91,76,91,77,91,78,91,79,91,82,91,86,91,94,91,96,91,97,91,103,91,104,91,107,91,109,91,110,91,111,91,114,91,116,91,118,91,119,91,120,91,121,91,123,91,124,91,126,91,127,91,130,91,134,91,138,91,141,91,142,91,144,91,145,91,146,91,148,91,150,91,159,91,167,91,168,91,169,91,172,91,173,91,174,91,175,91,177,91,178,91,183,91,186,91,187,91,188,91,192,91,193,91,195,91,200,91,201,91,202,91,203,91,205,91,206,91,207,91,209,91,212,91,213,91,214,91,215,91,216,91,217,91,218,91,219,91,220,91,224,91,226,91,227,91,230,91,231,91,233,91,234,91,235,91,236,91,237,91,239,91,241,91,242,91,243,91,244,91,245,91,246,91,247,91,253,91,254,91,0,92,2,92,3,92,5,92,7,92,8,92,11,92,12,92,13,92,14,92,16,92,18,92,19,92,23,92,25,92,27,92,30,92,31,92,32,92,33,92,35,92,38,92,40,92,41,92,42,92,43,92,45,92,46,92,47,92,48,92,50,92,51,92,53,92,54,92,55,92,67,92,68,92,70,92,71,92,76,92,77,92,82,92,83,92,84,92,86,92,87,92,88,92,90,92,91,92,92,92,93,92,95,92,98,92,100,92,103,92,104,92,105,92,106,92,107,92,108,92,109,92,112,92,114,92,115,92,116,92,117,92,118,92,119,92,120,92,123,92,124,92,125,92,126,92,128,92,131,92,132,92,133,92,134,92,135,92,137,92,138,92,139,92,142,92,143,92,146,92,147,92,149,92,157,92,158,92,159,92,160,92,161,92,164,92,165,92,166,92,167,92,168,92,170,92,174,92,175,92,176,92,178,92,180,92,182,92,185,92,186,92,187,92,188,92,190,92,192,92,194,92,195,92,197,92,198,92,199,92,200,92,201,92,202,92,204,92,205,92,206,92,207,92,208,92,209,92,211,92,212,92,213,92,214,92,215,92,216,92,218,92,219,92,220,92,221,92,222,92,223,92,224,92,226,92,227,92,231,92,233,92,235,92,236,92,238,92,239,92,241,92,242,92,243,92,244,92,245,92,246,92,247,92,248,92,249,92,250,92,252,92,253,92,254,92,255,92,0,93,1,93,4,93,5,93,8,93,9,93,10,93,11,93,12,93,13,93,15,93,16,93,17,93,18,93,19,93,21,93,23,93,24,93,25,93,26,93,28,93,29,93,31,93,32,93,33,93,34,93,35,93,37,93,40,93,42,93,43,93,44,93,47,93,48,93,49,93,50,93,51,93,53,93,54,93,55,93,56,93,57,93,58,93,59,93,60,93,63,93,64,93,65,93,66,93,67,93,68,93,69,93,70,93,72,93,73,93,77,93,78,93,79,93,80,93,81,93,82,93,83,93,84,93,85,93,86,93,87,93,89,93,90,93,92,93,94,93,95,93,96,93,97,93,98,93,99,93,100,93,101,93,102,93,103,93,104,93,106,93,109,93,110,93,112,93,113,93,114,93,115,93,117,93,118,93,119,93,120,93,121,93,122,93,123,93,124,93,125,93,126,93,127,93,128,93,129,93,131,93,132,93,133,93,134,93,135,93,136,93,137,93,138,93,139,93,140,93,141,93,142,93,143,93,144,93,145,93,146,93,147,93,148,93,149,93,150,93,151,93,152,93,154,93,155,93,156,93,158,93,159,93,160,93,161,93,162,93,163,93,164,93,165,93,166,93,167,93,168,93,169,93,170,93,171,93,172,93,173,93,174,93,175,93,176,93,177,93,178,93,179,93,180,93,181,93,182,93,184,93,185,93,186,93,187,93,188,93,189,93,190,93,191,93,192,93,193,93,194,93,195,93,196,93,198,93,199,93,200,93,201,93,202,93,203,93,204,93,206,93,207,93,208,93,209,93,210,93,211,93,212,93,213,93,214,93,215,93,216,93,217,93,218,93,220,93,223,93,224,93,227,93,228,93,234,93,236,93,237,93,240,93,245,93,246,93,248,93,249,93,250,93,251,93,252,93,255,93,0,94,4,94,7,94,9,94,10,94,11,94,13,94,14,94,18,94,19,94,23,94,30,94,31,94,32,94,33,94,34,94,35,94,36,94,37,94,40,94,41,94,42,94,43,94,44,94,47,94,48,94,50,94,51,94,52,94,53,94,54,94,57,94,58,94,62,94,63,94,64,94,65,94,67,94,70,94,71,94,72,94,73,94,74,94,75,94,77,94,78,94,79,94,80,94,81,94,82,94,83,94,86,94,87,94,88,94,89,94,90,94,92,94,93,94,95,94,96,94,99,94,100,94,101,94,102,94,103,94,104,94,105,94,106,94,107,94,108,94,109,94,110,94,111,94,112,94,113,94,117,94,119,94,121,94,126,94,129,94,130,94,131,94,133,94,136,94,137,94,140,94,141,94,142,94,146,94,152,94,155,94,157,94,161,94,162,94,163,94,164,94,168,94,169,94,170,94,171,94,172,94,174,94,175,94,176,94,177,94,178,94,180,94,186,94,187,94,188,94,189,94,191,94,192,94,193,94,194,94,195,94,196,94,197,94,198,94,199,94,200,94,203,94,204,94,205,94,206,94,207,94,208,94,212,94,213,94,215,94,216,94,217,94,218,94,220,94,221,94,222,94,223,94,224,94,225,94,226,94,227,94,228,94,229,94,230,94,231,94,233,94,235,94,236,94,237,94,238,94,239,94,240,94,241,94,242,94,243,94,245,94,248,94,249,94,251,94,252,94,253,94,5,95,6,95,7,95,9,95,12,95,13,95,14,95,16,95,18,95,20,95,22,95,25,95,26,95,28,95,29,95,30,95,33,95,34,95,35,95,36,95,40,95,43,95,44,95,46,95,48,95,50,95,51,95,52,95,53,95,54,95,55,95,56,95,59,95,61,95,62,95,63,95,65,95,66,95,67,95,68,95,69,95,70,95,71,95,72,95,73,95,74,95,75,95,76,95,77,95,78,95,79,95,81,95,84,95,89,95,90,95,91,95,92,95,94,95,95,95,96,95,99,95,101,95,103,95,104,95,107,95,110,95,111,95,114,95,116,95,117,95,118,95,120,95,122,95,125,95,126,95,127,95,131,95,134,95,141,95,142,95,143,95,145,95,147,95,148,95,150,95,154,95,155,95,157,95,158,95,159,95,160,95,162,95,163,95,164,95,165,95,166,95,167,95,169,95,171,95,172,95,175,95,176,95,177,95,178,95,179,95,180,95,182,95,184,95,185,95,186,95,187,95,190,95,191,95,192,95,193,95,194,95,199,95,200,95,202,95,203,95,206,95,211,95,212,95,213,95,218,95,219,95,220,95,222,95,223,95,226,95,227,95,229,95,230,95,232,95,233,95,236,95,239,95,240,95,242,95,243,95,244,95,246,95,247,95,249,95,250,95,252,95,7,96,8,96,9,96,11,96,12,96,16,96,17,96,19,96,23,96,24,96,26,96,30,96,31,96,34,96,35,96,36,96,44,96,45,96,46,96,48,96,49,96,50,96,51,96,52,96,54,96,55,96,56,96,57,96,58,96,61,96,62,96,64,96,68,96,69,96,70,96,71,96,72,96,73,96,74,96,76,96,78,96,79,96,81,96,83,96,84,96,86,96,87,96,88,96,91,96,92,96,94,96,95,96,96,96,97,96,101,96,102,96,110,96,113,96,114,96,116,96,117,96,119,96,126,96,128,96,129,96,130,96,133,96,134,96,135,96,136,96,138,96,139,96,142,96,143,96,144,96,145,96,147,96,149,96,151,96,152,96,153,96,156,96,158,96,161,96,162,96,164,96,165,96,167,96,169,96,170,96,174,96,176,96,179,96,181,96,182,96,183,96,185,96,186,96,189,96,190,96,191,96,192,96,193,96,194,96,195,96,196,96,199,96,200,96,201,96,204,96,205,96,206,96,207,96,208,96,210,96,211,96,212,96,214,96,215,96,217,96,219,96,222,96,225,96,226,96,227,96,228,96,229,96,234,96,241,96,242,96,245,96,247,96,248,96,251,96,252,96,253,96,254,96,255,96,2,97,3,97,4,97,5,97,7,97,10,97,11,97,12,97,16,97,17,97,18,97,19,97,20,97,22,97,23,97,24,97,25,97,27,97,28,97,29,97,30,97,33,97,34,97,37,97,40,97,41,97,42,97,44,97,45,97,46,97,47,97,48,97,49,97,50,97,51,97,52,97,53,97,54,97,55,97,56,97,57,97,58,97,59,97,60,97,61,97,62,97,64,97,65,97,66,97,67,97,68,97,69,97,70,97,71,97,73,97,75,97,77,97,79,97,80,97,82,97,83,97,84,97,86,97,87,97,88,97,89,97,90,97,91,97,92,97,94,97,95,97,96,97,97,97,99,97,100,97,101,97,102,97,105,97,106,97,107,97,108,97,109,97,110,97,111,97,113,97,114,97,115,97,116,97,118,97,120,97,121,97,122,97,123,97,124,97,125,97,126,97,127,97,128,97,129,97,130,97,131,97,132,97,133,97,134,97,135,97,136,97,137,97,138,97,140,97,141,97,143,97,144,97,145,97,146,97,147,97,149,97,150,97,151,97,152,97,153,97,154,97,155,97,156,97,158,97,159,97,160,97,161,97,162,97,163,97,164,97,165,97,166,97,170,97,171,97,173,97,174,97,175,97,176,97,177,97,178,97,179,97,180,97,181,97,182,97,184,97,185,97,186,97,187,97,188,97,189,97,191,97,192,97,193,97,195,97,196,97,197,97,198,97,199,97,201,97,204,97,205,97,206,97,207,97,208,97,211,97,213,97,214,97,215,97,216,97,217,97,218,97,219,97,220,97,221,97,222,97,223,97,224,97,225,97,226,97,227,97,228,97,229,97,231,97,232,97,233,97,234,97,235,97,236,97,237,97,238,97,239,97,240,97,241,97,242,97,243,97,244,97,246,97,247,97,248,97,249,97,250,97,251,97,252,97,253,97,254,97,0,98,1,98,2,98,3,98,4,98,5,98,7,98,9,98,19,98,20,98,25,98,28,98,29,98,30,98,32,98,35,98,38,98,39,98,40,98,41,98,43,98,45,98,47,98,48,98,49,98,50,98,53,98,54,98,56,98,57,98,58,98,59,98,60,98,66,98,68,98,69,98,70,98,74,98,79,98,80,98,85,98,86,98,87,98,89,98,90,98,92,98,93,98,94,98,95,98,96,98,97,98,98,98,100,98,101,98,104,98,113,98,114,98,116,98,117,98,119,98,120,98,122,98,123,98,125,98,129,98,130,98,131,98,133,98,134,98,135,98,136,98,139,98,140,98,141,98,142,98,143,98,144,98,148,98,153,98,156,98,157,98,158,98,163,98,166,98,167,98,169,98,170,98,173,98,174,98,175,98,176,98,178,98,179,98,180,98,182,98,183,98,184,98,186,98,190,98,192,98,193,98,195,98,203,98,207,98,209,98,213,98,221,98,222,98,224,98,225,98,228,98,234,98,235,98,240,98,242,98,245,98,248,98,249,98,250,98,251,98,0,99,3,99,4,99,5,99,6,99,10,99,11,99,12,99,13,99,15,99,16,99,18,99,19,99,20,99,21,99,23,99,24,99,25,99,28,99,38,99,39,99,41,99,44,99,45,99,46,99,48,99,49,99,51,99,52,99,53,99,54,99,55,99,56,99,59,99,60,99,62,99,63,99,64,99,65,99,68,99,71,99,72,99,74,99,81,99,82,99,83,99,84,99,86,99,87,99,88,99,89,99,90,99,91,99,92,99,93,99,96,99,100,99,101,99,102,99,104,99,106,99,107,99,108,99,111,99,112,99,114,99,115,99,116,99,117,99,120,99,121,99,124,99,125,99,126,99,127,99,129,99,131,99,132,99,133,99,134,99,139,99,141,99,145,99,147,99,148,99,149,99,151,99,153,99,154,99,155,99,156,99,157,99,158,99,159,99,161,99,164,99,166,99,171,99,175,99,177,99,178,99,181,99,182,99,185,99,187,99,189,99,191,99,192,99,193,99,194,99,195,99,197,99,199,99,200,99,202,99,203,99,204,99,209,99,211,99,212,99,213,99,215,99,216,99,217,99,218,99,219,99,220,99,221,99,223,99,226,99,228,99,229,99,230,99,231,99,232,99,235,99,236,99,238,99,239,99,240,99,241,99,243,99,245,99,247,99,249,99,250,99,251,99,252,99,254,99,3,100,4,100,6,100,7,100,8,100,9,100,10,100,13,100,14,100,17,100,18,100,21,100,22,100,23,100,24,100,25,100,26,100,29,100,31,100,34,100,35,100,36,100,37,100,39,100,40,100,41,100,43,100,46,100,47,100,48,100,49,100,50,100,51,100,53,100,54,100,55,100,56,100,57,100,59,100,60,100,62,100,64,100,66,100,67,100,73,100,75,100,76,100,77,100,78,100,79,100,80,100,81,100,83,100,85,100,86,100,87,100,89,100,90,100,91,100,92,100,93,100,95,100,96,100,97,100,98,100,99,100,100,100,101,100,102,100,104,100,106,100,107,100,108,100,110,100,111,100,112,100,113,100,114,100,115,100,116,100,117,100,118,100,119,100,123,100,124,100,125,100,126,100,127,100,128,100,129,100,131,100,134,100,136,100,137,100,138,100,139,100,140,100,141,100,142,100,143,100,144,100,147,100,148,100,151,100,152,100,154,100,155,100,156,100,157,100,159,100,160,100,161,100,162,100,163,100,165,100,166,100,167,100,168,100,170,100,171,100,175,100,177,100,178,100,179,100,180,100,182,100,185,100,187,100,189,100,190,100,191,100,193,100,195,100,196,100,198,100,199,100,200,100,201,100,202,100,203,100,204,100,207,100,209,100,211,100,212,100,213,100,214,100,217,100,218,100,219,100,220,100,221,100,223,100,224,100,225,100,227,100,229,100,231,100,232,100,233,100,234,100,235,100,236,100,237,100,238,100,239,100,240,100,241,100,242,100,243,100,244,100,245,100,246,100,247,100,248,100,249,100,250,100,251,100,252,100,253,100,254,100,255,100,1,101,2,101,3,101,4,101,5,101,6,101,7,101,8,101,10,101,11,101,12,101,13,101,14,101,15,101,16,101,17,101,19,101,20,101,21,101,22,101,23,101,25,101,26,101,27,101,28,101,29,101,30,101,31,101,32,101,33,101,34,101,35,101,36,101,38,101,39,101,40,101,41,101,42,101,44,101,45,101,48,101,49,101,50,101,51,101,55,101,58,101,60,101,61,101,64,101,65,101,66,101,67,101,68,101,70,101,71,101,74,101,75,101,77,101,78,101,80,101,82,101,83,101,84,101,87,101,88,101,90,101,92,101,95,101,96,101,97,101,100,101,101,101,103,101,104,101,105,101,106,101,109,101,110,101,111,101,113,101,115,101,117,101,118,101,120,101,121,101,122,101,123,101,124,101,125,101,126,101,127,101,128,101,129,101,130,101,131,101,132,101,133,101,134,101,136,101,137,101,138,101,141,101,142,101,143,101,146,101,148,101,149,101,150,101,152,101,154,101,157,101], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+17092);
/* memory initializer */ allocate([158,101,160,101,162,101,163,101,166,101,168,101,170,101,172,101,174,101,177,101,178,101,179,101,180,101,181,101,182,101,183,101,184,101,186,101,187,101,190,101,191,101,192,101,194,101,199,101,200,101,201,101,202,101,205,101,208,101,209,101,211,101,212,101,213,101,216,101,217,101,218,101,219,101,220,101,221,101,222,101,223,101,225,101,227,101,228,101,234,101,235,101,242,101,243,101,244,101,245,101,248,101,249,101,251,101,252,101,253,101,254,101,255,101,1,102,4,102,5,102,7,102,8,102,9,102,11,102,13,102,16,102,17,102,18,102,22,102,23,102,24,102,26,102,27,102,28,102,30,102,33,102,34,102,35,102,36,102,38,102,41,102,42,102,43,102,44,102,46,102,48,102,50,102,51,102,55,102,56,102,57,102,58,102,59,102,61,102,63,102,64,102,66,102,68,102,69,102,70,102,71,102,72,102,73,102,74,102,77,102,78,102,80,102,81,102,88,102,89,102,91,102,92,102,93,102,94,102,96,102,98,102,99,102,101,102,103,102,105,102,106,102,107,102,108,102,109,102,113,102,114,102,115,102,117,102,120,102,121,102,123,102,124,102,125,102,127,102,128,102,129,102,131,102,133,102,134,102,136,102,137,102,138,102,139,102,141,102,142,102,143,102,144,102,146,102,147,102,148,102,149,102,152,102,153,102,154,102,155,102,156,102,158,102,159,102,160,102,161,102,162,102,163,102,164,102,165,102,166,102,169,102,170,102,171,102,172,102,173,102,175,102,176,102,177,102,178,102,179,102,181,102,182,102,183,102,184,102,186,102,187,102,188,102,189,102,191,102,192,102,193,102,194,102,195,102,196,102,197,102,198,102,199,102,200,102,201,102,202,102,203,102,204,102,205,102,206,102,207,102,208,102,209,102,210,102,211,102,212,102,213,102,214,102,215,102,216,102,218,102,222,102,223,102,224,102,225,102,226,102,227,102,228,102,229,102,231,102,232,102,234,102,235,102,236,102,237,102,238,102,239,102,241,102,245,102,246,102,248,102,250,102,251,102,253,102,1,103,2,103,3,103,4,103,5,103,6,103,7,103,12,103,14,103,15,103,17,103,18,103,19,103,22,103,24,103,25,103,26,103,28,103,30,103,32,103,33,103,34,103,35,103,36,103,37,103,39,103,41,103,46,103,48,103,50,103,51,103,54,103,55,103,56,103,57,103,59,103,60,103,62,103,63,103,65,103,68,103,69,103,71,103,74,103,75,103,77,103,82,103,84,103,85,103,87,103,88,103,89,103,90,103,91,103,93,103,98,103,99,103,100,103,102,103,103,103,107,103,108,103,110,103,113,103,116,103,118,103,120,103,121,103,122,103,123,103,125,103,128,103,130,103,131,103,133,103,134,103,136,103,138,103,140,103,141,103,142,103,143,103,145,103,146,103,147,103,148,103,150,103,153,103,155,103,159,103,160,103,161,103,164,103,166,103,169,103,172,103,174,103,177,103,178,103,180,103,185,103,186,103,187,103,188,103,189,103,190,103,191,103,192,103,194,103,197,103,198,103,199,103,200,103,201,103,202,103,203,103,204,103,205,103,206,103,213,103,214,103,215,103,219,103,223,103,225,103,227,103,228,103,230,103,231,103,232,103,234,103,235,103,237,103,238,103,242,103,245,103,246,103,247,103,248,103,249,103,250,103,251,103,252,103,254,103,1,104,2,104,3,104,4,104,6,104,13,104,16,104,18,104,20,104,21,104,24,104,25,104,26,104,27,104,28,104,30,104,31,104,32,104,34,104,35,104,36,104,37,104,38,104,39,104,40,104,43,104,44,104,45,104,46,104,47,104,48,104,49,104,52,104,53,104,54,104,58,104,59,104,63,104,71,104,75,104,77,104,79,104,82,104,86,104,87,104,88,104,89,104,90,104,91,104,92,104,93,104,94,104,95,104,106,104,108,104,109,104,110,104,111,104,112,104,113,104,114,104,115,104,117,104,120,104,121,104,122,104,123,104,124,104,125,104,126,104,127,104,128,104,130,104,132,104,135,104,136,104,137,104,138,104,139,104,140,104,141,104,142,104,144,104,145,104,146,104,148,104,149,104,150,104,152,104,153,104,154,104,155,104,156,104,157,104,158,104,159,104,160,104,161,104,163,104,164,104,165,104,169,104,170,104,171,104,172,104,174,104,177,104,178,104,180,104,182,104,183,104,184,104,185,104,186,104,187,104,188,104,189,104,190,104,191,104,193,104,195,104,196,104,197,104,198,104,199,104,200,104,202,104,204,104,206,104,207,104,208,104,209,104,211,104,212,104,214,104,215,104,217,104,219,104,220,104,221,104,222,104,223,104,225,104,226,104,228,104,229,104,230,104,231,104,232,104,233,104,234,104,235,104,236,104,237,104,239,104,242,104,243,104,244,104,246,104,247,104,248,104,251,104,253,104,254,104,255,104,0,105,2,105,3,105,4,105,6,105,7,105,8,105,9,105,10,105,12,105,15,105,17,105,19,105,20,105,21,105,22,105,23,105,24,105,25,105,26,105,27,105,28,105,29,105,30,105,33,105,34,105,35,105,37,105,38,105,39,105,40,105,41,105,42,105,43,105,44,105,46,105,47,105,49,105,50,105,51,105,53,105,54,105,55,105,56,105,58,105,59,105,60,105,62,105,64,105,65,105,67,105,68,105,69,105,70,105,71,105,72,105,73,105,74,105,75,105,76,105,77,105,78,105,79,105,80,105,81,105,82,105,83,105,85,105,86,105,88,105,89,105,91,105,92,105,95,105,97,105,98,105,100,105,101,105,103,105,104,105,105,105,106,105,108,105,109,105,111,105,112,105,114,105,115,105,116,105,117,105,118,105,122,105,123,105,125,105,126,105,127,105,129,105,131,105,133,105,138,105,139,105,140,105,142,105,143,105,144,105,145,105,146,105,147,105,150,105,151,105,153,105,154,105,157,105,158,105,159,105,160,105,161,105,162,105,163,105,164,105,165,105,166,105,169,105,170,105,172,105,174,105,175,105,176,105,178,105,179,105,181,105,182,105,184,105,185,105,186,105,188,105,189,105,190,105,191,105,192,105,194,105,195,105,196,105,197,105,198,105,199,105,200,105,201,105,203,105,205,105,207,105,209,105,210,105,211,105,213,105,214,105,215,105,216,105,217,105,218,105,220,105,221,105,222,105,225,105,226,105,227,105,228,105,229,105,230,105,231,105,232,105,233,105,234,105,235,105,236,105,238,105,239,105,240,105,241,105,243,105,244,105,245,105,246,105,247,105,248,105,249,105,250,105,251,105,252,105,254,105,0,106,1,106,2,106,3,106,4,106,5,106,6,106,7,106,8,106,9,106,11,106,12,106,13,106,14,106,15,106,16,106,17,106,18,106,19,106,20,106,21,106,22,106,25,106,26,106,27,106,28,106,29,106,30,106,32,106,34,106,35,106,36,106,37,106,38,106,39,106,41,106,43,106,44,106,45,106,46,106,48,106,50,106,51,106,52,106,54,106,55,106,56,106,57,106,58,106,59,106,60,106,63,106,64,106,65,106,66,106,67,106,69,106,70,106,72,106,73,106,74,106,75,106,76,106,77,106,78,106,79,106,81,106,82,106,83,106,84,106,85,106,86,106,87,106,90,106,92,106,93,106,94,106,95,106,96,106,98,106,99,106,100,106,102,106,103,106,104,106,105,106,106,106,107,106,108,106,109,106,110,106,111,106,112,106,114,106,115,106,116,106,117,106,118,106,119,106,120,106,122,106,123,106,125,106,126,106,127,106,129,106,130,106,131,106,133,106,134,106,135,106,136,106,137,106,138,106,139,106,140,106,141,106,143,106,146,106,147,106,148,106,149,106,150,106,152,106,153,106,154,106,155,106,156,106,157,106,158,106,159,106,161,106,162,106,163,106,164,106,165,106,166,106,167,106,168,106,170,106,173,106,174,106,175,106,176,106,177,106,178,106,179,106,180,106,181,106,182,106,183,106,184,106,185,106,186,106,187,106,188,106,189,106,190,106,191,106,192,106,193,106,194,106,195,106,196,106,197,106,198,106,199,106,200,106,201,106,202,106,203,106,204,106,205,106,206,106,207,106,208,106,209,106,210,106,211,106,212,106,213,106,214,106,215,106,216,106,217,106,218,106,219,106,220,106,221,106,222,106,223,106,224,106,225,106,226,106,227,106,228,106,229,106,230,106,231,106,232,106,233,106,234,106,235,106,236,106,237,106,238,106,239,106,240,106,241,106,242,106,243,106,244,106,245,106,246,106,247,106,248,106,249,106,250,106,251,106,252,106,253,106,254,106,255,106,0,107,1,107,2,107,3,107,4,107,5,107,6,107,7,107,8,107,9,107,10,107,11,107,12,107,13,107,14,107,15,107,16,107,17,107,18,107,19,107,20,107,21,107,22,107,23,107,24,107,25,107,26,107,27,107,28,107,29,107,30,107,31,107,37,107,38,107,40,107,41,107,42,107,43,107,44,107,45,107,46,107,47,107,48,107,49,107,51,107,52,107,53,107,54,107,56,107,59,107,60,107,61,107,63,107,64,107,65,107,66,107,68,107,69,107,72,107,74,107,75,107,77,107,78,107,79,107,80,107,81,107,82,107,83,107,84,107,85,107,86,107,87,107,88,107,90,107,91,107,92,107,93,107,94,107,95,107,96,107,97,107,104,107,105,107,107,107,108,107,109,107,110,107,111,107,112,107,113,107,114,107,115,107,116,107,117,107,118,107,119,107,120,107,122,107,125,107,126,107,127,107,128,107,133,107,136,107,140,107,142,107,143,107,144,107,145,107,148,107,149,107,151,107,152,107,153,107,156,107,157,107,158,107,159,107,160,107,162,107,163,107,164,107,165,107,166,107,167,107,168,107,169,107,171,107,172,107,173,107,174,107,175,107,176,107,177,107,178,107,182,107,184,107,185,107,186,107,187,107,188,107,189,107,190,107,192,107,195,107,196,107,198,107,199,107,200,107,201,107,202,107,204,107,206,107,208,107,209,107,216,107,218,107,220,107,221,107,222,107,223,107,224,107,226,107,227,107,228,107,229,107,230,107,231,107,232,107,233,107,236,107,237,107,238,107,240,107,241,107,242,107,244,107,246,107,247,107,248,107,250,107,251,107,252,107,254,107,255,107,0,108,1,108,2,108,3,108,4,108,8,108,9,108,10,108,11,108,12,108,14,108,18,108,23,108,28,108,29,108,30,108,32,108,35,108,37,108,43,108,44,108,45,108,49,108,51,108,54,108,55,108,57,108,58,108,59,108,60,108,62,108,63,108,67,108,68,108,69,108,72,108,75,108,76,108,77,108,78,108,79,108,81,108,82,108,83,108,86,108,88,108,89,108,90,108,98,108,99,108,101,108,102,108,103,108,107,108,108,108,109,108,110,108,111,108,113,108,115,108,117,108,119,108,120,108,122,108,123,108,124,108,127,108,128,108,132,108,135,108,138,108,139,108,141,108,142,108,145,108,146,108,149,108,150,108,151,108,152,108,154,108,156,108,157,108,158,108,160,108,162,108,168,108,172,108,175,108,176,108,180,108,181,108,182,108,183,108,186,108,192,108,193,108,194,108,195,108,198,108,199,108,200,108,203,108,205,108,206,108,207,108,209,108,210,108,216,108,217,108,218,108,220,108,221,108,223,108,228,108,230,108,231,108,233,108,236,108,237,108,242,108,244,108,249,108,255,108,0,109,2,109,3,109,5,109,6,109,8,109,9,109,10,109,13,109,15,109,16,109,17,109,19,109,20,109,21,109,22,109,24,109,28,109,29,109,31,109,32,109,33,109,34,109,35,109,36,109,38,109,40,109,41,109,44,109,45,109,47,109,48,109,52,109,54,109,55,109,56,109,58,109,63,109,64,109,66,109,68,109,73,109,76,109,80,109,85,109,86,109,87,109,88,109,91,109,93,109,95,109,97,109,98,109,100,109,101,109,103,109,104,109,107,109,108,109,109,109,112,109,113,109,114,109,115,109,117,109,118,109,121,109,122,109,123,109,125,109,126,109,127,109,128,109,129,109,131,109,132,109,134,109,135,109,138,109,139,109,141,109,143,109,144,109,146,109,150,109,151,109,152,109,153,109,154,109,156,109,162,109,165,109,172,109,173,109,176,109,177,109,179,109,180,109,182,109,183,109,185,109,186,109,187,109,188,109,189,109,190,109,193,109,194,109,195,109,200,109,201,109,202,109,205,109,206,109,207,109,208,109,210,109,211,109,212,109,213,109,215,109,218,109,219,109,220,109,223,109,226,109,227,109,229,109,231,109,232,109,233,109,234,109,237,109,239,109,240,109,242,109,244,109,245,109,246,109,248,109,250,109,253,109,254,109,255,109,0,110,1,110,2,110,3,110,4,110,6,110,7,110,8,110,9,110,11,110,15,110,18,110,19,110,21,110,24,110,25,110,27,110,28,110,30,110,31,110,34,110,38,110,39,110,40,110,42,110,44,110,46,110,48,110,49,110,51,110,53,110,54,110,55,110,57,110,59,110,60,110,61,110,62,110,63,110,64,110,65,110,66,110,69,110,70,110,71,110,72,110,73,110,74,110,75,110,76,110,79,110,80,110,81,110,82,110,85,110,87,110,89,110,90,110,92,110,93,110,94,110,96,110,97,110,98,110,99,110,100,110,101,110,102,110,103,110,104,110,105,110,106,110,108,110,109,110,111,110,112,110,113,110,114,110,115,110,116,110,117,110,118,110,119,110,120,110,121,110,122,110,123,110,124,110,125,110,128,110,129,110,130,110,132,110,135,110,136,110,138,110,139,110,140,110,141,110,142,110,145,110,146,110,147,110,148,110,149,110,150,110,151,110,153,110,154,110,155,110,157,110,158,110,160,110,161,110,163,110,164,110,166,110,168,110,169,110,171,110,172,110,173,110,174,110,176,110,179,110,181,110,184,110,185,110,188,110,190,110,191,110,192,110,195,110,196,110,197,110,198,110,200,110,201,110,202,110,204,110,205,110,206,110,208,110,210,110,214,110,216,110,217,110,219,110,220,110,221,110,227,110,231,110,234,110,235,110,236,110,237,110,238,110,239,110,240,110,241,110,242,110,243,110,245,110,246,110,247,110,248,110,250,110,251,110,252,110,253,110,254,110,255,110,0,111,1,111,3,111,4,111,5,111,7,111,8,111,10,111,11,111,12,111,13,111,14,111,16,111,17,111,18,111,22,111,23,111,24,111,25,111,26,111,27,111,28,111,29,111,30,111,31,111,33,111,34,111,35,111,37,111,38,111,39,111,40,111,44,111,46,111,48,111,50,111,52,111,53,111,55,111,56,111,57,111,58,111,59,111,60,111,61,111,63,111,64,111,65,111,66,111,67,111,68,111,69,111,72,111,73,111,74,111,76,111,78,111,79,111,80,111,81,111,82,111,83,111,84,111,85,111,86,111,87,111,89,111,90,111,91,111,93,111,95,111,96,111,97,111,99,111,100,111,101,111,103,111,104,111,105,111,106,111,107,111,108,111,111,111,112,111,113,111,115,111,117,111,118,111,119,111,121,111,123,111,125,111,126,111,127,111,128,111,129,111,130,111,131,111,133,111,134,111,135,111,138,111,139,111,143,111,144,111,145,111,146,111,147,111,148,111,149,111,150,111,151,111,152,111,153,111,154,111,155,111,157,111,158,111,159,111,160,111,162,111,163,111,164,111,165,111,166,111,168,111,169,111,170,111,171,111,172,111,173,111,174,111,175,111,176,111,177,111,178,111,180,111,181,111,183,111,184,111,186,111,187,111,188,111,189,111,190,111,191,111,193,111,195,111,196,111,197,111,198,111,199,111,200,111,202,111,203,111,204,111,205,111,206,111,207,111,208,111,211,111,212,111,213,111,214,111,215,111,216,111,217,111,218,111,219,111,220,111,221,111,223,111,226,111,227,111,228,111,229,111,230,111,231,111,232,111,233,111,234,111,235,111,236,111,237,111,240,111,241,111,242,111,243,111,244,111,245,111,246,111,247,111,248,111,249,111,250,111,251,111,252,111,253,111,254,111,255,111,0,112,1,112,2,112,3,112,4,112,5,112,6,112,7,112,8,112,9,112,10,112,11,112,12,112,13,112,14,112,15,112,16,112,18,112,19,112,20,112,21,112,22,112,23,112,24,112,25,112,28,112,29,112,30,112,31,112,32,112,33,112,34,112,36,112,37,112,38,112,39,112,40,112,41,112,42,112,43,112,44,112,45,112,46,112,47,112,48,112,49,112,50,112,51,112,52,112,54,112,55,112,56,112,58,112,59,112,60,112,61,112,62,112,63,112,64,112,65,112,66,112,67,112,68,112,69,112,70,112,71,112,72,112,73,112,74,112,75,112,77,112,78,112,80,112,81,112,82,112,83,112,84,112,85,112,86,112,87,112,88,112,89,112,90,112,91,112,92,112,93,112,95,112,96,112,97,112,98,112,99,112,100,112,101,112,102,112,103,112,104,112,105,112,106,112,110,112,113,112,114,112,115,112,116,112,119,112,121,112,122,112,123,112,125,112,129,112,130,112,131,112,132,112,134,112,135,112,136,112,139,112,140,112,141,112,143,112,144,112,145,112,147,112,151,112,152,112,154,112,155,112,158,112,159,112,160,112,161,112,162,112,163,112,164,112,165,112,166,112,167,112,168,112,169,112,170,112,176,112,178,112,180,112,181,112,182,112,186,112,190,112,191,112,196,112,197,112,198,112,199,112,201,112,203,112,204,112,205,112,206,112,207,112,208,112,209,112,210,112,211,112,212,112,213,112,214,112,215,112,218,112,220,112,221,112,222,112,224,112,225,112,226,112,227,112,229,112,234,112,238,112,240,112,241,112,242,112,243,112,244,112,245,112,246,112,248,112,250,112,251,112,252,112,254,112,255,112,0,113,1,113,2,113,3,113,4,113,5,113,6,113,7,113,8,113,11,113,12,113,13,113,14,113,15,113,17,113,18,113,20,113,23,113,27,113,28,113,29,113,30,113,31,113,32,113,33,113,34,113,35,113,36,113,37,113,39,113,40,113,41,113,42,113,43,113,44,113,45,113,46,113,50,113,51,113,52,113,53,113,55,113,56,113,57,113,58,113,59,113,60,113,61,113,62,113,63,113,64,113,65,113,66,113,67,113,68,113,70,113,71,113,72,113,73,113,75,113,77,113,79,113,80,113,81,113,82,113,83,113,84,113,85,113,86,113,87,113,88,113,89,113,90,113,91,113,93,113,95,113,96,113,97,113,98,113,99,113,101,113,105,113,106,113,107,113,108,113,109,113,111,113,112,113,113,113,116,113,117,113,118,113,119,113,121,113,123,113,124,113,126,113,127,113,128,113,129,113,130,113,131,113,133,113,134,113,135,113,136,113,137,113,139,113,140,113,141,113,142,113,144,113,145,113,146,113,147,113,149,113,150,113,151,113,154,113,155,113,156,113,157,113,158,113,161,113,162,113,163,113,164,113,165,113,166,113,167,113,169,113,170,113,171,113,173,113,174,113,175,113,176,113,177,113,178,113,180,113,182,113,183,113,184,113,186,113,187,113,188,113,189,113,190,113,191,113,192,113,193,113,194,113,196,113,197,113,198,113,199,113,200,113,201,113,202,113,203,113,204,113,205,113,207,113,208,113,209,113,210,113,211,113,214,113,215,113,216,113,217,113,218,113,219,113,220,113,221,113,222,113,223,113,225,113,226,113,227,113,228,113,230,113,232,113,233,113,234,113,235,113,236,113,237,113,239,113,240,113,241,113,242,113,243,113,244,113,245,113,246,113,247,113,248,113,250,113,251,113,252,113,253,113,254,113,255,113,0,114,1,114,2,114,3,114,4,114,5,114,7,114,8,114,9,114,10,114,11,114,12,114,13,114,14,114,15,114,16,114,17,114,18,114,19,114,20,114,21,114,22,114,23,114,24,114,25,114,26,114,27,114,28,114,30,114,31,114,32,114,33,114,34,114,35,114,36,114,37,114,38,114,39,114,41,114,43,114,45,114,46,114,47,114,50,114,51,114,52,114,58,114,60,114,62,114,64,114,65,114,66,114,67,114,68,114,69,114,70,114,73,114,74,114,75,114,78,114,79,114,80,114,81,114,83,114,84,114,85,114,87,114,88,114,90,114,92,114,94,114,96,114,99,114,100,114,101,114,104,114,106,114,107,114,108,114,109,114,112,114,113,114,115,114,116,114,118,114,119,114,120,114,123,114,124,114,125,114,130,114,131,114,133,114,134,114,135,114,136,114,137,114,140,114,142,114,144,114,145,114,147,114,148,114,149,114,150,114,151,114,152,114,153,114,154,114,155,114,156,114,157,114,158,114,160,114,161,114,162,114,163,114,164,114,165,114,166,114,167,114,168,114,169,114,170,114,171,114,174,114,177,114,178,114,179,114,181,114,186,114,187,114,188,114,189,114,190,114,191,114,192,114,197,114,198,114,199,114,201,114,202,114,203,114,204,114,207,114,209,114,211,114,212,114,213,114,214,114,216,114,218,114,219,114,198,228,199,228,200,228,201,228,202,228,203,228,204,228,205,228,206,228,207,228,208,228,209,228,210,228,211,228,212,228,213,228,214,228,215,228,216,228,217,228,218,228,219,228,220,228,221,228,222,228,223,228,224,228,225,228,226,228,227,228,228,228,229,228,230,228,231,228,232,228,233,228,234,228,235,228,236,228,237,228,238,228,239,228,240,228,241,228,242,228,243,228,244,228,245,228,246,228,247,228,248,228,249,228,250,228,251,228,252,228,253,228,254,228,255,228,0,229,1,229,2,229,3,229,4,229,5,229,6,229,7,229,8,229,9,229,10,229,11,229,12,229,13,229,14,229,15,229,16,229,17,229,18,229,19,229,20,229,21,229,22,229,23,229,24,229,25,229,26,229,27,229,28,229,29,229,30,229,31,229,32,229,33,229,34,229,35,229,36,229,37,229,0,48,1,48,2,48,183,0,201,2,199,2,168,0,3,48,5,48,20,32,94,255,22,32,38,32,24,32,25,32,28,32,29,32,20,48,21,48,8,48,9,48,10,48,11,48,12,48,13,48,14,48,15,48,22,48,23,48,16,48,17,48,177,0,215,0,247,0,54,34,39,34,40,34,17,34,15,34,42,34,41,34,8,34,55,34,26,34,165,34,37,34,32,34,18,35,153,34,43,34,46,34,97,34,76,34,72,34,61,34,29,34,96,34,110,34,111,34,100,34,101,34,30,34,53,34,52,34,66,38,64,38,176,0,50,32,51,32,3,33,4,255,164,0,224,255,225,255,48,32,167,0,22,33,6,38,5,38,203,37,207,37,206,37,199,37,198,37,161,37,160,37,179,37,178,37,59,32,146,33,144,33,145,33,147,33,19,48,38,229,39,229,40,229,41,229,42,229,43,229,44,229,45,229,46,229,47,229,48,229,49,229,50,229,51,229,52,229,53,229,54,229,55,229,56,229,57,229,58,229,59,229,60,229,61,229,62,229,63,229,64,229,65,229,66,229,67,229,68,229,69,229,70,229,71,229,72,229,73,229,74,229,75,229,76,229,77,229,78,229,79,229,80,229,81,229,82,229,83,229,84,229,85,229,86,229,87,229,88,229,89,229,90,229,91,229,92,229,93,229,94,229,95,229,96,229,97,229,98,229,99,229,100,229,101,229,102,229,103,229,104,229,105,229,106,229,107,229,108,229,109,229,110,229,111,229,112,229,113,229,114,229,115,229,116,229,117,229,118,229,119,229,120,229,121,229,122,229,123,229,124,229,125,229,126,229,127,229,128,229,129,229,130,229,131,229,132,229,133,229,112,33,113,33,114,33,115,33,116,33,117,33,118,33,119,33,120,33,121,33,102,231,103,231,104,231,105,231,106,231,107,231,136,36,137,36,138,36,139,36,140,36,141,36,142,36,143,36,144,36,145,36,146,36,147,36,148,36,149,36,150,36,151,36,152,36,153,36,154,36,155,36,116,36,117,36,118,36,119,36,120,36,121,36,122,36,123,36,124,36,125,36,126,36,127,36,128,36,129,36,130,36,131,36,132,36,133,36,134,36,135,36,96,36,97,36,98,36,99,36,100,36,101,36,102,36,103,36,104,36,105,36,172,32,109,231,32,50,33,50,34,50,35,50,36,50,37,50,38,50,39,50,40,50,41,50,110,231,111,231,96,33,97,33,98,33,99,33,100,33,101,33,102,33,103,33,104,33,105,33,106,33,107,33,112,231,113,231,134,229,135,229,136,229,137,229,138,229,139,229,140,229,141,229,142,229,143,229,144,229,145,229,146,229,147,229,148,229,149,229,150,229,151,229,152,229,153,229,154,229,155,229,156,229,157,229,158,229,159,229,160,229,161,229,162,229,163,229,164,229,165,229,166,229,167,229,168,229,169,229,170,229,171,229,172,229,173,229,174,229,175,229,176,229,177,229,178,229,179,229,180,229,181,229,182,229,183,229,184,229,185,229,186,229,187,229,188,229,189,229,190,229,191,229,192,229,193,229,194,229,195,229,196,229,197,229,198,229,199,229,200,229,201,229,202,229,203,229,204,229,205,229,206,229,207,229,208,229,209,229,210,229,211,229,212,229,213,229,214,229,215,229,216,229,217,229,218,229,219,229,220,229,221,229,222,229,223,229,224,229,225,229,226,229,227,229,228,229,229,229,1,255,2,255,3,255,229,255,5,255,6,255,7,255,8,255,9,255,10,255,11,255,12,255,13,255,14,255,15,255,16,255,17,255,18,255,19,255,20,255,21,255,22,255,23,255,24,255,25,255,26,255,27,255,28,255,29,255,30,255,31,255,32,255,33,255,34,255,35,255,36,255,37,255,38,255,39,255,40,255,41,255,42,255,43,255,44,255,45,255,46,255,47,255,48,255,49,255,50,255,51,255,52,255,53,255,54,255,55,255,56,255,57,255,58,255,59,255,60,255,61,255,62,255,63,255,64,255,65,255,66,255,67,255,68,255,69,255,70,255,71,255,72,255,73,255,74,255,75,255,76,255,77,255,78,255,79,255,80,255,81,255,82,255,83,255,84,255,85,255,86,255,87,255,88,255,89,255,90,255,91,255,92,255,93,255,227,255,230,229,231,229,232,229,233,229,234,229,235,229,236,229,237,229,238,229,239,229,240,229,241,229,242,229,243,229,244,229,245,229,246,229,247,229,248,229,249,229,250,229,251,229,252,229,253,229,254,229,255,229,0,230,1,230,2,230,3,230,4,230,5,230,6,230,7,230,8,230,9,230,10,230,11,230,12,230,13,230,14,230,15,230,16,230,17,230,18,230,19,230,20,230,21,230,22,230,23,230,24,230,25,230,26,230,27,230,28,230,29,230,30,230,31,230,32,230,33,230,34,230,35,230,36,230,37,230,38,230,39,230,40,230,41,230,42,230,43,230,44,230,45,230,46,230,47,230,48,230,49,230,50,230,51,230,52,230,53,230,54,230,55,230,56,230,57,230,58,230,59,230,60,230,61,230,62,230,63,230,64,230,65,230,66,230,67,230,68,230,69,230,65,48,66,48,67,48,68,48,69,48,70,48,71,48,72,48,73,48,74,48,75,48,76,48,77,48,78,48,79,48,80,48,81,48,82,48,83,48,84,48,85,48,86,48,87,48,88,48,89,48,90,48,91,48,92,48,93,48,94,48,95,48,96,48,97,48,98,48,99,48,100,48,101,48,102,48,103,48,104,48,105,48,106,48,107,48,108,48,109,48,110,48,111,48,112,48,113,48,114,48,115,48,116,48,117,48,118,48,119,48,120,48,121,48,122,48,123,48,124,48,125,48,126,48,127,48,128,48,129,48,130,48,131,48,132,48,133,48,134,48,135,48,136,48,137,48,138,48,139,48,140,48,141,48,142,48,143,48,144,48,145,48,146,48,147,48,114,231,115,231,116,231,117,231,118,231,119,231,120,231,121,231,122,231,123,231,124,231,70,230,71,230,72,230,73,230,74,230,75,230,76,230,77,230,78,230,79,230,80,230,81,230,82,230,83,230,84,230,85,230,86,230,87,230,88,230,89,230,90,230,91,230,92,230,93,230,94,230,95,230,96,230,97,230,98,230,99,230,100,230,101,230,102,230,103,230,104,230,105,230,106,230,107,230,108,230,109,230,110,230,111,230,112,230,113,230,114,230,115,230,116,230,117,230,118,230,119,230,120,230,121,230,122,230,123,230,124,230,125,230,126,230,127,230,128,230,129,230,130,230,131,230,132,230,133,230,134,230,135,230,136,230,137,230,138,230,139,230,140,230,141,230,142,230,143,230,144,230,145,230,146,230,147,230,148,230,149,230,150,230,151,230,152,230,153,230,154,230,155,230,156,230,157,230,158,230,159,230,160,230,161,230,162,230,163,230,164,230,165,230,161,48,162,48,163,48,164,48,165,48,166,48,167,48,168,48,169,48,170,48,171,48,172,48,173,48,174,48,175,48,176,48,177,48,178,48,179,48,180,48,181,48,182,48,183,48,184,48,185,48,186,48,187,48,188,48,189,48,190,48,191,48,192,48,193,48,194,48,195,48,196,48,197,48,198,48,199,48,200,48,201,48,202,48,203,48,204,48,205,48,206,48,207,48,208,48,209,48,210,48,211,48,212,48,213,48,214,48,215,48,216,48,217,48,218,48,219,48,220,48,221,48,222,48,223,48,224,48,225,48,226,48,227,48,228,48,229,48,230,48,231,48,232,48,233,48,234,48,235,48,236,48,237,48,238,48,239,48,240,48,241,48,242,48,243,48,244,48,245,48,246,48,125,231,126,231,127,231,128,231,129,231,130,231,131,231,132,231,166,230,167,230,168,230,169,230,170,230,171,230,172,230,173,230,174,230,175,230,176,230,177,230,178,230,179,230,180,230,181,230,182,230,183,230,184,230,185,230,186,230,187,230,188,230,189,230,190,230,191,230,192,230,193,230,194,230,195,230,196,230,197,230,198,230,199,230,200,230,201,230,202,230,203,230,204,230,205,230,206,230,207,230,208,230,209,230,210,230,211,230,212,230,213,230,214,230,215,230,216,230,217,230,218,230,219,230,220,230,221,230,222,230,223,230,224,230,225,230,226,230,227,230,228,230,229,230,230,230,231,230,232,230,233,230,234,230,235,230,236,230,237,230,238,230,239,230,240,230,241,230,242,230,243,230,244,230,245,230,246,230,247,230,248,230,249,230,250,230,251,230,252,230,253,230,254,230,255,230,0,231,1,231,2,231,3,231,4,231,5,231,145,3,146,3,147,3,148,3,149,3,150,3,151,3,152,3,153,3,154,3,155,3,156,3,157,3,158,3,159,3,160,3,161,3,163,3,164,3,165,3,166,3,167,3,168,3,169,3,133,231,134,231,135,231,136,231,137,231,138,231,139,231,140,231,177,3,178,3,179,3,180,3,181,3,182,3,183,3,184,3,185,3,186,3,187,3,188,3,189,3,190,3,191,3,192,3,193,3,195,3,196,3,197,3,198,3,199,3,200,3,201,3,141,231,142,231,143,231,144,231,145,231,146,231,147,231,53,254,54,254,57,254,58,254,63,254,64,254,61,254,62,254,65,254,66,254,67,254,68,254,148,231,149,231,59,254,60,254,55,254,56,254,49,254,150,231,51,254,52,254,151,231,152,231,153,231,154,231,155,231,156,231,157,231,158,231,159,231,6,231,7,231,8,231,9,231,10,231,11,231,12,231,13,231,14,231,15,231,16,231,17,231,18,231,19,231,20,231,21,231,22,231,23,231,24,231,25,231,26,231,27,231,28,231,29,231,30,231,31,231,32,231,33,231,34,231,35,231,36,231,37,231,38,231,39,231,40,231,41,231,42,231,43,231,44,231,45,231,46,231,47,231,48,231,49,231,50,231,51,231,52,231,53,231,54,231,55,231,56,231,57,231,58,231,59,231,60,231,61,231,62,231,63,231,64,231,65,231,66,231,67,231,68,231,69,231,70,231,71,231,72,231,73,231,74,231,75,231,76,231,77,231,78,231,79,231,80,231,81,231,82,231,83,231,84,231,85,231,86,231,87,231,88,231,89,231,90,231,91,231,92,231,93,231,94,231,95,231,96,231,97,231,98,231,99,231,100,231,101,231,16,4,17,4,18,4,19,4,20,4,21,4,1,4,22,4,23,4,24,4,25,4,26,4,27,4,28,4,29,4,30,4,31,4,32,4,33,4,34,4,35,4,36,4,37,4,38,4,39,4,40,4,41,4,42,4,43,4,44,4,45,4,46,4,47,4,160,231,161,231,162,231,163,231,164,231,165,231,166,231,167,231,168,231,169,231,170,231,171,231,172,231,173,231,174,231,48,4,49,4,50,4,51,4,52,4,53,4,81,4,54,4,55,4,56,4,57,4,58,4,59,4,60,4,61,4,62,4,63,4,64,4,65,4,66,4,67,4,68,4,69,4,70,4,71,4,72,4,73,4,74,4,75,4,76,4,77,4,78,4,79,4,175,231,176,231,177,231,178,231,179,231,180,231,181,231,182,231,183,231,184,231,185,231,186,231,187,231,202,2,203,2,217,2,19,32,21,32,37,32,53,32,5,33,9,33,150,33,151,33,152,33,153,33,21,34,31,34,35,34,82,34,102,34,103,34,191,34,80,37,81,37,82,37,83,37,84,37,85,37,86,37,87,37,88,37,89,37,90,37,91,37,92,37,93,37,94,37,95,37,96,37,97,37,98,37,99,37,100,37,101,37,102,37,103,37,104,37,105,37,106,37,107,37,108,37,109,37,110,37,111,37,112,37,113,37,114,37,115,37,129,37,130,37,131,37,132,37,133,37,134,37,135,37,136,37,137,37,138,37,139,37,140,37,141,37,142,37,143,37,147,37,148,37,149,37,188,37,189,37,226,37,227,37,228,37,229,37,9,38,149,34,18,48,29,48,30,48,188,231,189,231,190,231,191,231,192,231,193,231,194,231,195,231,196,231,197,231,198,231,1,1,225,0,206,1,224,0,19,1,233,0,27,1,232,0,43,1,237,0,208,1,236,0,77,1,243,0,210,1,242,0,107,1,250,0,212,1,249,0,214,1,216,1,218,1,220,1,252,0,234,0,81,2,199,231,68,1,72,1,249,1,97,2,201,231,202,231,203,231,204,231,5,49,6,49,7,49,8,49,9,49,10,49,11,49,12,49,13,49,14,49,15,49,16,49,17,49,18,49,19,49,20,49,21,49,22,49,23,49,24,49,25,49,26,49,27,49,28,49,29,49,30,49,31,49,32,49,33,49,34,49,35,49,36,49,37,49,38,49,39,49,40,49,41,49,205,231,206,231,207,231,208,231,209,231,210,231,211,231,212,231,213,231,214,231,215,231,216,231,217,231,218,231,219,231,220,231,221,231,222,231,223,231,224,231,225,231,33,48,34,48,35,48,36,48,37,48,38,48,39,48,40,48,41,48,163,50,142,51,143,51,156,51,157,51,158,51,161,51,196,51,206,51,209,51,210,51,213,51,48,254,226,255,228,255,226,231,33,33,49,50,227,231,16,32,228,231,229,231,230,231,252,48,155,48,156,48,253,48,254,48,6,48,157,48,158,48,73,254,74,254,75,254,76,254,77,254,78,254,79,254,80,254,81,254,82,254,84,254,85,254,86,254,87,254,89,254,90,254,91,254,92,254,93,254,94,254,95,254,96,254,97,254,98,254,99,254,100,254,101,254,102,254,104,254,105,254,106,254,107,254,62,48,240,47,241,47,242,47,243,47,244,47,245,47,246,47,247,47,248,47,249,47,250,47,251,47,7,48,244,231,245,231,246,231,247,231,248,231,249,231,250,231,251,231,252,231,253,231,254,231,255,231,0,232,0,37,1,37,2,37,3,37,4,37,5,37,6,37,7,37,8,37,9,37,10,37,11,37,12,37,13,37,14,37,15,37,16,37,17,37,18,37,19,37,20,37,21,37,22,37,23,37,24,37,25,37,26,37,27,37,28,37,29,37,30,37,31,37,32,37,33,37,34,37,35,37,36,37,37,37,38,37,39,37,40,37,41,37,42,37,43,37,44,37,45,37,46,37,47,37,48,37,49,37,50,37,51,37,52,37,53,37,54,37,55,37,56,37,57,37,58,37,59,37,60,37,61,37,62,37,63,37,64,37,65,37,66,37,67,37,68,37,69,37,70,37,71,37,72,37,73,37,74,37,75,37,1,232,2,232,3,232,4,232,5,232,6,232,7,232,8,232,9,232,10,232,11,232,12,232,13,232,14,232,15,232,220,114,221,114,223,114,226,114,227,114,228,114,229,114,230,114,231,114,234,114,235,114,245,114,246,114,249,114,253,114,254,114,255,114,0,115,2,115,4,115,5,115,6,115,7,115,8,115,9,115,11,115,12,115,13,115,15,115,16,115,17,115,18,115,20,115,24,115,25,115,26,115,31,115,32,115,35,115,36,115,38,115,39,115,40,115,45,115,47,115,48,115,50,115,51,115,53,115,54,115,58,115,59,115,60,115,61,115,64,115,65,115,66,115,67,115,68,115,69,115,70,115,71,115,72,115,73,115,74,115,75,115,76,115,78,115,79,115,81,115,83,115,84,115,85,115,86,115,88,115,89,115,90,115,91,115,92,115,93,115,94,115,95,115,97,115,98,115,99,115,100,115,101,115,102,115,103,115,104,115,105,115,106,115,107,115,110,115,112,115,113,115,0,224,1,224,2,224,3,224,4,224,5,224,6,224,7,224,8,224,9,224,10,224,11,224,12,224,13,224,14,224,15,224,16,224,17,224,18,224,19,224,20,224,21,224,22,224,23,224,24,224,25,224,26,224,27,224,28,224,29,224,30,224,31,224,32,224,33,224,34,224,35,224,36,224,37,224,38,224,39,224,40,224,41,224,42,224,43,224,44,224,45,224,46,224,47,224,48,224,49,224,50,224,51,224,52,224,53,224,54,224,55,224,56,224,57,224,58,224,59,224,60,224,61,224,62,224,63,224,64,224,65,224,66,224,67,224,68,224,69,224,70,224,71,224,72,224,73,224,74,224,75,224,76,224,77,224,78,224,79,224,80,224,81,224,82,224,83,224,84,224,85,224,86,224,87,224,88,224,89,224,90,224,91,224,92,224,93,224,114,115,115,115,116,115,117,115,118,115,119,115,120,115,121,115,122,115,123,115,124,115,125,115,127,115,128,115,129,115,130,115,131,115,133,115,134,115,136,115,138,115,140,115,141,115,143,115,144,115,146,115,147,115,148,115,149,115,151,115,152,115,153,115,154,115,156,115,157,115,158,115,160,115,161,115,163,115,164,115,165,115,166,115,167,115,168,115,170,115,172,115,173,115,177,115,180,115,181,115,182,115,184,115,185,115,188,115,189,115,190,115,191,115,193,115,195,115,196,115,197,115,198,115,199,115,203,115,204,115,206,115,210,115,211,115,212,115,213,115,214,115,215,115,216,115,218,115,219,115,220,115,221,115,223,115,225,115,226,115,227,115,228,115,230,115,232,115,234,115,235,115,236,115,238,115,239,115,240,115,241,115,243,115,244,115,245,115,246,115,247,115,94,224,95,224,96,224,97,224,98,224,99,224,100,224,101,224,102,224,103,224,104,224,105,224,106,224,107,224,108,224,109,224,110,224,111,224,112,224,113,224,114,224,115,224,116,224,117,224,118,224,119,224,120,224,121,224,122,224,123,224,124,224,125,224,126,224,127,224,128,224,129,224,130,224,131,224,132,224,133,224,134,224,135,224,136,224,137,224,138,224,139,224,140,224,141,224,142,224,143,224,144,224,145,224,146,224,147,224,148,224,149,224,150,224,151,224,152,224,153,224,154,224,155,224,156,224,157,224,158,224,159,224,160,224,161,224,162,224,163,224,164,224,165,224,166,224,167,224,168,224,169,224,170,224,171,224,172,224,173,224,174,224,175,224,176,224,177,224,178,224,179,224,180,224,181,224,182,224,183,224,184,224,185,224,186,224,187,224,248,115,249,115,250,115,251,115,252,115,253,115,254,115,255,115,0,116,1,116,2,116,4,116,7,116,8,116,11,116,12,116,13,116,14,116,17,116,18,116,19,116,20,116,21,116,22,116,23,116,24,116,25,116,28,116,29,116,30,116,31,116,32,116,33,116,35,116,36,116,39,116,41,116,43,116,45,116,47,116,49,116,50,116,55,116,56,116,57,116,58,116,59,116,61,116,62,116,63,116,64,116,66,116,67,116,68,116,69,116,70,116,71,116,72,116,73,116,74,116,75,116,76,116,77,116,78,116,79,116,80,116,81,116,82,116,83,116,84,116,86,116,88,116,93,116,96,116,97,116,98,116,99,116,100,116,101,116,102,116,103,116,104,116,105,116,106,116,107,116,108,116,110,116,111,116,113,116,114,116,115,116,116,116,117,116,120,116,121,116,122,116,188,224,189,224,190,224,191,224,192,224,193,224,194,224,195,224,196,224,197,224,198,224,199,224,200,224,201,224,202,224,203,224,204,224,205,224,206,224,207,224,208,224,209,224,210,224,211,224,212,224,213,224,214,224,215,224,216,224,217,224,218,224,219,224,220,224,221,224,222,224,223,224,224,224,225,224,226,224,227,224,228,224,229,224,230,224,231,224,232,224,233,224,234,224,235,224,236,224,237,224,238,224,239,224,240,224,241,224,242,224,243,224,244,224,245,224,246,224,247,224,248,224,249,224,250,224,251,224,252,224,253,224,254,224,255,224,0,225,1,225,2,225,3,225,4,225,5,225,6,225,7,225,8,225,9,225,10,225,11,225,12,225,13,225,14,225,15,225,16,225,17,225,18,225,19,225,20,225,21,225,22,225,23,225,24,225,25,225,123,116,124,116,125,116,127,116,130,116,132,116,133,116,134,116,136,116,137,116,138,116,140,116,141,116,143,116,145,116,146,116,147,116,148,116,149,116,150,116,151,116,152,116,153,116,154,116,155,116,157,116,159,116,160,116,161,116,162,116,163,116,164,116,165,116,166,116,170,116,171,116,172,116,173,116,174,116,175,116,176,116,177,116,178,116,179,116,180,116,181,116,182,116,183,116,184,116,185,116,187,116,188,116,189,116,190,116,191,116,192,116,193,116,194,116,195,116,196,116,197,116,198,116,199,116,200,116,201,116,202,116,203,116,204,116,205,116,206,116,207,116,208,116,209,116,211,116,212,116,213,116,214,116,215,116,216,116,217,116,218,116,219,116,221,116,223,116,225,116,229,116,231,116,232,116,233,116,234,116,235,116,236,116,237,116,240,116,241,116,242,116,26,225,27,225,28,225,29,225,30,225,31,225,32,225,33,225,34,225,35,225,36,225,37,225,38,225,39,225,40,225,41,225,42,225,43,225,44,225,45,225,46,225,47,225,48,225,49,225,50,225,51,225,52,225,53,225,54,225,55,225,56,225,57,225,58,225,59,225,60,225,61,225,62,225,63,225,64,225,65,225,66,225,67,225,68,225,69,225,70,225,71,225,72,225,73,225,74,225,75,225,76,225,77,225,78,225,79,225,80,225,81,225,82,225,83,225,84,225,85,225,86,225,87,225,88,225,89,225,90,225,91,225,92,225,93,225,94,225,95,225,96,225,97,225,98,225,99,225,100,225,101,225,102,225,103,225,104,225,105,225,106,225,107,225,108,225,109,225,110,225,111,225,112,225,113,225,114,225,115,225,116,225,117,225,118,225,119,225,243,116,245,116,248,116,249,116,250,116,251,116,252,116,253,116,254,116,0,117,1,117,2,117,3,117,5,117,6,117,7,117,8,117,9,117,10,117,11,117,12,117,14,117,16,117,18,117,20,117,21,117,22,117,23,117,27,117,29,117,30,117,32,117,33,117,34,117,35,117,36,117,38,117,39,117,42,117,46,117,52,117,54,117,57,117,60,117,61,117,63,117,65,117,66,117,67,117,68,117,70,117,71,117,73,117,74,117,77,117,80,117,81,117,82,117,83,117,85,117,86,117,87,117,88,117,93,117,94,117,95,117,96,117,97,117,98,117,99,117,100,117,103,117,104,117,105,117,107,117,108,117,109,117,110,117,111,117,112,117,113,117,115,117,117,117,118,117,119,117,122,117,123,117,124,117,125,117,126,117,128,117,129,117,130,117,132,117,133,117,135,117,120,225,121,225,122,225,123,225,124,225,125,225,126,225,127,225,128,225,129,225,130,225,131,225,132,225,133,225,134,225,135,225,136,225,137,225,138,225,139,225,140,225,141,225,142,225,143,225,144,225,145,225,146,225,147,225,148,225,149,225,150,225,151,225,152,225,153,225,154,225,155,225,156,225,157,225,158,225,159,225,160,225,161,225,162,225,163,225,164,225,165,225,166,225,167,225,168,225,169,225,170,225,171,225,172,225,173,225,174,225,175,225,176,225,177,225,178,225,179,225,180,225,181,225,182,225,183,225,184,225,185,225,186,225,187,225,188,225,189,225,190,225,191,225,192,225,193,225,194,225,195,225,196,225,197,225,198,225,199,225,200,225,201,225,202,225,203,225,204,225,205,225,206,225,207,225,208,225,209,225,210,225,211,225,212,225,213,225,136,117,137,117,138,117,140,117,141,117,142,117,144,117,147,117,149,117,152,117,155,117,156,117,158,117,162,117,166,117,167,117,168,117,169,117,170,117,173,117,182,117,183,117,186,117,187,117,191,117,192,117,193,117,198,117,203,117,204,117,206,117,207,117,208,117,209,117,211,117,215,117,217,117,218,117,220,117,221,117,223,117,224,117,225,117,229,117,233,117,236,117,237,117,238,117,239,117,242,117,243,117,245,117,246,117,247,117,248,117,250,117,251,117,253,117,254,117,2,118,4,118,6,118,7,118,8,118,9,118,11,118,13,118,14,118,15,118,17,118,18,118,19,118,20,118,22,118,26,118,28,118,29,118,30,118,33,118,35,118,39,118,40,118,44,118,46,118,47,118,49,118,50,118,54,118,55,118,57,118,58,118,59,118,61,118,65,118,66,118,68,118,214,225,215,225,216,225,217,225,218,225,219,225,220,225,221,225,222,225,223,225,224,225,225,225,226,225,227,225,228,225,229,225,230,225,231,225,232,225,233,225,234,225,235,225,236,225,237,225,238,225,239,225,240,225,241,225,242,225,243,225,244,225,245,225,246,225,247,225,248,225,249,225,250,225,251,225], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+27332);
/* memory initializer */ allocate([252,225,253,225,254,225,255,225,0,226,1,226,2,226,3,226,4,226,5,226,6,226,7,226,8,226,9,226,10,226,11,226,12,226,13,226,14,226,15,226,16,226,17,226,18,226,19,226,20,226,21,226,22,226,23,226,24,226,25,226,26,226,27,226,28,226,29,226,30,226,31,226,32,226,33,226,34,226,35,226,36,226,37,226,38,226,39,226,40,226,41,226,42,226,43,226,44,226,45,226,46,226,47,226,48,226,49,226,50,226,51,226,69,118,70,118,71,118,72,118,73,118,74,118,75,118,78,118,79,118,80,118,81,118,82,118,83,118,85,118,87,118,88,118,89,118,90,118,91,118,93,118,95,118,96,118,97,118,98,118,100,118,101,118,102,118,103,118,104,118,105,118,106,118,108,118,109,118,110,118,112,118,113,118,114,118,115,118,116,118,117,118,118,118,119,118,121,118,122,118,124,118,127,118,128,118,129,118,131,118,133,118,137,118,138,118,140,118,141,118,143,118,144,118,146,118,148,118,149,118,151,118,152,118,154,118,155,118,156,118,157,118,158,118,159,118,160,118,161,118,162,118,163,118,165,118,166,118,167,118,168,118,169,118,170,118,171,118,172,118,173,118,175,118,176,118,179,118,181,118,182,118,183,118,184,118,185,118,186,118,187,118,188,118,189,118,190,118,192,118,193,118,195,118,74,85,63,150,195,87,40,99,206,84,9,85,192,84,145,118,76,118,60,133,238,119,126,130,141,120,49,114,152,150,141,151,40,108,137,91,250,79,9,99,151,102,184,92,250,128,72,104,174,128,2,102,206,118,249,81,86,101,172,113,241,127,132,136,178,80,101,89,202,97,179,111,173,130,76,99,82,98,237,83,39,84,6,123,107,81,164,117,244,93,212,98,203,141,118,151,138,98,25,128,93,87,56,151,98,127,56,114,125,118,207,103,126,118,70,100,112,79,37,141,220,98,23,122,145,101,237,115,44,100,115,98,44,130,129,152,127,103,72,114,110,98,204,98,52,79,227,116,74,83,158,82,202,126,166,144,46,94,134,104,156,105,128,129,209,126,210,104,197,120,140,134,81,149,141,80,36,140,222,130,222,128,5,83,18,137,101,82,196,118,199,118,201,118,203,118,204,118,211,118,213,118,217,118,218,118,220,118,221,118,222,118,224,118,225,118,226,118,227,118,228,118,230,118,231,118,232,118,233,118,234,118,235,118,236,118,237,118,240,118,243,118,245,118,246,118,247,118,250,118,251,118,253,118,255,118,0,119,2,119,3,119,5,119,6,119,10,119,12,119,14,119,15,119,16,119,17,119,18,119,19,119,20,119,21,119,22,119,23,119,24,119,27,119,28,119,29,119,30,119,33,119,35,119,36,119,37,119,39,119,42,119,43,119,44,119,46,119,48,119,49,119,50,119,51,119,52,119,57,119,59,119,61,119,62,119,63,119,66,119,68,119,69,119,70,119,72,119,73,119,74,119,75,119,76,119,77,119,78,119,79,119,82,119,83,119,84,119,85,119,86,119,87,119,88,119,89,119,92,119,132,133,249,150,221,79,33,88,113,153,157,91,177,98,165,98,180,102,121,140,141,156,6,114,111,103,145,120,178,96,81,83,23,83,136,143,204,128,29,141,161,148,13,80,200,114,7,89,235,96,25,113,171,136,84,89,239,130,44,103,40,123,41,93,247,126,45,117,245,108,102,142,248,143,60,144,59,159,212,107,25,145,20,123,124,95,167,120,214,132,61,133,213,107,217,107,214,107,1,94,135,94,249,117,237,149,93,101,10,95,197,95,159,143,193,88,194,129,127,144,91,150,173,151,185,143,22,127,44,141,65,98,191,79,216,83,94,83,168,143,169,143,171,143,77,144,7,104,106,95,152,129,104,136,214,156,139,97,43,82,42,118,108,95,140,101,210,111,232,110,190,91,72,100,117,81,176,81,196,103,25,78,201,121,124,153,179,112,93,119,94,119,95,119,96,119,100,119,103,119,105,119,106,119,109,119,110,119,111,119,112,119,113,119,114,119,115,119,116,119,117,119,118,119,119,119,120,119,122,119,123,119,124,119,129,119,130,119,131,119,134,119,135,119,136,119,137,119,138,119,139,119,143,119,144,119,147,119,148,119,149,119,150,119,151,119,152,119,153,119,154,119,155,119,156,119,157,119,158,119,161,119,163,119,164,119,166,119,168,119,171,119,173,119,174,119,175,119,177,119,178,119,180,119,182,119,183,119,184,119,185,119,186,119,188,119,190,119,192,119,193,119,194,119,195,119,196,119,197,119,198,119,199,119,200,119,201,119,202,119,203,119,204,119,206,119,207,119,208,119,209,119,210,119,211,119,212,119,213,119,214,119,216,119,217,119,218,119,221,119,222,119,223,119,224,119,225,119,228,119,197,117,118,94,187,115,224,131,173,100,232,98,181,148,226,108,90,83,195,82,15,100,194,148,148,123,47,79,27,94,54,130,22,129,138,129,36,110,202,108,115,154,85,99,92,83,250,84,101,136,224,87,13,78,3,94,101,107,63,124,232,144,22,96,230,100,28,115,193,136,80,103,77,98,34,141,108,119,41,142,199,145,105,95,220,131,33,133,16,153,194,83,149,134,139,107,237,96,232,96,127,112,205,130,49,130,211,78,167,108,207,133,205,100,217,124,253,105,249,102,73,131,149,83,86,123,167,79,140,81,75,109,66,92,109,142,210,99,201,83,44,131,54,131,229,103,180,120,61,100,223,91,148,92,238,93,231,139,198,98,244,103,122,140,0,100,186,99,73,135,139,153,23,140,32,127,242,148,167,78,16,150,164,152,12,102,22,115,230,119,232,119,234,119,239,119,240,119,241,119,242,119,244,119,245,119,247,119,249,119,250,119,251,119,252,119,3,120,4,120,5,120,6,120,7,120,8,120,10,120,11,120,14,120,15,120,16,120,19,120,21,120,25,120,27,120,30,120,32,120,33,120,34,120,36,120,40,120,42,120,43,120,46,120,47,120,49,120,50,120,51,120,53,120,54,120,61,120,63,120,65,120,66,120,67,120,68,120,70,120,72,120,73,120,74,120,75,120,77,120,79,120,81,120,83,120,84,120,88,120,89,120,90,120,91,120,92,120,94,120,95,120,96,120,97,120,98,120,99,120,100,120,101,120,102,120,103,120,104,120,105,120,111,120,112,120,113,120,114,120,115,120,116,120,117,120,118,120,120,120,121,120,122,120,123,120,125,120,126,120,127,120,128,120,129,120,130,120,131,120,58,87,29,92,56,94,127,149,127,80,160,128,130,83,94,101,69,117,49,85,33,80,133,141,132,98,158,148,29,103,50,86,110,111,226,93,53,84,146,112,102,143,111,98,164,100,163,99,123,95,136,111,244,144,227,129,176,143,24,92,104,102,241,95,137,108,72,150,129,141,108,136,145,100,240,121,206,87,89,106,16,98,72,84,88,78,11,122,233,96,132,111,218,139,127,98,30,144,139,154,228,121,3,84,244,117,1,99,25,83,96,108,223,143,27,95,112,154,59,128,127,159,136,79,58,92,100,141,197,127,165,101,189,112,69,81,178,81,107,134,7,93,160,91,189,98,108,145,116,117,12,142,32,122,1,97,121,123,199,78,248,126,133,119,17,78,237,129,29,82,250,81,113,106,168,83,135,142,4,149,207,150,193,110,100,150,90,105,132,120,133,120,134,120,136,120,138,120,139,120,143,120,144,120,146,120,148,120,149,120,150,120,153,120,157,120,158,120,160,120,162,120,164,120,166,120,168,120,169,120,170,120,171,120,172,120,173,120,174,120,175,120,181,120,182,120,183,120,184,120,186,120,187,120,188,120,189,120,191,120,192,120,194,120,195,120,196,120,198,120,199,120,200,120,204,120,205,120,206,120,207,120,209,120,210,120,211,120,214,120,215,120,216,120,218,120,219,120,220,120,221,120,222,120,223,120,224,120,225,120,226,120,227,120,228,120,229,120,230,120,231,120,233,120,234,120,235,120,237,120,238,120,239,120,240,120,241,120,243,120,245,120,246,120,248,120,249,120,251,120,252,120,253,120,254,120,255,120,0,121,2,121,3,121,4,121,6,121,7,121,8,121,9,121,10,121,11,121,12,121,64,120,168,80,215,119,16,100,230,137,4,89,227,99,221,93,127,122,61,105,32,79,57,130,152,85,50,78,174,117,151,122,98,94,138,94,239,149,27,82,57,84,138,112,118,99,36,149,130,87,37,102,63,105,135,145,7,85,243,109,175,126,34,136,51,98,240,126,181,117,40,131,193,120,204,150,158,143,72,97,247,116,205,139,100,107,58,82,80,141,33,107,106,128,113,132,241,86,6,83,206,78,27,78,209,81,151,124,139,145,7,124,195,79,127,142,225,123,156,122,103,100,20,93,172,80,6,129,1,118,185,124,236,109,224,127,81,103,88,91,248,91,203,120,174,100,19,100,170,99,43,99,25,149,45,100,190,143,84,123,41,118,83,98,39,89,70,84,121,107,163,80,52,98,38,94,134,107,227,78,55,141,139,136,133,95,46,144,13,121,14,121,15,121,16,121,17,121,18,121,20,121,21,121,22,121,23,121,24,121,25,121,26,121,27,121,28,121,29,121,31,121,32,121,33,121,34,121,35,121,37,121,38,121,39,121,40,121,41,121,42,121,43,121,44,121,45,121,46,121,47,121,48,121,49,121,50,121,51,121,53,121,54,121,55,121,56,121,57,121,61,121,63,121,66,121,67,121,68,121,69,121,71,121,74,121,75,121,76,121,77,121,78,121,79,121,80,121,81,121,82,121,84,121,85,121,88,121,89,121,97,121,99,121,100,121,102,121,105,121,106,121,107,121,108,121,110,121,112,121,113,121,114,121,115,121,116,121,117,121,118,121,121,121,123,121,124,121,125,121,126,121,127,121,130,121,131,121,134,121,135,121,136,121,137,121,139,121,140,121,141,121,142,121,144,121,145,121,146,121,32,96,61,128,197,98,57,78,85,83,248,144,184,99,198,128,230,101,46,108,70,79,238,96,225,109,222,139,57,95,203,134,83,95,33,99,90,81,97,131,99,104,0,82,99,99,72,142,18,80,155,92,119,121,252,91,48,82,59,122,188,96,83,144,215,118,183,95,151,95,132,118,108,142,111,112,123,118,73,123,170,119,243,81,147,144,36,88,78,79,244,110,234,143,76,101,27,123,196,114,164,109,223,127,225,90,181,98,149,94,48,87,130,132,44,123,29,94,31,95,18,144,20,127,160,152,130,99,199,110,152,120,185,112,120,81,91,151,171,87,53,117,67,79,56,117,151,94,230,96,96,89,192,109,191,107,137,120,252,83,213,150,203,81,1,82,137,99,10,84,147,148,3,140,204,141,57,114,159,120,118,135,237,143,13,140,224,83,147,121,148,121,149,121,150,121,151,121,152,121,153,121,155,121,156,121,157,121,158,121,159,121,160,121,161,121,162,121,163,121,164,121,165,121,166,121,168,121,169,121,170,121,171,121,172,121,173,121,174,121,175,121,176,121,177,121,178,121,180,121,181,121,182,121,183,121,184,121,188,121,191,121,194,121,196,121,197,121,199,121,200,121,202,121,204,121,206,121,207,121,208,121,211,121,212,121,214,121,215,121,217,121,218,121,219,121,220,121,221,121,222,121,224,121,225,121,226,121,229,121,232,121,234,121,236,121,238,121,241,121,242,121,243,121,244,121,245,121,246,121,247,121,249,121,250,121,252,121,254,121,255,121,1,122,4,122,5,122,7,122,8,122,9,122,10,122,12,122,15,122,16,122,17,122,18,122,19,122,21,122,22,122,24,122,25,122,27,122,28,122,1,78,239,118,238,83,137,148,118,152,14,159,45,149,154,91,162,139,34,78,28,78,172,81,99,132,194,97,168,82,11,104,151,79,107,96,187,81,30,109,92,81,150,98,151,101,97,150,70,140,23,144,216,117,253,144,99,119,210,107,138,114,236,114,251,139,53,88,121,119,76,141,92,103,64,149,154,128,166,94,33,110,146,89,239,122,237,119,59,149,181,107,173,101,14,127,6,88,81,81,31,150,249,91,169,88,40,84,114,142,102,101,127,152,228,86,157,148,254,118,65,144,135,99,198,84,26,89,58,89,155,87,178,142,53,103,250,141,53,130,65,82,240,96,21,88,254,134,232,92,69,158,196,79,157,152,185,139,37,90,118,96,132,83,124,98,79,144,2,145,127,153,105,96,12,128,63,81,51,128,20,92,117,153,49,109,140,78,29,122,31,122,33,122,34,122,36,122,37,122,38,122,39,122,40,122,41,122,42,122,43,122,44,122,45,122,46,122,47,122,48,122,49,122,50,122,52,122,53,122,54,122,56,122,58,122,62,122,64,122,65,122,66,122,67,122,68,122,69,122,71,122,72,122,73,122,74,122,75,122,76,122,77,122,78,122,79,122,80,122,82,122,83,122,84,122,85,122,86,122,88,122,89,122,90,122,91,122,92,122,93,122,94,122,95,122,96,122,97,122,98,122,99,122,100,122,101,122,102,122,103,122,104,122,105,122,106,122,107,122,108,122,109,122,110,122,111,122,113,122,114,122,115,122,117,122,123,122,124,122,125,122,126,122,130,122,133,122,135,122,137,122,138,122,139,122,140,122,142,122,143,122,144,122,147,122,148,122,153,122,154,122,155,122,158,122,161,122,162,122,48,141,209,83,90,127,79,123,16,79,79,78,0,150,213,108,208,115,233,133,6,94,106,117,251,127,10,106,254,119,146,148,65,126,225,81,230,112,205,83,212,143,3,131,41,141,175,114,109,153,219,108,74,87,179,130,185,101,170,128,63,98,50,150,168,89,255,78,191,139,186,126,62,101,242,131,94,151,97,85,222,152,165,128,42,83,253,139,32,84,186,128,159,94,184,108,57,141,172,130,90,145,41,84,27,108,6,82,183,126,95,87,26,113,126,108,137,124,75,89,253,78,255,95,36,97,170,124,48,78,1,92,171,103,2,135,240,92,11,149,206,152,175,117,253,112,34,144,175,81,29,127,189,139,73,89,228,81,91,79,38,84,43,89,119,101,164,128,117,91,118,98,194,98,144,143,69,94,31,108,38,123,15,79,216,79,13,103,163,122,164,122,167,122,169,122,170,122,171,122,174,122,175,122,176,122,177,122,178,122,180,122,181,122,182,122,183,122,184,122,185,122,186,122,187,122,188,122,189,122,190,122,192,122,193,122,194,122,195,122,196,122,197,122,198,122,199,122,200,122,201,122,202,122,204,122,205,122,206,122,207,122,208,122,209,122,210,122,211,122,212,122,213,122,215,122,216,122,218,122,219,122,220,122,221,122,225,122,226,122,228,122,231,122,232,122,233,122,234,122,235,122,236,122,238,122,240,122,241,122,242,122,243,122,244,122,245,122,246,122,247,122,248,122,251,122,252,122,254,122,0,123,1,123,2,123,5,123,7,123,9,123,12,123,13,123,14,123,16,123,18,123,19,123,22,123,23,123,24,123,26,123,28,123,29,123,31,123,33,123,34,123,35,123,39,123,41,123,45,123,110,109,170,109,143,121,177,136,23,95,43,117,154,98,133,143,239,79,220,145,167,101,47,129,81,129,156,94,80,129,116,141,111,82,134,137,75,141,13,89,133,80,216,78,28,150,54,114,121,129,31,141,204,91,163,139,68,150,135,89,26,127,144,84,118,86,14,86,229,139,57,101,130,105,153,148,214,118,137,110,114,94,24,117,70,103,209,103,255,122,157,128,118,141,31,97,198,121,98,101,99,141,136,81,26,82,162,148,56,127,155,128,178,126,151,92,47,110,96,103,217,123,139,118,216,154,143,129,148,127,213,124,30,100,80,149,63,122,74,84,229,84,76,107,1,100,8,98,61,158,243,128,153,117,114,82,105,151,91,132,60,104,228,134,1,150,148,150,236,148,42,78,4,84,217,126,57,104,223,141,21,128,244,102,154,94,185,127,47,123,48,123,50,123,52,123,53,123,54,123,55,123,57,123,59,123,61,123,63,123,64,123,65,123,66,123,67,123,68,123,70,123,72,123,74,123,77,123,78,123,83,123,85,123,87,123,89,123,92,123,94,123,95,123,97,123,99,123,100,123,101,123,102,123,103,123,104,123,105,123,106,123,107,123,108,123,109,123,111,123,112,123,115,123,116,123,118,123,120,123,122,123,124,123,125,123,127,123,129,123,130,123,131,123,132,123,134,123,135,123,136,123,137,123,138,123,139,123,140,123,142,123,143,123,145,123,146,123,147,123,150,123,152,123,153,123,154,123,155,123,158,123,159,123,160,123,163,123,164,123,165,123,174,123,175,123,176,123,178,123,179,123,181,123,182,123,183,123,185,123,186,123,187,123,188,123,189,123,190,123,191,123,192,123,194,123,195,123,196,123,194,87,63,128,151,104,229,93,59,101,159,82,109,96,154,159,155,79,172,142,108,81,171,91,19,95,233,93,94,108,241,98,33,141,113,81,169,148,254,82,159,108,223,130,215,114,162,87,132,103,45,141,31,89,156,143,199,131,149,84,141,123,48,79,189,108,100,91,209,89,19,159,228,83,202,134,168,154,55,140,161,128,69,101,126,152,250,86,199,150,46,82,220,116,80,82,225,91,2,99,2,137,86,78,208,98,42,96,250,104,115,81,152,91,160,81,194,137,161,123,134,153,80,127,239,96,76,112,47,141,73,81,127,94,27,144,112,116,196,137,45,87,69,120,82,95,159,159,250,149,104,143,60,155,225,139,120,118,66,104,220,103,234,141,53,141,61,82,138,143,218,110,205,104,5,149,237,144,253,86,156,103,249,136,199,143,200,84,197,123,200,123,201,123,202,123,203,123,205,123,206,123,207,123,208,123,210,123,212,123,213,123,214,123,215,123,216,123,219,123,220,123,222,123,223,123,224,123,226,123,227,123,228,123,231,123,232,123,233,123,235,123,236,123,237,123,239,123,240,123,242,123,243,123,244,123,245,123,246,123,248,123,249,123,250,123,251,123,253,123,255,123,0,124,1,124,2,124,3,124,4,124,5,124,6,124,8,124,9,124,10,124,13,124,14,124,16,124,17,124,18,124,19,124,20,124,21,124,23,124,24,124,25,124,26,124,27,124,28,124,29,124,30,124,32,124,33,124,34,124,35,124,36,124,37,124,40,124,41,124,43,124,44,124,45,124,46,124,47,124,48,124,49,124,50,124,51,124,52,124,53,124,54,124,55,124,57,124,58,124,59,124,60,124,61,124,62,124,66,124,184,154,105,91,119,109,38,108,165,78,179,91,135,154,99,145,168,97,175,144,233,151,43,84,181,109,210,91,253,81,138,85,85,127,240,127,188,100,77,99,241,101,190,97,141,96,10,113,87,108,73,108,47,89,109,103,42,130,213,88,142,86,106,140,235,107,221,144,125,89,23,128,247,83,105,109,117,84,157,85,119,131,207,131,56,104,190,121,140,84,85,79,8,84,210,118,137,140,2,150,179,108,184,109,107,141,16,137,100,158,58,141,63,86,209,158,213,117,136,95,224,114,104,96,252,84,168,78,42,106,97,136,82,96,112,143,196,84,216,112,121,134,63,158,42,109,143,91,24,95,162,126,137,85,175,79,52,115,60,84,154,83,25,80,14,84,124,84,78,78,253,95,90,116,246,88,107,132,225,128,116,135,208,114,202,124,86,110,67,124,68,124,69,124,70,124,71,124,72,124,73,124,74,124,75,124,76,124,78,124,79,124,80,124,81,124,82,124,83,124,84,124,85,124,86,124,87,124,88,124,89,124,90,124,91,124,92,124,93,124,94,124,95,124,96,124,97,124,98,124,99,124,100,124,101,124,102,124,103,124,104,124,105,124,106,124,107,124,108,124,109,124,110,124,111,124,112,124,113,124,114,124,117,124,118,124,119,124,120,124,121,124,122,124,126,124,127,124,128,124,129,124,130,124,131,124,132,124,133,124,134,124,135,124,136,124,138,124,139,124,140,124,141,124,142,124,143,124,144,124,147,124,148,124,150,124,153,124,154,124,155,124,160,124,161,124,163,124,166,124,167,124,168,124,169,124,171,124,172,124,173,124,175,124,176,124,180,124,181,124,182,124,183,124,184,124,186,124,187,124,39,95,78,134,44,85,164,98,146,78,170,108,55,98,177,130,215,84,78,83,62,115,209,110,59,117,18,82,22,83,221,139,208,105,138,95,0,96,238,109,79,87,34,107,175,115,83,104,216,143,19,127,98,99,163,96,36,85,234,117,98,140,21,113,163,109,166,91,123,94,82,131,76,97,196,158,250,120,87,135,39,124,135,118,240,81,246,96,76,113,67,102,76,94,77,96,14,140,112,112,37,99,137,143,189,95,98,96,212,134,222,86,193,107,148,96,103,97,73,83,224,96,102,102,63,141,253,121,26,79,233,112,71,108,179,139,242,139,216,126,100,131,15,102,90,90,66,155,81,109,247,109,65,140,59,109,25,79,107,112,183,131,22,98,209,96,13,151,39,141,120,121,251,81,62,87,250,87,58,103,120,117,61,122,239,121,149,123,191,124,192,124,194,124,195,124,196,124,198,124,201,124,203,124,206,124,207,124,208,124,209,124,210,124,211,124,212,124,216,124,218,124,219,124,221,124,222,124,225,124,226,124,227,124,228,124,229,124,230,124,231,124,233,124,234,124,235,124,236,124,237,124,238,124,240,124,241,124,242,124,243,124,244,124,245,124,246,124,247,124,249,124,250,124,252,124,253,124,254,124,255,124,0,125,1,125,2,125,3,125,4,125,5,125,6,125,7,125,8,125,9,125,11,125,12,125,13,125,14,125,15,125,16,125,17,125,18,125,19,125,20,125,21,125,22,125,23,125,24,125,25,125,26,125,27,125,28,125,29,125,30,125,31,125,33,125,35,125,36,125,37,125,38,125,40,125,41,125,42,125,44,125,45,125,46,125,48,125,49,125,50,125,51,125,52,125,53,125,54,125,140,128,101,153,249,143,192,111,165,139,33,158,236,89,233,126,9,127,9,84,129,103,216,104,145,143,77,124,198,150,202,83,37,96,190,117,114,108,115,83,201,90,167,126,36,99,224,81,10,129,241,93,223,132,128,98,128,81,99,91,14,79,109,121,66,82,184,96,78,109,196,91,194,91,161,139,176,139,226,101,204,95,69,150,147,89,231,126,170,126,9,86,183,103,57,89,115,79,182,91,160,82,90,131,138,152,62,141,50,117,190,148,71,80,60,122,247,78,182,103,126,154,193,90,124,107,209,118,90,87,22,92,58,123,244,149,78,113,124,81,169,128,112,130,120,89,4,127,39,131,192,104,236,103,177,120,119,120,227,98,97,99,128,123,237,79,106,82,207,81,80,131,219,105,116,146,245,141,49,141,193,137,46,149,173,123,246,78,55,125,56,125,57,125,58,125,59,125,60,125,61,125,62,125,63,125,64,125,65,125,66,125,67,125,68,125,69,125,70,125,71,125,72,125,73,125,74,125,75,125,76,125,77,125,78,125,79,125,80,125,81,125,82,125,83,125,84,125,85,125,86,125,87,125,88,125,89,125,90,125,91,125,92,125,93,125,94,125,95,125,96,125,97,125,98,125,99,125,100,125,101,125,102,125,103,125,104,125,105,125,106,125,107,125,108,125,109,125,111,125,112,125,113,125,114,125,115,125,116,125,117,125,118,125,120,125,121,125,122,125,123,125,124,125,125,125,126,125,127,125,128,125,129,125,130,125,131,125,132,125,133,125,134,125,135,125,136,125,137,125,138,125,139,125,140,125,141,125,142,125,143,125,144,125,145,125,146,125,147,125,148,125,149,125,150,125,151,125,152,125,101,80,48,130,81,82,111,153,16,110,133,110,167,109,250,94,245,80,220,89,6,92,70,109,95,108,134,117,139,132,104,104,86,89,178,139,32,83,113,145,77,150,73,133,18,105,1,121,38,113,246,128,164,78,202,144,71,109,132,154,7,90,188,86,5,100,240,148,235,119,165,79,26,129,225,114,210,137,122,153,52,127,222,126,127,82,89,101,117,145,127,143,131,143,235,83,150,122,237,99,165,99,134,118,248,121,87,136,54,150,42,98,171,82,130,130,84,104,112,103,119,99,107,119,237,122,1,109,211,126,227,137,208,89,18,98,201,133,165,130,76,117,31,80,203,78,165,117,235,139,74,92,254,93,75,123,164,101,209,145,202,78,37,109,95,137,39,125,38,149,197,78,40,140,219,143,115,151,75,102,129,121,209,143,236,112,120,109,153,125,154,125,155,125,156,125,157,125,158,125,159,125,160,125,161,125,162,125,163,125,164,125,165,125,167,125,168,125,169,125,170,125,171,125,172,125,173,125,175,125,176,125,177,125,178,125,179,125,180,125,181,125,182,125,183,125,184,125,185,125,186,125,187,125,188,125,189,125,190,125,191,125,192,125,193,125,194,125,195,125,196,125,197,125,198,125,199,125,200,125,201,125,202,125,203,125,204,125,205,125,206,125,207,125,208,125,209,125,210,125,211,125,212,125,213,125,214,125,215,125,216,125,217,125,218,125,219,125,220,125,221,125,222,125,223,125,224,125,225,125,226,125,227,125,228,125,229,125,230,125,231,125,232,125,233,125,234,125,235,125,236,125,237,125,238,125,239,125,240,125,241,125,242,125,243,125,244,125,245,125,246,125,247,125,248,125,249,125,250,125,61,92,178,82,70,131,98,81,14,131,91,119,118,102,184,156,172,78,202,96,190,124,179,124,207,126,149,78,102,139,111,102,136,152,89,151,131,88,108,101,92,149,132,95,201,117,86,151,223,122,222,122,192,81,175,112,152,122,234,99,118,122,160,126,150,115,237,151,69,78,120,112,93,78,82,145,169,83,81,101,231,101,252,129,5,130,142,84,49,92,154,117,160,151,216,98,217,114,189,117,69,92,121,154,202,131,64,92,128,84,233,119,62,78,174,108,90,128,210,98,110,99,232,93,119,81,221,141,30,142,47,149,241,79,229,83,231,96,172,112,103,82,80,99,67,158,31,90,38,80,55,119,119,83,226,126,133,100,43,101,137,98,152,99,20,80,53,114,201,137,179,81,192,139,221,126,71,87,204,131,167,148,155,81,27,84,251,92,251,125,252,125,253,125,254,125,255,125,0,126,1,126,2,126,3,126,4,126,5,126,6,126,7,126,8,126,9,126,10,126,11,126,12,126,13,126,14,126,15,126,16,126,17,126,18,126,19,126,20,126,21,126,22,126,23,126,24,126,25,126,26,126,27,126,28,126,29,126,30,126,31,126,32,126,33,126,34,126,35,126,36,126,37,126,38,126,39,126,40,126,41,126,42,126,43,126,44,126,45,126,46,126,47,126,48,126,49,126,50,126,51,126,52,126,53,126,54,126,55,126,56,126,57,126,58,126,60,126,61,126,62,126,63,126,64,126,66,126,67,126,68,126,69,126,70,126,72,126,73,126,74,126,75,126,76,126,77,126,78,126,79,126,80,126,81,126,82,126,83,126,84,126,85,126,86,126,87,126,88,126,89,126,90,126,91,126,92,126,93,126,202,79,227,122,90,109,225,144,143,154,128,85,150,84,97,83,175,84,0,95,233,99,119,105,239,81,104,97,10,82,42,88,216,82,78,87,13,120,11,119,183,94,119,97,224,124,91,98,151,98,162,78,149,112,3,128,247,98,228,112,96,151,119,87,219,130,239,103,245,104,213,120,151,152,209,121,243,88,179,84,239,83,52,110,75,81,59,82,162,91,254,139,175,128,67,85,166,87,115,96,81,87,45,84,122,122,80,96,84,91,167,99,160,98,227,83,99,98,199,91,175,103,237,84,159,122,230,130,119,145,147,94,228,136,56,89,174,87,14,99,232,141,239,128,87,87,119,123,169,79,235,95,189,91,62,107,33,83,80,123,194,114,70,104,255,119,54,119,247,101,181,81,143,78,212,118,191,92,165,122,117,132,78,89,65,155,128,80,94,126,95,126,96,126,97,126,98,126,99,126,100,126,101,126,102,126,103,126,104,126,105,126,106,126,107,126,108,126,109,126,110,126,111,126,112,126,113,126,114,126,115,126,116,126,117,126,118,126,119,126,120,126,121,126,122,126,123,126,124,126,125,126,126,126,127,126,128,126,129,126,131,126,132,126,133,126,134,126,135,126,136,126,137,126,138,126,139,126,140,126,141,126,142,126,143,126,144,126,145,126,146,126,147,126,148,126,149,126,150,126,151,126,152,126,153,126,154,126,156,126,157,126,158,126,174,126,180,126,187,126,188,126,214,126,228,126,236,126,249,126,10,127,16,127,30,127,55,127,57,127,59,127,60,127,61,127,62,127,63,127,64,127,65,127,67,127,70,127,71,127,72,127,73,127,74,127,75,127,76,127,77,127,78,127,79,127,82,127,83,127,136,153,39,97,131,110,100,87,6,102,70,99,240,86,236,98,105,98,211,94,20,150,131,87,201,98,135,85,33,135,74,129,163,143,102,85,177,131,101,103,86,141,221,132,106,90,15,104,230,98,238,123,17,150,112,81,156,111,48,140,253,99,200,137,210,97,6,127,194,112,229,110,5,116,148,105,252,114,202,94,206,144,23,103,106,109,94,99,179,82,98,114,1,128,108,79,229,89,106,145,217,112,157,109,210,82,80,78,247,150,109,149,126,133,202,120,47,125,33,81,146,87,194,100,139,128,123,124,234,108,241,104,94,105,183,81,152,83,168,104,129,114,206,158,241,123,248,114,187,121,19,111,6,116,78,103,204,145,164,156,60,121,137,131,84,131,15,84,23,104,61,78,137,83,177,82,62,120,134,83,41,82,136,80,139,79,208,79,86,127,89,127,91,127,92,127,93,127,94,127,96,127,99,127,100,127,101,127,102,127,103,127,107,127,108,127,109,127,111,127,112,127,115,127,117,127,118,127,119,127,120,127,122,127,123,127,124,127,125,127,127,127,128,127,130,127,131,127,132,127,133,127,134,127,135,127,136,127,137,127,139,127,141,127,143,127,144,127,145,127,146,127,147,127,149,127,150,127,151,127,152,127,153,127,155,127,156,127,160,127,162,127,163,127,165,127,166,127,168,127,169,127,170,127,171,127,172,127,173,127,174,127,177,127,179,127,180,127,181,127,182,127,183,127,186,127,187,127,190,127,192,127,194,127,195,127,196,127,198,127,199,127,200,127,201,127,203,127,205,127,207,127,208,127,209,127,210,127,211,127,214,127,215,127,217,127,218,127,219,127,220,127,221,127,222,127,226,127,227,127,226,117,203,122,146,124,165,108,182,150,155,82,131,116,233,84,233,79,84,128,178,131,222,143,112,149,201,94,28,96,159,109,24,94,91,101,56,129,254,148,75,96,188,112,195,126,174,124,201,81,129,104,177,124,111,130,36,78,134,143,207,145,126,102,174,78,5,140,169,100,74,128,218,80,151,117,206,113,229,91,189,143,102,111,134,78,130,100,99,149,214,94,153,101,23,82,194,136,200,112,163,82,14,115,51,116,151,103,247,120,22,151,52,78,187,144,222,156,203,109,219,81,65,141,29,84,206,98,178,115,241,131,246,150,132,159,195,148,54,79,154,127,204,81,117,112,117,150,173,92,134,152,230,83,228,78,156,110,9,116,180,105,107,120,143,153,89,117,24,82,36,118,65,109,243,103,109,81,153,159,75,128,153,84,60,123,191,122,228,127,231,127,232,127,234,127,235,127,236,127,237,127,239,127,242,127,244,127,245,127,246,127,247,127,248,127,249,127,250,127,253,127,254,127,255,127,2,128,7,128,8,128,9,128,10,128,14,128,15,128,17,128,19,128,26,128,27,128,29,128,30,128,31,128,33,128,35,128,36,128,43,128,44,128,45,128,46,128,47,128,48,128,50,128,52,128,57,128,58,128,60,128,62,128,64,128,65,128,68,128,69,128,71,128,72,128,73,128,78,128,79,128,80,128,81,128,83,128,85,128,86,128,87,128,89,128,91,128,92,128,93,128,94,128,95,128,96,128,97,128,98,128,99,128,100,128,101,128,102,128,103,128,104,128,107,128,108,128,109,128,110,128,111,128,112,128,114,128,115,128,116,128,117,128,118,128,119,128,120,128,121,128,122,128,123,128,124,128,125,128,134,150,132,87,226,98,71,150,124,105,4,90,2,100,211,123,15,111,75,150,166,130,98,83,133,152,144,94,137,112,179,99,100,83,79,134,129,156,147,158,140,120,50,151,239,141,66,141,127,158,94,111,132,121,85,95,70,150,46,98,116,154,21,84,221,148,163,79,197,101,101,92,97,92,21,127,81,134,47,108,139,95,135,115,228,110,255,126,230,92,27,99,106,91,230,110,117,83,113,78,160,99,101,117,161,98,110,143,38,79,209,78,166,108,182,126,186,139,29,132,186,135,87,127,59,144,35,149,169,123,161,154,248,136,61,132,27,109,134,154,220,126,136,89,187,158,155,115,1,120,130,134,108,154,130,154,27,86,23,84,203,87,112,78,166,158,86,83,200,143,9,129,146,119,146,153,238,134,225,110,19,133,252,102,98,97,43,111,126,128,129,128,130,128,133,128,136,128,138,128,141,128,142,128,143,128,144,128,145,128,146,128,148,128,149,128,151,128,153,128,158,128,163,128,166,128,167,128,168,128,172,128,176,128,179,128,181,128,182,128,184,128,185,128,187,128,197,128,199,128,200,128,201,128,202,128,203,128,207,128,208,128,209,128,210,128,211,128,212,128,213,128,216,128,223,128,224,128,226,128,227,128,230,128,238,128,245,128,247,128,249,128,251,128,254,128,255,128,0,129,1,129,3,129,4,129,5,129,7,129,8,129,11,129,12,129,21,129,23,129,25,129,27,129,28,129,29,129,31,129,32,129,33,129,34,129,35,129,36,129,37,129,38,129,39,129,40,129,41,129,42,129,43,129,45,129,46,129,48,129,51,129,52,129,53,129,55,129,57,129,58,129,59,129,60,129,61,129,63,129,41,140,146,130,43,131,242,118,19,108,217,95,189,131,43,115,5,131,26,149,219,107,219,119,198,148,111,83,2,131,146,81,61,94,140,140,56,141,72,78,171,115,154,103,133,104,118,145,9,151,100,113,161,108,9,119,146,90,65,149,207,107,142,127,39,102,208,91,185,89,154,90,232,149,247,149,236,78,12,132,153,132,172,106,223,118,48,149,27,115,166,104,95,91,47,119,154,145,97,151,220,124,247,143,28,140,37,95,115,124,216,121,197,137,204,108,28,135,198,91,66,94,201,104,32,119,245,126,149,81,77,81,201,82,41,90,5,127,98,151,215,130,207,99,132,119,208,133,210,121,58,110,153,94,153,89,17,133,109,112,17,108,191,98,191,118,79,101,175,96,253,149,14,102,159,135,35,158,237,148,13,84,125,84,44,140,120,100,64,129,65,129,66,129,67,129,68,129,69,129,71,129,73,129,77,129,78,129,79,129,82,129,86,129,87,129,88,129,91,129,92,129,93,129,94,129,95,129,97,129,98,129,99,129,100,129,102,129,104,129,106,129,107,129,108,129,111,129,114,129,115,129,117,129,118,129,119,129,120,129,129,129,131,129,132,129,133,129,134,129,135,129,137,129,139,129,140,129,141,129,142,129,144,129,146,129,147,129,148,129,149,129,150,129,151,129,153,129,154,129,158,129,159,129,160,129,161,129,162,129,164,129,165,129,167,129,169,129,171,129,172,129,173,129,174,129,175,129,176,129,177,129,178,129,180,129,181,129,182,129,183,129,184,129,185,129,188,129,189,129,190,129,191,129,196,129,197,129,199,129,200,129,201,129,203,129,205,129,206,129,207,129,208,129,209,129,210,129,211,129,121,100,17,134,33,106,156,129,232,120,105,100,84,155,185,98,43,103,171,131,168,88,216,158,171,108,32,111,222,91,76,150,11,140,95,114,208,103,199,98,97,114,169,78,198,89,205,107,147,88,174,102,85,94,223,82,85,97,40,103,238,118,102,119,103,114,70,122,255,98,234,84,80,84,160,148,163,144,28,90,179,126,22,108,67,78,118,89,16,128,72,89,87,83,55,117,190,150,202,86,32,99,17,129,124,96,249,149,214,109,98,84,129,153,133,81,233,90,253,128,174,89,19,151,42,80,229,108,60,92,223,98,96,79,63,83,123,129,6,144,186,110,43,133,200,98,116,94,190,120,181,100,123,99,245,95,24,90,127,145,31,158,63,92,79,99,66,128,125,91,110,85,74,149,77,149,133,109,168,96,224,103,222,114,221,81,129,91,212,129,213,129,214,129,215,129,216,129,217,129,218,129,219,129,220,129,221,129,222,129,223,129,224,129,225,129,226,129,228,129,229,129,230,129,232,129,233,129,235,129,238,129,239,129,240,129,241,129,242,129,245,129,246,129,247,129,248,129,249,129,250,129,253,129,255,129,3,130,7,130,8,130,9,130,10,130,11,130,14,130,15,130,17,130,19,130,21,130,22,130,23,130,24,130,25,130,26,130,29,130,32,130,36,130,37,130,38,130,39,130,41,130,46,130,50,130,58,130,60,130,61,130,63,130,64,130,65,130,66,130,67,130,69,130,70,130,72,130,74,130,76,130,77,130,78,130,80,130,81,130,82,130,83,130,84,130,85,130,86,130,87,130,89,130,91,130,92,130,93,130,94,130,96,130,97,130,98,130,99,130,100,130,101,130,102,130,103,130,105,130,231,98,222,108,91,114,109,98,174,148,189,126,19,129,83,109,156,81,4,95,116,89,170,82,18,96,115,89,150,102,80,134,159,117,42,99,230,97,239,124,250,139,230,84,39,107,37,158,180,107,213,133,85,84,118,80,164,108,106,85,180,141,44,114,21,94,21,96,54,116,205,98,146,99,76,114,152,95,67,110,62,109,0,101,88,111,216,118,208,120,252,118,84,117,36,82,219,83,83,78,158,94,193,101,42,128,214,128,155,98,134,84,40,82,174,112,141,136,209,141,225,108,120,84,218,128,249,87,244,136,84,141,106,150,77,145,105,79,155,108,183,85,198,118,48,120,168,98,249,112,142,111,109,95,236,132,218,104,124,120,247,123,168,129,11,103,79,158,103,99,176,120,111,87,18,120,57,151,121,98,171,98,136,82,53,116,215,107,106,130,107,130,108,130,109,130,113,130,117,130,118,130,119,130,120,130,123,130,124,130,128,130,129,130,131,130,133,130,134,130,135,130,137,130,140,130,144,130,147,130,148,130,149,130,150,130,154,130,155,130,158,130,160,130,162,130,163,130,167,130,178,130,181,130,182,130,186,130,187,130,188,130,191,130,192,130,194,130,195,130,197,130,198,130,201,130,208,130,214,130,217,130,218,130,221,130,226,130,231,130,232,130,233,130,234,130,236,130,237,130,238,130,240,130,242,130,243,130,245,130,246,130,248,130,250,130,252,130,253,130,254,130,255,130,0,131,10,131,11,131,13,131,16,131,18,131,19,131,22,131,24,131,25,131,29,131,30,131,31,131,32,131,33,131,34,131,35,131,36,131,37,131,38,131,41,131,42,131,46,131,48,131,50,131,55,131,59,131,61,131,100,85,62,129,178,117,174,118,57,83,222,117,251,80,65,92,108,139,199,123,79,80,71,114,151,154,216,152,2,111,226,116,104,121,135,100,165,119,252,98,145,152,43,141,193,84,88,128,82,78,106,87,249,130,13,132,115,94,237,81,246,116,196,139,79,92,97,87,252,108,135,152,70,90,52,120,68,155,235,143,149,124,86,82,81,98,250,148,198,78,134,131,97,132,233,131,178,132,212,87,52,103,3,87,110,102,102,109,49,140,221,102,17,112,31,103,58,107,22,104,26,98,187,89,3,78,196,81,6,111,210,103,143,108,118,81,203,104,71,89,103,107,102,117,14,93,16,129,80,159,215,101,72,121,65,121,145,154,119,141,130,92,94,78,1,79,47,84,81,89,12,120,104,86,20,108,196,143,3,95,125,108,227,108,171,139,144,99,62,131,63,131,65,131,66,131,68,131,69,131,72,131,74,131,75,131,76,131,77,131,78,131,83,131,85,131,86,131,87,131,88,131,89,131,93,131,98,131,112,131,113,131,114,131,115,131,116,131,117,131,118,131,121,131,122,131,126,131,127,131,128,131,129,131,130,131,131,131,132,131,135,131,136,131,138,131,139,131,140,131,141,131,143,131,144,131,145,131,148,131,149,131,150,131,151,131,153,131,154,131,157,131,159,131,161,131,162,131,163,131,164,131,165,131,166,131,167,131,172,131,173,131,174,131,175,131,181,131,187,131,190,131,191,131,194,131,195,131,196,131,198,131,200,131,201,131,203,131,205,131,206,131,208,131,209,131,210,131,211,131,213,131,215,131,217,131,218,131,219,131,222,131,226,131,227,131,228,131,230,131,231,131,232,131,235,131,236,131,237,131,112,96,61,109,117,114,102,98,142,148,197,148,67,83,193,143,126,123,223,78,38,140,126,78,212,158,177,148,179,148,77,82,92,111,99,144,69,109,52,140,17,88,76,93,32,107,73,107,170,103,91,84,84,129,140,127,153,88,55,133,58,95,162,98,71,106,57,149,114,101,132,96,101,104,167,119,84,78,168,79,231,93,152,151,172,100,216,127,237,92,207,79,141,122,7,82,4,131,20,78,47,96,131,122,166,148,181,79,178,78,230,121,52,116,228,82,185,130,210,100,189,121,221,91,129,108,82,151,123,143,34,108,62,80,127,83,5,110,206,100,116,102,48,108,197,96,119,152,247,139,134,94,60,116,119,122,203,121,24,78,177,144,3,116,66,108,218,86,75,145,197,108,139,141,58,83,198,134,242,102,175,142,72,92,113,154,32,110,238,131,239,131,243,131,244,131,245,131,246,131,247,131,250,131,251,131,252,131,254,131,255,131,0,132,2,132,5,132,7,132,8,132,9,132,10,132,16,132,18,132,19,132,20,132,21,132,22,132,23,132,25,132,26,132,27,132,30,132,31,132,32,132,33,132,34,132,35,132,41,132,42,132,43,132,44,132,45,132,46,132,47,132,48,132,50,132,51,132,52,132,53,132,54,132,55,132,57,132,58,132,59,132,62,132,63,132,64,132,65,132,66,132,67,132,68,132,69,132,71,132,72,132,73,132,74,132,75,132,76,132,77,132,78,132,79,132,80,132,82,132,83,132,84,132,85,132,86,132,88,132,93,132,94,132,95,132,96,132,98,132,100,132,101,132,102,132,103,132,104,132,106,132,110,132,111,132,112,132,114,132,116,132,119,132,121,132,123,132,124,132,214,83,54,90,139,159,163,141,187,83,8,87,167,152,67,103,155,145,201,108,104,81,202,117,243,98,172,114,56,82,157,82,58,127,148,112,56,118,116,83,74,158,183,105,110,120,192,150,217,136,164,127,54,113,195,113,137,81,211,103,228,116,228,88,24,101,183,86,169,139,118,153,112,98,213,126,249,96,237,112,236,88,193,78,186,78,205,95,231,151,251,78,164,139,3,82,138,89,171,126,84,98,205,78,229,101,14,98,56,131,201,132,99,131,141,135,148,113,182,110,185,91,210,126,151,81,201,99,212,103,137,128,57,131,21,136,18,81,122,91,130,89,177,143,115,78,93,108,101,81,37,137,111,143,46,150,74,133,94,116,16,149,240,149,166,109,229,130,49,95,146,100,18,109,40,132,110,129,195,156,94,88,91,141,9,78,193,83,125,132,126,132,127,132,128,132,129,132,131,132,132,132,133,132,134,132,138,132,141,132,143,132,144,132,145,132,146,132,147,132,148,132,149,132,150,132,152,132,154,132,155,132,157,132,158,132,159,132,160,132,162,132,163,132,164,132,165,132,166,132,167,132,168,132,169,132,170,132,171,132,172,132,173,132,174,132,176,132,177,132,179,132,181,132,182,132,183,132,187,132,188,132,190,132,192,132,194,132,195,132,197,132,198,132,199,132,200,132,203,132,204,132,206,132,207,132,210,132,212,132,213,132,215,132,216,132,217,132,218,132,219,132,220,132,222,132,225,132,226,132,228,132,231,132,232,132,233,132,234,132,235,132,237,132,238,132,239,132,241,132,242,132,243,132,244,132,245,132,246,132,247,132,248,132,249,132,250,132,251,132,253,132,254,132,0,133,1,133,2,133,30,79,99,101,81,104,211,85,39,78,20,100,154,154,107,98,194,90,95,116,114,130,169,109,238,104,231,80,142,131,2,120,64,103,57,82,153,108,177,126,187,80,101,85,94,113,91,123,82,102,202,115,235,130,73,103,113,92,32,82,125,113,107,136,234,149,85,150,197,100,97,141,179,129,132,85,85,108,71,98,46,127,146,88,36,79,70,85,79,141,76,102,10,78,26,92,243,136,162,104,78,99,13,122,231,112,141,130,250,82,246,151,17,92,232,84,181,144,205,126,98,89,74,141,199,134,12,130,13,130,102,141,68,100,4,92,81,97,137,109,62,121,190,139,55,120,51,117,123,84,56,79,171,142,241,109,32,90,197,126,94,121,136,108,161,91,118,90,26,117,190,128,78,97,23,110,240,88,31,117,37,117,114,114,71,83,243,126,3,133,4,133,5,133,6,133,7,133,8,133,9,133,10,133,11,133,13,133,14,133,15,133,16,133,18,133,20,133,21,133,22,133,24,133,25,133,27,133,28,133,29,133,30,133,32,133,34,133,35,133,36,133,37,133,38,133,39,133,40,133,41,133,42,133,45,133,46,133,47,133,48,133,49,133,50,133,51,133,52,133,53,133,54,133,62,133,63,133,64,133,65,133,66,133,68,133,69,133,70,133,71,133,75,133,76,133,77,133,78,133,79,133,80,133,81,133,82,133,83,133,84,133,85,133,87,133,88,133,90,133,91,133,92,133,93,133,95,133,96,133,97,133,98,133,99,133,101,133,102,133,103,133,105,133,106,133,107,133,108,133,109,133,110,133,111,133,112,133,113,133,115,133,117,133,118,133,119,133,120,133,124,133,125,133,127,133,128,133,129,133,1,119,219,118,105,82,220,128,35,87,8,94,49,89,238,114,189,101,127,110,215,139,56,92,113,134,65,83,243,119,254,98,246,101,192,78,223,152,128,134,158,91,198,139,242,83,226,119,127,79,78,92,118,154,203,89], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+37572);
/* memory initializer */ allocate([15,95,58,121,235,88,22,78,255,103,139,78,237,98,147,138,29,144,191,82,47,102,220,85,108,86,2,144,213,78,141,79,202,145,112,153,15,108,2,94,67,96,164,91,198,137,213,139,54,101,75,98,150,153,136,91,255,91,136,99,46,85,215,83,38,118,125,81,44,133,162,103,179,104,138,107,146,98,147,143,212,83,18,130,209,109,143,117,102,78,78,141,112,91,159,113,175,133,145,102,217,102,114,127,0,135,205,158,32,159,94,92,47,103,240,143,17,104,95,103,13,98,214,122,133,88,182,94,112,101,49,111,130,133,131,133,134,133,136,133,137,133,138,133,139,133,140,133,141,133,142,133,144,133,145,133,146,133,147,133,148,133,149,133,150,133,151,133,152,133,153,133,154,133,157,133,158,133,159,133,160,133,161,133,162,133,163,133,165,133,166,133,167,133,169,133,171,133,172,133,173,133,177,133,178,133,179,133,180,133,181,133,182,133,184,133,186,133,187,133,188,133,189,133,190,133,191,133,192,133,194,133,195,133,196,133,197,133,198,133,199,133,200,133,202,133,203,133,204,133,205,133,206,133,209,133,210,133,212,133,214,133,215,133,216,133,217,133,218,133,219,133,221,133,222,133,223,133,224,133,225,133,226,133,227,133,229,133,230,133,231,133,232,133,234,133,235,133,236,133,237,133,238,133,239,133,240,133,241,133,242,133,243,133,244,133,245,133,246,133,247,133,248,133,85,96,55,82,13,128,84,100,112,136,41,117,5,94,19,104,244,98,28,151,204,83,61,114,1,140,52,108,97,119,14,122,46,84,172,119,122,152,28,130,244,139,85,120,20,103,193,112,175,101,149,100,54,86,29,96,193,121,248,83,29,78,123,107,134,128,250,91,227,85,219,86,58,79,60,79,114,153,243,93,126,103,56,128,2,96,130,152,1,144,139,91,188,139,245,139,28,100,88,130,222,100,253,85,207,130,101,145,215,79,32,125,31,144,159,124,243,80,81,88,175,110,191,91,201,139,131,128,120,145,156,132,151,123,125,134,139,150,143,150,229,126,211,154,142,120,129,92,87,122,66,144,167,150,95,121,89,91,95,99,11,123,209,132,173,104,6,85,41,127,16,116,34,125,1,149,64,98,76,88,214,78,131,91,121,89,84,88,249,133,250,133,252,133,253,133,254,133,0,134,1,134,2,134,3,134,4,134,6,134,7,134,8,134,9,134,10,134,11,134,12,134,13,134,14,134,15,134,16,134,18,134,19,134,20,134,21,134,23,134,24,134,25,134,26,134,27,134,28,134,29,134,30,134,31,134,32,134,33,134,34,134,35,134,36,134,37,134,38,134,40,134,42,134,43,134,44,134,45,134,46,134,47,134,48,134,49,134,50,134,51,134,52,134,53,134,54,134,55,134,57,134,58,134,59,134,61,134,62,134,63,134,64,134,65,134,66,134,67,134,68,134,69,134,70,134,71,134,72,134,73,134,74,134,75,134,76,134,82,134,83,134,85,134,86,134,87,134,88,134,89,134,91,134,92,134,93,134,95,134,96,134,97,134,99,134,100,134,101,134,102,134,103,134,104,134,105,134,106,134,109,115,30,99,75,142,15,142,206,128,212,130,172,98,240,83,240,108,94,145,42,89,1,96,112,108,77,87,74,100,42,141,43,118,233,110,91,87,128,106,240,117,109,111,45,140,8,140,102,87,239,107,146,136,179,120,162,99,249,83,173,112,100,108,88,88,42,100,2,88,224,104,155,129,16,85,214,124,24,80,186,142,204,109,159,141,235,112,143,99,155,109,212,110,230,126,4,132,67,104,3,144,216,109,118,150,168,139,87,89,121,114,228,133,126,129,188,117,138,138,175,104,84,82,34,142,17,149,208,99,152,152,68,142,124,85,83,79,255,102,143,86,213,96,149,109,67,82,73,92,41,89,251,109,107,88,48,117,28,117,108,96,20,130,70,129,17,99,97,103,226,143,58,119,243,141,52,141,193,148,22,94,133,83,44,84,195,112,109,134,111,134,112,134,114,134,115,134,116,134,117,134,118,134,119,134,120,134,131,134,132,134,133,134,134,134,135,134,136,134,137,134,142,134,143,134,144,134,145,134,146,134,148,134,150,134,151,134,152,134,153,134,154,134,155,134,158,134,159,134,160,134,161,134,162,134,165,134,166,134,171,134,173,134,174,134,178,134,179,134,183,134,184,134,185,134,187,134,188,134,189,134,190,134,191,134,193,134,194,134,195,134,197,134,200,134,204,134,205,134,210,134,211,134,213,134,214,134,215,134,218,134,220,134,221,134,224,134,225,134,226,134,227,134,229,134,230,134,231,134,232,134,234,134,235,134,236,134,239,134,245,134,246,134,247,134,250,134,251,134,252,134,253,134,255,134,1,135,4,135,5,135,6,135,11,135,12,135,14,135,15,135,16,135,17,135,20,135,22,135,64,108,247,94,92,80,173,78,173,94,58,99,71,130,26,144,80,104,110,145,179,119,12,84,220,148,100,95,229,122,118,104,69,99,82,123,223,126,219,117,119,80,149,98,52,89,15,144,248,81,195,121,129,122,254,86,146,95,20,144,130,109,96,92,31,87,16,84,84,81,77,110,226,86,168,99,147,152,127,129,21,135,42,137,0,144,30,84,111,92,192,129,214,98,88,98,49,129,53,158,64,150,110,154,124,154,45,105,165,89,211,98,62,85,22,99,199,84,217,134,60,109,3,90,230,116,156,136,106,107,22,89,76,140,47,95,126,110,169,115,125,152,56,78,247,112,140,91,151,120,61,99,90,102,150,118,203,96,155,91,73,90,7,78,85,129,106,108,139,115,161,78,137,103,81,127,128,95,250,101,27,103,216,95,132,89,1,90,25,135,27,135,29,135,31,135,32,135,36,135,38,135,39,135,40,135,42,135,43,135,44,135,45,135,47,135,48,135,50,135,51,135,53,135,54,135,56,135,57,135,58,135,60,135,61,135,64,135,65,135,66,135,67,135,68,135,69,135,70,135,74,135,75,135,77,135,79,135,80,135,81,135,82,135,84,135,85,135,86,135,88,135,90,135,91,135,92,135,93,135,94,135,95,135,97,135,98,135,102,135,103,135,104,135,105,135,106,135,107,135,108,135,109,135,111,135,113,135,114,135,115,135,117,135,119,135,120,135,121,135,122,135,127,135,128,135,129,135,132,135,134,135,135,135,137,135,138,135,140,135,142,135,143,135,144,135,145,135,146,135,148,135,149,135,150,135,152,135,153,135,154,135,155,135,156,135,157,135,158,135,160,135,161,135,162,135,163,135,164,135,205,93,174,95,113,83,230,151,221,143,69,104,244,86,47,85,223,96,58,78,77,111,244,126,199,130,14,132,212,89,31,79,42,79,62,92,172,126,42,103,26,133,115,84,79,117,195,128,130,85,79,155,77,79,45,110,19,140,9,92,112,97,107,83,31,118,41,110,138,134,135,101,251,149,185,126,59,84,51,122,10,125,238,149,225,85,193,127,238,116,29,99,23,135,161,109,157,122,17,98,161,101,103,83,225,99,131,108,235,93,92,84,168,148,76,78,97,108,236,139,75,92,224,101,156,130,167,104,62,84,52,84,203,107,102,107,148,78,66,99,72,83,30,130,13,79,174,79,94,87,10,98,254,150,100,102,105,114,255,82,161,82,159,96,239,139,20,102,153,113,144,103,127,137,82,120,253,119,112,102,59,86,56,84,33,149,122,114,165,135,166,135,167,135,169,135,170,135,174,135,176,135,177,135,178,135,180,135,182,135,183,135,184,135,185,135,187,135,188,135,190,135,191,135,193,135,194,135,195,135,196,135,197,135,199,135,200,135,201,135,204,135,205,135,206,135,207,135,208,135,212,135,213,135,214,135,215,135,216,135,217,135,218,135,220,135,221,135,222,135,223,135,225,135,226,135,227,135,228,135,230,135,231,135,232,135,233,135,235,135,236,135,237,135,239,135,240,135,241,135,242,135,243,135,244,135,245,135,246,135,247,135,248,135,250,135,251,135,252,135,253,135,255,135,0,136,1,136,2,136,4,136,5,136,6,136,7,136,8,136,9,136,11,136,12,136,13,136,14,136,15,136,16,136,17,136,18,136,20,136,23,136,24,136,25,136,26,136,28,136,29,136,30,136,31,136,32,136,35,136,0,122,111,96,12,94,137,96,157,129,21,89,220,96,132,113,239,112,170,110,80,108,128,114,132,106,173,136,45,94,96,78,179,90,156,85,227,148,23,109,251,124,153,150,15,98,198,126,142,119,126,134,35,83,30,151,150,143,135,102,225,92,160,79,237,114,11,78,166,83,15,89,19,84,128,99,40,149,72,81,217,78,156,156,164,126,184,84,36,141,84,136,55,130,242,149,142,109,38,95,204,90,62,102,105,150,176,115,46,115,191,83,122,129,133,153,161,127,170,91,119,150,80,150,191,126,248,118,162,83,118,149,153,153,177,123,68,137,88,110,97,78,212,127,101,121,230,139,243,96,205,84,171,78,121,152,247,93,97,106,207,80,17,84,97,140,39,132,93,120,4,151,74,82,238,84,163,86,0,149,136,109,181,91,198,109,83,102,36,136,37,136,38,136,39,136,40,136,41,136,42,136,43,136,44,136,45,136,46,136,47,136,48,136,49,136,51,136,52,136,53,136,54,136,55,136,56,136,58,136,59,136,61,136,62,136,63,136,65,136,66,136,67,136,70,136,71,136,72,136,73,136,74,136,75,136,78,136,79,136,80,136,81,136,82,136,83,136,85,136,86,136,88,136,90,136,91,136,92,136,93,136,94,136,95,136,96,136,102,136,103,136,106,136,109,136,111,136,113,136,115,136,116,136,117,136,118,136,120,136,121,136,122,136,123,136,124,136,128,136,131,136,134,136,135,136,137,136,138,136,140,136,142,136,143,136,144,136,145,136,147,136,148,136,149,136,151,136,152,136,153,136,154,136,155,136,157,136,158,136,159,136,160,136,161,136,163,136,165,136,166,136,167,136,168,136,169,136,170,136,15,92,93,91,33,104,150,128,120,85,17,123,72,101,84,105,155,78,71,107,78,135,139,151,79,83,31,99,58,100,170,144,156,101,193,128,16,140,153,81,176,104,120,83,249,135,200,97,196,108,251,108,34,140,81,92,170,133,175,130,12,149,35,107,155,143,176,101,251,95,195,95,225,79,69,136,31,102,101,129,41,115,250,96,116,81,17,82,139,87,98,95,162,144,76,136,146,145,120,94,79,103,39,96,211,89,68,81,246,81,248,128,8,83,121,108,196,150,138,113,17,79,238,79,158,127,61,103,197,85,8,149,192,121,150,136,227,126,159,88,12,98,0,151,90,134,24,86,123,152,144,95,184,139,196,132,87,145,217,83,237,101,143,94,92,117,100,96,110,125,127,90,234,126,237,126,105,143,167,85,163,91,172,96,203,101,132,115,172,136,174,136,175,136,176,136,178,136,179,136,180,136,181,136,182,136,184,136,185,136,186,136,187,136,189,136,190,136,191,136,192,136,195,136,196,136,199,136,200,136,202,136,203,136,204,136,205,136,207,136,208,136,209,136,211,136,214,136,215,136,218,136,219,136,220,136,221,136,222,136,224,136,225,136,230,136,231,136,233,136,234,136,235,136,236,136,237,136,238,136,239,136,242,136,245,136,246,136,247,136,250,136,251,136,253,136,255,136,0,137,1,137,3,137,4,137,5,137,6,137,7,137,8,137,9,137,11,137,12,137,13,137,14,137,15,137,17,137,20,137,21,137,22,137,23,137,24,137,28,137,29,137,30,137,31,137,32,137,34,137,35,137,36,137,38,137,39,137,40,137,41,137,44,137,45,137,46,137,47,137,49,137,50,137,51,137,53,137,55,137,9,144,99,118,41,119,218,126,116,151,155,133,102,91,116,122,234,150,64,136,203,82,143,113,170,95,236,101,226,139,251,91,111,154,225,93,137,107,91,108,173,139,175,139,10,144,197,143,139,83,188,98,38,158,45,158,64,84,43,78,189,130,89,114,156,134,22,93,89,136,175,109,197,150,209,84,154,78,182,139,9,113,189,84,9,150,223,112,249,109,208,118,37,78,20,120,18,135,169,92,246,94,0,138,156,152,14,150,142,112,191,108,68,89,169,99,60,119,77,136,20,111,115,130,48,88,213,113,140,83,26,120,193,150,1,85,102,95,48,113,180,91,26,140,140,154,131,107,46,89,47,158,231,121,104,103,108,98,111,79,161,117,138,127,11,109,51,150,39,108,240,78,210,117,123,81,55,104,62,111,128,144,112,129,150,89,118,116,56,137,57,137,58,137,59,137,60,137,61,137,62,137,63,137,64,137,66,137,67,137,69,137,70,137,71,137,72,137,73,137,74,137,75,137,76,137,77,137,78,137,79,137,80,137,81,137,82,137,83,137,84,137,85,137,86,137,87,137,88,137,89,137,90,137,91,137,92,137,93,137,96,137,97,137,98,137,99,137,100,137,101,137,103,137,104,137,105,137,106,137,107,137,108,137,109,137,110,137,111,137,112,137,113,137,114,137,115,137,116,137,117,137,118,137,119,137,120,137,121,137,122,137,124,137,125,137,126,137,128,137,130,137,132,137,133,137,135,137,136,137,137,137,138,137,139,137,140,137,141,137,142,137,143,137,144,137,145,137,146,137,147,137,148,137,149,137,150,137,151,137,152,137,153,137,154,137,155,137,156,137,157,137,158,137,159,137,160,137,161,137,71,100,39,92,101,144,145,122,35,140,218,89,172,84,0,130,111,131,129,137,0,128,48,105,78,86,54,128,55,114,206,145,182,81,95,78,117,152,150,99,26,78,246,83,243,102,75,129,28,89,178,109,0,78,249,88,59,83,214,99,241,148,157,79,10,79,99,136,144,152,55,89,87,144,251,121,234,78,240,128,145,117,130,108,156,91,232,89,93,95,5,105,129,134,26,80,242,93,89,78,227,119,229,78,122,130,145,98,19,102,145,144,121,92,191,78,121,95,198,129,56,144,132,128,171,117,166,78,212,136,15,97,197,107,198,95,73,78,202,118,162,110,227,139,174,139,10,140,209,139,2,95,252,127,204,127,206,126,53,131,107,131,224,86,183,107,243,151,52,150,251,89,31,84,246,148,235,109,197,91,110,153,57,92,21,95,144,150,162,137,163,137,164,137,165,137,166,137,167,137,168,137,169,137,170,137,171,137,172,137,173,137,174,137,175,137,176,137,177,137,178,137,179,137,180,137,181,137,182,137,183,137,184,137,185,137,186,137,187,137,188,137,189,137,190,137,191,137,192,137,195,137,205,137,211,137,212,137,213,137,215,137,216,137,217,137,219,137,221,137,223,137,224,137,225,137,226,137,228,137,231,137,232,137,233,137,234,137,236,137,237,137,238,137,240,137,241,137,242,137,244,137,245,137,246,137,247,137,248,137,249,137,250,137,251,137,252,137,253,137,254,137,255,137,1,138,2,138,3,138,4,138,5,138,6,138,8,138,9,138,10,138,11,138,12,138,13,138,14,138,15,138,16,138,17,138,18,138,19,138,20,138,21,138,22,138,23,138,24,138,25,138,26,138,27,138,28,138,29,138,112,83,241,130,49,106,116,90,112,158,148,94,40,127,185,131,36,132,37,132,103,131,71,135,206,143,98,141,200,118,113,95,150,152,108,120,32,102,223,84,229,98,99,79,195,129,200,117,184,94,205,150,10,142,249,134,143,84,243,108,140,109,56,108,127,96,199,82,40,117,125,94,24,79,160,96,231,95,36,92,49,117,174,144,192,148,185,114,185,108,56,110,73,145,9,103,203,83,243,83,81,79,201,145,241,139,200,83,124,94,194,143,228,109,142,78,194,118,134,105,94,134,26,97,6,130,89,79,222,79,62,144,124,156,9,97,29,110,20,110,133,150,136,78,49,90,232,150,14,78,127,92,185,121,135,91,237,139,189,127,137,115,223,87,139,130,193,144,1,84,71,144,187,85,234,92,161,95,8,97,50,107,241,114,178,128,137,138,30,138,31,138,32,138,33,138,34,138,35,138,36,138,37,138,38,138,39,138,40,138,41,138,42,138,43,138,44,138,45,138,46,138,47,138,48,138,49,138,50,138,51,138,52,138,53,138,54,138,55,138,56,138,57,138,58,138,59,138,60,138,61,138,63,138,64,138,65,138,66,138,67,138,68,138,69,138,70,138,71,138,73,138,74,138,75,138,76,138,77,138,78,138,79,138,80,138,81,138,82,138,83,138,84,138,85,138,86,138,87,138,88,138,89,138,90,138,91,138,92,138,93,138,94,138,95,138,96,138,97,138,98,138,99,138,100,138,101,138,102,138,103,138,104,138,105,138,106,138,107,138,108,138,109,138,110,138,111,138,112,138,113,138,114,138,115,138,116,138,117,138,118,138,119,138,120,138,122,138,123,138,124,138,125,138,126,138,127,138,128,138,116,109,211,91,213,136,132,152,107,140,109,154,51,158,10,110,164,81,67,81,163,87,129,136,159,83,244,99,149,143,237,86,88,84,6,87,63,115,144,110,24,127,220,143,209,130,63,97,40,96,98,150,240,102,166,126,138,141,195,141,165,148,179,92,164,124,8,103,166,96,5,150,24,128,145,78,231,144,0,83,104,150,65,81,208,143,116,133,93,145,85,102,245,151,85,91,29,83,56,120,66,103,61,104,201,84,126,112,176,91,125,143,141,81,40,87,177,84,18,101,130,102,94,141,67,141,15,129,108,132,109,144,223,124,255,81,251,133,163,103,233,101,161,111,164,134,129,142,106,86,32,144,130,118,118,112,229,113,35,141,233,98,25,82,253,108,60,141,14,96,158,88,142,97,254,102,96,141,78,98,179,85,35,110,45,103,103,143,129,138,130,138,131,138,132,138,133,138,134,138,135,138,136,138,139,138,140,138,141,138,142,138,143,138,144,138,145,138,146,138,148,138,149,138,150,138,151,138,152,138,153,138,154,138,155,138,156,138,157,138,158,138,159,138,160,138,161,138,162,138,163,138,164,138,165,138,166,138,167,138,168,138,169,138,170,138,171,138,172,138,173,138,174,138,175,138,176,138,177,138,178,138,179,138,180,138,181,138,182,138,183,138,184,138,185,138,186,138,187,138,188,138,189,138,190,138,191,138,192,138,193,138,194,138,195,138,196,138,197,138,198,138,199,138,200,138,201,138,202,138,203,138,204,138,205,138,206,138,207,138,208,138,209,138,210,138,211,138,212,138,213,138,214,138,215,138,216,138,217,138,218,138,219,138,220,138,221,138,222,138,223,138,224,138,225,138,226,138,227,138,225,148,248,149,40,119,5,104,168,105,139,84,77,78,184,112,200,139,88,100,139,101,133,91,132,122,58,80,232,91,187,119,225,107,121,138,152,124,190,108,207,118,169,101,151,143,45,93,85,92,56,134,8,104,96,83,24,98,217,122,91,110,253,126,31,106,224,122,112,95,51,111,32,95,140,99,168,109,86,103,8,78,16,94,38,141,215,78,192,128,52,118,156,150,219,98,45,102,126,98,188,108,117,141,103,113,105,127,70,81,135,128,236,83,110,144,152,98,242,84,240,134,153,143,5,128,23,149,23,133,217,143,89,109,205,115,159,101,31,119,4,117,39,120,251,129,30,141,136,148,166,79,149,103,185,117,202,139,7,151,47,99,71,149,53,150,184,132,35,99,65,119,129,95,240,114,137,78,20,96,116,101,239,98,99,107,63,101,228,138,229,138,230,138,231,138,232,138,233,138,234,138,235,138,236,138,237,138,238,138,239,138,240,138,241,138,242,138,243,138,244,138,245,138,246,138,247,138,248,138,249,138,250,138,251,138,252,138,253,138,254,138,255,138,0,139,1,139,2,139,3,139,4,139,5,139,6,139,8,139,9,139,10,139,11,139,12,139,13,139,14,139,15,139,16,139,17,139,18,139,19,139,20,139,21,139,22,139,23,139,24,139,25,139,26,139,27,139,28,139,29,139,30,139,31,139,32,139,33,139,34,139,35,139,36,139,37,139,39,139,40,139,41,139,42,139,43,139,44,139,45,139,46,139,47,139,48,139,49,139,50,139,51,139,52,139,53,139,54,139,55,139,56,139,57,139,58,139,59,139,60,139,61,139,62,139,63,139,64,139,65,139,66,139,67,139,68,139,69,139,39,94,199,117,209,144,193,139,157,130,157,103,47,101,49,84,24,135,229,119,162,128,2,129,65,108,75,78,199,126,76,128,244,118,13,105,150,107,103,98,60,80,132,79,64,87,7,99,98,107,190,141,234,83,232,101,184,126,215,95,26,99,183,99,243,129,244,129,110,127,28,94,217,92,54,82,122,102,233,121,26,122,40,141,153,112,212,117,222,110,187,108,146,122,45,78,197,118,224,95,159,148,119,136,200,126,205,121,191,128,205,145,242,78,23,79,31,130,104,84,222,93,50,109,204,139,165,124,116,143,152,128,26,94,146,84,177,118,153,91,60,102,164,154,224,115,42,104,219,134,49,103,42,115,248,139,219,139,16,144,249,122,219,112,110,113,196,98,169,119,49,86,59,78,87,132,241,103,169,82,192,134,46,141,248,148,81,123,70,139,71,139,72,139,73,139,74,139,75,139,76,139,77,139,78,139,79,139,80,139,81,139,82,139,83,139,84,139,85,139,86,139,87,139,88,139,89,139,90,139,91,139,92,139,93,139,94,139,95,139,96,139,97,139,98,139,99,139,100,139,101,139,103,139,104,139,105,139,106,139,107,139,109,139,110,139,111,139,112,139,113,139,114,139,115,139,116,139,117,139,118,139,119,139,120,139,121,139,122,139,123,139,124,139,125,139,126,139,127,139,128,139,129,139,130,139,131,139,132,139,133,139,134,139,135,139,136,139,137,139,138,139,139,139,140,139,141,139,142,139,143,139,144,139,145,139,146,139,147,139,148,139,149,139,150,139,151,139,152,139,153,139,154,139,155,139,156,139,157,139,158,139,159,139,172,139,177,139,187,139,199,139,208,139,234,139,9,140,30,140,79,79,232,108,93,121,123,154,147,98,42,114,253,98,19,78,22,120,108,143,176,100,90,141,198,123,105,104,132,94,197,136,134,89,158,100,238,88,182,114,14,105,37,149,253,143,88,141,96,87,0,127,6,140,198,81,73,99,217,98,83,83,76,104,34,116,1,131,76,145,68,85,64,119,124,112,74,109,121,81,168,84,68,141,255,89,203,110,196,109,92,91,43,125,212,78,125,124,211,110,80,91,234,129,13,110,87,91,3,155,213,104,42,142,151,91,252,126,59,96,181,126,185,144,112,141,79,89,205,99,223,121,179,141,82,83,207,101,86,121,197,139,59,150,196,126,187,148,130,126,52,86,137,145,0,103,106,127,10,92,117,144,40,102,230,93,80,79,222,103,90,80,92,79,80,87,167,94,16,232,17,232,18,232,19,232,20,232,56,140,57,140,58,140,59,140,60,140,61,140,62,140,63,140,64,140,66,140,67,140,68,140,69,140,72,140,74,140,75,140,77,140,78,140,79,140,80,140,81,140,82,140,83,140,84,140,86,140,87,140,88,140,89,140,91,140,92,140,93,140,94,140,95,140,96,140,99,140,100,140,101,140,102,140,103,140,104,140,105,140,108,140,109,140,110,140,111,140,112,140,113,140,114,140,116,140,117,140,118,140,119,140,123,140,124,140,125,140,126,140,127,140,128,140,129,140,131,140,132,140,134,140,135,140,136,140,139,140,141,140,142,140,143,140,144,140,145,140,146,140,147,140,149,140,150,140,151,140,153,140,154,140,155,140,156,140,157,140,158,140,159,140,160,140,161,140,162,140,163,140,164,140,165,140,166,140,167,140,168,140,169,140,170,140,171,140,172,140,173,140,141,78,12,78,64,81,16,78,255,94,69,83,21,78,152,78,30,78,50,155,108,91,105,86,40,78,186,121,63,78,21,83,71,78,45,89,59,114,110,83,16,108,223,86,228,128,151,153,211,107,126,119,23,159,54,78,159,78,16,159,92,78,105,78,147,78,136,130,91,91,108,85,15,86,196,78,141,83,157,83,163,83,165,83,174,83,101,151,93,141,26,83,245,83,38,83,46,83,62,83,92,141,102,83,99,83,2,82,8,82,14,82,45,82,51,82,63,82,64,82,76,82,94,82,97,82,92,82,175,132,125,82,130,82,129,82,144,82,147,82,130,81,84,127,187,78,195,78,201,78,194,78,232,78,225,78,235,78,222,78,27,79,243,78,34,79,100,79,245,78,37,79,39,79,9,79,43,79,94,79,103,79,56,101,90,79,93,79,174,140,175,140,176,140,177,140,178,140,179,140,180,140,181,140,182,140,183,140,184,140,185,140,186,140,187,140,188,140,189,140,190,140,191,140,192,140,193,140,194,140,195,140,196,140,197,140,198,140,199,140,200,140,201,140,202,140,203,140,204,140,205,140,206,140,207,140,208,140,209,140,210,140,211,140,212,140,213,140,214,140,215,140,216,140,217,140,218,140,219,140,220,140,221,140,222,140,223,140,224,140,225,140,226,140,227,140,228,140,229,140,230,140,231,140,232,140,233,140,234,140,235,140,236,140,237,140,238,140,239,140,240,140,241,140,242,140,243,140,244,140,245,140,246,140,247,140,248,140,249,140,250,140,251,140,252,140,253,140,254,140,255,140,0,141,1,141,2,141,3,141,4,141,5,141,6,141,7,141,8,141,9,141,10,141,11,141,12,141,13,141,95,79,87,79,50,79,61,79,118,79,116,79,145,79,137,79,131,79,143,79,126,79,123,79,170,79,124,79,172,79,148,79,230,79,232,79,234,79,197,79,218,79,227,79,220,79,209,79,223,79,248,79,41,80,76,80,243,79,44,80,15,80,46,80,45,80,254,79,28,80,12,80,37,80,40,80,126,80,67,80,85,80,72,80,78,80,108,80,123,80,165,80,167,80,169,80,186,80,214,80,6,81,237,80,236,80,230,80,238,80,7,81,11,81,221,78,61,108,88,79,101,79,206,79,160,159,70,108,116,124,110,81,253,93,201,158,152,153,129,81,20,89,249,82,13,83,7,138,16,83,235,81,25,89,85,81,160,78,86,81,179,78,110,136,164,136,181,78,20,129,210,136,128,121,52,91,3,136,184,127,171,81,177,81,189,81,188,81,14,141,15,141,16,141,17,141,18,141,19,141,20,141,21,141,22,141,23,141,24,141,25,141,26,141,27,141,28,141,32,141,81,141,82,141,87,141,95,141,101,141,104,141,105,141,106,141,108,141,110,141,111,141,113,141,114,141,120,141,121,141,122,141,123,141,124,141,125,141,126,141,127,141,128,141,130,141,131,141,134,141,135,141,136,141,137,141,140,141,141,141,142,141,143,141,144,141,146,141,147,141,149,141,150,141,151,141,152,141,153,141,154,141,155,141,156,141,157,141,158,141,160,141,161,141,162,141,164,141,165,141,166,141,167,141,168,141,169,141,170,141,171,141,172,141,173,141,174,141,175,141,176,141,178,141,182,141,183,141,185,141,187,141,189,141,192,141,193,141,194,141,197,141,199,141,200,141,201,141,202,141,205,141,208,141,210,141,211,141,212,141,199,81,150,81,162,81,165,81,160,139,166,139,167,139,170,139,180,139,181,139,183,139,194,139,195,139,203,139,207,139,206,139,210,139,211,139,212,139,214,139,216,139,217,139,220,139,223,139,224,139,228,139,232,139,233,139,238,139,240,139,243,139,246,139,249,139,252,139,255,139,0,140,2,140,4,140,7,140,12,140,15,140,17,140,18,140,20,140,21,140,22,140,25,140,27,140,24,140,29,140,31,140,32,140,33,140,37,140,39,140,42,140,43,140,46,140,47,140,50,140,51,140,53,140,54,140,105,83,122,83,29,150,34,150,33,150,49,150,42,150,61,150,60,150,66,150,73,150,84,150,95,150,103,150,108,150,114,150,116,150,136,150,141,150,151,150,176,150,151,144,155,144,157,144,153,144,172,144,161,144,180,144,179,144,182,144,186,144,213,141,216,141,217,141,220,141,224,141,225,141,226,141,229,141,230,141,231,141,233,141,237,141,238,141,240,141,241,141,242,141,244,141,246,141,252,141,254,141,255,141,0,142,1,142,2,142,3,142,4,142,6,142,7,142,8,142,11,142,13,142,14,142,16,142,17,142,18,142,19,142,21,142,22,142,23,142,24,142,25,142,26,142,27,142,28,142,32,142,33,142,36,142,37,142,38,142,39,142,40,142,43,142,45,142,48,142,50,142,51,142,52,142,54,142,55,142,56,142,59,142,60,142,62,142,63,142,67,142,69,142,70,142,76,142,77,142,78,142,79,142,80,142,83,142,84,142,85,142,86,142,87,142,88,142,90,142,91,142,92,142,93,142,94,142,95,142,96,142,97,142,98,142,99,142,100,142,101,142,103,142,104,142,106,142,107,142,110,142,113,142,184,144,176,144,207,144,197,144,190,144,208,144,196,144,199,144,211,144,230,144,226,144,220,144,215,144,219,144,235,144,239,144,254,144,4,145,34,145,30,145,35,145,49,145,47,145,57,145,67,145,70,145,13,82,66,89,162,82,172,82,173,82,190,82,255,84,208,82,214,82,240,82,223,83,238,113,205,119,244,94,245,81,252,81,47,155,182,83,1,95,90,117,239,93,76,87,169,87,161,87,126,88,188,88,197,88,209,88,41,87,44,87,42,87,51,87,57,87,46,87,47,87,92,87,59,87,66,87,105,87,133,87,107,87,134,87,124,87,123,87,104,87,109,87,118,87,115,87,173,87,164,87,140,87,178,87,207,87,167,87,180,87,147,87,160,87,213,87,216,87,218,87,217,87,210,87,184,87,244,87,239,87,248,87,228,87,221,87,115,142,117,142,119,142,120,142,121,142,122,142,123,142,125,142,126,142,128,142,130,142,131,142,132,142,134,142,136,142,137,142,138,142,139,142,140,142,141,142,142,142,145,142,146,142,147,142,149,142,150,142,151,142,152,142,153,142,154,142,155,142,157,142,159,142,160,142,161,142,162,142,163,142,164,142,165,142,166,142,167,142,168,142,169,142,170,142,173,142,174,142,176,142,177,142,179,142,180,142,181,142,182,142,183,142,184,142,185,142,187,142,188,142,189,142,190,142,191,142,192,142,193,142,194,142,195,142,196,142,197,142,198,142,199,142,200,142,201,142,202,142,203,142,204,142,205,142,207,142,208,142,209,142,210,142,211,142,212,142,213,142,214,142,215,142,216,142,217,142,218,142,219,142,220,142,221,142,222,142,223,142,224,142,225,142,226,142,227,142,228,142,11,88,13,88,253,87,237,87,0,88,30,88,25,88,68,88,32,88,101,88,108,88,129,88,137,88,154,88,128,88,168,153,25,159,255,97,121,130,125,130,127,130,143,130,138,130,168,130,132,130,142,130,145,130,151,130,153,130,171,130,184,130,190,130,176,130,200,130,202,130,227,130,152,130,183,130,174,130,203,130,204,130,193,130,169,130,180,130,161,130,170,130,159,130,196,130,206,130,164,130,225,130,9,131,247,130,228,130,15,131,7,131,220,130,244,130,210,130,216,130,12,131,251,130,211,130,17,131,26,131,6,131,20,131,21,131,224,130,213,130,28,131,81,131,91,131,92,131,8,131,146,131,60,131,52,131,49,131,155,131,94,131,47,131,79,131,71,131,67,131,95,131,64,131,23,131,96,131,45,131,58,131,51,131,102,131,101,131,229,142,230,142,231,142,232,142,233,142,234,142,235,142,236,142,237,142,238,142,239,142,240,142,241,142,242,142,243,142,244,142,245,142,246,142,247,142,248,142,249,142,250,142,251,142,252,142,253,142,254,142,255,142,0,143,1,143,2,143,3,143,4,143,5,143,6,143,7,143,8,143,9,143,10,143,11,143,12,143,13,143,14,143,15,143,16,143,17,143,18,143,19,143,20,143,21,143,22,143,23,143,24,143,25,143,26,143,27,143,28,143,29,143,30,143,31,143,32,143,33,143,34,143,35,143,36,143,37,143,38,143,39,143,40,143,41,143,42,143,43,143,44,143,45,143,46,143,47,143,48,143,49,143,50,143,51,143,52,143,53,143,54,143,55,143,56,143,57,143,58,143,59,143,60,143,61,143,62,143,63,143,64,143,65,143,66,143,67,143,68,143,104,131,27,131,105,131,108,131,106,131,109,131,110,131,176,131,120,131,179,131,180,131,160,131,170,131,147,131,156,131,133,131,124,131,182,131,169,131,125,131,184,131,123,131,152,131,158,131,168,131,186,131,188,131,193,131,1,132,229,131,216,131,7,88,24,132,11,132,221,131,253,131,214,131,28,132,56,132,17,132,6,132,212,131,223,131,15,132,3,132,248,131,249,131,234,131,197,131,192,131,38,132,240,131,225,131,92,132,81,132,90,132,89,132,115,132,135,132,136,132,122,132,137,132,120,132,60,132,70,132,105,132,118,132,140,132,142,132,49,132,109,132,193,132,205,132,208,132,230,132,189,132,211,132,202,132,191,132,186,132,224,132,161,132,185,132,180,132,151,132,229,132,227,132,12,133,13,117,56,133,240,132,57,133,31,133,58,133,69,143,70,143,71,143,72,143,73,143,74,143,75,143,76,143,77,143,78,143,79,143,80,143,81,143,82,143,83,143,84,143,85,143,86,143,87,143,88,143,89,143,90,143,91,143,92,143,93,143,94,143,95,143,96,143,97,143,98,143,99,143,100,143,101,143,106,143,128,143,140,143,146,143,157,143,160,143,161,143,162,143,164,143,165,143,166,143,167,143,170,143,172,143,173,143,174,143,175,143,178,143,179,143,180,143,181,143,183,143,184,143,186,143,187,143,188,143,191,143,192,143,195,143,198,143,201,143,202,143,203,143,204,143,205,143,207,143,210,143,214,143,215,143,218,143,224,143,225,143,227,143,231,143,236,143,239,143,241,143,242,143,244,143,245,143,246,143,250,143,251,143,252,143,254,143,255,143,7,144,8,144,12,144,14,144,19,144,21,144,24,144,86,133,59,133,255,132,252,132,89,133,72,133,104,133,100,133,94,133,122,133,162,119,67,133,114,133,123,133,164,133,168,133,135,133,143,133,121,133,174,133,156,133,133,133,185,133,183,133,176,133,211,133,193,133,220,133,255,133,39,134,5,134,41,134,22,134,60,134,254,94,8,95,60,89,65,89,55,128,85,89,90,89,88,89,15,83,34,92,37,92,44,92,52,92,76,98,106,98,159,98,187,98,202,98,218,98,215,98,238,98,34,99,246,98,57,99,75,99,67,99,173,99,246,99,113,99,122,99,142,99,180,99,109,99,172,99,138,99,105,99,174,99,188,99,242,99,248,99,224,99,255,99,196,99,222,99,206,99,82,100,198,99,190,99,69,100,65,100,11,100,27,100,32,100,12,100,38,100,33,100,94,100,132,100,109,100,150,100,25,144,28,144,35,144,36,144,37,144,39,144,40,144,41,144,42,144,43,144,44,144,48,144,49,144,50,144,51,144,52,144,55,144,57,144,58,144,61,144,63,144,64,144,67,144,69,144,70,144,72,144,73,144,74,144,75,144,76,144,78,144,84,144,85,144,86,144,89,144,90,144,92,144,93,144,94,144,95,144,96,144,97,144,100,144,102,144,103,144,105,144,106,144,107,144,108,144,111,144,112,144,113,144,114,144,115,144,118,144,119,144,120,144,121,144,122,144,123,144,124,144,126,144,129,144,132,144,133,144,134,144,135,144,137,144,138,144,140,144,141,144,142,144,143,144,144,144,146,144,148,144,150,144,152,144,154,144,156,144,158,144,159,144,160,144,164,144,165,144,167,144,168,144,169,144,171,144,173,144,178,144,183,144,188,144,189,144,191,144,192,144,122,100,183,100,184,100,153,100,186,100,192,100,208,100,215,100,228,100,226,100,9,101,37,101,46,101,11,95,210,95,25,117,17,95,95,83,241,83,253,83,233,83,232,83,251,83,18,84,22,84,6,84,75,84,82,84,83,84,84,84,86,84,67,84,33,84,87,84,89,84,35,84,50,84,130,84,148,84,119,84,113,84,100,84,154,84,155,84,132,84,118,84,102,84,157,84,208,84,173,84,194,84,180,84,210,84,167,84,166,84,211,84,212,84,114,84,163,84,213,84,187,84,191,84,204,84,217,84,218,84,220,84,169,84,170,84,164,84,221,84,207,84,222,84,27,85,231,84,32,85,253,84,20,85,243,84,34,85,35,85,15,85,17,85,39,85,42,85,103,85,143,85,181,85,73,85,109,85,65,85,85,85,63,85,80,85,60,85,194,144,195,144,198,144,200,144,201,144,203,144,204,144,205,144,210,144,212,144,213,144,214,144,216,144,217,144,218,144,222,144,223,144,224,144,227,144,228,144,229,144,233,144,234,144,236,144,238,144,240,144,241,144,242,144,243,144,245,144,246,144,247,144,249,144,250,144,251,144,252,144,255,144,0,145,1,145,3,145,5,145,6,145,7,145,8,145,9,145,10,145,11,145,12,145,13,145,14,145,15,145,16,145,17,145,18,145,19,145,20,145,21,145,22,145,23,145,24,145,26,145,27,145,28,145,29,145,31,145,32,145,33,145,36,145,37,145,38,145,39,145,40,145,41,145,42,145,43,145,44,145,45,145,46,145,48,145,50,145,51,145,52,145,53,145,54,145,55,145,56,145,58,145,59,145,60,145,61,145,62,145,63,145,64,145,65,145,66,145,68,145,55,85,86,85,117,85,118,85,119,85,51,85,48,85,92,85,139,85,210,85,131,85,177,85,185,85,136,85,129,85,159,85,126,85,214,85,145,85,123,85,223,85,189,85,190,85,148,85,153,85,234,85,247,85,201,85,31,86,209,85,235,85,236,85,212,85,230,85,221,85,196,85,239,85,229,85,242,85,243,85,204,85,205,85,232,85,245,85,228,85,148,143,30,86,8,86,12,86,1,86,36,86,35,86,254,85,0,86,39,86,45,86,88,86,57,86,87,86,44,86,77,86,98,86,89,86,92,86,76,86,84,86,134,86,100,86,113,86,107,86,123,86,124,86,133,86,147,86,175,86,212,86,215,86,221,86,225,86,245,86,235,86,249,86,255,86,4,87,10,87,9,87,28,87,15,94,25,94,20,94,17,94,49,94,59,94,60,94,69,145,71,145,72,145,81,145,83,145,84,145,85,145,86,145,88,145,89,145,91,145,92,145,95,145,96,145,102,145,103,145,104,145,107,145,109,145,115,145,122,145,123,145,124,145,128,145,129,145,130,145,131,145,132,145,134,145,136,145,138,145,142,145,143,145,147,145,148,145,149,145,150,145,151,145,152,145,153,145,156,145,157,145,158,145,159,145,160,145,161,145,164,145,165,145,166,145,167,145,168,145,169,145,171,145,172,145,176,145,177,145,178,145,179,145,182,145,183,145,184,145,185,145,187,145,188,145,189,145,190,145,191,145,192,145,193,145,194,145,195,145,196,145,197,145,198,145,200,145,203,145,208,145,210,145,211,145,212,145,213,145,214,145,215,145,216,145,217,145,218,145,219,145,221,145,222,145,223,145,224,145,225,145,226,145,227,145,228,145,229,145,55,94,68,94,84,94,91,94,94,94,97,94,140,92,122,92,141,92,144,92,150,92,136,92,152,92,153,92,145,92,154,92,156,92,181,92,162,92,189,92,172,92,171,92,177,92,163,92,193,92,183,92,196,92,210,92,228,92,203,92,229,92,2,93,3,93,39,93,38,93,46,93,36,93,30,93,6,93,27,93,88,93,62,93,52,93,61,93,108,93,91,93,111,93,93,93,107,93,75,93,74,93,105,93,116,93,130,93,153,93,157,93,115,140,183,93,197,93,115,95,119,95,130,95,135,95,137,95,140,95,149,95,153,95,156,95,168,95,173,95,181,95,188,95,98,136,97,95,173,114,176,114,180,114,183,114,184,114,195,114,193,114,206,114,205,114,210,114,232,114,239,114,233,114,242,114,244,114,247,114,1,115,243,114,3,115,250,114,230,145,231,145,232,145,233,145,234,145,235,145,236,145,237,145,238,145,239,145,240,145,241,145,242,145,243,145,244,145,245,145,246,145,247,145,248,145,249,145,250,145,251,145,252,145,253,145,254,145,255,145,0,146,1,146,2,146,3,146,4,146,5,146,6,146,7,146,8,146,9,146,10,146,11,146,12,146,13,146,14,146,15,146,16,146,17,146,18,146,19,146,20,146,21,146,22,146,23,146,24,146,25,146,26,146,27,146,28,146,29,146,30,146,31,146,32,146,33,146,34,146,35,146,36,146,37,146,38,146,39,146,40,146,41,146,42,146,43,146,44,146,45,146,46,146,47,146,48,146,49,146,50,146,51,146,52,146,53,146,54,146,55,146,56,146,57,146,58,146,59,146,60,146,61,146,62,146,63,146,64,146,65,146,66,146,67,146,68,146,69,146,251,114,23,115,19,115,33,115,10,115,30,115,29,115,21,115,34,115,57,115,37,115,44,115,56,115,49,115,80,115,77,115,87,115,96,115,108,115,111,115,126,115,27,130,37,89,231,152,36,89,2,89,99,153,103,153,104,153,105,153,106,153,107,153,108,153,116,153,119,153,125,153,128,153,132,153,135,153,138,153,141,153,144,153,145,153,147,153,148,153,149,153,128,94,145,94,139,94,150,94,165,94,160,94,185,94,181,94,190,94,179,94,83,141,210,94,209,94,219,94,232,94,234,94,186,129,196,95,201,95,214,95,207,95,3,96,238,95,4,96,225,95,228,95,254,95,5,96,6,96,234,95,237,95,248,95,25,96,53,96,38,96,27,96,15,96,13,96,41,96,43,96,10,96,63,96,33,96,120,96,121,96,123,96,122,96,66,96,70,146,71,146,72,146,73,146,74,146,75,146,76,146,77,146,78,146,79,146,80,146,81,146,82,146,83,146,84,146,85,146,86,146,87,146,88,146,89,146,90,146,91,146,92,146,93,146,94,146,95,146,96,146,97,146,98,146,99,146,100,146,101,146,102,146,103,146,104,146,105,146,106,146,107,146,108,146,109,146,110,146,111,146,112,146,113,146,114,146,115,146,117,146,118,146,119,146,120,146,121,146,122,146,123,146,124,146,125,146,126,146,127,146,128,146,129,146,130,146,131,146,132,146,133,146,134,146,135,146,136,146,137,146,138,146,139,146,140,146,141,146,143,146,144,146,145,146,146,146,147,146,148,146,149,146,150,146,151,146,152,146,153,146,154,146,155,146,156,146,157,146,158,146,159,146,160,146,161,146,162,146,163,146,164,146,165,146,166,146,167,146,106,96,125,96,150,96,154,96,173,96,157,96,131,96,146,96,140,96,155,96,236,96,187,96,177,96,221,96,216,96,198,96,218,96,180,96,32,97,38,97,21,97,35,97,244,96,0,97,14,97,43,97,74,97,117,97,172,97,148,97,167,97,183,97,212,97,245,97,221,95,179,150,233,149,235,149,241,149,243,149,245,149,246,149,252,149,254,149,3,150,4,150,6,150,8,150,10,150,11,150,12,150,13,150,15,150,18,150,21,150,22,150,23,150,25,150,26,150,44,78,63,114,21,98,53,108,84,108,92,108,74,108,163,108,133,108,144,108,148,108,140,108,104,108,105,108,116,108,118,108,134,108,169,108,208,108,212,108,173,108,247,108,248,108,241,108,215,108,178,108,224,108,214,108,250,108,235,108,238,108,177,108,211,108,239,108,254,108,168,146,169,146,170,146,171,146,172,146,173,146,175,146,176,146,177,146,178,146,179,146,180,146,181,146,182,146,183,146,184,146,185,146,186,146,187,146,188,146,189,146,190,146,191,146,192,146,193,146,194,146,195,146,196,146,197,146,198,146,199,146,201,146,202,146,203,146,204,146,205,146,206,146,207,146,208,146,209,146,210,146,211,146,212,146,213,146,214,146,215,146,216,146,217,146,218,146,219,146,220,146,221,146,222,146,223,146,224,146,225,146,226,146,227,146,228,146,229,146,230,146,231,146,232,146,233,146,234,146,235,146,236,146,237,146,238,146,239,146,240,146,241,146,242,146,243,146,244,146,245,146,246,146,247,146,248,146,249,146,250,146,251,146,252,146,253,146,254,146,255,146,0,147,1,147,2,147,3,147,4,147,5,147,6,147,7,147,8,147,9,147,57,109,39,109,12,109,67,109,72,109,7,109,4,109,25,109,14,109,43,109,77,109,46,109,53,109,26,109,79,109,82,109,84,109,51,109,145,109,111,109,158,109,160,109,94,109,147,109,148,109,92,109,96,109,124,109,99,109,26,110,199,109,197,109,222,109,14,110,191,109,224,109,17,110,230,109,221,109,217,109,22,110,171,109,12,110,174,109,43,110,110,110,78,110,107,110,178,110,95,110,134,110,83,110,84,110,50,110,37,110,68,110,223,110,177,110,152,110,224,110,45,111,226,110,165,110,167,110,189,110,187,110,183,110,215,110,180,110,207,110,143,110,194,110,159,110,98,111,70,111,71,111,36,111,21,111,249,110,47,111,54,111,75,111,116,111,42,111,9,111,41,111,137,111,141,111,140,111,120,111,114,111,124,111,122,111,209,111,10,147,11,147,12,147,13,147,14,147,15,147,16,147,17,147,18,147,19,147,20,147,21,147,22,147,23,147,24,147,25,147,26,147,27,147,28,147,29,147,30,147,31,147,32,147,33,147,34,147,35,147,36,147,37,147,38,147,39,147,40,147,41,147,42,147,43,147,44,147,45,147,46,147,47,147,48,147,49,147,50,147,51,147,52,147,53,147,54,147,55,147,56,147,57,147,58,147,59,147,60,147,61,147,63,147,64,147,65,147,66,147,67,147,68,147,69,147,70,147,71,147,72,147,73,147,74,147,75,147,76,147,77,147,78,147,79,147,80,147,81,147,82,147,83,147,84,147,85,147,86,147,87,147,88,147,89,147,90,147,91,147,92,147,93,147,94,147,95,147,96,147,97,147,98,147,99,147,100,147,101,147,102,147,103,147,104,147,105,147,107,147,201,111,167,111,185,111,182,111,194,111,225,111,238,111,222,111,224,111,239,111,26,112,35,112,27,112,57,112,53,112,79,112,94,112,128,91], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+47812);
/* memory initializer */ allocate([132,91,149,91,147,91,165,91,184,91,47,117,158,154,52,100,228,91,238,91,48,137,240,91,71,142,7,139,182,143,211,143,213,143,229,143,238,143,228,143,233,143,230,143,243,143,232,143,5,144,4,144,11,144,38,144,17,144,13,144,22,144,33,144,53,144,54,144,45,144,47,144,68,144,81,144,82,144,80,144,104,144,88,144,98,144,91,144,185,102,116,144,125,144,130,144,136,144,131,144,139,144,80,95,87,95,86,95,88,95,59,92,171,84,80,92,89,92,113,91,99,92,102,92,188,127,42,95,41,95,45,95,116,130,60,95,59,155,110,92,129,89,131,89,141,89,169,89,170,89,163,89,108,147,109,147,110,147,111,147,112,147,113,147,114,147,115,147,116,147,117,147,118,147,119,147,120,147,121,147,122,147,123,147,124,147,125,147,126,147,127,147,128,147,129,147,130,147,131,147,132,147,133,147,134,147,135,147,136,147,137,147,138,147,139,147,140,147,141,147,142,147,144,147,145,147,146,147,147,147,148,147,149,147,150,147,151,147,152,147,153,147,154,147,155,147,156,147,157,147,158,147,159,147,160,147,161,147,162,147,163,147,164,147,165,147,166,147,167,147,168,147,169,147,170,147,171,147,172,147,173,147,174,147,175,147,176,147,177,147,178,147,179,147,180,147,181,147,182,147,183,147,184,147,185,147,186,147,187,147,188,147,189,147,190,147,191,147,192,147,193,147,194,147,195,147,196,147,197,147,198,147,199,147,200,147,201,147,203,147,204,147,205,147,151,89,202,89,171,89,158,89,164,89,210,89,178,89,175,89,215,89,190,89,5,90,6,90,221,89,8,90,227,89,216,89,249,89,12,90,9,90,50,90,52,90,17,90,35,90,19,90,64,90,103,90,74,90,85,90,60,90,98,90,117,90,236,128,170,90,155,90,119,90,122,90,190,90,235,90,178,90,210,90,212,90,184,90,224,90,227,90,241,90,214,90,230,90,216,90,220,90,9,91,23,91,22,91,50,91,55,91,64,91,21,92,28,92,90,91,101,91,115,91,81,91,83,91,98,91,117,154,119,154,120,154,122,154,127,154,125,154,128,154,129,154,133,154,136,154,138,154,144,154,146,154,147,154,150,154,152,154,155,154,156,154,157,154,159,154,160,154,162,154,163,154,165,154,167,154,159,126,161,126,163,126,165,126,168,126,169,126,206,147,207,147,208,147,209,147,210,147,211,147,212,147,213,147,215,147,216,147,217,147,218,147,219,147,220,147,221,147,222,147,223,147,224,147,225,147,226,147,227,147,228,147,229,147,230,147,231,147,232,147,233,147,234,147,235,147,236,147,237,147,238,147,239,147,240,147,241,147,242,147,243,147,244,147,245,147,246,147,247,147,248,147,249,147,250,147,251,147,252,147,253,147,254,147,255,147,0,148,1,148,2,148,3,148,4,148,5,148,6,148,7,148,8,148,9,148,10,148,11,148,12,148,13,148,14,148,15,148,16,148,17,148,18,148,19,148,20,148,21,148,22,148,23,148,24,148,25,148,26,148,27,148,28,148,29,148,30,148,31,148,32,148,33,148,34,148,35,148,36,148,37,148,38,148,39,148,40,148,41,148,42,148,43,148,44,148,45,148,46,148,173,126,176,126,190,126,192,126,193,126,194,126,201,126,203,126,204,126,208,126,212,126,215,126,219,126,224,126,225,126,232,126,235,126,238,126,239,126,241,126,242,126,13,127,246,126,250,126,251,126,254,126,1,127,2,127,3,127,7,127,8,127,11,127,12,127,15,127,17,127,18,127,23,127,25,127,28,127,27,127,31,127,33,127,34,127,35,127,36,127,37,127,38,127,39,127,42,127,43,127,44,127,45,127,47,127,48,127,49,127,50,127,51,127,53,127,122,94,127,117,219,93,62,117,149,144,142,115,145,115,174,115,162,115,159,115,207,115,194,115,209,115,183,115,179,115,192,115,201,115,200,115,229,115,217,115,124,152,10,116,233,115,231,115,222,115,186,115,242,115,15,116,42,116,91,116,38,116,37,116,40,116,48,116,46,116,44,116,47,148,48,148,49,148,50,148,51,148,52,148,53,148,54,148,55,148,56,148,57,148,58,148,59,148,60,148,61,148,63,148,64,148,65,148,66,148,67,148,68,148,69,148,70,148,71,148,72,148,73,148,74,148,75,148,76,148,77,148,78,148,79,148,80,148,81,148,82,148,83,148,84,148,85,148,86,148,87,148,88,148,89,148,90,148,91,148,92,148,93,148,94,148,95,148,96,148,97,148,98,148,99,148,100,148,101,148,102,148,103,148,104,148,105,148,106,148,108,148,109,148,110,148,111,148,112,148,113,148,114,148,115,148,116,148,117,148,118,148,119,148,120,148,121,148,122,148,123,148,124,148,125,148,126,148,127,148,128,148,129,148,130,148,131,148,132,148,145,148,150,148,152,148,199,148,207,148,211,148,212,148,218,148,230,148,251,148,28,149,32,149,27,116,26,116,65,116,92,116,87,116,85,116,89,116,119,116,109,116,126,116,156,116,142,116,128,116,129,116,135,116,139,116,158,116,168,116,169,116,144,116,167,116,210,116,186,116,234,151,235,151,236,151,76,103,83,103,94,103,72,103,105,103,165,103,135,103,106,103,115,103,152,103,167,103,117,103,168,103,158,103,173,103,139,103,119,103,124,103,240,103,9,104,216,103,10,104,233,103,176,103,12,104,217,103,181,103,218,103,179,103,221,103,0,104,195,103,184,103,226,103,14,104,193,103,253,103,50,104,51,104,96,104,97,104,78,104,98,104,68,104,100,104,131,104,29,104,85,104,102,104,65,104,103,104,64,104,62,104,74,104,73,104,41,104,181,104,143,104,116,104,119,104,147,104,107,104,194,104,110,105,252,104,31,105,32,105,249,104,39,149,51,149,61,149,67,149,72,149,75,149,85,149,90,149,96,149,110,149,116,149,117,149,119,149,120,149,121,149,122,149,123,149,124,149,125,149,126,149,128,149,129,149,130,149,131,149,132,149,133,149,134,149,135,149,136,149,137,149,138,149,139,149,140,149,141,149,142,149,143,149,144,149,145,149,146,149,147,149,148,149,149,149,150,149,151,149,152,149,153,149,154,149,155,149,156,149,157,149,158,149,159,149,160,149,161,149,162,149,163,149,164,149,165,149,166,149,167,149,168,149,169,149,170,149,171,149,172,149,173,149,174,149,175,149,176,149,177,149,178,149,179,149,180,149,181,149,182,149,183,149,184,149,185,149,186,149,187,149,188,149,189,149,190,149,191,149,192,149,193,149,194,149,195,149,196,149,197,149,198,149,199,149,200,149,201,149,202,149,203,149,36,105,240,104,11,105,1,105,87,105,227,104,16,105,113,105,57,105,96,105,66,105,93,105,132,105,107,105,128,105,152,105,120,105,52,105,204,105,135,105,136,105,206,105,137,105,102,105,99,105,121,105,155,105,167,105,187,105,171,105,173,105,212,105,177,105,193,105,202,105,223,105,149,105,224,105,141,105,255,105,47,106,237,105,23,106,24,106,101,106,242,105,68,106,62,106,160,106,80,106,91,106,53,106,142,106,121,106,61,106,40,106,88,106,124,106,145,106,144,106,169,106,151,106,171,106,55,115,82,115,129,107,130,107,135,107,132,107,146,107,147,107,141,107,154,107,155,107,161,107,170,107,107,143,109,143,113,143,114,143,115,143,117,143,118,143,120,143,119,143,121,143,122,143,124,143,126,143,129,143,130,143,132,143,135,143,139,143,204,149,205,149,206,149,207,149,208,149,209,149,210,149,211,149,212,149,213,149,214,149,215,149,216,149,217,149,218,149,219,149,220,149,221,149,222,149,223,149,224,149,225,149,226,149,227,149,228,149,229,149,230,149,231,149,236,149,255,149,7,150,19,150,24,150,27,150,30,150,32,150,35,150,36,150,37,150,38,150,39,150,40,150,41,150,43,150,44,150,45,150,47,150,48,150,55,150,56,150,57,150,58,150,62,150,65,150,67,150,74,150,78,150,79,150,81,150,82,150,83,150,86,150,87,150,88,150,89,150,90,150,92,150,93,150,94,150,96,150,99,150,101,150,102,150,107,150,109,150,110,150,111,150,112,150,113,150,115,150,120,150,121,150,122,150,123,150,124,150,125,150,126,150,127,150,128,150,129,150,130,150,131,150,132,150,135,150,137,150,138,150,141,143,142,143,143,143,152,143,154,143,206,142,11,98,23,98,27,98,31,98,34,98,33,98,37,98,36,98,44,98,231,129,239,116,244,116,255,116,15,117,17,117,19,117,52,101,238,101,239,101,240,101,10,102,25,102,114,103,3,102,21,102,0,102,133,112,247,102,29,102,52,102,49,102,54,102,53,102,6,128,95,102,84,102,65,102,79,102,86,102,97,102,87,102,119,102,132,102,140,102,167,102,157,102,190,102,219,102,220,102,230,102,233,102,50,141,51,141,54,141,59,141,61,141,64,141,69,141,70,141,72,141,73,141,71,141,77,141,85,141,89,141,199,137,202,137,203,137,204,137,206,137,207,137,208,137,209,137,110,114,159,114,93,114,102,114,111,114,126,114,127,114,132,114,139,114,141,114,143,114,146,114,8,99,50,99,176,99,140,150,142,150,145,150,146,150,147,150,149,150,150,150,154,150,155,150,157,150,158,150,159,150,160,150,161,150,162,150,163,150,164,150,165,150,166,150,168,150,169,150,170,150,171,150,172,150,173,150,174,150,175,150,177,150,178,150,180,150,181,150,183,150,184,150,186,150,187,150,191,150,194,150,195,150,200,150,202,150,203,150,208,150,209,150,211,150,212,150,214,150,215,150,216,150,217,150,218,150,219,150,220,150,221,150,222,150,223,150,225,150,226,150,227,150,228,150,229,150,230,150,231,150,235,150,236,150,237,150,238,150,240,150,241,150,242,150,244,150,245,150,248,150,250,150,251,150,252,150,253,150,255,150,2,151,3,151,5,151,10,151,11,151,12,151,16,151,17,151,18,151,20,151,21,151,23,151,24,151,25,151,26,151,27,151,29,151,31,151,32,151,63,100,216,100,4,128,234,107,243,107,253,107,245,107,249,107,5,108,7,108,6,108,13,108,21,108,24,108,25,108,26,108,33,108,41,108,36,108,42,108,50,108,53,101,85,101,107,101,77,114,82,114,86,114,48,114,98,134,22,82,159,128,156,128,147,128,188,128,10,103,189,128,177,128,171,128,173,128,180,128,183,128,231,128,232,128,233,128,234,128,219,128,194,128,196,128,217,128,205,128,215,128,16,103,221,128,235,128,241,128,244,128,237,128,13,129,14,129,242,128,252,128,21,103,18,129,90,140,54,129,30,129,44,129,24,129,50,129,72,129,76,129,83,129,116,129,89,129,90,129,113,129,96,129,105,129,124,129,125,129,109,129,103,129,77,88,181,90,136,129,130,129,145,129,213,110,163,129,170,129,204,129,38,103,202,129,187,129,33,151,34,151,35,151,36,151,37,151,38,151,39,151,40,151,41,151,43,151,44,151,46,151,47,151,49,151,51,151,52,151,53,151,54,151,55,151,58,151,59,151,60,151,61,151,63,151,64,151,65,151,66,151,67,151,68,151,69,151,70,151,71,151,72,151,73,151,74,151,75,151,76,151,77,151,78,151,79,151,80,151,81,151,84,151,85,151,87,151,88,151,90,151,92,151,93,151,95,151,99,151,100,151,102,151,103,151,104,151,106,151,107,151,108,151,109,151,110,151,111,151,112,151,113,151,114,151,117,151,119,151,120,151,121,151,122,151,123,151,125,151,126,151,127,151,128,151,129,151,130,151,131,151,132,151,134,151,135,151,136,151,137,151,138,151,140,151,142,151,143,151,144,151,147,151,149,151,150,151,151,151,153,151,154,151,155,151,156,151,157,151,193,129,166,129,36,107,55,107,57,107,67,107,70,107,89,107,209,152,210,152,211,152,213,152,217,152,218,152,179,107,64,95,194,107,243,137,144,101,81,159,147,101,188,101,198,101,196,101,195,101,204,101,206,101,210,101,214,101,128,112,156,112,150,112,157,112,187,112,192,112,183,112,171,112,177,112,232,112,202,112,16,113,19,113,22,113,47,113,49,113,115,113,92,113,104,113,69,113,114,113,74,113,120,113,122,113,152,113,179,113,181,113,168,113,160,113,224,113,212,113,231,113,249,113,29,114,40,114,108,112,24,113,102,113,185,113,62,98,61,98,67,98,72,98,73,98,59,121,64,121,70,121,73,121,91,121,92,121,83,121,90,121,98,121,87,121,96,121,111,121,103,121,122,121,133,121,138,121,154,121,167,121,179,121,209,95,208,95,158,151,159,151,161,151,162,151,164,151,165,151,166,151,167,151,168,151,169,151,170,151,172,151,174,151,176,151,177,151,179,151,181,151,182,151,183,151,184,151,185,151,186,151,187,151,188,151,189,151,190,151,191,151,192,151,193,151,194,151,195,151,196,151,197,151,198,151,199,151,200,151,201,151,202,151,203,151,204,151,205,151,206,151,207,151,208,151,209,151,210,151,211,151,212,151,213,151,214,151,215,151,216,151,217,151,218,151,219,151,220,151,221,151,222,151,223,151,224,151,225,151,226,151,227,151,228,151,229,151,232,151,238,151,239,151,240,151,241,151,242,151,244,151,247,151,248,151,249,151,250,151,251,151,252,151,253,151,254,151,255,151,0,152,1,152,2,152,3,152,4,152,5,152,6,152,7,152,8,152,9,152,10,152,11,152,12,152,13,152,14,152,60,96,93,96,90,96,103,96,65,96,89,96,99,96,171,96,6,97,13,97,93,97,169,97,157,97,203,97,209,97,6,98,128,128,127,128,147,108,246,108,252,109,246,119,248,119,0,120,9,120,23,120,24,120,17,120,171,101,45,120,28,120,29,120,57,120,58,120,59,120,31,120,60,120,37,120,44,120,35,120,41,120,78,120,109,120,86,120,87,120,38,120,80,120,71,120,76,120,106,120,155,120,147,120,154,120,135,120,156,120,161,120,163,120,178,120,185,120,165,120,212,120,217,120,201,120,236,120,242,120,5,121,244,120,19,121,36,121,30,121,52,121,155,159,249,158,251,158,252,158,241,118,4,119,13,119,249,118,7,119,8,119,26,119,34,119,25,119,45,119,38,119,53,119,56,119,80,119,81,119,71,119,67,119,90,119,104,119,15,152,16,152,17,152,18,152,19,152,20,152,21,152,22,152,23,152,24,152,25,152,26,152,27,152,28,152,29,152,30,152,31,152,32,152,33,152,34,152,35,152,36,152,37,152,38,152,39,152,40,152,41,152,42,152,43,152,44,152,45,152,46,152,47,152,48,152,49,152,50,152,51,152,52,152,53,152,54,152,55,152,56,152,57,152,58,152,59,152,60,152,61,152,62,152,63,152,64,152,65,152,66,152,67,152,68,152,69,152,70,152,71,152,72,152,73,152,74,152,75,152,76,152,77,152,78,152,79,152,80,152,81,152,82,152,83,152,84,152,85,152,86,152,87,152,88,152,89,152,90,152,91,152,92,152,93,152,94,152,95,152,96,152,97,152,98,152,99,152,100,152,101,152,102,152,103,152,104,152,105,152,106,152,107,152,108,152,109,152,110,152,98,119,101,119,127,119,141,119,125,119,128,119,140,119,145,119,159,119,160,119,176,119,181,119,189,119,58,117,64,117,78,117,75,117,72,117,91,117,114,117,121,117,131,117,88,127,97,127,95,127,72,138,104,127,116,127,113,127,121,127,129,127,126,127,205,118,229,118,50,136,133,148,134,148,135,148,139,148,138,148,140,148,141,148,143,148,144,148,148,148,151,148,149,148,154,148,155,148,156,148,163,148,164,148,171,148,170,148,173,148,172,148,175,148,176,148,178,148,180,148,182,148,183,148,184,148,185,148,186,148,188,148,189,148,191,148,196,148,200,148,201,148,202,148,203,148,204,148,205,148,206,148,208,148,209,148,210,148,213,148,214,148,215,148,217,148,216,148,219,148,222,148,223,148,224,148,226,148,228,148,229,148,231,148,232,148,234,148,111,152,112,152,113,152,114,152,115,152,116,152,139,152,142,152,146,152,149,152,153,152,163,152,168,152,169,152,170,152,171,152,172,152,173,152,174,152,175,152,176,152,177,152,178,152,179,152,180,152,181,152,182,152,183,152,184,152,185,152,186,152,187,152,188,152,189,152,190,152,191,152,192,152,193,152,194,152,195,152,196,152,197,152,198,152,199,152,200,152,201,152,202,152,203,152,204,152,205,152,207,152,208,152,212,152,214,152,215,152,219,152,220,152,221,152,224,152,225,152,226,152,227,152,228,152,229,152,230,152,233,152,234,152,235,152,236,152,237,152,238,152,239,152,240,152,241,152,242,152,243,152,244,152,245,152,246,152,247,152,248,152,249,152,250,152,251,152,252,152,253,152,254,152,255,152,0,153,1,153,2,153,3,153,4,153,5,153,6,153,7,153,233,148,235,148,238,148,239,148,243,148,244,148,245,148,247,148,249,148,252,148,253,148,255,148,3,149,2,149,6,149,7,149,9,149,10,149,13,149,14,149,15,149,18,149,19,149,20,149,21,149,22,149,24,149,27,149,29,149,30,149,31,149,34,149,42,149,43,149,41,149,44,149,49,149,50,149,52,149,54,149,55,149,56,149,60,149,62,149,63,149,66,149,53,149,68,149,69,149,70,149,73,149,76,149,78,149,79,149,82,149,83,149,84,149,86,149,87,149,88,149,89,149,91,149,94,149,95,149,93,149,97,149,98,149,100,149,101,149,102,149,103,149,104,149,105,149,106,149,107,149,108,149,111,149,113,149,114,149,115,149,58,149,231,119,236,119,201,150,213,121,237,121,227,121,235,121,6,122,71,93,3,122,2,122,30,122,20,122,8,153,9,153,10,153,11,153,12,153,14,153,15,153,17,153,18,153,19,153,20,153,21,153,22,153,23,153,24,153,25,153,26,153,27,153,28,153,29,153,30,153,31,153,32,153,33,153,34,153,35,153,36,153,37,153,38,153,39,153,40,153,41,153,42,153,43,153,44,153,45,153,47,153,48,153,49,153,50,153,51,153,52,153,53,153,54,153,55,153,56,153,57,153,58,153,59,153,60,153,61,153,62,153,63,153,64,153,65,153,66,153,67,153,68,153,69,153,70,153,71,153,72,153,73,153,74,153,75,153,76,153,77,153,78,153,79,153,80,153,81,153,82,153,83,153,86,153,87,153,88,153,89,153,90,153,91,153,92,153,93,153,94,153,95,153,96,153,97,153,98,153,100,153,102,153,115,153,120,153,121,153,123,153,126,153,130,153,131,153,137,153,57,122,55,122,81,122,207,158,165,153,112,122,136,118,142,118,147,118,153,118,164,118,222,116,224,116,44,117,32,158,34,158,40,158,41,158,42,158,43,158,44,158,50,158,49,158,54,158,56,158,55,158,57,158,58,158,62,158,65,158,66,158,68,158,70,158,71,158,72,158,73,158,75,158,76,158,78,158,81,158,85,158,87,158,90,158,91,158,92,158,94,158,99,158,102,158,103,158,104,158,105,158,106,158,107,158,108,158,113,158,109,158,115,158,146,117,148,117,150,117,160,117,157,117,172,117,163,117,179,117,180,117,184,117,196,117,177,117,176,117,195,117,194,117,214,117,205,117,227,117,232,117,230,117,228,117,235,117,231,117,3,118,241,117,252,117,255,117,16,118,0,118,5,118,12,118,23,118,10,118,37,118,24,118,21,118,25,118,140,153,142,153,154,153,155,153,156,153,157,153,158,153,159,153,160,153,161,153,162,153,163,153,164,153,166,153,167,153,169,153,170,153,171,153,172,153,173,153,174,153,175,153,176,153,177,153,178,153,179,153,180,153,181,153,182,153,183,153,184,153,185,153,186,153,187,153,188,153,189,153,190,153,191,153,192,153,193,153,194,153,195,153,196,153,197,153,198,153,199,153,200,153,201,153,202,153,203,153,204,153,205,153,206,153,207,153,208,153,209,153,210,153,211,153,212,153,213,153,214,153,215,153,216,153,217,153,218,153,219,153,220,153,221,153,222,153,223,153,224,153,225,153,226,153,227,153,228,153,229,153,230,153,231,153,232,153,233,153,234,153,235,153,236,153,237,153,238,153,239,153,240,153,241,153,242,153,243,153,244,153,245,153,246,153,247,153,248,153,249,153,27,118,60,118,34,118,32,118,64,118,45,118,48,118,63,118,53,118,67,118,62,118,51,118,77,118,94,118,84,118,92,118,86,118,107,118,111,118,202,127,230,122,120,122,121,122,128,122,134,122,136,122,149,122,166,122,160,122,172,122,168,122,173,122,179,122,100,136,105,136,114,136,125,136,127,136,130,136,162,136,198,136,183,136,188,136,201,136,226,136,206,136,227,136,229,136,241,136,26,137,252,136,232,136,254,136,240,136,33,137,25,137,19,137,27,137,10,137,52,137,43,137,54,137,65,137,102,137,123,137,139,117,229,128,178,118,180,118,220,119,18,128,20,128,22,128,28,128,32,128,34,128,37,128,38,128,39,128,41,128,40,128,49,128,11,128,53,128,67,128,70,128,77,128,82,128,105,128,113,128,131,137,120,152,128,152,131,152,250,153,251,153,252,153,253,153,254,153,255,153,0,154,1,154,2,154,3,154,4,154,5,154,6,154,7,154,8,154,9,154,10,154,11,154,12,154,13,154,14,154,15,154,16,154,17,154,18,154,19,154,20,154,21,154,22,154,23,154,24,154,25,154,26,154,27,154,28,154,29,154,30,154,31,154,32,154,33,154,34,154,35,154,36,154,37,154,38,154,39,154,40,154,41,154,42,154,43,154,44,154,45,154,46,154,47,154,48,154,49,154,50,154,51,154,52,154,53,154,54,154,55,154,56,154,57,154,58,154,59,154,60,154,61,154,62,154,63,154,64,154,65,154,66,154,67,154,68,154,69,154,70,154,71,154,72,154,73,154,74,154,75,154,76,154,77,154,78,154,79,154,80,154,81,154,82,154,83,154,84,154,85,154,86,154,87,154,88,154,89,154,137,152,140,152,141,152,143,152,148,152,154,152,155,152,158,152,159,152,161,152,162,152,165,152,166,152,77,134,84,134,108,134,110,134,127,134,122,134,124,134,123,134,168,134,141,134,139,134,172,134,157,134,167,134,163,134,170,134,147,134,169,134,182,134,196,134,181,134,206,134,176,134,186,134,177,134,175,134,201,134,207,134,180,134,233,134,241,134,242,134,237,134,243,134,208,134,19,135,222,134,244,134,223,134,216,134,209,134,3,135,7,135,248,134,8,135,10,135,13,135,9,135,35,135,59,135,30,135,37,135,46,135,26,135,62,135,72,135,52,135,49,135,41,135,55,135,63,135,130,135,34,135,125,135,126,135,123,135,96,135,112,135,76,135,110,135,139,135,83,135,99,135,124,135,100,135,89,135,101,135,147,135,175,135,168,135,210,135,90,154,91,154,92,154,93,154,94,154,95,154,96,154,97,154,98,154,99,154,100,154,101,154,102,154,103,154,104,154,105,154,106,154,107,154,114,154,131,154,137,154,141,154,142,154,148,154,149,154,153,154,166,154,169,154,170,154,171,154,172,154,173,154,174,154,175,154,178,154,179,154,180,154,181,154,185,154,187,154,189,154,190,154,191,154,195,154,196,154,198,154,199,154,200,154,201,154,202,154,205,154,206,154,207,154,208,154,210,154,212,154,213,154,214,154,215,154,217,154,218,154,219,154,220,154,221,154,222,154,224,154,226,154,227,154,228,154,229,154,231,154,232,154,233,154,234,154,236,154,238,154,240,154,241,154,242,154,243,154,244,154,245,154,246,154,247,154,248,154,250,154,252,154,253,154,254,154,255,154,0,155,1,155,2,155,4,155,5,155,6,155,198,135,136,135,133,135,173,135,151,135,131,135,171,135,229,135,172,135,181,135,179,135,203,135,211,135,189,135,209,135,192,135,202,135,219,135,234,135,224,135,238,135,22,136,19,136,254,135,10,136,27,136,33,136,57,136,60,136,54,127,66,127,68,127,69,127,16,130,250,122,253,122,8,123,3,123,4,123,21,123,10,123,43,123,15,123,71,123,56,123,42,123,25,123,46,123,49,123,32,123,37,123,36,123,51,123,62,123,30,123,88,123,90,123,69,123,117,123,76,123,93,123,96,123,110,123,123,123,98,123,114,123,113,123,144,123,166,123,167,123,184,123,172,123,157,123,168,123,133,123,170,123,156,123,162,123,171,123,180,123,209,123,193,123,204,123,221,123,218,123,229,123,230,123,234,123,12,124,254,123,252,123,15,124,22,124,11,124,7,155,9,155,10,155,11,155,12,155,13,155,14,155,16,155,17,155,18,155,20,155,21,155,22,155,23,155,24,155,25,155,26,155,27,155,28,155,29,155,30,155,32,155,33,155,34,155,36,155,37,155,38,155,39,155,40,155,41,155,42,155,43,155,44,155,45,155,46,155,48,155,49,155,51,155,52,155,53,155,54,155,55,155,56,155,57,155,58,155,61,155,62,155,63,155,64,155,70,155,74,155,75,155,76,155,78,155,80,155,82,155,83,155,85,155,86,155,87,155,88,155,89,155,90,155,91,155,92,155,93,155,94,155,95,155,96,155,97,155,98,155,99,155,100,155,101,155,102,155,103,155,104,155,105,155,106,155,107,155,108,155,109,155,110,155,111,155,112,155,113,155,114,155,115,155,116,155,117,155,118,155,119,155,120,155,121,155,122,155,123,155,31,124,42,124,38,124,56,124,65,124,64,124,254,129,1,130,2,130,4,130,236,129,68,136,33,130,34,130,35,130,45,130,47,130,40,130,43,130,56,130,59,130,51,130,52,130,62,130,68,130,73,130,75,130,79,130,90,130,95,130,104,130,126,136,133,136,136,136,216,136,223,136,94,137,157,127,159,127,167,127,175,127,176,127,178,127,124,124,73,101,145,124,157,124,156,124,158,124,162,124,178,124,188,124,189,124,193,124,199,124,204,124,205,124,200,124,197,124,215,124,232,124,110,130,168,102,191,127,206,127,213,127,229,127,225,127,230,127,233,127,238,127,243,127,248,124,119,125,166,125,174,125,71,126,155,126,184,158,180,158,115,141,132,141,148,141,145,141,177,141,103,141,109,141,71,140,73,140,74,145,80,145,78,145,79,145,100,145,124,155,125,155,126,155,127,155,128,155,129,155,130,155,131,155,132,155,133,155,134,155,135,155,136,155,137,155,138,155,139,155,140,155,141,155,142,155,143,155,144,155,145,155,146,155,147,155,148,155,149,155,150,155,151,155,152,155,153,155,154,155,155,155,156,155,157,155,158,155,159,155,160,155,161,155,162,155,163,155,164,155,165,155,166,155,167,155,168,155,169,155,170,155,171,155,172,155,173,155,174,155,175,155,176,155,177,155,178,155,179,155,180,155,181,155,182,155,183,155,184,155,185,155,186,155,187,155,188,155,189,155,190,155,191,155,192,155,193,155,194,155,195,155,196,155,197,155,198,155,199,155,200,155,201,155,202,155,203,155,204,155,205,155,206,155,207,155,208,155,209,155,210,155,211,155,212,155,213,155,214,155,215,155,216,155,217,155,218,155,219,155,98,145,97,145,112,145,105,145,111,145,125,145,126,145,114,145,116,145,121,145,140,145,133,145,144,145,141,145,145,145,162,145,163,145,170,145,173,145,174,145,175,145,181,145,180,145,186,145,85,140,126,158,184,141,235,141,5,142,89,142,105,142,181,141,191,141,188,141,186,141,196,141,214,141,215,141,218,141,222,141,206,141,207,141,219,141,198,141,236,141,247,141,248,141,227,141,249,141,251,141,228,141,9,142,253,141,20,142,29,142,31,142,44,142,46,142,35,142,47,142,58,142,64,142,57,142,53,142,61,142,49,142,73,142,65,142,66,142,81,142,82,142,74,142,112,142,118,142,124,142,111,142,116,142,133,142,143,142,148,142,144,142,156,142,158,142,120,140,130,140,138,140,133,140,152,140,148,140,155,101,214,137,222,137,218,137,220,137,220,155,221,155,222,155,223,155,224,155,225,155,226,155,227,155,228,155,229,155,230,155,231,155,232,155,233,155,234,155,235,155,236,155,237,155,238,155,239,155,240,155,241,155,242,155,243,155,244,155,245,155,246,155,247,155,248,155,249,155,250,155,251,155,252,155,253,155,254,155,255,155,0,156,1,156,2,156,3,156,4,156,5,156,6,156,7,156,8,156,9,156,10,156,11,156,12,156,13,156,14,156,15,156,16,156,17,156,18,156,19,156,20,156,21,156,22,156,23,156,24,156,25,156,26,156,27,156,28,156,29,156,30,156,31,156,32,156,33,156,34,156,35,156,36,156,37,156,38,156,39,156,40,156,41,156,42,156,43,156,44,156,45,156,46,156,47,156,48,156,49,156,50,156,51,156,52,156,53,156,54,156,55,156,56,156,57,156,58,156,59,156,229,137,235,137,239,137,62,138,38,139,83,151,233,150,243,150,239,150,6,151,1,151,8,151,15,151,14,151,42,151,45,151,48,151,62,151,128,159,131,159,133,159,134,159,135,159,136,159,137,159,138,159,140,159,254,158,11,159,13,159,185,150,188,150,189,150,206,150,210,150,191,119,224,150,142,146,174,146,200,146,62,147,106,147,202,147,143,147,62,148,107,148,127,156,130,156,133,156,134,156,135,156,136,156,35,122,139,156,142,156,144,156,145,156,146,156,148,156,149,156,154,156,155,156,158,156,159,156,160,156,161,156,162,156,163,156,165,156,166,156,167,156,168,156,169,156,171,156,173,156,174,156,176,156,177,156,178,156,179,156,180,156,181,156,182,156,183,156,186,156,187,156,188,156,189,156,196,156,197,156,198,156,199,156,202,156,203,156,60,156,61,156,62,156,63,156,64,156,65,156,66,156,67,156,68,156,69,156,70,156,71,156,72,156,73,156,74,156,75,156,76,156,77,156,78,156,79,156,80,156,81,156,82,156,83,156,84,156,85,156,86,156,87,156,88,156,89,156,90,156,91,156,92,156,93,156,94,156,95,156,96,156,97,156,98,156,99,156,100,156,101,156,102,156,103,156,104,156,105,156,106,156,107,156,108,156,109,156,110,156,111,156,112,156,113,156,114,156,115,156,116,156,117,156,118,156,119,156,120,156,121,156,122,156,123,156,125,156,126,156,128,156,131,156,132,156,137,156,138,156,140,156,143,156,147,156,150,156,151,156,152,156,153,156,157,156,170,156,172,156,175,156,185,156,190,156,191,156,192,156,193,156,194,156,200,156,201,156,209,156,210,156,218,156,219,156,224,156,225,156,204,156,205,156,206,156,207,156,208,156,211,156,212,156,213,156,215,156,216,156,217,156,220,156,221,156,223,156,226,156,124,151,133,151,145,151,146,151,148,151,175,151,171,151,163,151,178,151,180,151,177,154,176,154,183,154,88,158,182,154,186,154,188,154,193,154,192,154,197,154,194,154,203,154,204,154,209,154,69,155,67,155,71,155,73,155,72,155,77,155,81,155,232,152,13,153,46,153,85,153,84,153,223,154,225,154,230,154,239,154,235,154,251,154,237,154,249,154,8,155,15,155,19,155,31,155,35,155,189,158,190,158,59,126,130,158,135,158,136,158,139,158,146,158,214,147,157,158,159,158,219,158,220,158,221,158,224,158,223,158,226,158,233,158,231,158,229,158,234,158,239,158,34,159,44,159,47,159,57,159,55,159,61,159,62,159,68,159,227,156,228,156,229,156,230,156,231,156,232,156,233,156,234,156,235,156,236,156,237,156,238,156,239,156,240,156,241,156,242,156,243,156,244,156,245,156,246,156,247,156,248,156,249,156,250,156,251,156,252,156,253,156,254,156,255,156,0,157,1,157,2,157,3,157,4,157,5,157,6,157,7,157,8,157,9,157,10,157,11,157,12,157,13,157,14,157,15,157,16,157,17,157,18,157,19,157,20,157,21,157,22,157,23,157,24,157,25,157,26,157,27,157,28,157,29,157,30,157,31,157,32,157,33,157,34,157,35,157,36,157,37,157,38,157,39,157,40,157,41,157,42,157,43,157,44,157,45,157,46,157,47,157,48,157,49,157,50,157,51,157,52,157,53,157,54,157,55,157,56,157,57,157,58,157,59,157,60,157,61,157,62,157,63,157,64,157,65,157,66,157,52,226,53,226,54,226,55,226,56,226,57,226,58,226,59,226,60,226,61,226,62,226,63,226,64,226,65,226,66,226,67,226,68,226,69,226,70,226,71,226,72,226,73,226,74,226,75,226,76,226,77,226,78,226,79,226,80,226,81,226,82,226,83,226,84,226,85,226,86,226,87,226,88,226,89,226,90,226,91,226,92,226,93,226,94,226,95,226,96,226,97,226,98,226,99,226,100,226,101,226,102,226,103,226,104,226,105,226,106,226,107,226,108,226,109,226,110,226,111,226,112,226,113,226,114,226,115,226,116,226,117,226,118,226,119,226,120,226,121,226,122,226,123,226,124,226,125,226,126,226,127,226,128,226,129,226,130,226,131,226,132,226,133,226,134,226,135,226,136,226,137,226,138,226,139,226,140,226,141,226,142,226,143,226,144,226,145,226,67,157,68,157,69,157,70,157,71,157,72,157,73,157,74,157,75,157,76,157,77,157,78,157,79,157,80,157,81,157,82,157,83,157,84,157,85,157,86,157,87,157,88,157,89,157,90,157,91,157,92,157,93,157,94,157,95,157,96,157,97,157,98,157,99,157,100,157,101,157,102,157,103,157,104,157,105,157,106,157,107,157,108,157,109,157,110,157,111,157,112,157,113,157,114,157,115,157,116,157,117,157,118,157,119,157,120,157,121,157,122,157,123,157,124,157,125,157,126,157,127,157,128,157,129,157,130,157,131,157,132,157,133,157,134,157,135,157,136,157,137,157,138,157,139,157,140,157,141,157,142,157,143,157,144,157,145,157,146,157,147,157,148,157,149,157,150,157,151,157,152,157,153,157,154,157,155,157,156,157,157,157,158,157,159,157,160,157,161,157,162,157,146,226,147,226,148,226,149,226,150,226,151,226,152,226,153,226,154,226,155,226,156,226,157,226,158,226,159,226,160,226,161,226,162,226,163,226,164,226,165,226,166,226,167,226,168,226,169,226,170,226,171,226,172,226,173,226,174,226,175,226,176,226,177,226,178,226,179,226,180,226,181,226,182,226,183,226,184,226,185,226,186,226,187,226,188,226,189,226,190,226,191,226,192,226,193,226,194,226,195,226,196,226,197,226,198,226,199,226,200,226,201,226,202,226,203,226,204,226,205,226,206,226,207,226,208,226,209,226,210,226,211,226,212,226,213,226,214,226,215,226,216,226,217,226,218,226,219,226,220,226,221,226,222,226,223,226,224,226,225,226,226,226,227,226,228,226,229,226,230,226,231,226,232,226,233,226,234,226,235,226,236,226,237,226,238,226,239,226,163,157,164,157,165,157,166,157,167,157,168,157,169,157,170,157,171,157,172,157,173,157,174,157,175,157,176,157,177,157,178,157,179,157,180,157,181,157,182,157,183,157,184,157,185,157,186,157,187,157,188,157,189,157,190,157,191,157,192,157,193,157,194,157,195,157,196,157,197,157,198,157,199,157,200,157,201,157,202,157,203,157,204,157,205,157,206,157,207,157,208,157,209,157,210,157,211,157,212,157,213,157,214,157,215,157,216,157,217,157,218,157,219,157,220,157,221,157,222,157,223,157,224,157,225,157,226,157,227,157,228,157,229,157,230,157,231,157,232,157,233,157,234,157,235,157,236,157,237,157,238,157,239,157,240,157,241,157,242,157,243,157,244,157,245,157,246,157,247,157,248,157,249,157,250,157,251,157,252,157,253,157,254,157,255,157,0,158,1,158,2,158,240,226,241,226,242,226,243,226,244,226,245,226,246,226,247,226,248,226,249,226,250,226,251,226,252,226,253,226,254,226,255,226,0,227,1,227,2,227,3,227,4,227,5,227,6,227,7,227,8,227,9,227,10,227,11,227,12,227,13,227,14,227,15,227,16,227,17,227,18,227,19,227,20,227,21,227,22,227,23,227,24,227,25,227,26,227,27,227,28,227,29,227,30,227,31,227,32,227,33,227,34,227,35,227,36,227,37,227,38,227,39,227,40,227,41,227,42,227,43,227,44,227,45,227,46,227,47,227,48,227,49,227,50,227,51,227,52,227,53,227,54,227,55,227,56,227,57,227,58,227,59,227,60,227,61,227,62,227,63,227,64,227,65,227,66,227,67,227,68,227,69,227,70,227,71,227,72,227,73,227,74,227,75,227,76,227,77,227,3,158,4,158,5,158,6,158,7,158,8,158,9,158,10,158,11,158,12,158,13,158,14,158,15,158,16,158,17,158,18,158,19,158,20,158,21,158,22,158,23,158,24,158,25,158,26,158,27,158,28,158,29,158,30,158,36,158,39,158,46,158,48,158,52,158,59,158,60,158,64,158,77,158,80,158,82,158,83,158,84,158,86,158,89,158,93,158,95,158,96,158,97,158,98,158,101,158,110,158,111,158,114,158,116,158,117,158,118,158,119,158,120,158,121,158,122,158,123,158,124,158,125,158,128,158,129,158,131,158,132,158,133,158,134,158,137,158,138,158,140,158,141,158,142,158,143,158,144,158,145,158,148,158,149,158,150,158,151,158,152,158,153,158,154,158,155,158,156,158,158,158,160,158,161,158,162,158,163,158,164,158,165,158,167,158,168,158,169,158,170,158,78,227,79,227,80,227,81,227,82,227,83,227,84,227,85,227,86,227,87,227,88,227,89,227,90,227,91,227,92,227,93,227,94,227,95,227,96,227,97,227,98,227,99,227,100,227,101,227,102,227,103,227,104,227,105,227,106,227,107,227,108,227,109,227,110,227,111,227,112,227,113,227,114,227,115,227,116,227,117,227,118,227,119,227,120,227,121,227,122,227,123,227,124,227,125,227,126,227,127,227,128,227,129,227,130,227,131,227,132,227,133,227,134,227,135,227,136,227,137,227,138,227,139,227,140,227,141,227,142,227,143,227,144,227,145,227,146,227,147,227,148,227,149,227,150,227,151,227,152,227,153,227,154,227,155,227,156,227,157,227,158,227,159,227,160,227,161,227,162,227,163,227,164,227,165,227,166,227,167,227,168,227,169,227,170,227,171,227,171,158,172,158,173,158,174,158,175,158,176,158,177,158,178,158,179,158,181,158,182,158,183,158,185,158,186,158,188,158,191,158,192,158,193,158,194,158,195,158,197,158,198,158,199,158,200,158,202,158,203,158,204,158,208,158,210,158,211,158,213,158,214,158,215,158,217,158,218,158,222,158,225,158,227,158,228,158,230,158,232,158,235,158,236,158,237,158,238,158,240,158,241,158,242,158,243,158,244,158,245,158,246,158,247,158,248,158,250,158,253,158,255,158,0,159,1,159,2,159,3,159,4,159,5,159,6,159,7,159,8,159,9,159,10,159,12,159,15,159,17,159,18,159,20,159,21,159,22,159,24,159,26,159,27,159,28,159,29,159,30,159,31,159,33,159,35,159,36,159,37,159,38,159,39,159,40,159,41,159,42,159,43,159,45,159,46,159,48,159,49,159,172,227,173,227,174,227,175,227,176,227,177,227,178,227,179,227,180,227,181,227,182,227,183,227,184,227,185,227,186,227,187,227,188,227,189,227,190,227,191,227,192,227,193,227,194,227,195,227,196,227,197,227,198,227,199,227,200,227,201,227,202,227,203,227,204,227,205,227,206,227,207,227,208,227,209,227,210,227,211,227,212,227,213,227,214,227,215,227,216,227,217,227,218,227,219,227,220,227,221,227,222,227,223,227,224,227,225,227,226,227,227,227,228,227,229,227,230,227,231,227,232,227,233,227,234,227,235,227,236,227,237,227,238,227,239,227,240,227,241,227,242,227,243,227,244,227,245,227,246,227,247,227,248,227,249,227,250,227,251,227,252,227,253,227,254,227,255,227,0,228,1,228,2,228,3,228,4,228,5,228,6,228,7,228,8,228,9,228,50,159,51,159,52,159,53,159,54,159,56,159,58,159,60,159,63,159,64,159,65,159,66,159,67,159,69,159,70,159,71,159,72,159,73,159,74,159,75,159,76,159,77,159,78,159,79,159,82,159,83,159,84,159,85,159,86,159,87,159,88,159,89,159,90,159,91,159,92,159,93,159,94,159,95,159,96,159,97,159,98,159,99,159,100,159,101,159,102,159,103,159,104,159,105,159,106,159,107,159,108,159,109,159,110,159,111,159,112,159,113,159,114,159,115,159,116,159,117,159,118,159,119,159,120,159,121,159,122,159,123,159,124,159,125,159,126,159,129,159,130,159,141,159,142,159,143,159,144,159,145,159,146,159,147,159,148,159,149,159,150,159,151,159,152,159,156,159,157,159,158,159,161,159,162,159,163,159,164,159,165,159,44,249,121,249,149,249,231,249,241,249,10,228,11,228,12,228,13,228,14,228,15,228,16,228,17,228,18,228,19,228,20,228,21,228,22,228,23,228,24,228,25,228,26,228,27,228,28,228,29,228,30,228,31,228,32,228,33,228,34,228,35,228,36,228,37,228,38,228,39,228,40,228,41,228,42,228,43,228,44,228,45,228,46,228,47,228,48,228,49,228,50,228,51,228,52,228,53,228,54,228,55,228,56,228,57,228,58,228,59,228,60,228,61,228,62,228,63,228,64,228,65,228,66,228,67,228,68,228,69,228,70,228,71,228,72,228,73,228,74,228,75,228,76,228,77,228,78,228,79,228,80,228,81,228,82,228,83,228,84,228,85,228,86,228,87,228,88,228,89,228,90,228,91,228,92,228,93,228,94,228,95,228,96,228,97,228,98,228,99,228,100,228,101,228,102,228,103,228,12,250,13,250,14,250,15,250,17,250,19,250,20,250,24,250,31,250,32,250,33,250,35,250,36,250,39,250,40,250,41,250,129,46,22,232,23,232,24,232,132,46,115,52,71,52,136,46,139,46,30,232,158,53,26,54,14,54,140,46,151,46,110,57,24,57,38,232,207,57,223,57,115,58,208,57,43,232,44,232,78,59,110,60,224,60,167,46,49,232,50,232,170,46,86,64,95,65,174,46,55,67,179,46,182,46,183,46,59,232,177,67,172,67,187,46,221,67,214,68,97,70,76,70,67,232,35,71,41,71,124,71,141,71,202,46,71,73,122,73,125,73,130,73,131,73,133,73,134,73,159,73,155,73,183,73,182,73,84,232,85,232,163,76,159,76,160,76,161,76,119,76,162,76,19,77,20,77,21,77,22,77,23,77,24,77,25,77,174,77,100,232,104,228,105,228,106,228,107,228,108,228,109,228,110,228,111,228,112,228,113,228,114,228,115,228,116,228,117,228,118,228,119,228,120,228,121,228,122,228,123,228,124,228,125,228,126,228,127,228,128,228,129,228,130,228,131,228,132,228,133,228,134,228,135,228,136,228,137,228,138,228,139,228,140,228,141,228,142,228,143,228,144,228,145,228,146,228,147,228,148,228,149,228,150,228,151,228,152,228,153,228,154,228,155,228,156,228,157,228,158,228,159,228,160,228,161,228,162,228,163,228,164,228,165,228,166,228,167,228,168,228,169,228,170,228,171,228,172,228,173,228,174,228,175,228,176,228,177,228,178,228,179,228,180,228,181,228,182,228,183,228,184,228,185,228,186,228,187,228,188,228,189,228,190,228,191,228,192,228,193,228,194,228,195,228,196,228,197,228,240,67,50,76,3,70,166,69,120,69,103,114,119,77,179,69,177,124,226,76,197,124,149,59,54,71,68,71,71,76,64,76,191,66,23,54,82,115,139,110,210,112,87,76,81,163,79,71,218,69,133,76,108,124,7,77,164,74,161,70,35,107,37,114,84,90,99,26,6,62,97,63,77,102,251,86,0,0,149,125,29,89,185,139,244,61,52,151,239,123,219,91,94,29,164,90,37,54,176,158,209,90,183,91,252,92,110,103,147,133,69,153,97,116,157,116,117,56,83,29,158,54,33,96,236,62,222,88,245,58,252,122,151,159,97,65,13,137,234,49,138,10,94,50,10,67,132,132,150,159,47,148,48,73,19,134,150,88,74,151,24,146,208,121,50,122,96,102,41,106,157,136,76,116,197,123,130,103,44,122,79,82,70,144,230,52,196,115,185,93,198,116,199,159,179,87,47,73,76,84,49,65,142,54,24,88,114,122,101,123,143,139,174,70,136,110,129,65,153,93,174,123,188,36,200,159,193,36,201,36,204,36,201,159,4,133,187,53,180,64,202,159,225,68,255,173,193,98,110,112,203,159,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,49,193,49,194,49,195,49,196,49,12,1,197,49,209,0,205,0,198,49,199,49,203,0,232,31,200,49,202,0,201,49,202,49,203,49,204,49,14,1,205,49,206,49,0,1,193,0,205,1,192,0,18,1,201,0,26,1,200,0,76,1,211,0,209,1,210,0,0,220,190,30,4,220,192,30,202,0,1,1,225,0,206,1,224,0,81,2,19,1,233,0,27,1,232,0,43,1,237,0,208,1,236,0,77,1,243,0,210,1,242,0,107,1,250,0,212,1,249,0,214,1,216,1,218,1,220,1,252,0,8,220,191,30,12,220,193,30,234,0,97,2,218,35,219,35], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+58052);
/* memory initializer */ allocate([169,163,69,17,0,0,10,101,0,0,0,0,61,78,221,110,78,157,223,145,0,0,0,0,53,119,145,100,26,79,40,79,168,79,86,81,116,81,156,81,228,81,161,82,168,82,59,83,78,83,209,83,216,83,226,86,240,88,4,89,7,89,50,89,52,89,102,91,158,91,159,91,154,92,134,94,59,96,137,101,254,103,4,104,101,104,78,109,188,112,53,117,164,126,172,126,186,126,199,126,207,126,223,126,6,127,55,127,122,130,207,130,111,131,198,137,190,139,226,139,102,143,103,143,110,143,17,116,252,124,205,125,70,105,201,122,39,82,0,0,0,0,0,0,0,0,140,145,184,120,94,145,188,128,0,0,11,141,246,128,231,9,0,0,0,0,159,128,199,158,205,76,201,157,12,158,62,76,246,157,14,112,10,158,51,161,193,53,0,0,154,110,62,130,25,117,0,0,17,73,108,154,143,154,153,159,135,121,108,132,202,29,208,5,230,42,36,78,129,78,128,78,135,78,191,78,235,78,55,79,76,52,189,79,72,62,3,80,136,80,125,52,147,52,165,52,134,81,5,89,219,81,252,81,5,82,137,78,121,82,144,82,39,83,199,53,169,83,81,53,176,83,83,53,194,83,35,84,109,53,114,53,129,54,147,84,163,84,180,84,185,84,208,84,239,84,24,85,35,85,40,85,152,53,63,85,165,53,191,53,215,85,197,53,132,125,37,85,0,0,66,12,21,13,43,81,144,85,198,44,236,57,65,3,70,142,184,77,229,148,83,64,190,128,122,119,56,44,52,58,213,71,93,129,242,105,234,77,221,100,124,13,180,15,213,12,244,16,141,100,126,142,150,14,11,12,100,15,169,44,86,130,211,68,0,0,70,13,77,154,233,128,244,71,167,78,194,44,178,154,103,58,244,149,237,63,6,53,199,82,212,151,200,120,68,45,110,157,21,152,0,0,217,67,165,96,180,100,227,84,76,45,202,43,119,16,251,57,111,16,218,102,22,103,160,121,234,100,82,80,67,12,104,142,161,33,76,139,49,7,0,0,11,72,169,1,250,63,115,88,141,45,0,0,200,69,252,4,151,96,76,15,150,13,121,85,187,64,186,67,0,0,180,74,102,42,157,16,170,129,245,152,156,13,121,99,254,57,117,39,192,141,161,86,124,100,67,62,0,0,1,166,9,14,207,42,201,44,0,0,200,16,194,57,146,57,6,58,155,130,120,53,73,94,199,32,82,86,49,15,178,44,32,151,188,52,61,108,59,78,0,0,0,0,116,117,139,46,8,34,91,166,205,140,122,14,52,12,28,104,147,127,207,16,3,40,57,41,251,53,227,81,140,14,141,15,170,14,147,63,48,15,71,13,79,17,76,14,0,0,171,14,169,11,72,13,192,16,61,17,249,63,150,38,50,100,173,15,244,51,57,118,206,43,126,13,127,13,81,44,85,44,24,58,152,14,199,16,46,15,50,166,80,107,210,140,153,141,202,140,170,149,204,84,196,130,185,85,0,0,195,158,38,156,182,154,94,119,238,45,64,113,109,129,236,128,28,92,114,101,52,129,151,55,95,83,189,128,182,145,250,14,15,14,119,14,251,14,221,53,235,77,9,54,214,12,175,86,181,39,201,16,16,14,120,14,120,16,72,17,7,130,85,20,121,14,80,78,164,45,84,90,29,16,30,16,245,16,246,16,156,87,17,14,148,118,205,130,181,15,123,14,126,81,3,55,182,15,128,17,216,82,189,162,218,73,58,24,119,65,124,130,153,88,104,82,26,54,61,87,178,123,104,91,0,72,44,75,39,159,231,73,31,156,141,155,116,91,61,49,251,85,242,53,137,86,40,78,2,89,193,27,120,248,81,151,134,0,91,78,187,78,62,53,35,92,81,95,196,95,250,56,76,98,53,101,122,107,53,108,58,108,108,112,43,114,44,78,173,114,233,72,82,127,59,121,249,124,83,127,106,98,193,52,0,0,75,99,2,128,128,128,18,102,81,105,93,83,100,136,193,137,178,120,160,139,29,141,133,148,120,149,127,149,232,149,15,142,230,151,117,152,206,152,222,152,99,153,16,152,124,156,31,158,196,158,111,107,7,249,55,78,135,0,29,150,55,98,162,148,0,0,59,80,254,109,115,156,166,159,201,61,143,136,78,65,119,112,245,92,32,75,205,81,89,53,48,93,34,97,50,138,167,143,246,145,145,113,25,103,186,115,129,50,7,161,139,60,128,25,16,75,228,120,2,116,174,81,15,135,9,64,99,106,186,162,35,66,15,134,111,10,42,122,71,153,234,138,85,151,77,112,36,83,126,32,244,147,217,118,227,137,167,159,221,119,163,78,240,79,188,80,47,78,23,79,168,159,52,84,139,125,146,88,208,88,182,29,146,94,153,94,194,95,18,39,139,101,249,51,25,105,67,106,99,60,255,108,0,0,0,114,5,69,140,115,219,62,19,74,21,91,185,116,131,139,164,92,149,86,147,122,236,123,195,124,108,126,248,130,151,133,169,159,144,136,170,159,185,142,171,159,207,143,95,133,224,153,33,146,172,159,185,141,63,20,113,64,162,66,26,90,0,0,0,0,0,0,104,152,107,103,118,66,61,87,0,0,214,133,123,73,191,130,13,113,129,76,116,109,123,93,21,107,190,111,173,159,174,159,150,91,175,159,231,102,91,126,87,110,202,121,136,61,195,68,86,50,150,39,154,67,54,69,0,0,213,92,26,59,249,138,120,92,18,61,81,53,120,93,178,159,87,113,88,69,236,64,35,30,119,76,120,57,74,52,164,1,65,108,204,138,180,79,57,2,191,89,108,129,86,152,250,152,59,95,159,11,0,0,193,33,109,137,2,65,187,70,121,144,7,63,179,159,181,161,248,64,214,55,247,70,70,108,124,65,178,134,255,115,109,69,212,56,154,84,97,69,27,69,137,77,123,76,118,77,234,69,200,63,15,75,97,54,222,68,189,68,237,65,62,93,72,93,86,93,252,61,15,56,164,93,185,93,32,56,56,56,66,94,189,94,37,95,131,95,8,57,20,57,63,57,77,57,215,96,61,97,229,92,137,57,183,97,185,97,207,97,184,57,44,98,144,98,229,98,24,99,248,57,177,86,3,58,226,99,251,99,7,100,90,100,75,58,192,100,21,93,33,86,159,159,151,58,134,101,189,58,255,101,83,102,242,58,146,102,34,59,22,103,66,59,164,103,0,104,88,59,74,104,132,104,114,59,113,59,123,59,9,105,67,105,92,114,100,105,159,105,133,105,188,59,214,105,221,59,101,106,116,106,113,106,130,106,236,59,153,106,242,59,171,106,181,106,212,106,246,106,129,107,193,107,234,107,117,108,170,108,203,60,2,109,6,109,38,109,129,109,239,60,164,109,177,109,21,110,24,110,41,110,134,110,192,137,187,110,226,110,218,110,127,159,232,110,233,110,36,111,52,111,70,61,65,63,129,111,190,111,106,61,117,61,183,113,153,92,138,61,44,112,145,61,80,112,84,112,111,112,127,112,137,112,37,3,193,67,241,53,216,14,215,62,190,87,211,110,62,113,224,87,78,54,162,105,233,139,116,91,73,122,225,88,217,148,101,122,125,122,172,89,187,122,176,122,194,122,195,122,209,113,141,100,202,65,218,122,221,122,234,122,239,65,178,84,1,92,11,123,85,123,41,123,14,83,254,92,162,123,111,123,156,131,180,91,127,108,208,123,33,132,146,123,0,0,32,93,173,61,101,92,146,132,250,123,0,0,53,124,193,92,68,124,131,124,130,72,166,124,125,102,120,69,201,124,199,124,230,124,116,124,243,124,245,124,0,0,103,126,29,69,68,110,93,125,214,110,141,116,137,125,171,125,53,113,179,125,0,0,87,64,41,96,228,125,19,61,245,125,249,23,229,125,109,131,0,0,33,97,90,97,110,126,146,126,43,67,108,148,39,126,64,127,65,127,71,127,54,121,208,98,225,153,151,127,81,99,163,127,97,22,104,0,92,69,102,55,3,69,58,131,250,127,137,100,0,0,8,128,29,128,0,0,47,128,135,160,195,108,59,128,60,128,97,128,20,39,137,73,38,102,227,61,232,102,37,103,167,128,72,138,7,129,26,129,176,88,246,38,127,108,152,100,184,79,231,100,138,20,24,130,94,24,83,106,101,74,149,74,122,68,41,130,13,11,82,106,126,61,249,79,253,20,226,132,98,131,10,107,167,73,48,53,115,23,248,61,170,130,27,105,148,249,219,65,75,133,208,130,26,131,22,14,180,23,193,54,125,49,90,53,123,130,226,130,24,131,139,62,163,109,5,107,151,107,206,53,191,61,29,131,236,85,133,131,11,69,165,109,172,131,0,0,211,131,126,52,212,110,87,106,90,133,150,52,66,110,239,46,88,132,228,91,113,132,211,61,228,68,167,106,74,132,181,60,88,121,0,0,150,107,119,110,67,110,222,132,0,0,145,131,160,68,147,132,228,132,145,92,64,66,192,92,67,69,52,133,242,90,153,110,39,69,115,133,22,69,191,103,22,134,37,134,59,134,193,133,136,112,2,134,130,21,205,112,178,249,106,69,40,134,72,54,162,24,247,83,154,115,126,134,113,135,248,160,238,135,39,44,177,135,218,135,15,136,97,86,108,134,86,104,15,70,69,136,70,136,224,117,185,61,228,117,94,136,156,136,91,70,180,136,181,136,193,99,197,136,119,119,15,119,135,137,138,137,0,0,0,0,167,137,188,137,37,138,231,137,36,121,189,122,156,138,147,119,254,145,144,138,89,122,233,122,58,123,143,63,19,71,56,123,124,113,12,139,31,139,48,84,101,85,63,139,76,139,77,139,169,138,122,74,144,139,155,139,175,138,223,22,21,70,79,136,155,140,84,125,143,125,212,249,37,55,83,125,214,140,152,125,189,125,18,141,3,141,16,25,219,140,92,112,17,141,201,76,208,62,0,0,169,141,2,128,20,16,138,73,124,59,188,129,12,113,231,122,173,142,182,142,195,142,212,146,25,143,45,143,101,131,18,132,165,143,3,147,159,162,80,10,179,143,42,73,222,137,61,133,187,61,248,94,98,50,249,143,20,160,188,134,1,133,37,35,128,57,215,110,55,144,60,133,190,122,97,144,108,133,11,134,168,144,19,135,196,144,230,134,174,144,0,0,103,145,240,58,169,145,196,145,172,124,51,137,137,30,14,146,159,108,65,146,98,146,185,85,0,0,198,138,155,60,12,139,219,85,49,13,44,147,107,147,225,138,235,139,143,112,195,90,226,138,229,138,101,73,68,146,236,139,57,140,255,139,115,147,91,148,188,142,133,149,166,149,38,148,160,149,246,111,185,66,122,38,216,134,124,18,46,62,223,73,28,108,123,150,150,150,108,65,163,150,213,110,218,97,182,150,245,120,224,138,189,150,204,83,161,73,184,108,116,2,16,100,175,144,229,144,209,74,21,25,10,51,49,151,66,134,54,151,15,74,61,69,133,69,233,74,117,112,65,91,27,151,0,0,213,145,87,151,74,91,235,145,95,151,37,148,208,80,183,48,188,48,137,151,159,151,177,151,190,151,192,151,210,151,224,151,108,84,238,151,28,116,51,148,0,0,245,151,29,148,122,121,209,74,52,152,51,152,75,152,102,152,14,59,117,113,81,61,48,6,92,65,6,87,202,152,183,152,200,152,199,152,255,74,39,109,211,22,176,85,225,152,230,152,236,152,120,147,57,153,41,74,114,75,87,152,5,153,245,153,12,154,59,154,16,154,88,154,37,87,196,54,177,144,213,155,224,154,226,154,5,155,244,154,14,76,20,155,45,155,0,134,52,80,52,155,168,105,195,56,125,48,80,155,64,155,62,157,69,90,99,24,142,155,75,66,2,156,255,155,12,156,104,158,212,157,183,159,146,161,171,161,225,160,35,161,223,161,126,157,131,157,52,161,14,158,136,104,196,157,91,33,147,161,32,162,59,25,51,162,57,157,185,160,180,162,144,158,149,158,158,158,162,158,52,77,170,158,175,158,100,67,193,158,96,59,229,57,29,61,50,79,190,55,43,140,2,159,8,159,150,75,36,148,162,109,23,159,0,0,57,159,159,86,138,86,69,159,184,153,139,144,242,151,127,132,98,159,105,159,220,122,142,159,22,114,190,75,117,73,187,73,119,113,248,73,72,67,81,74,158,115,218,139,250,24,159,121,126,137,54,142,105,147,243,147,68,138,236,146,129,147,203,147,108,137,185,68,23,114,235,62,114,119,67,122,208,112,115,68,248,67,126,113,239,23,163,112,190,24,153,53,199,62,133,24,47,84,248,23,34,55,251,22,57,24,225,54,116,23,209,24,75,95,35,55,192,22,91,87,37,74,254,19,168,18,198,19,182,20,3,133,166,54,0,0,85,132,148,73,101,113,49,62,92,85,251,62,82,112,244,68,238,54,157,153,38,111,249,103,51,55,21,60,231,61,108,88,34,25,16,104,87,64,63,55,225,64,139,64,15,65,33,108,203,84,158,86,177,102,146,86,223,15,168,11,13,14,198,147,19,139,156,147,248,78,43,81,25,56,54,68,188,78,101,4,127,3,75,79,138,79,81,86,104,90,171,1,203,3,153,57,10,3,20,4,53,52,41,79,192,2,179,142,117,2,218,138,12,2,152,78,205,80,13,81,162,79,3,79,14,74,138,62,66,79,46,80,108,80,129,80,204,79,229,79,88,80,252,80,0,0,0,0,0,0,0,0,118,110,149,53,57,62,191,62,114,109,132,24,137,62,168,81,195,81,224,5,221,68,163,4,146,4,145,4,122,141,156,138,14,7,89,82,164,82,115,8,225,82,0,0,122,70,140,113,140,67,32,12,172,73,228,16,209,105,29,14,0,0,222,62,153,116,20,116,86,116,152,115,142,75,188,74,141,64,208,83,132,53,15,114,201,64,180,85,69,3,205,84,198,11,29,87,93,146,244,150,102,147,221,87,141,87,127,87,62,54,203,88,153,90,70,138,250,22,111,23,16,23,44,90,184,89,143,146,126,90,207,90,18,90,70,89,243,25,97,24,149,66,245,54,5,109,67,116,33,90,131,94,129,90,215,139,19,4,224,147,140,116,3,19,5,113,114,73,8,148,251,137,189,147,160,55,30,92,158,92,94,94,72,94,150,25,124,25,238,58,205,94,79,91,3,25,4,25,1,55,160,24,221,54,254,22,211,54,42,129,71,138,186,29,114,52,168,137,12,95,14,95,39,25,171,23,107,90,59,23,68,91,20,134,253,117,96,136,126,96,96,40,43,38,219,95,184,62,175,37,190,37,136,144,115,111,192,97,62,0,70,0,27,38,153,97,152,97,117,96,155,44,7,45,212,70,77,145,113,100,101,70,106,43,41,58,34,43,80,52,234,152,120,46,55,99,91,164,182,100,49,99,209,99,227,73,103,45,164,98,161,44,59,100,107,101,114,105,244,59,142,48,173,50,137,73,171,50,13,85,224,50,217,24,63,148,206,102,137,50,179,49,224,58,144,65,132,85,34,139,143,85,252,22,91,85,37,84,238,120,3,49,42,24,52,50,100,52,15,50,130,49,201,66,142,102,36,109,107,102,147,75,48,102,112,120,235,29,99,102,210,50,225,50,30,102,114,88,209,56,58,56,188,55,153,59,162,55,254,51,208,116,150,59,143,103,42,70,182,104,30,104,196,59,190,106,99,56,213,55,135,68,51,106,82,106,201,106,5,107,18,25,17,101,152,104,76,106,215,59,122,106,87,107,192,63,154,60,160,147,242,146,234,139,203,138,137,146,30,128,220,137,103,148,165,109,11,111,236,73,0,0,127,63,143,61,4,110,60,64,61,90,10,110,71,88,36,109,66,120,59,113,26,67,118,66,241,112,80,114,135,114,148,114,143,71,37,71,121,81,164,74,235,5,122,116,248,62,95,54,74,74,23,73,225,95,6,63,177,62,223,74,35,140,53,63,167,96,243,62,204,116,60,116,135,147,55,116,159,68,234,109,81,69,131,117,99,63,217,76,6,77,88,63,85,117,115,118,198,165,25,59,104,116,204,138,171,73,142,73,251,58,205,61,78,74,255,62,197,73,243,72,250,145,50,87,66,147,227,138,100,24,223,80,33,82,231,81,120,119,50,50,14,119,15,119,123,119,151,70,129,55,94,58,240,72,56,116,155,116,191,62,186,74,199,74,200,64,150,74,174,97,7,147,129,85,30,120,141,120,136,120,210,120,208,115,89,121,65,119,227,86,14,65,0,0,150,132,165,121,45,106,250,62,58,122,244,121,110,65,230,22,50,65,53,146,241,121,76,13,140,73,153,2,186,61,110,23,151,53,107,85,112,53,170,54,212,1,13,12,226,122,89,90,245,38,175,90,156,90,13,90,91,2,240,120,42,90,198,91,254,122,249,65,93,124,109,124,17,66,179,91,188,94,166,94,205,124,249,73,176,23,142,124,124,124,174,124,178,106,220,125,7,126,211,125,78,127,97,98,92,97,72,123,151,125,130,94,106,66,117,107,22,9,214,103,78,0,207,53,196,87,18,100,248,99,98,73,221,127,39,123,44,8,233,90,67,93,12,123,14,94,230,153,69,134,99,154,28,106,63,52,226,57,247,73,173,101,31,154,160,101,128,132,39,113,209,108,234,68,55,129,2,68,198,128,9,129,66,129,180,103,195,152,66,106,98,130,101,130,81,106,83,132,167,109,16,134,27,114,134,90,127,65,64,24,43,91,161,24,228,90,216,24,160,134,188,249,143,61,45,136,34,116,2,90,110,136,69,79,135,136,191,136,230,136,101,137,77,137,131,86,84,137,133,119,132,119,245,139,217,139,156,139,249,137,173,62,163,132,245,70,207,70,242,55,61,138,28,138,72,148,77,95,43,146,132,66,212,101,41,113,196,112,69,24,109,157,159,140,233,140,220,125,154,89,195,119,240,89,110,67,212,54,42,142,167,142,9,76,48,143,74,143,244,66,88,108,187,111,33,35,155,72,121,111,139,110,218,23,233,155,181,54,47,73,187,144,0,0,113,85,6,73,187,145,4,148,75,138,98,64,252,138,39,148,29,140,59,140,229,132,43,138,153,149,167,149,151,149,150,149,52,141,69,116,194,62,255,72,66,74,234,67,231,62,37,50,143,150,231,142,102,142,101,142,204,62,237,73,120,74,238,63,18,116,107,116,252,62,65,151,176,144,71,104,29,74,147,144,223,87,0,0,104,147,137,137,38,140,47,139,190,99,186,146,17,91,105,139,60,73,249,115,27,66,155,151,113,151,56,153,38,15,193,93,197,139,178,74,31,152,218,148,246,146,215,149,229,145,192,68,80,139,103,74,100,139,220,152,69,138,0,63,42,146,37,73,20,132,59,153,77,153,6,123,253,61,155,153,111,75,170,153,92,154,101,139,200,88,143,106,33,154,254,90,47,154,241,152,144,75,72,153,188,153,189,75,151,75,125,147,114,88,2,19,34,88,184,73,232,20,68,120,31,39,184,61,197,104,125,61,88,148,39,57,80,97,129,39,107,41,7,97,79,156,83,156,123,156,53,156,16,156,127,155,207,155,45,158,159,155,245,161,254,160,33,157,174,76,4,65,24,158,176,76,12,157,180,161,237,160,243,160,47,153,165,157,189,132,18,110,223,111,130,107,252,133,51,69,164,109,132,110,240,109,32,132,238,133,0,110,215,55,100,96,226,121,156,53,64,54,45,73,222,73,98,61,219,147,190,146,72,147,191,2,185,120,119,146,77,148,228,79,64,52,100,144,93,85,61,120,84,120,182,120,75,120,87,23,201,49,65,73,154,54,114,79,218,111,217,111,0,0,30,112,20,84,181,65,187,87,243,88,138,87,22,157,215,87,52,113,175,52,172,65,235,113,64,108,151,79,0,0,181,23,73,138,12,97,206,90,11,90,188,66,136,68,44,55,123,75,252,137,187,147,184,147,214,24,29,15,114,132,192,108,19,20,250,66,38,44,193,67,148,89,183,61,65,103,168,125,91,97,164,96,185,73,139,73,250,137,229,146,226,115,233,62,180,116,99,139,159,24,225,62,179,74,216,106,243,115,251,115,214,62,62,74,148,74,217,23,102,74,167,3,36,20,229,73,72,116,22,73,165,112,118,73,132,146,230,115,95,147,254,4,49,147,206,138,22,138,134,147,231,139,213,85,53,73,130,138,107,113,67,73,255,12,164,86,26,6,235,11,184,12,2,85,196,121,250,23,254,125,194,22,80,74,82,24,46,69,1,148,10,55,192,138,173,73,176,89,191,24,131,24,132,116,161,90,226,54,91,61,176,54,95,146,121,90,129,138,98,24,116,147,205,60,180,10,150,74,138,57,244,80,105,61,76,61,156,19,117,113,251,66,24,130,15,110,228,144,235,68,87,109,79,126,103,112,175,108,214,60,237,63,45,62,2,110,12,111,111,61,245,3,81,117,188,54,200,52,128,70,218,62,113,72,196,89,110,146,62,73,65,143,28,140,192,107,18,88,200,87,214,54,82,20,254,112,98,67,113,74,227,47,176,18,189,35,185,104,103,105,152,19,229,52,244,123,223,54,131,138,214,55,250,51,159,76,26,106,173,54,183,108,62,132,223,68,206,68,38,109,81,109,130,108,222,111,23,111,9,113,61,131,58,23,237,131,128,108,83,112,219,23,137,89,130,90,179,23,97,90,113,90,5,25,252,65,45,55,239,89,60,23,199,54,142,113,144,147,154,102,165,66,110,90,43,90,147,66,43,106,249,62,54,119,91,68,202,66,29,113,89,66,225,137,176,79,40,109,194,92,206,68,77,126,189,67,12,106,86,66,4,19,166,112,51,113,233,67,165,61,223,108,37,248,79,74,101,126,235,89,47,93,243,61,92,95,93,74,223,23,164,125,38,132,133,84,250,58,0,51,20,2,126,87,213,8,25,6,229,63,158,31,182,162,3,112,91,145,112,93,143,115,211,124,89,138,32,148,200,79,231,127,205,114,16,115,244,122,56,115,57,115,246,86,65,115,72,115,169,62,24,123,108,144,245,113,242,72,225,115,246,129,202,62,12,119,209,62,162,108,253,86,25,116,30,116,31,116,226,62,240,62,244,62,250,62,211,116,14,63,83,63,66,117,109,117,114,117,141,117,124,63,200,117,220,117,192,63,77,118,215,63,116,118,220,63,122,118,92,79,136,113,35,86,128,137,105,88,29,64,67,119,57,64,97,103,69,64,219,53,152,119,106,64,111,64,94,92,190,119,203,119,242,88,24,120,185,112,28,120,168,64,57,120,71,120,81,120,102,120,72,132,53,85,51,121,3,104,50,121,3,65,9,65,145,121,153,121,187,143,6,122,188,143,103,65,145,122,178,65,188,122,121,130,196,65,207,122,219,122,207,65,33,78,98,123,108,123,123,123,18,124,27,124,96,66,122,66,123,124,156,124,140,66,184,124,148,66,237,124,147,143,192,112,207,12,207,125,212,125,208,125,253,125,174,127,180,127,159,114,151,67,32,128,37,128,57,123,46,128,49,128,84,128,204,61,180,87,160,112,183,128,233,128,237,67,12,129,42,115,14,129,18,129,96,117,20,129,1,68,57,59,86,129,89,129,90,129,19,68,58,88,124,129,132,129,37,68,147,129,45,68,165,129,239,87,193,129,228,129,84,130,143,68,166,130,118,130,202,130,216,130,255,130,176,68,87,131,105,150,138,105,5,132,245,112,100,132,227,96,136,132,4,69,190,132,225,132,248,132,16,133,56,133,82,133,59,69,111,133,112,133,224,133,119,69,114,134,146,134,178,134,239,134,69,150,139,135,6,70,23,70,174,136,255,136,36,137,71,137,145,137,103,121,41,138,56,138,148,138,180,138,81,140,212,140,242,140,28,141,152,71,95,88,195,141,237,71,238,78,58,142,216,85,84,87,113,142,245,85,176,142,55,72,206,142,226,142,228,142,237,142,242,142,183,143,193,143,202,143,204,143,51,144,196,153,173,72,224,152,19,146,30,73,40,146,88,146,107,146,177,146,174,146,191,146,227,146,235,146,243,146,244,146,253,146,67,147,132,147,173,147,69,73,81,73,191,158,23,148,1,83,29,148,45,148,62,148,106,73,84,148,121,148,45,149,162,149,167,73,244,149,51,150,229,73,160,103,36,74,64,151,53,74,178,151,194,151,84,86,228,74,232,96,185,152,25,75,241,152,68,88,14,153,25,153,180,81,28,153,55,153,66,153,93,153,98,153,112,75,197,153,157,75,60,154,15,155,131,122,105,155,129,155,221,155,241,155,244,155,109,76,32,156,111,55,194,27,73,157,58,156,254,158,80,86,147,157,189,157,192,157,252,157,246,148,182,143,123,158,172,158,177,158,189,158,198,158,220,148,226,158,241,158,248,158,200,122,68,159,148,0,183,2,160,3,26,105,195,148,172,89,215,4,64,88,193,148,185,55,213,5,21,6,118,6,186,22,87,87,115,113,194,10,205,10,191,11,106,84,59,248,203,11,158,84,251,11,59,12,83,12,101,12,124,12,231,96,141,12,122,86,181,12,221,12,237,12,111,13,178,13,200,13,85,105,47,156,165,135,4,14,14,14,215,14,144,15,45,15,115,14,32,92,188,15,11,94,92,16,79,16,118,16,30,103,123,16,136,16,150,16,71,54,191,16,211,16,47,17,59,17,100,83,173,132,227,18,117,19,54,19,129,139,119,21,25,22,195,23,199,23,120,78,187,112,45,24,106,25,45,26,69,26,42,28,112,28,172,28,200,30,195,98,213,30,21,31,152,113,85,104,69,32,233,105,200,54,124,34,215,35,250,35,42,39,113,40,79,41,253,130,103,41,147,41,213,42,165,137,232,42,160,143,14,43,184,151,63,43,71,152,189,154,76,44,0,0,136,44,183,44,232,91,8,45,18,45,183,45,149,45,66,46,116,47,204,47,51,48,102,48,31,51,222,51,177,95,72,102,191,102,121,122,103,53,243,53,0,0,186,73,0,0,26,54,22,55,0,0,70,3,181,88,14,103,24,105,167,58,87,118,226,95,17,62,185,62,254,117,154,32,208,72,184,74,25,65,154,138,238,66,13,67,59,64,52,67,150,67,69,74,202,5,210,81,17,6,159,89,168,30,190,59,255,60,4,68,214,68,136,87,116,70,155,57,47,71,232,133,201,153,98,55,195,33,94,139,78,139,0,0,18,72,251,72,21,74,9,114,192,74,120,12,101,89,165,78,134,79,121,7,218,142,44,80,143,82,63,87,113,113,153,82,25,84,74,63,167,74,188,85,70,84,110,84,82,107,0,0,115,52,63,85,50,118,94,85,24,71,98,85,102,85,199,87,63,73,93,88,102,80,251,52,204,51,0,0,3,89,124,71,72,137,174,90,137,91,6,92,144,29,161,87,81,113,0,0,2,97,18,124,86,144,178,97,154,79,98,139,2,100,74,100,91,93,247,107,0,0,132,100,28,25,234,138,246,73,136,100,239,63,18,101,192,75,191,101,181,102,27,39,101,148,225,87,149,97,39,90,205,248,0,0,185,86,33,69,252,102,106,78,52,73,86,150,143,109,189,108,24,54,119,137,153,103,110,104,17,100,94,104,0,0,199,104,66,123,192,144,17,10,38,105,0,0,57,105,69,122,0,0,250,105,38,154,45,106,95,54,105,100,33,0,131,121,52,106,91,107,44,93,25,53,0,0,157,107,208,70,164,108,59,117,101,136,174,109,182,88,28,55,141,37,75,112,205,113,84,60,128,114,133,114,129,146,122,33,139,114,48,147,230,114,208,73,57,108,159,148,80,116,248,14,39,136,245,136,38,41,115,132,177,23,184,110,42,74,32,24,164,57,185,54,0,0,0,0,63,69,182,102,173,156,164,152,67,137,204,119,88,120,214,86,223,64,10,22,161,57,47,55,232,128,197,19,173,113,102,131,221,121,168,145,0,0,183,76,175,112,171,137,253,121,10,122,11,123,102,125,122,65,67,123,126,121,9,128,181,111,223,162,3,106,24,131,162,83,7,110,191,147,54,104,93,151,111,129,35,128,181,105,237,19,47,50,72,128,133,93,48,140,131,128,21,87,35,152,73,137,171,93,136,73,190,101,213,105,210,83,165,74,129,63,17,60,54,103,144,128,244,128,46,129,161,31,79,129,137,129,175,129,26,130,6,131,47,131,138,131,202,53,104,132,170,134,250,72,230,99,86,137,8,120,85,146,184,137,242,67,231,137,223,67,232,137,70,139,212,139,248,89,9,140,0,0,197,143,236,144,0,0,16,145,60,145,247,61,94,145,202,74,208,143,143,114,139,86,231,148,233,149,176,149,184,149,50,151,209,152,73,153,106,153,195,153,40,154,14,155,90,157,155,157,159,126,248,158,35,159,164,76,71,149,147,162,162,113,255,162,145,77,18,144,203,165,156,77,156,12,190,143,193,85,186,143,176,36,185,143,147,74,9,69,127,126,86,111,177,106,234,78,228,52,44,139,157,120,58,55,128,142,245,23,36,128,108,139,153,139,62,122,175,102,235,61,85,118,183,60,53,86,86,89,154,78,129,94,88,98,191,86,109,14,14,142,109,91,136,62,158,76,222,99,0,0,246,23,123,24,48,101,45,86,74,92,26,84,17,83,198,61,152,157,125,76,34,86,30,86,73,127,216,94,117,89,64,61,112,135,28,78,234,15,73,13,186,54,23,129,94,157,24,141,59,118,69,156,78,118,185,119,69,147,50,84,72,129,247,130,37,86,50,129,24,132,189,128,234,85,98,121,67,86,22,84,157,14,206,53,5,86,241,85,241,102,226,130,45,54,52,117,240,85,186,85,151,84,114,85,65,12,150,12,208,94,72,81,118,14,98,44,162,14,171,158,90,125,222,85,117,16,157,98,109,151,148,84,205,140,246,113,118,145,252,99,185,99,254,99,105,85,67,43,114,156,179,46,154,81,223,52,167,13,167,81,77,84,30,85,19,85,102,118,45,142,138,104,177,117,182,128,4,136,134,135,199,136,182,129,28,132,193,16,236,68,4,115,6,71,144,91,11,131,147,104,123,86,244,38,47,125,163,65,115,125,208,110,182,114,112,145,217,17,8,146,252,60,169,166,172,14,249,14,102,114,162,28,78,71,194,79,249,127,235,15,250,64,93,156,31,101,160,45,243,72,224,71,124,157,236,15,10,14,0,0,163,117,237,15,0,0,72,96,135,17,163,113,142,126,80,157,26,78,4,78,119,53,13,91,178,108,103,83,172,54,220,57,125,83,165,54,24,70,154,88,110,75,45,130,75,84,170,87,149,90,121,9,0,0,82,58,101,36,116,115,172,158,9,77,237,155,254,60,48,159,91,76,169,79,158,149,222,159,92,132,182,61,178,114,179,103,32,55,46,99,37,125,247,62,44,62,42,58,8,144,204,82,116,62,122,54,233,69,142,4,64,118,240,90,182,14,122,120,46,127,167,88,191,64,124,86,139,155,116,93,84,118,52,164,133,158,225,76,0,0,251,55,25,97,218,48,242,67,0,0,93,86,169,18,167,87,99,73,6,158,52,82,174,112,173,53,0,0,124,157,86,124,57,155,222,87,108,23,83,92,211,100,208,148,53,99,100,113,173,134,40,13,34,109,226,74,113,13,0,0,254,81,15,31,142,93,3,151,209,29,129,158,76,144,31,123,2,155,209,92,163,123,104,98,53,99,255,154,207,123,42,155,126,124,0,0,66,124,134,124,21,156,252,123,9,155,0,0,27,156,62,73,90,159,115,85,195,91,253,79,152,158,242,79,96,82,6,62,209,82,103,87,86,80,183,89,18,94,200,151,171,157,92,143,105,84,180,151,64,153,186,151,44,83,48,97,44,105,218,83,10,156,2,157,59,76,65,150,128,105,166,80,70,117,109,23,218,153,115,82,0,0,89,145,129,150,92,145,0,0,81,145,151,142,127,99,35,109,202,106,17,86,142,145,122,117,133,98,252,3,79,115,112,124,33,92,253,60,0,0,25,73,214,118,157,155,42,78,212,12,190,131,66,136,0,0,74,92,192,105,0,0,122,87,31,82,245,93,206,78,49,108,242,1,57,79,156,84,218,84,154,82,130,141,254,53,0,0,243,53,0,0,82,107,124,145,165,159,151,155,46,152,180,152,186,154,168,158,132,158,122,113,20,123,0,0,250,107,24,136,120,127,0,0,32,86,74,166,119,142,83,159,0,0,212,141,79,142,28,158,1,142,130,98,125,131,40,142,117,142,211,122,119,74,62,122,216,120,234,108,103,138,7,118,90,138,38,159,206,108,214,135,195,117,178,162,83,120,64,248,12,141,226,114,113,115,45,139,2,115,241,116,235,140,187,74,47,134,186,95,160,136,183,68,0,0,59,24,5,110,0,0,126,138,27,37,0,0,253,96,103,118,215,154,68,157,110,147,143,155,245,135,0,0,0,0,247,140,44,115,33,151,176,155,214,53,178,114,7,76,81,124,74,153,89,97,89,97,4,76,150,158,125,97,0,0,95,87,111,97,166,98,57,98,0,0,92,58,226,97,170,83,245,51,100,99,2,104,210,53,87,93,194,139,218,143,57,142,0,0,217,80,70,29,6,121,50,83,56,150,59,15,101,64,0,0,254,119,0,0,194,124,26,95,218,124,45,122,102,128,99,128,77,125,5,117,242,116,148,137,26,130,12,103,98,128,134,116,91,128,240,116,3,129,36,119,137,137,204,103,83,117,209,110,169,135,206,135,200,129,140,135,73,138,173,140,67,139,43,119,248,116,218,132,53,54,178,105,166,141,0,0,169,137,0,0,185,109,193,135,17,64,231,116,219,61,118,113,164,96,156,97,209,60,0,0,119,96,0,0,113,127,45,139,0,0,233,96,126,75,32,82,24,60,199,60,215,94,86,118,49,85,68,25,254,18,3,153,220,109,173,112,193,92,173,97,15,138,119,54,238,0,70,104,14,79,98,69,31,91,76,99,80,159,166,158,107,98,71,5,219,146,223,5,197,63,76,133,181,66,239,115,181,81,73,54,66,73,228,137,68,147,219,25,238,130,200,60,60,120,68,103,223,98,51,73,170,137,160,2,179,107,5,19,171,79,237,36,8,80,41,109,132,122,0,54,177,74,19,37,0,0,126,3,164,95,128,3,71,3,219,110,31,4,0,0,1,81,122,52,14,81,108,152,67,55,22,132,164,73,135,4,96,81,180,51,106,81,255,11,252,32,229,2,48,37,142,5,51,50,131,25,130,91,125,135,179,5,153,60,178,81,184,81,52,157,201,81,207,81,209,81,220,60,211,81,166,74,179,81,226,81,66,83,237,81,205,131,62,105,45,55,123,95,11,82,38,82,60,82,181,82,87,82,148,82,185,82,197,82,21,124,66,133,224,82,13,134,19,107,0,0,222,138,73,85,217,110,128,63,84,9,236,63,51,83,0,0,226,11,203,108,38,23,27,104,213,115,74,96,170,62,204,56,232,22,221,113,162,68,109,83,116,83,171,134,126,83,0,0,150,21,19,22,230,119,147,83,155,138,160,83,171,83,174,83,167,115,114,87,89,63,156,115,193,83,197,83,73,108,73,78,254,87,217,83,171,58,143,11,224,83,235,63,163,45,246,83,119,12,19,84,121,112,43,85,87,102,91,109,109,84,83,107,116,13,93,85,143,84,164,84,166,71,13,23,221,14,180,61,77,13,188,137,152,38,71,85,237,76,47,84,23,116,134,85,169,85,0,0,215,24,58,64,82,69,53,68,179,102,180,16,55,86,205,102,138,50,164,102,173,102,77,86,79,86,241,120,241,86,135,151,254,83,0,87,239,86,237,86,102,139,35,54,79,18,70,87,165,65,110,108,139,112,66,87,177,54,126,108,230,87,22,20,3,88,84,20,99,67,38,88,245,75,92,88,170,88,97,53,224,88,220,88,60,18,251,88,255,91,67,87,80,161,120,66,211,147,161,53,31,89,166,104,195,54,89,110,62,22,36,90,83,85,146,22,5,133,201,89,78,13,129,108,42,109,220,23,217,89,251,23,178,23,166,109,113,109,40,24,213,22,249,89,69,110,171,90,99,90,230,54,169,73,0,0,8,55,150,90,101,116,211,90,161,111,84,37,133,61,17,25,50,55,184,22,131,94,208,82,118,91,136,101,124,91,14,122,4,64,93,72,4,2,213,91,96,97,52,26,204,89,165,5,243,91,157,91,16,77,5,92,68,27,19,92,206,115,20,92,165,28,40,107,73,92,221,72,133,92,233,92,239,92,139,93,249,29,55,30,16,93,24,93,70,93,164,30,186,92,215,93,252,130,45,56,1,73,73,32,115,33,135,130,54,56,194,59,46,94,138,106,0,0,122,94,188,68,211,12,166,83,183,78,0,0,168,83,113,23,9,94,244,94,130,132,249,94,251,94,160,56,252,94,62,104,27,148,13,95,193,1,148,248,222,58,174,72,58,19,58,95,136,104,208,35,0,0,113,36,99,95,189,151,110,110,114,95,64,147,54,138,167,95,182,93,95,61,80,82,106,31,248,112,104,38,214,145,158,2,41,138,49,96,133,102,119,24,99,57,199,61,57,54,144,87,180,39,113,121,64,62,158,96,0,0,179,96,130,73,143,73,83,122,164,116,225,80,160,90,100,97,36,132,66,97,166,248,210,110,129,97,244,81,86,6,135,97,170,91,183,63,95,40,211,97,157,139,93,153,208,97,50,57,128,41,193,40,35,96,92,97,30,101,139,99,24,1,197,98,112,23,213,98,13,46,108,99,223,73,23,58,56,100,248,99,142,19,252,23,0,0,138,111,54,46,20,152,140,64,29,87,225,100,229,100,123,148,102,58,58,100,87,58,77,101,22,111,40,74,35,74,133,101,109,101,95,101,126,48,181,101,64,73,55,75,209,101,216,64,41,24,224,101,227,101,223,95,0,52,24,102,247,49,248,49,68,102,164,49,165,49,75,102,117,14,103,102,230,81,115,102,0,0,61,30,49,50,244,133,200,49,19,83,197,119,247,40,164,153,2,103,156,67,33,74,43,59,250,105,194,55,0,0,103,103,98,103,205,65,237,144,215,103,233,68,34,104,80,110,60,146,1,104,230,51,160,109,93,104,111,52,225,105,11,106,223,138,115,105,195,104,205,53,1,105,0,105,50,61,1,58,60,54,128,59,172,103,97,105,74,138,252,66,54,105,152,105,161,59,201,3,99,131,144,80,249,105,89,54,42,33,69,106,3,55,157,106,243,59,177,103,200,106,156,145,13,60,29,107,35,9,222,96,53,107,116,107,205,39,181,110,219,58,181,3,88,25,64,55,33,84,90,59,225,107,252,62,220,107,55,108,139,36,241,72,81,107,90,108,38,130,121,108,188,61,197,68,189,61,164,65,12,73,0,73,201,60,229,54,235,60,50,13,131,155,249,49,145,36,143,127,55,104,37,109,161,109,235,109,150,109,92,109,124,110,4,111,127,73,133,64,114,110,51,133,116,111,199,81,0,0,0,0,46,132,33,139,0,0,47,62,83,116,130,63,204,121,79,110,145,90,75,48,248,111,13,55,157,111,48,62,250,110,151,20,61,64,85,69,240,147,68,111,92,111,78,61,116,111,112,145,59,61,159,111,68,65,211,111,145,64,85,65,57,64,240,63,180,63,63,65,223,81,86,65,87,65,64,65,221,97,75,112,126,112,167,112,129,112,204,112,213,112,214,112,223,112,4,65,232,61,180,113,150,113,119,66,43,113,69,113,136,90,74,113,0,0,156,92,101,67,79,113,98,147,193,66,44,113,90,68,39,74,34,74,186,113,232,139,189,112,14,114,66,148,21,114,17,89,67,148,36,114,65,147,5,86,46,114,64,114,116,73,189,104,85,114,87,114,85,62,68,48,13,104,61,111,130,114,0,0,43,115,35,72,43,136,237,72,4,136,40,115,46,115,207,115,170,115,58,12,46,106,201,115,73,116,226,65,231,22,36,74,35,102,197,54,183,73,141,73,251,73,247,115,21,116,3,105,38,74,57,116,195,5,215,62,0,0,173,40,96,116,178,142,71,116,228,115,118,116,185,131,108,116,48,55,116,116,241,147,44,106,130,116,83,73,140,74,95,65,121,74,143,139,70,91,3,140,158,24,200,116,136,25,14,117,0,0,30,117,217,142,75,26,215,91,172,142,133,147,77,117,74,117,103,117,110,117,130,79,4,63,19,77,142,117,93,116,158,117,180,117,2,118,44,118,81,118,79,118,111,118,118,118,245,99,144,118,239,129,248,55,17,105,14,105,161,118,165,118,183,118,204,118,159,111,98,132,157,80,125,81,28,30,30,119,38,119,64,119,175,100,32,82,88,119,172,50,175,119,100,137,104,137,193,22,244,119,0,0,118,19,18,74,202,104,175,120,199,120,211,120,165,150,46,121,224,85,215,120,52,121,177,120,12,118,184,143,132,136,43,139,131,96,28,38,134,121,0,137,2,105,128,121,87,88,157,121,57,123,60,121,169,121,42,110,38,113,168,62,198,121,13,145,212,121,32,5,95,68,15,82,130,184,248,0,0,64,32,169,78,4,0,0,0,0,52,11,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,64,0,0,0,0,0,0,0,0,4,88,0,60,0,0,0,0,0,128,92,173,220,243,187,201,67,238,237,164,15,38,193,155,118,242,239,222,251,250,247,15,50,68,175,254,239,253,254,17,96,176,0,0,33,25,129,32,16,136,168,96,33,105,36,0,68,137,196,0,0,3,64,53,0,67,132,49,81,147,104,2,2,0,0,0,0,0,0,0,0,0,0,0,64,0,1,128,172,100,130,64,140,161,144,4,80,96,212,0,210,42,24,157,104,53,151,79,216,248,32,196,130,28,40,130,117,148,2,56,64,160,161,197,16,113,77,196,13,152,185,94,91,1,67,159,153,3,120,32,226,31,8,137,1,201,64,7,3,13,154,144,82,209,79,124,3,2,33,32,192,110,19,131,181,219,245,229,119,144,79,23,154,54,23,12,0,110,186,9,47,96,84,0,30,120,104,34,112,86,158,37,243,142,183,23,11,239,230,119,23,91,27,193,16,152,141,18,24,182,207,1,49,114,26,91,44,182,192,32,226,195,92,130,27,224,218,206,133,214,64,169,84,11,208,15,72,68,64,16,9,212,64,174,59,100,30,68,43,23,8,134,130,54,24,160,137,231,156,91,8,132,3,2,218,144,236,219,135,133,191,162,173,157,142,157,152,32,37,70,0,70,159,127,227,213,201,132,244,214,77,6,227,182,24,18,9,0,0,0,4,0,0,32,0,0,0,0,2,0,0,0,0,0,0,0,0,0,32,0,0,0,0,0,0,0,0,0,0,0,0,8,0,0,142,120,110,95,63,126,221,61,247,252,155,252,174,210,255,143,107,241,231,191,186,174,110,23,239,220,167,62,182,181,119,201,146,215,165,182,74,110,155,185,129,77,103,254,84,241,155,98,254,111,82,215,54,254,191,41,69,129,249,189,101,166,66,57,0,0,66,96,143,0,148,64,64,210,175,215,209,219,0,160,152,178,123,6,82,32,152,22,200,61,9,0,0,1,0,0,0,1,10,178,8,128,0,0,0,4,136,32,20,16,76,0,0,4,0,161,68,16,0,65,1,0,8,64,240,223,79,54,88,241,245,181,128,245,103,128,64,0,80,78,65,200,132,0,90,96,216,1,43,1,80,161,22,196,64,242,110,17,172,32,57,196,192,8,7,12,9,152,150,196,155,16,28,152,108,134,42,166,1,70,17,109,229,203,196,192,146,16,33,22,18,157,114,244,105,14,23,42,162,129,244,123,0,8,164,11,144,16,44,204,57,74,1,240,22,11,10,64,12,29,234,12,68,14,69,2,0,8,4,4,8,4,4,8,2,4,0,0,0,0,0,0,0,195,138,204,132,195,138,204,140,195,170,204,132,195,170,204,140,0,0,0,0,0,0,0,0,0,48,12,255,1,48,2,48,14,255,39,32,27,255,26,255,31,255,1,255,48,254,38,32,37,32,80,254,81,254,82,254,183,0,84,254,85,254,86,254,87,254,92,255,19,32,49,254,20,32,51,254,116,37,52,254,79,254,8,255,9,255,53,254,54,254,91,255,93,255,55,254,56,254,20,48,21,48,57,254,58,254,16,48,17,48,59,254,60,254,10,48,11,48,61,254,62,254,8,48,9,48,63,254,64,254,12,48,13,48,65,254,66,254,14,48,15,48,67,254,68,254,89,254,90,254,91,254,92,254,93,254,94,254,24,32,25,32,28,32,29,32,29,48,30,48,53,32,50,32,3,255,6,255,10,255,59,32,167,0,3,48,203,37,207,37,179,37,178,37,206,37,6,38,5,38,199,37,198,37,161,37,160,37,189,37,188,37,163,50,5,33,175,0,227,255,63,255,205,2,73,254,74,254,77,254,78,254,75,254,76,254,95,254,96,254,97,254,11,255,13,255,215,0,247,0,177,0,26,34,28,255,30,255,29,255,102,34,103,34,96,34,30,34,82,34,97,34,98,254,99,254,100,254,101,254,102,254,94,255,41,34,42,34,165,34,32,34,31,34,191,34,210,51,209,51,43,34,46,34,53,34,52,34,64,38,66,38,149,34,153,34,145,33,147,33,144,33,146,33,150,33,151,33,153,33,152,33,37,34,35,34,15,255,60,255,21,34,104,254,4,255,229,255,18,48,224,255,225,255,5,255,32,255,3,33,9,33,105,254,106,254,107,254,213,51,156,51,157,51,158,51,206,51,161,51,142,51,143,51,196,51,176,0,89,81,91,81,94,81,93,81,97,81,99,81,231,85,233,116,206,124,129,37,130,37,131,37,132,37,133,37,134,37,135,37,136,37,143,37,142,37,141,37,140,37,139,37,138,37,137,37,60,37,52,37,44,37,36,37,28,37,148,37,0,37,2,37,149,37,12,37,16,37,20,37,24,37,109,37,110,37,112,37,111,37,80,37,94,37,106,37,97,37,226,37,227,37,229,37,228,37,113,37,114,37,115,37,16,255,17,255,18,255,19,255,20,255,21,255,22,255,23,255], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+68332);
/* memory initializer */ allocate([24,255,25,255,96,33,97,33,98,33,99,33,100,33,101,33,102,33,103,33,104,33,105,33,33,48,34,48,35,48,36,48,37,48,38,48,39,48,40,48,41,48,65,83,68,83,69,83,33,255,34,255,35,255,36,255,37,255,38,255,39,255,40,255,41,255,42,255,43,255,44,255,45,255,46,255,47,255,48,255,49,255,50,255,51,255,52,255,53,255,54,255,55,255,56,255,57,255,58,255,65,255,66,255,67,255,68,255,69,255,70,255,71,255,72,255,73,255,74,255,75,255,76,255,77,255,78,255,79,255,80,255,81,255,82,255,83,255,84,255,85,255,86,255,87,255,88,255,89,255,90,255,145,3,146,3,147,3,148,3,149,3,150,3,151,3,152,3,153,3,154,3,155,3,156,3,157,3,158,3,159,3,160,3,161,3,163,3,164,3,165,3,166,3,167,3,168,3,169,3,177,3,178,3,179,3,180,3,181,3,182,3,183,3,184,3,185,3,186,3,187,3,188,3,189,3,190,3,191,3,192,3,193,3,195,3,196,3,197,3,198,3,199,3,200,3,201,3,5,49,6,49,7,49,8,49,9,49,10,49,11,49,12,49,13,49,14,49,15,49,16,49,17,49,18,49,19,49,20,49,21,49,22,49,23,49,24,49,25,49,26,49,27,49,28,49,29,49,30,49,31,49,32,49,33,49,34,49,35,49,36,49,37,49,38,49,39,49,40,49,41,49,217,2,201,2,202,2,199,2,203,2,0,36,1,36,2,36,3,36,4,36,5,36,6,36,7,36,8,36,9,36,10,36,11,36,12,36,13,36,14,36,15,36,16,36,17,36,18,36,19,36,20,36,21,36,22,36,23,36,24,36,25,36,26,36,27,36,28,36,29,36,30,36,31,36,33,36,172,32,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,78,89,78,1,78,3,78,67,78,93,78,134,78,140,78,186,78,63,81,101,81,107,81,224,81,0,82,1,82,155,82,21,83,65,83,92,83,200,83,9,78,11,78,8,78,10,78,43,78,56,78,225,81,69,78,72,78,95,78,94,78,142,78,161,78,64,81,3,82,250,82,67,83,201,83,227,83,31,87,235,88,21,89,39,89,115,89,80,91,81,91,83,91,248,91,15,92,34,92,56,92,113,92,221,93,229,93,241,93,242,93,243,93,254,93,114,94,254,94,11,95,19,95,77,98,17,78,16,78,13,78,45,78,48,78,57,78,75,78,57,92,136,78,145,78,149,78,146,78,148,78,162,78,193,78,192,78,195,78,198,78,199,78,205,78,202,78,203,78,196,78,67,81,65,81,103,81,109,81,110,81,108,81,151,81,246,81,6,82,7,82,8,82,251,82,254,82,255,82,22,83,57,83,72,83,71,83,69,83,94,83,132,83,203,83,202,83,205,83,236,88,41,89,43,89,42,89,45,89,84,91,17,92,36,92,58,92,111,92,244,93,123,94,255,94,20,95,21,95,195,95,8,98,54,98,75,98,78,98,47,101,135,101,151,101,164,101,185,101,229,101,240,102,8,103,40,103,32,107,98,107,121,107,203,107,212,107,219,107,15,108,52,108,107,112,42,114,54,114,59,114,71,114,89,114,91,114,172,114,139,115,25,78,22,78,21,78,20,78,24,78,59,78,77,78,79,78,78,78,229,78,216,78,212,78,213,78,214,78,215,78,227,78,228,78,217,78,222,78,69,81,68,81,137,81,138,81,172,81,249,81,250,81,248,81,10,82,160,82,159,82,5,83,6,83,23,83,29,83,223,78,74,83,73,83,97,83,96,83,111,83,110,83,187,83,239,83,228,83,243,83,236,83,238,83,233,83,232,83,252,83,248,83,245,83,235,83,230,83,234,83,242,83,241,83,240,83,229,83,237,83,251,83,219,86,218,86,22,89,46,89,49,89,116,89,118,89,85,91,131,91,60,92,232,93,231,93,230,93,2,94,3,94,115,94,124,94,1,95,24,95,23,95,197,95,10,98,83,98,84,98,82,98,81,98,165,101,230,101,46,103,44,103,42,103,43,103,45,103,99,107,205,107,17,108,16,108,56,108,65,108,64,108,62,108,175,114,132,115,137,115,220,116,230,116,24,117,31,117,40,117,41,117,48,117,49,117,50,117,51,117,139,117,125,118,174,118,191,118,238,118,219,119,226,119,243,119,58,121,190,121,116,122,203,122,30,78,31,78,82,78,83,78,105,78,153,78,164,78,166,78,165,78,255,78,9,79,25,79,10,79,21,79,13,79,16,79,17,79,15,79,242,78,246,78,251,78,240,78,243,78,253,78,1,79,11,79,73,81,71,81,70,81,72,81,104,81,113,81,141,81,176,81,23,82,17,82,18,82,14,82,22,82,163,82,8,83,33,83,32,83,112,83,113,83,9,84,15,84,12,84,10,84,16,84,1,84,11,84,4,84,17,84,13,84,8,84,3,84,14,84,6,84,18,84,224,86,222,86,221,86,51,87,48,87,40,87,45,87,44,87,47,87,41,87,25,89,26,89,55,89,56,89,132,89,120,89,131,89,125,89,121,89,130,89,129,89,87,91,88,91,135,91,136,91,133,91,137,91,250,91,22,92,121,92,222,93,6,94,118,94,116,94,15,95,27,95,217,95,214,95,14,98,12,98,13,98,16,98,99,98,91,98,88,98,54,101,233,101,232,101,236,101,237,101,242,102,243,102,9,103,61,103,52,103,49,103,53,103,33,107,100,107,123,107,22,108,93,108,87,108,89,108,95,108,96,108,80,108,85,108,97,108,91,108,77,108,78,108,112,112,95,114,93,114,126,118,249,122,115,124,248,124,54,127,138,127,189,127,1,128,3,128,12,128,18,128,51,128,127,128,137,128,139,128,140,128,227,129,234,129,243,129,252,129,12,130,27,130,31,130,110,130,114,130,126,130,107,134,64,136,76,136,99,136,127,137,33,150,50,78,168,78,77,79,79,79,71,79,87,79,94,79,52,79,91,79,85,79,48,79,80,79,81,79,61,79,58,79,56,79,67,79,84,79,60,79,70,79,99,79,92,79,96,79,47,79,78,79,54,79,89,79,93,79,72,79,90,79,76,81,75,81,77,81,117,81,182,81,183,81,37,82,36,82,41,82,42,82,40,82,171,82,169,82,170,82,172,82,35,83,115,83,117,83,29,84,45,84,30,84,62,84,38,84,78,84,39,84,70,84,67,84,51,84,72,84,66,84,27,84,41,84,74,84,57,84,59,84,56,84,46,84,53,84,54,84,32,84,60,84,64,84,49,84,43,84,31,84,44,84,234,86,240,86,228,86,235,86,74,87,81,87,64,87,77,87,71,87,78,87,62,87,80,87,79,87,59,87,239,88,62,89,157,89,146,89,168,89,158,89,163,89,153,89,150,89,141,89,164,89,147,89,138,89,165,89,93,91,92,91,90,91,91,91,140,91,139,91,143,91,44,92,64,92,65,92,63,92,62,92,144,92,145,92,148,92,140,92,235,93,12,94,143,94,135,94,138,94,247,94,4,95,31,95,100,95,98,95,119,95,121,95,216,95,204,95,215,95,205,95,241,95,235,95,248,95,234,95,18,98,17,98,132,98,151,98,150,98,128,98,118,98,137,98,109,98,138,98,124,98,126,98,121,98,115,98,146,98,111,98,152,98,110,98,149,98,147,98,145,98,134,98,57,101,59,101,56,101,241,101,244,102,95,103,78,103,79,103,80,103,81,103,92,103,86,103,94,103,73,103,70,103,96,103,83,103,87,103,101,107,207,107,66,108,94,108,153,108,129,108,136,108,137,108,133,108,155,108,106,108,122,108,144,108,112,108,140,108,104,108,150,108,146,108,125,108,131,108,114,108,126,108,116,108,134,108,118,108,141,108,148,108,152,108,130,108,118,112,124,112,125,112,120,112,98,114,97,114,96,114,196,114,194,114,150,115,44,117,43,117,55,117,56,117,130,118,239,118,227,119,193,121,192,121,191,121,118,122,251,124,85,127,150,128,147,128,157,128,152,128,155,128,154,128,178,128,111,130,146,130,139,130,141,130,139,137,210,137,0,138,55,140,70,140,85,140,157,140,100,141,112,141,179,141,171,142,202,142,155,143,176,143,194,143,198,143,197,143,196,143,225,93,145,144,162,144,170,144,166,144,163,144,73,145,198,145,204,145,50,150,46,150,49,150,42,150,44,150,38,78,86,78,115,78,139,78,155,78,158,78,171,78,172,78,111,79,157,79,141,79,115,79,127,79,108,79,155,79,139,79,134,79,131,79,112,79,117,79,136,79,105,79,123,79,150,79,126,79,143,79,145,79,122,79,84,81,82,81,85,81,105,81,119,81,118,81,120,81,189,81,253,81,59,82,56,82,55,82,58,82,48,82,46,82,54,82,65,82,190,82,187,82,82,83,84,83,83,83,81,83,102,83,119,83,120,83,121,83,214,83,212,83,215,83,115,84,117,84,150,84,120,84,149,84,128,84,123,84,119,84,132,84,146,84,134,84,124,84,144,84,113,84,118,84,140,84,154,84,98,84,104,84,139,84,125,84,142,84,250,86,131,87,119,87,106,87,105,87,97,87,102,87,100,87,124,87,28,89,73,89,71,89,72,89,68,89,84,89,190,89,187,89,212,89,185,89,174,89,209,89,198,89,208,89,205,89,203,89,211,89,202,89,175,89,179,89,210,89,197,89,95,91,100,91,99,91,151,91,154,91,152,91,156,91,153,91,155,91,26,92,72,92,69,92,70,92,183,92,161,92,184,92,169,92,171,92,177,92,179,92,24,94,26,94,22,94,21,94,27,94,17,94,120,94,154,94,151,94,156,94,149,94,150,94,246,94,38,95,39,95,41,95,128,95,129,95,127,95,124,95,221,95,224,95,253,95,245,95,255,95,15,96,20,96,47,96,53,96,22,96,42,96,21,96,33,96,39,96,41,96,43,96,27,96,22,98,21,98,63,98,62,98,64,98,127,98,201,98,204,98,196,98,191,98,194,98,185,98,210,98,219,98,171,98,211,98,212,98,203,98,200,98,168,98,189,98,188,98,208,98,217,98,199,98,205,98,181,98,218,98,177,98,216,98,214,98,215,98,198,98,172,98,206,98,62,101,167,101,188,101,250,101,20,102,19,102,12,102,6,102,2,102,14,102,0,102,15,102,21,102,10,102,7,102,13,103,11,103,109,103,139,103,149,103,113,103,156,103,115,103,119,103,135,103,157,103,151,103,111,103,112,103,127,103,137,103,126,103,144,103,117,103,154,103,147,103,124,103,106,103,114,103,35,107,102,107,103,107,127,107,19,108,27,108,227,108,232,108,243,108,177,108,204,108,229,108,179,108,189,108,190,108,188,108,226,108,171,108,213,108,211,108,184,108,196,108,185,108,193,108,174,108,215,108,197,108,241,108,191,108,187,108,225,108,219,108,202,108,172,108,239,108,220,108,214,108,224,108,149,112,142,112,146,112,138,112,153,112,44,114,45,114,56,114,72,114,103,114,105,114,192,114,206,114,217,114,215,114,208,114,169,115,168,115,159,115,171,115,165,115,61,117,157,117,153,117,154,117,132,118,194,118,242,118,244,118,229,119,253,119,62,121,64,121,65,121,201,121,200,121,122,122,121,122,250,122,254,124,84,127,140,127,139,127,5,128,186,128,165,128,162,128,177,128,161,128,171,128,169,128,180,128,170,128,175,128,229,129,254,129,13,130,179,130,157,130,153,130,173,130,189,130,159,130,185,130,177,130,172,130,165,130,175,130,184,130,163,130,176,130,190,130,183,130,78,134,113,134,29,82,104,136,203,142,206,143,212,143,209,143,181,144,184,144,177,144,182,144,199,145,209,145,119,149,128,149,28,150,64,150,63,150,59,150,68,150,66,150,185,150,232,150,82,151,94,151,159,78,173,78,174,78,225,79,181,79,175,79,191,79,224,79,209,79,207,79,221,79,195,79,182,79,216,79,223,79,202,79,215,79,174,79,208,79,196,79,194,79,218,79,206,79,222,79,183,79,87,81,146,81,145,81,160,81,78,82,67,82,74,82,77,82,76,82,75,82,71,82,199,82,201,82,195,82,193,82,13,83,87,83,123,83,154,83,219,83,172,84,192,84,168,84,206,84,201,84,184,84,166,84,179,84,199,84,194,84,189,84,170,84,193,84,196,84,200,84,175,84,171,84,177,84,187,84,169,84,167,84,191,84,255,86,130,87,139,87,160,87,163,87,162,87,206,87,174,87,147,87,85,89,81,89,79,89,78,89,80,89,220,89,216,89,255,89,227,89,232,89,3,90,229,89,234,89,218,89,230,89,1,90,251,89,105,91,163,91,166,91,164,91,162,91,165,91,1,92,78,92,79,92,77,92,75,92,217,92,210,92,247,93,29,94,37,94,31,94,125,94,160,94,166,94,250,94,8,95,45,95,101,95,136,95,133,95,138,95,139,95,135,95,140,95,137,95,18,96,29,96,32,96,37,96,14,96,40,96,77,96,112,96,104,96,98,96,70,96,67,96,108,96,107,96,106,96,100,96,65,98,220,98,22,99,9,99,252,98,237,98,1,99,238,98,253,98,7,99,241,98,247,98,239,98,236,98,254,98,244,98,17,99,2,99,63,101,69,101,171,101,189,101,226,101,37,102,45,102,32,102,39,102,47,102,31,102,40,102,49,102,36,102,247,102,255,103,211,103,241,103,212,103,208,103,236,103,182,103,175,103,245,103,233,103,239,103,196,103,209,103,180,103,218,103,229,103,184,103,207,103,222,103,243,103,176,103,217,103,226,103,221,103,210,103,106,107,131,107,134,107,181,107,210,107,215,107,31,108,201,108,11,109,50,109,42,109,65,109,37,109,12,109,49,109,30,109,23,109,59,109,61,109,62,109,54,109,27,109,245,108,57,109,39,109,56,109,41,109,46,109,53,109,14,109,43,109,171,112,186,112,179,112,172,112,175,112,173,112,184,112,174,112,164,112,48,114,114,114,111,114,116,114,233,114,224,114,225,114,183,115,202,115,187,115,178,115,205,115,192,115,179,115,26,117,45,117,79,117,76,117,78,117,75,117,171,117,164,117,165,117,162,117,163,117,120,118,134,118,135,118,136,118,200,118,198,118,195,118,197,118,1,119,249,118,248,118,9,119,11,119,254,118,252,118,7,119,220,119,2,120,20,120,12,120,13,120,70,121,73,121,72,121,71,121,185,121,186,121,209,121,210,121,203,121,127,122,129,122,255,122,253,122,125,124,2,125,5,125,0,125,9,125,7,125,4,125,6,125,56,127,142,127,191,127,4,128,16,128,13,128,17,128,54,128,214,128,229,128,218,128,195,128,196,128,204,128,225,128,219,128,206,128,222,128,228,128,221,128,244,129,34,130,231,130,3,131,5,131,227,130,219,130,230,130,4,131,229,130,2,131,9,131,210,130,215,130,241,130,1,131,220,130,212,130,209,130,222,130,211,130,223,130,239,130,6,131,80,134,121,134,123,134,122,134,77,136,107,136,129,137,212,137,8,138,2,138,3,138,158,140,160,140,116,141,115,141,180,141,205,142,204,142,240,143,230,143,226,143,234,143,229,143,237,143,235,143,228,143,232,143,202,144,206,144,193,144,195,144,75,145,74,145,205,145,130,149,80,150,75,150,76,150,77,150,98,151,105,151,203,151,237,151,243,151,1,152,168,152,219,152,223,152,150,153,153,153,88,78,179,78,12,80,13,80,35,80,239,79,38,80,37,80,248,79,41,80,22,80,6,80,60,80,31,80,26,80,18,80,17,80,250,79,0,80,20,80,40,80,241,79,33,80,11,80,25,80,24,80,243,79,238,79,45,80,42,80,254,79,43,80,9,80,124,81,164,81,165,81,162,81,205,81,204,81,198,81,203,81,86,82,92,82,84,82,91,82,93,82,42,83,127,83,159,83,157,83,223,83,232,84,16,85,1,85,55,85,252,84,229,84,242,84,6,85,250,84,20,85,233,84,237,84,225,84,9,85,238,84,234,84,230,84,39,85,7,85,253,84,15,85,3,87,4,87,194,87,212,87,203,87,195,87,9,88,15,89,87,89,88,89,90,89,17,90,24,90,28,90,31,90,27,90,19,90,236,89,32,90,35,90,41,90,37,90,12,90,9,90,107,91,88,92,176,91,179,91,182,91,180,91,174,91,181,91,185,91,184,91,4,92,81,92,85,92,80,92,237,92,253,92,251,92,234,92,232,92,240,92,246,92,1,93,244,92,238,93,45,94,43,94,171,94,173,94,167,94,49,95,146,95,145,95,144,95,89,96,99,96,101,96,80,96,85,96,109,96,105,96,111,96,132,96,159,96,154,96,141,96,148,96,140,96,133,96,150,96,71,98,243,98,8,99,255,98,78,99,62,99,47,99,85,99,66,99,70,99,79,99,73,99,58,99,80,99,61,99,42,99,43,99,40,99,77,99,76,99,72,101,73,101,153,101,193,101,197,101,66,102,73,102,79,102,67,102,82,102,76,102,69,102,65,102,248,102,20,103,21,103,23,103,33,104,56,104,72,104,70,104,83,104,57,104,66,104,84,104,41,104,179,104,23,104,76,104,81,104,61,104,244,103,80,104,64,104,60,104,67,104,42,104,69,104,19,104,24,104,65,104,138,107,137,107,183,107,35,108,39,108,40,108,38,108,36,108,240,108,106,109,149,109,136,109,135,109,102,109,120,109,119,109,89,109,147,109,108,109,137,109,110,109,90,109,116,109,105,109,140,109,138,109,121,109,133,109,101,109,148,109,202,112,216,112,228,112,217,112,200,112,207,112,57,114,121,114,252,114,249,114,253,114,248,114,247,114,134,115,237,115,9,116,238,115,224,115,234,115,222,115,84,117,93,117,92,117,90,117,89,117,190,117,197,117,199,117,178,117,179,117,189,117,188,117,185,117,194,117,184,117,139,118,176,118,202,118,205,118,206,118,41,119,31,119,32,119,40,119,233,119,48,120,39,120,56,120,29,120,52,120,55,120,37,120,45,120,32,120,31,120,50,120,85,121,80,121,96,121,95,121,86,121,94,121,93,121,87,121,90,121,228,121,227,121,231,121,223,121,230,121,233,121,216,121,132,122,136,122,217,122,6,123,17,123,137,124,33,125,23,125,11,125,10,125,32,125,34,125,20,125,16,125,21,125,26,125,28,125,13,125,25,125,27,125,58,127,95,127,148,127,197,127,193,127,6,128,24,128,21,128,25,128,23,128,61,128,63,128,241,128,2,129,240,128,5,129,237,128,244,128,6,129,248,128,243,128,8,129,253,128,10,129,252,128,239,128,237,129,236,129,0,130,16,130,42,130,43,130,40,130,44,130,187,130,43,131,82,131,84,131,74,131,56,131,80,131,73,131,53,131,52,131,79,131,50,131,57,131,54,131,23,131,64,131,49,131,40,131,67,131,84,134,138,134,170,134,147,134,164,134,169,134,140,134,163,134,156,134,112,136,119,136,129,136,130,136,125,136,121,136,24,138,16,138,14,138,12,138,21,138,10,138,23,138,19,138,22,138,15,138,17,138,72,140,122,140,121,140,161,140,162,140,119,141,172,142,210,142,212,142,207,142,177,143,1,144,6,144,247,143,0,144,250,143,244,143,3,144,253,143,5,144,248,143,149,144,225,144,221,144,226,144,82,145,77,145,76,145,216,145,221,145,215,145,220,145,217,145,131,149,98,150,99,150,97,150,91,150,93,150,100,150,88,150,94,150,187,150,226,152,172,153,168,154,216,154,37,155,50,155,60,155,126,78,122,80,125,80,92,80,71,80,67,80,76,80,90,80,73,80,101,80,118,80,78,80,85,80,117,80,116,80,119,80,79,80,15,80,111,80,109,80,92,81,149,81,240,81,106,82,111,82,210,82,217,82,216,82,213,82,16,83,15,83,25,83,63,83,64,83,62,83,195,83,252,102,70,85,106,85,102,85,68,85,94,85,97,85,67,85,74,85,49,85,86,85,79,85,85,85,47,85,100,85,56,85,46,85,92,85,44,85,99,85,51,85,65,85,87,85,8,87,11,87,9,87,223,87,5,88,10,88,6,88,224,87,228,87,250,87,2,88,53,88,247,87,249,87,32,89,98,89,54,90,65,90,73,90,102,90,106,90,64,90,60,90,98,90,90,90,70,90,74,90,112,91,199,91,197,91,196,91,194,91,191,91,198,91,9,92,8,92,7,92,96,92,92,92,93,92,7,93,6,93,14,93,27,93,22,93,34,93,17,93,41,93,20,93,25,93,36,93,39,93,23,93,226,93,56,94,54,94,51,94,55,94,183,94,184,94,182,94,181,94,190,94,53,95,55,95,87,95,108,95,105,95,107,95,151,95,153,95,158,95,152,95,161,95,160,95,156,95,127,96,163,96,137,96,160,96,168,96,203,96,180,96,230,96,189,96,197,96,187,96,181,96,220,96,188,96,216,96,213,96,198,96,223,96,184,96,218,96,199,96,26,98,27,98,72,98,160,99,167,99,114,99,150,99,162,99,165,99,119,99,103,99,152,99,170,99,113,99,169,99,137,99,131,99,155,99,107,99,168,99,132,99,136,99,153,99,161,99,172,99,146,99,143,99,128,99,123,99,105,99,104,99,122,99,93,101,86,101,81,101,89,101,87,101,95,85,79,101,88,101,85,101,84,101,156,101,155,101,172,101,207,101,203,101,204,101,206,101,93,102,90,102,100,102,104,102,102,102,94,102,249,102,215,82,27,103,129,104,175,104,162,104,147,104,181,104,127,104,118,104,177,104,167,104,151,104,176,104,131,104,196,104,173,104,134,104,133,104,148,104,157,104,168,104,159,104,161,104,130,104,50,107,186,107,235,107,236,107,43,108,142,109,188,109,243,109,217,109,178,109,225,109,204,109,228,109,251,109,250,109,5,110,199,109,203,109,175,109,209,109,174,109,222,109,249,109,184,109,247,109,245,109,197,109,210,109,26,110,181,109,218,109,235,109,216,109,234,109,241,109,238,109,232,109,198,109,196,109,170,109,236,109,191,109,230,109,249,112,9,113,10,113,253,112,239,112,61,114,125,114,129,114,28,115,27,115,22,115,19,115,25,115,135,115,5,116,10,116,3,116,6,116,254,115,13,116,224,116,246,116,247,116,28,117,34,117,101,117,102,117,98,117,112,117,143,117,212,117,213,117,181,117,202,117,205,117,142,118,212,118,210,118,219,118,55,119,62,119,60,119,54,119,56,119,58,119,107,120,67,120,78,120,101,121,104,121,109,121,251,121,146,122,149,122,32,123,40,123,27,123,44,123,38,123,25,123,30,123,46,123,146,124,151,124,149,124,70,125,67,125,113,125,46,125,57,125,60,125,64,125,48,125,51,125,68,125,47,125,66,125,50,125,49,125,61,127,158,127,154,127,204,127,206,127,210,127,28,128,74,128,70,128,47,129,22,129,35,129,43,129,41,129,48,129,36,129,2,130,53,130,55,130,54,130,57,130,142,131,158,131,152,131,120,131,162,131,150,131,189,131,171,131,146,131,138,131,147,131,137,131,160,131,119,131,123,131,124,131,134,131,167,131,85,134,106,95,199,134,192,134,182,134,196,134,181,134,198,134,203,134,177,134,175,134,201,134,83,136,158,136,136,136,171,136,146,136,150,136,141,136,139,136,147,137,143,137,42,138,29,138,35,138,37,138,49,138,45,138,31,138,27,138,34,138,73,140,90,140,169,140,172,140,171,140,168,140,170,140,167,140,103,141,102,141,190,141,186,141,219,142,223,142,25,144,13,144,26,144,23,144,35,144,31,144,29,144,16,144,21,144,30,144,32,144,15,144,34,144,22,144,27,144,20,144,232,144,237,144,253,144,87,145,206,145,245,145,230,145,227,145,231,145,237,145,233,145,137,149,106,150,117,150,115,150,120,150,112,150,116,150,118,150,119,150,108,150,192,150,234,150,233,150,224,122,223,122,2,152,3,152,90,155,229,156,117,158,127,158,165,158,187,158,162,80,141,80,133,80,153,80,145,80,128,80,150,80,152,80,154,80,0,103,241,81,114,82,116,82,117,82,105,82,222,82,221,82,219,82,90,83,165,83,123,85,128,85,167,85,124,85,138,85,157,85,152,85,130,85,156,85,170,85,148,85,135,85,139,85,131,85,179,85,174,85,159,85,62,85,178,85,154,85,187,85,172,85,177,85,126,85,137,85,171,85,153,85,13,87,47,88,42,88,52,88,36,88,48,88,49,88,33,88,29,88,32,88,249,88,250,88,96,89,119,90,154,90,127,90,146,90,155,90,167,90,115,91,113,91,210,91,204,91,211,91,208,91,10,92,11,92,49,92,76,93,80,93,52,93,71,93,253,93,69,94,61,94,64,94,67,94,126,94,202,94,193,94,194,94,196,94,60,95,109,95,169,95,170,95,168,95,209,96,225,96,178,96,182,96,224,96,28,97,35,97,250,96,21,97,240,96,251,96,244,96,104,97,241,96,14,97,246,96,9,97,0,97,18,97,31,98,73,98,163,99,140,99,207,99,192,99,233,99,201,99,198,99,205,99,210,99,227,99,208,99,225,99,214,99,237,99,238,99,118,99,244,99,234,99,219,99,82,100,218,99,249,99,94,101,102,101,98,101,99,101,145,101,144,101,175,101,110,102,112,102,116,102,118,102,111,102,145,102,122,102,126,102,119,102,254,102,255,102,31,103,29,103,250,104,213,104,224,104,216,104,215,104,5,105,223,104,245,104,238,104,231,104,249,104,210,104,242,104,227,104,203,104,205,104,13,105,18,105,14,105,201,104,218,104,110,105,251,104,62,107,58,107,61,107,152,107,150,107,188,107,239,107,46,108,47,108,44,108,47,110,56,110,84,110,33,110,50,110,103,110,74,110,32,110,37,110,35,110,27,110,91,110,88,110,36,110,86,110,110,110,45,110,38,110,111,110,52,110,77,110,58,110,44,110,67,110,29,110,62,110,203,110,137,110,25,110,78,110,99,110,68,110,114,110,105,110,95,110,25,113,26,113,38,113,48,113,33,113,54,113,110,113,28,113,76,114,132,114,128,114,54,115,37,115,52,115,41,115,58,116,42,116,51,116,34,116,37,116,53,116,54,116,52,116,47,116,27,116,38,116,40,116,37,117,38,117,107,117,106,117,226,117,219,117,227,117,217,117,216,117,222,117,224,117,123,118,124,118,150,118,147,118,180,118,220,118,79,119,237,119,93,120,108,120,111,120,13,122,8,122,11,122,5,122,0,122,152,122,151,122,150,122,229,122,227,122,73,123,86,123,70,123,80,123,82,123,84,123,77,123,75,123,79,123,81,123,159,124,165,124,94,125,80,125,104,125,85,125,43,125,110,125,114,125,97,125,102,125,98,125,112,125,115,125,132,85,212,127,213,127,11,128,82,128,133,128,85,129,84,129,75,129,81,129,78,129,57,129,70,129,62,129,76,129,83,129,116,129,18,130,28,130,233,131,3,132,248,131,13,132,224,131,197,131,11,132,193,131,239,131,241,131,244,131,87,132,10,132,240,131,12,132,204,131,253,131,242,131,202,131,56,132,14,132,4,132,220,131,7,132,212,131,223,131,91,134,223,134,217,134,237,134,212,134,219,134,228,134,208,134,222,134,87,136,193,136,194,136,177,136,131,137,150,137,59,138,96,138,85,138,94,138,60,138,65,138,84,138,91,138,80,138,70,138,52,138,58,138,54,138,86,138,97,140,130,140,175,140,188,140,179,140,189,140,193,140,187,140,192,140,180,140,183,140,182,140,191,140,184,140,138,141,133,141,129,141,206,141,221,141,203,141,218,141,209,141,204,141,219,141,198,141,251,142,248,142,252,142,156,143,46,144,53,144,49,144,56,144,50,144,54,144,2,145,245,144,9,145,254,144,99,145,101,145,207,145,20,146,21,146,35,146,9,146,30,146,13,146,16,146,7,146,17,146,148,149,143,149,139,149,145,149,147,149,146,149,142,149,138,150,142,150,139,150,125,150,133,150,134,150,141,150,114,150,132,150,193,150,197,150,196,150,198,150,199,150,239,150,242,150,204,151,5,152,6,152,8,152,231,152,234,152,239,152,233,152,242,152,237,152,174,153,173,153,195,158,205,158,209,158,130,78,173,80,181,80,178,80,179,80,197,80,190,80,172,80,183,80,187,80,175,80,199,80,127,82,119,82,125,82,223,82,230,82,228,82,226,82,227,82,47,83,223,85,232,85,211,85,230,85,206,85,220,85,199,85,209,85,227,85,228,85,239,85,218,85,225,85,197,85,198,85,229,85,201,85,18,87,19,87,94,88,81,88,88,88,87,88,90,88,84,88,107,88,76,88,109,88,74,88,98,88,82,88,75,88,103,89,193,90,201,90,204,90,190,90,189,90,188,90,179,90,194,90,178,90,105,93,111,93,76,94,121,94,201,94,200,94,18,95,89,95,172,95,174,95,26,97,15,97,72,97,31,97,243,96,27,97,249,96,1,97,8,97,78,97,76,97,68,97,77,97,62,97,52,97,39,97,13,97,6,97,55,97,33,98,34,98,19,100,62,100,30,100,42,100,45,100,61,100,44,100,15,100,28,100,20,100,13,100,54,100,22,100,23,100,6,100,108,101,159,101,176,101,151,102,137,102,135,102,136,102,150,102,132,102,152,102,141,102,3,103,148,105,109,105,90,105,119,105,96,105,84,105,117,105,48,105,130,105,74,105,104,105,107,105,94,105,83,105,121,105,134,105,93,105,99,105,91,105,71,107,114,107,192,107,191,107,211,107,253,107,162,110,175,110,211,110,182,110,194,110,144,110,157,110,199,110,197,110,165,110,152,110,188,110,186,110,171,110,209,110,150,110,156,110,196,110,212,110,170,110,167,110,180,110,78,113,89,113,105,113,100,113,73,113,103,113,92,113,108,113,102,113,76,113,101,113,94,113,70,113,104,113,86,113,58,114,82,114,55,115,69,115,63,115,62,115,111,116,90,116,85,116,95,116,94,116,65,116,63,116,89,116,91,116,92,116,118,117,120,117,0,118,240,117,1,118,242,117,241,117,250,117,255,117,244,117,243,117,222,118,223,118,91,119,107,119,102,119,94,119,99,119,121,119,106,119,108,119,92,119,101,119,104,119,98,119,238,119,142,120,176,120,151,120,152,120,140,120,137,120,124,120,145,120,147,120,127,120,122,121,127,121,129,121,44,132,189,121,28,122,26,122,32,122,20,122,31,122,30,122,159,122,160,122,119,123,192,123,96,123,110,123,103,123,177,124,179,124,181,124,147,125,121,125,145,125,129,125,143,125,91,125,110,127,105,127,106,127,114,127,169,127,168,127,164,127,86,128,88,128,134,128,132,128,113,129,112,129,120,129,101,129,110,129,115,129,107,129,121,129,122,129,102,129,5,130,71,130,130,132,119,132,61,132,49,132,117,132,102,132,107,132,73,132,108,132,91,132,60,132,53,132,97,132,99,132,105,132,109,132,70,132,94,134,92,134,95,134,249,134,19,135,8,135,7,135,0,135,254,134,251,134,2,135,3,135,6,135,10,135,89,136,223,136,212,136,217,136,220,136,216,136,221,136,225,136,202,136,213,136,210,136,156,137,227,137,107,138,114,138,115,138,102,138,105,138,112,138,135,138,124,138,99,138,160,138,113,138,133,138,109,138,98,138,110,138,108,138,121,138,123,138,62,138,104,138,98,140,138,140,137,140,202,140,199,140,200,140,196,140,178,140,195,140,194,140,197,140,225,141,223,141,232,141,239,141,243,141,250,141,234,141,228,141,230,141,178,142,3,143,9,143,254,142,10,143,159,143,178,143,75,144,74,144,83,144,66,144,84,144,60,144,85,144,80,144,71,144,79,144,78,144,77,144,81,144,62,144,65,144,18,145,23,145,108,145,106,145,105,145,201,145,55,146,87,146,56,146,61,146,64,146,62,146,91,146,75,146,100,146,81,146,52,146,73,146,77,146,69,146,57,146,63,146,90,146,152,149,152,150,148,150,149,150,205,150,203,150,201,150,202,150,247,150,251,150,249,150,246,150,86,151,116,151,118,151,16,152,17,152,19,152,10,152,18,152,12,152,252,152,244,152,253,152,254,152,179,153,177,153,180,153,225,154,233,156,130,158,14,159,19,159,32,159,231,80,238,80,229,80,214,80,237,80,218,80,213,80,207,80,209,80,241,80,206,80,233,80,98,81,243,81,131,82,130,82,49,83,173,83,254,85,0,86,27,86,23,86,253,85,20,86,6,86,9,86,13,86,14,86,247,85,22,86,31,86,8,86,16,86,246,85,24,87,22,87,117,88,126,88,131,88,147,88,138,88,121,88,133,88,125,88,253,88,37,89,34,89,36,89,106,89,105,89,225,90,230,90,233,90,215,90,214,90,216,90,227,90,117,91,222,91,231,91,225,91,229,91,230,91,232,91,226,91,228,91,223,91,13,92,98,92,132,93,135,93,91,94,99,94,85,94,87,94,84,94,211,94,214,94,10,95,70,95,112,95,185,95,71,97,63,97,75,97,119,97,98,97,99,97,95,97,90,97,88,97,117,97,42,98,135,100,88,100,84,100,164,100,120,100,95,100,122,100,81,100,103,100,52,100,109,100,123,100,114,101,161,101,215,101,214,101,162,102,168,102,157,102,156,105,168,105,149,105,193,105,174,105,211,105,203,105,155,105,183,105,187,105,171,105,180,105,208,105,205,105,173,105,204,105,166,105,195,105,163,105,73,107,76,107,51,108,51,111,20,111,254,110,19,111,244,110,41,111,62,111,32,111,44,111,15,111,2,111,34,111,255,110,239,110,6,111,49,111,56,111,50,111,35,111,21,111,43,111,47,111,136,111,42,111,236,110,1,111,242,110,204,110,247,110,148,113,153,113,125,113,138,113,132,113,146,113,62,114,146,114,150,114,68,115,80,115,100,116,99,116,106,116,112,116,109,116,4,117,145,117,39,118,13,118,11,118,9,118,19,118,225,118,227,118,132,119,125,119,127,119,97,119,193,120,159,120,167,120,179,120,169,120,163,120,142,121,143,121,141,121,46,122,49,122,170,122,169,122,237,122,239,122,161,123,149,123,139,123,117,123,151,123,157,123,148,123,143,123,184,123,135,123,132,123,185,124,189,124,190,124,187,125,176,125,156,125,189,125,190,125,160,125,202,125,180,125,178,125,177,125,186,125,162,125,191,125,181,125,184,125,173,125,210,125,199,125,172,125,112,127,224,127,225,127,223,127,94,128,90,128,135,128,80,129,128,129,143,129,136,129,138,129,127,129,130,129,231,129,250,129,7,130,20,130,30,130,75,130,201,132,191,132,198,132,196,132,153,132,158,132,178,132,156,132,203,132,184,132,192,132,211,132,144,132,188,132,209,132,202,132,63,135,28,135,59,135,34,135,37,135,52,135,24,135,85,135,55,135,41,135,243,136,2,137,244,136,249,136,248,136,253,136,232,136,26,137,239,136,166,138,140,138,158,138,163,138,141,138,161,138,147,138,164,138,170,138,165,138,168,138,152,138,145,138,154,138,167,138,106,140,141,140,140,140,211,140,209,140,210,140,107,141,153,141,149,141,252,141,20,143,18,143,21,143,19,143,163,143,96,144,88,144,92,144,99,144,89,144,94,144,98,144,93,144,91,144,25,145,24,145,30,145,117,145,120,145,119,145,116,145,120,146,128,146,133,146,152,146,150,146,123,146,147,146,156,146,168,146,124,146,145,146,161,149,168,149,169,149,163,149,165,149,164,149,153,150,156,150,155,150,204,150,210,150,0,151,124,151,133,151,246,151,23,152,24,152,175,152,177,152,3,153,5,153,12,153,9,153,193,153,175,154,176,154,230,154,65,155,66,155,244,156,246,156,243,156,188,158,59,159,74,159,4,81,0,81,251,80,245,80,249,80,2,81,8,81,9,81,5,81,220,81,135,82,136,82,137,82,141,82,138,82,240,82,178,83,46,86,59,86,57,86,50,86,63,86,52,86,41,86,83,86,78,86,87,86,116,86,54,86,47,86,48,86,128,88,159,88,158,88,179,88,156,88,174,88,169,88,166,88,109,89,9,91,251,90,11,91,245,90,12,91,8,91,238,91,236,91,233,91,235,91,100,92,101,92,157,93,148,93,98,94,95,94,97,94,226,94,218,94,223,94,221,94,227,94,224,94,72,95,113,95,183,95,181,95,118,97,103,97,110,97,93,97,85,97,130,97,124,97,112,97,107,97,126,97,167,97,144,97,171,97,142,97,172,97,154,97,164,97,148,97,174,97,46,98,105,100,111,100,121,100,158,100,178,100,136,100,144,100,176,100,165,100,147,100,149,100,169,100,146,100,174,100,173,100,171,100,154,100,172,100,153,100,162,100,179,100,117,101,119,101,120,101,174,102,171,102,180,102,177,102,35,106,31,106,232,105,1,106,30,106,25,106,253,105,33,106,19,106,10,106,243,105,2,106,5,106,237,105,17,106,80,107,78,107,164,107,197,107,198,107,63,111,124,111,132,111,81,111,102,111,84,111,134,111,109,111,91,111,120,111,110,111,142,111,122,111,112,111,100,111,151,111,88,111,213,110,111,111,96,111,95,111,159,113,172,113,177,113,168,113,86,114,155,114,78,115,87,115,105,116,139,116,131,116,126,116,128,116,127,117,32,118,41,118,31,118,36,118,38,118,33,118,34,118,154,118,186,118,228,118,142,119,135,119,140,119,145,119,139,119,203,120,197,120,186,120,202,120,190,120,213,120,188,120,208,120,63,122,60,122,64,122,61,122,55,122,59,122,175,122,174,122,173,123,177,123,196,123,180,123,198,123,199,123,193,123,160,123,204,123,202,124,224,125,244,125,239,125,251,125,216,125,236,125,221,125,232,125,227,125,218,125,222,125,233,125,158,125,217,125,242,125,249,125,117,127,119,127,175,127,233,127,38,128,155,129,156,129,157,129,160,129,154,129,152,129,23,133,61,133,26,133,238,132,44,133,45,133,19,133,17,133,35,133,33,133,20,133,236,132,37,133,255,132,6,133,130,135,116,135,118,135,96,135,102,135,120,135,104,135,89,135,87,135,76,135,83,135,91,136,93,136,16,137,7,137,18,137,19,137,21,137,10,137,188,138,210,138,199,138,196,138,149,138,203,138,248,138,178,138,201,138,194,138,191,138,176,138,214,138,205,138,182,138,185,138,219,138,76,140,78,140,108,140,224,140,222,140,230,140,228,140,236,140,237,140,226,140,227,140,220,140,234,140,225,140,109,141,159,141,163,141,43,142,16,142,29,142,34,142,15,142,41,142,31,142,33,142,30,142,186,142,29,143,27,143,31,143,41,143,38,143,42,143,28,143,30,143,37,143,105,144,110,144,104,144,109,144,119,144,48,145,45,145,39,145,49,145,135,145,137,145,139,145,131,145,197,146,187,146,183,146,234,146,172,146,228,146,193,146,179,146,188,146,210,146,199,146,240,146,178,146,173,149,177,149,4,151,6,151,7,151,9,151,96,151,141,151,139,151,143,151,33,152,43,152,28,152,179,152,10,153,19,153,18,153,24,153,221,153,208,153,223,153,219,153,209,153,213,153,210,153,217,153,183,154,238,154,239,154,39,155,69,155,68,155,119,155,111,155,6,157,9,157,3,157,169,158,190,158,206,158,168,88,82,159,18,81,24,81,20,81,16,81,21,81,128,81,170,81,221,81,145,82,147,82,243,82,89,86,107,86,121,86,105,86,100,86,120,86,106,86,104,86,101,86,113,86,111,86,108,86,98,86,118,86,193,88,190,88,199,88,197,88,110,89,29,91,52,91,120,91,240,91,14,92,74,95,178,97,145,97,169,97,138,97,205,97,182,97,190,97,202,97,200,97,48,98,197,100,193,100,203,100,187,100,188,100,218,100,196,100,199,100,194,100,205,100,191,100,210,100,212,100,190,100,116,101,198,102,201,102,185,102,196,102,199,102,184,102,61,106,56,106,58,106,89,106,107,106,88,106,57,106,68,106,98,106,97,106,75,106,71,106,53,106,95,106,72,106,89,107,119,107,5,108,194,111,177,111,161,111,195,111,164,111,193,111,167,111,179,111,192,111,185,111,182,111,166,111,160,111,180,111,190,113,201,113,208,113,210,113,200,113,213,113,185,113,206,113,217,113,220,113,195,113,196,113,104,115,156,116,163,116,152,116,159,116,158,116,226,116,12,117,13,117,52,118,56,118,58,118,231,118,229,118,160,119,158,119,159,119,165,119,232,120,218,120,236,120,231,120,166,121,77,122,78,122,70,122,76,122,75,122,186,122,217,123,17,124,201,123,228,123,219,123,225,123,233,123,230,123,213,124,214,124,10,126,17,126,8,126,27,126,35,126,30,126,29,126,9,126,16,126,121,127,178,127,240,127,241,127,238,127,40,128,179,129,169,129,168,129,251,129,8,130,88,130,89,130,74,133,89,133,72,133,104,133,105,133,67,133,73,133,109,133,106,133,94,133,131,135,159,135,158,135,162,135,141,135,97,136,42,137,50,137,37,137,43,137,33,137,170,137,166,137,230,138,250,138,235,138,241,138,0,139,220,138,231,138,238,138,254,138,1,139,2,139,247,138,237,138,243,138,246,138,252,138,107,140,109,140,147,140,244,140,68,142,49,142,52,142,66,142,57,142,53,142,59,143,47,143,56,143,51,143,168,143,166,143,117,144,116,144,120,144,114,144,124,144,122,144,52,145,146,145,32,147,54,147,248,146,51,147,47,147,34,147,252,146,43,147,4,147,26,147,16,147,38,147,33,147,21,147,46,147,25,147,187,149,167,150,168,150,170,150,213,150,14,151,17,151,22,151,13,151,19,151,15,151,91,151,92,151,102,151,152,151,48,152,56,152,59,152,55,152,45,152,57,152,36,152,16,153,40,153,30,153,27,153,33,153,26,153,237,153,226,153,241,153,184,154,188,154,251,154,237,154,40,155,145,155,21,157,35,157,38,157,40,157,18,157,27,157,216,158,212,158,141,159,156,159,42,81,31,81,33,81,50,81,245,82,142,86,128,86,144,86,133,86,135,86,143,86,213,88,211,88,209,88,206,88,48,91,42,91,36,91,122,91,55,92,104,92,188,93,186,93,189,93,184,93,107,94,76,95,189,95,201,97,194,97,199,97,230,97,203,97,50,98,52,98,206,100,202,100,216,100,224,100,240,100,230,100,236,100,241,100,226,100,237,100,130,101,131,101,217,102,214,102,128,106,148,106,132,106,162,106,156,106,219,106,163,106,126,106,151,106,144,106,160,106,92,107,174,107,218,107,8,108,216,111,241,111,223,111,224,111,219,111,228,111,235,111,239,111,128,111,236,111,225,111,233,111,213,111,238,111,240,111,231,113,223,113,238,113,230,113,229,113,237,113,236,113,244,113,224,113,53,114,70,114,112,115,114,115,169,116,176,116,166,116,168,116,70,118,66,118,76,118,234,118,179,119,170,119,176,119,172,119,167,119,173,119,239,119,247,120,250,120,244,120,239,120,1,121,167,121,170,121,87,122,191,122,7,124,13,124,254,123,247,123,12,124,224,123,224,124,220,124,222,124,226,124,223,124,217,124,221,124,46,126,62,126,70,126,55,126,50,126,67,126,43,126,61,126,49,126,69,126,65,126,52,126,57,126,72,126,53,126,63,126,47,126,68,127,243,127,252,127,113,128,114,128,112,128,111,128,115,128,198,129,195,129,186,129,194,129,192,129,191,129,189,129,201,129,190,129,232,129,9,130,113,130,170,133,132,133,126,133,156,133,145,133,148,133,175,133,155,133,135,133,168,133,138,133,103,134,192,135,209,135,179,135,210,135,198,135,171,135,187,135,186,135,200,135,203,135,59,137,54,137,68,137,56,137,61,137,172,137,14,139,23,139,25,139,27,139,10,139,32,139,29,139,4,139,16,139,65,140,63,140,115,140,250,140,253,140,252,140,248,140,251,140,168,141,73,142,75,142,72,142,74,142,68,143,62,143,66,143,69,143,63,143,127,144,125,144,132,144,129,144,130,144,128,144,57,145,163,145,158,145,156,145,77,147,130,147,40,147,117,147,74,147,101,147,75,147,24,147,126,147,108,147,91,147,112,147,90,147,84,147,202,149,203,149,204,149,200,149,198,149,177,150,184,150,214,150,28,151,30,151,160,151,211,151,70,152,182,152,53,153,1,154,255,153,174,155,171,155,170,155,173,155,59,157,63,157,139,158,207,158,222,158,220,158,221,158,219,158,62,159,75,159,226,83,149,86,174,86,217,88,216,88,56,91,93,95,227,97,51,98,244,100,242,100,254,100,6,101,250,100,251,100,247,100,183,101,220,102,38,103,179,106,172,106,195,106,187,106,184,106,194,106,174,106,175,106,95,107,120,107,175,107,9,112,11,112,254,111,6,112,250,111,17,112,15,112,251,113,252,113,254,113,248,113,119,115,117,115,167,116,191,116,21,117,86,118,88,118,82,118,189,119,191,119,187,119,188,119,14,121,174,121,97,122,98,122,96,122,196,122,197,122,43,124,39,124,42,124,30,124,35,124,33,124,231,124,84,126,85,126,94,126,90,126,97,126,82,126,89,126,72,127,249,127,251,127,119,128,118,128,205,129,207,129,10,130,207,133,169,133,205,133,208,133,201,133,176,133,186,133,185,133,166,133,239,135,236,135,242,135,224,135,134,137,178,137,244,137,40,139,57,139,44,139,43,139,80,140,5,141,89,142,99,142,102,142,100,142,95,142,85,142,192,142,73,143,77,143,135,144,131,144,136,144,171,145,172,145,208,145,148,147,138,147,150,147,162,147,179,147,174,147,172,147,176,147,152,147,154,147,151,147,212,149,214,149,208,149,213,149,226,150,220,150,217,150,219,150,222,150,36,151,163,151,166,151,173,151,249,151,77,152,79,152,76,152,78,152,83,152,186,152,62,153,63,153,61,153,46,153,165,153,14,154,193,154,3,155,6,155,79,155,78,155,77,155,202,155,201,155,253,155,200,155], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+78572);
/* memory initializer */ allocate([192,155,81,157,93,157,96,157,224,158,21,159,44,159,51,81,165,86,222,88,223,88,226,88,245,91,144,159,236,94,242,97,247,97,246,97,245,97,0,101,15,101,224,102,221,102,229,106,221,106,218,106,211,106,27,112,31,112,40,112,26,112,29,112,21,112,24,112,6,114,13,114,88,114,162,114,120,115,122,115,189,116,202,116,227,116,135,117,134,117,95,118,97,118,199,119,25,121,177,121,107,122,105,122,62,124,63,124,56,124,61,124,55,124,64,124,107,126,109,126,121,126,105,126,106,126,133,127,115,126,182,127,185,127,184,127,216,129,233,133,221,133,234,133,213,133,228,133,229,133,247,133,251,135,5,136,13,136,249,135,254,135,96,137,95,137,86,137,94,137,65,139,92,139,88,139,73,139,90,139,78,139,79,139,70,139,89,139,8,141,10,141,124,142,114,142,135,142,118,142,108,142,122,142,116,142,84,143,78,143,173,143,138,144,139,144,177,145,174,145,225,147,209,147,223,147,195,147,200,147,220,147,221,147,214,147,226,147,205,147,216,147,228,147,215,147,232,147,220,149,180,150,227,150,42,151,39,151,97,151,220,151,251,151,94,152,88,152,91,152,188,152,69,153,73,153,22,154,25,154,13,155,232,155,231,155,214,155,219,155,137,157,97,157,114,157,106,157,108,157,146,158,151,158,147,158,180,158,248,82,168,86,183,86,182,86,180,86,188,86,228,88,64,91,67,91,125,91,246,91,201,93,248,97,250,97,24,101,20,101,25,101,230,102,39,103,236,106,62,112,48,112,50,112,16,114,123,115,207,116,98,118,101,118,38,121,42,121,44,121,43,121,199,122,246,122,76,124,67,124,77,124,239,124,240,124,174,143,125,126,124,126,130,126,76,127,0,128,218,129,102,130,251,133,249,133,17,134,250,133,6,134,11,134,7,134,10,134,20,136,21,136,100,137,186,137,248,137,112,139,108,139,102,139,111,139,95,139,107,139,15,141,13,141,137,142,129,142,133,142,130,142,180,145,203,145,24,148,3,148,253,147,225,149,48,151,196,152,82,153,81,153,168,153,43,154,48,154,55,154,53,154,19,156,13,156,121,158,181,158,232,158,47,159,95,159,99,159,97,159,55,81,56,81,193,86,192,86,194,86,20,89,108,92,205,93,252,97,254,97,29,101,28,101,149,101,233,102,251,106,4,107,250,106,178,107,76,112,27,114,167,114,214,116,212,116,105,118,211,119,80,124,143,126,140,126,188,127,23,134,45,134,26,134,35,136,34,136,33,136,31,136,106,137,108,137,189,137,116,139,119,139,125,139,19,141,138,142,141,142,139,142,95,143,175,143,186,145,46,148,51,148,53,148,58,148,56,148,50,148,43,148,226,149,56,151,57,151,50,151,255,151,103,152,101,152,87,153,69,154,67,154,64,154,62,154,207,154,84,155,81,155,45,156,37,156,175,157,180,157,194,157,184,157,157,158,239,158,25,159,92,159,102,159,103,159,60,81,59,81,200,86,202,86,201,86,127,91,212,93,210,93,78,95,255,97,36,101,10,107,97,107,81,112,88,112,128,115,228,116,138,117,110,118,108,118,179,121,96,124,95,124,126,128,125,128,223,129,114,137,111,137,252,137,128,139,22,141,23,141,145,142,147,142,97,143,72,145,68,148,81,148,82,148,61,151,62,151,195,151,193,151,107,152,85,153,85,154,77,154,210,154,26,155,73,156,49,156,62,156,59,156,211,157,215,157,52,159,108,159,106,159,148,159,204,86,214,93,0,98,35,101,43,101,42,101,236,102,16,107,218,116,202,122,100,124,99,124,101,124,147,126,150,126,148,126,226,129,56,134,63,134,49,136,138,139,144,144,143,144,99,148,96,148,100,148,104,151,111,152,92,153,90,154,91,154,87,154,211,154,212,154,209,154,84,156,87,156,86,156,229,157,159,158,244,158,209,86,233,88,44,101,94,112,113,118,114,118,215,119,80,127,136,127,54,136,57,136,98,136,147,139,146,139,150,139,119,130,27,141,192,145,106,148,66,151,72,151,68,151,198,151,112,152,95,154,34,155,88,155,95,156,249,157,250,157,124,158,125,158,7,159,119,159,114,159,243,94,22,107,99,112,108,124,110,124,59,136,192,137,161,142,193,145,114,148,112,148,113,152,94,153,214,154,35,155,204,158,100,112,218,119,154,139,119,148,201,151,98,154,101,154,156,126,156,139,170,142,197,145,125,148,126,148,124,148,119,156,120,156,247,158,84,140,127,148,26,158,40,114,106,154,49,155,27,158,30,158,114,124,96,36,97,36,98,36,99,36,100,36,101,36,102,36,103,36,104,36,105,36,116,36,117,36,118,36,119,36,120,36,121,36,122,36,123,36,124,36,125,36,112,33,113,33,114,33,115,33,116,33,117,33,118,33,119,33,120,33,121,33,54,78,63,78,133,78,160,78,130,81,150,81,171,81,249,82,56,83,105,83,182,83,10,89,128,91,219,93,122,94,127,94,244,94,80,95,97,95,52,101,224,101,146,117,118,118,181,143,182,150,168,0,198,2,253,48,254,48,157,48,158,48,0,0,0,0,5,48,6,48,7,48,252,48,59,255,61,255,61,39,65,48,66,48,67,48,68,48,69,48,70,48,71,48,72,48,73,48,74,48,75,48,76,48,77,48,78,48,79,48,80,48,81,48,82,48,83,48,84,48,85,48,86,48,87,48,88,48,89,48,90,48,91,48,92,48,93,48,94,48,95,48,96,48,97,48,98,48,99,48,100,48,101,48,102,48,103,48,104,48,105,48,106,48,107,48,108,48,109,48,110,48,111,48,112,48,113,48,114,48,115,48,116,48,117,48,118,48,119,48,120,48,121,48,122,48,123,48,124,48,125,48,126,48,127,48,128,48,129,48,130,48,131,48,132,48,133,48,134,48,135,48,136,48,137,48,138,48,139,48,140,48,141,48,142,48,143,48,144,48,145,48,146,48,147,48,161,48,162,48,163,48,164,48,165,48,166,48,167,48,168,48,169,48,170,48,171,48,172,48,173,48,174,48,175,48,176,48,177,48,178,48,179,48,180,48,181,48,182,48,183,48,184,48,185,48,186,48,187,48,188,48,189,48,190,48,191,48,192,48,193,48,194,48,195,48,196,48,197,48,198,48,199,48,200,48,201,48,202,48,203,48,204,48,205,48,206,48,207,48,208,48,209,48,210,48,211,48,212,48,213,48,214,48,215,48,216,48,217,48,218,48,219,48,220,48,221,48,222,48,223,48,224,48,225,48,226,48,227,48,228,48,229,48,230,48,231,48,232,48,233,48,234,48,235,48,236,48,237,48,238,48,239,48,240,48,241,48,242,48,243,48,244,48,245,48,246,48,16,4,17,4,18,4,19,4,20,4,21,4,1,4,22,4,23,4,24,4,25,4,26,4,27,4,28,4,29,4,30,4,31,4,32,4,33,4,34,4,35,4,36,4,37,4,38,4,39,4,40,4,41,4,42,4,43,4,44,4,45,4,46,4,47,4,48,4,49,4,50,4,51,4,52,4,53,4,81,4,54,4,55,4,56,4,57,4,58,4,59,4,60,4,61,4,62,4,63,4,64,4,65,4,66,4,67,4,68,4,69,4,70,4,71,4,72,4,73,4,74,4,75,4,76,4,77,4,78,4,79,4,231,33,184,33,185,33,207,49,204,0,90,78,138,0,2,82,145,68,176,159,136,81,177,159,7,118,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,226,255,228,255,7,255,2,255,49,50,22,33,33,33,155,48,156,48,128,46,132,46,134,46,135,46,136,46,138,46,140,46,141,46,149,46,156,46,157,46,165,46,167,46,170,46,172,46,174,46,182,46,188,46,190,46,198,46,202,46,204,46,205,46,207,46,214,46,215,46,222,46,227,46,0,0,0,0,0,0,131,2,80,2,91,2,84,2,117,2,83,1,248,0,75,1,138,2,106,2,66,78,92,78,245,81,26,83,130,83,7,78,12,78,71,78,141,78,215,86,12,250,110,92,115,95,15,78,135,81,14,78,46,78,147,78,194,78,201,78,200,78,152,81,252,82,108,83,185,83,32,87,3,89,44,89,16,92,255,93,225,101,179,107,204,107,20,108,63,114,49,78,60,78,232,78,220,78,233,78,225,78,221,78,218,78,12,82,28,83,76,83,34,87,35,87,23,89,47,89,129,91,132,91,18,92,59,92,116,92,115,92,4,94,128,94,130,94,201,95,9,98,80,98,21,108,54,108,67,108,63,108,59,108,174,114,176,114,138,115,184,121,138,128,30,150,14,79,24,79,44,79,245,78,20,79,241,78,0,79,247,78,8,79,29,79,2,79,5,79,34,79,19,79,4,79,244,78,18,79,177,81,19,82,9,82,16,82,166,82,34,83,31,83,77,83,138,83,7,84,225,86,223,86,46,87,42,87,52,87,60,89,128,89,124,89,133,89,123,89,126,89,119,89,127,89,86,91,21,92,37,92,124,92,122,92,123,92,126,92,223,93,117,94,132,94,2,95,26,95,116,95,213,95,212,95,207,95,92,98,94,98,100,98,97,98,102,98,98,98,89,98,96,98,90,98,101,98,239,101,238,101,62,103,57,103,56,103,59,103,58,103,63,103,60,103,51,103,24,108,70,108,82,108,92,108,79,108,74,108,84,108,75,108,76,108,113,112,94,114,180,114,181,114,142,115,42,117,127,118,117,122,81,127,120,130,124,130,128,130,125,130,127,130,77,134,126,137,153,144,151,144,152,144,155,144,148,144,34,150,36,150,32,150,35,150,86,79,59,79,98,79,73,79,83,79,100,79,62,79,103,79,82,79,95,79,65,79,88,79,45,79,51,79,63,79,97,79,143,81,185,81,28,82,30,82,33,82,173,82,174,82,9,83,99,83,114,83,142,83,143,83,48,84,55,84,42,84,84,84,69,84,25,84,28,84,37,84,24,84,61,84,79,84,65,84,40,84,36,84,71,84,238,86,231,86,229,86,65,87,69,87,76,87,73,87,75,87,82,87,6,89,64,89,166,89,152,89,160,89,151,89,142,89,162,89,144,89,143,89,167,89,161,89,142,91,146,91,40,92,42,92,141,92,143,92,136,92,139,92,137,92,146,92,138,92,134,92,147,92,149,92,224,93,10,94,14,94,139,94,137,94,140,94,136,94,141,94,5,95,29,95,120,95,118,95,210,95,209,95,208,95,237,95,232,95,238,95,243,95,225,95,228,95,227,95,250,95,239,95,247,95,251,95,0,96,244,95,58,98,131,98,140,98,142,98,143,98,148,98,135,98,113,98,123,98,122,98,112,98,129,98,136,98,119,98,125,98,114,98,116,98,55,101,240,101,244,101,243,101,242,101,245,101,69,103,71,103,89,103,85,103,76,103,72,103,93,103,77,103,90,103,75,103,208,107,25,108,26,108,120,108,103,108,107,108,132,108,139,108,143,108,113,108,111,108,105,108,154,108,109,108,135,108,149,108,156,108,102,108,115,108,101,108,123,108,142,108,116,112,122,112,99,114,191,114,189,114,195,114,198,114,193,114,186,114,197,114,149,115,151,115,147,115,148,115,146,115,58,117,57,117,148,117,149,117,129,118,61,121,52,128,149,128,153,128,144,128,146,128,156,128,144,130,143,130,133,130,142,130,145,130,147,130,138,130,131,130,132,130,120,140,201,143,191,143,159,144,161,144,165,144,158,144,167,144,160,144,48,150,40,150,47,150,45,150,51,78,152,79,124,79,133,79,125,79,128,79,135,79,118,79,116,79,137,79,132,79,119,79,76,79,151,79,106,79,154,79,121,79,129,79,120,79,144,79,156,79,148,79,158,79,146,79,130,79,149,79,107,79,110,79,158,81,188,81,190,81,53,82,50,82,51,82,70,82,49,82,188,82,10,83,11,83,60,83,146,83,148,83,135,84,127,84,129,84,145,84,130,84,136,84,107,84,122,84,126,84,101,84,108,84,116,84,102,84,141,84,111,84,97,84,96,84,152,84,99,84,103,84,100,84,247,86,249,86,111,87,114,87,109,87,107,87,113,87,112,87,118,87,128,87,117,87,123,87,115,87,116,87,98,87,104,87,125,87,12,89,69,89,181,89,186,89,207,89,206,89,178,89,204,89,193,89,182,89,188,89,195,89,214,89,177,89,189,89,192,89,200,89,180,89,199,89,98,91,101,91,147,91,149,91,68,92,71,92,174,92,164,92,160,92,181,92,175,92,168,92,172,92,159,92,163,92,173,92,162,92,170,92,167,92,157,92,165,92,182,92,176,92,166,92,23,94,20,94,25,94,40,95,34,95,35,95,36,95,84,95,130,95,126,95,125,95,222,95,229,95,45,96,38,96,25,96,50,96,11,96,52,96,10,96,23,96,51,96,26,96,30,96,44,96,34,96,13,96,16,96,46,96,19,96,17,96,12,96,9,96,28,96,20,98,61,98,173,98,180,98,209,98,190,98,170,98,182,98,202,98,174,98,179,98,175,98,187,98,169,98,176,98,184,98,61,101,168,101,187,101,9,102,252,101,4,102,18,102,8,102,251,101,3,102,11,102,13,102,5,102,253,101,17,102,16,102,246,102,10,103,133,103,108,103,142,103,146,103,118,103,123,103,152,103,134,103,132,103,116,103,141,103,140,103,122,103,159,103,145,103,153,103,131,103,125,103,129,103,120,103,121,103,148,103,37,107,128,107,126,107,222,107,29,108,147,108,236,108,235,108,238,108,217,108,182,108,212,108,173,108,231,108,183,108,208,108,194,108,186,108,195,108,198,108,237,108,242,108,210,108,221,108,180,108,138,108,157,108,128,108,222,108,192,108,48,109,205,108,199,108,176,108,249,108,207,108,233,108,209,108,148,112,152,112,133,112,147,112,134,112,132,112,145,112,150,112,130,112,154,112,131,112,106,114,214,114,203,114,216,114,201,114,220,114,210,114,212,114,218,114,204,114,209,114,164,115,161,115,173,115,166,115,162,115,160,115,172,115,157,115,221,116,232,116,63,117,64,117,62,117,140,117,152,117,175,118,243,118,241,118,240,118,245,118,248,119,252,119,249,119,251,119,250,119,247,119,66,121,63,121,197,121,120,122,123,122,251,122,117,124,253,124,53,128,143,128,174,128,163,128,184,128,181,128,173,128,32,130,160,130,192,130,171,130,154,130,152,130,155,130,181,130,167,130,174,130,188,130,158,130,186,130,180,130,168,130,161,130,169,130,194,130,164,130,195,130,182,130,162,130,112,134,111,134,109,134,110,134,86,140,210,143,203,143,211,143,205,143,214,143,213,143,215,143,178,144,180,144,175,144,179,144,176,144,57,150,61,150,60,150,58,150,67,150,205,79,197,79,211,79,178,79,201,79,203,79,193,79,212,79,220,79,217,79,187,79,179,79,219,79,199,79,214,79,186,79,192,79,185,79,236,79,68,82,73,82,192,82,194,82,61,83,124,83,151,83,150,83,153,83,152,83,186,84,161,84,173,84,165,84,207,84,195,84,13,131,183,84,174,84,214,84,182,84,197,84,198,84,160,84,112,84,188,84,162,84,190,84,114,84,222,84,176,84,181,87,158,87,159,87,164,87,140,87,151,87,157,87,155,87,148,87,152,87,143,87,153,87,165,87,154,87,149,87,244,88,13,89,83,89,225,89,222,89,238,89,0,90,241,89,221,89,250,89,253,89,252,89,246,89,228,89,242,89,247,89,219,89,233,89,243,89,245,89,224,89,254,89,244,89,237,89,168,91,76,92,208,92,216,92,204,92,215,92,203,92,219,92,222,92,218,92,201,92,199,92,202,92,214,92,211,92,212,92,207,92,200,92,198,92,206,92,223,92,248,92,249,93,33,94,34,94,35,94,32,94,36,94,176,94,164,94,162,94,155,94,163,94,165,94,7,95,46,95,86,95,134,95,55,96,57,96,84,96,114,96,94,96,69,96,83,96,71,96,73,96,91,96,76,96,64,96,66,96,95,96,36,96,68,96,88,96,102,96,110,96,66,98,67,98,207,98,13,99,11,99,245,98,14,99,3,99,235,98,249,98,15,99,12,99,248,98,246,98,0,99,19,99,20,99,250,98,21,99,251,98,240,98,65,101,67,101,170,101,191,101,54,102,33,102,50,102,53,102,28,102,38,102,34,102,51,102,43,102,58,102,29,102,52,102,57,102,46,102,15,103,16,103,193,103,242,103,200,103,186,103,220,103,187,103,248,103,216,103,192,103,183,103,197,103,235,103,228,103,223,103,181,103,205,103,179,103,247,103,246,103,238,103,227,103,194,103,185,103,206,103,231,103,240,103,178,103,252,103,198,103,237,103,204,103,174,103,230,103,219,103,250,103,201,103,202,103,195,103,234,103,203,103,40,107,130,107,132,107,182,107,214,107,216,107,224,107,32,108,33,108,40,109,52,109,45,109,31,109,60,109,63,109,18,109,10,109,218,108,51,109,4,109,25,109,58,109,26,109,17,109,0,109,29,109,66,109,1,109,24,109,55,109,3,109,15,109,64,109,7,109,32,109,44,109,8,109,34,109,9,109,16,109,183,112,159,112,190,112,177,112,176,112,161,112,180,112,181,112,169,112,65,114,73,114,74,114,108,114,112,114,115,114,110,114,202,114,228,114,232,114,235,114,223,114,234,114,230,114,227,114,133,115,204,115,194,115,200,115,197,115,185,115,182,115,181,115,180,115,235,115,191,115,199,115,190,115,195,115,198,115,184,115,203,115,236,116,238,116,46,117,71,117,72,117,167,117,170,117,121,118,196,118,8,119,3,119,4,119,5,119,10,119,247,118,251,118,250,118,231,119,232,119,6,120,17,120,18,120,5,120,16,120,15,120,14,120,9,120,3,120,19,120,74,121,76,121,75,121,69,121,68,121,213,121,205,121,207,121,214,121,206,121,128,122,126,122,209,122,0,123,1,123,122,124,120,124,121,124,127,124,128,124,129,124,3,125,8,125,1,125,88,127,145,127,141,127,190,127,7,128,14,128,15,128,20,128,55,128,216,128,199,128,224,128,209,128,200,128,194,128,208,128,197,128,227,128,217,128,220,128,202,128,213,128,201,128,207,128,215,128,230,128,205,128,255,129,33,130,148,130,217,130,254,130,249,130,7,131,232,130,0,131,213,130,58,131,235,130,214,130,244,130,236,130,225,130,242,130,245,130,12,131,251,130,246,130,240,130,234,130,228,130,224,130,250,130,243,130,237,130,119,134,116,134,124,134,115,134,65,136,78,136,103,136,106,136,105,136,211,137,4,138,7,138,114,141,227,143,225,143,238,143,224,143,241,144,189,144,191,144,213,144,197,144,190,144,199,144,203,144,200,144,212,145,211,145,84,150,79,150,81,150,83,150,74,150,78,150,30,80,5,80,7,80,19,80,34,80,48,80,27,80,245,79,244,79,51,80,55,80,44,80,246,79,247,79,23,80,28,80,32,80,39,80,53,80,47,80,49,80,14,80,90,81,148,81,147,81,202,81,196,81,197,81,200,81,206,81,97,82,90,82,82,82,94,82,95,82,85,82,98,82,205,82,14,83,158,83,38,85,226,84,23,85,18,85,231,84,243,84,228,84,26,85,255,84,4,85,8,85,235,84,17,85,5,85,241,84,10,85,251,84,247,84,248,84,224,84,14,85,3,85,11,85,1,87,2,87,204,87,50,88,213,87,210,87,186,87,198,87,189,87,188,87,184,87,182,87,191,87,199,87,208,87,185,87,193,87,14,89,74,89,25,90,22,90,45,90,46,90,21,90,15,90,23,90,10,90,30,90,51,90,108,91,167,91,173,91,172,91,3,92,86,92,84,92,236,92,255,92,238,92,241,92,247,92,0,93,249,92,41,94,40,94,168,94,174,94,170,94,172,94,51,95,48,95,103,95,93,96,90,96,103,96,65,96,162,96,136,96,128,96,146,96,129,96,157,96,131,96,149,96,155,96,151,96,135,96,156,96,142,96,25,98,70,98,242,98,16,99,86,99,44,99,68,99,69,99,54,99,67,99,228,99,57,99,75,99,74,99,60,99,41,99,65,99,52,99,88,99,84,99,89,99,45,99,71,99,51,99,90,99,81,99,56,99,87,99,64,99,72,99,74,101,70,101,198,101,195,101,196,101,194,101,74,102,95,102,71,102,81,102,18,103,19,103,31,104,26,104,73,104,50,104,51,104,59,104,75,104,79,104,22,104,49,104,28,104,53,104,43,104,45,104,47,104,78,104,68,104,52,104,29,104,18,104,20,104,38,104,40,104,46,104,77,104,58,104,37,104,32,104,44,107,47,107,45,107,49,107,52,107,109,107,130,128,136,107,230,107,228,107,232,107,227,107,226,107,231,107,37,108,122,109,99,109,100,109,118,109,13,109,97,109,146,109,88,109,98,109,109,109,111,109,145,109,141,109,239,109,127,109,134,109,94,109,103,109,96,109,151,109,112,109,124,109,95,109,130,109,152,109,47,109,104,109,139,109,126,109,128,109,132,109,22,109,131,109,123,109,125,109,117,109,144,109,220,112,211,112,209,112,221,112,203,112,57,127,226,112,215,112,210,112,222,112,224,112,212,112,205,112,197,112,198,112,199,112,218,112,206,112,225,112,66,114,120,114,119,114,118,114,0,115,250,114,244,114,254,114,246,114,243,114,251,114,1,115,211,115,217,115,229,115,214,115,188,115,231,115,227,115,233,115,220,115,210,115,219,115,212,115,221,115,218,115,215,115,216,115,232,115,222,116,223,116,244,116,245,116,33,117,91,117,95,117,176,117,193,117,187,117,196,117,192,117,191,117,182,117,186,117,138,118,201,118,29,119,27,119,16,119,19,119,18,119,35,119,17,119,21,119,25,119,26,119,34,119,39,119,35,120,44,120,34,120,53,120,47,120,40,120,46,120,43,120,33,120,41,120,51,120,42,120,49,120,84,121,91,121,79,121,92,121,83,121,82,121,81,121,235,121,236,121,224,121,238,121,237,121,234,121,220,121,222,121,221,121,134,122,137,122,133,122,139,122,140,122,138,122,135,122,216,122,16,123,4,123,19,123,5,123,15,123,8,123,10,123,14,123,9,123,18,123,132,124,145,124,138,124,140,124,136,124,141,124,133,124,30,125,29,125,17,125,14,125,24,125,22,125,19,125,31,125,18,125,15,125,12,125,92,127,97,127,94,127,96,127,93,127,91,127,150,127,146,127,195,127,194,127,192,127,22,128,62,128,57,128,250,128,242,128,249,128,245,128,1,129,251,128,0,129,1,130,47,130,37,130,51,131,45,131,68,131,25,131,81,131,37,131,86,131,63,131,65,131,38,131,28,131,34,131,66,131,78,131,27,131,42,131,8,131,60,131,77,131,22,131,36,131,32,131,55,131,47,131,41,131,71,131,69,131,76,131,83,131,30,131,44,131,75,131,39,131,72,131,83,134,82,134,162,134,168,134,150,134,141,134,145,134,158,134,135,134,151,134,134,134,139,134,154,134,133,134,165,134,153,134,161,134,167,134,149,134,152,134,142,134,157,134,144,134,148,134,67,136,68,136,109,136,117,136,118,136,114,136,128,136,113,136,127,136,111,136,131,136,126,136,116,136,124,136,18,138,71,140,87,140,123,140,164,140,163,140,118,141,120,141,181,141,183,141,182,141,209,142,211,142,254,143,245,143,2,144,255,143,251,143,4,144,252,143,246,143,214,144,224,144,217,144,218,144,227,144,223,144,229,144,216,144,219,144,215,144,220,144,228,144,80,145,78,145,79,145,213,145,226,145,218,145,92,150,95,150,188,150,227,152,223,154,47,155,127,78,112,80,106,80,97,80,94,80,96,80,83,80,75,80,93,80,114,80,72,80,77,80,65,80,91,80,74,80,98,80,21,80,69,80,95,80,105,80,107,80,99,80,100,80,70,80,64,80,110,80,115,80,87,80,81,80,208,81,107,82,109,82,108,82,110,82,214,82,211,82,45,83,156,83,117,85,118,85,60,85,77,85,80,85,52,85,42,85,81,85,98,85,54,85,53,85,48,85,82,85,69,85,12,85,50,85,101,85,78,85,57,85,72,85,45,85,59,85,64,85,75,85,10,87,7,87,251,87,20,88,226,87,246,87,220,87,244,87,0,88,237,87,253,87,8,88,248,87,11,88,243,87,207,87,7,88,238,87,227,87,242,87,229,87,236,87,225,87,14,88,252,87,16,88,231,87,1,88,12,88,241,87,233,87,240,87,13,88,4,88,92,89,96,90,88,90,85,90,103,90,94,90,56,90,53,90,109,90,80,90,95,90,101,90,108,90,83,90,100,90,87,90,67,90,93,90,82,90,68,90,91,90,72,90,142,90,62,90,77,90,57,90,76,90,112,90,105,90,71,90,81,90,86,90,66,90,92,90,114,91,110,91,193,91,192,91,89,92,30,93,11,93,29,93,26,93,32,93,12,93,40,93,13,93,38,93,37,93,15,93,48,93,18,93,35,93,31,93,46,93,62,94,52,94,177,94,180,94,185,94,178,94,179,94,54,95,56,95,155,95,150,95,159,95,138,96,144,96,134,96,190,96,176,96,186,96,211,96,212,96,207,96,228,96,217,96,221,96,200,96,177,96,219,96,183,96,202,96,191,96,195,96,205,96,192,96,50,99,101,99,138,99,130,99,125,99,189,99,158,99,173,99,157,99,151,99,171,99,142,99,111,99,135,99,144,99,110,99,175,99,117,99,156,99,109,99,174,99,124,99,164,99,59,99,159,99,120,99,133,99,129,99,145,99,141,99,112,99,83,101,205,101,101,102,97,102,91,102,89,102,92,102,98,102,24,103,121,104,135,104,144,104,156,104,109,104,110,104,174,104,171,104,86,105,111,104,163,104,172,104,169,104,117,104,116,104,178,104,143,104,119,104,146,104,124,104,107,104,114,104,170,104,128,104,113,104,126,104,155,104,150,104,139,104,160,104,137,104,164,104,120,104,123,104,145,104,140,104,138,104,125,104,54,107,51,107,55,107,56,107,145,107,143,107,141,107,142,107,140,107,42,108,192,109,171,109,180,109,179,109,116,110,172,109,233,109,226,109,183,109,246,109,212,109,0,110,200,109,224,109,223,109,214,109,190,109,229,109,220,109,221,109,219,109,244,109,202,109,189,109,237,109,240,109,186,109,213,109,194,109,207,109,201,109,208,109,242,109,211,109,253,109,215,109,205,109,227,109,187,109,250,112,13,113,247,112,23,113,244,112,12,113,240,112,4,113,243,112,16,113,252,112,255,112,6,113,19,113,0,113,248,112,246,112,11,113,2,113,14,113,126,114,123,114,124,114,127,114,29,115,23,115,7,115,17,115,24,115,10,115,8,115,255,114,15,115,30,115,136,115,246,115,248,115,245,115,4,116,1,116,253,115,7,116,0,116,250,115,252,115,255,115,12,116,11,116,244,115,8,116,100,117,99,117,206,117,210,117,207,117,203,117,204,117,209,117,208,117,143,118,137,118,211,118,57,119,47,119,45,119,49,119,50,119,52,119,51,119,61,119,37,119,59,119,53,119,72,120,82,120,73,120,77,120,74,120,76,120,38,120,69,120,80,120,100,121,103,121,105,121,106,121,99,121,107,121,97,121,187,121,250,121,248,121,246,121,247,121,143,122,148,122,144,122,53,123,71,123,52,123,37,123,48,123,34,123,36,123,51,123,24,123,42,123,29,123,49,123,43,123,45,123,47,123,50,123,56,123,26,123,35,123,148,124,152,124,150,124,163,124,53,125,61,125,56,125,54,125,58,125,69,125,44,125,41,125,65,125,71,125,62,125,63,125,74,125,59,125,40,125,99,127,149,127,156,127,157,127,155,127,202,127,203,127,205,127,208,127,209,127,199,127,207,127,201,127,31,128,30,128,27,128,71,128,67,128,72,128,24,129,37,129,25,129,27,129,45,129,31,129,44,129,30,129,33,129,21,129,39,129,29,129,34,129,17,130,56,130,51,130,58,130,52,130,50,130,116,130,144,131,163,131,168,131,141,131,122,131,115,131,164,131,116,131,143,131,129,131,149,131,153,131,117,131,148,131,169,131,125,131,131,131,140,131,157,131,155,131,170,131,139,131,126,131,165,131,175,131,136,131,151,131,176,131,127,131,166,131,135,131,174,131,118,131,154,131,89,134,86,134,191,134,183,134,194,134,193,134,197,134,186,134,176,134,200,134,185,134,179,134,184,134,204,134,180,134,187,134,188,134,195,134,189,134,190,134,82,136,137,136,149,136,168,136,162,136,170,136,154,136,145,136,161,136,159,136,152,136,167,136,153,136,155,136,151,136,164,136,172,136,140,136,147,136,142,136,130,137,214,137,217,137,213,137,48,138,39,138,44,138,30,138,57,140,59,140,92,140,93,140,125,140,165,140,125,141,123,141,121,141,188,141,194,141,185,141,191,141,193,141,216,142,222,142,221,142,220,142,215,142,224,142,225,142,36,144,11,144,17,144,28,144,12,144,33,144,239,144,234,144,240,144,244,144,242,144,243,144,212,144,235,144,236,144,233,144,86,145,88,145,90,145,83,145,85,145,236,145,244,145,241,145,243,145,248,145,228,145,249,145,234,145,235,145,247,145,232,145,238,145,122,149,134,149,136,149,124,150,109,150,107,150,113,150,111,150,191,150,106,151,4,152,229,152,151,153,155,80,149,80,148,80,158,80,139,80,163,80,131,80,140,80,142,80,157,80,104,80,156,80,146,80,130,80,135,80,95,81,212,81,18,83,17,83,164,83,167,83,145,85,168,85,165,85,173,85,119,85,69,86,162,85,147,85,136,85,143,85,181,85,129,85,163,85,146,85,164,85,125,85,140,85,166,85,127,85,149,85,161,85,142,85,12,87,41,88,55,88,25,88,30,88,39,88,35,88,40,88,245,87,72,88,37,88,28,88,27,88,51,88,63,88,54,88,46,88,57,88,56,88,45,88,44,88,59,88,97,89,175,90,148,90,159,90,122,90,162,90,158,90,120,90,166,90,124,90,165,90,172,90,149,90,174,90,55,90,132,90,138,90,151,90,131,90,139,90,169,90,123,90,125,90,140,90,156,90,143,90,147,90,157,90,234,91,205,91,203,91,212,91,209,91,202,91,206,91,12,92,48,92,55,93,67,93,107,93,65,93,75,93,63,93,53,93,81,93,78,93,85,93,51,93,58,93,82,93,61,93,49,93,89,93,66,93,57,93,73,93,56,93,60,93,50,93,54,93,64,93,69,93,68,94,65,94,88,95,166,95,165,95,171,95,201,96,185,96,204,96,226,96,206,96,196,96,20,97,242,96,10,97,22,97,5,97,245,96,19,97,248,96,252,96,254,96,193,96,3,97,24,97,29,97,16,97,255,96,4,97,11,97,74,98,148,99,177,99,176,99,206,99,229,99,232,99,239,99,195,99,157,100,243,99,202,99,224,99,246,99,213,99,242,99,245,99,97,100,223,99,190,99,221,99,220,99,196,99,216,99,211,99,194,99,199,99,204,99,203,99,200,99,240,99,215,99,217,99,50,101,103,101,106,101,100,101,92,101,104,101,101,101,140,101,157,101,158,101,174,101,208,101,210,101,124,102,108,102,123,102,128,102,113,102,121,102,106,102,114,102,1,103,12,105,211,104,4,105,220,104,42,105,236,104,234,104,241,104,15,105,214,104,247,104,235,104,228,104,246,104,19,105,16,105,243,104,225,104,7,105,204,104,8,105,112,105,180,104,17,105,239,104,198,104,20,105,248,104,208,104,253,104,252,104,232,104,11,105,10,105,23,105,206,104,200,104,221,104,222,104,230,104,244,104,209,104,6,105,212,104,233,104,21,105,37,105,199,104,57,107,59,107,63,107,60,107,148,107,151,107,153,107,149,107,189,107,240,107,242,107,243,107,48,108,252,109,70,110,71,110,31,110,73,110,136,110,60,110,61,110,69,110,98,110,43,110,63,110,65,110,93,110,115,110,28,110,51,110,75,110,64,110,81,110,59,110,3,110,46,110,94,110,104,110,92,110,97,110,49,110,40,110,96,110,113,110,107,110,57,110,34,110,48,110,83,110,101,110,39,110,120,110,100,110,119,110,85,110,121,110,82,110,102,110,53,110,54,110,90,110,32,113,30,113,47,113,251,112,46,113,49,113,35,113,37,113,34,113,50,113,31,113,40,113,58,113,27,113,75,114,90,114,136,114,137,114,134,114,133,114,139,114,18,115,11,115,48,115,34,115,49,115,51,115,39,115,50,115,45,115,38,115,35,115,53,115,12,115,46,116,44,116,48,116,43,116,22,116,26,116,33,116,45,116,49,116,36,116,35,116,29,116,41,116,32,116,50,116,251,116,47,117,111,117,108,117,231,117,218,117,225,117,230,117,221,117,223,117,228,117,215,117,149,118,146,118,218,118,70,119,71,119,68,119,77,119,69,119,74,119,78,119,75,119,76,119,222,119,236,119,96,120,100,120,101,120,92,120,109,120,113,120,106,120,110,120,112,120,105,120,104,120,94,120,98,120,116,121,115,121,114,121,112,121,2,122,10,122,3,122,12,122,4,122,153,122,230,122,228,122,74,123,59,123,68,123,72,123,76,123,78,123,64,123,88,123,69,123,162,124,158,124,168,124,161,124,88,125,111,125,99,125,83,125,86,125,103,125,106,125,79,125,109,125,92,125,107,125,82,125,84,125,105,125,81,125,95,125,78,125,62,127,63,127,101,127,102,127,162,127,160,127,161,127,215,127,81,128,79,128,80,128,254,128,212,128,67,129,74,129,82,129,79,129,71,129,61,129,77,129,58,129,230,129,238,129,247,129,248,129,249,129,4,130,60,130,61,130,63,130,117,130,59,131,207,131,249,131,35,132,192,131,232,131,18,132,231,131,228,131,252,131,246,131,16,132,198,131,200,131,235,131,227,131,191,131,1,132,221,131,229,131,216,131,255,131,225,131,203,131,206,131,214,131,245,131,201,131,9,132,15,132,222,131,17,132,6,132,194,131,243,131,213,131,250,131,199,131,209,131,234,131,19,132,195,131,236,131,238,131,196,131,251,131,215,131,226,131,27,132,219,131,254,131,216,134,226,134,230,134,211,134,227,134,218,134,234,134,221,134,235,134,220,134,236,134,233,134,215,134,232,134,209,134,72,136,86,136,85,136,186,136,215,136,185,136,184,136,192,136,190,136,182,136,188,136,183,136,189,136,178,136,1,137,201,136,149,137,152,137,151,137,221,137,218,137,219,137,78,138,77,138,57,138,89,138,64,138,87,138,88,138,68,138,69,138,82,138,72,138,81,138,74,138,76,138,79,138,95,140,129,140,128,140,186,140,190,140,176,140,185,140,181,140,132,141,128,141,137,141,216,141,211,141,205,141,199,141,214,141,220,141,207,141,213,141,217,141,200,141,215,141,197,141,239,142,247,142,250,142,249,142,230,142,238,142,229,142,245,142,231,142,232,142,246,142,235,142,241,142,236,142,244,142,233,142,45,144,52,144,47,144,6,145,44,145,4,145,255,144,252,144,8,145,249,144,251,144,1,145,0,145,7,145,5,145,3,145,97,145,100,145,95,145,98,145,96,145,1,146,10,146,37,146,3,146,26,146,38,146,15,146,12,146,0,146,18,146,255,145,253,145,6,146,4,146,39,146,2,146,28,146,36,146,25,146,23,146,5,146,22,146,123,149,141,149,140,149,144,149,135,150,126,150,136,150,137,150,131,150,128,150,194,150,200,150,195,150,241,150,240,150,108,151,112,151,110,151,7,152,169,152,235,152,230,156,249,158,131,78,132,78,182,78,189,80,191,80,198,80,174,80,196,80,202,80,180,80,200,80,194,80,176,80,193,80,186,80,177,80,203,80,201,80,182,80,184,80,215,81,122,82,120,82,123,82,124,82,195,85,219,85,204,85,208,85,203,85,202,85,221,85,192,85,212,85,196,85,233,85,191,85,210,85,141,85,207,85,213,85,226,85,214,85,200,85,242,85,205,85,217,85,194,85,20,87,83,88,104,88,100,88,79,88,77,88,73,88,111,88,85,88,78,88,93,88,89,88,101,88,91,88,61,88,99,88,113,88,252,88,199,90,196,90,203,90,186,90,184,90,177,90,181,90,176,90,191,90,200,90,187,90,198,90,183,90,192,90,202,90,180,90,182,90,205,90,185,90,144,90,214,91,216,91,217,91,31,92,51,92,113,93,99,93,74,93,101,93,114,93,108,93,94,93,104,93,103,93,98,93,240,93,79,94,78,94,74,94,77,94,75,94,197,94,204,94,198,94,203,94,199,94,64,95,175,95,173,95,247,96,73,97,74,97,43,97,69,97,54,97,50,97,46,97,70,97,47,97,79,97,41,97,64,97,32,98,104,145,35,98,37,98,36,98,197,99,241,99,235,99,16,100,18,100,9,100,32,100,36,100,51,100,67,100,31,100,21,100,24,100,57,100,55,100,34,100,35,100,12,100,38,100,48,100,40,100,65,100,53,100,47,100,10,100,26,100,64,100,37,100,39,100,11,100,231,99,27,100,46,100,33,100,14,100,111,101,146,101,211,101,134,102,140,102,149,102,144,102,139,102,138,102,153,102,148,102,120,102,32,103,102,105,95,105,56,105,78,105,98,105,113,105,63,105,69,105,106,105,57,105,66,105,87,105,89,105,122,105,72,105,73,105,53,105,108,105,51,105,61,105,101,105,240,104,120,105,52,105,105,105,64,105,111,105,68,105,118,105,88,105,65,105,116,105,76,105,59,105,75,105,55,105,92,105,79,105,81,105,50,105,82,105,47,105,123,105,60,105,70,107,69,107,67,107,66,107,72,107,65,107,155,107,13,250,251,107,252,107,249,107,247,107,248,107,155,110,214,110,200,110,143,110,192,110,159,110,147,110,148,110,160,110,177,110,185,110,198,110,210,110,189,110,193,110,158,110,201,110,183,110,176,110,205,110,166,110,207,110,178,110,190,110,195,110,220,110,216,110,153,110,146,110,142,110,141,110,164,110,161,110,191,110,179,110,208,110,202,110,151,110,174,110,163,110,71,113,84,113,82,113,99,113,96,113,65,113,93,113,98,113,114,113,120,113,106,113,97,113,66,113,88,113,67,113,75,113,112,113,95,113,80,113,83,113,68,113,77,113,90,113,79,114,141,114,140,114,145,114,144,114,142,114,60,115,66,115,59,115,58,115,64,115,74,115,73,115,68,116,74,116,75,116,82,116,81,116,87,116,64,116,79,116,80,116,78,116,66,116,70,116,77,116,84,116,225,116,255,116,254,116,253,116,29,117,121,117,119,117,131,105,239,117,15,118,3,118,247,117,254,117,252,117,249,117,248,117,16,118,251,117,246,117,237,117,245,117,253,117,153,118,181,118,221,118,85,119,95,119,96,119,82,119,86,119,90,119,105,119,103,119,84,119,89,119,109,119,224,119,135,120,154,120,148,120,143,120,132,120,149,120,133,120,134,120,161,120,131,120,121,120,153,120,128,120,150,120,123,120,124,121,130,121,125,121,121,121,17,122,24,122,25,122,18,122,23,122,21,122,34,122,19,122,27,122,16,122,163,122,162,122,158,122,235,122,102,123,100,123,109,123,116,123,105,123,114,123,101,123,115,123,113,123,112,123,97,123,120,123,118,123,99,123,178,124,180,124,175,124,136,125,134,125,128,125,141,125,127,125,133,125,122,125,142,125,123,125,131,125,124,125,140,125,148,125,132,125,125,125,146,125,109,127,107,127,103,127,104,127,108,127,166,127,165,127,167,127,219,127,220,127,33,128,100,129,96,129,119,129,92,129,105,129,91,129,98,129,114,129,33,103,94,129,118,129,103,129,111,129,68,129,97,129,29,130,73,130,68,130,64,130,66,130,69,130,241,132,63,132,86,132,118,132,121,132,143,132,141,132,101,132,81,132,64,132,134,132,103,132,48,132,77,132,125,132,90,132,89,132,116,132,115,132,93,132,7,133,94,132,55,132,58,132,52,132,122,132,67,132,120,132,50,132,69,132,41,132,217,131,75,132,47,132,66,132,45,132,95,132,112,132,57,132,78,132,76,132,82,132,111,132,197,132,142,132,59,132,71,132,54,132,51,132,104,132,126,132,68,132,43,132,96,132,84,132,110,132,80,132,11,135,4,135,247,134,12,135,250,134,214,134,245,134,77,135,248,134,14,135,9,135,1,135,246,134,13,135,5,135,214,136,203,136,205,136,206,136,222,136,219,136,218,136,204,136,208,136,133,137,155,137,223,137,229,137,228,137,225,137,224,137,226,137,220,137,230,137,118,138,134,138,127,138,97,138,63,138,119,138,130,138,132,138,117,138,131,138,129,138,116,138,122,138,60,140,75,140,74,140,101,140,100,140,102,140,134,140,132,140,133,140,204,140,104,141,105,141,145,141,140,141,142,141,143,141,141,141,147,141,148,141,144,141,146,141,240,141,224,141,236,141,241,141,238,141,208,141,233,141,227,141,226,141,231,141,242,141,235,141,244,141,6,143,255,142,1,143,0,143,5,143,7,143,8,143,2,143,11,143,82,144,63,144,68,144,73,144,61,144,16,145,13,145,15,145,17,145,22,145,20,145,11,145,14,145,110,145,111,145,72,146,82,146,48,146,58,146,102,146,51,146,101,146,94,146,131,146,46,146,74,146,70,146,109,146,108,146,79,146,96,146,103,146,111,146,54,146,97,146,112,146,49,146,84,146,99,146,80,146,114,146,78,146,83,146,76,146,86,146,50,146,159,149,156,149,158,149,155,149,146,150,147,150,145,150,151,150,206,150,250,150,253,150,248,150,245,150,115,151,119,151,120,151,114,151,15,152,13,152,14,152,172,152,246,152,249,152,175,153,178,153,176,153,181,153,173,154,171,154,91,155,234,156,237,156,231,156,128,158,253,158,230,80,212,80,215,80,232,80,243,80,219,80,234,80,221,80,228,80,211,80,236,80,240,80,239,80,227,80,224,80,216,81,128,82,129,82,233,82,235,82,48,83,172,83,39,86,21,86,12,86,18,86,252,85,15,86,28,86,1,86,19,86,2,86,250,85,29,86,4,86,255,85,249,85,137,88,124,88,144,88,152,88,134,88,129,88,127,88,116,88,139,88,122,88,135,88,145,88,142,88,118,88,130,88,136,88,123,88,148,88,143,88,254,88,107,89,220,90,238,90,229,90,213,90,234,90,218,90,237,90,235,90,243,90,226,90,224,90,219,90,236,90,222,90,221,90,217,90,232,90,223,90,119,91,224,91,227,91,99,92,130,93,128,93,125,93,134,93,122,93,129,93,119,93,138,93,137,93,136,93,126,93,124,93,141,93,121,93,127,93,88,94,89,94,83,94,216,94,209,94,215,94,206,94,220,94,213,94,217,94,210,94,212,94,68,95,67,95,111,95,182,95,44,97,40,97,65,97,94,97,113,97,115,97,82,97,83,97,114,97,108,97,128,97,116,97,84,97,122,97,91,97,101,97,59,97,106,97,97,97,86,97,41,98,39,98,43,98,43,100,77,100,91,100,93,100,116,100,118,100,114,100,115,100,125,100,117,100,102,100,166,100,78,100,130,100,94,100,92,100,75,100,83,100,96,100,80,100,127,100,63,100,108,100,107,100,89,100,101,100,119,100,115,101,160,101,161,102,160,102,159,102,5,103,4,103,34,103,177,105,182,105,201,105,160,105,206,105,150,105,176,105,172,105,188,105,145,105,153,105,142,105,167,105,141,105,169,105,190,105,175,105,191,105,196,105,189,105,164,105,212,105,185,105,202,105,154,105,207,105,179,105,147,105,170,105,161,105,158,105,217,105,151,105,144,105,194,105,181,105,165,105,198,105,74,107,77,107,75,107,158,107,159,107,160,107,195,107,196,107,254,107,206,110,245,110,241,110,3,111,37,111,248,110,55,111,251,110,46,111,9,111,78,111,25,111,26,111,39,111,24,111,59,111,18,111,237,110,10,111,54,111,115,111,249,110,238,110,45,111,64,111,48,111,60,111,53,111,235,110,7,111,14,111,67,111,5,111,253,110,246,110,57,111,28,111,252,110,58,111,31,111,13,111,30,111,8,111,33,111,135,113,144,113,137,113,128,113,133,113,130,113,143,113,123,113,134,113,129,113,151,113,68,114,83,114,151,114,149,114,147,114,67,115,77,115,81,115,76,115,98,116,115,116,113,116,117,116,114,116,103,116,110,116,0,117,2,117,3,117,125,117,144,117,22,118,8,118,12,118,21,118,17,118,10,118,20,118,184,118,129,119,124,119,133,119,130,119,110,119,128,119,111,119,126,119,131,119,178,120,170,120,180,120,173,120,168,120,126,120,171,120,158,120,165,120,160,120,172,120,162,120,164,120,152,121,138,121,139,121,150,121,149,121,148,121,147,121,151,121,136,121,146,121,144,121,43,122,74,122,48,122,47,122,40,122,38,122,168,122,171,122,172,122,238,122,136,123,156,123,138,123,145,123,144,123,150,123,141,123,140,123,155,123,142,123,133,123,152,123,132,82,153,123,164,123,130,123,187,124,191,124,188,124,186,124,167,125,183,125,194,125,163,125,170,125,193,125,192,125,197,125,157,125,206,125,196,125,198,125,203,125,204,125,175,125,185,125,150,125,188,125,159,125,166,125,174,125,169,125,161,125,201,125,115,127,226,127,227,127,229,127,222,127,36,128,93,128,92,128,137,129,134,129,131,129,135,129,141,129,140,129,139,129,21,130,151,132,164,132,161,132,159,132,186,132,206,132,194,132,172,132,174,132,171,132,185,132,180,132,193,132,205,132,170,132,154,132,177,132,208,132,157,132,167,132,187,132,162,132,148,132,199,132,204,132,155,132,169,132,175,132,168,132,214,132,152,132,182,132,207,132,160,132,215,132,212,132,210,132,219,132,176,132,145,132,97,134,51,135,35,135,40,135,107,135,64,135], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+88812);
/* memory initializer */ allocate([46,135,30,135,33,135,25,135,27,135,67,135,44,135,65,135,62,135,70,135,32,135,50,135,42,135,45,135,60,135,18,135,58,135,49,135,53,135,66,135,38,135,39,135,56,135,36,135,26,135,48,135,17,135,247,136,231,136,241,136,242,136,250,136,254,136,238,136,252,136,246,136,251,136,240,136,236,136,235,136,157,137,161,137,159,137,158,137,233,137,235,137,232,137,171,138,153,138,139,138,146,138,143,138,150,138,61,140,104,140,105,140,213,140,207,140,215,140,150,141,9,142,2,142,255,141,13,142,253,141,10,142,3,142,7,142,6,142,5,142,254,141,0,142,4,142,16,143,17,143,14,143,13,143,35,145,28,145,32,145,34,145,31,145,29,145,26,145,36,145,33,145,27,145,122,145,114,145,121,145,115,145,165,146,164,146,118,146,155,146,122,146,160,146,148,146,170,146,141,146,166,146,154,146,171,146,121,146,151,146,127,146,163,146,238,146,142,146,130,146,149,146,162,146,125,146,136,146,161,146,138,146,134,146,140,146,153,146,167,146,126,146,135,146,169,146,157,146,139,146,45,146,158,150,161,150,255,150,88,151,125,151,122,151,126,151,131,151,128,151,130,151,123,151,132,151,129,151,127,151,206,151,205,151,22,152,173,152,174,152,2,153,0,153,7,153,157,153,156,153,195,153,185,153,187,153,186,153,194,153,189,153,199,153,177,154,227,154,231,154,62,155,63,155,96,155,97,155,95,155,241,156,242,156,245,156,167,158,255,80,3,81,48,81,248,80,6,81,7,81,246,80,254,80,11,81,12,81,253,80,10,81,139,82,140,82,241,82,239,82,72,86,66,86,76,86,53,86,65,86,74,86,73,86,70,86,88,86,90,86,64,86,51,86,61,86,44,86,62,86,56,86,42,86,58,86,26,87,171,88,157,88,177,88,160,88,163,88,175,88,172,88,165,88,161,88,255,88,255,90,244,90,253,90,247,90,246,90,3,91,248,90,2,91,249,90,1,91,7,91,5,91,15,91,103,92,153,93,151,93,159,93,146,93,162,93,147,93,149,93,160,93,156,93,161,93,154,93,158,93,105,94,93,94,96,94,92,94,243,125,219,94,222,94,225,94,73,95,178,95,139,97,131,97,121,97,177,97,176,97,162,97,137,97,155,97,147,97,175,97,173,97,159,97,146,97,170,97,161,97,141,97,102,97,179,97,45,98,110,100,112,100,150,100,160,100,133,100,151,100,156,100,143,100,139,100,138,100,140,100,163,100,159,100,104,100,177,100,152,100,118,101,122,101,121,101,123,101,178,101,179,101,181,102,176,102,169,102,178,102,183,102,170,102,175,102,0,106,6,106,23,106,229,105,248,105,21,106,241,105,228,105,32,106,255,105,236,105,226,105,27,106,29,106,254,105,39,106,242,105,238,105,20,106,247,105,231,105,64,106,8,106,230,105,251,105,13,106,252,105,235,105,9,106,4,106,24,106,37,106,15,106,246,105,38,106,7,106,244,105,22,106,81,107,165,107,163,107,162,107,166,107,1,108,0,108,255,107,2,108,65,111,38,111,126,111,135,111,198,111,146,111,141,111,137,111,140,111,98,111,79,111,133,111,90,111,150,111,118,111,108,111,130,111,85,111,114,111,82,111,80,111,87,111,148,111,147,111,93,111,0,111,97,111,107,111,125,111,103,111,144,111,83,111,139,111,105,111,127,111,149,111,99,111,119,111,106,111,123,111,178,113,175,113,155,113,176,113,160,113,154,113,169,113,181,113,157,113,165,113,158,113,164,113,161,113,170,113,156,113,167,113,179,113,152,114,154,114,88,115,82,115,94,115,95,115,96,115,93,115,91,115,97,115,90,115,89,115,98,115,135,116,137,116,138,116,134,116,129,116,125,116,133,116,136,116,124,116,121,116,8,117,7,117,126,117,37,118,30,118,25,118,29,118,28,118,35,118,26,118,40,118,27,118,156,118,157,118,158,118,155,118,141,119,143,119,137,119,136,119,205,120,187,120,207,120,204,120,209,120,206,120,212,120,200,120,195,120,196,120,201,120,154,121,161,121,160,121,156,121,162,121,155,121,118,107,57,122,178,122,180,122,179,122,183,123,203,123,190,123,172,123,206,123,175,123,185,123,202,123,181,123,197,124,200,124,204,124,203,124,247,125,219,125,234,125,231,125,215,125,225,125,3,126,250,125,230,125,246,125,241,125,240,125,238,125,223,125,118,127,172,127,176,127,173,127,237,127,235,127,234,127,236,127,230,127,232,127,100,128,103,128,163,129,159,129,158,129,149,129,162,129,153,129,151,129,22,130,79,130,83,130,82,130,80,130,78,130,81,130,36,133,59,133,15,133,0,133,41,133,14,133,9,133,13,133,31,133,10,133,39,133,28,133,251,132,43,133,250,132,8,133,12,133,244,132,42,133,242,132,21,133,247,132,235,132,243,132,252,132,18,133,234,132,233,132,22,133,254,132,40,133,29,133,46,133,2,133,253,132,30,133,246,132,49,133,38,133,231,132,232,132,240,132,239,132,249,132,24,133,32,133,48,133,11,133,25,133,47,133,98,134,86,135,99,135,100,135,119,135,225,135,115,135,88,135,84,135,91,135,82,135,97,135,90,135,81,135,94,135,109,135,106,135,80,135,78,135,95,135,93,135,111,135,108,135,122,135,110,135,92,135,101,135,79,135,123,135,117,135,98,135,103,135,105,135,90,136,5,137,12,137,20,137,11,137,23,137,24,137,25,137,6,137,22,137,17,137,14,137,9,137,162,137,164,137,163,137,237,137,240,137,236,137,207,138,198,138,184,138,211,138,209,138,212,138,213,138,187,138,215,138,190,138,192,138,197,138,216,138,195,138,186,138,189,138,217,138,62,140,77,140,143,140,229,140,223,140,217,140,232,140,218,140,221,140,231,140,160,141,156,141,161,141,155,141,32,142,35,142,37,142,36,142,46,142,21,142,27,142,22,142,17,142,25,142,38,142,39,142,20,142,18,142,24,142,19,142,28,142,23,142,26,142,44,143,36,143,24,143,26,143,32,143,35,143,22,143,23,143,115,144,112,144,111,144,103,144,107,144,47,145,43,145,41,145,42,145,50,145,38,145,46,145,133,145,134,145,138,145,129,145,130,145,132,145,128,145,208,146,195,146,196,146,192,146,217,146,182,146,207,146,241,146,223,146,216,146,233,146,215,146,221,146,204,146,239,146,194,146,232,146,202,146,200,146,206,146,230,146,205,146,213,146,201,146,224,146,222,146,231,146,209,146,211,146,181,146,225,146,198,146,180,146,124,149,172,149,171,149,174,149,176,149,164,150,162,150,211,150,5,151,8,151,2,151,90,151,138,151,142,151,136,151,208,151,207,151,30,152,29,152,38,152,41,152,40,152,32,152,27,152,39,152,178,152,8,153,250,152,17,153,20,153,22,153,23,153,21,153,220,153,205,153,207,153,211,153,212,153,206,153,201,153,214,153,216,153,203,153,215,153,204,153,179,154,236,154,235,154,243,154,242,154,241,154,70,155,67,155,103,155,116,155,113,155,102,155,118,155,117,155,112,155,104,155,100,155,108,155,252,156,250,156,253,156,255,156,247,156,7,157,0,157,249,156,251,156,8,157,5,157,4,157,131,158,211,158,15,159,16,159,28,81,19,81,23,81,26,81,17,81,222,81,52,83,225,83,112,86,96,86,110,86,115,86,102,86,99,86,109,86,114,86,94,86,119,86,28,87,27,87,200,88,189,88,201,88,191,88,186,88,194,88,188,88,198,88,23,91,25,91,27,91,33,91,20,91,19,91,16,91,22,91,40,91,26,91,32,91,30,91,239,91,172,93,177,93,169,93,167,93,181,93,176,93,174,93,170,93,168,93,178,93,173,93,175,93,180,93,103,94,104,94,102,94,111,94,233,94,231,94,230,94,232,94,229,94,75,95,188,95,157,97,168,97,150,97,197,97,180,97,198,97,193,97,204,97,186,97,191,97,184,97,140,97,215,100,214,100,208,100,207,100,201,100,189,100,137,100,195,100,219,100,243,100,217,100,51,101,127,101,124,101,162,101,200,102,190,102,192,102,202,102,203,102,207,102,189,102,187,102,186,102,204,102,35,103,52,106,102,106,73,106,103,106,50,106,104,106,62,106,93,106,109,106,118,106,91,106,81,106,40,106,90,106,59,106,63,106,65,106,106,106,100,106,80,106,79,106,84,106,111,106,105,106,96,106,60,106,94,106,86,106,85,106,77,106,78,106,70,106,85,107,84,107,86,107,167,107,170,107,171,107,200,107,199,107,4,108,3,108,6,108,173,111,203,111,163,111,199,111,188,111,206,111,200,111,94,111,196,111,189,111,158,111,202,111,168,111,4,112,165,111,174,111,186,111,172,111,170,111,207,111,191,111,184,111,162,111,201,111,171,111,205,111,175,111,178,111,176,111,197,113,194,113,191,113,184,113,214,113,192,113,193,113,203,113,212,113,202,113,199,113,207,113,189,113,216,113,188,113,198,113,218,113,219,113,157,114,158,114,105,115,102,115,103,115,108,115,101,115,107,115,106,115,127,116,154,116,160,116,148,116,146,116,149,116,161,116,11,117,128,117,47,118,45,118,49,118,61,118,51,118,60,118,53,118,50,118,48,118,187,118,230,118,154,119,157,119,161,119,156,119,155,119,162,119,163,119,149,119,153,119,151,119,221,120,233,120,229,120,234,120,222,120,227,120,219,120,225,120,226,120,237,120,223,120,224,120,164,121,68,122,72,122,71,122,182,122,184,122,181,122,177,122,183,122,222,123,227,123,231,123,221,123,213,123,229,123,218,123,232,123,249,123,212,123,234,123,226,123,220,123,235,123,216,123,223,123,210,124,212,124,215,124,208,124,209,124,18,126,33,126,23,126,12,126,31,126,32,126,19,126,14,126,28,126,21,126,26,126,34,126,11,126,15,126,22,126,13,126,20,126,37,126,36,126,67,127,123,127,124,127,122,127,177,127,239,127,42,128,41,128,108,128,177,129,166,129,174,129,185,129,181,129,171,129,176,129,172,129,180,129,178,129,183,129,167,129,242,129,85,130,86,130,87,130,86,133,69,133,107,133,77,133,83,133,97,133,88,133,64,133,70,133,100,133,65,133,98,133,68,133,81,133,71,133,99,133,62,133,91,133,113,133,78,133,110,133,117,133,85,133,103,133,96,133,140,133,102,133,93,133,84,133,101,133,108,133,99,134,101,134,100,134,155,135,143,135,151,135,147,135,146,135,136,135,129,135,150,135,152,135,121,135,135,135,163,135,133,135,144,135,145,135,157,135,132,135,148,135,156,135,154,135,137,135,30,137,38,137,48,137,45,137,46,137,39,137,49,137,34,137,41,137,35,137,47,137,44,137,31,137,241,137,224,138,226,138,242,138,244,138,245,138,221,138,20,139,228,138,223,138,240,138,200,138,222,138,225,138,232,138,255,138,239,138,251,138,145,140,146,140,144,140,245,140,238,140,241,140,240,140,243,140,108,141,110,141,165,141,167,141,51,142,62,142,56,142,64,142,69,142,54,142,60,142,61,142,65,142,48,142,63,142,189,142,54,143,46,143,53,143,50,143,57,143,55,143,52,143,118,144,121,144,123,144,134,144,250,144,51,145,53,145,54,145,147,145,144,145,145,145,141,145,143,145,39,147,30,147,8,147,31,147,6,147,15,147,122,147,56,147,60,147,27,147,35,147,18,147,1,147,70,147,45,147,14,147,13,147,203,146,29,147,250,146,37,147,19,147,249,146,247,146,52,147,2,147,36,147,255,146,41,147,57,147,53,147,42,147,20,147,12,147,11,147,254,146,9,147,0,147,251,146,22,147,188,149,205,149,190,149,185,149,186,149,182,149,191,149,181,149,189,149,169,150,212,150,11,151,18,151,16,151,153,151,151,151,148,151,240,151,248,151,53,152,47,152,50,152,36,153,31,153,39,153,41,153,158,153,238,153,236,153,229,153,228,153,240,153,227,153,234,153,233,153,231,153,185,154,191,154,180,154,187,154,246,154,250,154,249,154,247,154,51,155,128,155,133,155,135,155,124,155,126,155,123,155,130,155,147,155,146,155,144,155,122,155,149,155,125,155,136,155,37,157,23,157,32,157,30,157,20,157,41,157,29,157,24,157,34,157,16,157,25,157,31,157,136,158,134,158,135,158,174,158,173,158,213,158,214,158,250,158,18,159,61,159,38,81,37,81,34,81,36,81,32,81,41,81,244,82,147,86,140,86,141,86,134,86,132,86,131,86,126,86,130,86,127,86,129,86,214,88,212,88,207,88,210,88,45,91,37,91,50,91,35,91,44,91,39,91,38,91,47,91,46,91,123,91,241,91,242,91,183,93,108,94,106,94,190,95,187,95,195,97,181,97,188,97,231,97,224,97,229,97,228,97,232,97,222,97,239,100,233,100,227,100,235,100,228,100,232,100,129,101,128,101,182,101,218,101,210,102,141,106,150,106,129,106,165,106,137,106,159,106,155,106,161,106,158,106,135,106,147,106,142,106,149,106,131,106,168,106,164,106,145,106,127,106,166,106,154,106,133,106,140,106,146,106,91,107,173,107,9,108,204,111,169,111,244,111,212,111,227,111,220,111,237,111,231,111,230,111,222,111,242,111,221,111,226,111,232,111,225,113,241,113,232,113,242,113,228,113,240,113,226,113,115,115,110,115,111,115,151,116,178,116,171,116,144,116,170,116,173,116,177,116,165,116,175,116,16,117,17,117,18,117,15,117,132,117,67,118,72,118,73,118,71,118,164,118,233,118,181,119,171,119,178,119,183,119,182,119,180,119,177,119,168,119,240,119,243,120,253,120,2,121,251,120,252,120,242,120,5,121,249,120,254,120,4,121,171,121,168,121,92,122,91,122,86,122,88,122,84,122,90,122,190,122,192,122,193,122,5,124,15,124,242,123,0,124,255,123,251,123,14,124,244,123,11,124,243,123,2,124,9,124,3,124,1,124,248,123,253,123,6,124,240,123,241,123,16,124,10,124,232,124,45,126,60,126,66,126,51,126,72,152,56,126,42,126,73,126,64,126,71,126,41,126,76,126,48,126,59,126,54,126,68,126,58,126,69,127,127,127,126,127,125,127,244,127,242,127,44,128,187,129,196,129,204,129,202,129,197,129,199,129,188,129,233,129,91,130,90,130,92,130,131,133,128,133,143,133,167,133,149,133,160,133,139,133,163,133,123,133,164,133,154,133,158,133,119,133,124,133,137,133,161,133,122,133,120,133,87,133,142,133,150,133,134,133,141,133,153,133,157,133,129,133,162,133,130,133,136,133,133,133,121,133,118,133,152,133,144,133,159,133,104,134,190,135,170,135,173,135,197,135,176,135,172,135,185,135,181,135,188,135,174,135,201,135,195,135,194,135,204,135,183,135,175,135,196,135,202,135,180,135,182,135,191,135,184,135,189,135,222,135,178,135,53,137,51,137,60,137,62,137,65,137,82,137,55,137,66,137,173,137,175,137,174,137,242,137,243,137,30,139,24,139,22,139,17,139,5,139,11,139,34,139,15,139,18,139,21,139,7,139,13,139,8,139,6,139,28,139,19,139,26,139,79,140,112,140,114,140,113,140,111,140,149,140,148,140,249,140,111,141,78,142,77,142,83,142,80,142,76,142,71,142,67,143,64,143,133,144,126,144,56,145,154,145,162,145,155,145,153,145,159,145,161,145,157,145,160,145,161,147,131,147,175,147,100,147,86,147,71,147,124,147,88,147,92,147,118,147,73,147,80,147,81,147,96,147,109,147,143,147,76,147,106,147,121,147,87,147,85,147,82,147,79,147,113,147,119,147,123,147,97,147,94,147,99,147,103,147,128,147,78,147,89,147,199,149,192,149,201,149,195,149,197,149,183,149,174,150,176,150,172,150,32,151,31,151,24,151,29,151,25,151,154,151,161,151,156,151,158,151,157,151,213,151,212,151,241,151,65,152,68,152,74,152,73,152,69,152,67,152,37,153,43,153,44,153,42,153,51,153,50,153,47,153,45,153,49,153,48,153,152,153,163,153,161,153,2,154,250,153,244,153,247,153,249,153,248,153,246,153,251,153,253,153,254,153,252,153,3,154,190,154,254,154,253,154,1,155,252,154,72,155,154,155,168,155,158,155,155,155,166,155,161,155,165,155,164,155,134,155,162,155,160,155,175,155,51,157,65,157,103,157,54,157,46,157,47,157,49,157,56,157,48,157,69,157,66,157,67,157,62,157,55,157,64,157,61,157,245,127,45,157,138,158,137,158,141,158,176,158,200,158,218,158,251,158,255,158,36,159,35,159,34,159,84,159,160,159,49,81,45,81,46,81,152,86,156,86,151,86,154,86,157,86,153,86,112,89,60,91,105,92,106,92,192,93,109,94,110,94,216,97,223,97,237,97,238,97,241,97,234,97,240,97,235,97,214,97,233,97,255,100,4,101,253,100,248,100,1,101,3,101,252,100,148,101,219,101,218,102,219,102,216,102,197,106,185,106,189,106,225,106,198,106,186,106,182,106,183,106,199,106,180,106,173,106,94,107,201,107,11,108,7,112,12,112,13,112,1,112,5,112,20,112,14,112,255,111,0,112,251,111,38,112,252,111,247,111,10,112,1,114,255,113,249,113,3,114,253,113,118,115,184,116,192,116,181,116,193,116,190,116,182,116,187,116,194,116,20,117,19,117,92,118,100,118,89,118,80,118,83,118,87,118,90,118,166,118,189,118,236,118,194,119,186,119,255,120,12,121,19,121,20,121,9,121,16,121,18,121,17,121,173,121,172,121,95,122,28,124,41,124,25,124,32,124,31,124,45,124,29,124,38,124,40,124,34,124,37,124,48,124,92,126,80,126,86,126,99,126,88,126,98,126,95,126,81,126,96,126,87,126,83,126,181,127,179,127,247,127,248,127,117,128,209,129,210,129,208,129,95,130,94,130,180,133,198,133,192,133,195,133,194,133,179,133,181,133,189,133,199,133,196,133,191,133,203,133,206,133,200,133,197,133,177,133,182,133,210,133,36,134,184,133,183,133,190,133,105,134,231,135,230,135,226,135,219,135,235,135,234,135,229,135,223,135,243,135,228,135,212,135,220,135,211,135,237,135,216,135,227,135,164,135,215,135,217,135,1,136,244,135,232,135,221,135,83,137,75,137,79,137,76,137,70,137,80,137,81,137,73,137,42,139,39,139,35,139,51,139,48,139,53,139,71,139,47,139,60,139,62,139,49,139,37,139,55,139,38,139,54,139,46,139,36,139,59,139,61,139,58,139,66,140,117,140,153,140,152,140,151,140,254,140,4,141,2,141,0,141,92,142,98,142,96,142,87,142,86,142,94,142,101,142,103,142,91,142,90,142,97,142,93,142,105,142,84,142,70,143,71,143,72,143,75,143,40,145,58,145,59,145,62,145,168,145,165,145,167,145,175,145,170,145,181,147,140,147,146,147,183,147,155,147,157,147,137,147,167,147,142,147,170,147,158,147,166,147,149,147,136,147,153,147,159,147,141,147,177,147,145,147,178,147,164,147,168,147,180,147,163,147,165,147,210,149,211,149,209,149,179,150,215,150,218,150,194,93,223,150,216,150,221,150,35,151,34,151,37,151,172,151,174,151,168,151,171,151,164,151,170,151,162,151,165,151,215,151,217,151,214,151,216,151,250,151,80,152,81,152,82,152,184,152,65,153,60,153,58,153,15,154,11,154,9,154,13,154,4,154,17,154,10,154,5,154,7,154,6,154,192,154,220,154,8,155,4,155,5,155,41,155,53,155,74,155,76,155,75,155,199,155,198,155,195,155,191,155,193,155,181,155,184,155,211,155,182,155,196,155,185,155,189,155,92,157,83,157,79,157,74,157,91,157,75,157,89,157,86,157,76,157,87,157,82,157,84,157,95,157,88,157,90,157,142,158,140,158,223,158,1,159,0,159,22,159,37,159,43,159,42,159,41,159,40,159,76,159,85,159,52,81,53,81,150,82,247,82,180,83,171,86,173,86,166,86,167,86,170,86,172,86,218,88,221,88,219,88,18,89,61,91,62,91,63,91,195,93,112,94,191,95,251,97,7,101,16,101,13,101,9,101,12,101,14,101,132,101,222,101,221,101,222,102,231,106,224,106,204,106,209,106,217,106,203,106,223,106,220,106,208,106,235,106,207,106,205,106,222,106,96,107,176,107,12,108,25,112,39,112,32,112,22,112,43,112,33,112,34,112,35,112,41,112,23,112,36,112,28,112,42,112,12,114,10,114,7,114,2,114,5,114,165,114,166,114,164,114,163,114,161,114,203,116,197,116,183,116,195,116,22,117,96,118,201,119,202,119,196,119,241,119,29,121,27,121,33,121,28,121,23,121,30,121,176,121,103,122,104,122,51,124,60,124,57,124,44,124,59,124,236,124,234,124,118,126,117,126,120,126,112,126,119,126,111,126,122,126,114,126,116,126,104,126,75,127,74,127,131,127,134,127,183,127,253,127,254,127,120,128,215,129,213,129,100,130,97,130,99,130,235,133,241,133,237,133,217,133,225,133,232,133,218,133,215,133,236,133,242,133,248,133,216,133,223,133,227,133,220,133,209,133,240,133,230,133,239,133,222,133,226,133,0,136,250,135,3,136,246,135,247,135,9,136,12,136,11,136,6,136,252,135,8,136,255,135,10,136,2,136,98,137,90,137,91,137,87,137,97,137,92,137,88,137,93,137,89,137,136,137,183,137,182,137,246,137,80,139,72,139,74,139,64,139,83,139,86,139,84,139,75,139,85,139,81,139,66,139,82,139,87,139,67,140,119,140,118,140,154,140,6,141,7,141,9,141,172,141,170,141,173,141,171,141,109,142,120,142,115,142,106,142,111,142,123,142,194,142,82,143,81,143,79,143,80,143,83,143,180,143,64,145,63,145,176,145,173,145,222,147,199,147,207,147,194,147,218,147,208,147,249,147,236,147,204,147,217,147,169,147,230,147,202,147,212,147,238,147,227,147,213,147,196,147,206,147,192,147,210,147,231,147,125,149,218,149,219,149,225,150,41,151,43,151,44,151,40,151,38,151,179,151,183,151,182,151,221,151,222,151,223,151,92,152,89,152,93,152,87,152,191,152,189,152,187,152,190,152,72,153,71,153,67,153,166,153,167,153,26,154,21,154,37,154,29,154,36,154,27,154,34,154,32,154,39,154,35,154,30,154,28,154,20,154,194,154,11,155,10,155,14,155,12,155,55,155,234,155,235,155,224,155,222,155,228,155,230,155,226,155,240,155,212,155,215,155,236,155,220,155,217,155,229,155,213,155,225,155,218,155,119,157,129,157,138,157,132,157,136,157,113,157,128,157,120,157,134,157,139,157,140,157,125,157,107,157,116,157,117,157,112,157,105,157,133,157,115,157,123,157,130,157,111,157,121,157,127,157,135,157,104,157,148,158,145,158,192,158,252,158,45,159,64,159,65,159,77,159,86,159,87,159,88,159,55,83,178,86,181,86,179,86,227,88,69,91,198,93,199,93,238,94,239,94,192,95,193,95,249,97,23,101,22,101,21,101,19,101,223,101,232,102,227,102,228,102,243,106,240,106,234,106,232,106,249,106,241,106,238,106,239,106,60,112,53,112,47,112,55,112,52,112,49,112,66,112,56,112,63,112,58,112,57,112,64,112,59,112,51,112,65,112,19,114,20,114,168,114,125,115,124,115,186,116,171,118,170,118,190,118,237,118,204,119,206,119,207,119,205,119,242,119,37,121,35,121,39,121,40,121,36,121,41,121,178,121,110,122,108,122,109,122,247,122,73,124,72,124,74,124,71,124,69,124,238,124,123,126,126,126,129,126,128,126,186,127,255,127,121,128,219,129,217,129,11,130,104,130,105,130,34,134,255,133,1,134,254,133,27,134,0,134,246,133,4,134,9,134,5,134,12,134,253,133,25,136,16,136,17,136,23,136,19,136,22,136,99,137,102,137,185,137,247,137,96,139,106,139,93,139,104,139,99,139,101,139,103,139,109,139,174,141,134,142,136,142,132,142,89,143,86,143,87,143,85,143,88,143,90,143,141,144,67,145,65,145,183,145,181,145,178,145,179,145,11,148,19,148,251,147,32,148,15,148,20,148,254,147,21,148,16,148,40,148,25,148,13,148,245,147,0,148,247,147,7,148,14,148,22,148,18,148,250,147,9,148,248,147,10,148,255,147,252,147,12,148,246,147,17,148,6,148,222,149,224,149,223,149,46,151,47,151,185,151,187,151,253,151,254,151,96,152,98,152,99,152,95,152,193,152,194,152,80,153,78,153,89,153,76,153,75,153,83,153,50,154,52,154,49,154,44,154,42,154,54,154,41,154,46,154,56,154,45,154,199,154,202,154,198,154,16,155,18,155,17,155,11,156,8,156,247,155,5,156,18,156,248,155,64,156,7,156,14,156,6,156,23,156,20,156,9,156,159,157,153,157,164,157,157,157,146,157,152,157,144,157,155,157,160,157,148,157,156,157,170,157,151,157,161,157,154,157,162,157,168,157,158,157,163,157,191,157,169,157,150,157,166,157,167,157,153,158,155,158,154,158,229,158,228,158,231,158,230,158,48,159,46,159,91,159,96,159,94,159,93,159,89,159,145,159,58,81,57,81,152,82,151,82,195,86,189,86,190,86,72,91,71,91,203,93,207,93,241,94,253,97,27,101,2,107,252,106,3,107,248,106,0,107,67,112,68,112,74,112,72,112,73,112,69,112,70,112,29,114,26,114,25,114,126,115,23,117,106,118,208,119,45,121,49,121,47,121,84,124,83,124,242,124,138,126,135,126,136,126,139,126,134,126,141,126,77,127,187,127,48,128,221,129,24,134,42,134,38,134,31,134,35,134,28,134,25,134,39,134,46,134,33,134,32,134,41,134,30,134,37,134,41,136,29,136,27,136,32,136,36,136,28,136,43,136,74,136,109,137,105,137,110,137,107,137,250,137,121,139,120,139,69,139,122,139,123,139,16,141,20,141,175,141,142,142,140,142,94,143,91,143,93,143,70,145,68,145,69,145,185,145,63,148,59,148,54,148,41,148,61,148,60,148,48,148,57,148,42,148,55,148,44,148,64,148,49,148,229,149,228,149,227,149,53,151,58,151,191,151,225,151,100,152,201,152,198,152,192,152,88,153,86,153,57,154,61,154,70,154,68,154,66,154,65,154,58,154,63,154,205,154,21,155,23,155,24,155,22,155,58,155,82,155,43,156,29,156,28,156,44,156,35,156,40,156,41,156,36,156,33,156,183,157,182,157,188,157,193,157,199,157,202,157,207,157,190,157,197,157,195,157,187,157,181,157,206,157,185,157,186,157,172,157,200,157,177,157,173,157,204,157,179,157,205,157,178,157,122,158,156,158,235,158,238,158,237,158,27,159,24,159,26,159,49,159,78,159,101,159,100,159,146,159,185,78,198,86,197,86,203,86,113,89,75,91,76,91,213,93,209,93,242,94,33,101,32,101,38,101,34,101,11,107,8,107,9,107,13,108,85,112,86,112,87,112,82,112,30,114,31,114,169,114,127,115,216,116,213,116,217,116,215,116,109,118,173,118,53,121,180,121,112,122,113,122,87,124,92,124,89,124,91,124,90,124,244,124,241,124,145,126,79,127,135,127,222,129,107,130,52,134,53,134,51,134,44,134,50,134,54,134,44,136,40,136,38,136,42,136,37,136,113,137,191,137,190,137,251,137,126,139,132,139,130,139,134,139,133,139,127,139,21,141,149,142,148,142,154,142,146,142,144,142,150,142,151,142,96,143,98,143,71,145,76,148,80,148,74,148,75,148,79,148,71,148,69,148,72,148,73,148,70,148,63,151,227,151,106,152,105,152,203,152,84,153,91,153,78,154,83,154,84,154,76,154,79,154,72,154,74,154,73,154,82,154,80,154,208,154,25,155,43,155,59,155,86,155,85,155,70,156,72,156,63,156,68,156,57,156,51,156,65,156,60,156,55,156,52,156,50,156,61,156,54,156,219,157,210,157,222,157,218,157,203,157,208,157,220,157,209,157,223,157,233,157,217,157,216,157,214,157,245,157,213,157,221,157,182,158,240,158,53,159,51,159,50,159,66,159,107,159,149,159,162,159,61,81,153,82,232,88,231,88,114,89,77,91,216,93,47,136,79,95,1,98,3,98,4,98,41,101,37,101,150,101,235,102,17,107,18,107,15,107,202,107,91,112,90,112,34,114,130,115,129,115,131,115,112,118,212,119,103,124,102,124,149,126,108,130,58,134,64,134,57,134,60,134,49,134,59,134,62,134,48,136,50,136,46,136,51,136,118,137,116,137,115,137,254,137,140,139,142,139,139,139,136,139,69,140,25,141,152,142,100,143,99,143,188,145,98,148,85,148,93,148,87,148,94,148,196,151,197,151,0,152,86,154,89,154,30,155,31,155,32,155,82,156,88,156,80,156,74,156,77,156,75,156,85,156,89,156,76,156,78,156,251,157,247,157,239,157,227,157,235,157,248,157,228,157,246,157,225,157,238,157,230,157,242,157,240,157,226,157,236,157,244,157,243,157,232,157,237,157,194,158,208,158,242,158,243,158,6,159,28,159,56,159,55,159,54,159,67,159,79,159,113,159,112,159,110,159,111,159,211,86,205,86,78,91,109,92,45,101,237,102,238,102,19,107,95,112,97,112,93,112,96,112,35,114,219,116,229,116,213,119,56,121,183,121,182,121,106,124,151,126,137,127,109,130,67,134,56,136,55,136,53,136,75,136,148,139,149,139,158,142,159,142,160,142,157,142,190,145,189,145,194,145,107,148,104,148,105,148,229,150,70,151,67,151,71,151,199,151,229,151,94,154,213,154,89,155,99,156,103,156,102,156,98,156,94,156,96,156,2,158,254,157,7,158,3,158,6,158,5,158,0,158,1,158,9,158,255,157,253,157,4,158,160,158,30,159,70,159,116,159,117,159,118,159,212,86,46,101,184,101,24,107,25,107,23,107,26,107,98,112,38,114,170,114,216,119,217,119,57,121,105,124,107,124,246,124,154,126,152,126,155,126,153,126,224,129,225,129,70,134,71,134,72,134,121,137,122,137,124,137,123,137,255,137,152,139,153,139,165,142,164,142,163,142,110,148,109,148,111,148,113,148,115,148,73,151,114,152,95,153,104,156,110,156,109,156,11,158,13,158,16,158,15,158,18,158,17,158,161,158,245,158,9,159,71,159,120,159,123,159,122,159,121,159,30,87,102,112,111,124,60,136,178,141,166,142,195,145,116,148,120,148,118,148,117,148,96,154,116,156,115,156,113,156,117,156,20,158,19,158,246,158,10,159,164,159,104,112,101,112,247,124,106,134,62,136,61,136,63,136,158,139,156,140,169,142,201,142,75,151,115,152,116,152,204,152,97,153,171,153,100,154,102,154,103,154,36,155,21,158,23,158,72,159,7,98,30,107,39,114,76,134,168,142,130,148,128,148,129,148,105,154,104,154,46,155,25,158,41,114,75,134,159,139,131,148,121,156,183,158,117,118,107,154,122,156,29,158,105,112,106,112,164,158,126,159,73,159,152,159,129,120,185,146,207,136,187,88,82,96,167,124,250,90,84,37,102,37,87,37,96,37,108,37,99,37,90,37,105,37,93,37,82,37,100,37,85,37,94,37,106,37,97,37,88,37,103,37,91,37,83,37,101,37,86,37,95,37,107,37,98,37,89,37,104,37,92,37,81,37,80,37,109,37,110,37,112,37,111,37,147,37,0,0,0,0,0,0,0,48,1,48,2,48,183,0,37,32,38,32,168,0,3,48,173,0,21,32,37,34,60,255,60,34,24,32,25,32,28,32,29,32,20,48,21,48,8,48,9,48,10,48,11,48,12,48,13,48,14,48,15,48,16,48,17,48,177,0,215,0,247,0,96,34,100,34,101,34,30,34,52,34,176,0,50,32,51,32,3,33,43,33,224,255,225,255,229,255,66,38,64,38,32,34,165,34,18,35,2,34,7,34,97,34,82,34,167,0,59,32,6,38,5,38,203,37,207,37,206,37,199,37,198,37,161,37,160,37,179,37,178,37,189,37,188,37,146,33,144,33,145,33,147,33,148,33,19,48,106,34,107,34,26,34,61,34,29,34,53,34,43,34,44,34,8,34,11,34,134,34,135,34,130,34,131,34,42,34,41,34,39,34,40,34,226,255,210,33,212,33,0,34,3,34,180,0,94,255,199,2,216,2,221,2,218,2,217,2,184,0,219,2,161,0,191,0,208,2,46,34,17,34,15,34,164,0,9,33,48,32,193,37,192,37,183,37,182,37,100,38,96,38,97,38,101,38,103,38,99,38,153,34,200,37,163,37,208,37,209,37,146,37,164,37,165,37,168,37,167,37,166,37,169,37,104,38,15,38,14,38,28,38,30,38,182,0,32,32,33,32,149,33,151,33,153,33,150,33,152,33,109,38,105,38,106,38,108,38,127,50,28,50,22,33,199,51,34,33,194,51,216,51,33,33,172,32,174,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,255,2,255,3,255,4,255,5,255,6,255,7,255,8,255,9,255,10,255,11,255,12,255,13,255,14,255,15,255,16,255,17,255,18,255,19,255,20,255,21,255,22,255,23,255,24,255,25,255,26,255,27,255,28,255,29,255,30,255,31,255,32,255,33,255,34,255,35,255,36,255,37,255,38,255,39,255,40,255,41,255,42,255,43,255,44,255,45,255,46,255,47,255,48,255,49,255,50,255,51,255,52,255,53,255,54,255,55,255,56,255,57,255,58,255,59,255,230,255,61,255,62,255,63,255,64,255,65,255,66,255,67,255,68,255,69,255,70,255,71,255,72,255,73,255,74,255,75,255,76,255,77,255,78,255,79,255,80,255,81,255,82,255,83,255,84,255,85,255,86,255,87,255,88,255,89,255,90,255,91,255,92,255,93,255,227,255,49,49,50,49,51,49,52,49,53,49,54,49,55,49,56,49,57,49,58,49,59,49,60,49,61,49,62,49,63,49,64,49,65,49,66,49,67,49,68,49,69,49,70,49,71,49,72,49,73,49,74,49,75,49,76,49,77,49,78,49,79,49,80,49,81,49,82,49,83,49,84,49,85,49,86,49,87,49,88,49,89,49,90,49,91,49,92,49,93,49,94,49,95,49,96,49,97,49,98,49,99,49,100,49,101,49,102,49,103,49,104,49,105,49,106,49,107,49,108,49,109,49,110,49,111,49,112,49,113,49,114,49,115,49,116,49,117,49,118,49,119,49,120,49,121,49,122,49,123,49,124,49,125,49,126,49,127,49,128,49,129,49,130,49,131,49,132,49,133,49,134,49,135,49,136,49,137,49,138,49,139,49,140,49,141,49,142,49,112,33,113,33,114,33,115,33,116,33,117,33,118,33,119,33,120,33,121,33,0,0,0,0,0,0,0,0,0,0,96,33,97,33,98,33,99,33,100,33,101,33,102,33,103,33,104,33,105,33,0,0,0,0,0,0,0,0,0,0,0,0,0,0,145,3,146,3,147,3,148,3,149,3,150,3,151,3,152,3,153,3,154,3,155,3,156,3,157,3,158,3,159,3,160,3,161,3,163,3,164,3,165,3,166,3,167,3,168,3,169,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,177,3,178,3,179,3,180,3,181,3,182,3,183,3,184,3,185,3,186,3,187,3,188,3,189,3,190,3,191,3,192,3,193,3,195,3,196,3,197,3,198,3,199,3,200,3,201,3,0,0,0,0,0,0,0,0,0,0,0,0,0,37,2,37,12,37,16,37,24,37,20,37,28,37,44,37,36,37,52,37,60,37,1,37,3,37,15,37,19,37,27,37,23,37,35,37,51,37,43,37,59,37,75,37,32,37,47,37,40,37,55,37,63,37,29,37,48,37,37,37,56,37,66,37,18,37,17,37,26,37,25,37,22,37,21,37,14,37,13,37,30,37,31,37,33,37,34,37,38,37,39,37,41,37,42,37,45,37,46,37,49,37,50,37,53,37,54,37,57,37,58,37,61,37,62,37,64,37,65,37,67,37,68,37,69,37,70,37,71,37,72,37,73,37,74,37,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,149,51,150,51,151,51,19,33,152,51,196,51,163,51,164,51,165,51,166,51,153,51,154,51,155,51,156,51,157,51,158,51,159,51,160,51,161,51,162,51,202,51,141,51,142,51,143,51,207,51,136,51,137,51,200,51,167,51,168,51,176,51,177,51,178,51,179,51,180,51,181,51,182,51,183,51,184,51,185,51,128,51,129,51,130,51,131,51,132,51,186,51,187,51,188,51,189,51,190,51,191,51,144,51,145,51,146,51,147,51,148,51,38,33,192,51,193,51,138,51,139,51,140,51,214,51,197,51,173,51,174,51,175,51,219,51,169,51,170,51,171,51,172,51,221,51,208,51,211,51,195,51,201,51,220,51,198,51,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,198,0,208,0,170,0,38,1,0,0,50,1,0,0,63,1,65,1,216,0,82,1,186,0,222,0,102,1,74,1,0,0,96,50,97,50,98,50,99,50,100,50,101,50,102,50,103,50,104,50,105,50,106,50,107,50,108,50,109,50,110,50,111,50,112,50,113,50,114,50,115,50,116,50,117,50,118,50,119,50,120,50,121,50,122,50,123,50,208,36,209,36,210,36,211,36,212,36,213,36,214,36,215,36,216,36,217,36,218,36,219,36,220,36,221,36,222,36,223,36,224,36,225,36,226,36,227,36,228,36,229,36,230,36,231,36,232,36,233,36,96,36,97,36,98,36,99,36,100,36,101,36,102,36,103,36,104,36,105,36,106,36,107,36,108,36,109,36,110,36,189,0,83,33,84,33,188,0,190,0,91,33,92,33,93,33,94,33,230,0,17,1,240,0,39,1,49,1,51,1,56,1,64,1,66,1,248,0,83,1,223,0,254,0,103,1,75,1,73,1,0,50,1,50,2,50,3,50,4,50,5,50,6,50,7,50,8,50,9,50,10,50,11,50,12,50,13,50,14,50,15,50,16,50,17,50,18,50,19,50,20,50,21,50,22,50,23,50,24,50,25,50,26,50,27,50,156,36,157,36,158,36,159,36,160,36,161,36,162,36,163,36,164,36,165,36,166,36,167,36,168,36,169,36,170,36,171,36,172,36,173,36,174,36,175,36,176,36,177,36,178,36,179,36,180,36,181,36,116,36,117,36,118,36,119,36,120,36,121,36,122,36,123,36,124,36,125,36,126,36,127,36,128,36,129,36,130,36,185,0,178,0,179,0,116,32,127,32,129,32,130,32,131,32,132,32,65,48,66,48,67,48,68,48,69,48,70,48,71,48,72,48,73,48,74,48,75,48,76,48,77,48,78,48,79,48,80,48,81,48,82,48,83,48,84,48,85,48,86,48,87,48,88,48,89,48,90,48,91,48,92,48,93,48,94,48,95,48,96,48,97,48,98,48,99,48,100,48,101,48,102,48,103,48,104,48,105,48,106,48,107,48,108,48,109,48,110,48,111,48,112,48,113,48,114,48,115,48,116,48,117,48,118,48,119,48,120,48,121,48,122,48,123,48,124,48,125,48,126,48,127,48,128,48,129,48,130,48,131,48,132,48,133,48,134,48,135,48,136,48,137,48,138,48,139,48,140,48,141,48,142,48,143,48,144,48,145,48,146,48,147,48,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,161,48,162,48,163,48,164,48,165,48,166,48,167,48,168,48,169,48,170,48,171,48,172,48,173,48,174,48,175,48,176,48,177,48,178,48,179,48,180,48,181,48,182,48,183,48,184,48,185,48,186,48,187,48,188,48,189,48,190,48,191,48,192,48,193,48,194,48,195,48,196,48,197,48,198,48,199,48,200,48,201,48,202,48,203,48,204,48,205,48,206,48,207,48,208,48,209,48,210,48,211,48,212,48,213,48,214,48,215,48,216,48,217,48,218,48,219,48,220,48,221,48,222,48,223,48,224,48,225,48,226,48,227,48,228,48,229,48,230,48,231,48,232,48,233,48,234,48,235,48,236,48,237,48,238,48,239,48,240,48,241,48,242,48,243,48,244,48,245,48,246,48,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,4,17,4,18,4,19,4,20,4,21,4,1,4,22,4,23,4,24,4,25,4,26,4,27,4,28,4,29,4,30,4,31,4,32,4,33,4,34,4,35,4,36,4,37,4,38,4,39,4,40,4,41,4,42,4,43,4,44,4,45,4,46,4,47,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,4,49,4,50,4,51,4,52,4,53,4,81,4,54,4,55,4,56,4,57,4,58,4,59,4,60,4,61,4,62,4,63,4,64,4,65,4,66,4,67,4,68,4,69,4,70,4,71,4,72,4,73,4,74,4,75,4,76,4,77,4,78,4,79,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,172,1,172,4,172,7,172,8,172,9,172,10,172,16,172,17,172,18,172,19,172,20,172,21,172,22,172,23,172,25,172,26,172,27,172,28,172,29,172,32,172,36,172,44,172,45,172,47,172,48,172,49,172,56,172,57,172,60,172,64,172,75,172,77,172,84,172,88,172,92,172,112,172,113,172,116,172,119,172,120,172,122,172,128,172,129,172,131,172,132,172,133,172,134,172,137,172,138,172,139,172,140,172,144,172,148,172,156,172,157,172,159,172,160,172,161,172,168,172,169,172,170,172,172,172,175,172,176,172,184,172,185,172,187,172,188,172,189,172,193,172,196,172,200,172,204,172,213,172,215,172,224,172,225,172,228,172,231,172,232,172,234,172,236,172,239,172,240,172,241,172,243,172,245,172,246,172,252,172,253,172,0,173,4,173,6,173,12,173,13,173,15,173,17,173,24,173,28,173,32,173,41,173,44,173,45,173,52,173,53,173,56,173,60,173,68,173,69,173,71,173,73,173,80,173,84,173,88,173,97,173,99,173,108,173,109,173,112,173,115,173,116,173,117,173,118,173,123,173,124,173,125,173,127,173,129,173,130,173,136,173,137,173,140,173,144,173,156,173,157,173,164,173,183,173,192,173,193,173,196,173,200,173,208,173,209,173,211,173,220,173,224,173,228,173,248,173,249,173,252,173,255,173,0,174,1,174,8,174,9,174,11,174,13,174,20,174,48,174,49,174,52,174,55,174,56,174,58,174,64,174,65,174,67,174,69,174,70,174,74,174,76,174,77,174,78,174,80,174,84,174,86,174,92,174,93,174,95,174,96,174,97,174,101,174,104,174,105,174,108,174,112,174,120,174,121,174,123,174,124,174,125,174,132,174,133,174,140,174,188,174,189,174,190,174,192,174,196,174,204,174,205,174,207,174,208,174,209,174,216,174,217,174,220,174,232,174,235,174,237,174,244,174,248,174,252,174,7,175,8,175], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+99052);
/* memory initializer */ allocate([13,175,16,175,44,175,45,175,48,175,50,175,52,175,60,175,61,175,63,175,65,175,66,175,67,175,72,175,73,175,80,175,92,175,93,175,100,175,101,175,121,175,128,175,132,175,136,175,144,175,145,175,149,175,156,175,184,175,185,175,188,175,192,175,199,175,200,175,201,175,203,175,205,175,206,175,212,175,220,175,232,175,233,175,240,175,241,175,244,175,248,175,0,176,1,176,4,176,12,176,16,176,20,176,28,176,29,176,40,176,68,176,69,176,72,176,74,176,76,176,78,176,83,176,84,176,85,176,87,176,89,176,93,176,124,176,125,176,128,176,132,176,140,176,141,176,143,176,145,176,152,176,153,176,154,176,156,176,159,176,160,176,161,176,162,176,168,176,169,176,171,176,172,176,173,176,174,176,175,176,177,176,179,176,180,176,181,176,184,176,188,176,196,176,197,176,199,176,200,176,201,176,208,176,209,176,212,176,216,176,224,176,229,176,8,177,9,177,11,177,12,177,16,177,18,177,19,177,24,177,25,177,27,177,28,177,29,177,35,177,36,177,37,177,40,177,44,177,52,177,53,177,55,177,56,177,57,177,64,177,65,177,68,177,72,177,80,177,81,177,84,177,85,177,88,177,92,177,96,177,120,177,121,177,124,177,128,177,130,177,136,177,137,177,139,177,141,177,146,177,147,177,148,177,152,177,156,177,168,177,204,177,208,177,212,177,220,177,221,177,223,177,232,177,233,177,236,177,240,177,249,177,251,177,253,177,4,178,5,178,8,178,11,178,12,178,20,178,21,178,23,178,25,178,32,178,52,178,60,178,88,178,92,178,96,178,104,178,105,178,116,178,117,178,124,178,132,178,133,178,137,178,144,178,145,178,148,178,152,178,153,178,154,178,160,178,161,178,163,178,165,178,166,178,170,178,172,178,176,178,180,178,200,178,201,178,204,178,208,178,210,178,216,178,217,178,219,178,221,178,226,178,228,178,229,178,230,178,232,178,235,178,236,178,237,178,238,178,239,178,243,178,244,178,245,178,247,178,248,178,249,178,250,178,251,178,255,178,0,179,1,179,4,179,8,179,16,179,17,179,19,179,20,179,21,179,28,179,84,179,85,179,86,179,88,179,91,179,92,179,94,179,95,179,100,179,101,179,103,179,105,179,107,179,110,179,112,179,113,179,116,179,120,179,128,179,129,179,131,179,132,179,133,179,140,179,144,179,148,179,160,179,161,179,168,179,172,179,196,179,197,179,200,179,203,179,204,179,206,179,208,179,212,179,213,179,215,179,217,179,219,179,221,179,224,179,228,179,232,179,252,179,16,180,24,180,28,180,32,180,40,180,41,180,43,180,52,180,80,180,81,180,84,180,88,180,96,180,97,180,99,180,101,180,108,180,128,180,136,180,157,180,164,180,168,180,172,180,181,180,183,180,185,180,192,180,196,180,200,180,208,180,213,180,220,180,221,180,224,180,227,180,228,180,230,180,236,180,237,180,239,180,241,180,248,180,20,181,21,181,24,181,27,181,28,181,36,181,37,181,39,181,40,181,41,181,42,181,48,181,49,181,52,181,56,181,64,181,65,181,67,181,68,181,69,181,75,181,76,181,77,181,80,181,84,181,92,181,93,181,95,181,96,181,97,181,160,181,161,181,164,181,168,181,170,181,171,181,176,181,177,181,179,181,180,181,181,181,187,181,188,181,189,181,192,181,196,181,204,181,205,181,207,181,208,181,209,181,216,181,236,181,16,182,17,182,20,182,24,182,37,182,44,182,52,182,72,182,100,182,104,182,156,182,157,182,160,182,164,182,171,182,172,182,177,182,212,182,240,182,244,182,248,182,0,183,1,183,5,183,40,183,41,183,44,183,47,183,48,183,56,183,57,183,59,183,68,183,72,183,76,183,84,183,85,183,96,183,100,183,104,183,112,183,113,183,115,183,117,183,124,183,125,183,128,183,132,183,140,183,141,183,143,183,144,183,145,183,146,183,150,183,151,183,152,183,153,183,156,183,160,183,168,183,169,183,171,183,172,183,173,183,180,183,181,183,184,183,199,183,201,183,236,183,237,183,240,183,244,183,252,183,253,183,255,183,0,184,1,184,7,184,8,184,9,184,12,184,16,184,24,184,25,184,27,184,29,184,36,184,37,184,40,184,44,184,52,184,53,184,55,184,56,184,57,184,64,184,68,184,81,184,83,184,92,184,93,184,96,184,100,184,108,184,109,184,111,184,113,184,120,184,124,184,141,184,168,184,176,184,180,184,184,184,192,184,193,184,195,184,197,184,204,184,208,184,212,184,221,184,223,184,225,184,232,184,233,184,236,184,240,184,248,184,249,184,251,184,253,184,4,185,24,185,32,185,60,185,61,185,64,185,68,185,76,185,79,185,81,185,88,185,89,185,92,185,96,185,104,185,105,185,107,185,109,185,116,185,117,185,120,185,124,185,132,185,133,185,135,185,137,185,138,185,141,185,142,185,172,185,173,185,176,185,180,185,188,185,189,185,191,185,193,185,200,185,201,185,204,185,206,185,207,185,208,185,209,185,210,185,216,185,217,185,219,185,221,185,222,185,225,185,227,185,228,185,229,185,232,185,236,185,244,185,245,185,247,185,248,185,249,185,250,185,0,186,1,186,8,186,21,186,56,186,57,186,60,186,64,186,66,186,72,186,73,186,75,186,77,186,78,186,83,186,84,186,85,186,88,186,92,186,100,186,101,186,103,186,104,186,105,186,112,186,113,186,116,186,120,186,131,186,132,186,133,186,135,186,140,186,168,186,169,186,171,186,172,186,176,186,178,186,184,186,185,186,187,186,189,186,196,186,200,186,216,186,217,186,252,186,0,187,4,187,13,187,15,187,17,187,24,187,28,187,32,187,41,187,43,187,52,187,53,187,54,187,56,187,59,187,60,187,61,187,62,187,68,187,69,187,71,187,73,187,77,187,79,187,80,187,84,187,88,187,97,187,99,187,108,187,136,187,140,187,144,187,164,187,168,187,172,187,180,187,183,187,192,187,196,187,200,187,208,187,211,187,248,187,249,187,252,187,255,187,0,188,2,188,8,188,9,188,11,188,12,188,13,188,15,188,17,188,20,188,21,188,22,188,23,188,24,188,27,188,28,188,29,188,30,188,31,188,36,188,37,188,39,188,41,188,45,188,48,188,49,188,52,188,56,188,64,188,65,188,67,188,68,188,69,188,73,188,76,188,77,188,80,188,93,188,132,188,133,188,136,188,139,188,140,188,142,188,148,188,149,188,151,188,153,188,154,188,160,188,161,188,164,188,167,188,168,188,176,188,177,188,179,188,180,188,181,188,188,188,189,188,192,188,196,188,205,188,207,188,208,188,209,188,213,188,216,188,220,188,244,188,245,188,246,188,248,188,252,188,4,189,5,189,7,189,9,189,16,189,20,189,36,189,44,189,64,189,72,189,73,189,76,189,80,189,88,189,89,189,100,189,104,189,128,189,129,189,132,189,135,189,136,189,137,189,138,189,144,189,145,189,147,189,149,189,153,189,154,189,156,189,164,189,176,189,184,189,212,189,213,189,216,189,220,189,233,189,240,189,244,189,248,189,0,190,3,190,5,190,12,190,13,190,16,190,20,190,28,190,29,190,31,190,68,190,69,190,72,190,76,190,78,190,84,190,85,190,87,190,89,190,90,190,91,190,96,190,97,190,100,190,104,190,106,190,112,190,113,190,115,190,116,190,117,190,123,190,124,190,125,190,128,190,132,190,140,190,141,190,143,190,144,190,145,190,152,190,153,190,168,190,208,190,209,190,212,190,215,190,216,190,224,190,227,190,228,190,229,190,236,190,1,191,8,191,9,191,24,191,25,191,27,191,28,191,29,191,64,191,65,191,68,191,72,191,80,191,81,191,85,191,148,191,176,191,197,191,204,191,205,191,208,191,212,191,220,191,223,191,225,191,60,192,81,192,88,192,92,192,96,192,104,192,105,192,144,192,145,192,148,192,152,192,160,192,161,192,163,192,165,192,172,192,173,192,175,192,176,192,179,192,180,192,181,192,182,192,188,192,189,192,191,192,192,192,193,192,197,192,200,192,201,192,204,192,208,192,216,192,217,192,219,192,220,192,221,192,228,192,229,192,232,192,236,192,244,192,245,192,247,192,249,192,0,193,4,193,8,193,16,193,21,193,28,193,29,193,30,193,31,193,32,193,35,193,36,193,38,193,39,193,44,193,45,193,47,193,48,193,49,193,54,193,56,193,57,193,60,193,64,193,72,193,73,193,75,193,76,193,77,193,84,193,85,193,88,193,92,193,100,193,101,193,103,193,104,193,105,193,112,193,116,193,120,193,133,193,140,193,141,193,142,193,144,193,148,193,150,193,156,193,157,193,159,193,161,193,165,193,168,193,169,193,172,193,176,193,189,193,196,193,200,193,204,193,212,193,215,193,216,193,224,193,228,193,232,193,240,193,241,193,243,193,252,193,253,193,0,194,4,194,12,194,13,194,15,194,17,194,24,194,25,194,28,194,31,194,32,194,40,194,41,194,43,194,45,194,47,194,49,194,50,194,52,194,72,194,80,194,81,194,84,194,88,194,96,194,101,194,108,194,109,194,112,194,116,194,124,194,125,194,127,194,129,194,136,194,137,194,144,194,152,194,155,194,157,194,164,194,165,194,168,194,172,194,173,194,180,194,181,194,183,194,185,194,220,194,221,194,224,194,227,194,228,194,235,194,236,194,237,194,239,194,241,194,246,194,248,194,249,194,251,194,252,194,0,195,8,195,9,195,12,195,13,195,19,195,20,195,21,195,24,195,28,195,36,195,37,195,40,195,41,195,69,195,104,195,105,195,108,195,112,195,114,195,120,195,121,195,124,195,125,195,132,195,136,195,140,195,192,195,216,195,217,195,220,195,223,195,224,195,226,195,232,195,233,195,237,195,244,195,245,195,248,195,8,196,16,196,36,196,44,196,48,196,52,196,60,196,61,196,72,196,100,196,101,196,104,196,108,196,116,196,117,196,121,196,128,196,148,196,156,196,184,196,188,196,233,196,240,196,241,196,244,196,248,196,250,196,255,196,0,197,1,197,12,197,16,197,20,197,28,197,40,197,41,197,44,197,48,197,56,197,57,197,59,197,61,197,68,197,69,197,72,197,73,197,74,197,76,197,77,197,78,197,83,197,84,197,85,197,87,197,88,197,89,197,93,197,94,197,96,197,97,197,100,197,104,197,112,197,113,197,115,197,116,197,117,197,124,197,125,197,128,197,132,197,135,197,140,197,141,197,143,197,145,197,149,197,151,197,152,197,156,197,160,197,169,197,180,197,181,197,184,197,185,197,187,197,188,197,189,197,190,197,196,197,197,197,198,197,199,197,200,197,201,197,202,197,204,197,206,197,208,197,209,197,212,197,216,197,224,197,225,197,227,197,229,197,236,197,237,197,238,197,240,197,244,197,246,197,247,197,252,197,253,197,254,197,255,197,0,198,1,198,5,198,6,198,7,198,8,198,12,198,16,198,24,198,25,198,27,198,28,198,36,198,37,198,40,198,44,198,45,198,46,198,48,198,51,198,52,198,53,198,55,198,57,198,59,198,64,198,65,198,68,198,72,198,80,198,81,198,83,198,84,198,85,198,92,198,93,198,96,198,108,198,111,198,113,198,120,198,121,198,124,198,128,198,136,198,137,198,139,198,141,198,148,198,149,198,152,198,156,198,164,198,165,198,167,198,169,198,176,198,177,198,180,198,184,198,185,198,186,198,192,198,193,198,195,198,197,198,204,198,205,198,208,198,212,198,220,198,221,198,224,198,225,198,232,198,233,198,236,198,240,198,248,198,249,198,253,198,4,199,5,199,8,199,12,199,20,199,21,199,23,199,25,199,32,199,33,199,36,199,40,199,48,199,49,199,51,199,53,199,55,199,60,199,61,199,64,199,68,199,74,199,76,199,77,199,79,199,81,199,82,199,83,199,84,199,85,199,86,199,87,199,88,199,92,199,96,199,104,199,107,199,116,199,117,199,120,199,124,199,125,199,126,199,131,199,132,199,133,199,135,199,136,199,137,199,138,199,142,199,144,199,145,199,148,199,150,199,151,199,152,199,154,199,160,199,161,199,163,199,164,199,165,199,166,199,172,199,173,199,176,199,180,199,188,199,189,199,191,199,192,199,193,199,200,199,201,199,204,199,206,199,208,199,216,199,221,199,228,199,232,199,236,199,0,200,1,200,4,200,8,200,10,200,16,200,17,200,19,200,21,200,22,200,28,200,29,200,32,200,36,200,44,200,45,200,47,200,49,200,56,200,60,200,64,200,72,200,73,200,76,200,77,200,84,200,112,200,113,200,116,200,120,200,122,200,128,200,129,200,131,200,133,200,134,200,135,200,139,200,140,200,141,200,148,200,157,200,159,200,161,200,168,200,188,200,189,200,196,200,200,200,204,200,212,200,213,200,215,200,217,200,224,200,225,200,228,200,245,200,252,200,253,200,0,201,4,201,5,201,6,201,12,201,13,201,15,201,17,201,24,201,44,201,52,201,80,201,81,201,84,201,88,201,96,201,97,201,99,201,108,201,112,201,116,201,124,201,136,201,137,201,140,201,144,201,152,201,153,201,155,201,157,201,192,201,193,201,196,201,199,201,200,201,202,201,208,201,209,201,211,201,213,201,214,201,217,201,218,201,220,201,221,201,224,201,226,201,228,201,231,201,236,201,237,201,239,201,240,201,241,201,248,201,249,201,252,201,0,202,8,202,9,202,11,202,12,202,13,202,20,202,24,202,41,202,76,202,77,202,80,202,84,202,92,202,93,202,95,202,96,202,97,202,104,202,125,202,132,202,152,202,188,202,189,202,192,202,196,202,204,202,205,202,207,202,209,202,211,202,216,202,217,202,224,202,236,202,244,202,8,203,16,203,20,203,24,203,32,203,33,203,65,203,72,203,73,203,76,203,80,203,88,203,89,203,93,203,100,203,120,203,121,203,156,203,184,203,212,203,228,203,231,203,233,203,12,204,13,204,16,204,20,204,28,204,29,204,33,204,34,204,39,204,40,204,41,204,44,204,46,204,48,204,56,204,57,204,59,204,60,204,61,204,62,204,68,204,69,204,72,204,76,204,84,204,85,204,87,204,88,204,89,204,96,204,100,204,102,204,104,204,112,204,117,204,152,204,153,204,156,204,160,204,168,204,169,204,171,204,172,204,173,204,180,204,181,204,184,204,188,204,196,204,197,204,199,204,201,204,208,204,212,204,228,204,236,204,240,204,1,205,8,205,9,205,12,205,16,205,24,205,25,205,27,205,29,205,36,205,40,205,44,205,57,205,92,205,96,205,100,205,108,205,109,205,111,205,113,205,120,205,136,205,148,205,149,205,152,205,156,205,164,205,165,205,167,205,169,205,176,205,196,205,204,205,208,205,232,205,236,205,240,205,248,205,249,205,251,205,253,205,4,206,8,206,12,206,20,206,25,206,32,206,33,206,36,206,40,206,48,206,49,206,51,206,53,206,88,206,89,206,92,206,95,206,96,206,97,206,104,206,105,206,107,206,109,206,116,206,117,206,120,206,124,206,132,206,133,206,135,206,137,206,144,206,145,206,148,206,152,206,160,206,161,206,163,206,164,206,165,206,172,206,173,206,193,206,228,206,229,206,232,206,235,206,236,206,244,206,245,206,247,206,248,206,249,206,0,207,1,207,4,207,8,207,16,207,17,207,19,207,21,207,28,207,32,207,36,207,44,207,45,207,47,207,48,207,49,207,56,207,84,207,85,207,88,207,92,207,100,207,101,207,103,207,105,207,112,207,113,207,116,207,120,207,128,207,133,207,140,207,161,207,168,207,176,207,196,207,224,207,225,207,228,207,232,207,240,207,241,207,243,207,245,207,252,207,0,208,4,208,17,208,24,208,45,208,52,208,53,208,56,208,60,208,68,208,69,208,71,208,73,208,80,208,84,208,88,208,96,208,108,208,109,208,112,208,116,208,124,208,125,208,129,208,164,208,165,208,168,208,172,208,180,208,181,208,183,208,185,208,192,208,193,208,196,208,200,208,201,208,208,208,209,208,211,208,212,208,213,208,220,208,221,208,224,208,228,208,236,208,237,208,239,208,240,208,241,208,248,208,13,209,48,209,49,209,52,209,56,209,58,209,64,209,65,209,67,209,68,209,69,209,76,209,77,209,80,209,84,209,92,209,93,209,95,209,97,209,104,209,108,209,124,209,132,209,136,209,160,209,161,209,164,209,168,209,176,209,177,209,179,209,181,209,186,209,188,209,192,209,216,209,244,209,248,209,7,210,9,210,16,210,44,210,45,210,48,210,52,210,60,210,61,210,63,210,65,210,72,210,92,210,100,210,128,210,129,210,132,210,136,210,144,210,145,210,149,210,156,210,160,210,164,210,172,210,177,210,184,210,185,210,188,210,191,210,192,210,194,210,200,210,201,210,203,210,212,210,216,210,220,210,228,210,229,210,240,210,241,210,244,210,248,210,0,211,1,211,3,211,5,211,12,211,13,211,14,211,16,211,20,211,22,211,28,211,29,211,31,211,32,211,33,211,37,211,40,211,41,211,44,211,48,211,56,211,57,211,59,211,60,211,61,211,68,211,69,211,124,211,125,211,128,211,132,211,140,211,141,211,143,211,144,211,145,211,152,211,153,211,156,211,160,211,168,211,169,211,171,211,173,211,180,211,184,211,188,211,196,211,197,211,200,211,201,211,208,211,216,211,225,211,227,211,236,211,237,211,240,211,244,211,252,211,253,211,255,211,1,212,8,212,29,212,64,212,68,212,92,212,96,212,100,212,109,212,111,212,120,212,121,212,124,212,127,212,128,212,130,212,136,212,137,212,139,212,141,212,148,212,169,212,204,212,208,212,212,212,220,212,223,212,232,212,236,212,240,212,248,212,251,212,253,212,4,213,8,213,12,213,20,213,21,213,23,213,60,213,61,213,64,213,68,213,76,213,77,213,79,213,81,213,88,213,89,213,92,213,96,213,101,213,104,213,105,213,107,213,109,213,116,213,117,213,120,213,124,213,132,213,133,213,135,213,136,213,137,213,144,213,165,213,200,213,201,213,204,213,208,213,210,213,216,213,217,213,219,213,221,213,228,213,229,213,232,213,236,213,244,213,245,213,247,213,249,213,0,214,1,214,4,214,8,214,16,214,17,214,19,214,20,214,21,214,28,214,32,214,36,214,45,214,56,214,57,214,60,214,64,214,69,214,72,214,73,214,75,214,77,214,81,214,84,214,85,214,88,214,92,214,103,214,105,214,112,214,113,214,116,214,131,214,133,214,140,214,141,214,144,214,148,214,157,214,159,214,161,214,168,214,172,214,176,214,185,214,187,214,196,214,197,214,200,214,204,214,209,214,212,214,215,214,217,214,224,214,228,214,232,214,240,214,245,214,252,214,253,214,0,215,4,215,17,215,24,215,25,215,28,215,32,215,40,215,41,215,43,215,45,215,52,215,53,215,56,215,60,215,68,215,71,215,73,215,80,215,81,215,84,215,86,215,87,215,88,215,89,215,96,215,97,215,99,215,101,215,105,215,108,215,112,215,116,215,124,215,125,215,129,215,136,215,137,215,140,215,144,215,152,215,153,215,155,215,157,215,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,61,79,115,79,71,80,249,80,160,82,239,83,117,84,229,84,9,86,193,90,182,91,135,102,182,103,183,103,239,103,76,107,194,115,194,117,60,122,219,130,4,131,87,136,136,136,54,138,200,140,207,141,251,142,230,143,213,153,59,82,116,83,4,84,106,96,100,97,188,107,207,115,26,129,186,137,210,137,163,149,131,79,10,82,190,88,120,89,230,89,114,94,121,94,199,97,192,99,70,103,236,103,127,104,151,111,78,118,11,119,245,120,8,122,255,122,33,124,157,128,110,130,113,130,235,138,147,149,107,78,157,85,247,102,52,110,163,120,237,122,91,132,16,137,78,135,168,151,216,82,78,87,42,88,76,93,31,97,190,97,33,98,98,101,209,103,68,106,27,110,24,117,179,117,227,118,176,119,58,125,175,144,81,148,82,148,149,159,35,83,172,92,50,117,219,128,64,146,152,149,91,82,8,88,220,89,161,92,23,93,183,94,58,95,74,95,119,97,95,108,122,117,134,117,224,124,115,125,177,125,140,127,84,129,33,130,145,133,65,137,27,139,252,146,77,150,71,156,203,78,247,78,11,80,241,81,79,88,55,97,62,97,104,97,57,101,234,105,17,111,165,117,134,118,214,118,135,123,165,130,203,132,0,249,167,147,139,149,128,85,162,91,81,87,1,249,179,124,185,127,181,145,40,80,187,83,69,92,232,93,210,98,110,99,218,100,231,100,32,110,172,112,91,121,221,141,30,142,2,249,125,144,69,146,248,146,126,78,246,78,101,80,254,93,250,94,6,97,87,105,113,129,84,134,71,142,117,147,43,154,94,78,145,80,112,103,64,104,9,81,141,82,146,82,162,106,188,119,16,146,212,158,171,82,47,96,242,143,72,80,169,97,237,99,202,100,60,104,132,106,192,111,136,129,161,137,148,150,5,88,125,114,172,114,4,117,121,125,109,126,169,128,139,137,116,139,99,144,81,157,137,98,122,108,84,111,80,125,58,127,35,138,124,81,74,97,157,123,25,139,87,146,140,147,172,78,211,79,30,80,190,80,6,81,193,82,205,82,127,83,112,87,131,88,154,94,145,95,118,97,172,97,206,100,108,101,111,102,187,102,244,102,151,104,135,109,133,112,241,112,159,116,165,116,202,116,217,117,108,120,236,120,223,122,246,122,69,125,147,125,21,128,63,128,27,129,150,131,102,139,21,143,21,144,225,147,3,152,56,152,90,154,232,155,194,79,83,85,58,88,81,89,99,91,70,92,184,96,18,98,66,104,176,104,232,104,170,110,76,117,120,118,206,120,61,122,251,124,107,126,124,126,8,138,161,138,63,140,142,150,196,157,228,83,233,83,74,84,113,84,250,86,209,89,100,91,59,92,171,94,247,98,55,101,69,101,114,101,160,102,175,103,193,105,189,108,252,117,144,118,126,119,63,122,148,127,3,128,161,128,143,129,230,130,253,130,240,131,193,133,49,136,180,136,165,138,3,249,156,143,46,147,199,150,103,152,216,154,19,159,237,84,155,101,242,102,143,104,64,122,55,140,96,157,240,86,100,87,17,93,6,102,177,104,205,104,254,110,40,116,158,136,228,155,104,108,4,249,168,154,155,79,108,81,113,81,159,82,84,91,229,93,80,96,109,96,241,98,167,99,59,101,217,115,122,122,163,134,162,140,143,151,50,78,225,91,8,98,156,103,220,116,209,121,211,131,135,138,178,138,232,141,78,144,75,147,70,152,211,94,232,105,255,133,237,144,5,249,160,81,152,91,236,91,99,97,250,104,62,107,76,112,47,116,216,116,161,123,80,127,197,131,192,137,171,140,220,149,40,153,46,82,93,96,236,98,2,144,138,79,73,81,33,83,217,88,227,94,224,102,56,109,154,112,194,114,214,115,80,123,241,128,91,148,102,83,155,99,107,127,86,78,128,80,74,88,222,88,42,96,39,97,208,98,208,105,65,155,143,91,24,125,177,128,95,143,164,78,209,80,172,84,172,85,12,91,160,93,231,93,42,101,78,101,33,104,75,106,225,114,142,118,239,119,94,125,249,127,160,129,78,133,223,134,3,143,78,143,202,144,3,153,85,154,171,155,24,78,69,78,93,78,199,78,241,79,119,81,254,82,64,83,227,83,229,83,142,84,20,86,117,87,162,87,199,91,135,93,208,94,252,97,216,98,81,101,184,103,233,103,203,105,80,107,198,107,236,107,66,108,157,110,120,112,215,114,150,115,3,116,191,119,233,119,118,122,127,125,9,128,252,129,5,130,10,130,223,130,98,136,51,139,252,140,192,142,17,144,177,144,100,146,182,146,210,153,69,154,233,156,215,157,156,159,11,87,64,92,202,131,160,151,171,151,180,158,27,84,152,122,164,127,217,136,205,142,225,144,0,88,72,92,152,99,159,122,174,91,19,95,121,122,174,122,142,130,172,142,38,80,56,82,248,82,119,83,8,87,243,98,114,99,10,107,195,109,55,119,165,83,87,115,104,133,118,142,213,149,58,103,195,106,112,111,109,138,204,142,75,153,6,249,119,102,120,107,180,140,60,155,7,249,235,83,45,87,78,89,198,99,251,105,234,115,69,120,186,122,197,122,254,124,117,132,143,137,115,141,53,144,168,149,251,82,71,87,71,117,96,123,204,131,30,146,8,249,88,106,75,81,75,82,135,82,31,98,216,104,117,105,153,150,197,80,164,82,228,82,195,97,164,101,57,104,255,105,126,116,75,123,185,130,235,131,178,137,57,139,209,143,73,153,9,249,202,78,151,89,210,100,17,102,142,106,52,116,129,121,189,121,169,130,126,136,127,136,95,137,10,249,38,147,11,79,202,83,37,96,113,98,114,108,26,125,102,125,152,78,98,81,220,119,175,128,1,79,14,79,118,81,128,81,220,85,104,86,59,87,250,87,252,87,20,89,71,89,147,89,196,91,144,92,14,93,241,93,126,94,204,95,128,98,215,101,227,101,30,103,31,103,94,103,203,104,196,104,95,106,58,107,35,108,125,108,130,108,199,109,152,115,38,116,42,116,130,116,163,116,120,117,127,117,129,120,239,120,65,121,71,121,72,121,122,121,149,123,0,125,186,125,136,127,6,128,45,128,140,128,24,138,79,139,72,140,119,141,33,147,36,147,226,152,81,153,14,154,15,154,101,154,146,158,202,125,118,79,9,84,238,98,84,104,209,145,171,85,58,81,11,249,12,249,28,90,230,97,13,249,207,98,255,98,14,249,15,249,16,249,17,249,18,249,19,249,163,144,20,249,21,249,22,249,23,249,24,249,254,138,25,249,26,249,27,249,28,249,150,102,29,249,86,113,30,249,31,249,227,150,32,249,79,99,122,99,87,83,33,249,143,103,96,105,115,110,34,249,55,117,35,249,36,249,37,249,13,125,38,249,39,249,114,136,202,86,24,90,40,249,41,249,42,249,43,249,44,249,67,78,45,249,103,81,72,89,240,103,16,128,46,249,115,89,116,94,154,100,202,121,245,95,108,96,200,98,123,99,231,91,215,91,170,82,47,249,116,89,41,95,18,96,48,249,49,249,50,249,89,116,51,249,52,249,53,249,54,249,55,249,56,249,209,153,57,249,58,249,59,249,60,249,61,249,62,249,63,249,64,249,65,249,66,249,67,249,195,111,68,249,69,249,191,129,178,143,241,96,70,249,71,249,102,129,72,249,73,249,63,92,74,249,75,249,76,249,77,249,78,249,79,249,80,249,81,249,233,90,37,138,123,103,16,125,82,249,83,249,84,249,85,249,86,249,87,249,253,128,88,249,89,249,60,92,229,108,63,83,186,110,26,89,54,131,57,78,182,78,70,79,174,85,24,87,199,88,86,95,183,101,230,101,128,106,181,107,77,110,237,119,239,122,30,124,222,125,203,134,146,136,50,145,91,147,187,100,190,111,122,115,184,117,84,144,86,85,77,87,186,97,212,100,199,102,225,109,91,110,109,111,185,111,240,117,67,128,189,129,65,133,131,137,199,138,90,139,31,147,147,108,83,117,84,123,15,142,93,144,16,85,2,88,88,88,98,94,7,98,158,100,224,104,118,117,214,124,179,135,232,158,227,78,136,87,110,87,39,89,13,92,177,92,54,94,133,95,52,98,225,100,179,115,250,129,139,136,184,140,138,150,219,158,133,91,183,95,179,96,18,80,0,82,48,82,22,87,53,88,87,88,14,92,96,92,246,92,139,93,166,94,146,95,188,96,17,99,137,99,23,100,67,104,249,104,194,106,216,109,33,110,212,110,228,111,254,113,220,118,121,119,177,121,59,122,4,132,169,137,237,140,243,141,72,142,3,144,20,144,83,144,253,144,77,147,118,150,220,151,210,107,6,112,88,114,162,114,104,115,99,119,191,121,228,123,155,126,128,139,169,88,199,96,102,101,253,101,190,102,140,108,30,113,201,113,90,140,19,152,109,78,129,122,221,78,172,81,205,81,213,82,12,84,167,97,113,103,80,104,223,104,30,109,124,111,188,117,179,119,229,122,244,128,99,132,133,146,92,81,151,101,92,103,147,103,216,117,199,122,115,131,90,249,70,140,23,144,45,152,111,92,192,129,154,130,65,144,111,144,13,146,151,95,157,93,89,106,200,113,123,118,73,123,228,133,4,139,39,145,48,154,135,85,246,97,91,249,105,118,133,127,63,134,186,135,248,136,143,144,92,249,27,109,217,112,222,115,97,125,61,132,93,249,106,145,241,153,94,249,130,78,117,83,4,107,18,107,62,112,27,114,45,134,30,158,76,82,163,143,80,93,229,100,44,101,22,107,235,111,67,124,156,126,205,133,100,137,189,137,201,98,216,129,31,136,202,94,23,103,106,109,252,114,5,116,111,116,130,135,222,144,134,79,13,93,160,95,10,132,183,81,160,99,101,117,174,78,6,80,105,81,201,81,129,104,17,106,174,124,177,124,231,124,111,130,210,138,27,143,207,145,182,79,55,81,245,82,66,84,236,94,110,97,62,98,197,101,218,106,254,111,42,121,220,133,35,136,173,149,98,154,106,154,151,158,206,158,155,82,198,102,119,107,29,112,43,121,98,143,66,151,144,97,0,98,35,101,35,111,73,113,137,116,244,125,111,128,238,132,38,143,35,144,74,147,189,81,23,82,163,82,12,109,200,112,194,136,201,94,130,101,174,107,194,111,62,124,117,115,228,78,54,79,249,86,95,249,186,92,186,93,28,96,178,115,45,123,154,127,206,127,70,128,30,144,52,146,246,150,72,151,24,152,97,159,139,79,167,111,174,121,180,145,183,150,222,82,96,249,136,100,196,100,211,106,94,111,24,112,16,114,231,118,1,128,6,134,92,134,239,141,5,143,50,151,111,155,250,157,117,158,140,120,127,121,160,125,201,131,4,147,127,158,147,158,214,138,223,88,4,95,39,103,39,112,207,116,96,124,126,128,33,81,40,112,98,114,202,120,194,140,218,140,244,140,247,150,134,78,218,80,238,91,214,94,153,101,206,113,66,118,173,119,74,128,252,132,124,144,39,155,141,159,216,88,65,90,98,92,19,106,218,109,15,111,59,118,47,125,55,126,30,133,56,137,228,147,75,150,137,82,210,101,243,103,180,105,65,109,156,110,15,112,9,116,96,116,89,117,36,118,107,120,44,139,94,152,109,81,46,98,120,150,150,79,43,80,25,93,234,109,184,125,42,143,139,95,68,97,23,104,97,249,134,150,210,82,139,128,220,81,204,81,94,105,28,122,190,125,241,131,117,150,218,79,41,82,152,83,15,84,14,85,101,92,167,96,78,103,168,104,108,109,129,114,248,114,6,116,131,116,98,249,226,117,108,124,121,127,184,127,137,131,207,136,225,136,204,145,208,145,226,150,201,155,29,84,126,111,208,113,152,116,250,133,170,142,163,150,87,156,159,158,151,103,203,109,51,116,232,129,22,151,44,120,203,122,32,123,146,124,105,100,106,116,242,117,188,120,232,120,172,153,84,155,187,158,222,91,85,94,32,111,156,129,171,131,136,144,7,78,77,83,41,90,210,93,78,95,98,97,61,99,105,102,252,102,255,110,43,111,99,112,158,119,44,132,19,133,59,136,19,143,69,153,59,156,28,85,185,98,43,103,171,108,9,131,106,137,122,151,161,78,132,89,216,95,217,95,27,103,178,125,84,127,146,130,43,131,189,131,30,143,153,144,203,87,185,89,146,90,208,91,39,102,154,103,133,104,207,107,100,113,117,127,183,140,227,140,129,144,69,155,8,129,138,140,76,150,64,154,165,158,95,91,19,108,27,115,242,118,223,118,12,132,170,81,147,137,77,81,149,81,201,82,201,104,148,108,4,119,32,119,191,125,236,125,98,151,181,158,197,110,17,133,165,81,13,84,125,84,14,102,157,102,39,105,159,110,191,118,145,119,23,131,194,132,159,135,105,145,152,146,244,156,130,136,174,79,146,81,223,82,198,89,61,94,85,97,120,100,121,100,174,102,208,103,33,106,205,107,219,107,95,114,97,114,65,116,56,119,219,119,23,128,188,130,5,131,0,139,40,139,140,140,40,103,144,108,103,114,238,118,102,119,70,122,169,157,127,107,146,108,34,89,38,103,153,132,111,83,147,88,153,89,223,94,207,99,52,102,115,103,58,110,43,115,215,122,215,130,40,147,217,82,235,93,174,97,203,97,10,98,199,98,171,100,224,101,89,105,102,107,203,107,33,113,247,115,93,117,70,126,30,130,2,131,106,133,163,138,191,140,39,151,97,157,168,88,216,158,17,80,14,82,59,84,79,85,135,101,118,108,10,125,11,125,94,128,138,134,128,149,239,150,255,82,149,108,105,114,115,84,154,90,62,92,75,93,76,95,174,95,42,103,182,104,99,105,60,110,68,110,9,119,115,124,142,127,135,133,14,139,247,143,97,151,244,158,183,92,182,96,13,97,171,97,79,101,251,101,252,101,17,108,239,108,159,115,201,115,225,125,148,149,198,91,28,135,16,139,93,82,90,83,205,98,15,100,178,100,52,103,56,106,202,108,192,115,158,116,148,123,149,124,27,126,138,129,54,130,132,133,235,143,249,150,193,153,52,79,74,83,205,83,219,83,204,98,44,100,0,101,145,101,195,105,238,108,88,111,237,115,84,117,34,118,228,118,252,118,208,120,251,120,44,121,70,125,44,130,224,135,212,143,18,152,239,152,195,82,212,98,165,100,36,110,81,111,124,118,203,141,177,145,98,146,238,154,67,155,35,80,141,80,74,87,168,89,40,92,71,94,119,95,63,98,62,101,185,101,193,101,9,102,139,103,156,105,194,110,197,120,33,125,170,128,128,129,43,130,179,130,161,132,140,134,42,138,23,139,166,144,50,150,144,159,13,80,243,79,99,249,249,87,152,95,220,98,146,99,111,103,67,110,25,113,195,118,204,128,218,128,244,136,245,136,25,137,224,140,41,143,77,145,106,150,47,79,112,79,27,94,207,103,34,104,125,118,126,118,68,155,97,94,10,106,105,113,212,113,106,117,100,249,65,126,67,133,233,133,220,152,16,79,79,123,112,127,165,149,225,81,6,94,181,104,62,108,78,108,219,108,175,114,196,123,3,131,213,108,58,116,251,80,136,82,193,88,216,100,151,106,167,116,86,118,167,120,23,134,226,149,57,151,101,249,94,83,1,95,138,139,168,143,175,143,138,144,37,82,165,119,73,156,8,159,25,78,2,80,117,81,91,92,119,94,30,102,58,102,196,103,197,104,179,112,1,117,197,117,201,121,221,122,39,143,32,153,8,154,221,79,33,88,49,88,246,91,110,102,101,107,17,109,122,110,125,111,228,115,43,117,233,131,220,136,19,137,92,139,20,143,15,79,213,80,16,83,92,83,147,91,169,95,13,103,143,121,121,129,47,131,20,133,7,137,134,137,57,143,59,143,165,153,18,156,44,103,118,78,248,79,73,89,1,92,239,92,240,92,103,99,210,104,253,112,162,113,43,116,43,126,236,132,2,135,34,144,210,146,243,156,13,78,216,78,239,79,133,80,86,82,111,82,38,84,144,84,224,87,43,89,102,90,90,91,117,91,204,91,156,94,102,249,118,98,119,101,167,101,110,109,165,110,54,114,38,123,63,124,54,127,80,129,81,129,154,129,64,130,153,130,169,131,3,138,160,140,230,140,251,140,116,141,186,141,232,144,220,145,28,150,68,150,217,153,231,156,23,83,6,82,41,84,116,86,179,88,84,89,110,89,255,95,164,97,110,98,16,102,126,108,26,113,198,118,137,124,222,124,27,125,172,130,193,140,240,150,103,249,91,79,23,95,127,95,194,98,41,93,11,103,218,104,124,120,67,126,108,157,21,78,153,80,21,83,42,83,81,83,131,89,98,90,135,94,178,96,138,97,73,98,121,98,144,101,135,103,167,105,212,107,214,107,215,107,216,107,184,108,104,249,53,116,250,117,18,120,145,120,213,121,216,121,131,124,203,125,225,127,165,128,62,129,194,129,242,131,26,135,232,136,185,138,108,139,187,140,25,145,94,151,219,152,59,159,172,86,42,91,108,95,140,101,179,106,175,107,92,109,241,111,21,112,93,114,173,115,167,140,211,140,59,152,145,97,55,108,88,128,1,154,77,78,139,78,155,78,213,78,58,79,60,79,127,79,223,79,255,80,242,83,248,83,6,85,227,85,219,86,235,88,98,89,17,90,235,91,250,91,4,92,243,93,43,94,153,95,29,96,104,99,156,101,175,101,246,103,251,103,173,104,123,107,153,108,215,108,35,110,9,112,69,115,2,120,62,121,64,121,96,121,193,121,233,123,23,125,114,125,134,128,13,130,142,131,209,132,199,134,223,136,80,138,94,138,29,139,220,140,102,141,173,143,170,144,252,152,223,153,157,158,74,82,105,249,20,103,106,249,152,80,42,82,113,92,99,101,85,108,202,115,35,117,157,117,151,123,156,132,120,145,48,151,119,78,146,100,186,107,94,113,169,133,9,78,107,249,73,103,238,104,23,110,159,130,24,133,107,136,247,99,129,111,18,146,175,152,10,78,183,80,207,80,31,81,70,85,170,85,23,86,64,91,25,92,224,92,56,94,138,94,160,94,194,94,243,96,81,104,97,106,88,110,61,114,64,114,192,114,248,118,101,121,177,123,212,127,243,136,244,137,115,138,97,140,222,140,28,151,94,88,189,116,253,140,199,85,108,249,97,122,34,125,114,130,114,114,31,117,37,117,109,249,25,123,133,88,251,88,188,93,143,94,182,94,144,95,85,96,146,98,127,99,77,101,145,102,217,102,248,102,22,104,242,104,128,114,94,116,110,123,110,125,214,125,114,127,229,128,18,130,175,133,127,137,147,138,29,144,228,146,205,158,32,159,21,89,109,89,45,94,220,96,20,102,115,102,144,103,80,108,197,109,95,111,243,119,169,120,198,132,203,145,43,147,217,78,202,80,72,81,132,85,11,91,163,91,71,98,126,101,203,101,50,110,125,113,1,116,68,116,135,116,191,116,108,118,170,121,218,125,85,126,168,127,122,129,179,129,57,130,26,134,236,135,117,138,227,141,120,144,145,146,37,148,77,153,174,155,104,83,81,92,84,105,196,108,41,109,43,110,12,130,155,133,59,137,45,138,170,138,234,150,103,159,97,82,185,102,178,107,150,126,254,135,13,141,131,149,93,150,29,101,137,109,238,113,110,249,206,87,211,89,172,91,39,96,250,96,16,98,31,102,95,102,41,115,249,115,219,118,1,119,108,123,86,128,114,128,101,129,160,138,146,145,22,78,226,82,114,107,23,109,5,122,57,123,48,125,111,249,176,140,236,83,47,86,81,88,181,91,15,92,17,92,226,93,64,98,131,99,20,100,45,102,179,104,188,108,136,109,175,110,31,112,164,112,210,113,38,117,143,117,142,117,25,118,17,123,224,123,43,124,32,125,57,125,44,133,109,133,7,134,52,138,13,144,97,144,181,144,183,146,246,151,55,154,215,79,108,92,95,103,145,109,159,124,140,126,22,139,22,141,31,144,107,91,253,93,13,100,192,132,92,144,225,152,135,115,139,91,154,96,126,103,222,109,31,138,166,138,1,144,12,152,55,82,112,249,81,112,142,120,150,147,112,136,215,145,238,79,215,83,253,85,218,86,130,87,253,88,194,90,136,91,171,92,192,92,37,94,1,97,13,98,75,98,136,99,28,100,54,101,120,101,57,106,138,107,52,108,25,109,49,111,231,113,233,114,120,115,7,116,178,116,38,118,97,119,192,121,87,122,234,122,185,124,143,125,172,125,97,126,158,127,41,129,49,131,144,132,218,132,234,133,150,136,176,138,144,139,56,143,66,144,131,144,108,145,150,146,185,146,139,150,167,150,168,150,214,150,0,151,8,152,150,153,211,154,26,155,212,83,126,88,25,89,112,91,191,91,209,109,90,111,159,113,33,116,185,116,133,128,253,131,225,93,135,95,170,95,66,96,236,101,18,104,111,105,83,106,137,107,53,109,243,109,227,115,254,118,172,119,77,123,20,125,35,129,28,130,64,131,244,132,99,133,98,138,196,138,135,145,30,147,6,152,180,153,12,98,83,136,240,143,101,146,7,93,39,93,105,93,95,116,157,129,104,135,213,111,254,98,210,127,54,137,114,137,30,78,88,78,231,80,221,82,71,83,127,98,7,102,105,126,5,136,94,150,141,79,25,83,54,86,203,89,164,90,56,92,78,92,77,92,2,94,17,95,67,96,189,101,47,102,66,102,190,103,244,103,28,115,226,119,58,121,197,127,148,132,205,132,150,137,102,138,105,138,225,138,85,140,122,140,244,87,212,91,15,95,111,96,237,98,13,105,150,107,92,110,132,113,210,123,85,135,88,139,254,142,223,152,254,152,56,79,129,79,225,79,123,84,32,90,184,91,60,97,176,101,104,102,252,113,51,117,94,121,51,125,78,129,227,129,152,131,170,133,206,133,3,135,10,138,171,142,155,143,113,249,197,143,49,89,164,91,230,91,137,96,233,91,11,92,195,95,129,108,114,249,241,109,11,112,26,117,175,130,246,138,192,78,65,83,115,249,217,150,15,108,158,78,196,79,82,81,94,85,37,90,232,92,17,98,89,114,189,130,170,131,254,134,89,136,29,138,63,150,197,150,19,153,9,157,93,157,10,88,179,92,189,93,68,94,225,96,21,97,225,99,2,106,37,110,2,145,84,147,78,152,16,156,119,159,137,91,184,92,9,99,79,102,72,104,60,119,193,150,141,151,84,152,159,155,161,101,1,139,203,142,188,149,53,85,169,92,214,93,181,94,151,102,76,118,244,131,199,149,211,88,188,98,206,114,40,157,240,78,46,89,15,96,59,102,131,107,231,121,38,157,147,83,192,84,195,87,22,93,27,97,214,102,175,109,141,120,126,130,152,150,68,151,132,83,124,98,150,99,178,109,10,126,75,129,77,152,251,106,76,127,175,157,26,158,95,78,59,80,182,81,28,89,249,96,246,99,48,105,58,114,54,128,116,249,206,145,49,95,117,249,118,249,4,125,229,130,111,132,187,132,229,133,141,142,119,249,111,79,120,249,121,249,228,88,67,91,89,96,218,99,24,101,109,101,152,102,122,249,74,105,35,106,11,109,1,112,108,113,210,117,13,118,179,121,112,122,123,249,138,127,124,249,68,137,125,249,147,139,192,145,125,150,126,249,10,153,4,87,161,95,188,101,1,111,0,118,166,121,158,138,173,153,90,155,108,159,4,81,182,97,145,98,141,106,198,129,67,80,48,88,102,95,9,113,0,138,250,138,124,91,22,134,250,79,60,81,180,86,68,89,169,99,249,109,170,93,109,105,134,81,136,78,89,79,127,249,128,249,129,249,130,89,130,249,131,249,95,107,93,108,132,249,181,116,22,121,133,249,7,130,69,130,57,131,63,143,93,143,134,249,24,153,135,249,136,249,137,249,166,78,138,249,223,87,121,95,19,102,139,249,140,249,171,117,121,126,111,139,141,249,6,144,91,154,165,86,39,88,248,89,31,90,180,91,142,249,246,94,143,249,144,249,80,99,59,99,145,249,61,105,135,108,191,108,142,109,147,109,245,109,20,111,146,249,223,112,54,113,89,113,147,249,195,113,213,113,148,249,79,120,111,120,149,249,117,123,227,125,150,249,47,126,151,249,77,136,223,142,152,249,153,249,154,249,91,146,155,249,246,156,156,249,157,249,158,249,133,96,133,109,159,249,177,113,160,249,161,249,177,149,173,83,162,249,163,249,164,249,211,103,165,249,142,112,48,113,48,116,118,130,210,130,166,249,187,149,229,154,125,158,196,102,167,249,193,113,73,132,168,249,169,249,75,88,170,249,171,249,184,93,113,95,172,249,32,102,142,102,121,105,174,105,56,108,243,108,54,110,65,111,218,111,27,112,47,112,80,113,223,113,112,115,173,249,91,116,174,249,212,116,200,118,78,122,147,126,175,249,176,249,241,130,96,138,206,143,177,249,72,147,178,249,25,151,179,249,180,249,66,78,42,80,181,249,8,82,225,83,243,102,109,108,202,111,10,115,127,119,98,122,174,130,221,133,2,134,182,249,212,136,99,138,125,139,107,140,183,249,179,146,184,249,19,151,16,152,148,78,13,79,201,79,178,80,72,83,62,84,51,84,218,85,98,88,186,88,103,89,27,90,228,91,159,96,185,249,202,97,86,101,255,101,100,102,167,104,90,108,179,111,207,112,172,113,82,115,125,123,8,135,164,138,50,156,7,159,75,92,131,108,68,115,137,115,58,146,171,110,101,116,31,118,105,122,21,126,10,134,64,81,197,88,193,100,238,116,21,117,112,118,193,127,149,144,205,150,84,153,38,110,230,116,169,122,170,122,229,129,217,134,120,135,27,138,73,90,140,91,155,91,161,104,0,105,99,109,169,115,19,116,44,116,151,120,233,125,235,127,24,129,85,129,158,131,76,140,46,150,17,152,240,102,128,95,250,101,137,103,106,108,139,115,45,80,3,90,106,107,238,119,22,89,108,93,205,93,37,115,79,117,186,249,187,249], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+109292);
/* memory initializer */ allocate([229,80,249,81,47,88,45,89,150,89,218,89,229,91,188,249,189,249,162,93,215,98,22,100,147,100,254,100,190,249,220,102,191,249,72,106,192,249,255,113,100,116,193,249,136,122,175,122,71,126,94,126,0,128,112,129,194,249,239,135,129,137,32,139,89,144,195,249,128,144,82,153,126,97,50,107,116,109,31,126,37,137,177,143,209,79,173,80,151,81,199,82,199,87,137,88,185,91,184,94,66,97,149,105,140,109,103,110,182,110,148,113,98,116,40,117,44,117,115,128,56,131,201,132,10,142,148,147,222,147,196,249,142,78,81,79,118,80,42,81,200,83,203,83,243,83,135,91,211,91,36,92,26,97,130,97,244,101,91,114,151,115,64,116,194,118,80,121,145,121,185,121,6,125,189,127,139,130,213,133,94,134,194,143,71,144,245,144,234,145,133,150,232,150,233,150,214,82,103,95,237,101,49,102,47,104,92,113,54,122,193,144,10,152,145,78,197,249,82,106,158,107,144,111,137,113,24,128,184,130,83,133,75,144,149,150,242,150,251,151,26,133,49,155,144,78,138,113,196,150,67,81,159,83,225,84,19,87,18,87,163,87,155,90,196,90,195,91,40,96,63,97,244,99,133,108,57,109,114,110,144,110,48,114,63,115,87,116,209,130,129,136,69,143,96,144,198,249,98,150,88,152,27,157,8,103,138,141,94,146,77,79,73,80,222,80,113,83,13,87,212,89,1,90,9,92,112,97,144,102,45,110,50,114,75,116,239,125,195,128,14,132,102,132,63,133,95,135,91,136,24,137,2,139,85,144,203,151,79,155,115,78,145,79,18,81,106,81,199,249,47,85,169,85,122,91,165,91,124,94,125,94,190,94,160,96,223,96,8,97,9,97,196,99,56,101,9,103,200,249,212,103,218,103,201,249,97,105,98,105,185,108,39,109,202,249,56,110,203,249,225,111,54,115,55,115,204,249,92,116,49,117,205,249,82,118,206,249,207,249,173,125,254,129,56,132,213,136,152,138,219,138,237,138,48,142,66,142,74,144,62,144,122,144,73,145,201,145,110,147,208,249,209,249,9,88,210,249,211,107,137,128,178,128,211,249,212,249,65,81,107,89,57,92,213,249,214,249,100,111,167,115,228,128,7,141,215,249,23,146,143,149,216,249,217,249,218,249,219,249,127,128,14,98,28,112,104,125,141,135,220,249,160,87,105,96,71,97,183,107,190,138,128,146,177,150,89,78,31,84,235,109,45,133,112,150,243,151,238,152,214,99,227,108,145,144,221,81,201,97,186,129,249,157,157,79,26,80,0,81,156,91,15,97,255,97,236,100,5,105,197,107,145,117,227,119,169,127,100,130,143,133,251,135,99,136,188,138,112,139,171,145,140,78,229,78,10,79,221,249,222,249,55,89,232,89,223,249,242,93,27,95,91,95,33,96,224,249,225,249,226,249,227,249,62,114,229,115,228,249,112,117,205,117,229,249,251,121,230,249,12,128,51,128,132,128,225,130,81,131,231,249,232,249,189,140,179,140,135,144,233,249,234,249,244,152,12,153,235,249,236,249,55,112,202,118,202,127,204,127,252,127,26,139,186,78,193,78,3,82,112,83,237,249,189,84,224,86,251,89,197,91,21,95,205,95,110,110,238,249,239,249,106,125,53,131,240,249,147,134,141,138,241,249,109,151,119,151,242,249,243,249,0,78,90,79,126,79,249,88,229,101,162,110,56,144,176,147,185,153,251,78,236,88,138,89,217,89,65,96,244,249,245,249,20,122,246,249,79,131,195,140,101,81,68,83,247,249,248,249,249,249,205,78,105,82,85,91,191,130,212,78,58,82,168,84,201,89,255,89,80,91,87,91,92,91,99,96,72,97,203,110,153,112,110,113,134,115,247,116,181,117,193,120,43,125,5,128,234,129,40,131,23,133,201,133,238,138,199,140,204,150,92,79,250,82,188,86,171,101,40,102,124,112,184,112,53,114,189,125,141,130,76,145,192,150,114,157,113,91,231,104,152,107,122,111,222,118,145,92,171,102,91,111,180,123,42,124,54,136,220,150,8,78,215,78,32,83,52,88,187,88,239,88,108,89,7,92,51,94,132,94,53,95,140,99,178,102,86,103,31,106,163,106,12,107,63,111,70,114,250,249,80,115,139,116,224,122,167,124,120,129,223,129,231,129,138,131,108,132,35,133,148,133,207,133,221,136,19,141,172,145,119,149,156,150,141,81,201,84,40,87,176,91,77,98,80,103,61,104,147,104,61,110,211,110,125,112,33,126,193,136,161,140,9,143,75,159,78,159,45,114,143,123,205,138,26,147,71,79,78,79,50,81,128,84,208,89,149,94,181,98,117,103,110,105,23,106,174,108,26,110,217,114,42,115,189,117,184,123,53,125,231,130,249,131,87,132,247,133,91,138,175,140,135,142,25,144,184,144,206,150,95,159,227,82,10,84,225,90,194,91,88,100,117,101,244,110,196,114,251,249,132,118,77,122,27,123,77,124,62,126,223,127,123,131,43,139,202,140,100,141,225,141,95,142,234,143,249,143,105,144,209,147,67,79,122,79,179,80,104,81,120,81,77,82,106,82,97,88,124,88,96,89,8,92,85,92,219,94,155,96,48,98,19,104,191,107,8,108,177,111,78,113,32,116,48,117,56,117,81,117,114,118,76,123,139,123,173,123,198,123,143,126,110,138,62,143,73,143,63,146,147,146,34,147,43,148,251,150,90,152,107,152,30,153,7,82,42,98,152,98,89,109,100,118,202,122,192,123,118,125,96,83,190,92,151,94,56,111,185,112,152,124,17,151,142,155,222,158,165,99,122,100,118,135,1,78,149,78,173,78,92,80,117,80,72,84,195,89,154,91,64,94,173,94,247,94,129,95,197,96,58,99,63,101,116,101,204,101,118,102,120,102,254,103,104,105,137,106,99,107,64,108,192,109,232,109,31,110,94,110,30,112,161,112,142,115,253,115,58,117,91,119,135,120,142,121,11,122,125,122,190,124,142,125,71,130,2,138,234,138,158,140,45,145,74,145,216,145,102,146,204,146,32,147,6,151,86,151,92,151,2,152,14,159,54,82,145,82,124,85,36,88,29,94,31,95,140,96,208,99,175,104,223,111,109,121,44,123,205,129,186,133,253,136,248,138,68,142,141,145,100,150,155,150,61,151,76,152,74,159,206,79,70,81,203,81,169,82,50,86,20,95,107,95,170,99,205,100,233,101,65,102,250,102,249,102,29,103,157,104,215,104,253,105,21,111,110,111,103,113,229,113,42,114,170,116,58,119,86,121,90,121,223,121,32,122,149,122,151,124,223,124,68,125,112,126,135,128,251,133,164,134,84,138,191,138,153,141,129,142,32,144,109,144,227,145,59,150,213,150,229,156,207,101,7,124,179,141,195,147,88,91,10,92,82,83,217,98,29,115,39,80,151,91,158,95,176,96,107,97,213,104,217,109,46,116,46,122,66,125,156,125,49,126,107,129,42,142,53,142,126,147,24,148,80,79,80,87,230,93,167,94,43,99,106,127,59,78,79,79,143,79,90,80,221,89,196,128,106,84,104,84,254,85,79,89,153,91,222,93,218,94,93,102,49,103,241,103,42,104,232,108,50,109,74,110,141,111,183,112,224,115,135,117,76,124,2,125,44,125,162,125,31,130,219,134,59,138,133,138,112,141,138,142,51,143,49,144,78,145,82,145,68,148,208,153,249,122,165,124,202,79,1,81,198,81,200,87,239,91,251,92,89,102,61,106,90,109,150,110,236,111,12,113,111,117,227,122,34,136,33,144,117,144,203,150,255,153,1,131,45,78,242,78,70,136,205,145,125,83,219,106,107,105,65,108,122,132,158,88,142,97,254,102,239,98,221,112,17,117,199,117,82,126,184,132,73,139,8,141,75,78,234,83,171,84,48,87,64,87,215,95,1,99,7,99,111,100,47,101,232,101,122,102,157,103,179,103,98,107,96,108,154,108,44,111,229,119,37,120,73,121,87,121,25,125,162,128,2,129,243,129,157,130,183,130,24,135,140,138,252,249,4,141,190,141,114,144,244,118,25,122,55,122,84,126,119,128,7,85,212,85,117,88,47,99,34,100,73,102,75,102,109,104,155,105,132,107,37,109,177,110,205,115,104,116,161,116,91,117,185,117,225,118,30,119,139,119,230,121,9,126,29,126,251,129,47,133,151,136,58,138,209,140,235,142,176,143,50,144,173,147,99,150,115,150,7,151,132,79,241,83,234,89,201,90,25,94,78,104,198,116,190,117,233,121,146,122,163,129,237,134,234,140,204,141,237,143,159,101,21,103,253,249,247,87,87,111,221,125,47,143,246,147,198,150,181,95,242,97,132,111,20,78,152,79,31,80,201,83,223,85,111,93,238,93,33,107,100,107,203,120,154,123,254,249,73,142,202,142,110,144,73,99,62,100,64,119,132,122,47,147,127,148,106,159,176,100,175,111,230,113,168,116,218,116,196,122,18,124,130,126,178,124,152,126,154,139,10,141,125,148,16,153,76,153,57,82,223,91,230,100,45,103,46,125,237,80,195,83,121,88,88,97,89,97,250,97,172,101,217,122,146,139,150,139,9,80,33,80,117,82,49,85,60,90,224,94,112,95,52,97,94,101,12,102,54,102,162,102,205,105,196,110,50,111,22,115,33,118,147,122,57,129,89,130,214,131,188,132,181,80,240,87,192,91,232,91,105,95,161,99,38,120,181,125,220,131,33,133,199,145,245,145,138,81,245,103,86,123,172,140,196,81,187,89,189,96,85,134,28,80,255,249,84,82,58,92,125,97,26,98,211,98,242,100,165,101,204,110,32,118,10,129,96,142,95,150,187,150,223,78,67,83,152,85,41,89,221,93,197,100,201,108,250,109,148,115,127,122,27,130,166,133,228,140,16,142,119,144,231,145,225,149,33,150,198,151,248,81,242,84,134,85,185,95,164,100,136,111,180,125,31,143,77,143,53,148,201,80,22,92,190,108,251,109,27,117,187,119,61,124,100,124,121,138,194,138,30,88,190,89,22,94,119,99,82,114,138,117,107,119,220,138,188,140,18,143,243,94,116,102,248,109,125,128,193,131,203,138,81,151,214,155,0,250,67,82,255,102,149,109,239,110,224,125,230,138,46,144,94,144,212,154,29,82,127,82,232,84,148,97,132,98,219,98,162,104,18,105,90,105,53,106,146,112,38,113,93,120,1,121,14,121,210,121,13,122,150,128,120,130,213,130,73,131,73,133,130,140,133,141,98,145,139,145,174,145,195,79,209,86,237,113,215,119,0,135,248,137,248,91,214,95,81,103,168,144,226,83,90,88,245,91,164,96,129,97,96,100,61,126,112,128,37,133,131,146,174,100,172,80,20,93,0,103,156,88,189,98,168,99,14,105,120,105,30,106,107,110,186,118,203,121,187,130,41,132,207,138,168,141,253,143,18,145,75,145,156,145,16,147,24,147,154,147,219,150,54,154,13,156,17,78,92,117,93,121,250,122,81,123,201,123,46,126,196,132,89,142,116,142,248,142,16,144,37,102,63,105,67,116,250,81,46,103,220,158,69,81,224,95,150,108,242,135,93,136,119,136,180,96,181,129,3,132,5,141,214,83,57,84,52,86,54,90,49,92,138,112,224,127,90,128,6,129,237,129,163,141,137,145,95,154,242,157,116,80,196,78,160,83,251,96,44,110,100,92,136,79,36,80,228,85,217,92,95,94,101,96,148,104,187,108,196,109,190,113,212,117,244,117,97,118,26,122,73,122,199,125,251,125,110,127,244,129,169,134,28,143,201,150,179,153,82,159,71,82,197,82,237,152,170,137,3,78,210,103,6,111,181,79,226,91,149,103,136,108,120,109,27,116,39,120,221,145,124,147,196,135,228,121,49,122,235,95,214,78,164,84,62,85,174,88,165,89,240,96,83,98,214,98,54,103,85,105,53,130,64,150,177,153,221,153,44,80,83,83,68,85,124,87,1,250,88,98,2,250,226,100,107,102,221,103,193,111,239,111,34,116,56,116,23,138,56,148,81,84,6,86,102,87,72,95,154,97,78,107,88,112,173,112,187,125,149,138,106,89,43,129,162,99,8,119,61,128,170,140,84,88,45,100,187,105,149,91,17,94,111,110,3,250,105,133,76,81,240,83,42,89,32,96,75,97,134,107,112,108,240,108,30,123,206,128,212,130,198,141,176,144,177,152,4,250,199,100,164,111,145,100,4,101,78,81,16,84,31,87,14,138,95,97,118,104,5,250,219,117,82,123,113,125,26,144,6,88,204,105,127,129,42,137,0,144,57,152,120,80,87,89,172,89,149,98,15,144,42,155,93,97,121,114,214,149,97,87,70,90,244,93,138,98,173,100,250,100,119,103,226,108,62,109,44,114,54,116,52,120,119,127,173,130,219,141,23,152,36,82,66,87,127,103,72,114,227,116,169,140,166,143,17,146,42,150,107,81,237,83,76,99,105,79,4,85,150,96,87,101,155,108,127,109,76,114,253,114,23,122,135,137,157,140,109,95,142,111,249,112,168,129,14,97,191,79,79,80,65,98,71,114,199,123,232,125,233,127,77,144,173,151,25,154,182,140,106,87,115,94,176,103,13,132,85,138,32,84,22,91,99,94,226,94,10,95,131,101,186,128,61,133,137,149,91,150,72,79,5,83,13,83,15,83,134,84,250,84,3,87,3,94,22,96,155,98,177,98,85,99,6,250,225,108,102,109,177,117,50,120,222,128,47,129,222,130,97,132,178,132,141,136,18,137,11,144,234,146,253,152,145,155,69,94,180,102,221,102,17,112,6,114,7,250,245,79,125,82,106,95,83,97,83,103,25,106,2,111,226,116,104,121,104,136,121,140,199,152,196,152,67,154,193,84,31,122,83,105,247,138,74,140,168,152,174,153,124,95,171,98,178,117,174,118,171,136,127,144,66,150,57,83,60,95,197,95,204,108,204,115,98,117,139,117,70,123,254,130,157,153,79,78,60,144,11,78,85,79,166,83,15,89,200,94,48,102,179,108,85,116,119,131,102,135,192,140,80,144,30,151,21,156,209,88,120,91,80,134,20,139,180,157,210,91,104,96,141,96,241,101,87,108,34,111,163,111,26,112,85,127,240,127,145,149,146,149,80,150,211,151,114,82,68,143,253,81,43,84,184,84,99,85,138,85,187,106,181,109,216,125,102,130,156,146,119,150,121,158,8,84,200,84,210,118,228,134,164,149,212,149,92,150,162,78,9,79,238,89,230,90,247,93,82,96,151,98,109,103,65,104,134,108,47,110,56,127,155,128,42,130,8,250,9,250,5,152,165,78,85,80,179,84,147,87,90,89,105,91,179,91,200,97,119,105,119,109,35,112,249,135,227,137,114,138,231,138,130,144,237,153,184,154,190,82,56,104,22,80,120,94,79,103,71,131,76,136,171,78,17,84,174,86,230,115,21,145,255,151,9,153,87,153,153,153,83,86,159,88,91,134,49,138,178,97,246,106,123,115,210,142,71,107,170,150,87,154,85,89,0,114,107,141,105,151,212,79,244,92,38,95,248,97,91,102,235,108,171,112,132,115,185,115,254,115,41,119,77,119,67,125,98,125,35,126,55,130,82,136,10,250,226,140,73,146,111,152,81,91,116,122,64,136,1,152,204,90,224,79,84,83,62,89,253,92,62,99,121,109,249,114,5,129,7,129,162,131,207,146,48,152,168,78,68,81,17,82,139,87,98,95,194,108,206,110,5,112,80,112,175,112,146,113,233,115,105,116,74,131,162,135,97,136,8,144,162,144,163,147,168,153,110,81,87,95,224,96,103,97,179,102,89,133,74,142,175,145,139,151,78,78,146,78,124,84,213,88,250,88,125,89,181,92,39,95,54,98,72,98,10,102,103,102,235,107,105,109,207,109,86,110,248,110,148,111,224,111,233,111,93,112,208,114,37,116,90,116,224,116,147,118,92,121,202,124,30,126,225,128,166,130,107,132,191,132,78,134,95,134,116,135,119,139,106,140,172,147,0,152,101,152,209,96,22,98,119,145,90,90,15,102,247,109,62,110,63,116,66,155,253,95,218,96,15,123,196,84,24,95,94,108,211,108,42,109,216,112,5,125,121,134,12,138,59,157,22,83,140,84,5,91,58,106,107,112,117,117,141,121,190,121,177,130,239,131,113,138,65,139,168,140,116,151,11,250,244,100,43,101,186,120,187,120,107,122,56,78,154,85,80,89,166,91,123,94,163,96,219,99,97,107,101,102,83,104,25,110,101,113,176,116,8,125,132,144,105,154,37,156,59,109,209,110,62,115,65,140,202,149,240,81,76,94,168,95,77,96,246,96,48,97,76,97,67,102,68,102,165,105,193,108,95,110,201,110,98,111,76,113,156,116,135,118,193,123,39,124,82,131,87,135,81,144,141,150,195,158,47,83,222,86,251,94,138,95,98,96,148,96,247,97,102,102,3,103,156,106,238,109,174,111,112,112,106,115,106,126,190,129,52,131,212,134,168,138,196,140,131,82,114,115,150,91,107,106,4,148,238,84,134,86,93,91,72,101,133,101,201,102,159,104,141,109,198,109,59,114,180,128,117,145,77,154,175,79,25,80,154,83,14,84,60,84,137,85,197,85,63,94,140,95,61,103,102,113,221,115,5,144,219,82,243,82,100,88,206,88,4,113,143,113,251,113,176,133,19,138,136,102,168,133,167,85,132,102,74,113,49,132,73,83,153,85,193,107,89,95,189,95,238,99,137,102,71,113,241,138,29,143,190,158,17,79,58,100,203,112,102,117,103,134,100,96,78,139,248,157,71,81,246,81,8,83,54,109,248,128,209,158,21,102,35,107,152,112,213,117,3,84,121,92,7,125,22,138,32,107,61,107,70,107,56,84,112,96,61,109,213,127,8,130,214,80,222,81,156,85,107,86,205,86,236,89,9,91,12,94,153,97,152,97,49,98,94,102,230,102,153,113,185,113,186,113,167,114,167,121,0,122,178,127,112,138,0,0,0,0,0,0,1,0,160,0,167,0,168,0,169,0,175,0,176,0,178,0,183,0,184,0,198,0,215,0,216,0,230,0,247,0,248,0,0,1,1,1,2,1,3,1,4,1,5,1,6,1,7,1,8,1,9,1,10,1,11,1,12,1,13,1,14,1,15,1,16,1,17,1,18,1,19,1,22,1,23,1,24,1,25,1,26,1,27,1,28,1,29,1,30,1,31,1,32,1,33,1,34,1,35,1,36,1,37,1,38,1,39,1,40,1,41,1,42,1,43,1,46,1,47,1,48,1,49,1,52,1,53,1,54,1,55,1,56,1,57,1,58,1,59,1,60,1,61,1,62,1,65,1,66,1,67,1,68,1,69,1,70,1,71,1,72,1,74,1,75,1,76,1,77,1,80,1,81,1,82,1,83,1,84,1,85,1,86,1,87,1,88,1,89,1,90,1,91,1,92,1,93,1,94,1,95,1,96,1,97,1,98,1,99,1,100,1,101,1,102,1,103,1,104,1,105,1,106,1,107,1,108,1,109,1,110,1,111,1,112,1,113,1,114,1,115,1,116,1,117,1,118,1,119,1,120,1,121,1,122,1,123,1,124,1,125,1,126,1,146,1,160,1,161,1,175,1,176,1,24,2,25,2,26,2,27,2,198,2,199,2,216,2,217,2,219,2,220,2,221,2,0,3,1,3,3,3,9,3,35,3,122,3,132,3,133,3,134,3,136,3,137,3,138,3,140,3,142,3,143,3,144,3,145,3,146,3,147,3,148,3,149,3,150,3,151,3,152,3,153,3,154,3,155,3,156,3,157,3,158,3,159,3,160,3,161,3,163,3,164,3,165,3,166,3,167,3,168,3,169,3,170,3,171,3,172,3,173,3,174,3,175,3,176,3,177,3,178,3,179,3,180,3,181,3,182,3,183,3,184,3,185,3,186,3,187,3,188,3,189,3,190,3,191,3,192,3,193,3,194,3,195,3,196,3,197,3,198,3,199,3,200,3,201,3,202,3,203,3,204,3,205,3,206,3,1,4,2,4,3,4,4,4,5,4,6,4,7,4,8,4,9,4,10,4,11,4,12,4,14,4,15,4,16,4,17,4,18,4,19,4,20,4,21,4,22,4,23,4,24,4,25,4,26,4,27,4,28,4,29,4,30,4,31,4,32,4,33,4,34,4,35,4,36,4,37,4,38,4,39,4,40,4,41,4,42,4,43,4,44,4,45,4,46,4,47,4,48,4,49,4,50,4,51,4,52,4,53,4,54,4,55,4,56,4,57,4,58,4,59,4,60,4,61,4,62,4,63,4,64,4,65,4,66,4,67,4,68,4,69,4,70,4,71,4,72,4,73,4,74,4,75,4,76,4,77,4,78,4,79,4,81,4,82,4,83,4,84,4,85,4,86,4,87,4,88,4,89,4,90,4,91,4,92,4,94,4,95,4,144,4,145,4,176,5,177,5,178,5,179,5,180,5,181,5,182,5,183,5,184,5,185,5,187,5,188,5,189,5,190,5,191,5,192,5,193,5,194,5,195,5,208,5,209,5,210,5,211,5,212,5,213,5,214,5,215,5,216,5,217,5,218,5,219,5,220,5,221,5,222,5,223,5,224,5,225,5,226,5,227,5,228,5,229,5,230,5,231,5,232,5,233,5,234,5,240,5,241,5,242,5,243,5,244,5,12,6,27,6,31,6,33,6,34,6,35,6,36,6,37,6,38,6,39,6,40,6,41,6,42,6,43,6,44,6,45,6,46,6,47,6,48,6,49,6,50,6,51,6,52,6,53,6,54,6,55,6,56,6,57,6,58,6,64,6,65,6,66,6,67,6,68,6,69,6,70,6,71,6,72,6,73,6,74,6,75,6,76,6,77,6,78,6,79,6,80,6,81,6,82,6,121,6,126,6,134,6,136,6,145,6,152,6,169,6,175,6,186,6,190,6,193,6,210,6,1,14,2,14,3,14,4,14,5,14,6,14,7,14,8,14,9,14,10,14,11,14,12,14,13,14,14,14,15,14,16,14,17,14,18,14,19,14,20,14,21,14,22,14,23,14,24,14,25,14,26,14,27,14,28,14,29,14,30,14,31,14,32,14,33,14,34,14,35,14,36,14,37,14,38,14,39,14,40,14,41,14,42,14,43,14,44,14,45,14,46,14,47,14,48,14,49,14,50,14,51,14,52,14,53,14,54,14,55,14,56,14,57,14,58,14,63,14,64,14,65,14,66,14,67,14,68,14,69,14,70,14,71,14,72,14,73,14,74,14,75,14,76,14,77,14,78,14,79,14,80,14,81,14,82,14,83,14,84,14,85,14,86,14,87,14,88,14,89,14,90,14,91,14,2,30,3,30,10,30,11,30,30,30,31,30,64,30,65,30,86,30,87,30,96,30,97,30,106,30,107,30,128,30,129,30,130,30,131,30,132,30,133,30,242,30,243,30,12,32,13,32,14,32,15,32,19,32,20,32,21,32,23,32,24,32,25,32,26,32,28,32,29,32,30,32,32,32,33,32,34,32,38,32,48,32,57,32,58,32,170,32,171,32,172,32,175,32,22,33,34,33,25,34,26,34,72,34,100,34,101,34,32,35,33,35,0,37,2,37,12,37,16,37,20,37,24,37,28,37,36,37,44,37,52,37,60,37,80,37,81,37,82,37,83,37,84,37,85,37,86,37,87,37,88,37,89,37,90,37,91,37,92,37,93,37,94,37,95,37,96,37,97,37,98,37,99,37,100,37,101,37,102,37,103,37,104,37,105,37,106,37,107,37,108,37,128,37,132,37,136,37,140,37,144,37,145,37,146,37,147,37,160,37,0,0,2,0,0,192,3,0,0,192,4,0,0,192,5,0,0,192,6,0,0,192,7,0,0,192,8,0,0,192,9,0,0,192,10,0,0,192,11,0,0,192,12,0,0,192,13,0,0,192,14,0,0,192,15,0,0,192,16,0,0,192,17,0,0,192,18,0,0,192,19,0,0,192,20,0,0,192,21,0,0,192,22,0,0,192,23,0,0,192,24,0,0,192,25,0,0,192,26,0,0,192,27,0,0,192,28,0,0,192,29,0,0,192,30,0,0,192,31,0,0,192,0,0,0,179,1,0,0,195,2,0,0,195,3,0,0,195,4,0,0,195,5,0,0,195,6,0,0,195,7,0,0,195,8,0,0,195,9,0,0,195,10,0,0,195,11,0,0,195,12,0,0,195,13,0,0,211,14,0,0,195,15,0,0,195,0,0,12,187,1,0,12,195,2,0,12,195,3,0,12,195,4,0,12,211,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+119532);




var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);

assert(tempDoublePtr % 8 == 0);

function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

}

function copyTempDouble(ptr) {

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];

  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];

  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];

  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];

}


  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) {
        var success = self.alloc(bytes);
        if (!success) return -1 >>> 0; // sbrk failure code
      }
      return ret;  // Previous break location.
    }

  
  
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value;
      return value;
    }
  
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: {
          if (typeof navigator === 'object') return navigator['hardwareConcurrency'] || 1;
          return 1;
        }
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }

   
  Module["_memset"] = _memset;

  function ___errno_location() {
      return ___errno_state;
    }

  function _abort() {
      Module['abort']();
    }

  
  
  
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          stream.tty.ops.flush(stream.tty);
        },flush:function (stream) {
          stream.tty.ops.flush(stream.tty);
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              // we will read data by chunks of BUFSIZE
              var BUFSIZE = 256;
              var buf = new Buffer(BUFSIZE);
              var bytesRead = 0;
  
              var fd = process.stdin.fd;
              // Linux and Mac cannot use process.stdin.fd (which isn't set up as sync)
              var usingDevice = false;
              try {
                fd = fs.openSync('/dev/stdin', 'r');
                usingDevice = true;
              } catch (e) {}
  
              bytesRead = fs.readSync(fd, buf, 0, BUFSIZE, null);
  
              if (usingDevice) { fs.closeSync(fd); }
              if (bytesRead > 0) {
                result = buf.slice(0, bytesRead).toString('utf-8');
              } else {
                result = null;
              }
  
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val); // val == 0 would cut text output off in the middle.
          }
        },flush:function (tty) {
          if (tty.output && tty.output.length > 0) {
            Module['print'](UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val);
          }
        },flush:function (tty) {
          if (tty.output && tty.output.length > 0) {
            Module['printErr'](UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          }
        }}};
  
  var MEMFS={ops_table:null,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            }
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.usedBytes = 0; // The actual number of bytes used in the typed array, as opposed to contents.buffer.byteLength which gives the whole capacity.
          // When the byte data of the file is populated, this will point to either a typed array, or a normal JS array. Typed arrays are preferred
          // for performance, and used by default. However, typed arrays are not resizable like normal JS arrays are, so there is a small disk size
          // penalty involved for appending file writes that continuously grow a file similar to std::vector capacity vs used -scheme.
          node.contents = null; 
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },getFileDataAsRegularArray:function (node) {
        if (node.contents && node.contents.subarray) {
          var arr = [];
          for (var i = 0; i < node.usedBytes; ++i) arr.push(node.contents[i]);
          return arr; // Returns a copy of the original data.
        }
        return node.contents; // No-op, the file contents are already in a JS array. Return as-is.
      },getFileDataAsTypedArray:function (node) {
        if (!node.contents) return new Uint8Array;
        if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes); // Make sure to not return excess unused bytes.
        return new Uint8Array(node.contents);
      },expandFileStorage:function (node, newCapacity) {
  
        // If we are asked to expand the size of a file that already exists, revert to using a standard JS array to store the file
        // instead of a typed array. This makes resizing the array more flexible because we can just .push() elements at the back to
        // increase the size.
        if (node.contents && node.contents.subarray && newCapacity > node.contents.length) {
          node.contents = MEMFS.getFileDataAsRegularArray(node);
          node.usedBytes = node.contents.length; // We might be writing to a lazy-loaded file which had overridden this property, so force-reset it.
        }
  
        if (!node.contents || node.contents.subarray) { // Keep using a typed array if creating a new storage, or if old one was a typed array as well.
          var prevCapacity = node.contents ? node.contents.buffer.byteLength : 0;
          if (prevCapacity >= newCapacity) return; // No need to expand, the storage was already large enough.
          // Don't expand strictly to the given requested limit if it's only a very small increase, but instead geometrically grow capacity.
          // For small filesizes (<1MB), perform size*2 geometric increase, but for large sizes, do a much more conservative size*1.125 increase to
          // avoid overshooting the allocation cap by a very large margin.
          var CAPACITY_DOUBLING_MAX = 1024 * 1024;
          newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2.0 : 1.125)) | 0);
          if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256); // At minimum allocate 256b for each file when expanding.
          var oldContents = node.contents;
          node.contents = new Uint8Array(newCapacity); // Allocate new storage.
          if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0); // Copy old data over to the new storage.
          return;
        }
        // Not using a typed array to back the file storage. Use a standard JS array instead.
        if (!node.contents && newCapacity > 0) node.contents = [];
        while (node.contents.length < newCapacity) node.contents.push(0);
      },resizeFileStorage:function (node, newSize) {
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
          node.contents = null; // Fully decommit when requesting a resize to zero.
          node.usedBytes = 0;
          return;
        }
  
        if (!node.contents || node.contents.subarray) { // Resize a typed array if that is being used as the backing store.
          var oldContents = node.contents;
          node.contents = new Uint8Array(new ArrayBuffer(newSize)); // Allocate new storage.
          if (oldContents) {
            node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes))); // Copy old data over to the new storage.
          }
          node.usedBytes = newSize;
          return;
        }
        // Backing with a JS array.
        if (!node.contents) node.contents = [];
        if (node.contents.length > newSize) node.contents.length = newSize;
        else while (node.contents.length < newSize) node.contents.push(0);
        node.usedBytes = newSize;
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.usedBytes;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.resizeFileStorage(node, attr.size);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 511 /* 0777 */ | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= stream.node.usedBytes) return 0;
          var size = Math.min(stream.node.usedBytes - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          if (!length) return 0;
          var node = stream.node;
          node.timestamp = Date.now();
  
          if (buffer.subarray && (!node.contents || node.contents.subarray)) { // This write is from a typed array to a typed array?
            if (canOwn) { // Can we just reuse the buffer we are given?
              assert(position === 0, 'canOwn must imply no weird position inside the file');
              node.contents = buffer.subarray(offset, offset + length);
              node.usedBytes = length;
              return length;
            } else if (node.usedBytes === 0 && position === 0) { // If this is a simple first write to an empty file, do a fast set since we don't need to care about old data.
              node.contents = new Uint8Array(buffer.subarray(offset, offset + length));
              node.usedBytes = length;
              return length;
            } else if (position + length <= node.usedBytes) { // Writing to an already allocated and used subrange of the file?
              node.contents.set(buffer.subarray(offset, offset + length), position);
              return length;
            }
          }
          // Appending to an existing file and we need to reallocate, or source data did not come as a typed array.
          MEMFS.expandFileStorage(node, position+length);
          if (node.contents.subarray && buffer.subarray) node.contents.set(buffer.subarray(offset, offset + length), position); // Use typed array write if available.
          else
            for (var i = 0; i < length; i++) {
             node.contents[position + i] = buffer[offset + i]; // Or fall back to manual write if not.
            }
          node.usedBytes = Math.max(node.usedBytes, position+length);
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.usedBytes;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.expandFileStorage(stream.node, offset + length);
          stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < stream.node.usedBytes) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  
  var IDBFS={dbs:{},indexedDB:function () {
        if (typeof indexedDB !== 'undefined') return indexedDB;
        var ret = null;
        if (typeof window === 'object') ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        assert(ret, 'IDBFS used, but indexedDB not supported');
        return ret;
      },DB_VERSION:21,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        // reuse all of the core MEMFS functionality
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
  
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
  
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
  
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },getDB:function (name, callback) {
        // check the cache first
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
  
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return callback(e);
        }
        req.onupgradeneeded = function(e) {
          var db = e.target.result;
          var transaction = e.target.transaction;
  
          var fileStore;
  
          if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
            fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
          } else {
            fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
          }
  
          if (!fileStore.indexNames.contains('timestamp')) {
            fileStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };
        req.onsuccess = function() {
          db = req.result;
  
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function(e) {
          callback(this.error);
          e.preventDefault();
        };
      },getLocalSet:function (mount, callback) {
        var entries = {};
  
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
  
        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
  
        while (check.length) {
          var path = check.pop();
          var stat;
  
          try {
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
  
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
          }
  
          entries[path] = { timestamp: stat.mtime };
        }
  
        return callback(null, { type: 'local', entries: entries });
      },getRemoteSet:function (mount, callback) {
        var entries = {};
  
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
  
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function(e) {
            callback(this.error);
            e.preventDefault();
          };
  
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          var index = store.index('timestamp');
  
          index.openKeyCursor().onsuccess = function(event) {
            var cursor = event.target.result;
  
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, entries: entries });
            }
  
            entries[cursor.primaryKey] = { timestamp: cursor.key };
  
            cursor.continue();
          };
        });
      },loadLocalEntry:function (path, callback) {
        var stat, node;
  
        try {
          var lookup = FS.lookupPath(path);
          node = lookup.node;
          stat = FS.stat(path);
        } catch (e) {
          return callback(e);
        }
  
        if (FS.isDir(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode });
        } else if (FS.isFile(stat.mode)) {
          // Performance consideration: storing a normal JavaScript array to a IndexedDB is much slower than storing a typed array.
          // Therefore always convert the file contents to a typed array first before writing the data to IndexedDB.
          node.contents = MEMFS.getFileDataAsTypedArray(node);
          return callback(null, { timestamp: stat.mtime, mode: stat.mode, contents: node.contents });
        } else {
          return callback(new Error('node type not supported'));
        }
      },storeLocalEntry:function (path, entry, callback) {
        try {
          if (FS.isDir(entry.mode)) {
            FS.mkdir(path, entry.mode);
          } else if (FS.isFile(entry.mode)) {
            FS.writeFile(path, entry.contents, { encoding: 'binary', canOwn: true });
          } else {
            return callback(new Error('node type not supported'));
          }
  
          FS.chmod(path, entry.mode);
          FS.utime(path, entry.timestamp, entry.timestamp);
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },removeLocalEntry:function (path, callback) {
        try {
          var lookup = FS.lookupPath(path);
          var stat = FS.stat(path);
  
          if (FS.isDir(stat.mode)) {
            FS.rmdir(path);
          } else if (FS.isFile(stat.mode)) {
            FS.unlink(path);
          }
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },loadRemoteEntry:function (store, path, callback) {
        var req = store.get(path);
        req.onsuccess = function(event) { callback(null, event.target.result); };
        req.onerror = function(e) {
          callback(this.error);
          e.preventDefault();
        };
      },storeRemoteEntry:function (store, path, entry, callback) {
        var req = store.put(entry, path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function(e) {
          callback(this.error);
          e.preventDefault();
        };
      },removeRemoteEntry:function (store, path, callback) {
        var req = store.delete(path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function(e) {
          callback(this.error);
          e.preventDefault();
        };
      },reconcile:function (src, dst, callback) {
        var total = 0;
  
        var create = [];
        Object.keys(src.entries).forEach(function (key) {
          var e = src.entries[key];
          var e2 = dst.entries[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create.push(key);
            total++;
          }
        });
  
        var remove = [];
        Object.keys(dst.entries).forEach(function (key) {
          var e = dst.entries[key];
          var e2 = src.entries[key];
          if (!e2) {
            remove.push(key);
            total++;
          }
        });
  
        if (!total) {
          return callback(null);
        }
  
        var errored = false;
        var completed = 0;
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= total) {
            return callback(null);
          }
        };
  
        transaction.onerror = function(e) {
          done(this.error);
          e.preventDefault();
        };
  
        // sort paths in ascending order so directory entries are created
        // before the files inside them
        create.sort().forEach(function (path) {
          if (dst.type === 'local') {
            IDBFS.loadRemoteEntry(store, path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeLocalEntry(path, entry, done);
            });
          } else {
            IDBFS.loadLocalEntry(path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeRemoteEntry(store, path, entry, done);
            });
          }
        });
  
        // sort paths in descending order so files are deleted before their
        // parent directories
        remove.sort().reverse().forEach(function(path) {
          if (dst.type === 'local') {
            IDBFS.removeLocalEntry(path, done);
          } else {
            IDBFS.removeRemoteEntry(store, path, done);
          }
        });
      }};
  
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            path = fs.readlinkSync(path);
            path = NODEJS_PATH.relative(NODEJS_PATH.resolve(node.mount.opts.root), path);
            return path;
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          if (length === 0) return 0; // node errors on 0 length reads
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
  
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
  
          return position;
        }}};
  
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
  
      /*
      // Disabled, see https://github.com/kripken/emscripten/issues/2770
      stream = FS.getStreamFromPtr(stream);
      if (stream.stream_ops.flush) {
        stream.stream_ops.flush(stream);
      }
      */
    }var FS={root:null,mounts:[],devices:[null],streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,trackingDelegate:{},tracking:{openFlags:{READ:1,WRITE:2}},ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || {};
  
        if (!path) return { path: '', node: null };
  
        var defaults = {
          follow_mount: true,
          recurse_count: 0
        };
        for (var key in defaults) {
          if (opts[key] === undefined) {
            opts[key] = defaults[key];
          }
        }
  
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
  
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
  
        // start at the root
        var current = FS.root;
        var current_path = '/';
  
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
  
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
  
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            if (!islast || (islast && opts.follow_mount)) {
              current = current.mounted.root;
            }
          }
  
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
  
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
  
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
  
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
  
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err, parent);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            this.mounted = null;
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
          };
  
          FS.FSNode.prototype = {};
  
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
  
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); }
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); }
            }
          });
        }
  
        var node = new FS.FSNode(parent, name, mode, rdev);
  
        FS.hashAddNode(node);
  
        return node;
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return !!node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        var err = FS.nodePermissions(dir, 'x');
        if (err) return err;
        if (!dir.node_ops.lookup) return ERRNO_CODES.EACCES;
        return 0;
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        // clone it, so we can return an instance of FSStream
        var newStream = new FS.FSStream();
        for (var p in stream) {
          newStream[p] = stream[p];
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },getStreamFromPtr:function (ptr) {
        return FS.streams[ptr - 1];
      },getPtrForStream:function (stream) {
        return stream ? stream.fd + 1 : 0;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },getMounts:function (mount) {
        var mounts = [];
        var check = [mount];
  
        while (check.length) {
          var m = check.pop();
  
          mounts.push(m);
  
          check.push.apply(check, m.mounts);
        }
  
        return mounts;
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= mounts.length) {
            callback(null);
          }
        };
  
        // sync all mounts
        mounts.forEach(function (mount) {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      },mount:function (type, opts, mountpoint) {
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
  
        if (root && FS.root) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;
  
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
          }
  
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
          }
        }
  
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          mounts: []
        };
  
        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
  
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          // set as a mountpoint
          node.mounted = mount;
  
          // add the new mount to the current mount's children
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
  
        return mountRoot;
      },unmount:function (mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
  
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
  
        Object.keys(FS.nameTable).forEach(function (hash) {
          var current = FS.nameTable[hash];
  
          while (current) {
            var next = current.name_next;
  
            if (mounts.indexOf(current.mount) !== -1) {
              FS.destroyNode(current);
            }
  
            current = next;
          }
        });
  
        // no longer a mountpoint
        node.mounted = null;
  
        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1);
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name || name === '.' || name === '..') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 438 /* 0666 */;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 511 /* 0777 */;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 438 /* 0666 */;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        if (!PATH.resolve(oldpath)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        if (!old_dir || !new_dir) throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        try {
          if (FS.trackingDelegate['willMovePath']) {
            FS.trackingDelegate['willMovePath'](old_path, new_path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willMovePath']('"+old_path+"', '"+new_path+"') threw an exception: " + e.message);
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
        try {
          if (FS.trackingDelegate['onMovePath']) FS.trackingDelegate['onMovePath'](old_path, new_path);
        } catch(e) {
          console.log("FS.trackingDelegate['onMovePath']('"+old_path+"', '"+new_path+"') threw an exception: " + e.message);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        try {
          if (FS.trackingDelegate['willDeletePath']) {
            FS.trackingDelegate['willDeletePath'](path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: " + e.message);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
        try {
          if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
        } catch(e) {
          console.log("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: " + e.message);
        }
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        try {
          if (FS.trackingDelegate['willDeletePath']) {
            FS.trackingDelegate['willDeletePath'](path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: " + e.message);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
        try {
          if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
        } catch(e) {
          console.log("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: " + e.message);
        }
      },readlink:function (path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return PATH.resolve(FS.getPath(lookup.node.parent), link.node_ops.readlink(link));
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        if (path === "") {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 438 /* 0666 */ : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        var created = false;
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
            created = true;
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions, if this is not a file we just created now (it is ok to
        // create and write to a file with read-only permissions; it is read-only
        // for later use)
        if (!created) {
          var err = FS.mayOpen(node, flags);
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        try {
          if (FS.trackingDelegate['onOpenFile']) {
            var trackingFlags = 0;
            if ((flags & 2097155) !== 1) {
              trackingFlags |= FS.tracking.openFlags.READ;
            }
            if ((flags & 2097155) !== 0) {
              trackingFlags |= FS.tracking.openFlags.WRITE;
            }
            FS.trackingDelegate['onOpenFile'](path, trackingFlags);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['onOpenFile']('"+path+"', flags) threw an exception: " + e.message);
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position;
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        try {
          if (stream.path && FS.trackingDelegate['onWriteToFile']) FS.trackingDelegate['onWriteToFile'](stream.path);
        } catch(e) {
          console.log("FS.trackingDelegate['onWriteToFile']('"+path+"') threw an exception: " + e.message);
        }
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = UTF8ArrayToString(buf, 0);
        } else if (opts.encoding === 'binary') {
          ret = buf;
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var buf = new Uint8Array(lengthBytesUTF8(data)+1);
          var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
          FS.write(stream, buf, 0, actualNumBytes, 0, opts.canOwn);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0, opts.canOwn);
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
        FS.mkdir('/home');
        FS.mkdir('/home/web_user');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // setup /dev/[u]random
        var random_device;
        if (typeof crypto !== 'undefined') {
          // for modern web browsers
          var randomBuffer = new Uint8Array(1);
          random_device = function() { crypto.getRandomValues(randomBuffer); return randomBuffer[0]; };
        } else if (ENVIRONMENT_IS_NODE) {
          // for nodejs
          random_device = function() { return require('crypto').randomBytes(1)[0]; };
        } else {
          // default for ES5 platforms
          random_device = function() { return (Math.random()*256)|0; };
        }
        FS.createDevice('/dev', 'random', random_device);
        FS.createDevice('/dev', 'urandom', random_device);
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=FS.getPtrForStream(stdin);
        assert(stdin.fd === 0, 'invalid handle for stdin (' + stdin.fd + ')');
  
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=FS.getPtrForStream(stdout);
        assert(stdout.fd === 1, 'invalid handle for stdout (' + stdout.fd + ')');
  
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=FS.getPtrForStream(stderr);
        assert(stderr.fd === 2, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno, node) {
          this.node = node;
          this.setErrno = function(errno) {
            this.errno = errno;
            for (var key in ERRNO_CODES) {
              if (ERRNO_CODES[key] === errno) {
                this.code = key;
                break;
              }
            }
          };
          this.setErrno(errno);
          this.message = ERRNO_MESSAGES[errno];
          if (this.stack) this.stack = demangleAll(this.stack);
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
  
        FS.nameTable = new Array(4096);
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        FS.ensureErrnoError();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
  
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
            obj.usedBytes = obj.contents.length;
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
        function LazyUint8Array() {
          this.lengthKnown = false;
          this.chunks = []; // Loaded chunks. Index is the chunk number
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
          if (idx > this.length-1 || idx < 0) {
            return undefined;
          }
          var chunkOffset = idx % this.chunkSize;
          var chunkNum = (idx / this.chunkSize)|0;
          return this.getter(chunkNum)[chunkOffset];
        }
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
          this.getter = getter;
        }
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
          // Find length
          var xhr = new XMLHttpRequest();
          xhr.open('HEAD', url, false);
          xhr.send(null);
          if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
          var datalength = Number(xhr.getResponseHeader("Content-length"));
          var header;
          var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
          var chunkSize = 1024*1024; // Chunk size in bytes
  
          if (!hasByteServing) chunkSize = datalength;
  
          // Function to get a range from the remote URL.
          var doXHR = (function(from, to) {
            if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
            if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
  
            // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
  
            // Some hints to the browser that we want binary data.
            if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
            if (xhr.overrideMimeType) {
              xhr.overrideMimeType('text/plain; charset=x-user-defined');
            }
  
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            if (xhr.response !== undefined) {
              return new Uint8Array(xhr.response || []);
            } else {
              return intArrayFromString(xhr.responseText || '', true);
            }
          });
          var lazyArray = this;
          lazyArray.setDataGetter(function(chunkNum) {
            var start = chunkNum * chunkSize;
            var end = (chunkNum+1) * chunkSize - 1; // including this byte
            end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
              lazyArray.chunks[chunkNum] = doXHR(start, end);
            }
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
            return lazyArray.chunks[chunkNum];
          });
  
          this._length = datalength;
          this._chunkSize = chunkSize;
          this.lengthKnown = true;
        }
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
  
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // Add a function that defers querying the file size until it is asked the first time.
        Object.defineProperty(node, "usedBytes", {
            get: function() { return this.contents.length; }
        });
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            return ''; // an invalid portion invalidates the whole thing
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  
  
  function _emscripten_set_main_loop_timing(mode, value) {
      Browser.mainLoop.timingMode = mode;
      Browser.mainLoop.timingValue = value;
  
      if (!Browser.mainLoop.func) {
        console.error('emscripten_set_main_loop_timing: Cannot set timing mode for main loop since a main loop does not exist! Call emscripten_set_main_loop first to set one up.');
        return 1; // Return non-zero on failure, can't set timing mode when there is no main loop.
      }
  
      if (mode == 0 /*EM_TIMING_SETTIMEOUT*/) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler() {
          setTimeout(Browser.mainLoop.runner, value); // doing this each time means that on exception, we stop
        };
        Browser.mainLoop.method = 'timeout';
      } else if (mode == 1 /*EM_TIMING_RAF*/) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler() {
          Browser.requestAnimationFrame(Browser.mainLoop.runner);
        };
        Browser.mainLoop.method = 'rAF';
      }
      return 0;
    }function _emscripten_set_main_loop(func, fps, simulateInfiniteLoop, arg, noSetTiming) {
      Module['noExitRuntime'] = true;
  
      assert(!Browser.mainLoop.func, 'emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.');
  
      Browser.mainLoop.func = func;
      Browser.mainLoop.arg = arg;
  
      var thisMainLoopId = Browser.mainLoop.currentlyRunningMainloop;
  
      Browser.mainLoop.runner = function Browser_mainLoop_runner() {
        if (ABORT) return;
        if (Browser.mainLoop.queue.length > 0) {
          var start = Date.now();
          var blocker = Browser.mainLoop.queue.shift();
          blocker.func(blocker.arg);
          if (Browser.mainLoop.remainingBlockers) {
            var remaining = Browser.mainLoop.remainingBlockers;
            var next = remaining%1 == 0 ? remaining-1 : Math.floor(remaining);
            if (blocker.counted) {
              Browser.mainLoop.remainingBlockers = next;
            } else {
              // not counted, but move the progress along a tiny bit
              next = next + 0.5; // do not steal all the next one's progress
              Browser.mainLoop.remainingBlockers = (8*remaining + next)/9;
            }
          }
          console.log('main loop blocker "' + blocker.name + '" took ' + (Date.now() - start) + ' ms'); //, left: ' + Browser.mainLoop.remainingBlockers);
          Browser.mainLoop.updateStatus();
          setTimeout(Browser.mainLoop.runner, 0);
          return;
        }
  
        // catch pauses from non-main loop sources
        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
  
        // Implement very basic swap interval control
        Browser.mainLoop.currentFrameNumber = Browser.mainLoop.currentFrameNumber + 1 | 0;
        if (Browser.mainLoop.timingMode == 1/*EM_TIMING_RAF*/ && Browser.mainLoop.timingValue > 1 && Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue != 0) {
          // Not the scheduled time to render this frame - skip.
          Browser.mainLoop.scheduler();
          return;
        }
  
        // Signal GL rendering layer that processing of a new frame is about to start. This helps it optimize
        // VBO double-buffering and reduce GPU stalls.
  
        if (Browser.mainLoop.method === 'timeout' && Module.ctx) {
          Module.printErr('Looks like you are rendering without using requestAnimationFrame for the main loop. You should use 0 for the frame rate in emscripten_set_main_loop in order to use requestAnimationFrame, as that can greatly improve your frame rates!');
          Browser.mainLoop.method = ''; // just warn once per call to set main loop
        }
  
        Browser.mainLoop.runIter(function() {
          if (typeof arg !== 'undefined') {
            Runtime.dynCall('vi', func, [arg]);
          } else {
            Runtime.dynCall('v', func);
          }
        });
  
        // catch pauses from the main loop itself
        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
  
        // Queue new audio data. This is important to be right after the main loop invocation, so that we will immediately be able
        // to queue the newest produced audio samples.
        // TODO: Consider adding pre- and post- rAF callbacks so that GL.newRenderingFrameStarted() and SDL.audio.queueNewAudioData()
        //       do not need to be hardcoded into this function, but can be more generic.
        if (typeof SDL === 'object' && SDL.audio && SDL.audio.queueNewAudioData) SDL.audio.queueNewAudioData();
  
        Browser.mainLoop.scheduler();
      }
  
      if (!noSetTiming) {
        if (fps && fps > 0) _emscripten_set_main_loop_timing(0/*EM_TIMING_SETTIMEOUT*/, 1000.0 / fps);
        else _emscripten_set_main_loop_timing(1/*EM_TIMING_RAF*/, 1); // Do rAF by rendering each frame (no decimating)
  
        Browser.mainLoop.scheduler();
      }
  
      if (simulateInfiniteLoop) {
        throw 'SimulateInfiniteLoop';
      }
    }var Browser={mainLoop:{scheduler:null,method:"",currentlyRunningMainloop:0,func:null,arg:0,timingMode:0,timingValue:0,currentFrameNumber:0,queue:[],pause:function () {
          Browser.mainLoop.scheduler = null;
          Browser.mainLoop.currentlyRunningMainloop++; // Incrementing this signals the previous main loop that it's now become old, and it must return.
        },resume:function () {
          Browser.mainLoop.currentlyRunningMainloop++;
          var timingMode = Browser.mainLoop.timingMode;
          var timingValue = Browser.mainLoop.timingValue;
          var func = Browser.mainLoop.func;
          Browser.mainLoop.func = null;
          _emscripten_set_main_loop(func, 0, false, Browser.mainLoop.arg, true /* do not set timing and call scheduler, we will do it on the next lines */);
          _emscripten_set_main_loop_timing(timingMode, timingValue);
          Browser.mainLoop.scheduler();
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        },runIter:function (func) {
          if (ABORT) return;
          if (Module['preMainLoop']) {
            var preRet = Module['preMainLoop']();
            if (preRet === false) {
              return; // |return false| skips a frame
            }
          }
          try {
            func();
          } catch (e) {
            if (e instanceof ExitStatus) {
              return;
            } else {
              if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
              throw e;
            }
          }
          if (Module['postMainLoop']) Module['postMainLoop']();
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
  
        if (Browser.initted) return;
        Browser.initted = true;
  
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
  
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
  
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          assert(typeof url == 'string', 'createObjectURL must return a url as a string');
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
  
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            assert(typeof url == 'string', 'createObjectURL must return a url as a string');
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
  
        // Canvas event setup
  
        var canvas = Module['canvas'];
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas ||
                                document['msPointerLockElement'] === canvas;
        }
        if (canvas) {
          // forced aspect ratio can be enabled by defining 'forcedAspectRatio' on Module
          // Module['forcedAspectRatio'] = 4 / 3;
          
          canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                      canvas['mozRequestPointerLock'] ||
                                      canvas['webkitRequestPointerLock'] ||
                                      canvas['msRequestPointerLock'] ||
                                      function(){};
          canvas.exitPointerLock = document['exitPointerLock'] ||
                                   document['mozExitPointerLock'] ||
                                   document['webkitExitPointerLock'] ||
                                   document['msExitPointerLock'] ||
                                   function(){}; // no-op if function does not exist
          canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
  
  
          document.addEventListener('pointerlockchange', pointerLockChange, false);
          document.addEventListener('mozpointerlockchange', pointerLockChange, false);
          document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
          document.addEventListener('mspointerlockchange', pointerLockChange, false);
  
          if (Module['elementPointerLock']) {
            canvas.addEventListener("click", function(ev) {
              if (!Browser.pointerLock && canvas.requestPointerLock) {
                canvas.requestPointerLock();
                ev.preventDefault();
              }
            }, false);
          }
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        if (useWebGL && Module.ctx && canvas == Module.canvas) return Module.ctx; // no need to recreate GL context if it's already been created for this canvas.
  
        var ctx;
        var contextHandle;
        if (useWebGL) {
          // For GLES2/desktop GL compatibility, adjust a few defaults to be different to WebGL defaults, so that they align better with the desktop defaults.
          var contextAttributes = {
            antialias: false,
            alpha: false
          };
  
          if (webGLContextAttributes) {
            for (var attribute in webGLContextAttributes) {
              contextAttributes[attribute] = webGLContextAttributes[attribute];
            }
          }
  
          contextHandle = GL.createContext(canvas, contextAttributes);
          if (contextHandle) {
            ctx = GL.getContext(contextHandle).GLctx;
          }
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
        } else {
          ctx = canvas.getContext('2d');
        }
  
        if (!ctx) return null;
  
        if (setInModule) {
          if (!useWebGL) assert(typeof GLctx === 'undefined', 'cannot set in module if GLctx is used, but we are a non-GL context that would replace it');
  
          Module.ctx = ctx;
          if (useWebGL) GL.makeContextCurrent(contextHandle);
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas, vrDevice) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        Browser.vrDevice = vrDevice;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
        if (typeof Browser.vrDevice === 'undefined') Browser.vrDevice = null;
  
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          var canvasContainer = canvas.parentNode;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement'] ||
               document['msFullScreenElement'] || document['msFullscreenElement'] ||
               document['webkitCurrentFullScreenElement']) === canvasContainer) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'] ||
                                      document['msExitFullscreen'] ||
                                      document['exitFullscreen'] ||
                                      function() {};
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else {
            
            // remove the full screen specific parent of the canvas again to restore the HTML structure from before going full screen
            canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
            canvasContainer.parentNode.removeChild(canvasContainer);
            
            if (Browser.resizeCanvas) Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
          Browser.updateCanvasDimensions(canvas);
        }
  
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
          document.addEventListener('MSFullscreenChange', fullScreenChange, false);
        }
  
        // create a new parent to ensure the canvas has no siblings. this allows browsers to optimize full screen performance when its parent is the full screen root
        var canvasContainer = document.createElement("div");
        canvas.parentNode.insertBefore(canvasContainer, canvas);
        canvasContainer.appendChild(canvas);
  
        // use parent of canvas as full screen root to allow aspect ratio correction (Firefox stretches the root to screen size)
        canvasContainer.requestFullScreen = canvasContainer['requestFullScreen'] ||
                                            canvasContainer['mozRequestFullScreen'] ||
                                            canvasContainer['msRequestFullscreen'] ||
                                           (canvasContainer['webkitRequestFullScreen'] ? function() { canvasContainer['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
  
        if (vrDevice) {
          canvasContainer.requestFullScreen({ vrDisplay: vrDevice });
        } else {
          canvasContainer.requestFullScreen();
        }
      },nextRAF:0,fakeRequestAnimationFrame:function (func) {
        // try to keep 60fps between calls to here
        var now = Date.now();
        if (Browser.nextRAF === 0) {
          Browser.nextRAF = now + 1000/60;
        } else {
          while (now + 2 >= Browser.nextRAF) { // fudge a little, to avoid timer jitter causing us to do lots of delay:0
            Browser.nextRAF += 1000/60;
          }
        }
        var delay = Math.max(Browser.nextRAF - now, 0);
        setTimeout(func, delay);
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          Browser.fakeRequestAnimationFrame(func);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           Browser.fakeRequestAnimationFrame;
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },allowAsyncCallbacks:true,queuedAsyncCallbacks:[],pauseAsyncCallbacks:function () {
        Browser.allowAsyncCallbacks = false;
      },resumeAsyncCallbacks:function () { // marks future callbacks as ok to execute, and synchronously runs any remaining ones right now
        Browser.allowAsyncCallbacks = true;
        if (Browser.queuedAsyncCallbacks.length > 0) {
          var callbacks = Browser.queuedAsyncCallbacks;
          Browser.queuedAsyncCallbacks = [];
          callbacks.forEach(function(func) {
            func();
          });
        }
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (ABORT) return;
          if (Browser.allowAsyncCallbacks) {
            func();
          } else {
            Browser.queuedAsyncCallbacks.push(func);
          }
        });
      },safeSetTimeout:function (func, timeout) {
        Module['noExitRuntime'] = true;
        return setTimeout(function() {
          if (ABORT) return;
          if (Browser.allowAsyncCallbacks) {
            func();
          } else {
            Browser.queuedAsyncCallbacks.push(func);
          }
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        Module['noExitRuntime'] = true;
        return setInterval(function() {
          if (ABORT) return;
          if (Browser.allowAsyncCallbacks) {
            func();
          } // drop it on the floor otherwise, next interval will kick in
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },getMouseWheelDelta:function (event) {
        var delta = 0;
        switch (event.type) {
          case 'DOMMouseScroll': 
            delta = event.detail;
            break;
          case 'mousewheel': 
            delta = event.wheelDelta;
            break;
          case 'wheel': 
            delta = event['deltaY'];
            break;
          default:
            throw 'unrecognized mouse wheel event: ' + event.type;
        }
        return delta;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,touches:{},lastTouches:{},calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
  
          // Neither .scrollX or .pageXOffset are defined in a spec, but
          // we prefer .scrollX because it is currently in a spec draft.
          // (see: http://www.w3.org/TR/2013/WD-cssom-view-20131217/)
          var scrollX = ((typeof window.scrollX !== 'undefined') ? window.scrollX : window.pageXOffset);
          var scrollY = ((typeof window.scrollY !== 'undefined') ? window.scrollY : window.pageYOffset);
          // If this assert lands, it's likely because the browser doesn't support scrollX or pageXOffset
          // and we have no viable fallback.
          assert((typeof scrollX !== 'undefined') && (typeof scrollY !== 'undefined'), 'Unable to retrieve scroll position, mouse positions likely broken.');
  
          if (event.type === 'touchstart' || event.type === 'touchend' || event.type === 'touchmove') {
            var touch = event.touch;
            if (touch === undefined) {
              return; // the "touch" property is only defined in SDL
  
            }
            var adjustedX = touch.pageX - (scrollX + rect.left);
            var adjustedY = touch.pageY - (scrollY + rect.top);
  
            adjustedX = adjustedX * (cw / rect.width);
            adjustedY = adjustedY * (ch / rect.height);
  
            var coords = { x: adjustedX, y: adjustedY };
            
            if (event.type === 'touchstart') {
              Browser.lastTouches[touch.identifier] = coords;
              Browser.touches[touch.identifier] = coords;
            } else if (event.type === 'touchend' || event.type === 'touchmove') {
              Browser.lastTouches[touch.identifier] = Browser.touches[touch.identifier];
              Browser.touches[touch.identifier] = { x: adjustedX, y: adjustedY };
            } 
            return;
          }
  
          var x = event.pageX - (scrollX + rect.left);
          var y = event.pageY - (scrollY + rect.top);
  
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
  
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        Browser.updateCanvasDimensions(canvas, width, height);
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },updateCanvasDimensions:function (canvas, wNative, hNative) {
        if (wNative && hNative) {
          canvas.widthNative = wNative;
          canvas.heightNative = hNative;
        } else {
          wNative = canvas.widthNative;
          hNative = canvas.heightNative;
        }
        var w = wNative;
        var h = hNative;
        if (Module['forcedAspectRatio'] && Module['forcedAspectRatio'] > 0) {
          if (w/h < Module['forcedAspectRatio']) {
            w = Math.round(h * Module['forcedAspectRatio']);
          } else {
            h = Math.round(w / Module['forcedAspectRatio']);
          }
        }
        if (((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
             document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
             document['fullScreenElement'] || document['fullscreenElement'] ||
             document['msFullScreenElement'] || document['msFullscreenElement'] ||
             document['webkitCurrentFullScreenElement']) === canvas.parentNode) && (typeof screen != 'undefined')) {
           var factor = Math.min(screen.width / w, screen.height / h);
           w = Math.round(w * factor);
           h = Math.round(h * factor);
        }
        if (Browser.resizeCanvas) {
          if (canvas.width  != w) canvas.width  = w;
          if (canvas.height != h) canvas.height = h;
          if (typeof canvas.style != 'undefined') {
            canvas.style.removeProperty( "width");
            canvas.style.removeProperty("height");
          }
        } else {
          if (canvas.width  != wNative) canvas.width  = wNative;
          if (canvas.height != hNative) canvas.height = hNative;
          if (typeof canvas.style != 'undefined') {
            if (w != wNative || h != hNative) {
              canvas.style.setProperty( "width", w + "px", "important");
              canvas.style.setProperty("height", h + "px", "important");
            } else {
              canvas.style.removeProperty( "width");
              canvas.style.removeProperty("height");
            }
          }
        }
      },wgetRequests:{},nextWgetRequestHandle:0,getNextWgetRequestHandle:function () {
        var handle = Browser.nextWgetRequestHandle;
        Browser.nextWgetRequestHandle++;
        return handle;
      }};

  function _time(ptr) {
      var ret = (Date.now()/1000)|0;
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret;
      }
      return ret;
    }

   
  Module["_strlen"] = _strlen;

  
  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
      return dest;
    } 
  Module["_memcpy"] = _memcpy;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas, vrDevice) { Browser.requestFullScreen(lockPointer, resizeCanvas, vrDevice) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); var NODEJS_PATH = require("path"); NODEFS.staticInit(); }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);

staticSealed = true; // seal the static portion of memory

STACK_MAX = STACK_BASE + TOTAL_STACK;

DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);

assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");



Module.asmGlobalArg = { "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array, "NaN": NaN, "Infinity": Infinity };
Module.asmLibraryArg = { "abort": abort, "assert": assert, "_fflush": _fflush, "_sysconf": _sysconf, "_abort": _abort, "___setErrNo": ___setErrNo, "_sbrk": _sbrk, "_time": _time, "_emscripten_set_main_loop_timing": _emscripten_set_main_loop_timing, "_emscripten_memcpy_big": _emscripten_memcpy_big, "_emscripten_set_main_loop": _emscripten_set_main_loop, "___errno_location": ___errno_location, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT };
// EMSCRIPTEN_START_ASM
var asm = (function(global, env, buffer) {
  'almost asm';
  
  var HEAP8 = new global.Int8Array(buffer);
  var HEAP16 = new global.Int16Array(buffer);
  var HEAP32 = new global.Int32Array(buffer);
  var HEAPU8 = new global.Uint8Array(buffer);
  var HEAPU16 = new global.Uint16Array(buffer);
  var HEAPU32 = new global.Uint32Array(buffer);
  var HEAPF32 = new global.Float32Array(buffer);
  var HEAPF64 = new global.Float64Array(buffer);


  var STACKTOP=env.STACKTOP|0;
  var STACK_MAX=env.STACK_MAX|0;
  var tempDoublePtr=env.tempDoublePtr|0;
  var ABORT=env.ABORT|0;

  var __THREW__ = 0;
  var threwValue = 0;
  var setjmpId = 0;
  var undef = 0;
  var nan = global.NaN, inf = global.Infinity;
  var tempInt = 0, tempBigInt = 0, tempBigIntP = 0, tempBigIntS = 0, tempBigIntR = 0.0, tempBigIntI = 0, tempBigIntD = 0, tempValue = 0, tempDouble = 0.0;

  var tempRet0 = 0;
  var tempRet1 = 0;
  var tempRet2 = 0;
  var tempRet3 = 0;
  var tempRet4 = 0;
  var tempRet5 = 0;
  var tempRet6 = 0;
  var tempRet7 = 0;
  var tempRet8 = 0;
  var tempRet9 = 0;
  var Math_floor=global.Math.floor;
  var Math_abs=global.Math.abs;
  var Math_sqrt=global.Math.sqrt;
  var Math_pow=global.Math.pow;
  var Math_cos=global.Math.cos;
  var Math_sin=global.Math.sin;
  var Math_tan=global.Math.tan;
  var Math_acos=global.Math.acos;
  var Math_asin=global.Math.asin;
  var Math_atan=global.Math.atan;
  var Math_atan2=global.Math.atan2;
  var Math_exp=global.Math.exp;
  var Math_log=global.Math.log;
  var Math_ceil=global.Math.ceil;
  var Math_imul=global.Math.imul;
  var Math_min=global.Math.min;
  var Math_clz32=global.Math.clz32;
  var abort=env.abort;
  var assert=env.assert;
  var _fflush=env._fflush;
  var _sysconf=env._sysconf;
  var _abort=env._abort;
  var ___setErrNo=env.___setErrNo;
  var _sbrk=env._sbrk;
  var _time=env._time;
  var _emscripten_set_main_loop_timing=env._emscripten_set_main_loop_timing;
  var _emscripten_memcpy_big=env._emscripten_memcpy_big;
  var _emscripten_set_main_loop=env._emscripten_set_main_loop;
  var ___errno_location=env.___errno_location;
  var tempFloat = 0.0;

// EMSCRIPTEN_START_FUNCS
function stackAlloc(size) {
  size = size|0;
  var ret = 0;
  ret = STACKTOP;
  STACKTOP = (STACKTOP + size)|0;
STACKTOP = (STACKTOP + 15)&-16;
if ((STACKTOP|0) >= (STACK_MAX|0)) abort();

  return ret|0;
}
function stackSave() {
  return STACKTOP|0;
}
function stackRestore(top) {
  top = top|0;
  STACKTOP = top;
}

function setThrew(threw, value) {
  threw = threw|0;
  value = value|0;
  if ((__THREW__|0) == 0) {
    __THREW__ = threw;
    threwValue = value;
  }
}
function copyTempFloat(ptr) {
  ptr = ptr|0;
  HEAP8[tempDoublePtr>>0] = HEAP8[ptr>>0];
  HEAP8[tempDoublePtr+1>>0] = HEAP8[ptr+1>>0];
  HEAP8[tempDoublePtr+2>>0] = HEAP8[ptr+2>>0];
  HEAP8[tempDoublePtr+3>>0] = HEAP8[ptr+3>>0];
}
function copyTempDouble(ptr) {
  ptr = ptr|0;
  HEAP8[tempDoublePtr>>0] = HEAP8[ptr>>0];
  HEAP8[tempDoublePtr+1>>0] = HEAP8[ptr+1>>0];
  HEAP8[tempDoublePtr+2>>0] = HEAP8[ptr+2>>0];
  HEAP8[tempDoublePtr+3>>0] = HEAP8[ptr+3>>0];
  HEAP8[tempDoublePtr+4>>0] = HEAP8[ptr+4>>0];
  HEAP8[tempDoublePtr+5>>0] = HEAP8[ptr+5>>0];
  HEAP8[tempDoublePtr+6>>0] = HEAP8[ptr+6>>0];
  HEAP8[tempDoublePtr+7>>0] = HEAP8[ptr+7>>0];
}
function setTempRet0(value) {
  value = value|0;
  tempRet0 = value;
}
function getTempRet0() {
  return tempRet0|0;
}

function _iconv_open($to,$from) {
 $to = $to|0;
 $from = $from|0;
 var $$0 = 0, $0 = 0, $1 = 0, $10 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (_find_charmap($to)|0);
 $1 = ($0|0)==(-1);
 if (!($1)) {
  $2 = (_find_charmap($from)|0);
  $3 = ($2|0)==(-1);
  if (!($3)) {
   $4 = (8 + ($0)|0);
   $5 = HEAP8[$4>>0]|0;
   $6 = ($5&255)>(207);
   if (!($6)) {
    $8 = $2 << 16;
    $9 = $8 | $0;
    $10 = $9;
    $$0 = $10;
    return ($$0|0);
   }
  }
 }
 $7 = (___errno_location()|0);
 HEAP32[$7>>2] = 22;
 $$0 = (-1);
 return ($$0|0);
}
function _iconv_close($cd) {
 $cd = $cd|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 return 0;
}
function _iconv($cd0,$in,$inb,$out,$outb) {
 $cd0 = $cd0|0;
 $in = $in|0;
 $inb = $inb|0;
 $out = $out|0;
 $outb = $outb|0;
 var $$ = 0, $$0 = 0, $$19 = 0, $$20 = 0, $$23 = 0, $$26 = 0, $$c$8 = 0, $$lcssa = 0, $$lcssa74 = 0, $$lobit = 0, $$mask = 0, $$pn = 0, $$sum = 0, $$sum12 = 0, $$sum15 = 0, $$sum16 = 0, $$sum17 = 0, $$sum18 = 0, $$sum2930 = 0, $$sum3132 = 0;
 var $$sum3536 = 0, $$sum3738 = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0;
 var $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0;
 var $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0;
 var $150 = 0, $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0;
 var $169 = 0, $17 = 0, $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0;
 var $187 = 0, $188 = 0, $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0;
 var $204 = 0, $205 = 0, $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0;
 var $222 = 0, $223 = 0, $224 = 0, $225 = 0, $226 = 0, $227 = 0, $228 = 0, $229 = 0, $23 = 0, $230 = 0, $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0;
 var $240 = 0, $241 = 0, $242 = 0, $243 = 0, $244 = 0, $245 = 0, $246 = 0, $247 = 0, $248 = 0, $249 = 0, $25 = 0, $250 = 0, $251 = 0, $252 = 0, $253 = 0, $254 = 0, $255 = 0, $256 = 0, $257 = 0, $258 = 0;
 var $259 = 0, $26 = 0, $260 = 0, $261 = 0, $262 = 0, $263 = 0, $264 = 0, $265 = 0, $266 = 0, $267 = 0, $268 = 0, $269 = 0, $27 = 0, $270 = 0, $271 = 0, $272 = 0, $273 = 0, $274 = 0, $275 = 0, $276 = 0;
 var $277 = 0, $278 = 0, $279 = 0, $28 = 0, $280 = 0, $281 = 0, $282 = 0, $283 = 0, $284 = 0, $285 = 0, $286 = 0, $287 = 0, $288 = 0, $289 = 0, $29 = 0, $290 = 0, $291 = 0, $292 = 0, $293 = 0, $294 = 0;
 var $295 = 0, $296 = 0, $297 = 0, $298 = 0, $299 = 0, $3 = 0, $30 = 0, $300 = 0, $301 = 0, $302 = 0, $303 = 0, $304 = 0, $305 = 0, $306 = 0, $307 = 0, $308 = 0, $309 = 0, $31 = 0, $310 = 0, $311 = 0;
 var $312 = 0, $313 = 0, $314 = 0, $315 = 0, $316 = 0, $317 = 0, $318 = 0, $319 = 0, $32 = 0, $320 = 0, $321 = 0, $322 = 0, $323 = 0, $324 = 0, $325 = 0, $326 = 0, $327 = 0, $328 = 0, $329 = 0, $33 = 0;
 var $330 = 0, $331 = 0, $332 = 0, $333 = 0, $334 = 0, $335 = 0, $336 = 0, $337 = 0, $338 = 0, $339 = 0, $34 = 0, $340 = 0, $341 = 0, $342 = 0, $343 = 0, $344 = 0, $345 = 0, $346 = 0, $347 = 0, $348 = 0;
 var $349 = 0, $35 = 0, $350 = 0, $351 = 0, $352 = 0, $353 = 0, $354 = 0, $355 = 0, $356 = 0, $357 = 0, $358 = 0, $359 = 0, $36 = 0, $360 = 0, $361 = 0, $362 = 0, $363 = 0, $364 = 0, $365 = 0, $366 = 0;
 var $367 = 0, $368 = 0, $369 = 0, $37 = 0, $370 = 0, $371 = 0, $372 = 0, $373 = 0, $374 = 0, $375 = 0, $376 = 0, $377 = 0, $378 = 0, $379 = 0, $38 = 0, $380 = 0, $381 = 0, $382 = 0, $383 = 0, $384 = 0;
 var $385 = 0, $386 = 0, $387 = 0, $388 = 0, $389 = 0, $39 = 0, $390 = 0, $391 = 0, $392 = 0, $393 = 0, $394 = 0, $395 = 0, $396 = 0, $397 = 0, $398 = 0, $399 = 0, $4 = 0, $40 = 0, $400 = 0, $401 = 0;
 var $402 = 0, $403 = 0, $404 = 0, $405 = 0, $406 = 0, $407 = 0, $408 = 0, $409 = 0, $41 = 0, $410 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0;
 var $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0;
 var $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0;
 var $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $brmerge = 0, $c$0 = 0, $c$1 = 0, $c$10 = 0, $c$1163 = 0, $c$1163$lcssa = 0, $c$2 = 0;
 var $c$361 = 0, $c$4 = 0, $c$5 = 0, $c$655 = 0, $c$8 = 0, $c$9 = 0, $d$1 = 0, $d$262 = 0, $d$5 = 0, $d$656 = 0, $err$0 = 0, $err$0$ph = 0, $exitcond = 0, $exitcond69 = 0, $exitcond70 = 0, $exitcond71 = 0, $i$060 = 0, $i1$054 = 0, $j$058 = 0, $j2$052 = 0;
 var $k$059 = 0, $k$1$ = 0, $k$1$$lcssa = 0, $k$1$$lcssa$lcssa = 0, $k$157 = 0, $k$3 = 0, $k$453 = 0, $k$5$ = 0, $k$5$$lcssa = 0, $k$5$$lcssa$lcssa = 0, $k$551 = 0, $k$7 = 0, $l$0 = 0, $l$2 = 0, $l$3 = 0, $not$ = 0, $not$34 = 0, $or$cond = 0, $or$cond11 = 0, $or$cond21 = 0;
 var $or$cond22 = 0, $or$cond25 = 0, $or$cond28 = 0, $or$cond3 = 0, $or$cond5 = 0, $or$cond9 = 0, $phitmp = 0, $phitmp33 = 0, $st = 0, $switch$cast = 0, $switch$cast$clear = 0, $switch$downshift = 0, $switch$downshift$clear = 0, $switch$masked = 0, $switch$tableidx = 0, $tmp = 0, $wc = 0, $x$064 = 0, $x$1 = 0, $x$2 = 0;
 var $x$3 = 0, $x$3$lcssa = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $st = sp;
 $wc = sp + 16|0;
 $0 = sp + 8|0;
 $1 = sp + 12|0;
 $tmp = sp + 20|0;
 $2 = $cd0;
 $3 = $2 & 65535;
 $4 = $2 >>> 16;
 $$sum = (($4) + 1)|0;
 $$sum12 = (($3) + 1)|0;
 $5 = $st;
 $6 = $5;
 HEAP32[$6>>2] = 0;
 $7 = (($5) + 4)|0;
 $8 = $7;
 HEAP32[$8>>2] = 0;
 $9 = (8 + ($4)|0);
 $10 = HEAP8[$9>>0]|0;
 $11 = (8 + ($3)|0);
 $12 = HEAP8[$11>>0]|0;
 $13 = ($in|0)==(0|0);
 if ($13) {
  $$0 = 0;
  STACKTOP = sp;return ($$0|0);
 }
 $14 = HEAP32[$in>>2]|0;
 $15 = ($14|0)==(0|0);
 if ($15) {
  $$0 = 0;
  STACKTOP = sp;return ($$0|0);
 }
 $16 = HEAP32[$inb>>2]|0;
 $17 = ($16|0)==(0);
 if ($17) {
  $$0 = 0;
  STACKTOP = sp;return ($$0|0);
 }
 $18 = $10&255;
 $19 = (($18) + 128)|0;
 $20 = (($4) + 2)|0;
 $21 = $18 & 3;
 $22 = $21 ^ 1;
 $23 = $21 ^ 2;
 $24 = $21 ^ 3;
 $25 = $18 & 1;
 $26 = $25 ^ 1;
 $27 = $18 & 254;
 $28 = ($27|0)==(196);
 $$sum3536 = $25 | 2;
 $$sum3738 = $26 | 2;
 $29 = ($10<<24>>24)==(-38);
 $30 = ($10<<24>>24)==(-40);
 $31 = $12&255;
 $32 = (($31) + -192)|0;
 $33 = ($32>>>0)>(8);
 $34 = $3;
 $35 = (78056 + ($32)|0);
 $36 = (($31) + 128)|0;
 $37 = (128 - ($31))|0;
 $38 = ($12<<24>>24)==(-128);
 $39 = (($3) + 2)|0;
 $40 = $10 & -2;
 $41 = ($40<<24>>24)==(-60);
 $42 = $31 & 1;
 $43 = $42 ^ 1;
 $$sum2930 = $42 | 2;
 $$sum3132 = $43 | 2;
 $44 = $31 & 3;
 $45 = $44 ^ 1;
 $46 = $44 ^ 2;
 $47 = $44 ^ 3;
 $48 = (($18) + -192)|0;
 $49 = ($48>>>0)<(7);
 $51 = $14;$54 = $16;$x$064 = 0;
 L10: while(1) {
  $50 = HEAP8[$51>>0]|0;
  $52 = $50&255;
  $53 = ($50<<24>>24)<(0);
  $brmerge = $53 | $49;
  L12: do {
   if ($brmerge) {
    do {
     switch ($18|0) {
     case 232:  {
      $242 = ($54>>>0)<(2);
      if ($242) {
       label = 120;
       break L10;
      }
      $243 = (($51) + 1|0);
      $244 = HEAP8[$243>>0]|0;
      $245 = $244&255;
      $246 = (($52) + -161)|0;
      $247 = (($245) + -161)|0;
      $248 = ($246>>>0)>(92);
      $249 = ($247>>>0)>(93);
      $or$cond9 = $248 | $249;
      if (!($or$cond9)) {
       $279 = ((106048 + (($246*188)|0)|0) + ($247<<1)|0);
       $280 = HEAP16[$279>>1]|0;
       $281 = $280&65535;
       $282 = ($280<<16>>16)==(0);
       if ($282) {
        $err$0$ph = 84;
        label = 119;
        break L10;
       } else {
        $c$8 = $281;$l$2 = 2;
        label = 92;
        break L12;
       }
      }
      $250 = (($52) + -129)|0;
      $251 = ($250>>>0)>(92);
      if ($251) {
       $err$0$ph = 84;
       label = 119;
       break L10;
      }
      $252 = ($250>>>0)>(68);
      $253 = ($244&255)>(82);
      $or$cond11 = $252 & $253;
      if ($or$cond11) {
       $err$0$ph = 84;
       label = 119;
       break L10;
      }
      $254 = (($245) + -65)|0;
      $255 = ($254>>>0)<(26);
      do {
       if ($255) {
        $d$5 = $254;
       } else {
        $256 = (($245) + -97)|0;
        $257 = ($256>>>0)<(26);
        if ($257) {
         $258 = (($245) + -71)|0;
         $d$5 = $258;
         break;
        }
        $259 = (($245) + -129)|0;
        $260 = ($259>>>0)<(126);
        if (!($260)) {
         $err$0$ph = 84;
         label = 119;
         break L10;
        }
        $261 = (($245) + -77)|0;
        $d$5 = $261;
       }
      } while(0);
      $262 = ($250>>>0)<(32);
      if ($262) {
       $263 = ($250*178)|0;
       $$pn = $263;
      } else {
       $264 = ($246*84)|0;
       $265 = (($264) + 5696)|0;
       $$pn = $265;
      }
      $c$5 = (($d$5) + 44032)|0;
      $266 = (($c$5) + ($$pn))|0;
      $267 = ($266>>>0)<(44032);
      if ($267) {
       $c$8 = $266;$l$2 = 2;
       label = 92;
       break L12;
      }
      $c$655 = $266;$d$656 = 44032;
      while(1) {
       $268 = (($c$655) - ($d$656))|0;
       $i1$054 = 0;$k$453 = 0;
       while(1) {
        $j2$052 = 0;$k$551 = $k$453;
        while(1) {
         $269 = ((106048 + (($i1$054*188)|0)|0) + ($j2$052<<1)|0);
         $270 = HEAP16[$269>>1]|0;
         $271 = $270&65535;
         $272 = (($271) - ($d$656))|0;
         $not$ = ($272>>>0)<=($268>>>0);
         $273 = $not$&1;
         $k$5$ = (($273) + ($k$551))|0;
         $274 = (($j2$052) + 1)|0;
         $exitcond = ($274|0)==(94);
         if ($exitcond) {
          $k$5$$lcssa = $k$5$;
          break;
         } else {
          $j2$052 = $274;$k$551 = $k$5$;
         }
        }
        $275 = (($i1$054) + 1)|0;
        $exitcond69 = ($275|0)==(93);
        if ($exitcond69) {
         $k$5$$lcssa$lcssa = $k$5$$lcssa;
         break;
        } else {
         $i1$054 = $275;$k$453 = $k$5$$lcssa;
        }
       }
       $276 = (($c$655) + 1)|0;
       $277 = (($k$5$$lcssa$lcssa) + ($c$655))|0;
       $278 = ($277>>>0)<($276>>>0);
       if ($278) {
        $$lcssa = $277;
        break;
       } else {
        $c$655 = $277;$d$656 = $276;
       }
      }
      $c$8 = $$lcssa;$l$2 = 2;
      label = 92;
      break L12;
      break;
     }
     case 218:  {
      $146 = ($50&255)<(161);
      if ($146) {
       $err$0$ph = 84;
       label = 119;
       break L10;
      }
      break;
     }
     case 224:  {
      $193 = ($54>>>0)<(2);
      if ($193) {
       label = 120;
       break L10;
      }
      $194 = (($51) + 1|0);
      $195 = HEAP8[$194>>0]|0;
      $196 = $195&255;
      $197 = (($196) + -64)|0;
      $198 = ($197>>>0)>(190);
      $199 = (($196) + -127)|0;
      $200 = ($199>>>0)<(34);
      $or$cond25 = $198 | $200;
      if ($or$cond25) {
       $err$0$ph = 84;
       label = 119;
       break L10;
      }
      $201 = ($197>>>0)>(62);
      $202 = (($196) + -98)|0;
      $$26 = $201 ? $202 : $197;
      $203 = (($52) + -161)|0;
      $204 = ($203>>>0)>(88);
      if (!($204)) {
       $234 = ((78096 + (($203*314)|0)|0) + ($$26<<1)|0);
       $235 = HEAP16[$234>>1]|0;
       $236 = $235&65535;
       $237 = ($203|0)==(39);
       if ($237) {
        $switch$tableidx = (($$26) + -58)|0;
        $238 = ($switch$tableidx>>>0)<(9);
        if ($238) {
         $switch$cast = $switch$tableidx&65535;
         $switch$cast$clear = $switch$cast & 511;
         $switch$downshift = (261&65535) >>> $switch$cast$clear;
         $switch$downshift$clear = $switch$downshift & 511;
         $switch$masked = $switch$downshift$clear&65535;
         $phitmp = $switch$masked << 17;
         $phitmp33 = $phitmp & 131072;
         $240 = $phitmp33;
        } else {
         $240 = 0;
        }
       } else {
        $240 = 0;
       }
       $239 = $240 | $236;
       $241 = ($239|0)==(0);
       if ($241) {
        $err$0$ph = 84;
        label = 119;
        break L10;
       } else {
        $c$8 = $239;$l$2 = 2;
        label = 92;
        break L12;
       }
      }
      $205 = (($52) + -135)|0;
      $206 = ($205>>>0)>(119);
      if ($206) {
       $err$0$ph = 84;
       label = 119;
       break L10;
      }
      $207 = ($50&255)<(161);
      $208 = (($52) + -224)|0;
      $c$4 = $207 ? $205 : $208;
      $209 = ($c$4*157)|0;
      $210 = (($$26) + ($209))|0;
      $211 = $210 >>> 4;
      $212 = (($211) + 4867)|0;
      $213 = (67712 + ($212<<1)|0);
      $214 = HEAP16[$213>>1]|0;
      $215 = $214&65535;
      $216 = $210 & 15;
      $217 = $215 >>> $216;
      $218 = (($217|0) % 2)&-1;
      $219 = $218 << 17;
      $220 = (67712 + ($210<<1)|0);
      $221 = HEAP16[$220>>1]|0;
      $222 = $221&65535;
      $223 = $222 | $219;
      $$mask = $223 & -65792;
      $224 = ($$mask|0)==(56320);
      if (!($224)) {
       $233 = ($223|0)==(0);
       if ($233) {
        $err$0$ph = 84;
        label = 119;
        break L10;
       } else {
        $c$8 = $223;$l$2 = 2;
        label = 92;
        break L12;
       }
      }
      if ($33) {
       $k$3 = 2;
      } else {
       $225 = HEAP8[$35>>0]|0;
       $226 = $225 << 24 >> 24;
       $k$3 = $226;
      }
      $227 = HEAP32[$outb>>2]|0;
      $228 = ($k$3>>>0)>($227>>>0);
      if ($228) {
       $err$0$ph = 7;
       label = 119;
       break L10;
      }
      $229 = $222 & 255;
      $230 = (78072 + ($229)|0);
      HEAP32[$0>>2] = $230;
      HEAP32[$1>>2] = 4;
      $231 = (_iconv($34,$0,$1,$out,$outb)|0);
      $232 = (($231) + ($x$064))|0;
      $l$3 = 2;$x$3 = $232;
      break L12;
      break;
     }
     case 216: case 217:  {
      break;
     }
     case 208:  {
      $130 = ($54>>>0)<(2);
      if ($130) {
       label = 120;
       break L10;
      }
      $131 = (($51) + 1|0);
      $132 = HEAP8[$131>>0]|0;
      $133 = $132&255;
      $134 = ($50<<24>>24)==(-114);
      if ($134) {
       $135 = (($133) + -161)|0;
       $136 = ($135>>>0)>(62);
       if ($136) {
        $err$0$ph = 84;
        label = 119;
        break L10;
       }
       $137 = (($133) + 65216)|0;
       $c$8 = $137;$l$2 = 2;
       label = 92;
       break L12;
      } else {
       $138 = (($52) + -161)|0;
       $139 = (($133) + -161)|0;
       $140 = ($138>>>0)>(83);
       $141 = ($139>>>0)>(93);
       $or$cond3 = $140 | $141;
       if ($or$cond3) {
        $err$0$ph = 84;
        label = 119;
        break L10;
       }
       $142 = ((4040 + (($138*188)|0)|0) + ($139<<1)|0);
       $143 = HEAP16[$142>>1]|0;
       $144 = $143&65535;
       $145 = ($143<<16>>16)==(0);
       if ($145) {
        $err$0$ph = 84;
        label = 119;
        break L10;
       } else {
        $c$8 = $144;$l$2 = 2;
        label = 92;
        break L12;
       }
      }
      break;
     }
     case 199:  {
      $err$0$ph = 84;
      label = 119;
      break L10;
      break;
     }
     case 209:  {
      $105 = (($52) + -161)|0;
      $106 = ($105>>>0)<(63);
      if ($106) {
       $107 = (($52) + 65216)|0;
       $c$8 = $107;$l$2 = 1;
       label = 92;
       break L12;
      }
      $108 = ($54>>>0)<(2);
      if ($108) {
       label = 120;
       break L10;
      }
      $109 = (($51) + 1|0);
      $110 = HEAP8[$109>>0]|0;
      $111 = $110&255;
      $112 = (($52) + -129)|0;
      $113 = ($112>>>0)<(31);
      if ($113) {
       $c$1 = $112;
      } else {
       $114 = $52 & 240;
       $115 = ($114|0)==(224);
       if (!($115)) {
        $err$0$ph = 84;
        label = 119;
        break L10;
       }
       $116 = (($52) + -193)|0;
       $c$1 = $116;
      }
      $117 = $c$1 << 1;
      $118 = (($111) + -64)|0;
      $119 = ($118>>>0)<(95);
      if ($119) {
       $120 = ($110<<24>>24)==(127);
       if ($120) {
        $err$0$ph = 84;
        label = 119;
        break L10;
       }
       $$lobit = ($110<<24>>24) >> 7;
       $121 = $$lobit << 24 >> 24;
       $122 = (($118) + ($121))|0;
       $c$2 = $117;$d$1 = $122;
      } else {
       $123 = (($111) + -159)|0;
       $124 = ($123>>>0)<(94);
       $125 = $124&1;
       $$19 = $117 | $125;
       $$20 = $124 ? $123 : $111;
       $c$2 = $$19;$d$1 = $$20;
      }
      $126 = ((4040 + (($c$2*188)|0)|0) + ($d$1<<1)|0);
      $127 = HEAP16[$126>>1]|0;
      $128 = $127&65535;
      $129 = ($127<<16>>16)==(0);
      if ($129) {
       $err$0$ph = 84;
       label = 119;
       break L10;
      } else {
       $c$8 = $128;$l$2 = 2;
       label = 92;
       break L12;
      }
      break;
     }
     case 195: case 192:  {
      $59 = ($54>>>0)<(4);
      if ($59) {
       label = 120;
       break L10;
      }
      $60 = (($51) + ($21)|0);
      $61 = HEAP8[$60>>0]|0;
      $62 = $61&255;
      $63 = $62 << 24;
      $64 = (($51) + ($22)|0);
      $65 = HEAP8[$64>>0]|0;
      $66 = $65&255;
      $67 = $66 << 16;
      $68 = $67 | $63;
      $69 = (($51) + ($23)|0);
      $70 = HEAP8[$69>>0]|0;
      $71 = $70&255;
      $72 = $71 << 8;
      $73 = $68 | $72;
      $74 = (($51) + ($24)|0);
      $75 = HEAP8[$74>>0]|0;
      $76 = $75&255;
      $77 = $73 | $76;
      $c$0 = $77;
      label = 14;
      break;
     }
     case 198:  {
      $57 = ($54>>>0)<(4);
      if ($57) {
       label = 120;
       break L10;
      }
      $58 = HEAP32[$51>>2]|0;
      $c$0 = $58;
      label = 14;
      break;
     }
     case 200:  {
      $55 = (_mbrtowc($wc,$51,$54,$st)|0);
      if ((($55|0) == -1)) {
       $err$0$ph = 84;
       label = 119;
       break L10;
      } else if ((($55|0) == -2)) {
       label = 120;
       break L10;
      } else if ((($55|0) == 0)) {
       $l$0 = 1;
      } else {
       $l$0 = $55;
      }
      $56 = HEAP32[$wc>>2]|0;
      $c$8 = $56;$l$2 = $l$0;
      label = 92;
      break L12;
      break;
     }
     case 193: case 194: case 197: case 196:  {
      $81 = ($54>>>0)<(2);
      if ($81) {
       label = 120;
       break L10;
      }
      $82 = (($51) + ($25)|0);
      $83 = HEAP8[$82>>0]|0;
      $84 = $83&255;
      $85 = $84 << 8;
      $86 = (($51) + ($26)|0);
      $87 = HEAP8[$86>>0]|0;
      $88 = $87&255;
      $89 = $85 | $88;
      $90 = $85 & 64512;
      if ((($90|0) == 56320)) {
       $err$0$ph = 84;
       label = 119;
       break L10;
      } else if (!((($90|0) == 55296))) {
       $c$8 = $89;$l$2 = 2;
       label = 92;
       break L12;
      }
      if ($28) {
       $err$0$ph = 84;
       label = 119;
       break L10;
      }
      $91 = ($54>>>0)<(4);
      if ($91) {
       label = 120;
       break L10;
      }
      $92 = (($51) + ($$sum3536)|0);
      $93 = HEAP8[$92>>0]|0;
      $94 = $93&255;
      $95 = $94 << 8;
      $96 = (($51) + ($$sum3738)|0);
      $97 = HEAP8[$96>>0]|0;
      $98 = $97&255;
      $99 = $95 | $98;
      $100 = (($99) + -56320)|0;
      $101 = ($100>>>0)>(1023);
      if ($101) {
       $err$0$ph = 84;
       label = 119;
       break L10;
      }
      $102 = $89 << 10;
      $103 = (($102) + -56557568)|0;
      $104 = (($103) + ($100))|0;
      $c$8 = $104;$l$2 = 4;
      label = 92;
      break L12;
      break;
     }
     default: {
      $283 = ($52>>>0)<($19>>>0);
      if ($283) {
       $c$8 = $52;$l$2 = 1;
       label = 92;
       break L12;
      }
      $284 = (($52) - ($19))|0;
      $285 = ($284*5)|0;
      $286 = $285 >>> 2;
      $$sum17 = (($286) + ($$sum))|0;
      $287 = (8 + ($$sum17)|0);
      $288 = HEAP8[$287>>0]|0;
      $289 = $288&255;
      $290 = $284 << 1;
      $291 = $290 & 6;
      $292 = $289 >>> $291;
      $$sum18 = (($20) + ($286))|0;
      $293 = (8 + ($$sum18)|0);
      $294 = HEAP8[$293>>0]|0;
      $295 = $294&255;
      $296 = (8 - ($291))|0;
      $297 = $295 << $296;
      $298 = $297 & 1023;
      $299 = $298 | $292;
      $300 = (123536 + ($299<<1)|0);
      $301 = HEAP16[$300>>1]|0;
      $302 = $301&65535;
      $303 = ($299|0)==(0);
      $$ = $303 ? $52 : $302;
      $304 = ($$|0)==(1);
      if ($304) {
       $err$0$ph = 84;
       label = 119;
       break L10;
      } else {
       $c$8 = $$;$l$2 = 1;
       label = 92;
       break L12;
      }
     }
     }
    } while(0);
    if ((label|0) == 14) {
     label = 0;
     $78 = $c$0 & -2048;
     $79 = ($78|0)==(55296);
     $80 = ($c$0>>>0)>(1114111);
     $or$cond = $79 | $80;
     if ($or$cond) {
      $err$0$ph = 84;
      label = 119;
      break L10;
     } else {
      $c$8 = $c$0;$l$2 = 4;
      label = 92;
      break;
     }
    }
    $147 = (($52) + -129)|0;
    $148 = ($147>>>0)>(125);
    if ($148) {
     $err$0$ph = 84;
     label = 119;
     break L10;
    }
    $149 = ($54>>>0)<(2);
    if ($149) {
     label = 120;
     break L10;
    }
    $150 = (($51) + 1|0);
    $151 = HEAP8[$150>>0]|0;
    $152 = $151&255;
    $153 = ($151&255)<(161);
    $or$cond21 = $153 & $29;
    if ($or$cond21) {
     $err$0$ph = 84;
     label = 119;
     break L10;
    }
    $154 = (($152) + -64)|0;
    $155 = ($154>>>0)>(190);
    $156 = ($151<<24>>24)==(127);
    $or$cond5 = $155 | $156;
    if (!($or$cond5)) {
     $188 = ($154>>>0)>(63);
     $189 = (($152) + -65)|0;
     $$23 = $188 ? $189 : $154;
     $190 = ((19832 + (($147*380)|0)|0) + ($$23<<1)|0);
     $191 = HEAP16[$190>>1]|0;
     $192 = $191&65535;
     $c$8 = $192;$l$2 = 2;
     label = 92;
     break;
    }
    $157 = (($152) + -48)|0;
    $158 = ($157>>>0)<(10);
    $or$cond22 = $158 & $30;
    if (!($or$cond22)) {
     $err$0$ph = 84;
     label = 119;
     break L10;
    }
    $159 = ($54>>>0)<(4);
    if ($159) {
     label = 120;
     break L10;
    }
    $160 = (($51) + 2|0);
    $161 = HEAP8[$160>>0]|0;
    $162 = $161&255;
    $163 = (($162) + -129)|0;
    $164 = ($163>>>0)>(126);
    if ($164) {
     $err$0$ph = 84;
     label = 119;
     break L10;
    }
    $165 = (($51) + 3|0);
    $166 = HEAP8[$165>>0]|0;
    $167 = $166&255;
    $168 = (($167) + -48)|0;
    $169 = ($168>>>0)>(9);
    if ($169) {
     $err$0$ph = 84;
     label = 119;
     break L10;
    }
    $170 = ($147*10)|0;
    $171 = (($152) + ($170))|0;
    $172 = ($171*1260)|0;
    $173 = ($163*10)|0;
    $174 = (($172) + -60352)|0;
    $175 = (($174) + ($173))|0;
    $176 = (($175) + ($168))|0;
    $c$361 = $176;$d$262 = 0;
    while(1) {
     $177 = (($c$361) - ($d$262))|0;
     $i$060 = 0;$k$059 = 0;
     while(1) {
      $j$058 = 0;$k$157 = $k$059;
      while(1) {
       $178 = ((19832 + (($i$060*380)|0)|0) + ($j$058<<1)|0);
       $179 = HEAP16[$178>>1]|0;
       $180 = $179&65535;
       $181 = (($180) - ($d$262))|0;
       $not$34 = ($181>>>0)<=($177>>>0);
       $182 = $not$34&1;
       $k$1$ = (($182) + ($k$157))|0;
       $183 = (($j$058) + 1)|0;
       $exitcond70 = ($183|0)==(190);
       if ($exitcond70) {
        $k$1$$lcssa = $k$1$;
        break;
       } else {
        $j$058 = $183;$k$157 = $k$1$;
       }
      }
      $184 = (($i$060) + 1)|0;
      $exitcond71 = ($184|0)==(126);
      if ($exitcond71) {
       $k$1$$lcssa$lcssa = $k$1$$lcssa;
       break;
      } else {
       $i$060 = $184;$k$059 = $k$1$$lcssa;
      }
     }
     $185 = (($c$361) + 1)|0;
     $186 = (($k$1$$lcssa$lcssa) + ($c$361))|0;
     $187 = ($186>>>0)<($185>>>0);
     if ($187) {
      $$lcssa74 = $186;
      break;
     } else {
      $c$361 = $186;$d$262 = $185;
     }
    }
    $c$8 = $$lcssa74;$l$2 = 4;
    label = 92;
   } else {
    $c$8 = $52;$l$2 = 1;
    label = 92;
   }
  } while(0);
  L121: do {
   if ((label|0) == 92) {
    label = 0;
    switch ($31|0) {
    case 198:  {
     $305 = HEAP32[$outb>>2]|0;
     $306 = ($305>>>0)<(4);
     if ($306) {
      $err$0$ph = 7;
      label = 119;
      break L10;
     }
     $307 = HEAP32[$out>>2]|0;
     HEAP32[$307>>2] = $c$8;
     $308 = (($307) + 4|0);
     HEAP32[$out>>2] = $308;
     $309 = HEAP32[$outb>>2]|0;
     $310 = (($309) + -4)|0;
     HEAP32[$outb>>2] = $310;
     $l$3 = $l$2;$x$3 = $x$064;
     break L121;
     break;
    }
    case 200:  {
     $311 = HEAP32[$outb>>2]|0;
     $312 = ($311>>>0)<(4);
     if ($312) {
      $313 = (_wctomb($tmp,$c$8)|0);
      $314 = HEAP32[$outb>>2]|0;
      $315 = ($314>>>0)<($313>>>0);
      if ($315) {
       $err$0$ph = 7;
       label = 119;
       break L10;
      }
      $316 = HEAP32[$out>>2]|0;
      _memcpy(($316|0),($tmp|0),($313|0))|0;
      $320 = $316;$k$7 = $313;
     } else {
      $317 = HEAP32[$out>>2]|0;
      $318 = (_wctomb($317,$c$8)|0);
      $320 = $317;$k$7 = $318;
     }
     $319 = (($320) + ($k$7)|0);
     HEAP32[$out>>2] = $319;
     $321 = HEAP32[$outb>>2]|0;
     $322 = (($321) - ($k$7))|0;
     HEAP32[$outb>>2] = $322;
     $l$3 = $l$2;$x$3 = $x$064;
     break L121;
     break;
    }
    case 193: case 194: case 197: case 196:  {
     $355 = ($c$8>>>0)<(65536);
     $or$cond28 = $355 | $41;
     if ($or$cond28) {
      $356 = ($c$8>>>0)>(65535);
      $$c$8 = $356 ? 65533 : $c$8;
      $357 = HEAP32[$outb>>2]|0;
      $358 = ($357>>>0)<(2);
      if ($358) {
       $err$0$ph = 7;
       label = 119;
       break L10;
      }
      $359 = HEAP32[$out>>2]|0;
      $360 = $$c$8 >>> 8;
      $361 = $360&255;
      $362 = (($359) + ($42)|0);
      HEAP8[$362>>0] = $361;
      $363 = $$c$8&255;
      $364 = (($359) + ($43)|0);
      HEAP8[$364>>0] = $363;
      $365 = (($359) + 2|0);
      HEAP32[$out>>2] = $365;
      $366 = HEAP32[$outb>>2]|0;
      $367 = (($366) + -2)|0;
      HEAP32[$outb>>2] = $367;
      $l$3 = $l$2;$x$3 = $x$064;
      break L121;
     } else {
      $368 = HEAP32[$outb>>2]|0;
      $369 = ($368>>>0)<(4);
      if ($369) {
       $err$0$ph = 7;
       label = 119;
       break L10;
      }
      $370 = (($c$8) + -65536)|0;
      $371 = HEAP32[$out>>2]|0;
      $372 = $370 >>> 10;
      $373 = $370 >>> 18;
      $374 = $373 | 216;
      $375 = $374&255;
      $376 = (($371) + ($42)|0);
      HEAP8[$376>>0] = $375;
      $377 = $372&255;
      $378 = (($371) + ($43)|0);
      HEAP8[$378>>0] = $377;
      $379 = $370 >>> 8;
      $380 = $379 & 3;
      $381 = $380 | 220;
      $382 = $381&255;
      $383 = (($371) + ($$sum2930)|0);
      HEAP8[$383>>0] = $382;
      $384 = $370&255;
      $385 = (($371) + ($$sum3132)|0);
      HEAP8[$385>>0] = $384;
      $386 = (($371) + 4|0);
      HEAP32[$out>>2] = $386;
      $387 = HEAP32[$outb>>2]|0;
      $388 = (($387) + -4)|0;
      HEAP32[$outb>>2] = $388;
      $l$3 = $l$2;$x$3 = $x$064;
      break L121;
     }
     break;
    }
    case 195: case 192:  {
     $389 = HEAP32[$outb>>2]|0;
     $390 = ($389>>>0)<(4);
     if ($390) {
      $err$0$ph = 7;
      label = 119;
      break L10;
     }
     $391 = HEAP32[$out>>2]|0;
     $392 = $c$8 >>> 24;
     $393 = $392&255;
     $394 = (($391) + ($44)|0);
     HEAP8[$394>>0] = $393;
     $395 = $c$8 >>> 16;
     $396 = $395&255;
     $397 = (($391) + ($45)|0);
     HEAP8[$397>>0] = $396;
     $398 = $c$8 >>> 8;
     $399 = $398&255;
     $400 = (($391) + ($46)|0);
     HEAP8[$400>>0] = $399;
     $401 = $c$8&255;
     $402 = (($391) + ($47)|0);
     HEAP8[$402>>0] = $401;
     $403 = (($391) + 4|0);
     HEAP32[$out>>2] = $403;
     $404 = HEAP32[$outb>>2]|0;
     $405 = (($404) + -4)|0;
     HEAP32[$outb>>2] = $405;
     $l$3 = $l$2;$x$3 = $x$064;
     break L121;
     break;
    }
    case 199:  {
     $323 = ($c$8>>>0)>(127);
     if ($323) {
      $x$1 = $x$064;
      label = 102;
     } else {
      $c$9 = $c$8;$x$2 = $x$064;
     }
     break;
    }
    default: {
     $c$9 = $c$8;$x$2 = $x$064;
    }
    }
    L141: while(1) {
     if ((label|0) == 102) {
      label = 0;
      $324 = (($x$1) + 1)|0;
      $c$9 = 42;$x$2 = $324;
     }
     $325 = HEAP32[$outb>>2]|0;
     $326 = ($325|0)==(0);
     if ($326) {
      $err$0$ph = 7;
      label = 119;
      break L10;
     }
     $327 = ($c$9>>>0)<($36>>>0);
     if ($327) {
      $c$10 = $c$9;
      break;
     }
     if ($38) {
      $x$1 = $x$2;
      label = 102;
      continue;
     }
     $c$1163 = 0;
     while(1) {
      $335 = ($c$1163*5)|0;
      $336 = $335 >>> 2;
      $$sum15 = (($336) + ($$sum12))|0;
      $337 = (8 + ($$sum15)|0);
      $338 = HEAP8[$337>>0]|0;
      $339 = $338&255;
      $340 = $c$1163 << 1;
      $341 = $340 & 6;
      $342 = $339 >>> $341;
      $$sum16 = (($39) + ($336))|0;
      $343 = (8 + ($$sum16)|0);
      $344 = HEAP8[$343>>0]|0;
      $345 = $344&255;
      $346 = (8 - ($341))|0;
      $347 = $345 << $346;
      $348 = $347 & 1023;
      $349 = $348 | $342;
      $350 = (123536 + ($349<<1)|0);
      $351 = HEAP16[$350>>1]|0;
      $352 = $351&65535;
      $353 = ($c$9|0)==($352|0);
      $333 = (($c$1163) + 1)|0;
      if ($353) {
       $c$1163$lcssa = $c$1163;
       label = 110;
       break L141;
      }
      $334 = ($333>>>0)<($37>>>0);
      if ($334) {
       $c$1163 = $333;
      } else {
       break;
      }
     }
     $x$1 = $x$2;
     label = 102;
    }
    if ((label|0) == 110) {
     label = 0;
     $354 = (($c$1163$lcssa) + 128)|0;
     $c$10 = $354;
    }
    $328 = $c$10&255;
    $329 = HEAP32[$out>>2]|0;
    $330 = (($329) + 1|0);
    HEAP32[$out>>2] = $330;
    HEAP8[$329>>0] = $328;
    $331 = HEAP32[$outb>>2]|0;
    $332 = (($331) + -1)|0;
    HEAP32[$outb>>2] = $332;
    $l$3 = $l$2;$x$3 = $x$2;
   }
  } while(0);
  $406 = HEAP32[$in>>2]|0;
  $407 = (($406) + ($l$3)|0);
  HEAP32[$in>>2] = $407;
  $408 = (($54) - ($l$3))|0;
  HEAP32[$inb>>2] = $408;
  $409 = ($54|0)==($l$3|0);
  if ($409) {
   $x$3$lcssa = $x$3;
   label = 122;
   break;
  } else {
   $51 = $407;$54 = $408;$x$064 = $x$3;
  }
 }
 if ((label|0) == 119) {
  $err$0 = $err$0$ph;
 }
 else if ((label|0) == 120) {
  $err$0 = 22;
 }
 else if ((label|0) == 122) {
  $$0 = $x$3$lcssa;
  STACKTOP = sp;return ($$0|0);
 }
 $410 = (___errno_location()|0);
 HEAP32[$410>>2] = $err$0;
 $$0 = -1;
 STACKTOP = sp;return ($$0|0);
}
function _mbrtowc($wc,$src,$n,$st) {
 $wc = $wc|0;
 $src = $src|0;
 $n = $n|0;
 $st = $st|0;
 var $$0 = 0, $$02 = 0, $$1 = 0, $$lcssa = 0, $$lcssa14 = 0, $$lcssa16 = 0, $$st = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0;
 var $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0;
 var $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $c$0 = 0, $c$1 = 0, $c$2 = 0, $s$0 = 0, $s$1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $0 = sp;
 HEAP32[$0>>2] = $wc;
 $1 = ($st|0)==(0|0);
 $$st = $1 ? 124992 : $st;
 $2 = HEAP32[$$st>>2]|0;
 $3 = ($src|0)==(0|0);
 L1: do {
  if ($3) {
   $4 = ($2|0)==(0);
   if ($4) {
    $$0 = 0;
    STACKTOP = sp;return ($$0|0);
   }
  } else {
   $5 = ($wc|0)==(0|0);
   if ($5) {
    HEAP32[$0>>2] = $0;
    $11 = $0;
   } else {
    $11 = $wc;
   }
   $6 = ($n|0)==(0);
   if ($6) {
    $$0 = -2;
    STACKTOP = sp;return ($$0|0);
   }
   $7 = ($2|0)==(0);
   do {
    if ($7) {
     $8 = HEAP8[$src>>0]|0;
     $9 = $8&255;
     $10 = ($8<<24>>24)>(-1);
     if ($10) {
      HEAP32[$11>>2] = $9;
      $12 = ($8<<24>>24)!=(0);
      $13 = $12&1;
      $$0 = $13;
      STACKTOP = sp;return ($$0|0);
     } else {
      $14 = (($9) + -194)|0;
      $15 = ($14>>>0)>(50);
      if ($15) {
       break L1;
      }
      $16 = (($src) + 1|0);
      $17 = (124784 + ($14<<2)|0);
      $18 = HEAP32[$17>>2]|0;
      $19 = (($n) + -1)|0;
      $$02 = $19;$c$0 = $18;$s$0 = $16;
      break;
     }
    } else {
     $$02 = $n;$c$0 = $2;$s$0 = $src;
    }
   } while(0);
   $20 = ($$02|0)==(0);
   do {
    if ($20) {
     $c$2 = $c$0;
    } else {
     $21 = HEAP8[$s$0>>0]|0;
     $22 = $21&255;
     $23 = $22 >>> 3;
     $24 = (($23) + -16)|0;
     $25 = $c$0 >> 26;
     $26 = (($23) + ($25))|0;
     $27 = $24 | $26;
     $28 = ($27>>>0)>(7);
     if ($28) {
      break L1;
     }
     $$1 = $$02;$32 = $21;$c$1 = $c$0;$s$1 = $s$0;
     while(1) {
      $29 = $c$1 << 6;
      $30 = (($s$1) + 1|0);
      $31 = $32&255;
      $33 = (($31) + -128)|0;
      $34 = $33 | $29;
      $35 = (($$1) + -1)|0;
      $36 = ($34|0)<(0);
      if (!($36)) {
       $$lcssa = $34;$$lcssa16 = $35;
       label = 15;
       break;
      }
      $38 = ($35|0)==(0);
      if ($38) {
       $$lcssa14 = $34;
       label = 18;
       break;
      }
      $39 = HEAP8[$30>>0]|0;
      $40 = $39 & -64;
      $41 = ($40<<24>>24)==(-128);
      if ($41) {
       $$1 = $35;$32 = $39;$c$1 = $34;$s$1 = $30;
      } else {
       label = 20;
       break;
      }
     }
     if ((label|0) == 15) {
      HEAP32[$$st>>2] = 0;
      HEAP32[$11>>2] = $$lcssa;
      $37 = (($n) - ($$lcssa16))|0;
      $$0 = $37;
      STACKTOP = sp;return ($$0|0);
     }
     else if ((label|0) == 18) {
      $c$2 = $$lcssa14;
      break;
     }
     else if ((label|0) == 20) {
      break L1;
     }
    }
   } while(0);
   HEAP32[$$st>>2] = $c$2;
   $$0 = -2;
   STACKTOP = sp;return ($$0|0);
  }
 } while(0);
 HEAP32[$$st>>2] = 0;
 $42 = (___errno_location()|0);
 HEAP32[$42>>2] = 84;
 $$0 = -1;
 STACKTOP = sp;return ($$0|0);
}
function _find_charmap($name) {
 $name = $name|0;
 var $$0 = 0, $$0$lcssa$i$ph = 0, $$0111$i = 0, $$012$i = 0, $$1$lcssa$i = 0, $$1$lcssa$i$ph = 0, $$18$i = 0, $$lcssa = 0, $$ph = 0, $$ph3 = 0, $$pre = 0, $$sum = 0, $$sum$us = 0, $$sum1 = 0, $$sum1$us = 0, $$sum2 = 0, $$sum2$us = 0, $0 = 0, $1 = 0, $10 = 0;
 var $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0;
 var $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0;
 var $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0;
 var $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $8 = 0, $9 = 0, $or$cond$i = 0, $phitmp = 0, $s$0$be = 0, $s$0$be$us = 0, $s$06 = 0, $s$06$lcssa = 0, $s$06$us = 0, $s$06$us$lcssa = 0, $s$1$lcssa = 0, $s$15 = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 $0 = HEAP8[$name>>0]|0;
 $1 = ($0<<24>>24)==(0);
 do {
  if ($1) {
   $s$06$us = 8;
   while(1) {
    $2 = HEAP8[$s$06$us>>0]|0;
    $3 = ($2<<24>>24)==(0);
    if ($3) {
     $s$06$us$lcssa = $s$06$us;
     label = 23;
     break;
    }
    $4 = (_strlen(($s$06$us|0))|0);
    $5 = (($4) + 1)|0;
    $6 = (($s$06$us) + ($5)|0);
    $7 = HEAP8[$6>>0]|0;
    $8 = ($7<<24>>24)==(0);
    do {
     if ($8) {
      $$sum$us = (($4) + 2)|0;
      $9 = (($s$06$us) + ($$sum$us)|0);
      $10 = HEAP8[$9>>0]|0;
      $11 = ($10&255)>(128);
      if ($11) {
       $$sum2$us = (($4) + 3)|0;
       $18 = (($s$06$us) + ($$sum2$us)|0);
       $s$0$be$us = $18;
       break;
      } else {
       $12 = $10&255;
       $13 = (128 - ($12))|0;
       $14 = $13 >>> 2;
       $15 = ($14*5)|0;
       $16 = (($4) + 3)|0;
       $$sum1$us = (($16) + ($15))|0;
       $17 = (($s$06$us) + ($$sum1$us)|0);
       $s$0$be$us = $17;
       break;
      }
     } else {
      $s$0$be$us = $6;
     }
    } while(0);
    $19 = HEAP8[$s$0$be$us>>0]|0;
    $20 = ($19<<24>>24)==(0);
    if ($20) {
     break;
    } else {
     $s$06$us = $s$0$be$us;
    }
   }
   if ((label|0) == 23) {
    $s$1$lcssa = $s$06$us$lcssa;
    break;
   }
   $$0 = -1;
   return ($$0|0);
  } else {
   $s$06 = 8;
   while(1) {
    $$0111$i = $name;$$012$i = $s$06;$23 = $0;
    while(1) {
     $21 = HEAP8[$$012$i>>0]|0;
     $22 = ($21<<24>>24)==(0);
     if ($22) {
      $$0$lcssa$i$ph = $$012$i;$$ph3 = $23;
      label = 19;
      break;
     }
     $24 = ($23<<24>>24)==(0);
     if ($24) {
      $$1$lcssa$i = $$0111$i;$37 = 0;
     } else {
      $25 = $23&255;
      $$18$i = $$0111$i;$31 = $25;$72 = $23;
      while(1) {
       $30 = $31 | 32;
       $32 = (($30) + -97)|0;
       $33 = ($32>>>0)>(26);
       $34 = (($31) + -48)|0;
       $35 = ($34>>>0)>(10);
       $or$cond$i = $33 & $35;
       $27 = (($$18$i) + 1|0);
       if (!($or$cond$i)) {
        $$1$lcssa$i$ph = $$18$i;$$ph = $72;
        break;
       }
       $26 = HEAP8[$27>>0]|0;
       $28 = $26&255;
       $29 = ($26<<24>>24)==(0);
       if ($29) {
        $$1$lcssa$i$ph = $27;$$ph = 0;
        break;
       } else {
        $$18$i = $27;$31 = $28;$72 = $26;
       }
      }
      $$1$lcssa$i = $$1$lcssa$i$ph;$37 = $$ph;
     }
     $36 = $37&255;
     $38 = $36 | 32;
     $39 = $21&255;
     $40 = ($38|0)==($39|0);
     if (!($40)) {
      label = 26;
      break;
     }
     $41 = (($$1$lcssa$i) + 1|0);
     $42 = (($$012$i) + 1|0);
     $43 = HEAP8[$41>>0]|0;
     $44 = ($43<<24>>24)==(0);
     if ($44) {
      $$0$lcssa$i$ph = $42;$$ph3 = 0;
      label = 19;
      break;
     } else {
      $$0111$i = $41;$$012$i = $42;$23 = $43;
     }
    }
    if ((label|0) == 19) {
     label = 0;
     $45 = HEAP8[$$0$lcssa$i$ph>>0]|0;
     $46 = ($$ph3<<24>>24)==($45<<24>>24);
     if ($46) {
      $s$06$lcssa = $s$06;
      break;
     }
    }
    else if ((label|0) == 26) {
     label = 0;
    }
    $55 = (_strlen(($s$06|0))|0);
    $56 = (($55) + 1)|0;
    $57 = (($s$06) + ($56)|0);
    $58 = HEAP8[$57>>0]|0;
    $59 = ($58<<24>>24)==(0);
    do {
     if ($59) {
      $$sum = (($55) + 2)|0;
      $60 = (($s$06) + ($$sum)|0);
      $61 = HEAP8[$60>>0]|0;
      $62 = ($61&255)>(128);
      if ($62) {
       $$sum2 = (($55) + 3)|0;
       $63 = (($s$06) + ($$sum2)|0);
       $s$0$be = $63;
       break;
      } else {
       $66 = $61&255;
       $67 = (128 - ($66))|0;
       $68 = $67 >>> 2;
       $69 = ($68*5)|0;
       $70 = (($55) + 3)|0;
       $$sum1 = (($70) + ($69))|0;
       $71 = (($s$06) + ($$sum1)|0);
       $s$0$be = $71;
       break;
      }
     } else {
      $s$0$be = $57;
     }
    } while(0);
    $64 = HEAP8[$s$0$be>>0]|0;
    $65 = ($64<<24>>24)==(0);
    if ($65) {
     label = 33;
     break;
    } else {
     $s$06 = $s$0$be;
    }
   }
   if ((label|0) == 33) {
    $$0 = -1;
    return ($$0|0);
   }
   $$pre = HEAP8[$s$06$lcssa>>0]|0;
   $phitmp = ($$pre<<24>>24)==(0);
   if ($phitmp) {
    $s$1$lcssa = $s$06$lcssa;
   } else {
    $s$15 = $s$06$lcssa;
    while(1) {
     $47 = (_strlen(($s$15|0))|0);
     $48 = (($47) + 1)|0;
     $49 = (($s$15) + ($48)|0);
     $50 = HEAP8[$49>>0]|0;
     $51 = ($50<<24>>24)==(0);
     if ($51) {
      $$lcssa = $49;
      break;
     } else {
      $s$15 = $49;
     }
    }
    $s$1$lcssa = $$lcssa;
   }
  }
 } while(0);
 $52 = (($s$1$lcssa) + 1|0);
 $53 = $52;
 $54 = (($53) - (8))|0;
 $$0 = $54;
 return ($$0|0);
}
function _malloc($bytes) {
 $bytes = $bytes|0;
 var $$lcssa = 0, $$lcssa110 = 0, $$lcssa112 = 0, $$lcssa115 = 0, $$lcssa116 = 0, $$lcssa117 = 0, $$lcssa118 = 0, $$lcssa120 = 0, $$lcssa123 = 0, $$lcssa125 = 0, $$lcssa127 = 0, $$lcssa130 = 0, $$lcssa132 = 0, $$lcssa134 = 0, $$lcssa137 = 0, $$pre = 0, $$pre$i = 0, $$pre$i$i = 0, $$pre$i23$i = 0, $$pre$i25 = 0;
 var $$pre$phi$i$iZ2D = 0, $$pre$phi$i24$iZ2D = 0, $$pre$phi$i26Z2D = 0, $$pre$phi$iZ2D = 0, $$pre$phi59$i$iZ2D = 0, $$pre$phiZ2D = 0, $$pre105 = 0, $$pre58$i$i = 0, $$rsize$0$i = 0, $$rsize$3$i = 0, $$rsize$3$i$lcssa = 0, $$sum = 0, $$sum$i$i = 0, $$sum$i$i$i = 0, $$sum$i12$i = 0, $$sum$i13$i = 0, $$sum$i16$i = 0, $$sum$i19$i = 0, $$sum$i2338 = 0, $$sum$i32 = 0;
 var $$sum$i39 = 0, $$sum1 = 0, $$sum1$i = 0, $$sum1$i$i = 0, $$sum1$i14$i = 0, $$sum1$i20$i = 0, $$sum1$i24 = 0, $$sum10 = 0, $$sum10$i = 0, $$sum10$i$i = 0, $$sum10$pre$i$i = 0, $$sum102$i = 0, $$sum103$i = 0, $$sum104$i = 0, $$sum105$i = 0, $$sum106$i = 0, $$sum107$i = 0, $$sum108$i = 0, $$sum109$i = 0, $$sum11$i = 0;
 var $$sum11$i$i = 0, $$sum11$i22$i = 0, $$sum110$i = 0, $$sum111$i = 0, $$sum1112 = 0, $$sum112$i = 0, $$sum113$i = 0, $$sum114$i = 0, $$sum115$i = 0, $$sum12$i = 0, $$sum12$i$i = 0, $$sum13$i = 0, $$sum13$i$i = 0, $$sum14$i$i = 0, $$sum14$pre$i = 0, $$sum15$i = 0, $$sum15$i$i = 0, $$sum16$i = 0, $$sum16$i$i = 0, $$sum17$i = 0;
 var $$sum17$i$i = 0, $$sum18$i = 0, $$sum1819$i$i = 0, $$sum2 = 0, $$sum2$i = 0, $$sum2$i$i = 0, $$sum2$i$i$i = 0, $$sum2$i15$i = 0, $$sum2$i17$i = 0, $$sum2$i21$i = 0, $$sum2$pre$i = 0, $$sum20$i$i = 0, $$sum21$i$i = 0, $$sum22$i$i = 0, $$sum23$i$i = 0, $$sum24$i$i = 0, $$sum25$i$i = 0, $$sum26$pre$i$i = 0, $$sum27$i$i = 0, $$sum28$i$i = 0;
 var $$sum29$i$i = 0, $$sum3$i = 0, $$sum3$i$i = 0, $$sum3$i27 = 0, $$sum30$i$i = 0, $$sum3132$i$i = 0, $$sum34$i$i = 0, $$sum3536$i$i = 0, $$sum3738$i$i = 0, $$sum39$i$i = 0, $$sum4 = 0, $$sum4$i = 0, $$sum4$i28 = 0, $$sum40$i$i = 0, $$sum41$i$i = 0, $$sum42$i$i = 0, $$sum5$i = 0, $$sum5$i$i = 0, $$sum56 = 0, $$sum6$i = 0;
 var $$sum67$i$i = 0, $$sum7$i = 0, $$sum8$i = 0, $$sum8$pre = 0, $$sum9 = 0, $$sum9$i = 0, $$sum9$i$i = 0, $$tsize$1$i = 0, $$v$0$i = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $1000 = 0, $1001 = 0, $1002 = 0, $1003 = 0, $1004 = 0, $1005 = 0, $1006 = 0;
 var $1007 = 0, $1008 = 0, $1009 = 0, $101 = 0, $1010 = 0, $1011 = 0, $1012 = 0, $1013 = 0, $1014 = 0, $1015 = 0, $1016 = 0, $1017 = 0, $1018 = 0, $1019 = 0, $102 = 0, $1020 = 0, $1021 = 0, $1022 = 0, $1023 = 0, $1024 = 0;
 var $1025 = 0, $1026 = 0, $1027 = 0, $1028 = 0, $1029 = 0, $103 = 0, $1030 = 0, $1031 = 0, $1032 = 0, $1033 = 0, $1034 = 0, $1035 = 0, $1036 = 0, $1037 = 0, $1038 = 0, $1039 = 0, $104 = 0, $1040 = 0, $1041 = 0, $1042 = 0;
 var $1043 = 0, $1044 = 0, $1045 = 0, $1046 = 0, $1047 = 0, $1048 = 0, $1049 = 0, $105 = 0, $1050 = 0, $1051 = 0, $1052 = 0, $1053 = 0, $1054 = 0, $1055 = 0, $1056 = 0, $1057 = 0, $1058 = 0, $1059 = 0, $106 = 0, $1060 = 0;
 var $1061 = 0, $1062 = 0, $1063 = 0, $1064 = 0, $1065 = 0, $1066 = 0, $1067 = 0, $1068 = 0, $1069 = 0, $107 = 0, $1070 = 0, $1071 = 0, $1072 = 0, $1073 = 0, $1074 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0;
 var $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0;
 var $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0;
 var $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0;
 var $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0;
 var $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0;
 var $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0;
 var $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0, $226 = 0, $227 = 0, $228 = 0, $229 = 0, $23 = 0, $230 = 0, $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0;
 var $239 = 0, $24 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0, $244 = 0, $245 = 0, $246 = 0, $247 = 0, $248 = 0, $249 = 0, $25 = 0, $250 = 0, $251 = 0, $252 = 0, $253 = 0, $254 = 0, $255 = 0, $256 = 0;
 var $257 = 0, $258 = 0, $259 = 0, $26 = 0, $260 = 0, $261 = 0, $262 = 0, $263 = 0, $264 = 0, $265 = 0, $266 = 0, $267 = 0, $268 = 0, $269 = 0, $27 = 0, $270 = 0, $271 = 0, $272 = 0, $273 = 0, $274 = 0;
 var $275 = 0, $276 = 0, $277 = 0, $278 = 0, $279 = 0, $28 = 0, $280 = 0, $281 = 0, $282 = 0, $283 = 0, $284 = 0, $285 = 0, $286 = 0, $287 = 0, $288 = 0, $289 = 0, $29 = 0, $290 = 0, $291 = 0, $292 = 0;
 var $293 = 0, $294 = 0, $295 = 0, $296 = 0, $297 = 0, $298 = 0, $299 = 0, $3 = 0, $30 = 0, $300 = 0, $301 = 0, $302 = 0, $303 = 0, $304 = 0, $305 = 0, $306 = 0, $307 = 0, $308 = 0, $309 = 0, $31 = 0;
 var $310 = 0, $311 = 0, $312 = 0, $313 = 0, $314 = 0, $315 = 0, $316 = 0, $317 = 0, $318 = 0, $319 = 0, $32 = 0, $320 = 0, $321 = 0, $322 = 0, $323 = 0, $324 = 0, $325 = 0, $326 = 0, $327 = 0, $328 = 0;
 var $329 = 0, $33 = 0, $330 = 0, $331 = 0, $332 = 0, $333 = 0, $334 = 0, $335 = 0, $336 = 0, $337 = 0, $338 = 0, $339 = 0, $34 = 0, $340 = 0, $341 = 0, $342 = 0, $343 = 0, $344 = 0, $345 = 0, $346 = 0;
 var $347 = 0, $348 = 0, $349 = 0, $35 = 0, $350 = 0, $351 = 0, $352 = 0, $353 = 0, $354 = 0, $355 = 0, $356 = 0, $357 = 0, $358 = 0, $359 = 0, $36 = 0, $360 = 0, $361 = 0, $362 = 0, $363 = 0, $364 = 0;
 var $365 = 0, $366 = 0, $367 = 0, $368 = 0, $369 = 0, $37 = 0, $370 = 0, $371 = 0, $372 = 0, $373 = 0, $374 = 0, $375 = 0, $376 = 0, $377 = 0, $378 = 0, $379 = 0, $38 = 0, $380 = 0, $381 = 0, $382 = 0;
 var $383 = 0, $384 = 0, $385 = 0, $386 = 0, $387 = 0, $388 = 0, $389 = 0, $39 = 0, $390 = 0, $391 = 0, $392 = 0, $393 = 0, $394 = 0, $395 = 0, $396 = 0, $397 = 0, $398 = 0, $399 = 0, $4 = 0, $40 = 0;
 var $400 = 0, $401 = 0, $402 = 0, $403 = 0, $404 = 0, $405 = 0, $406 = 0, $407 = 0, $408 = 0, $409 = 0, $41 = 0, $410 = 0, $411 = 0, $412 = 0, $413 = 0, $414 = 0, $415 = 0, $416 = 0, $417 = 0, $418 = 0;
 var $419 = 0, $42 = 0, $420 = 0, $421 = 0, $422 = 0, $423 = 0, $424 = 0, $425 = 0, $426 = 0, $427 = 0, $428 = 0, $429 = 0, $43 = 0, $430 = 0, $431 = 0, $432 = 0, $433 = 0, $434 = 0, $435 = 0, $436 = 0;
 var $437 = 0, $438 = 0, $439 = 0, $44 = 0, $440 = 0, $441 = 0, $442 = 0, $443 = 0, $444 = 0, $445 = 0, $446 = 0, $447 = 0, $448 = 0, $449 = 0, $45 = 0, $450 = 0, $451 = 0, $452 = 0, $453 = 0, $454 = 0;
 var $455 = 0, $456 = 0, $457 = 0, $458 = 0, $459 = 0, $46 = 0, $460 = 0, $461 = 0, $462 = 0, $463 = 0, $464 = 0, $465 = 0, $466 = 0, $467 = 0, $468 = 0, $469 = 0, $47 = 0, $470 = 0, $471 = 0, $472 = 0;
 var $473 = 0, $474 = 0, $475 = 0, $476 = 0, $477 = 0, $478 = 0, $479 = 0, $48 = 0, $480 = 0, $481 = 0, $482 = 0, $483 = 0, $484 = 0, $485 = 0, $486 = 0, $487 = 0, $488 = 0, $489 = 0, $49 = 0, $490 = 0;
 var $491 = 0, $492 = 0, $493 = 0, $494 = 0, $495 = 0, $496 = 0, $497 = 0, $498 = 0, $499 = 0, $5 = 0, $50 = 0, $500 = 0, $501 = 0, $502 = 0, $503 = 0, $504 = 0, $505 = 0, $506 = 0, $507 = 0, $508 = 0;
 var $509 = 0, $51 = 0, $510 = 0, $511 = 0, $512 = 0, $513 = 0, $514 = 0, $515 = 0, $516 = 0, $517 = 0, $518 = 0, $519 = 0, $52 = 0, $520 = 0, $521 = 0, $522 = 0, $523 = 0, $524 = 0, $525 = 0, $526 = 0;
 var $527 = 0, $528 = 0, $529 = 0, $53 = 0, $530 = 0, $531 = 0, $532 = 0, $533 = 0, $534 = 0, $535 = 0, $536 = 0, $537 = 0, $538 = 0, $539 = 0, $54 = 0, $540 = 0, $541 = 0, $542 = 0, $543 = 0, $544 = 0;
 var $545 = 0, $546 = 0, $547 = 0, $548 = 0, $549 = 0, $55 = 0, $550 = 0, $551 = 0, $552 = 0, $553 = 0, $554 = 0, $555 = 0, $556 = 0, $557 = 0, $558 = 0, $559 = 0, $56 = 0, $560 = 0, $561 = 0, $562 = 0;
 var $563 = 0, $564 = 0, $565 = 0, $566 = 0, $567 = 0, $568 = 0, $569 = 0, $57 = 0, $570 = 0, $571 = 0, $572 = 0, $573 = 0, $574 = 0, $575 = 0, $576 = 0, $577 = 0, $578 = 0, $579 = 0, $58 = 0, $580 = 0;
 var $581 = 0, $582 = 0, $583 = 0, $584 = 0, $585 = 0, $586 = 0, $587 = 0, $588 = 0, $589 = 0, $59 = 0, $590 = 0, $591 = 0, $592 = 0, $593 = 0, $594 = 0, $595 = 0, $596 = 0, $597 = 0, $598 = 0, $599 = 0;
 var $6 = 0, $60 = 0, $600 = 0, $601 = 0, $602 = 0, $603 = 0, $604 = 0, $605 = 0, $606 = 0, $607 = 0, $608 = 0, $609 = 0, $61 = 0, $610 = 0, $611 = 0, $612 = 0, $613 = 0, $614 = 0, $615 = 0, $616 = 0;
 var $617 = 0, $618 = 0, $619 = 0, $62 = 0, $620 = 0, $621 = 0, $622 = 0, $623 = 0, $624 = 0, $625 = 0, $626 = 0, $627 = 0, $628 = 0, $629 = 0, $63 = 0, $630 = 0, $631 = 0, $632 = 0, $633 = 0, $634 = 0;
 var $635 = 0, $636 = 0, $637 = 0, $638 = 0, $639 = 0, $64 = 0, $640 = 0, $641 = 0, $642 = 0, $643 = 0, $644 = 0, $645 = 0, $646 = 0, $647 = 0, $648 = 0, $649 = 0, $65 = 0, $650 = 0, $651 = 0, $652 = 0;
 var $653 = 0, $654 = 0, $655 = 0, $656 = 0, $657 = 0, $658 = 0, $659 = 0, $66 = 0, $660 = 0, $661 = 0, $662 = 0, $663 = 0, $664 = 0, $665 = 0, $666 = 0, $667 = 0, $668 = 0, $669 = 0, $67 = 0, $670 = 0;
 var $671 = 0, $672 = 0, $673 = 0, $674 = 0, $675 = 0, $676 = 0, $677 = 0, $678 = 0, $679 = 0, $68 = 0, $680 = 0, $681 = 0, $682 = 0, $683 = 0, $684 = 0, $685 = 0, $686 = 0, $687 = 0, $688 = 0, $689 = 0;
 var $69 = 0, $690 = 0, $691 = 0, $692 = 0, $693 = 0, $694 = 0, $695 = 0, $696 = 0, $697 = 0, $698 = 0, $699 = 0, $7 = 0, $70 = 0, $700 = 0, $701 = 0, $702 = 0, $703 = 0, $704 = 0, $705 = 0, $706 = 0;
 var $707 = 0, $708 = 0, $709 = 0, $71 = 0, $710 = 0, $711 = 0, $712 = 0, $713 = 0, $714 = 0, $715 = 0, $716 = 0, $717 = 0, $718 = 0, $719 = 0, $72 = 0, $720 = 0, $721 = 0, $722 = 0, $723 = 0, $724 = 0;
 var $725 = 0, $726 = 0, $727 = 0, $728 = 0, $729 = 0, $73 = 0, $730 = 0, $731 = 0, $732 = 0, $733 = 0, $734 = 0, $735 = 0, $736 = 0, $737 = 0, $738 = 0, $739 = 0, $74 = 0, $740 = 0, $741 = 0, $742 = 0;
 var $743 = 0, $744 = 0, $745 = 0, $746 = 0, $747 = 0, $748 = 0, $749 = 0, $75 = 0, $750 = 0, $751 = 0, $752 = 0, $753 = 0, $754 = 0, $755 = 0, $756 = 0, $757 = 0, $758 = 0, $759 = 0, $76 = 0, $760 = 0;
 var $761 = 0, $762 = 0, $763 = 0, $764 = 0, $765 = 0, $766 = 0, $767 = 0, $768 = 0, $769 = 0, $77 = 0, $770 = 0, $771 = 0, $772 = 0, $773 = 0, $774 = 0, $775 = 0, $776 = 0, $777 = 0, $778 = 0, $779 = 0;
 var $78 = 0, $780 = 0, $781 = 0, $782 = 0, $783 = 0, $784 = 0, $785 = 0, $786 = 0, $787 = 0, $788 = 0, $789 = 0, $79 = 0, $790 = 0, $791 = 0, $792 = 0, $793 = 0, $794 = 0, $795 = 0, $796 = 0, $797 = 0;
 var $798 = 0, $799 = 0, $8 = 0, $80 = 0, $800 = 0, $801 = 0, $802 = 0, $803 = 0, $804 = 0, $805 = 0, $806 = 0, $807 = 0, $808 = 0, $809 = 0, $81 = 0, $810 = 0, $811 = 0, $812 = 0, $813 = 0, $814 = 0;
 var $815 = 0, $816 = 0, $817 = 0, $818 = 0, $819 = 0, $82 = 0, $820 = 0, $821 = 0, $822 = 0, $823 = 0, $824 = 0, $825 = 0, $826 = 0, $827 = 0, $828 = 0, $829 = 0, $83 = 0, $830 = 0, $831 = 0, $832 = 0;
 var $833 = 0, $834 = 0, $835 = 0, $836 = 0, $837 = 0, $838 = 0, $839 = 0, $84 = 0, $840 = 0, $841 = 0, $842 = 0, $843 = 0, $844 = 0, $845 = 0, $846 = 0, $847 = 0, $848 = 0, $849 = 0, $85 = 0, $850 = 0;
 var $851 = 0, $852 = 0, $853 = 0, $854 = 0, $855 = 0, $856 = 0, $857 = 0, $858 = 0, $859 = 0, $86 = 0, $860 = 0, $861 = 0, $862 = 0, $863 = 0, $864 = 0, $865 = 0, $866 = 0, $867 = 0, $868 = 0, $869 = 0;
 var $87 = 0, $870 = 0, $871 = 0, $872 = 0, $873 = 0, $874 = 0, $875 = 0, $876 = 0, $877 = 0, $878 = 0, $879 = 0, $88 = 0, $880 = 0, $881 = 0, $882 = 0, $883 = 0, $884 = 0, $885 = 0, $886 = 0, $887 = 0;
 var $888 = 0, $889 = 0, $89 = 0, $890 = 0, $891 = 0, $892 = 0, $893 = 0, $894 = 0, $895 = 0, $896 = 0, $897 = 0, $898 = 0, $899 = 0, $9 = 0, $90 = 0, $900 = 0, $901 = 0, $902 = 0, $903 = 0, $904 = 0;
 var $905 = 0, $906 = 0, $907 = 0, $908 = 0, $909 = 0, $91 = 0, $910 = 0, $911 = 0, $912 = 0, $913 = 0, $914 = 0, $915 = 0, $916 = 0, $917 = 0, $918 = 0, $919 = 0, $92 = 0, $920 = 0, $921 = 0, $922 = 0;
 var $923 = 0, $924 = 0, $925 = 0, $926 = 0, $927 = 0, $928 = 0, $929 = 0, $93 = 0, $930 = 0, $931 = 0, $932 = 0, $933 = 0, $934 = 0, $935 = 0, $936 = 0, $937 = 0, $938 = 0, $939 = 0, $94 = 0, $940 = 0;
 var $941 = 0, $942 = 0, $943 = 0, $944 = 0, $945 = 0, $946 = 0, $947 = 0, $948 = 0, $949 = 0, $95 = 0, $950 = 0, $951 = 0, $952 = 0, $953 = 0, $954 = 0, $955 = 0, $956 = 0, $957 = 0, $958 = 0, $959 = 0;
 var $96 = 0, $960 = 0, $961 = 0, $962 = 0, $963 = 0, $964 = 0, $965 = 0, $966 = 0, $967 = 0, $968 = 0, $969 = 0, $97 = 0, $970 = 0, $971 = 0, $972 = 0, $973 = 0, $974 = 0, $975 = 0, $976 = 0, $977 = 0;
 var $978 = 0, $979 = 0, $98 = 0, $980 = 0, $981 = 0, $982 = 0, $983 = 0, $984 = 0, $985 = 0, $986 = 0, $987 = 0, $988 = 0, $989 = 0, $99 = 0, $990 = 0, $991 = 0, $992 = 0, $993 = 0, $994 = 0, $995 = 0;
 var $996 = 0, $997 = 0, $998 = 0, $999 = 0, $F$0$i$i = 0, $F1$0$i = 0, $F4$0 = 0, $F4$0$i$i = 0, $F5$0$i = 0, $I1$0$c$i$i = 0, $I1$0$i$i = 0, $I7$0$i = 0, $I7$0$i$i = 0, $K12$029$i = 0, $K2$015$i$i = 0, $K8$053$i$i = 0, $R$0$i = 0, $R$0$i$be = 0, $R$0$i$i = 0, $R$0$i$i$be = 0;
 var $R$0$i$i$lcssa = 0, $R$0$i$i$ph = 0, $R$0$i$lcssa = 0, $R$0$i$ph = 0, $R$0$i18 = 0, $R$0$i18$be = 0, $R$0$i18$lcssa = 0, $R$0$i18$ph = 0, $R$1$i = 0, $R$1$i$i = 0, $R$1$i20 = 0, $RP$0$i = 0, $RP$0$i$be = 0, $RP$0$i$i = 0, $RP$0$i$i$be = 0, $RP$0$i$i$lcssa = 0, $RP$0$i$i$ph = 0, $RP$0$i$lcssa = 0, $RP$0$i$ph = 0, $RP$0$i17 = 0;
 var $RP$0$i17$be = 0, $RP$0$i17$lcssa = 0, $RP$0$i17$ph = 0, $T$0$lcssa$i = 0, $T$0$lcssa$i$i = 0, $T$0$lcssa$i26$i = 0, $T$014$i$i = 0, $T$014$i$i$lcssa = 0, $T$028$i = 0, $T$028$i$lcssa = 0, $T$052$i$i = 0, $T$052$i$i$lcssa = 0, $br$0$i = 0, $br$030$i = 0, $cond$i = 0, $cond$i$i = 0, $cond$i21 = 0, $exitcond$i$i = 0, $i$02$i$i = 0, $idx$0$i = 0;
 var $mem$0 = 0, $nb$0 = 0, $oldfirst$0$i$i = 0, $or$cond$i = 0, $or$cond$i$i = 0, $or$cond$i27$i = 0, $or$cond$i29 = 0, $or$cond1$i = 0, $or$cond19$i = 0, $or$cond2$i = 0, $or$cond24$i = 0, $or$cond3$i = 0, $or$cond4$i = 0, $or$cond47$i = 0, $or$cond5$i = 0, $or$cond6$i = 0, $or$cond8$i = 0, $qsize$0$i$i = 0, $rsize$0$i = 0, $rsize$0$i$lcssa = 0;
 var $rsize$0$i15 = 0, $rsize$1$i = 0, $rsize$2$i = 0, $rsize$2$i$ph = 0, $rsize$3$lcssa$i = 0, $rsize$331$i = 0, $rst$0$i = 0, $rst$1$i = 0, $sizebits$0$i = 0, $sp$0$i$i = 0, $sp$0$i$i$i = 0, $sp$0$i$i$lcssa = 0, $sp$074$i = 0, $sp$074$i$lcssa = 0, $sp$173$i = 0, $sp$173$i$lcssa = 0, $ssize$0$i = 0, $ssize$1$i = 0, $ssize$129$i = 0, $ssize$2$i = 0;
 var $t$0$i = 0, $t$0$i14 = 0, $t$1$i = 0, $t$1$i$ph = 0, $t$2$ph$i = 0, $t$2$v$3$i = 0, $t$2$v$3$i$lcssa = 0, $t$230$i = 0, $t$230$i$be = 0, $tbase$245$i = 0, $tsize$03141$i = 0, $tsize$1$i = 0, $tsize$244$i = 0, $v$0$i = 0, $v$0$i$lcssa = 0, $v$0$i16 = 0, $v$1$i = 0, $v$2$i = 0, $v$2$i$ph = 0, $v$3$lcssa$i = 0;
 var $v$332$i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($bytes>>>0)<(245);
 do {
  if ($0) {
   $1 = ($bytes>>>0)<(11);
   if ($1) {
    $5 = 16;
   } else {
    $2 = (($bytes) + 11)|0;
    $3 = $2 & -8;
    $5 = $3;
   }
   $4 = $5 >>> 3;
   $6 = HEAP32[125000>>2]|0;
   $7 = $6 >>> $4;
   $8 = $7 & 3;
   $9 = ($8|0)==(0);
   if (!($9)) {
    $10 = $7 & 1;
    $11 = $10 ^ 1;
    $12 = (($11) + ($4))|0;
    $13 = $12 << 1;
    $14 = ((125000 + ($13<<2)|0) + 40|0);
    $$sum10 = (($13) + 2)|0;
    $15 = ((125000 + ($$sum10<<2)|0) + 40|0);
    $16 = HEAP32[$15>>2]|0;
    $17 = (($16) + 8|0);
    $18 = HEAP32[$17>>2]|0;
    $19 = ($14|0)==($18|0);
    do {
     if ($19) {
      $20 = 1 << $12;
      $21 = $20 ^ -1;
      $22 = $6 & $21;
      HEAP32[125000>>2] = $22;
     } else {
      $23 = HEAP32[((125000 + 16|0))>>2]|0;
      $24 = ($18>>>0)<($23>>>0);
      if ($24) {
       _abort();
       // unreachable;
      }
      $25 = (($18) + 12|0);
      $26 = HEAP32[$25>>2]|0;
      $27 = ($26|0)==($16|0);
      if ($27) {
       HEAP32[$25>>2] = $14;
       HEAP32[$15>>2] = $18;
       break;
      } else {
       _abort();
       // unreachable;
      }
     }
    } while(0);
    $28 = $12 << 3;
    $29 = $28 | 3;
    $30 = (($16) + 4|0);
    HEAP32[$30>>2] = $29;
    $$sum1112 = $28 | 4;
    $31 = (($16) + ($$sum1112)|0);
    $32 = HEAP32[$31>>2]|0;
    $33 = $32 | 1;
    HEAP32[$31>>2] = $33;
    $mem$0 = $17;
    return ($mem$0|0);
   }
   $34 = HEAP32[((125000 + 8|0))>>2]|0;
   $35 = ($5>>>0)>($34>>>0);
   if ($35) {
    $36 = ($7|0)==(0);
    if (!($36)) {
     $37 = $7 << $4;
     $38 = 2 << $4;
     $39 = (0 - ($38))|0;
     $40 = $38 | $39;
     $41 = $37 & $40;
     $42 = (0 - ($41))|0;
     $43 = $41 & $42;
     $44 = (($43) + -1)|0;
     $45 = $44 >>> 12;
     $46 = $45 & 16;
     $47 = $44 >>> $46;
     $48 = $47 >>> 5;
     $49 = $48 & 8;
     $50 = $49 | $46;
     $51 = $47 >>> $49;
     $52 = $51 >>> 2;
     $53 = $52 & 4;
     $54 = $50 | $53;
     $55 = $51 >>> $53;
     $56 = $55 >>> 1;
     $57 = $56 & 2;
     $58 = $54 | $57;
     $59 = $55 >>> $57;
     $60 = $59 >>> 1;
     $61 = $60 & 1;
     $62 = $58 | $61;
     $63 = $59 >>> $61;
     $64 = (($62) + ($63))|0;
     $65 = $64 << 1;
     $66 = ((125000 + ($65<<2)|0) + 40|0);
     $$sum4 = (($65) + 2)|0;
     $67 = ((125000 + ($$sum4<<2)|0) + 40|0);
     $68 = HEAP32[$67>>2]|0;
     $69 = (($68) + 8|0);
     $70 = HEAP32[$69>>2]|0;
     $71 = ($66|0)==($70|0);
     do {
      if ($71) {
       $72 = 1 << $64;
       $73 = $72 ^ -1;
       $74 = $6 & $73;
       HEAP32[125000>>2] = $74;
       $88 = $34;
      } else {
       $75 = HEAP32[((125000 + 16|0))>>2]|0;
       $76 = ($70>>>0)<($75>>>0);
       if ($76) {
        _abort();
        // unreachable;
       }
       $77 = (($70) + 12|0);
       $78 = HEAP32[$77>>2]|0;
       $79 = ($78|0)==($68|0);
       if ($79) {
        HEAP32[$77>>2] = $66;
        HEAP32[$67>>2] = $70;
        $$pre = HEAP32[((125000 + 8|0))>>2]|0;
        $88 = $$pre;
        break;
       } else {
        _abort();
        // unreachable;
       }
      }
     } while(0);
     $80 = $64 << 3;
     $81 = (($80) - ($5))|0;
     $82 = $5 | 3;
     $83 = (($68) + 4|0);
     HEAP32[$83>>2] = $82;
     $84 = (($68) + ($5)|0);
     $85 = $81 | 1;
     $$sum56 = $5 | 4;
     $86 = (($68) + ($$sum56)|0);
     HEAP32[$86>>2] = $85;
     $87 = (($68) + ($80)|0);
     HEAP32[$87>>2] = $81;
     $89 = ($88|0)==(0);
     if (!($89)) {
      $90 = HEAP32[((125000 + 20|0))>>2]|0;
      $91 = $88 >>> 3;
      $92 = $91 << 1;
      $93 = ((125000 + ($92<<2)|0) + 40|0);
      $94 = HEAP32[125000>>2]|0;
      $95 = 1 << $91;
      $96 = $94 & $95;
      $97 = ($96|0)==(0);
      if ($97) {
       $98 = $94 | $95;
       HEAP32[125000>>2] = $98;
       $$sum8$pre = (($92) + 2)|0;
       $$pre105 = ((125000 + ($$sum8$pre<<2)|0) + 40|0);
       $$pre$phiZ2D = $$pre105;$F4$0 = $93;
      } else {
       $$sum9 = (($92) + 2)|0;
       $99 = ((125000 + ($$sum9<<2)|0) + 40|0);
       $100 = HEAP32[$99>>2]|0;
       $101 = HEAP32[((125000 + 16|0))>>2]|0;
       $102 = ($100>>>0)<($101>>>0);
       if ($102) {
        _abort();
        // unreachable;
       } else {
        $$pre$phiZ2D = $99;$F4$0 = $100;
       }
      }
      HEAP32[$$pre$phiZ2D>>2] = $90;
      $103 = (($F4$0) + 12|0);
      HEAP32[$103>>2] = $90;
      $104 = (($90) + 8|0);
      HEAP32[$104>>2] = $F4$0;
      $105 = (($90) + 12|0);
      HEAP32[$105>>2] = $93;
     }
     HEAP32[((125000 + 8|0))>>2] = $81;
     HEAP32[((125000 + 20|0))>>2] = $84;
     $mem$0 = $69;
     return ($mem$0|0);
    }
    $106 = HEAP32[((125000 + 4|0))>>2]|0;
    $107 = ($106|0)==(0);
    if ($107) {
     $nb$0 = $5;
    } else {
     $108 = (0 - ($106))|0;
     $109 = $106 & $108;
     $110 = (($109) + -1)|0;
     $111 = $110 >>> 12;
     $112 = $111 & 16;
     $113 = $110 >>> $112;
     $114 = $113 >>> 5;
     $115 = $114 & 8;
     $116 = $115 | $112;
     $117 = $113 >>> $115;
     $118 = $117 >>> 2;
     $119 = $118 & 4;
     $120 = $116 | $119;
     $121 = $117 >>> $119;
     $122 = $121 >>> 1;
     $123 = $122 & 2;
     $124 = $120 | $123;
     $125 = $121 >>> $123;
     $126 = $125 >>> 1;
     $127 = $126 & 1;
     $128 = $124 | $127;
     $129 = $125 >>> $127;
     $130 = (($128) + ($129))|0;
     $131 = ((125000 + ($130<<2)|0) + 304|0);
     $132 = HEAP32[$131>>2]|0;
     $133 = (($132) + 4|0);
     $134 = HEAP32[$133>>2]|0;
     $135 = $134 & -8;
     $136 = (($135) - ($5))|0;
     $rsize$0$i = $136;$t$0$i = $132;$v$0$i = $132;
     while(1) {
      $137 = (($t$0$i) + 16|0);
      $138 = HEAP32[$137>>2]|0;
      $139 = ($138|0)==(0|0);
      if ($139) {
       $140 = (($t$0$i) + 20|0);
       $141 = HEAP32[$140>>2]|0;
       $142 = ($141|0)==(0|0);
       if ($142) {
        $rsize$0$i$lcssa = $rsize$0$i;$v$0$i$lcssa = $v$0$i;
        break;
       } else {
        $144 = $141;
       }
      } else {
       $144 = $138;
      }
      $143 = (($144) + 4|0);
      $145 = HEAP32[$143>>2]|0;
      $146 = $145 & -8;
      $147 = (($146) - ($5))|0;
      $148 = ($147>>>0)<($rsize$0$i>>>0);
      $$rsize$0$i = $148 ? $147 : $rsize$0$i;
      $$v$0$i = $148 ? $144 : $v$0$i;
      $rsize$0$i = $$rsize$0$i;$t$0$i = $144;$v$0$i = $$v$0$i;
     }
     $149 = HEAP32[((125000 + 16|0))>>2]|0;
     $150 = ($v$0$i$lcssa>>>0)<($149>>>0);
     if ($150) {
      _abort();
      // unreachable;
     }
     $151 = (($v$0$i$lcssa) + ($5)|0);
     $152 = ($v$0$i$lcssa>>>0)<($151>>>0);
     if (!($152)) {
      _abort();
      // unreachable;
     }
     $153 = (($v$0$i$lcssa) + 24|0);
     $154 = HEAP32[$153>>2]|0;
     $155 = (($v$0$i$lcssa) + 12|0);
     $156 = HEAP32[$155>>2]|0;
     $157 = ($156|0)==($v$0$i$lcssa|0);
     do {
      if ($157) {
       $167 = (($v$0$i$lcssa) + 20|0);
       $168 = HEAP32[$167>>2]|0;
       $169 = ($168|0)==(0|0);
       if ($169) {
        $170 = (($v$0$i$lcssa) + 16|0);
        $171 = HEAP32[$170>>2]|0;
        $172 = ($171|0)==(0|0);
        if ($172) {
         $R$1$i = 0;
         break;
        } else {
         $R$0$i$ph = $171;$RP$0$i$ph = $170;
        }
       } else {
        $R$0$i$ph = $168;$RP$0$i$ph = $167;
       }
       $R$0$i = $R$0$i$ph;$RP$0$i = $RP$0$i$ph;
       while(1) {
        $173 = (($R$0$i) + 20|0);
        $174 = HEAP32[$173>>2]|0;
        $175 = ($174|0)==(0|0);
        if ($175) {
         $176 = (($R$0$i) + 16|0);
         $177 = HEAP32[$176>>2]|0;
         $178 = ($177|0)==(0|0);
         if ($178) {
          $R$0$i$lcssa = $R$0$i;$RP$0$i$lcssa = $RP$0$i;
          break;
         } else {
          $R$0$i$be = $177;$RP$0$i$be = $176;
         }
        } else {
         $R$0$i$be = $174;$RP$0$i$be = $173;
        }
        $R$0$i = $R$0$i$be;$RP$0$i = $RP$0$i$be;
       }
       $179 = ($RP$0$i$lcssa>>>0)<($149>>>0);
       if ($179) {
        _abort();
        // unreachable;
       } else {
        HEAP32[$RP$0$i$lcssa>>2] = 0;
        $R$1$i = $R$0$i$lcssa;
        break;
       }
      } else {
       $158 = (($v$0$i$lcssa) + 8|0);
       $159 = HEAP32[$158>>2]|0;
       $160 = ($159>>>0)<($149>>>0);
       if ($160) {
        _abort();
        // unreachable;
       }
       $161 = (($159) + 12|0);
       $162 = HEAP32[$161>>2]|0;
       $163 = ($162|0)==($v$0$i$lcssa|0);
       if (!($163)) {
        _abort();
        // unreachable;
       }
       $164 = (($156) + 8|0);
       $165 = HEAP32[$164>>2]|0;
       $166 = ($165|0)==($v$0$i$lcssa|0);
       if ($166) {
        HEAP32[$161>>2] = $156;
        HEAP32[$164>>2] = $159;
        $R$1$i = $156;
        break;
       } else {
        _abort();
        // unreachable;
       }
      }
     } while(0);
     $180 = ($154|0)==(0|0);
     do {
      if (!($180)) {
       $181 = (($v$0$i$lcssa) + 28|0);
       $182 = HEAP32[$181>>2]|0;
       $183 = ((125000 + ($182<<2)|0) + 304|0);
       $184 = HEAP32[$183>>2]|0;
       $185 = ($v$0$i$lcssa|0)==($184|0);
       if ($185) {
        HEAP32[$183>>2] = $R$1$i;
        $cond$i = ($R$1$i|0)==(0|0);
        if ($cond$i) {
         $186 = 1 << $182;
         $187 = $186 ^ -1;
         $188 = HEAP32[((125000 + 4|0))>>2]|0;
         $189 = $188 & $187;
         HEAP32[((125000 + 4|0))>>2] = $189;
         break;
        }
       } else {
        $190 = HEAP32[((125000 + 16|0))>>2]|0;
        $191 = ($154>>>0)<($190>>>0);
        if ($191) {
         _abort();
         // unreachable;
        }
        $192 = (($154) + 16|0);
        $193 = HEAP32[$192>>2]|0;
        $194 = ($193|0)==($v$0$i$lcssa|0);
        if ($194) {
         HEAP32[$192>>2] = $R$1$i;
        } else {
         $195 = (($154) + 20|0);
         HEAP32[$195>>2] = $R$1$i;
        }
        $196 = ($R$1$i|0)==(0|0);
        if ($196) {
         break;
        }
       }
       $197 = HEAP32[((125000 + 16|0))>>2]|0;
       $198 = ($R$1$i>>>0)<($197>>>0);
       if ($198) {
        _abort();
        // unreachable;
       }
       $199 = (($R$1$i) + 24|0);
       HEAP32[$199>>2] = $154;
       $200 = (($v$0$i$lcssa) + 16|0);
       $201 = HEAP32[$200>>2]|0;
       $202 = ($201|0)==(0|0);
       do {
        if (!($202)) {
         $203 = ($201>>>0)<($197>>>0);
         if ($203) {
          _abort();
          // unreachable;
         } else {
          $204 = (($R$1$i) + 16|0);
          HEAP32[$204>>2] = $201;
          $205 = (($201) + 24|0);
          HEAP32[$205>>2] = $R$1$i;
          break;
         }
        }
       } while(0);
       $206 = (($v$0$i$lcssa) + 20|0);
       $207 = HEAP32[$206>>2]|0;
       $208 = ($207|0)==(0|0);
       if (!($208)) {
        $209 = HEAP32[((125000 + 16|0))>>2]|0;
        $210 = ($207>>>0)<($209>>>0);
        if ($210) {
         _abort();
         // unreachable;
        } else {
         $211 = (($R$1$i) + 20|0);
         HEAP32[$211>>2] = $207;
         $212 = (($207) + 24|0);
         HEAP32[$212>>2] = $R$1$i;
         break;
        }
       }
      }
     } while(0);
     $213 = ($rsize$0$i$lcssa>>>0)<(16);
     if ($213) {
      $214 = (($rsize$0$i$lcssa) + ($5))|0;
      $215 = $214 | 3;
      $216 = (($v$0$i$lcssa) + 4|0);
      HEAP32[$216>>2] = $215;
      $$sum4$i = (($214) + 4)|0;
      $217 = (($v$0$i$lcssa) + ($$sum4$i)|0);
      $218 = HEAP32[$217>>2]|0;
      $219 = $218 | 1;
      HEAP32[$217>>2] = $219;
     } else {
      $220 = $5 | 3;
      $221 = (($v$0$i$lcssa) + 4|0);
      HEAP32[$221>>2] = $220;
      $222 = $rsize$0$i$lcssa | 1;
      $$sum$i39 = $5 | 4;
      $223 = (($v$0$i$lcssa) + ($$sum$i39)|0);
      HEAP32[$223>>2] = $222;
      $$sum1$i = (($rsize$0$i$lcssa) + ($5))|0;
      $224 = (($v$0$i$lcssa) + ($$sum1$i)|0);
      HEAP32[$224>>2] = $rsize$0$i$lcssa;
      $225 = HEAP32[((125000 + 8|0))>>2]|0;
      $226 = ($225|0)==(0);
      if (!($226)) {
       $227 = HEAP32[((125000 + 20|0))>>2]|0;
       $228 = $225 >>> 3;
       $229 = $228 << 1;
       $230 = ((125000 + ($229<<2)|0) + 40|0);
       $231 = HEAP32[125000>>2]|0;
       $232 = 1 << $228;
       $233 = $231 & $232;
       $234 = ($233|0)==(0);
       if ($234) {
        $235 = $231 | $232;
        HEAP32[125000>>2] = $235;
        $$sum2$pre$i = (($229) + 2)|0;
        $$pre$i = ((125000 + ($$sum2$pre$i<<2)|0) + 40|0);
        $$pre$phi$iZ2D = $$pre$i;$F1$0$i = $230;
       } else {
        $$sum3$i = (($229) + 2)|0;
        $236 = ((125000 + ($$sum3$i<<2)|0) + 40|0);
        $237 = HEAP32[$236>>2]|0;
        $238 = HEAP32[((125000 + 16|0))>>2]|0;
        $239 = ($237>>>0)<($238>>>0);
        if ($239) {
         _abort();
         // unreachable;
        } else {
         $$pre$phi$iZ2D = $236;$F1$0$i = $237;
        }
       }
       HEAP32[$$pre$phi$iZ2D>>2] = $227;
       $240 = (($F1$0$i) + 12|0);
       HEAP32[$240>>2] = $227;
       $241 = (($227) + 8|0);
       HEAP32[$241>>2] = $F1$0$i;
       $242 = (($227) + 12|0);
       HEAP32[$242>>2] = $230;
      }
      HEAP32[((125000 + 8|0))>>2] = $rsize$0$i$lcssa;
      HEAP32[((125000 + 20|0))>>2] = $151;
     }
     $243 = (($v$0$i$lcssa) + 8|0);
     $mem$0 = $243;
     return ($mem$0|0);
    }
   } else {
    $nb$0 = $5;
   }
  } else {
   $244 = ($bytes>>>0)>(4294967231);
   if ($244) {
    $nb$0 = -1;
   } else {
    $245 = (($bytes) + 11)|0;
    $246 = $245 & -8;
    $247 = HEAP32[((125000 + 4|0))>>2]|0;
    $248 = ($247|0)==(0);
    if ($248) {
     $nb$0 = $246;
    } else {
     $249 = (0 - ($246))|0;
     $250 = $245 >>> 8;
     $251 = ($250|0)==(0);
     if ($251) {
      $idx$0$i = 0;
     } else {
      $252 = ($246>>>0)>(16777215);
      if ($252) {
       $idx$0$i = 31;
      } else {
       $253 = (($250) + 1048320)|0;
       $254 = $253 >>> 16;
       $255 = $254 & 8;
       $256 = $250 << $255;
       $257 = (($256) + 520192)|0;
       $258 = $257 >>> 16;
       $259 = $258 & 4;
       $260 = $259 | $255;
       $261 = $256 << $259;
       $262 = (($261) + 245760)|0;
       $263 = $262 >>> 16;
       $264 = $263 & 2;
       $265 = $260 | $264;
       $266 = (14 - ($265))|0;
       $267 = $261 << $264;
       $268 = $267 >>> 15;
       $269 = (($266) + ($268))|0;
       $270 = $269 << 1;
       $271 = (($269) + 7)|0;
       $272 = $246 >>> $271;
       $273 = $272 & 1;
       $274 = $273 | $270;
       $idx$0$i = $274;
      }
     }
     $275 = ((125000 + ($idx$0$i<<2)|0) + 304|0);
     $276 = HEAP32[$275>>2]|0;
     $277 = ($276|0)==(0|0);
     if ($277) {
      $rsize$2$i = $249;$t$1$i = 0;$v$2$i = 0;
     } else {
      $278 = ($idx$0$i|0)==(31);
      if ($278) {
       $282 = 0;
      } else {
       $279 = $idx$0$i >>> 1;
       $280 = (25 - ($279))|0;
       $282 = $280;
      }
      $281 = $246 << $282;
      $rsize$0$i15 = $249;$rst$0$i = 0;$sizebits$0$i = $281;$t$0$i14 = $276;$v$0$i16 = 0;
      while(1) {
       $283 = (($t$0$i14) + 4|0);
       $284 = HEAP32[$283>>2]|0;
       $285 = $284 & -8;
       $286 = (($285) - ($246))|0;
       $287 = ($286>>>0)<($rsize$0$i15>>>0);
       if ($287) {
        $288 = ($285|0)==($246|0);
        if ($288) {
         $rsize$2$i$ph = $286;$t$1$i$ph = $t$0$i14;$v$2$i$ph = $t$0$i14;
         break;
        } else {
         $rsize$1$i = $286;$v$1$i = $t$0$i14;
        }
       } else {
        $rsize$1$i = $rsize$0$i15;$v$1$i = $v$0$i16;
       }
       $289 = (($t$0$i14) + 20|0);
       $290 = HEAP32[$289>>2]|0;
       $291 = $sizebits$0$i >>> 31;
       $292 = ((($t$0$i14) + ($291<<2)|0) + 16|0);
       $293 = HEAP32[$292>>2]|0;
       $294 = ($290|0)==(0|0);
       $295 = ($290|0)==($293|0);
       $or$cond19$i = $294 | $295;
       $rst$1$i = $or$cond19$i ? $rst$0$i : $290;
       $296 = ($293|0)==(0|0);
       $297 = $sizebits$0$i << 1;
       if ($296) {
        $rsize$2$i$ph = $rsize$1$i;$t$1$i$ph = $rst$1$i;$v$2$i$ph = $v$1$i;
        break;
       } else {
        $rsize$0$i15 = $rsize$1$i;$rst$0$i = $rst$1$i;$sizebits$0$i = $297;$t$0$i14 = $293;$v$0$i16 = $v$1$i;
       }
      }
      $rsize$2$i = $rsize$2$i$ph;$t$1$i = $t$1$i$ph;$v$2$i = $v$2$i$ph;
     }
     $298 = ($t$1$i|0)==(0|0);
     $299 = ($v$2$i|0)==(0|0);
     $or$cond$i = $298 & $299;
     if ($or$cond$i) {
      $300 = 2 << $idx$0$i;
      $301 = (0 - ($300))|0;
      $302 = $300 | $301;
      $303 = $247 & $302;
      $304 = ($303|0)==(0);
      if ($304) {
       $nb$0 = $246;
       break;
      }
      $305 = (0 - ($303))|0;
      $306 = $303 & $305;
      $307 = (($306) + -1)|0;
      $308 = $307 >>> 12;
      $309 = $308 & 16;
      $310 = $307 >>> $309;
      $311 = $310 >>> 5;
      $312 = $311 & 8;
      $313 = $312 | $309;
      $314 = $310 >>> $312;
      $315 = $314 >>> 2;
      $316 = $315 & 4;
      $317 = $313 | $316;
      $318 = $314 >>> $316;
      $319 = $318 >>> 1;
      $320 = $319 & 2;
      $321 = $317 | $320;
      $322 = $318 >>> $320;
      $323 = $322 >>> 1;
      $324 = $323 & 1;
      $325 = $321 | $324;
      $326 = $322 >>> $324;
      $327 = (($325) + ($326))|0;
      $328 = ((125000 + ($327<<2)|0) + 304|0);
      $329 = HEAP32[$328>>2]|0;
      $t$2$ph$i = $329;
     } else {
      $t$2$ph$i = $t$1$i;
     }
     $330 = ($t$2$ph$i|0)==(0|0);
     if ($330) {
      $rsize$3$lcssa$i = $rsize$2$i;$v$3$lcssa$i = $v$2$i;
     } else {
      $rsize$331$i = $rsize$2$i;$t$230$i = $t$2$ph$i;$v$332$i = $v$2$i;
      while(1) {
       $331 = (($t$230$i) + 4|0);
       $332 = HEAP32[$331>>2]|0;
       $333 = $332 & -8;
       $334 = (($333) - ($246))|0;
       $335 = ($334>>>0)<($rsize$331$i>>>0);
       $$rsize$3$i = $335 ? $334 : $rsize$331$i;
       $t$2$v$3$i = $335 ? $t$230$i : $v$332$i;
       $336 = (($t$230$i) + 16|0);
       $337 = HEAP32[$336>>2]|0;
       $338 = ($337|0)==(0|0);
       if ($338) {
        $339 = (($t$230$i) + 20|0);
        $340 = HEAP32[$339>>2]|0;
        $341 = ($340|0)==(0|0);
        if ($341) {
         $$rsize$3$i$lcssa = $$rsize$3$i;$t$2$v$3$i$lcssa = $t$2$v$3$i;
         break;
        } else {
         $t$230$i$be = $340;
        }
       } else {
        $t$230$i$be = $337;
       }
       $rsize$331$i = $$rsize$3$i;$t$230$i = $t$230$i$be;$v$332$i = $t$2$v$3$i;
      }
      $rsize$3$lcssa$i = $$rsize$3$i$lcssa;$v$3$lcssa$i = $t$2$v$3$i$lcssa;
     }
     $342 = ($v$3$lcssa$i|0)==(0|0);
     if ($342) {
      $nb$0 = $246;
     } else {
      $343 = HEAP32[((125000 + 8|0))>>2]|0;
      $344 = (($343) - ($246))|0;
      $345 = ($rsize$3$lcssa$i>>>0)<($344>>>0);
      if ($345) {
       $346 = HEAP32[((125000 + 16|0))>>2]|0;
       $347 = ($v$3$lcssa$i>>>0)<($346>>>0);
       if ($347) {
        _abort();
        // unreachable;
       }
       $348 = (($v$3$lcssa$i) + ($246)|0);
       $349 = ($v$3$lcssa$i>>>0)<($348>>>0);
       if (!($349)) {
        _abort();
        // unreachable;
       }
       $350 = (($v$3$lcssa$i) + 24|0);
       $351 = HEAP32[$350>>2]|0;
       $352 = (($v$3$lcssa$i) + 12|0);
       $353 = HEAP32[$352>>2]|0;
       $354 = ($353|0)==($v$3$lcssa$i|0);
       do {
        if ($354) {
         $364 = (($v$3$lcssa$i) + 20|0);
         $365 = HEAP32[$364>>2]|0;
         $366 = ($365|0)==(0|0);
         if ($366) {
          $367 = (($v$3$lcssa$i) + 16|0);
          $368 = HEAP32[$367>>2]|0;
          $369 = ($368|0)==(0|0);
          if ($369) {
           $R$1$i20 = 0;
           break;
          } else {
           $R$0$i18$ph = $368;$RP$0$i17$ph = $367;
          }
         } else {
          $R$0$i18$ph = $365;$RP$0$i17$ph = $364;
         }
         $R$0$i18 = $R$0$i18$ph;$RP$0$i17 = $RP$0$i17$ph;
         while(1) {
          $370 = (($R$0$i18) + 20|0);
          $371 = HEAP32[$370>>2]|0;
          $372 = ($371|0)==(0|0);
          if ($372) {
           $373 = (($R$0$i18) + 16|0);
           $374 = HEAP32[$373>>2]|0;
           $375 = ($374|0)==(0|0);
           if ($375) {
            $R$0$i18$lcssa = $R$0$i18;$RP$0$i17$lcssa = $RP$0$i17;
            break;
           } else {
            $R$0$i18$be = $374;$RP$0$i17$be = $373;
           }
          } else {
           $R$0$i18$be = $371;$RP$0$i17$be = $370;
          }
          $R$0$i18 = $R$0$i18$be;$RP$0$i17 = $RP$0$i17$be;
         }
         $376 = ($RP$0$i17$lcssa>>>0)<($346>>>0);
         if ($376) {
          _abort();
          // unreachable;
         } else {
          HEAP32[$RP$0$i17$lcssa>>2] = 0;
          $R$1$i20 = $R$0$i18$lcssa;
          break;
         }
        } else {
         $355 = (($v$3$lcssa$i) + 8|0);
         $356 = HEAP32[$355>>2]|0;
         $357 = ($356>>>0)<($346>>>0);
         if ($357) {
          _abort();
          // unreachable;
         }
         $358 = (($356) + 12|0);
         $359 = HEAP32[$358>>2]|0;
         $360 = ($359|0)==($v$3$lcssa$i|0);
         if (!($360)) {
          _abort();
          // unreachable;
         }
         $361 = (($353) + 8|0);
         $362 = HEAP32[$361>>2]|0;
         $363 = ($362|0)==($v$3$lcssa$i|0);
         if ($363) {
          HEAP32[$358>>2] = $353;
          HEAP32[$361>>2] = $356;
          $R$1$i20 = $353;
          break;
         } else {
          _abort();
          // unreachable;
         }
        }
       } while(0);
       $377 = ($351|0)==(0|0);
       do {
        if (!($377)) {
         $378 = (($v$3$lcssa$i) + 28|0);
         $379 = HEAP32[$378>>2]|0;
         $380 = ((125000 + ($379<<2)|0) + 304|0);
         $381 = HEAP32[$380>>2]|0;
         $382 = ($v$3$lcssa$i|0)==($381|0);
         if ($382) {
          HEAP32[$380>>2] = $R$1$i20;
          $cond$i21 = ($R$1$i20|0)==(0|0);
          if ($cond$i21) {
           $383 = 1 << $379;
           $384 = $383 ^ -1;
           $385 = HEAP32[((125000 + 4|0))>>2]|0;
           $386 = $385 & $384;
           HEAP32[((125000 + 4|0))>>2] = $386;
           break;
          }
         } else {
          $387 = HEAP32[((125000 + 16|0))>>2]|0;
          $388 = ($351>>>0)<($387>>>0);
          if ($388) {
           _abort();
           // unreachable;
          }
          $389 = (($351) + 16|0);
          $390 = HEAP32[$389>>2]|0;
          $391 = ($390|0)==($v$3$lcssa$i|0);
          if ($391) {
           HEAP32[$389>>2] = $R$1$i20;
          } else {
           $392 = (($351) + 20|0);
           HEAP32[$392>>2] = $R$1$i20;
          }
          $393 = ($R$1$i20|0)==(0|0);
          if ($393) {
           break;
          }
         }
         $394 = HEAP32[((125000 + 16|0))>>2]|0;
         $395 = ($R$1$i20>>>0)<($394>>>0);
         if ($395) {
          _abort();
          // unreachable;
         }
         $396 = (($R$1$i20) + 24|0);
         HEAP32[$396>>2] = $351;
         $397 = (($v$3$lcssa$i) + 16|0);
         $398 = HEAP32[$397>>2]|0;
         $399 = ($398|0)==(0|0);
         do {
          if (!($399)) {
           $400 = ($398>>>0)<($394>>>0);
           if ($400) {
            _abort();
            // unreachable;
           } else {
            $401 = (($R$1$i20) + 16|0);
            HEAP32[$401>>2] = $398;
            $402 = (($398) + 24|0);
            HEAP32[$402>>2] = $R$1$i20;
            break;
           }
          }
         } while(0);
         $403 = (($v$3$lcssa$i) + 20|0);
         $404 = HEAP32[$403>>2]|0;
         $405 = ($404|0)==(0|0);
         if (!($405)) {
          $406 = HEAP32[((125000 + 16|0))>>2]|0;
          $407 = ($404>>>0)<($406>>>0);
          if ($407) {
           _abort();
           // unreachable;
          } else {
           $408 = (($R$1$i20) + 20|0);
           HEAP32[$408>>2] = $404;
           $409 = (($404) + 24|0);
           HEAP32[$409>>2] = $R$1$i20;
           break;
          }
         }
        }
       } while(0);
       $410 = ($rsize$3$lcssa$i>>>0)<(16);
       L95: do {
        if ($410) {
         $411 = (($rsize$3$lcssa$i) + ($246))|0;
         $412 = $411 | 3;
         $413 = (($v$3$lcssa$i) + 4|0);
         HEAP32[$413>>2] = $412;
         $$sum18$i = (($411) + 4)|0;
         $414 = (($v$3$lcssa$i) + ($$sum18$i)|0);
         $415 = HEAP32[$414>>2]|0;
         $416 = $415 | 1;
         HEAP32[$414>>2] = $416;
        } else {
         $417 = $246 | 3;
         $418 = (($v$3$lcssa$i) + 4|0);
         HEAP32[$418>>2] = $417;
         $419 = $rsize$3$lcssa$i | 1;
         $$sum$i2338 = $246 | 4;
         $420 = (($v$3$lcssa$i) + ($$sum$i2338)|0);
         HEAP32[$420>>2] = $419;
         $$sum1$i24 = (($rsize$3$lcssa$i) + ($246))|0;
         $421 = (($v$3$lcssa$i) + ($$sum1$i24)|0);
         HEAP32[$421>>2] = $rsize$3$lcssa$i;
         $422 = $rsize$3$lcssa$i >>> 3;
         $423 = ($rsize$3$lcssa$i>>>0)<(256);
         if ($423) {
          $424 = $422 << 1;
          $425 = ((125000 + ($424<<2)|0) + 40|0);
          $426 = HEAP32[125000>>2]|0;
          $427 = 1 << $422;
          $428 = $426 & $427;
          $429 = ($428|0)==(0);
          do {
           if ($429) {
            $430 = $426 | $427;
            HEAP32[125000>>2] = $430;
            $$sum14$pre$i = (($424) + 2)|0;
            $$pre$i25 = ((125000 + ($$sum14$pre$i<<2)|0) + 40|0);
            $$pre$phi$i26Z2D = $$pre$i25;$F5$0$i = $425;
           } else {
            $$sum17$i = (($424) + 2)|0;
            $431 = ((125000 + ($$sum17$i<<2)|0) + 40|0);
            $432 = HEAP32[$431>>2]|0;
            $433 = HEAP32[((125000 + 16|0))>>2]|0;
            $434 = ($432>>>0)<($433>>>0);
            if (!($434)) {
             $$pre$phi$i26Z2D = $431;$F5$0$i = $432;
             break;
            }
            _abort();
            // unreachable;
           }
          } while(0);
          HEAP32[$$pre$phi$i26Z2D>>2] = $348;
          $435 = (($F5$0$i) + 12|0);
          HEAP32[$435>>2] = $348;
          $$sum15$i = (($246) + 8)|0;
          $436 = (($v$3$lcssa$i) + ($$sum15$i)|0);
          HEAP32[$436>>2] = $F5$0$i;
          $$sum16$i = (($246) + 12)|0;
          $437 = (($v$3$lcssa$i) + ($$sum16$i)|0);
          HEAP32[$437>>2] = $425;
          break;
         }
         $438 = $rsize$3$lcssa$i >>> 8;
         $439 = ($438|0)==(0);
         if ($439) {
          $I7$0$i = 0;
         } else {
          $440 = ($rsize$3$lcssa$i>>>0)>(16777215);
          if ($440) {
           $I7$0$i = 31;
          } else {
           $441 = (($438) + 1048320)|0;
           $442 = $441 >>> 16;
           $443 = $442 & 8;
           $444 = $438 << $443;
           $445 = (($444) + 520192)|0;
           $446 = $445 >>> 16;
           $447 = $446 & 4;
           $448 = $447 | $443;
           $449 = $444 << $447;
           $450 = (($449) + 245760)|0;
           $451 = $450 >>> 16;
           $452 = $451 & 2;
           $453 = $448 | $452;
           $454 = (14 - ($453))|0;
           $455 = $449 << $452;
           $456 = $455 >>> 15;
           $457 = (($454) + ($456))|0;
           $458 = $457 << 1;
           $459 = (($457) + 7)|0;
           $460 = $rsize$3$lcssa$i >>> $459;
           $461 = $460 & 1;
           $462 = $461 | $458;
           $I7$0$i = $462;
          }
         }
         $463 = ((125000 + ($I7$0$i<<2)|0) + 304|0);
         $$sum2$i = (($246) + 28)|0;
         $464 = (($v$3$lcssa$i) + ($$sum2$i)|0);
         HEAP32[$464>>2] = $I7$0$i;
         $$sum3$i27 = (($246) + 16)|0;
         $465 = (($v$3$lcssa$i) + ($$sum3$i27)|0);
         $$sum4$i28 = (($246) + 20)|0;
         $466 = (($v$3$lcssa$i) + ($$sum4$i28)|0);
         HEAP32[$466>>2] = 0;
         HEAP32[$465>>2] = 0;
         $467 = HEAP32[((125000 + 4|0))>>2]|0;
         $468 = 1 << $I7$0$i;
         $469 = $467 & $468;
         $470 = ($469|0)==(0);
         if ($470) {
          $471 = $467 | $468;
          HEAP32[((125000 + 4|0))>>2] = $471;
          HEAP32[$463>>2] = $348;
          $$sum5$i = (($246) + 24)|0;
          $472 = (($v$3$lcssa$i) + ($$sum5$i)|0);
          HEAP32[$472>>2] = $463;
          $$sum6$i = (($246) + 12)|0;
          $473 = (($v$3$lcssa$i) + ($$sum6$i)|0);
          HEAP32[$473>>2] = $348;
          $$sum7$i = (($246) + 8)|0;
          $474 = (($v$3$lcssa$i) + ($$sum7$i)|0);
          HEAP32[$474>>2] = $348;
          break;
         }
         $475 = HEAP32[$463>>2]|0;
         $476 = ($I7$0$i|0)==(31);
         if ($476) {
          $484 = 0;
         } else {
          $477 = $I7$0$i >>> 1;
          $478 = (25 - ($477))|0;
          $484 = $478;
         }
         $479 = (($475) + 4|0);
         $480 = HEAP32[$479>>2]|0;
         $481 = $480 & -8;
         $482 = ($481|0)==($rsize$3$lcssa$i|0);
         do {
          if ($482) {
           $T$0$lcssa$i = $475;
          } else {
           $483 = $rsize$3$lcssa$i << $484;
           $K12$029$i = $483;$T$028$i = $475;
           while(1) {
            $491 = $K12$029$i >>> 31;
            $492 = ((($T$028$i) + ($491<<2)|0) + 16|0);
            $487 = HEAP32[$492>>2]|0;
            $493 = ($487|0)==(0|0);
            if ($493) {
             $$lcssa134 = $492;$T$028$i$lcssa = $T$028$i;
             break;
            }
            $485 = $K12$029$i << 1;
            $486 = (($487) + 4|0);
            $488 = HEAP32[$486>>2]|0;
            $489 = $488 & -8;
            $490 = ($489|0)==($rsize$3$lcssa$i|0);
            if ($490) {
             $$lcssa137 = $487;
             label = 163;
             break;
            } else {
             $K12$029$i = $485;$T$028$i = $487;
            }
           }
           if ((label|0) == 163) {
            $T$0$lcssa$i = $$lcssa137;
            break;
           }
           $494 = HEAP32[((125000 + 16|0))>>2]|0;
           $495 = ($$lcssa134>>>0)<($494>>>0);
           if ($495) {
            _abort();
            // unreachable;
           } else {
            HEAP32[$$lcssa134>>2] = $348;
            $$sum11$i = (($246) + 24)|0;
            $496 = (($v$3$lcssa$i) + ($$sum11$i)|0);
            HEAP32[$496>>2] = $T$028$i$lcssa;
            $$sum12$i = (($246) + 12)|0;
            $497 = (($v$3$lcssa$i) + ($$sum12$i)|0);
            HEAP32[$497>>2] = $348;
            $$sum13$i = (($246) + 8)|0;
            $498 = (($v$3$lcssa$i) + ($$sum13$i)|0);
            HEAP32[$498>>2] = $348;
            break L95;
           }
          }
         } while(0);
         $499 = (($T$0$lcssa$i) + 8|0);
         $500 = HEAP32[$499>>2]|0;
         $501 = HEAP32[((125000 + 16|0))>>2]|0;
         $502 = ($T$0$lcssa$i>>>0)>=($501>>>0);
         $503 = ($500>>>0)>=($501>>>0);
         $or$cond24$i = $502 & $503;
         if ($or$cond24$i) {
          $504 = (($500) + 12|0);
          HEAP32[$504>>2] = $348;
          HEAP32[$499>>2] = $348;
          $$sum8$i = (($246) + 8)|0;
          $505 = (($v$3$lcssa$i) + ($$sum8$i)|0);
          HEAP32[$505>>2] = $500;
          $$sum9$i = (($246) + 12)|0;
          $506 = (($v$3$lcssa$i) + ($$sum9$i)|0);
          HEAP32[$506>>2] = $T$0$lcssa$i;
          $$sum10$i = (($246) + 24)|0;
          $507 = (($v$3$lcssa$i) + ($$sum10$i)|0);
          HEAP32[$507>>2] = 0;
          break;
         } else {
          _abort();
          // unreachable;
         }
        }
       } while(0);
       $508 = (($v$3$lcssa$i) + 8|0);
       $mem$0 = $508;
       return ($mem$0|0);
      } else {
       $nb$0 = $246;
      }
     }
    }
   }
  }
 } while(0);
 $509 = HEAP32[((125000 + 8|0))>>2]|0;
 $510 = ($509>>>0)<($nb$0>>>0);
 if (!($510)) {
  $511 = (($509) - ($nb$0))|0;
  $512 = HEAP32[((125000 + 20|0))>>2]|0;
  $513 = ($511>>>0)>(15);
  if ($513) {
   $514 = (($512) + ($nb$0)|0);
   HEAP32[((125000 + 20|0))>>2] = $514;
   HEAP32[((125000 + 8|0))>>2] = $511;
   $515 = $511 | 1;
   $$sum2 = (($nb$0) + 4)|0;
   $516 = (($512) + ($$sum2)|0);
   HEAP32[$516>>2] = $515;
   $517 = (($512) + ($509)|0);
   HEAP32[$517>>2] = $511;
   $518 = $nb$0 | 3;
   $519 = (($512) + 4|0);
   HEAP32[$519>>2] = $518;
  } else {
   HEAP32[((125000 + 8|0))>>2] = 0;
   HEAP32[((125000 + 20|0))>>2] = 0;
   $520 = $509 | 3;
   $521 = (($512) + 4|0);
   HEAP32[$521>>2] = $520;
   $$sum1 = (($509) + 4)|0;
   $522 = (($512) + ($$sum1)|0);
   $523 = HEAP32[$522>>2]|0;
   $524 = $523 | 1;
   HEAP32[$522>>2] = $524;
  }
  $525 = (($512) + 8|0);
  $mem$0 = $525;
  return ($mem$0|0);
 }
 $526 = HEAP32[((125000 + 12|0))>>2]|0;
 $527 = ($526>>>0)>($nb$0>>>0);
 if ($527) {
  $528 = (($526) - ($nb$0))|0;
  HEAP32[((125000 + 12|0))>>2] = $528;
  $529 = HEAP32[((125000 + 24|0))>>2]|0;
  $530 = (($529) + ($nb$0)|0);
  HEAP32[((125000 + 24|0))>>2] = $530;
  $531 = $528 | 1;
  $$sum = (($nb$0) + 4)|0;
  $532 = (($529) + ($$sum)|0);
  HEAP32[$532>>2] = $531;
  $533 = $nb$0 | 3;
  $534 = (($529) + 4|0);
  HEAP32[$534>>2] = $533;
  $535 = (($529) + 8|0);
  $mem$0 = $535;
  return ($mem$0|0);
 }
 $536 = HEAP32[125472>>2]|0;
 $537 = ($536|0)==(0);
 do {
  if ($537) {
   $538 = (_sysconf(30)|0);
   $539 = (($538) + -1)|0;
   $540 = $539 & $538;
   $541 = ($540|0)==(0);
   if ($541) {
    HEAP32[((125472 + 8|0))>>2] = $538;
    HEAP32[((125472 + 4|0))>>2] = $538;
    HEAP32[((125472 + 12|0))>>2] = -1;
    HEAP32[((125472 + 16|0))>>2] = -1;
    HEAP32[((125472 + 20|0))>>2] = 0;
    HEAP32[((125000 + 444|0))>>2] = 0;
    $542 = (_time((0|0))|0);
    $543 = $542 & -16;
    $544 = $543 ^ 1431655768;
    HEAP32[125472>>2] = $544;
    break;
   } else {
    _abort();
    // unreachable;
   }
  }
 } while(0);
 $545 = (($nb$0) + 48)|0;
 $546 = HEAP32[((125472 + 8|0))>>2]|0;
 $547 = (($nb$0) + 47)|0;
 $548 = (($546) + ($547))|0;
 $549 = (0 - ($546))|0;
 $550 = $548 & $549;
 $551 = ($550>>>0)>($nb$0>>>0);
 if (!($551)) {
  $mem$0 = 0;
  return ($mem$0|0);
 }
 $552 = HEAP32[((125000 + 440|0))>>2]|0;
 $553 = ($552|0)==(0);
 if (!($553)) {
  $554 = HEAP32[((125000 + 432|0))>>2]|0;
  $555 = (($554) + ($550))|0;
  $556 = ($555>>>0)<=($554>>>0);
  $557 = ($555>>>0)>($552>>>0);
  $or$cond1$i = $556 | $557;
  if ($or$cond1$i) {
   $mem$0 = 0;
   return ($mem$0|0);
  }
 }
 $558 = HEAP32[((125000 + 444|0))>>2]|0;
 $559 = $558 & 4;
 $560 = ($559|0)==(0);
 L279: do {
  if ($560) {
   $561 = HEAP32[((125000 + 24|0))>>2]|0;
   $562 = ($561|0)==(0|0);
   do {
    if ($562) {
     label = 191;
    } else {
     $sp$0$i$i = ((125000 + 448|0));
     while(1) {
      $563 = HEAP32[$sp$0$i$i>>2]|0;
      $564 = ($563>>>0)>($561>>>0);
      if (!($564)) {
       $565 = (($sp$0$i$i) + 4|0);
       $566 = HEAP32[$565>>2]|0;
       $567 = (($563) + ($566)|0);
       $568 = ($567>>>0)>($561>>>0);
       if ($568) {
        $$lcssa130 = $sp$0$i$i;$$lcssa132 = $565;$sp$0$i$i$lcssa = $sp$0$i$i;
        break;
       }
      }
      $569 = (($sp$0$i$i) + 8|0);
      $570 = HEAP32[$569>>2]|0;
      $571 = ($570|0)==(0|0);
      if ($571) {
       label = 190;
       break;
      } else {
       $sp$0$i$i = $570;
      }
     }
     if ((label|0) == 190) {
      label = 191;
      break;
     }
     $572 = ($sp$0$i$i$lcssa|0)==(0|0);
     if ($572) {
      label = 191;
     } else {
      $595 = HEAP32[((125000 + 12|0))>>2]|0;
      $596 = (($548) - ($595))|0;
      $597 = $596 & $549;
      $598 = ($597>>>0)<(2147483647);
      if ($598) {
       $599 = (_sbrk(($597|0))|0);
       $600 = HEAP32[$$lcssa130>>2]|0;
       $601 = HEAP32[$$lcssa132>>2]|0;
       $602 = (($600) + ($601)|0);
       $603 = ($599|0)==($602|0);
       if ($603) {
        $br$0$i = $599;$ssize$1$i = $597;
        label = 200;
       } else {
        $br$030$i = $599;$ssize$129$i = $597;
        label = 201;
       }
      } else {
       $tsize$03141$i = 0;
      }
     }
    }
   } while(0);
   do {
    if ((label|0) == 191) {
     $573 = (_sbrk(0)|0);
     $574 = ($573|0)==((-1)|0);
     if ($574) {
      $tsize$03141$i = 0;
     } else {
      $575 = $573;
      $576 = HEAP32[((125472 + 4|0))>>2]|0;
      $577 = (($576) + -1)|0;
      $578 = $577 & $575;
      $579 = ($578|0)==(0);
      if ($579) {
       $ssize$0$i = $550;
      } else {
       $580 = (($577) + ($575))|0;
       $581 = (0 - ($576))|0;
       $582 = $580 & $581;
       $583 = (($550) - ($575))|0;
       $584 = (($583) + ($582))|0;
       $ssize$0$i = $584;
      }
      $585 = HEAP32[((125000 + 432|0))>>2]|0;
      $586 = (($585) + ($ssize$0$i))|0;
      $587 = ($ssize$0$i>>>0)>($nb$0>>>0);
      $588 = ($ssize$0$i>>>0)<(2147483647);
      $or$cond$i29 = $587 & $588;
      if ($or$cond$i29) {
       $589 = HEAP32[((125000 + 440|0))>>2]|0;
       $590 = ($589|0)==(0);
       if (!($590)) {
        $591 = ($586>>>0)<=($585>>>0);
        $592 = ($586>>>0)>($589>>>0);
        $or$cond2$i = $591 | $592;
        if ($or$cond2$i) {
         $tsize$03141$i = 0;
         break;
        }
       }
       $593 = (_sbrk(($ssize$0$i|0))|0);
       $594 = ($593|0)==($573|0);
       if ($594) {
        $br$0$i = $573;$ssize$1$i = $ssize$0$i;
        label = 200;
       } else {
        $br$030$i = $593;$ssize$129$i = $ssize$0$i;
        label = 201;
       }
      } else {
       $tsize$03141$i = 0;
      }
     }
    }
   } while(0);
   L303: do {
    if ((label|0) == 200) {
     $604 = ($br$0$i|0)==((-1)|0);
     if ($604) {
      $tsize$03141$i = $ssize$1$i;
     } else {
      $tbase$245$i = $br$0$i;$tsize$244$i = $ssize$1$i;
      label = 211;
      break L279;
     }
    }
    else if ((label|0) == 201) {
     $605 = (0 - ($ssize$129$i))|0;
     $606 = ($br$030$i|0)!=((-1)|0);
     $607 = ($ssize$129$i>>>0)<(2147483647);
     $or$cond5$i = $606 & $607;
     $608 = ($545>>>0)>($ssize$129$i>>>0);
     $or$cond4$i = $or$cond5$i & $608;
     do {
      if ($or$cond4$i) {
       $609 = HEAP32[((125472 + 8|0))>>2]|0;
       $610 = (($547) - ($ssize$129$i))|0;
       $611 = (($610) + ($609))|0;
       $612 = (0 - ($609))|0;
       $613 = $611 & $612;
       $614 = ($613>>>0)<(2147483647);
       if ($614) {
        $615 = (_sbrk(($613|0))|0);
        $616 = ($615|0)==((-1)|0);
        if ($616) {
         (_sbrk(($605|0))|0);
         $tsize$03141$i = 0;
         break L303;
        } else {
         $617 = (($613) + ($ssize$129$i))|0;
         $ssize$2$i = $617;
         break;
        }
       } else {
        $ssize$2$i = $ssize$129$i;
       }
      } else {
       $ssize$2$i = $ssize$129$i;
      }
     } while(0);
     $618 = ($br$030$i|0)==((-1)|0);
     if ($618) {
      $tsize$03141$i = 0;
     } else {
      $tbase$245$i = $br$030$i;$tsize$244$i = $ssize$2$i;
      label = 211;
      break L279;
     }
    }
   } while(0);
   $619 = HEAP32[((125000 + 444|0))>>2]|0;
   $620 = $619 | 4;
   HEAP32[((125000 + 444|0))>>2] = $620;
   $tsize$1$i = $tsize$03141$i;
   label = 208;
  } else {
   $tsize$1$i = 0;
   label = 208;
  }
 } while(0);
 if ((label|0) == 208) {
  $621 = ($550>>>0)<(2147483647);
  if ($621) {
   $622 = (_sbrk(($550|0))|0);
   $623 = (_sbrk(0)|0);
   $624 = ($622|0)!=((-1)|0);
   $625 = ($623|0)!=((-1)|0);
   $or$cond3$i = $624 & $625;
   $626 = ($622>>>0)<($623>>>0);
   $or$cond6$i = $or$cond3$i & $626;
   if ($or$cond6$i) {
    $627 = $623;
    $628 = $622;
    $629 = (($627) - ($628))|0;
    $630 = (($nb$0) + 40)|0;
    $631 = ($629>>>0)>($630>>>0);
    $$tsize$1$i = $631 ? $629 : $tsize$1$i;
    if ($631) {
     $tbase$245$i = $622;$tsize$244$i = $$tsize$1$i;
     label = 211;
    }
   }
  }
 }
 if ((label|0) == 211) {
  $632 = HEAP32[((125000 + 432|0))>>2]|0;
  $633 = (($632) + ($tsize$244$i))|0;
  HEAP32[((125000 + 432|0))>>2] = $633;
  $634 = HEAP32[((125000 + 436|0))>>2]|0;
  $635 = ($633>>>0)>($634>>>0);
  if ($635) {
   HEAP32[((125000 + 436|0))>>2] = $633;
  }
  $636 = HEAP32[((125000 + 24|0))>>2]|0;
  $637 = ($636|0)==(0|0);
  L323: do {
   if ($637) {
    $638 = HEAP32[((125000 + 16|0))>>2]|0;
    $639 = ($638|0)==(0|0);
    $640 = ($tbase$245$i>>>0)<($638>>>0);
    $or$cond8$i = $639 | $640;
    if ($or$cond8$i) {
     HEAP32[((125000 + 16|0))>>2] = $tbase$245$i;
    }
    HEAP32[((125000 + 448|0))>>2] = $tbase$245$i;
    HEAP32[((125000 + 452|0))>>2] = $tsize$244$i;
    HEAP32[((125000 + 460|0))>>2] = 0;
    $641 = HEAP32[125472>>2]|0;
    HEAP32[((125000 + 36|0))>>2] = $641;
    HEAP32[((125000 + 32|0))>>2] = -1;
    $i$02$i$i = 0;
    while(1) {
     $642 = $i$02$i$i << 1;
     $643 = ((125000 + ($642<<2)|0) + 40|0);
     $$sum$i$i = (($642) + 3)|0;
     $644 = ((125000 + ($$sum$i$i<<2)|0) + 40|0);
     HEAP32[$644>>2] = $643;
     $$sum1$i$i = (($642) + 2)|0;
     $645 = ((125000 + ($$sum1$i$i<<2)|0) + 40|0);
     HEAP32[$645>>2] = $643;
     $646 = (($i$02$i$i) + 1)|0;
     $exitcond$i$i = ($646|0)==(32);
     if ($exitcond$i$i) {
      break;
     } else {
      $i$02$i$i = $646;
     }
    }
    $647 = (($tsize$244$i) + -40)|0;
    $648 = (($tbase$245$i) + 8|0);
    $649 = $648;
    $650 = $649 & 7;
    $651 = ($650|0)==(0);
    if ($651) {
     $655 = 0;
    } else {
     $652 = (0 - ($649))|0;
     $653 = $652 & 7;
     $655 = $653;
    }
    $654 = (($tbase$245$i) + ($655)|0);
    $656 = (($647) - ($655))|0;
    HEAP32[((125000 + 24|0))>>2] = $654;
    HEAP32[((125000 + 12|0))>>2] = $656;
    $657 = $656 | 1;
    $$sum$i12$i = (($655) + 4)|0;
    $658 = (($tbase$245$i) + ($$sum$i12$i)|0);
    HEAP32[$658>>2] = $657;
    $$sum2$i$i = (($tsize$244$i) + -36)|0;
    $659 = (($tbase$245$i) + ($$sum2$i$i)|0);
    HEAP32[$659>>2] = 40;
    $660 = HEAP32[((125472 + 16|0))>>2]|0;
    HEAP32[((125000 + 28|0))>>2] = $660;
   } else {
    $sp$074$i = ((125000 + 448|0));
    while(1) {
     $661 = HEAP32[$sp$074$i>>2]|0;
     $662 = (($sp$074$i) + 4|0);
     $663 = HEAP32[$662>>2]|0;
     $664 = (($661) + ($663)|0);
     $665 = ($tbase$245$i|0)==($664|0);
     if ($665) {
      $$lcssa123 = $661;$$lcssa125 = $662;$$lcssa127 = $663;$sp$074$i$lcssa = $sp$074$i;
      label = 224;
      break;
     }
     $666 = (($sp$074$i) + 8|0);
     $667 = HEAP32[$666>>2]|0;
     $668 = ($667|0)==(0|0);
     if ($668) {
      label = 229;
      break;
     } else {
      $sp$074$i = $667;
     }
    }
    if ((label|0) == 224) {
     $669 = (($sp$074$i$lcssa) + 12|0);
     $670 = HEAP32[$669>>2]|0;
     $671 = $670 & 8;
     $672 = ($671|0)==(0);
     if ($672) {
      $673 = ($636>>>0)>=($$lcssa123>>>0);
      $674 = ($636>>>0)<($tbase$245$i>>>0);
      $or$cond47$i = $673 & $674;
      if ($or$cond47$i) {
       $675 = (($$lcssa127) + ($tsize$244$i))|0;
       HEAP32[$$lcssa125>>2] = $675;
       $676 = HEAP32[((125000 + 12|0))>>2]|0;
       $677 = (($676) + ($tsize$244$i))|0;
       $678 = (($636) + 8|0);
       $679 = $678;
       $680 = $679 & 7;
       $681 = ($680|0)==(0);
       if ($681) {
        $685 = 0;
       } else {
        $682 = (0 - ($679))|0;
        $683 = $682 & 7;
        $685 = $683;
       }
       $684 = (($636) + ($685)|0);
       $686 = (($677) - ($685))|0;
       HEAP32[((125000 + 24|0))>>2] = $684;
       HEAP32[((125000 + 12|0))>>2] = $686;
       $687 = $686 | 1;
       $$sum$i16$i = (($685) + 4)|0;
       $688 = (($636) + ($$sum$i16$i)|0);
       HEAP32[$688>>2] = $687;
       $$sum2$i17$i = (($677) + 4)|0;
       $689 = (($636) + ($$sum2$i17$i)|0);
       HEAP32[$689>>2] = 40;
       $690 = HEAP32[((125472 + 16|0))>>2]|0;
       HEAP32[((125000 + 28|0))>>2] = $690;
       break;
      }
     }
    }
    else if ((label|0) == 229) {
    }
    $691 = HEAP32[((125000 + 16|0))>>2]|0;
    $692 = ($tbase$245$i>>>0)<($691>>>0);
    if ($692) {
     HEAP32[((125000 + 16|0))>>2] = $tbase$245$i;
     $756 = $tbase$245$i;
    } else {
     $756 = $691;
    }
    $693 = (($tbase$245$i) + ($tsize$244$i)|0);
    $sp$173$i = ((125000 + 448|0));
    while(1) {
     $694 = HEAP32[$sp$173$i>>2]|0;
     $695 = ($694|0)==($693|0);
     if ($695) {
      $$lcssa120 = $sp$173$i;$sp$173$i$lcssa = $sp$173$i;
      label = 235;
      break;
     }
     $696 = (($sp$173$i) + 8|0);
     $697 = HEAP32[$696>>2]|0;
     $698 = ($697|0)==(0|0);
     if ($698) {
      label = 319;
      break;
     } else {
      $sp$173$i = $697;
     }
    }
    if ((label|0) == 235) {
     $699 = (($sp$173$i$lcssa) + 12|0);
     $700 = HEAP32[$699>>2]|0;
     $701 = $700 & 8;
     $702 = ($701|0)==(0);
     if ($702) {
      HEAP32[$$lcssa120>>2] = $tbase$245$i;
      $703 = (($sp$173$i$lcssa) + 4|0);
      $704 = HEAP32[$703>>2]|0;
      $705 = (($704) + ($tsize$244$i))|0;
      HEAP32[$703>>2] = $705;
      $706 = (($tbase$245$i) + 8|0);
      $707 = $706;
      $708 = $707 & 7;
      $709 = ($708|0)==(0);
      if ($709) {
       $713 = 0;
      } else {
       $710 = (0 - ($707))|0;
       $711 = $710 & 7;
       $713 = $711;
      }
      $712 = (($tbase$245$i) + ($713)|0);
      $$sum102$i = (($tsize$244$i) + 8)|0;
      $714 = (($tbase$245$i) + ($$sum102$i)|0);
      $715 = $714;
      $716 = $715 & 7;
      $717 = ($716|0)==(0);
      if ($717) {
       $720 = 0;
      } else {
       $718 = (0 - ($715))|0;
       $719 = $718 & 7;
       $720 = $719;
      }
      $$sum103$i = (($720) + ($tsize$244$i))|0;
      $721 = (($tbase$245$i) + ($$sum103$i)|0);
      $722 = $721;
      $723 = $712;
      $724 = (($722) - ($723))|0;
      $$sum$i19$i = (($713) + ($nb$0))|0;
      $725 = (($tbase$245$i) + ($$sum$i19$i)|0);
      $726 = (($724) - ($nb$0))|0;
      $727 = $nb$0 | 3;
      $$sum1$i20$i = (($713) + 4)|0;
      $728 = (($tbase$245$i) + ($$sum1$i20$i)|0);
      HEAP32[$728>>2] = $727;
      $729 = ($721|0)==($636|0);
      L353: do {
       if ($729) {
        $730 = HEAP32[((125000 + 12|0))>>2]|0;
        $731 = (($730) + ($726))|0;
        HEAP32[((125000 + 12|0))>>2] = $731;
        HEAP32[((125000 + 24|0))>>2] = $725;
        $732 = $731 | 1;
        $$sum42$i$i = (($$sum$i19$i) + 4)|0;
        $733 = (($tbase$245$i) + ($$sum42$i$i)|0);
        HEAP32[$733>>2] = $732;
       } else {
        $734 = HEAP32[((125000 + 20|0))>>2]|0;
        $735 = ($721|0)==($734|0);
        if ($735) {
         $736 = HEAP32[((125000 + 8|0))>>2]|0;
         $737 = (($736) + ($726))|0;
         HEAP32[((125000 + 8|0))>>2] = $737;
         HEAP32[((125000 + 20|0))>>2] = $725;
         $738 = $737 | 1;
         $$sum40$i$i = (($$sum$i19$i) + 4)|0;
         $739 = (($tbase$245$i) + ($$sum40$i$i)|0);
         HEAP32[$739>>2] = $738;
         $$sum41$i$i = (($737) + ($$sum$i19$i))|0;
         $740 = (($tbase$245$i) + ($$sum41$i$i)|0);
         HEAP32[$740>>2] = $737;
         break;
        }
        $$sum2$i21$i = (($tsize$244$i) + 4)|0;
        $$sum104$i = (($$sum2$i21$i) + ($720))|0;
        $741 = (($tbase$245$i) + ($$sum104$i)|0);
        $742 = HEAP32[$741>>2]|0;
        $743 = $742 & 3;
        $744 = ($743|0)==(1);
        if ($744) {
         $745 = $742 & -8;
         $746 = $742 >>> 3;
         $747 = ($742>>>0)<(256);
         L360: do {
          if ($747) {
           $$sum3738$i$i = $720 | 8;
           $$sum114$i = (($$sum3738$i$i) + ($tsize$244$i))|0;
           $748 = (($tbase$245$i) + ($$sum114$i)|0);
           $749 = HEAP32[$748>>2]|0;
           $$sum39$i$i = (($tsize$244$i) + 12)|0;
           $$sum115$i = (($$sum39$i$i) + ($720))|0;
           $750 = (($tbase$245$i) + ($$sum115$i)|0);
           $751 = HEAP32[$750>>2]|0;
           $752 = $746 << 1;
           $753 = ((125000 + ($752<<2)|0) + 40|0);
           $754 = ($749|0)==($753|0);
           do {
            if (!($754)) {
             $755 = ($749>>>0)<($756>>>0);
             if ($755) {
              _abort();
              // unreachable;
             }
             $757 = (($749) + 12|0);
             $758 = HEAP32[$757>>2]|0;
             $759 = ($758|0)==($721|0);
             if ($759) {
              break;
             }
             _abort();
             // unreachable;
            }
           } while(0);
           $760 = ($751|0)==($749|0);
           if ($760) {
            $761 = 1 << $746;
            $762 = $761 ^ -1;
            $763 = HEAP32[125000>>2]|0;
            $764 = $763 & $762;
            HEAP32[125000>>2] = $764;
            break;
           }
           $765 = ($751|0)==($753|0);
           do {
            if ($765) {
             $$pre58$i$i = (($751) + 8|0);
             $$pre$phi59$i$iZ2D = $$pre58$i$i;
            } else {
             $766 = ($751>>>0)<($756>>>0);
             if ($766) {
              _abort();
              // unreachable;
             }
             $767 = (($751) + 8|0);
             $768 = HEAP32[$767>>2]|0;
             $769 = ($768|0)==($721|0);
             if ($769) {
              $$pre$phi59$i$iZ2D = $767;
              break;
             }
             _abort();
             // unreachable;
            }
           } while(0);
           $770 = (($749) + 12|0);
           HEAP32[$770>>2] = $751;
           HEAP32[$$pre$phi59$i$iZ2D>>2] = $749;
          } else {
           $$sum34$i$i = $720 | 24;
           $$sum105$i = (($$sum34$i$i) + ($tsize$244$i))|0;
           $771 = (($tbase$245$i) + ($$sum105$i)|0);
           $772 = HEAP32[$771>>2]|0;
           $$sum5$i$i = (($tsize$244$i) + 12)|0;
           $$sum106$i = (($$sum5$i$i) + ($720))|0;
           $773 = (($tbase$245$i) + ($$sum106$i)|0);
           $774 = HEAP32[$773>>2]|0;
           $775 = ($774|0)==($721|0);
           do {
            if ($775) {
             $$sum67$i$i = $720 | 16;
             $$sum112$i = (($$sum2$i21$i) + ($$sum67$i$i))|0;
             $785 = (($tbase$245$i) + ($$sum112$i)|0);
             $786 = HEAP32[$785>>2]|0;
             $787 = ($786|0)==(0|0);
             if ($787) {
              $$sum113$i = (($$sum67$i$i) + ($tsize$244$i))|0;
              $788 = (($tbase$245$i) + ($$sum113$i)|0);
              $789 = HEAP32[$788>>2]|0;
              $790 = ($789|0)==(0|0);
              if ($790) {
               $R$1$i$i = 0;
               break;
              } else {
               $R$0$i$i$ph = $789;$RP$0$i$i$ph = $788;
              }
             } else {
              $R$0$i$i$ph = $786;$RP$0$i$i$ph = $785;
             }
             $R$0$i$i = $R$0$i$i$ph;$RP$0$i$i = $RP$0$i$i$ph;
             while(1) {
              $791 = (($R$0$i$i) + 20|0);
              $792 = HEAP32[$791>>2]|0;
              $793 = ($792|0)==(0|0);
              if ($793) {
               $794 = (($R$0$i$i) + 16|0);
               $795 = HEAP32[$794>>2]|0;
               $796 = ($795|0)==(0|0);
               if ($796) {
                $R$0$i$i$lcssa = $R$0$i$i;$RP$0$i$i$lcssa = $RP$0$i$i;
                break;
               } else {
                $R$0$i$i$be = $795;$RP$0$i$i$be = $794;
               }
              } else {
               $R$0$i$i$be = $792;$RP$0$i$i$be = $791;
              }
              $R$0$i$i = $R$0$i$i$be;$RP$0$i$i = $RP$0$i$i$be;
             }
             $797 = ($RP$0$i$i$lcssa>>>0)<($756>>>0);
             if ($797) {
              _abort();
              // unreachable;
             } else {
              HEAP32[$RP$0$i$i$lcssa>>2] = 0;
              $R$1$i$i = $R$0$i$i$lcssa;
              break;
             }
            } else {
             $$sum3536$i$i = $720 | 8;
             $$sum107$i = (($$sum3536$i$i) + ($tsize$244$i))|0;
             $776 = (($tbase$245$i) + ($$sum107$i)|0);
             $777 = HEAP32[$776>>2]|0;
             $778 = ($777>>>0)<($756>>>0);
             if ($778) {
              _abort();
              // unreachable;
             }
             $779 = (($777) + 12|0);
             $780 = HEAP32[$779>>2]|0;
             $781 = ($780|0)==($721|0);
             if (!($781)) {
              _abort();
              // unreachable;
             }
             $782 = (($774) + 8|0);
             $783 = HEAP32[$782>>2]|0;
             $784 = ($783|0)==($721|0);
             if ($784) {
              HEAP32[$779>>2] = $774;
              HEAP32[$782>>2] = $777;
              $R$1$i$i = $774;
              break;
             } else {
              _abort();
              // unreachable;
             }
            }
           } while(0);
           $798 = ($772|0)==(0|0);
           if ($798) {
            break;
           }
           $$sum30$i$i = (($tsize$244$i) + 28)|0;
           $$sum108$i = (($$sum30$i$i) + ($720))|0;
           $799 = (($tbase$245$i) + ($$sum108$i)|0);
           $800 = HEAP32[$799>>2]|0;
           $801 = ((125000 + ($800<<2)|0) + 304|0);
           $802 = HEAP32[$801>>2]|0;
           $803 = ($721|0)==($802|0);
           do {
            if ($803) {
             HEAP32[$801>>2] = $R$1$i$i;
             $cond$i$i = ($R$1$i$i|0)==(0|0);
             if (!($cond$i$i)) {
              break;
             }
             $804 = 1 << $800;
             $805 = $804 ^ -1;
             $806 = HEAP32[((125000 + 4|0))>>2]|0;
             $807 = $806 & $805;
             HEAP32[((125000 + 4|0))>>2] = $807;
             break L360;
            } else {
             $808 = HEAP32[((125000 + 16|0))>>2]|0;
             $809 = ($772>>>0)<($808>>>0);
             if ($809) {
              _abort();
              // unreachable;
             }
             $810 = (($772) + 16|0);
             $811 = HEAP32[$810>>2]|0;
             $812 = ($811|0)==($721|0);
             if ($812) {
              HEAP32[$810>>2] = $R$1$i$i;
             } else {
              $813 = (($772) + 20|0);
              HEAP32[$813>>2] = $R$1$i$i;
             }
             $814 = ($R$1$i$i|0)==(0|0);
             if ($814) {
              break L360;
             }
            }
           } while(0);
           $815 = HEAP32[((125000 + 16|0))>>2]|0;
           $816 = ($R$1$i$i>>>0)<($815>>>0);
           if ($816) {
            _abort();
            // unreachable;
           }
           $817 = (($R$1$i$i) + 24|0);
           HEAP32[$817>>2] = $772;
           $$sum3132$i$i = $720 | 16;
           $$sum109$i = (($$sum3132$i$i) + ($tsize$244$i))|0;
           $818 = (($tbase$245$i) + ($$sum109$i)|0);
           $819 = HEAP32[$818>>2]|0;
           $820 = ($819|0)==(0|0);
           do {
            if (!($820)) {
             $821 = ($819>>>0)<($815>>>0);
             if ($821) {
              _abort();
              // unreachable;
             } else {
              $822 = (($R$1$i$i) + 16|0);
              HEAP32[$822>>2] = $819;
              $823 = (($819) + 24|0);
              HEAP32[$823>>2] = $R$1$i$i;
              break;
             }
            }
           } while(0);
           $$sum110$i = (($$sum2$i21$i) + ($$sum3132$i$i))|0;
           $824 = (($tbase$245$i) + ($$sum110$i)|0);
           $825 = HEAP32[$824>>2]|0;
           $826 = ($825|0)==(0|0);
           if ($826) {
            break;
           }
           $827 = HEAP32[((125000 + 16|0))>>2]|0;
           $828 = ($825>>>0)<($827>>>0);
           if ($828) {
            _abort();
            // unreachable;
           } else {
            $829 = (($R$1$i$i) + 20|0);
            HEAP32[$829>>2] = $825;
            $830 = (($825) + 24|0);
            HEAP32[$830>>2] = $R$1$i$i;
            break;
           }
          }
         } while(0);
         $$sum9$i$i = $745 | $720;
         $$sum111$i = (($$sum9$i$i) + ($tsize$244$i))|0;
         $831 = (($tbase$245$i) + ($$sum111$i)|0);
         $832 = (($745) + ($726))|0;
         $oldfirst$0$i$i = $831;$qsize$0$i$i = $832;
        } else {
         $oldfirst$0$i$i = $721;$qsize$0$i$i = $726;
        }
        $833 = (($oldfirst$0$i$i) + 4|0);
        $834 = HEAP32[$833>>2]|0;
        $835 = $834 & -2;
        HEAP32[$833>>2] = $835;
        $836 = $qsize$0$i$i | 1;
        $$sum10$i$i = (($$sum$i19$i) + 4)|0;
        $837 = (($tbase$245$i) + ($$sum10$i$i)|0);
        HEAP32[$837>>2] = $836;
        $$sum11$i22$i = (($qsize$0$i$i) + ($$sum$i19$i))|0;
        $838 = (($tbase$245$i) + ($$sum11$i22$i)|0);
        HEAP32[$838>>2] = $qsize$0$i$i;
        $839 = $qsize$0$i$i >>> 3;
        $840 = ($qsize$0$i$i>>>0)<(256);
        if ($840) {
         $841 = $839 << 1;
         $842 = ((125000 + ($841<<2)|0) + 40|0);
         $843 = HEAP32[125000>>2]|0;
         $844 = 1 << $839;
         $845 = $843 & $844;
         $846 = ($845|0)==(0);
         do {
          if ($846) {
           $847 = $843 | $844;
           HEAP32[125000>>2] = $847;
           $$sum26$pre$i$i = (($841) + 2)|0;
           $$pre$i23$i = ((125000 + ($$sum26$pre$i$i<<2)|0) + 40|0);
           $$pre$phi$i24$iZ2D = $$pre$i23$i;$F4$0$i$i = $842;
          } else {
           $$sum29$i$i = (($841) + 2)|0;
           $848 = ((125000 + ($$sum29$i$i<<2)|0) + 40|0);
           $849 = HEAP32[$848>>2]|0;
           $850 = HEAP32[((125000 + 16|0))>>2]|0;
           $851 = ($849>>>0)<($850>>>0);
           if (!($851)) {
            $$pre$phi$i24$iZ2D = $848;$F4$0$i$i = $849;
            break;
           }
           _abort();
           // unreachable;
          }
         } while(0);
         HEAP32[$$pre$phi$i24$iZ2D>>2] = $725;
         $852 = (($F4$0$i$i) + 12|0);
         HEAP32[$852>>2] = $725;
         $$sum27$i$i = (($$sum$i19$i) + 8)|0;
         $853 = (($tbase$245$i) + ($$sum27$i$i)|0);
         HEAP32[$853>>2] = $F4$0$i$i;
         $$sum28$i$i = (($$sum$i19$i) + 12)|0;
         $854 = (($tbase$245$i) + ($$sum28$i$i)|0);
         HEAP32[$854>>2] = $842;
         break;
        }
        $855 = $qsize$0$i$i >>> 8;
        $856 = ($855|0)==(0);
        do {
         if ($856) {
          $I7$0$i$i = 0;
         } else {
          $857 = ($qsize$0$i$i>>>0)>(16777215);
          if ($857) {
           $I7$0$i$i = 31;
           break;
          }
          $858 = (($855) + 1048320)|0;
          $859 = $858 >>> 16;
          $860 = $859 & 8;
          $861 = $855 << $860;
          $862 = (($861) + 520192)|0;
          $863 = $862 >>> 16;
          $864 = $863 & 4;
          $865 = $864 | $860;
          $866 = $861 << $864;
          $867 = (($866) + 245760)|0;
          $868 = $867 >>> 16;
          $869 = $868 & 2;
          $870 = $865 | $869;
          $871 = (14 - ($870))|0;
          $872 = $866 << $869;
          $873 = $872 >>> 15;
          $874 = (($871) + ($873))|0;
          $875 = $874 << 1;
          $876 = (($874) + 7)|0;
          $877 = $qsize$0$i$i >>> $876;
          $878 = $877 & 1;
          $879 = $878 | $875;
          $I7$0$i$i = $879;
         }
        } while(0);
        $880 = ((125000 + ($I7$0$i$i<<2)|0) + 304|0);
        $$sum12$i$i = (($$sum$i19$i) + 28)|0;
        $881 = (($tbase$245$i) + ($$sum12$i$i)|0);
        HEAP32[$881>>2] = $I7$0$i$i;
        $$sum13$i$i = (($$sum$i19$i) + 16)|0;
        $882 = (($tbase$245$i) + ($$sum13$i$i)|0);
        $$sum14$i$i = (($$sum$i19$i) + 20)|0;
        $883 = (($tbase$245$i) + ($$sum14$i$i)|0);
        HEAP32[$883>>2] = 0;
        HEAP32[$882>>2] = 0;
        $884 = HEAP32[((125000 + 4|0))>>2]|0;
        $885 = 1 << $I7$0$i$i;
        $886 = $884 & $885;
        $887 = ($886|0)==(0);
        if ($887) {
         $888 = $884 | $885;
         HEAP32[((125000 + 4|0))>>2] = $888;
         HEAP32[$880>>2] = $725;
         $$sum15$i$i = (($$sum$i19$i) + 24)|0;
         $889 = (($tbase$245$i) + ($$sum15$i$i)|0);
         HEAP32[$889>>2] = $880;
         $$sum16$i$i = (($$sum$i19$i) + 12)|0;
         $890 = (($tbase$245$i) + ($$sum16$i$i)|0);
         HEAP32[$890>>2] = $725;
         $$sum17$i$i = (($$sum$i19$i) + 8)|0;
         $891 = (($tbase$245$i) + ($$sum17$i$i)|0);
         HEAP32[$891>>2] = $725;
         break;
        }
        $892 = HEAP32[$880>>2]|0;
        $893 = ($I7$0$i$i|0)==(31);
        if ($893) {
         $901 = 0;
        } else {
         $894 = $I7$0$i$i >>> 1;
         $895 = (25 - ($894))|0;
         $901 = $895;
        }
        $896 = (($892) + 4|0);
        $897 = HEAP32[$896>>2]|0;
        $898 = $897 & -8;
        $899 = ($898|0)==($qsize$0$i$i|0);
        do {
         if ($899) {
          $T$0$lcssa$i26$i = $892;
         } else {
          $900 = $qsize$0$i$i << $901;
          $K8$053$i$i = $900;$T$052$i$i = $892;
          while(1) {
           $908 = $K8$053$i$i >>> 31;
           $909 = ((($T$052$i$i) + ($908<<2)|0) + 16|0);
           $904 = HEAP32[$909>>2]|0;
           $910 = ($904|0)==(0|0);
           if ($910) {
            $$lcssa = $909;$T$052$i$i$lcssa = $T$052$i$i;
            break;
           }
           $902 = $K8$053$i$i << 1;
           $903 = (($904) + 4|0);
           $905 = HEAP32[$903>>2]|0;
           $906 = $905 & -8;
           $907 = ($906|0)==($qsize$0$i$i|0);
           if ($907) {
            $$lcssa110 = $904;
            label = 314;
            break;
           } else {
            $K8$053$i$i = $902;$T$052$i$i = $904;
           }
          }
          if ((label|0) == 314) {
           $T$0$lcssa$i26$i = $$lcssa110;
           break;
          }
          $911 = HEAP32[((125000 + 16|0))>>2]|0;
          $912 = ($$lcssa>>>0)<($911>>>0);
          if ($912) {
           _abort();
           // unreachable;
          } else {
           HEAP32[$$lcssa>>2] = $725;
           $$sum23$i$i = (($$sum$i19$i) + 24)|0;
           $913 = (($tbase$245$i) + ($$sum23$i$i)|0);
           HEAP32[$913>>2] = $T$052$i$i$lcssa;
           $$sum24$i$i = (($$sum$i19$i) + 12)|0;
           $914 = (($tbase$245$i) + ($$sum24$i$i)|0);
           HEAP32[$914>>2] = $725;
           $$sum25$i$i = (($$sum$i19$i) + 8)|0;
           $915 = (($tbase$245$i) + ($$sum25$i$i)|0);
           HEAP32[$915>>2] = $725;
           break L353;
          }
         }
        } while(0);
        $916 = (($T$0$lcssa$i26$i) + 8|0);
        $917 = HEAP32[$916>>2]|0;
        $918 = HEAP32[((125000 + 16|0))>>2]|0;
        $919 = ($T$0$lcssa$i26$i>>>0)>=($918>>>0);
        $920 = ($917>>>0)>=($918>>>0);
        $or$cond$i27$i = $919 & $920;
        if ($or$cond$i27$i) {
         $921 = (($917) + 12|0);
         HEAP32[$921>>2] = $725;
         HEAP32[$916>>2] = $725;
         $$sum20$i$i = (($$sum$i19$i) + 8)|0;
         $922 = (($tbase$245$i) + ($$sum20$i$i)|0);
         HEAP32[$922>>2] = $917;
         $$sum21$i$i = (($$sum$i19$i) + 12)|0;
         $923 = (($tbase$245$i) + ($$sum21$i$i)|0);
         HEAP32[$923>>2] = $T$0$lcssa$i26$i;
         $$sum22$i$i = (($$sum$i19$i) + 24)|0;
         $924 = (($tbase$245$i) + ($$sum22$i$i)|0);
         HEAP32[$924>>2] = 0;
         break;
        } else {
         _abort();
         // unreachable;
        }
       }
      } while(0);
      $$sum1819$i$i = $713 | 8;
      $925 = (($tbase$245$i) + ($$sum1819$i$i)|0);
      $mem$0 = $925;
      return ($mem$0|0);
     }
    }
    else if ((label|0) == 319) {
    }
    $sp$0$i$i$i = ((125000 + 448|0));
    while(1) {
     $926 = HEAP32[$sp$0$i$i$i>>2]|0;
     $927 = ($926>>>0)>($636>>>0);
     if (!($927)) {
      $928 = (($sp$0$i$i$i) + 4|0);
      $929 = HEAP32[$928>>2]|0;
      $930 = (($926) + ($929)|0);
      $931 = ($930>>>0)>($636>>>0);
      if ($931) {
       $$lcssa116 = $926;$$lcssa117 = $929;$$lcssa118 = $930;
       break;
      }
     }
     $932 = (($sp$0$i$i$i) + 8|0);
     $933 = HEAP32[$932>>2]|0;
     $sp$0$i$i$i = $933;
    }
    $$sum$i13$i = (($$lcssa117) + -47)|0;
    $$sum1$i14$i = (($$lcssa117) + -39)|0;
    $934 = (($$lcssa116) + ($$sum1$i14$i)|0);
    $935 = $934;
    $936 = $935 & 7;
    $937 = ($936|0)==(0);
    if ($937) {
     $940 = 0;
    } else {
     $938 = (0 - ($935))|0;
     $939 = $938 & 7;
     $940 = $939;
    }
    $$sum2$i15$i = (($$sum$i13$i) + ($940))|0;
    $941 = (($$lcssa116) + ($$sum2$i15$i)|0);
    $942 = (($636) + 16|0);
    $943 = ($941>>>0)<($942>>>0);
    $944 = $943 ? $636 : $941;
    $945 = (($944) + 8|0);
    $946 = (($tsize$244$i) + -40)|0;
    $947 = (($tbase$245$i) + 8|0);
    $948 = $947;
    $949 = $948 & 7;
    $950 = ($949|0)==(0);
    if ($950) {
     $954 = 0;
    } else {
     $951 = (0 - ($948))|0;
     $952 = $951 & 7;
     $954 = $952;
    }
    $953 = (($tbase$245$i) + ($954)|0);
    $955 = (($946) - ($954))|0;
    HEAP32[((125000 + 24|0))>>2] = $953;
    HEAP32[((125000 + 12|0))>>2] = $955;
    $956 = $955 | 1;
    $$sum$i$i$i = (($954) + 4)|0;
    $957 = (($tbase$245$i) + ($$sum$i$i$i)|0);
    HEAP32[$957>>2] = $956;
    $$sum2$i$i$i = (($tsize$244$i) + -36)|0;
    $958 = (($tbase$245$i) + ($$sum2$i$i$i)|0);
    HEAP32[$958>>2] = 40;
    $959 = HEAP32[((125472 + 16|0))>>2]|0;
    HEAP32[((125000 + 28|0))>>2] = $959;
    $960 = (($944) + 4|0);
    HEAP32[$960>>2] = 27;
    ;HEAP32[$945+0>>2]=HEAP32[((125000 + 448|0))+0>>2]|0;HEAP32[$945+4>>2]=HEAP32[((125000 + 448|0))+4>>2]|0;HEAP32[$945+8>>2]=HEAP32[((125000 + 448|0))+8>>2]|0;HEAP32[$945+12>>2]=HEAP32[((125000 + 448|0))+12>>2]|0;
    HEAP32[((125000 + 448|0))>>2] = $tbase$245$i;
    HEAP32[((125000 + 452|0))>>2] = $tsize$244$i;
    HEAP32[((125000 + 460|0))>>2] = 0;
    HEAP32[((125000 + 456|0))>>2] = $945;
    $961 = (($944) + 28|0);
    HEAP32[$961>>2] = 7;
    $962 = (($944) + 32|0);
    $963 = ($962>>>0)<($$lcssa118>>>0);
    if ($963) {
     $965 = $961;
     while(1) {
      $964 = (($965) + 4|0);
      HEAP32[$964>>2] = 7;
      $966 = (($965) + 8|0);
      $967 = ($966>>>0)<($$lcssa118>>>0);
      if ($967) {
       $965 = $964;
      } else {
       break;
      }
     }
    }
    $968 = ($944|0)==($636|0);
    if (!($968)) {
     $969 = $944;
     $970 = $636;
     $971 = (($969) - ($970))|0;
     $972 = (($636) + ($971)|0);
     $$sum3$i$i = (($971) + 4)|0;
     $973 = (($636) + ($$sum3$i$i)|0);
     $974 = HEAP32[$973>>2]|0;
     $975 = $974 & -2;
     HEAP32[$973>>2] = $975;
     $976 = $971 | 1;
     $977 = (($636) + 4|0);
     HEAP32[$977>>2] = $976;
     HEAP32[$972>>2] = $971;
     $978 = $971 >>> 3;
     $979 = ($971>>>0)<(256);
     if ($979) {
      $980 = $978 << 1;
      $981 = ((125000 + ($980<<2)|0) + 40|0);
      $982 = HEAP32[125000>>2]|0;
      $983 = 1 << $978;
      $984 = $982 & $983;
      $985 = ($984|0)==(0);
      do {
       if ($985) {
        $986 = $982 | $983;
        HEAP32[125000>>2] = $986;
        $$sum10$pre$i$i = (($980) + 2)|0;
        $$pre$i$i = ((125000 + ($$sum10$pre$i$i<<2)|0) + 40|0);
        $$pre$phi$i$iZ2D = $$pre$i$i;$F$0$i$i = $981;
       } else {
        $$sum11$i$i = (($980) + 2)|0;
        $987 = ((125000 + ($$sum11$i$i<<2)|0) + 40|0);
        $988 = HEAP32[$987>>2]|0;
        $989 = HEAP32[((125000 + 16|0))>>2]|0;
        $990 = ($988>>>0)<($989>>>0);
        if (!($990)) {
         $$pre$phi$i$iZ2D = $987;$F$0$i$i = $988;
         break;
        }
        _abort();
        // unreachable;
       }
      } while(0);
      HEAP32[$$pre$phi$i$iZ2D>>2] = $636;
      $991 = (($F$0$i$i) + 12|0);
      HEAP32[$991>>2] = $636;
      $992 = (($636) + 8|0);
      HEAP32[$992>>2] = $F$0$i$i;
      $993 = (($636) + 12|0);
      HEAP32[$993>>2] = $981;
      break;
     }
     $994 = $971 >>> 8;
     $995 = ($994|0)==(0);
     if ($995) {
      $I1$0$i$i = 0;
     } else {
      $996 = ($971>>>0)>(16777215);
      if ($996) {
       $I1$0$i$i = 31;
      } else {
       $997 = (($994) + 1048320)|0;
       $998 = $997 >>> 16;
       $999 = $998 & 8;
       $1000 = $994 << $999;
       $1001 = (($1000) + 520192)|0;
       $1002 = $1001 >>> 16;
       $1003 = $1002 & 4;
       $1004 = $1003 | $999;
       $1005 = $1000 << $1003;
       $1006 = (($1005) + 245760)|0;
       $1007 = $1006 >>> 16;
       $1008 = $1007 & 2;
       $1009 = $1004 | $1008;
       $1010 = (14 - ($1009))|0;
       $1011 = $1005 << $1008;
       $1012 = $1011 >>> 15;
       $1013 = (($1010) + ($1012))|0;
       $1014 = $1013 << 1;
       $1015 = (($1013) + 7)|0;
       $1016 = $971 >>> $1015;
       $1017 = $1016 & 1;
       $1018 = $1017 | $1014;
       $I1$0$i$i = $1018;
      }
     }
     $1019 = ((125000 + ($I1$0$i$i<<2)|0) + 304|0);
     $1020 = (($636) + 28|0);
     $I1$0$c$i$i = $I1$0$i$i;
     HEAP32[$1020>>2] = $I1$0$c$i$i;
     $1021 = (($636) + 20|0);
     HEAP32[$1021>>2] = 0;
     $1022 = (($636) + 16|0);
     HEAP32[$1022>>2] = 0;
     $1023 = HEAP32[((125000 + 4|0))>>2]|0;
     $1024 = 1 << $I1$0$i$i;
     $1025 = $1023 & $1024;
     $1026 = ($1025|0)==(0);
     if ($1026) {
      $1027 = $1023 | $1024;
      HEAP32[((125000 + 4|0))>>2] = $1027;
      HEAP32[$1019>>2] = $636;
      $1028 = (($636) + 24|0);
      HEAP32[$1028>>2] = $1019;
      $1029 = (($636) + 12|0);
      HEAP32[$1029>>2] = $636;
      $1030 = (($636) + 8|0);
      HEAP32[$1030>>2] = $636;
      break;
     }
     $1031 = HEAP32[$1019>>2]|0;
     $1032 = ($I1$0$i$i|0)==(31);
     if ($1032) {
      $1040 = 0;
     } else {
      $1033 = $I1$0$i$i >>> 1;
      $1034 = (25 - ($1033))|0;
      $1040 = $1034;
     }
     $1035 = (($1031) + 4|0);
     $1036 = HEAP32[$1035>>2]|0;
     $1037 = $1036 & -8;
     $1038 = ($1037|0)==($971|0);
     do {
      if ($1038) {
       $T$0$lcssa$i$i = $1031;
      } else {
       $1039 = $971 << $1040;
       $K2$015$i$i = $1039;$T$014$i$i = $1031;
       while(1) {
        $1047 = $K2$015$i$i >>> 31;
        $1048 = ((($T$014$i$i) + ($1047<<2)|0) + 16|0);
        $1043 = HEAP32[$1048>>2]|0;
        $1049 = ($1043|0)==(0|0);
        if ($1049) {
         $$lcssa112 = $1048;$T$014$i$i$lcssa = $T$014$i$i;
         break;
        }
        $1041 = $K2$015$i$i << 1;
        $1042 = (($1043) + 4|0);
        $1044 = HEAP32[$1042>>2]|0;
        $1045 = $1044 & -8;
        $1046 = ($1045|0)==($971|0);
        if ($1046) {
         $$lcssa115 = $1043;
         label = 353;
         break;
        } else {
         $K2$015$i$i = $1041;$T$014$i$i = $1043;
        }
       }
       if ((label|0) == 353) {
        $T$0$lcssa$i$i = $$lcssa115;
        break;
       }
       $1050 = HEAP32[((125000 + 16|0))>>2]|0;
       $1051 = ($$lcssa112>>>0)<($1050>>>0);
       if ($1051) {
        _abort();
        // unreachable;
       } else {
        HEAP32[$$lcssa112>>2] = $636;
        $1052 = (($636) + 24|0);
        HEAP32[$1052>>2] = $T$014$i$i$lcssa;
        $1053 = (($636) + 12|0);
        HEAP32[$1053>>2] = $636;
        $1054 = (($636) + 8|0);
        HEAP32[$1054>>2] = $636;
        break L323;
       }
      }
     } while(0);
     $1055 = (($T$0$lcssa$i$i) + 8|0);
     $1056 = HEAP32[$1055>>2]|0;
     $1057 = HEAP32[((125000 + 16|0))>>2]|0;
     $1058 = ($T$0$lcssa$i$i>>>0)>=($1057>>>0);
     $1059 = ($1056>>>0)>=($1057>>>0);
     $or$cond$i$i = $1058 & $1059;
     if ($or$cond$i$i) {
      $1060 = (($1056) + 12|0);
      HEAP32[$1060>>2] = $636;
      HEAP32[$1055>>2] = $636;
      $1061 = (($636) + 8|0);
      HEAP32[$1061>>2] = $1056;
      $1062 = (($636) + 12|0);
      HEAP32[$1062>>2] = $T$0$lcssa$i$i;
      $1063 = (($636) + 24|0);
      HEAP32[$1063>>2] = 0;
      break;
     } else {
      _abort();
      // unreachable;
     }
    }
   }
  } while(0);
  $1064 = HEAP32[((125000 + 12|0))>>2]|0;
  $1065 = ($1064>>>0)>($nb$0>>>0);
  if ($1065) {
   $1066 = (($1064) - ($nb$0))|0;
   HEAP32[((125000 + 12|0))>>2] = $1066;
   $1067 = HEAP32[((125000 + 24|0))>>2]|0;
   $1068 = (($1067) + ($nb$0)|0);
   HEAP32[((125000 + 24|0))>>2] = $1068;
   $1069 = $1066 | 1;
   $$sum$i32 = (($nb$0) + 4)|0;
   $1070 = (($1067) + ($$sum$i32)|0);
   HEAP32[$1070>>2] = $1069;
   $1071 = $nb$0 | 3;
   $1072 = (($1067) + 4|0);
   HEAP32[$1072>>2] = $1071;
   $1073 = (($1067) + 8|0);
   $mem$0 = $1073;
   return ($mem$0|0);
  }
 }
 $1074 = (___errno_location()|0);
 HEAP32[$1074>>2] = 12;
 $mem$0 = 0;
 return ($mem$0|0);
}
function _free($mem) {
 $mem = $mem|0;
 var $$lcssa = 0, $$lcssa73 = 0, $$pre = 0, $$pre$phi66Z2D = 0, $$pre$phi68Z2D = 0, $$pre$phiZ2D = 0, $$pre65 = 0, $$pre67 = 0, $$sum = 0, $$sum16$pre = 0, $$sum17 = 0, $$sum18 = 0, $$sum19 = 0, $$sum2 = 0, $$sum20 = 0, $$sum2324 = 0, $$sum25 = 0, $$sum26 = 0, $$sum28 = 0, $$sum29 = 0;
 var $$sum3 = 0, $$sum30 = 0, $$sum31 = 0, $$sum32 = 0, $$sum33 = 0, $$sum34 = 0, $$sum35 = 0, $$sum36 = 0, $$sum37 = 0, $$sum5 = 0, $$sum67 = 0, $$sum8 = 0, $$sum9 = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0;
 var $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0;
 var $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0;
 var $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0;
 var $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0;
 var $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0;
 var $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0;
 var $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0, $226 = 0, $227 = 0, $228 = 0, $229 = 0, $23 = 0;
 var $230 = 0, $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0, $244 = 0, $245 = 0, $246 = 0, $247 = 0, $248 = 0;
 var $249 = 0, $25 = 0, $250 = 0, $251 = 0, $252 = 0, $253 = 0, $254 = 0, $255 = 0, $256 = 0, $257 = 0, $258 = 0, $259 = 0, $26 = 0, $260 = 0, $261 = 0, $262 = 0, $263 = 0, $264 = 0, $265 = 0, $266 = 0;
 var $267 = 0, $268 = 0, $269 = 0, $27 = 0, $270 = 0, $271 = 0, $272 = 0, $273 = 0, $274 = 0, $275 = 0, $276 = 0, $277 = 0, $278 = 0, $279 = 0, $28 = 0, $280 = 0, $281 = 0, $282 = 0, $283 = 0, $284 = 0;
 var $285 = 0, $286 = 0, $287 = 0, $288 = 0, $289 = 0, $29 = 0, $290 = 0, $291 = 0, $292 = 0, $293 = 0, $294 = 0, $295 = 0, $296 = 0, $297 = 0, $298 = 0, $299 = 0, $3 = 0, $30 = 0, $300 = 0, $301 = 0;
 var $302 = 0, $303 = 0, $304 = 0, $305 = 0, $306 = 0, $307 = 0, $308 = 0, $309 = 0, $31 = 0, $310 = 0, $311 = 0, $312 = 0, $313 = 0, $314 = 0, $315 = 0, $316 = 0, $317 = 0, $318 = 0, $319 = 0, $32 = 0;
 var $320 = 0, $321 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0;
 var $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0;
 var $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0;
 var $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $F16$0 = 0, $I18$0 = 0, $I18$0$c = 0, $K19$060 = 0, $R$0 = 0;
 var $R$0$be = 0, $R$0$lcssa = 0, $R$0$ph = 0, $R$1 = 0, $R7$0 = 0, $R7$0$be = 0, $R7$0$lcssa = 0, $R7$0$ph = 0, $R7$1 = 0, $RP$0 = 0, $RP$0$be = 0, $RP$0$lcssa = 0, $RP$0$ph = 0, $RP9$0 = 0, $RP9$0$be = 0, $RP9$0$lcssa = 0, $RP9$0$ph = 0, $T$0$lcssa = 0, $T$059 = 0, $T$059$lcssa = 0;
 var $cond = 0, $cond54 = 0, $or$cond = 0, $p$0 = 0, $psize$0 = 0, $psize$1 = 0, $sp$0$i = 0, $sp$0$in$i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($mem|0)==(0|0);
 if ($0) {
  return;
 }
 $1 = (($mem) + -8|0);
 $2 = HEAP32[((125000 + 16|0))>>2]|0;
 $3 = ($1>>>0)<($2>>>0);
 if ($3) {
  _abort();
  // unreachable;
 }
 $4 = (($mem) + -4|0);
 $5 = HEAP32[$4>>2]|0;
 $6 = $5 & 3;
 $7 = ($6|0)==(1);
 if ($7) {
  _abort();
  // unreachable;
 }
 $8 = $5 & -8;
 $$sum = (($8) + -8)|0;
 $9 = (($mem) + ($$sum)|0);
 $10 = $5 & 1;
 $11 = ($10|0)==(0);
 do {
  if ($11) {
   $12 = HEAP32[$1>>2]|0;
   $13 = ($6|0)==(0);
   if ($13) {
    return;
   }
   $$sum2 = (-8 - ($12))|0;
   $14 = (($mem) + ($$sum2)|0);
   $15 = (($12) + ($8))|0;
   $16 = ($14>>>0)<($2>>>0);
   if ($16) {
    _abort();
    // unreachable;
   }
   $17 = HEAP32[((125000 + 20|0))>>2]|0;
   $18 = ($14|0)==($17|0);
   if ($18) {
    $$sum3 = (($8) + -4)|0;
    $103 = (($mem) + ($$sum3)|0);
    $104 = HEAP32[$103>>2]|0;
    $105 = $104 & 3;
    $106 = ($105|0)==(3);
    if (!($106)) {
     $p$0 = $14;$psize$0 = $15;
     break;
    }
    HEAP32[((125000 + 8|0))>>2] = $15;
    $107 = $104 & -2;
    HEAP32[$103>>2] = $107;
    $108 = $15 | 1;
    $$sum26 = (($$sum2) + 4)|0;
    $109 = (($mem) + ($$sum26)|0);
    HEAP32[$109>>2] = $108;
    HEAP32[$9>>2] = $15;
    return;
   }
   $19 = $12 >>> 3;
   $20 = ($12>>>0)<(256);
   if ($20) {
    $$sum36 = (($$sum2) + 8)|0;
    $21 = (($mem) + ($$sum36)|0);
    $22 = HEAP32[$21>>2]|0;
    $$sum37 = (($$sum2) + 12)|0;
    $23 = (($mem) + ($$sum37)|0);
    $24 = HEAP32[$23>>2]|0;
    $25 = $19 << 1;
    $26 = ((125000 + ($25<<2)|0) + 40|0);
    $27 = ($22|0)==($26|0);
    if (!($27)) {
     $28 = ($22>>>0)<($2>>>0);
     if ($28) {
      _abort();
      // unreachable;
     }
     $29 = (($22) + 12|0);
     $30 = HEAP32[$29>>2]|0;
     $31 = ($30|0)==($14|0);
     if (!($31)) {
      _abort();
      // unreachable;
     }
    }
    $32 = ($24|0)==($22|0);
    if ($32) {
     $33 = 1 << $19;
     $34 = $33 ^ -1;
     $35 = HEAP32[125000>>2]|0;
     $36 = $35 & $34;
     HEAP32[125000>>2] = $36;
     $p$0 = $14;$psize$0 = $15;
     break;
    }
    $37 = ($24|0)==($26|0);
    if ($37) {
     $$pre67 = (($24) + 8|0);
     $$pre$phi68Z2D = $$pre67;
    } else {
     $38 = ($24>>>0)<($2>>>0);
     if ($38) {
      _abort();
      // unreachable;
     }
     $39 = (($24) + 8|0);
     $40 = HEAP32[$39>>2]|0;
     $41 = ($40|0)==($14|0);
     if ($41) {
      $$pre$phi68Z2D = $39;
     } else {
      _abort();
      // unreachable;
     }
    }
    $42 = (($22) + 12|0);
    HEAP32[$42>>2] = $24;
    HEAP32[$$pre$phi68Z2D>>2] = $22;
    $p$0 = $14;$psize$0 = $15;
    break;
   }
   $$sum28 = (($$sum2) + 24)|0;
   $43 = (($mem) + ($$sum28)|0);
   $44 = HEAP32[$43>>2]|0;
   $$sum29 = (($$sum2) + 12)|0;
   $45 = (($mem) + ($$sum29)|0);
   $46 = HEAP32[$45>>2]|0;
   $47 = ($46|0)==($14|0);
   do {
    if ($47) {
     $$sum31 = (($$sum2) + 20)|0;
     $57 = (($mem) + ($$sum31)|0);
     $58 = HEAP32[$57>>2]|0;
     $59 = ($58|0)==(0|0);
     if ($59) {
      $$sum30 = (($$sum2) + 16)|0;
      $60 = (($mem) + ($$sum30)|0);
      $61 = HEAP32[$60>>2]|0;
      $62 = ($61|0)==(0|0);
      if ($62) {
       $R$1 = 0;
       break;
      } else {
       $R$0$ph = $61;$RP$0$ph = $60;
      }
     } else {
      $R$0$ph = $58;$RP$0$ph = $57;
     }
     $R$0 = $R$0$ph;$RP$0 = $RP$0$ph;
     while(1) {
      $63 = (($R$0) + 20|0);
      $64 = HEAP32[$63>>2]|0;
      $65 = ($64|0)==(0|0);
      if ($65) {
       $66 = (($R$0) + 16|0);
       $67 = HEAP32[$66>>2]|0;
       $68 = ($67|0)==(0|0);
       if ($68) {
        $R$0$lcssa = $R$0;$RP$0$lcssa = $RP$0;
        break;
       } else {
        $R$0$be = $67;$RP$0$be = $66;
       }
      } else {
       $R$0$be = $64;$RP$0$be = $63;
      }
      $R$0 = $R$0$be;$RP$0 = $RP$0$be;
     }
     $69 = ($RP$0$lcssa>>>0)<($2>>>0);
     if ($69) {
      _abort();
      // unreachable;
     } else {
      HEAP32[$RP$0$lcssa>>2] = 0;
      $R$1 = $R$0$lcssa;
      break;
     }
    } else {
     $$sum35 = (($$sum2) + 8)|0;
     $48 = (($mem) + ($$sum35)|0);
     $49 = HEAP32[$48>>2]|0;
     $50 = ($49>>>0)<($2>>>0);
     if ($50) {
      _abort();
      // unreachable;
     }
     $51 = (($49) + 12|0);
     $52 = HEAP32[$51>>2]|0;
     $53 = ($52|0)==($14|0);
     if (!($53)) {
      _abort();
      // unreachable;
     }
     $54 = (($46) + 8|0);
     $55 = HEAP32[$54>>2]|0;
     $56 = ($55|0)==($14|0);
     if ($56) {
      HEAP32[$51>>2] = $46;
      HEAP32[$54>>2] = $49;
      $R$1 = $46;
      break;
     } else {
      _abort();
      // unreachable;
     }
    }
   } while(0);
   $70 = ($44|0)==(0|0);
   if ($70) {
    $p$0 = $14;$psize$0 = $15;
   } else {
    $$sum32 = (($$sum2) + 28)|0;
    $71 = (($mem) + ($$sum32)|0);
    $72 = HEAP32[$71>>2]|0;
    $73 = ((125000 + ($72<<2)|0) + 304|0);
    $74 = HEAP32[$73>>2]|0;
    $75 = ($14|0)==($74|0);
    if ($75) {
     HEAP32[$73>>2] = $R$1;
     $cond = ($R$1|0)==(0|0);
     if ($cond) {
      $76 = 1 << $72;
      $77 = $76 ^ -1;
      $78 = HEAP32[((125000 + 4|0))>>2]|0;
      $79 = $78 & $77;
      HEAP32[((125000 + 4|0))>>2] = $79;
      $p$0 = $14;$psize$0 = $15;
      break;
     }
    } else {
     $80 = HEAP32[((125000 + 16|0))>>2]|0;
     $81 = ($44>>>0)<($80>>>0);
     if ($81) {
      _abort();
      // unreachable;
     }
     $82 = (($44) + 16|0);
     $83 = HEAP32[$82>>2]|0;
     $84 = ($83|0)==($14|0);
     if ($84) {
      HEAP32[$82>>2] = $R$1;
     } else {
      $85 = (($44) + 20|0);
      HEAP32[$85>>2] = $R$1;
     }
     $86 = ($R$1|0)==(0|0);
     if ($86) {
      $p$0 = $14;$psize$0 = $15;
      break;
     }
    }
    $87 = HEAP32[((125000 + 16|0))>>2]|0;
    $88 = ($R$1>>>0)<($87>>>0);
    if ($88) {
     _abort();
     // unreachable;
    }
    $89 = (($R$1) + 24|0);
    HEAP32[$89>>2] = $44;
    $$sum33 = (($$sum2) + 16)|0;
    $90 = (($mem) + ($$sum33)|0);
    $91 = HEAP32[$90>>2]|0;
    $92 = ($91|0)==(0|0);
    do {
     if (!($92)) {
      $93 = ($91>>>0)<($87>>>0);
      if ($93) {
       _abort();
       // unreachable;
      } else {
       $94 = (($R$1) + 16|0);
       HEAP32[$94>>2] = $91;
       $95 = (($91) + 24|0);
       HEAP32[$95>>2] = $R$1;
       break;
      }
     }
    } while(0);
    $$sum34 = (($$sum2) + 20)|0;
    $96 = (($mem) + ($$sum34)|0);
    $97 = HEAP32[$96>>2]|0;
    $98 = ($97|0)==(0|0);
    if ($98) {
     $p$0 = $14;$psize$0 = $15;
    } else {
     $99 = HEAP32[((125000 + 16|0))>>2]|0;
     $100 = ($97>>>0)<($99>>>0);
     if ($100) {
      _abort();
      // unreachable;
     } else {
      $101 = (($R$1) + 20|0);
      HEAP32[$101>>2] = $97;
      $102 = (($97) + 24|0);
      HEAP32[$102>>2] = $R$1;
      $p$0 = $14;$psize$0 = $15;
      break;
     }
    }
   }
  } else {
   $p$0 = $1;$psize$0 = $8;
  }
 } while(0);
 $110 = ($p$0>>>0)<($9>>>0);
 if (!($110)) {
  _abort();
  // unreachable;
 }
 $$sum25 = (($8) + -4)|0;
 $111 = (($mem) + ($$sum25)|0);
 $112 = HEAP32[$111>>2]|0;
 $113 = $112 & 1;
 $114 = ($113|0)==(0);
 if ($114) {
  _abort();
  // unreachable;
 }
 $115 = $112 & 2;
 $116 = ($115|0)==(0);
 if ($116) {
  $117 = HEAP32[((125000 + 24|0))>>2]|0;
  $118 = ($9|0)==($117|0);
  if ($118) {
   $119 = HEAP32[((125000 + 12|0))>>2]|0;
   $120 = (($119) + ($psize$0))|0;
   HEAP32[((125000 + 12|0))>>2] = $120;
   HEAP32[((125000 + 24|0))>>2] = $p$0;
   $121 = $120 | 1;
   $122 = (($p$0) + 4|0);
   HEAP32[$122>>2] = $121;
   $123 = HEAP32[((125000 + 20|0))>>2]|0;
   $124 = ($p$0|0)==($123|0);
   if (!($124)) {
    return;
   }
   HEAP32[((125000 + 20|0))>>2] = 0;
   HEAP32[((125000 + 8|0))>>2] = 0;
   return;
  }
  $125 = HEAP32[((125000 + 20|0))>>2]|0;
  $126 = ($9|0)==($125|0);
  if ($126) {
   $127 = HEAP32[((125000 + 8|0))>>2]|0;
   $128 = (($127) + ($psize$0))|0;
   HEAP32[((125000 + 8|0))>>2] = $128;
   HEAP32[((125000 + 20|0))>>2] = $p$0;
   $129 = $128 | 1;
   $130 = (($p$0) + 4|0);
   HEAP32[$130>>2] = $129;
   $131 = (($p$0) + ($128)|0);
   HEAP32[$131>>2] = $128;
   return;
  }
  $132 = $112 & -8;
  $133 = (($132) + ($psize$0))|0;
  $134 = $112 >>> 3;
  $135 = ($112>>>0)<(256);
  do {
   if ($135) {
    $136 = (($mem) + ($8)|0);
    $137 = HEAP32[$136>>2]|0;
    $$sum2324 = $8 | 4;
    $138 = (($mem) + ($$sum2324)|0);
    $139 = HEAP32[$138>>2]|0;
    $140 = $134 << 1;
    $141 = ((125000 + ($140<<2)|0) + 40|0);
    $142 = ($137|0)==($141|0);
    if (!($142)) {
     $143 = HEAP32[((125000 + 16|0))>>2]|0;
     $144 = ($137>>>0)<($143>>>0);
     if ($144) {
      _abort();
      // unreachable;
     }
     $145 = (($137) + 12|0);
     $146 = HEAP32[$145>>2]|0;
     $147 = ($146|0)==($9|0);
     if (!($147)) {
      _abort();
      // unreachable;
     }
    }
    $148 = ($139|0)==($137|0);
    if ($148) {
     $149 = 1 << $134;
     $150 = $149 ^ -1;
     $151 = HEAP32[125000>>2]|0;
     $152 = $151 & $150;
     HEAP32[125000>>2] = $152;
     break;
    }
    $153 = ($139|0)==($141|0);
    if ($153) {
     $$pre65 = (($139) + 8|0);
     $$pre$phi66Z2D = $$pre65;
    } else {
     $154 = HEAP32[((125000 + 16|0))>>2]|0;
     $155 = ($139>>>0)<($154>>>0);
     if ($155) {
      _abort();
      // unreachable;
     }
     $156 = (($139) + 8|0);
     $157 = HEAP32[$156>>2]|0;
     $158 = ($157|0)==($9|0);
     if ($158) {
      $$pre$phi66Z2D = $156;
     } else {
      _abort();
      // unreachable;
     }
    }
    $159 = (($137) + 12|0);
    HEAP32[$159>>2] = $139;
    HEAP32[$$pre$phi66Z2D>>2] = $137;
   } else {
    $$sum5 = (($8) + 16)|0;
    $160 = (($mem) + ($$sum5)|0);
    $161 = HEAP32[$160>>2]|0;
    $$sum67 = $8 | 4;
    $162 = (($mem) + ($$sum67)|0);
    $163 = HEAP32[$162>>2]|0;
    $164 = ($163|0)==($9|0);
    do {
     if ($164) {
      $$sum9 = (($8) + 12)|0;
      $175 = (($mem) + ($$sum9)|0);
      $176 = HEAP32[$175>>2]|0;
      $177 = ($176|0)==(0|0);
      if ($177) {
       $$sum8 = (($8) + 8)|0;
       $178 = (($mem) + ($$sum8)|0);
       $179 = HEAP32[$178>>2]|0;
       $180 = ($179|0)==(0|0);
       if ($180) {
        $R7$1 = 0;
        break;
       } else {
        $R7$0$ph = $179;$RP9$0$ph = $178;
       }
      } else {
       $R7$0$ph = $176;$RP9$0$ph = $175;
      }
      $R7$0 = $R7$0$ph;$RP9$0 = $RP9$0$ph;
      while(1) {
       $181 = (($R7$0) + 20|0);
       $182 = HEAP32[$181>>2]|0;
       $183 = ($182|0)==(0|0);
       if ($183) {
        $184 = (($R7$0) + 16|0);
        $185 = HEAP32[$184>>2]|0;
        $186 = ($185|0)==(0|0);
        if ($186) {
         $R7$0$lcssa = $R7$0;$RP9$0$lcssa = $RP9$0;
         break;
        } else {
         $R7$0$be = $185;$RP9$0$be = $184;
        }
       } else {
        $R7$0$be = $182;$RP9$0$be = $181;
       }
       $R7$0 = $R7$0$be;$RP9$0 = $RP9$0$be;
      }
      $187 = HEAP32[((125000 + 16|0))>>2]|0;
      $188 = ($RP9$0$lcssa>>>0)<($187>>>0);
      if ($188) {
       _abort();
       // unreachable;
      } else {
       HEAP32[$RP9$0$lcssa>>2] = 0;
       $R7$1 = $R7$0$lcssa;
       break;
      }
     } else {
      $165 = (($mem) + ($8)|0);
      $166 = HEAP32[$165>>2]|0;
      $167 = HEAP32[((125000 + 16|0))>>2]|0;
      $168 = ($166>>>0)<($167>>>0);
      if ($168) {
       _abort();
       // unreachable;
      }
      $169 = (($166) + 12|0);
      $170 = HEAP32[$169>>2]|0;
      $171 = ($170|0)==($9|0);
      if (!($171)) {
       _abort();
       // unreachable;
      }
      $172 = (($163) + 8|0);
      $173 = HEAP32[$172>>2]|0;
      $174 = ($173|0)==($9|0);
      if ($174) {
       HEAP32[$169>>2] = $163;
       HEAP32[$172>>2] = $166;
       $R7$1 = $163;
       break;
      } else {
       _abort();
       // unreachable;
      }
     }
    } while(0);
    $189 = ($161|0)==(0|0);
    if (!($189)) {
     $$sum18 = (($8) + 20)|0;
     $190 = (($mem) + ($$sum18)|0);
     $191 = HEAP32[$190>>2]|0;
     $192 = ((125000 + ($191<<2)|0) + 304|0);
     $193 = HEAP32[$192>>2]|0;
     $194 = ($9|0)==($193|0);
     if ($194) {
      HEAP32[$192>>2] = $R7$1;
      $cond54 = ($R7$1|0)==(0|0);
      if ($cond54) {
       $195 = 1 << $191;
       $196 = $195 ^ -1;
       $197 = HEAP32[((125000 + 4|0))>>2]|0;
       $198 = $197 & $196;
       HEAP32[((125000 + 4|0))>>2] = $198;
       break;
      }
     } else {
      $199 = HEAP32[((125000 + 16|0))>>2]|0;
      $200 = ($161>>>0)<($199>>>0);
      if ($200) {
       _abort();
       // unreachable;
      }
      $201 = (($161) + 16|0);
      $202 = HEAP32[$201>>2]|0;
      $203 = ($202|0)==($9|0);
      if ($203) {
       HEAP32[$201>>2] = $R7$1;
      } else {
       $204 = (($161) + 20|0);
       HEAP32[$204>>2] = $R7$1;
      }
      $205 = ($R7$1|0)==(0|0);
      if ($205) {
       break;
      }
     }
     $206 = HEAP32[((125000 + 16|0))>>2]|0;
     $207 = ($R7$1>>>0)<($206>>>0);
     if ($207) {
      _abort();
      // unreachable;
     }
     $208 = (($R7$1) + 24|0);
     HEAP32[$208>>2] = $161;
     $$sum19 = (($8) + 8)|0;
     $209 = (($mem) + ($$sum19)|0);
     $210 = HEAP32[$209>>2]|0;
     $211 = ($210|0)==(0|0);
     do {
      if (!($211)) {
       $212 = ($210>>>0)<($206>>>0);
       if ($212) {
        _abort();
        // unreachable;
       } else {
        $213 = (($R7$1) + 16|0);
        HEAP32[$213>>2] = $210;
        $214 = (($210) + 24|0);
        HEAP32[$214>>2] = $R7$1;
        break;
       }
      }
     } while(0);
     $$sum20 = (($8) + 12)|0;
     $215 = (($mem) + ($$sum20)|0);
     $216 = HEAP32[$215>>2]|0;
     $217 = ($216|0)==(0|0);
     if (!($217)) {
      $218 = HEAP32[((125000 + 16|0))>>2]|0;
      $219 = ($216>>>0)<($218>>>0);
      if ($219) {
       _abort();
       // unreachable;
      } else {
       $220 = (($R7$1) + 20|0);
       HEAP32[$220>>2] = $216;
       $221 = (($216) + 24|0);
       HEAP32[$221>>2] = $R7$1;
       break;
      }
     }
    }
   }
  } while(0);
  $222 = $133 | 1;
  $223 = (($p$0) + 4|0);
  HEAP32[$223>>2] = $222;
  $224 = (($p$0) + ($133)|0);
  HEAP32[$224>>2] = $133;
  $225 = HEAP32[((125000 + 20|0))>>2]|0;
  $226 = ($p$0|0)==($225|0);
  if ($226) {
   HEAP32[((125000 + 8|0))>>2] = $133;
   return;
  } else {
   $psize$1 = $133;
  }
 } else {
  $227 = $112 & -2;
  HEAP32[$111>>2] = $227;
  $228 = $psize$0 | 1;
  $229 = (($p$0) + 4|0);
  HEAP32[$229>>2] = $228;
  $230 = (($p$0) + ($psize$0)|0);
  HEAP32[$230>>2] = $psize$0;
  $psize$1 = $psize$0;
 }
 $231 = $psize$1 >>> 3;
 $232 = ($psize$1>>>0)<(256);
 if ($232) {
  $233 = $231 << 1;
  $234 = ((125000 + ($233<<2)|0) + 40|0);
  $235 = HEAP32[125000>>2]|0;
  $236 = 1 << $231;
  $237 = $235 & $236;
  $238 = ($237|0)==(0);
  if ($238) {
   $239 = $235 | $236;
   HEAP32[125000>>2] = $239;
   $$sum16$pre = (($233) + 2)|0;
   $$pre = ((125000 + ($$sum16$pre<<2)|0) + 40|0);
   $$pre$phiZ2D = $$pre;$F16$0 = $234;
  } else {
   $$sum17 = (($233) + 2)|0;
   $240 = ((125000 + ($$sum17<<2)|0) + 40|0);
   $241 = HEAP32[$240>>2]|0;
   $242 = HEAP32[((125000 + 16|0))>>2]|0;
   $243 = ($241>>>0)<($242>>>0);
   if ($243) {
    _abort();
    // unreachable;
   } else {
    $$pre$phiZ2D = $240;$F16$0 = $241;
   }
  }
  HEAP32[$$pre$phiZ2D>>2] = $p$0;
  $244 = (($F16$0) + 12|0);
  HEAP32[$244>>2] = $p$0;
  $245 = (($p$0) + 8|0);
  HEAP32[$245>>2] = $F16$0;
  $246 = (($p$0) + 12|0);
  HEAP32[$246>>2] = $234;
  return;
 }
 $247 = $psize$1 >>> 8;
 $248 = ($247|0)==(0);
 if ($248) {
  $I18$0 = 0;
 } else {
  $249 = ($psize$1>>>0)>(16777215);
  if ($249) {
   $I18$0 = 31;
  } else {
   $250 = (($247) + 1048320)|0;
   $251 = $250 >>> 16;
   $252 = $251 & 8;
   $253 = $247 << $252;
   $254 = (($253) + 520192)|0;
   $255 = $254 >>> 16;
   $256 = $255 & 4;
   $257 = $256 | $252;
   $258 = $253 << $256;
   $259 = (($258) + 245760)|0;
   $260 = $259 >>> 16;
   $261 = $260 & 2;
   $262 = $257 | $261;
   $263 = (14 - ($262))|0;
   $264 = $258 << $261;
   $265 = $264 >>> 15;
   $266 = (($263) + ($265))|0;
   $267 = $266 << 1;
   $268 = (($266) + 7)|0;
   $269 = $psize$1 >>> $268;
   $270 = $269 & 1;
   $271 = $270 | $267;
   $I18$0 = $271;
  }
 }
 $272 = ((125000 + ($I18$0<<2)|0) + 304|0);
 $273 = (($p$0) + 28|0);
 $I18$0$c = $I18$0;
 HEAP32[$273>>2] = $I18$0$c;
 $274 = (($p$0) + 20|0);
 HEAP32[$274>>2] = 0;
 $275 = (($p$0) + 16|0);
 HEAP32[$275>>2] = 0;
 $276 = HEAP32[((125000 + 4|0))>>2]|0;
 $277 = 1 << $I18$0;
 $278 = $276 & $277;
 $279 = ($278|0)==(0);
 L205: do {
  if ($279) {
   $280 = $276 | $277;
   HEAP32[((125000 + 4|0))>>2] = $280;
   HEAP32[$272>>2] = $p$0;
   $281 = (($p$0) + 24|0);
   HEAP32[$281>>2] = $272;
   $282 = (($p$0) + 12|0);
   HEAP32[$282>>2] = $p$0;
   $283 = (($p$0) + 8|0);
   HEAP32[$283>>2] = $p$0;
  } else {
   $284 = HEAP32[$272>>2]|0;
   $285 = ($I18$0|0)==(31);
   if ($285) {
    $293 = 0;
   } else {
    $286 = $I18$0 >>> 1;
    $287 = (25 - ($286))|0;
    $293 = $287;
   }
   $288 = (($284) + 4|0);
   $289 = HEAP32[$288>>2]|0;
   $290 = $289 & -8;
   $291 = ($290|0)==($psize$1|0);
   do {
    if ($291) {
     $T$0$lcssa = $284;
    } else {
     $292 = $psize$1 << $293;
     $K19$060 = $292;$T$059 = $284;
     while(1) {
      $300 = $K19$060 >>> 31;
      $301 = ((($T$059) + ($300<<2)|0) + 16|0);
      $296 = HEAP32[$301>>2]|0;
      $302 = ($296|0)==(0|0);
      if ($302) {
       $$lcssa = $301;$T$059$lcssa = $T$059;
       break;
      }
      $294 = $K19$060 << 1;
      $295 = (($296) + 4|0);
      $297 = HEAP32[$295>>2]|0;
      $298 = $297 & -8;
      $299 = ($298|0)==($psize$1|0);
      if ($299) {
       $$lcssa73 = $296;
       label = 137;
       break;
      } else {
       $K19$060 = $294;$T$059 = $296;
      }
     }
     if ((label|0) == 137) {
      $T$0$lcssa = $$lcssa73;
      break;
     }
     $303 = HEAP32[((125000 + 16|0))>>2]|0;
     $304 = ($$lcssa>>>0)<($303>>>0);
     if ($304) {
      _abort();
      // unreachable;
     } else {
      HEAP32[$$lcssa>>2] = $p$0;
      $305 = (($p$0) + 24|0);
      HEAP32[$305>>2] = $T$059$lcssa;
      $306 = (($p$0) + 12|0);
      HEAP32[$306>>2] = $p$0;
      $307 = (($p$0) + 8|0);
      HEAP32[$307>>2] = $p$0;
      break L205;
     }
    }
   } while(0);
   $308 = (($T$0$lcssa) + 8|0);
   $309 = HEAP32[$308>>2]|0;
   $310 = HEAP32[((125000 + 16|0))>>2]|0;
   $311 = ($T$0$lcssa>>>0)>=($310>>>0);
   $312 = ($309>>>0)>=($310>>>0);
   $or$cond = $311 & $312;
   if ($or$cond) {
    $313 = (($309) + 12|0);
    HEAP32[$313>>2] = $p$0;
    HEAP32[$308>>2] = $p$0;
    $314 = (($p$0) + 8|0);
    HEAP32[$314>>2] = $309;
    $315 = (($p$0) + 12|0);
    HEAP32[$315>>2] = $T$0$lcssa;
    $316 = (($p$0) + 24|0);
    HEAP32[$316>>2] = 0;
    break;
   } else {
    _abort();
    // unreachable;
   }
  }
 } while(0);
 $317 = HEAP32[((125000 + 32|0))>>2]|0;
 $318 = (($317) + -1)|0;
 HEAP32[((125000 + 32|0))>>2] = $318;
 $319 = ($318|0)==(0);
 if (!($319)) {
  return;
 }
 $sp$0$in$i = ((125000 + 456|0));
 while(1) {
  $sp$0$i = HEAP32[$sp$0$in$i>>2]|0;
  $320 = ($sp$0$i|0)==(0|0);
  $321 = (($sp$0$i) + 8|0);
  if ($320) {
   break;
  } else {
   $sp$0$in$i = $321;
  }
 }
 HEAP32[((125000 + 32|0))>>2] = -1;
 return;
}
function _wctomb($s,$wc) {
 $s = $s|0;
 $wc = $wc|0;
 var $$0 = 0, $0 = 0, $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($s|0)==(0|0);
 if ($0) {
  $$0 = 0;
 } else {
  $1 = (_wcrtomb($s,$wc,0)|0);
  $$0 = $1;
 }
 return ($$0|0);
}
function _wcrtomb($s,$wc,$st) {
 $s = $s|0;
 $wc = $wc|0;
 $st = $st|0;
 var $$0 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0;
 var $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0;
 var $44 = 0, $45 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $or$cond = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($s|0)==(0|0);
 if ($0) {
  $$0 = 1;
  return ($$0|0);
 }
 $1 = ($wc>>>0)<(128);
 if ($1) {
  $2 = $wc&255;
  HEAP8[$s>>0] = $2;
  $$0 = 1;
  return ($$0|0);
 }
 $3 = ($wc>>>0)<(2048);
 if ($3) {
  $4 = $wc >>> 6;
  $5 = $4 | 192;
  $6 = $5&255;
  $7 = (($s) + 1|0);
  HEAP8[$s>>0] = $6;
  $8 = $wc & 63;
  $9 = $8 | 128;
  $10 = $9&255;
  HEAP8[$7>>0] = $10;
  $$0 = 2;
  return ($$0|0);
 }
 $11 = ($wc>>>0)<(55296);
 $12 = $wc & -8192;
 $13 = ($12|0)==(57344);
 $or$cond = $11 | $13;
 if ($or$cond) {
  $14 = $wc >>> 12;
  $15 = $14 | 224;
  $16 = $15&255;
  $17 = (($s) + 1|0);
  HEAP8[$s>>0] = $16;
  $18 = $wc >>> 6;
  $19 = $18 & 63;
  $20 = $19 | 128;
  $21 = $20&255;
  $22 = (($s) + 2|0);
  HEAP8[$17>>0] = $21;
  $23 = $wc & 63;
  $24 = $23 | 128;
  $25 = $24&255;
  HEAP8[$22>>0] = $25;
  $$0 = 3;
  return ($$0|0);
 }
 $26 = (($wc) + -65536)|0;
 $27 = ($26>>>0)<(1048576);
 if ($27) {
  $28 = $wc >>> 18;
  $29 = $28 | 240;
  $30 = $29&255;
  $31 = (($s) + 1|0);
  HEAP8[$s>>0] = $30;
  $32 = $wc >>> 12;
  $33 = $32 & 63;
  $34 = $33 | 128;
  $35 = $34&255;
  $36 = (($s) + 2|0);
  HEAP8[$31>>0] = $35;
  $37 = $wc >>> 6;
  $38 = $37 & 63;
  $39 = $38 | 128;
  $40 = $39&255;
  $41 = (($s) + 3|0);
  HEAP8[$36>>0] = $40;
  $42 = $wc & 63;
  $43 = $42 | 128;
  $44 = $43&255;
  HEAP8[$41>>0] = $44;
  $$0 = 4;
  return ($$0|0);
 } else {
  $45 = (___errno_location()|0);
  HEAP32[$45>>2] = 84;
  $$0 = -1;
  return ($$0|0);
 }
 return (0)|0;
}
function runPostSets() {
 
}
function _memset(ptr, value, num) {
    ptr = ptr|0; value = value|0; num = num|0;
    var stop = 0, value4 = 0, stop4 = 0, unaligned = 0;
    stop = (ptr + num)|0;
    if ((num|0) >= 20) {
      // This is unaligned, but quite large, so work hard to get to aligned settings
      value = value & 0xff;
      unaligned = ptr & 3;
      value4 = value | (value << 8) | (value << 16) | (value << 24);
      stop4 = stop & ~3;
      if (unaligned) {
        unaligned = (ptr + 4 - unaligned)|0;
        while ((ptr|0) < (unaligned|0)) { // no need to check for stop, since we have large num
          HEAP8[((ptr)>>0)]=value;
          ptr = (ptr+1)|0;
        }
      }
      while ((ptr|0) < (stop4|0)) {
        HEAP32[((ptr)>>2)]=value4;
        ptr = (ptr+4)|0;
      }
    }
    while ((ptr|0) < (stop|0)) {
      HEAP8[((ptr)>>0)]=value;
      ptr = (ptr+1)|0;
    }
    return (ptr-num)|0;
}
function _strlen(ptr) {
    ptr = ptr|0;
    var curr = 0;
    curr = ptr;
    while (((HEAP8[((curr)>>0)])|0)) {
      curr = (curr + 1)|0;
    }
    return (curr - ptr)|0;
}
function _memcpy(dest, src, num) {

    dest = dest|0; src = src|0; num = num|0;
    var ret = 0;
    if ((num|0) >= 4096) return _emscripten_memcpy_big(dest|0, src|0, num|0)|0;
    ret = dest|0;
    if ((dest&3) == (src&3)) {
      while (dest & 3) {
        if ((num|0) == 0) return ret|0;
        HEAP8[((dest)>>0)]=((HEAP8[((src)>>0)])|0);
        dest = (dest+1)|0;
        src = (src+1)|0;
        num = (num-1)|0;
      }
      while ((num|0) >= 4) {
        HEAP32[((dest)>>2)]=((HEAP32[((src)>>2)])|0);
        dest = (dest+4)|0;
        src = (src+4)|0;
        num = (num-4)|0;
      }
    }
    while ((num|0) > 0) {
      HEAP8[((dest)>>0)]=((HEAP8[((src)>>0)])|0);
      dest = (dest+1)|0;
      src = (src+1)|0;
      num = (num-1)|0;
    }
    return ret|0;
}

  


// EMSCRIPTEN_END_FUNCS


  return { _strlen: _strlen, _free: _free, _iconv_close: _iconv_close, _memset: _memset, _malloc: _malloc, _memcpy: _memcpy, _iconv: _iconv, _iconv_open: _iconv_open, runPostSets: runPostSets, stackAlloc: stackAlloc, stackSave: stackSave, stackRestore: stackRestore, setThrew: setThrew, setTempRet0: setTempRet0, getTempRet0: getTempRet0 };
})
// EMSCRIPTEN_END_ASM
(Module.asmGlobalArg, Module.asmLibraryArg, buffer);
var real__strlen = asm["_strlen"]; asm["_strlen"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__strlen.apply(null, arguments);
};

var real__iconv_close = asm["_iconv_close"]; asm["_iconv_close"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__iconv_close.apply(null, arguments);
};

var real__iconv = asm["_iconv"]; asm["_iconv"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__iconv.apply(null, arguments);
};

var real__iconv_open = asm["_iconv_open"]; asm["_iconv_open"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__iconv_open.apply(null, arguments);
};

var real_runPostSets = asm["runPostSets"]; asm["runPostSets"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real_runPostSets.apply(null, arguments);
};
var _strlen = Module["_strlen"] = asm["_strlen"];
var _free = Module["_free"] = asm["_free"];
var _iconv_close = Module["_iconv_close"] = asm["_iconv_close"];
var _memset = Module["_memset"] = asm["_memset"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _iconv = Module["_iconv"] = asm["_iconv"];
var _iconv_open = Module["_iconv_open"] = asm["_iconv_open"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];

Runtime.stackAlloc = asm['stackAlloc'];
Runtime.stackSave = asm['stackSave'];
Runtime.stackRestore = asm['stackRestore'];
Runtime.setTempRet0 = asm['setTempRet0'];
Runtime.getTempRet0 = asm['getTempRet0'];


// Warning: printing of i64 values may be slightly rounded! No deep i64 math used, so precise i64 code not included
var i64Math = null;

// === Auto-generated postamble setup entry stuff ===

if (memoryInitializer) {
  if (typeof Module['locateFile'] === 'function') {
    memoryInitializer = Module['locateFile'](memoryInitializer);
  } else if (Module['memoryInitializerPrefixURL']) {
    memoryInitializer = Module['memoryInitializerPrefixURL'] + memoryInitializer;
  }
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    var data = Module['readBinary'](memoryInitializer);
    HEAPU8.set(data, STATIC_BASE);
  } else {
    addRunDependency('memory initializer');
    function applyMemoryInitializer(data) {
      if (data.byteLength) data = new Uint8Array(data);
      for (var i = 0; i < data.length; i++) {
        assert(HEAPU8[STATIC_BASE + i] === 0, "area for memory initializer should not have been touched before it's loaded");
      }
      HEAPU8.set(data, STATIC_BASE);
      removeRunDependency('memory initializer');
    }
    var request = Module['memoryInitializerRequest'];
    if (request) {
      // a network request has already been created, just use that
      if (request.response) {
        setTimeout(function() {
          applyMemoryInitializer(request.response);
        }, 0); // it's already here; but, apply it asynchronously
      } else {
        request.addEventListener('load', function() { // wait for it
          if (request.status !== 200 && request.status !== 0) {
            console.warn('a problem seems to have happened with Module.memoryInitializerRequest, status: ' + request.status);
          }
          if (!request.response || typeof request.response !== 'object' || !request.response.byteLength) {
            console.warn('a problem seems to have happened with Module.memoryInitializerRequest response (expected ArrayBuffer): ' + request.response);
          }
          applyMemoryInitializer(request.response);
        });
      }
    } else {
      // fetch it from the network ourselves
      Browser.asyncLoad(memoryInitializer, applyMemoryInitializer, function() {
        throw 'could not load memory initializer ' + memoryInitializer;
      });
    }
  }
}

function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;

var initialStackTop;
var preloadStartTime = null;
var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun']) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}

Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');

  args = args || [];

  ensureInitRuntime();

  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString(Module['thisProgram']), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);

  initialStackTop = STACKTOP;

  try {

    var ret = Module['_main'](argc, argv, 0);


    // if we're not running an evented main loop, it's time to exit
    exit(ret);
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}




function run(args) {
  args = args || Module['arguments'];

  if (preloadStartTime === null) preloadStartTime = Date.now();

  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }

  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
  if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

  function doRun() {
    if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
    Module['calledRun'] = true;

    if (ABORT) return; 

    ensureInitRuntime();

    preMain();

    if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
      Module.printErr('pre-main prep time: ' + (Date.now() - preloadStartTime) + ' ms');
    }

    if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();

    if (Module['_main'] && shouldRunNow) Module['callMain'](args);

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;

function exit(status) {
  if (Module['noExitRuntime']) {
    Module.printErr('exit(' + status + ') called, but noExitRuntime, so not exiting (you can use emscripten_force_exit, if you want to force a true shutdown)');
    return;
  }

  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;

  // exit the runtime
  exitRuntime();

  if (Module['onExit']) Module['onExit'](status);

  if (ENVIRONMENT_IS_NODE) {
    // Work around a node.js bug where stdout buffer is not flushed at process exit:
    // Instead of process.exit() directly, wait for stdout flush event.
    // See https://github.com/joyent/node/issues/1669 and https://github.com/kripken/emscripten/issues/2582
    // Workaround is based on https://github.com/RReverser/acorn/commit/50ab143cecc9ed71a2d66f78b4aec3bb2e9844f6
    process['stdout']['once']('drain', function () {
      process['exit'](status);
    });
    console.log(' '); // Make sure to print something to force the drain event to occur, in case the stdout buffer was empty.
    // Work around another node bug where sometimes 'drain' is never fired - make another effort
    // to emit the exit status, after a significant delay (if node hasn't fired drain by then, give up)
    setTimeout(function() {
      process['exit'](status);
    }, 500);
  } else
  if (ENVIRONMENT_IS_SHELL && typeof quit === 'function') {
    quit(status);
  }
  // if we reach here, we must throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;

var abortDecorators = [];

function abort(what) {
  if (what !== undefined) {
    Module.print(what);
    Module.printErr(what);
    what = JSON.stringify(what)
  } else {
    what = '';
  }

  ABORT = true;
  EXITSTATUS = 1;

  var extra = '';

  var output = 'abort(' + what + ') at ' + stackTrace() + extra;
  abortDecorators.forEach(function(decorator) {
    output = decorator(output, what);
  });
  throw output;
}
Module['abort'] = Module.abort = abort;

// {{PRE_RUN_ADDITIONS}}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}


run();

// {{POST_RUN_ADDITIONS}}






// {{MODULE_ADDITIONS}}



