(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('js-sha3'), require('bn.js')) :
    typeof define === 'function' && define.amd ? define(['exports', 'js-sha3', 'bn.js'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global["blockus-eth-payment"] = {}, global.sha3, global.BN$2));
})(this, (function (exports, sha3, BN$2) { 'use strict';

    const version$i = "logger/5.7.0";

    let _permanentCensorErrors$1 = false;
    let _censorErrors$1 = false;
    const LogLevels$1 = { debug: 1, "default": 2, info: 2, warning: 3, error: 4, off: 5 };
    let _logLevel$1 = LogLevels$1["default"];
    let _globalLogger$1 = null;
    function _checkNormalize$1() {
        try {
            const missing = [];
            // Make sure all forms of normalization are supported
            ["NFD", "NFC", "NFKD", "NFKC"].forEach((form) => {
                try {
                    if ("test".normalize(form) !== "test") {
                        throw new Error("bad normalize");
                    }
                    ;
                }
                catch (error) {
                    missing.push(form);
                }
            });
            if (missing.length) {
                throw new Error("missing " + missing.join(", "));
            }
            if (String.fromCharCode(0xe9).normalize("NFD") !== String.fromCharCode(0x65, 0x0301)) {
                throw new Error("broken implementation");
            }
        }
        catch (error) {
            return error.message;
        }
        return null;
    }
    const _normalizeError$1 = _checkNormalize$1();
    var LogLevel$1;
    (function (LogLevel) {
        LogLevel["DEBUG"] = "DEBUG";
        LogLevel["INFO"] = "INFO";
        LogLevel["WARNING"] = "WARNING";
        LogLevel["ERROR"] = "ERROR";
        LogLevel["OFF"] = "OFF";
    })(LogLevel$1 || (LogLevel$1 = {}));
    var ErrorCode$1;
    (function (ErrorCode) {
        ///////////////////
        // Generic Errors
        // Unknown Error
        ErrorCode["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
        // Not Implemented
        ErrorCode["NOT_IMPLEMENTED"] = "NOT_IMPLEMENTED";
        // Unsupported Operation
        //   - operation
        ErrorCode["UNSUPPORTED_OPERATION"] = "UNSUPPORTED_OPERATION";
        // Network Error (i.e. Ethereum Network, such as an invalid chain ID)
        //   - event ("noNetwork" is not re-thrown in provider.ready; otherwise thrown)
        ErrorCode["NETWORK_ERROR"] = "NETWORK_ERROR";
        // Some sort of bad response from the server
        ErrorCode["SERVER_ERROR"] = "SERVER_ERROR";
        // Timeout
        ErrorCode["TIMEOUT"] = "TIMEOUT";
        ///////////////////
        // Operational  Errors
        // Buffer Overrun
        ErrorCode["BUFFER_OVERRUN"] = "BUFFER_OVERRUN";
        // Numeric Fault
        //   - operation: the operation being executed
        //   - fault: the reason this faulted
        ErrorCode["NUMERIC_FAULT"] = "NUMERIC_FAULT";
        ///////////////////
        // Argument Errors
        // Missing new operator to an object
        //  - name: The name of the class
        ErrorCode["MISSING_NEW"] = "MISSING_NEW";
        // Invalid argument (e.g. value is incompatible with type) to a function:
        //   - argument: The argument name that was invalid
        //   - value: The value of the argument
        ErrorCode["INVALID_ARGUMENT"] = "INVALID_ARGUMENT";
        // Missing argument to a function:
        //   - count: The number of arguments received
        //   - expectedCount: The number of arguments expected
        ErrorCode["MISSING_ARGUMENT"] = "MISSING_ARGUMENT";
        // Too many arguments
        //   - count: The number of arguments received
        //   - expectedCount: The number of arguments expected
        ErrorCode["UNEXPECTED_ARGUMENT"] = "UNEXPECTED_ARGUMENT";
        ///////////////////
        // Blockchain Errors
        // Call exception
        //  - transaction: the transaction
        //  - address?: the contract address
        //  - args?: The arguments passed into the function
        //  - method?: The Solidity method signature
        //  - errorSignature?: The EIP848 error signature
        //  - errorArgs?: The EIP848 error parameters
        //  - reason: The reason (only for EIP848 "Error(string)")
        ErrorCode["CALL_EXCEPTION"] = "CALL_EXCEPTION";
        // Insufficient funds (< value + gasLimit * gasPrice)
        //   - transaction: the transaction attempted
        ErrorCode["INSUFFICIENT_FUNDS"] = "INSUFFICIENT_FUNDS";
        // Nonce has already been used
        //   - transaction: the transaction attempted
        ErrorCode["NONCE_EXPIRED"] = "NONCE_EXPIRED";
        // The replacement fee for the transaction is too low
        //   - transaction: the transaction attempted
        ErrorCode["REPLACEMENT_UNDERPRICED"] = "REPLACEMENT_UNDERPRICED";
        // The gas limit could not be estimated
        //   - transaction: the transaction passed to estimateGas
        ErrorCode["UNPREDICTABLE_GAS_LIMIT"] = "UNPREDICTABLE_GAS_LIMIT";
        // The transaction was replaced by one with a higher gas price
        //   - reason: "cancelled", "replaced" or "repriced"
        //   - cancelled: true if reason == "cancelled" or reason == "replaced")
        //   - hash: original transaction hash
        //   - replacement: the full TransactionsResponse for the replacement
        //   - receipt: the receipt of the replacement
        ErrorCode["TRANSACTION_REPLACED"] = "TRANSACTION_REPLACED";
        ///////////////////
        // Interaction Errors
        // The user rejected the action, such as signing a message or sending
        // a transaction
        ErrorCode["ACTION_REJECTED"] = "ACTION_REJECTED";
    })(ErrorCode$1 || (ErrorCode$1 = {}));
    const HEX$1 = "0123456789abcdef";
    let Logger$1 = class Logger {
        constructor(version) {
            Object.defineProperty(this, "version", {
                enumerable: true,
                value: version,
                writable: false
            });
        }
        _log(logLevel, args) {
            const level = logLevel.toLowerCase();
            if (LogLevels$1[level] == null) {
                this.throwArgumentError("invalid log level name", "logLevel", logLevel);
            }
            if (_logLevel$1 > LogLevels$1[level]) {
                return;
            }
            console.log.apply(console, args);
        }
        debug(...args) {
            this._log(Logger.levels.DEBUG, args);
        }
        info(...args) {
            this._log(Logger.levels.INFO, args);
        }
        warn(...args) {
            this._log(Logger.levels.WARNING, args);
        }
        makeError(message, code, params) {
            // Errors are being censored
            if (_censorErrors$1) {
                return this.makeError("censored error", code, {});
            }
            if (!code) {
                code = Logger.errors.UNKNOWN_ERROR;
            }
            if (!params) {
                params = {};
            }
            const messageDetails = [];
            Object.keys(params).forEach((key) => {
                const value = params[key];
                try {
                    if (value instanceof Uint8Array) {
                        let hex = "";
                        for (let i = 0; i < value.length; i++) {
                            hex += HEX$1[value[i] >> 4];
                            hex += HEX$1[value[i] & 0x0f];
                        }
                        messageDetails.push(key + "=Uint8Array(0x" + hex + ")");
                    }
                    else {
                        messageDetails.push(key + "=" + JSON.stringify(value));
                    }
                }
                catch (error) {
                    messageDetails.push(key + "=" + JSON.stringify(params[key].toString()));
                }
            });
            messageDetails.push(`code=${code}`);
            messageDetails.push(`version=${this.version}`);
            const reason = message;
            let url = "";
            switch (code) {
                case ErrorCode$1.NUMERIC_FAULT: {
                    url = "NUMERIC_FAULT";
                    const fault = message;
                    switch (fault) {
                        case "overflow":
                        case "underflow":
                        case "division-by-zero":
                            url += "-" + fault;
                            break;
                        case "negative-power":
                        case "negative-width":
                            url += "-unsupported";
                            break;
                        case "unbound-bitwise-result":
                            url += "-unbound-result";
                            break;
                    }
                    break;
                }
                case ErrorCode$1.CALL_EXCEPTION:
                case ErrorCode$1.INSUFFICIENT_FUNDS:
                case ErrorCode$1.MISSING_NEW:
                case ErrorCode$1.NONCE_EXPIRED:
                case ErrorCode$1.REPLACEMENT_UNDERPRICED:
                case ErrorCode$1.TRANSACTION_REPLACED:
                case ErrorCode$1.UNPREDICTABLE_GAS_LIMIT:
                    url = code;
                    break;
            }
            if (url) {
                message += " [ See: https:/\/links.ethers.org/v5-errors-" + url + " ]";
            }
            if (messageDetails.length) {
                message += " (" + messageDetails.join(", ") + ")";
            }
            // @TODO: Any??
            const error = new Error(message);
            error.reason = reason;
            error.code = code;
            Object.keys(params).forEach(function (key) {
                error[key] = params[key];
            });
            return error;
        }
        throwError(message, code, params) {
            throw this.makeError(message, code, params);
        }
        throwArgumentError(message, name, value) {
            return this.throwError(message, Logger.errors.INVALID_ARGUMENT, {
                argument: name,
                value: value
            });
        }
        assert(condition, message, code, params) {
            if (!!condition) {
                return;
            }
            this.throwError(message, code, params);
        }
        assertArgument(condition, message, name, value) {
            if (!!condition) {
                return;
            }
            this.throwArgumentError(message, name, value);
        }
        checkNormalize(message) {
            if (_normalizeError$1) {
                this.throwError("platform missing String.prototype.normalize", Logger.errors.UNSUPPORTED_OPERATION, {
                    operation: "String.prototype.normalize", form: _normalizeError$1
                });
            }
        }
        checkSafeUint53(value, message) {
            if (typeof (value) !== "number") {
                return;
            }
            if (message == null) {
                message = "value not safe";
            }
            if (value < 0 || value >= 0x1fffffffffffff) {
                this.throwError(message, Logger.errors.NUMERIC_FAULT, {
                    operation: "checkSafeInteger",
                    fault: "out-of-safe-range",
                    value: value
                });
            }
            if (value % 1) {
                this.throwError(message, Logger.errors.NUMERIC_FAULT, {
                    operation: "checkSafeInteger",
                    fault: "non-integer",
                    value: value
                });
            }
        }
        checkArgumentCount(count, expectedCount, message) {
            if (message) {
                message = ": " + message;
            }
            else {
                message = "";
            }
            if (count < expectedCount) {
                this.throwError("missing argument" + message, Logger.errors.MISSING_ARGUMENT, {
                    count: count,
                    expectedCount: expectedCount
                });
            }
            if (count > expectedCount) {
                this.throwError("too many arguments" + message, Logger.errors.UNEXPECTED_ARGUMENT, {
                    count: count,
                    expectedCount: expectedCount
                });
            }
        }
        checkNew(target, kind) {
            if (target === Object || target == null) {
                this.throwError("missing new", Logger.errors.MISSING_NEW, { name: kind.name });
            }
        }
        checkAbstract(target, kind) {
            if (target === kind) {
                this.throwError("cannot instantiate abstract class " + JSON.stringify(kind.name) + " directly; use a sub-class", Logger.errors.UNSUPPORTED_OPERATION, { name: target.name, operation: "new" });
            }
            else if (target === Object || target == null) {
                this.throwError("missing new", Logger.errors.MISSING_NEW, { name: kind.name });
            }
        }
        static globalLogger() {
            if (!_globalLogger$1) {
                _globalLogger$1 = new Logger(version$i);
            }
            return _globalLogger$1;
        }
        static setCensorship(censorship, permanent) {
            if (!censorship && permanent) {
                this.globalLogger().throwError("cannot permanently disable censorship", Logger.errors.UNSUPPORTED_OPERATION, {
                    operation: "setCensorship"
                });
            }
            if (_permanentCensorErrors$1) {
                if (!censorship) {
                    return;
                }
                this.globalLogger().throwError("error censorship permanent", Logger.errors.UNSUPPORTED_OPERATION, {
                    operation: "setCensorship"
                });
            }
            _censorErrors$1 = !!censorship;
            _permanentCensorErrors$1 = !!permanent;
        }
        static setLogLevel(logLevel) {
            const level = LogLevels$1[logLevel.toLowerCase()];
            if (level == null) {
                Logger.globalLogger().warn("invalid log level - " + logLevel);
                return;
            }
            _logLevel$1 = level;
        }
        static from(version) {
            return new Logger(version);
        }
    };
    Logger$1.errors = ErrorCode$1;
    Logger$1.levels = LogLevel$1;

    const version$h = "bytes/5.7.0";

    const logger$o = new Logger$1(version$h);
    ///////////////////////////////
    function isHexable$1(value) {
        return !!(value.toHexString);
    }
    function addSlice$1(array) {
        if (array.slice) {
            return array;
        }
        array.slice = function () {
            const args = Array.prototype.slice.call(arguments);
            return addSlice$1(new Uint8Array(Array.prototype.slice.apply(array, args)));
        };
        return array;
    }
    function isBytesLike$1(value) {
        return ((isHexString$1(value) && !(value.length % 2)) || isBytes$1(value));
    }
    function isInteger$1(value) {
        return (typeof (value) === "number" && value == value && (value % 1) === 0);
    }
    function isBytes$1(value) {
        if (value == null) {
            return false;
        }
        if (value.constructor === Uint8Array) {
            return true;
        }
        if (typeof (value) === "string") {
            return false;
        }
        if (!isInteger$1(value.length) || value.length < 0) {
            return false;
        }
        for (let i = 0; i < value.length; i++) {
            const v = value[i];
            if (!isInteger$1(v) || v < 0 || v >= 256) {
                return false;
            }
        }
        return true;
    }
    function arrayify$1(value, options) {
        if (!options) {
            options = {};
        }
        if (typeof (value) === "number") {
            logger$o.checkSafeUint53(value, "invalid arrayify value");
            const result = [];
            while (value) {
                result.unshift(value & 0xff);
                value = parseInt(String(value / 256));
            }
            if (result.length === 0) {
                result.push(0);
            }
            return addSlice$1(new Uint8Array(result));
        }
        if (options.allowMissingPrefix && typeof (value) === "string" && value.substring(0, 2) !== "0x") {
            value = "0x" + value;
        }
        if (isHexable$1(value)) {
            value = value.toHexString();
        }
        if (isHexString$1(value)) {
            let hex = value.substring(2);
            if (hex.length % 2) {
                if (options.hexPad === "left") {
                    hex = "0" + hex;
                }
                else if (options.hexPad === "right") {
                    hex += "0";
                }
                else {
                    logger$o.throwArgumentError("hex data is odd-length", "value", value);
                }
            }
            const result = [];
            for (let i = 0; i < hex.length; i += 2) {
                result.push(parseInt(hex.substring(i, i + 2), 16));
            }
            return addSlice$1(new Uint8Array(result));
        }
        if (isBytes$1(value)) {
            return addSlice$1(new Uint8Array(value));
        }
        return logger$o.throwArgumentError("invalid arrayify value", "value", value);
    }
    function concat$1(items) {
        const objects = items.map(item => arrayify$1(item));
        const length = objects.reduce((accum, item) => (accum + item.length), 0);
        const result = new Uint8Array(length);
        objects.reduce((offset, object) => {
            result.set(object, offset);
            return offset + object.length;
        }, 0);
        return addSlice$1(result);
    }
    function stripZeros(value) {
        let result = arrayify$1(value);
        if (result.length === 0) {
            return result;
        }
        // Find the first non-zero entry
        let start = 0;
        while (start < result.length && result[start] === 0) {
            start++;
        }
        // If we started with zeros, strip them
        if (start) {
            result = result.slice(start);
        }
        return result;
    }
    function isHexString$1(value, length) {
        if (typeof (value) !== "string" || !value.match(/^0x[0-9A-Fa-f]*$/)) {
            return false;
        }
        if (length && value.length !== 2 + 2 * length) {
            return false;
        }
        return true;
    }
    const HexCharacters$1 = "0123456789abcdef";
    function hexlify$1(value, options) {
        if (!options) {
            options = {};
        }
        if (typeof (value) === "number") {
            logger$o.checkSafeUint53(value, "invalid hexlify value");
            let hex = "";
            while (value) {
                hex = HexCharacters$1[value & 0xf] + hex;
                value = Math.floor(value / 16);
            }
            if (hex.length) {
                if (hex.length % 2) {
                    hex = "0" + hex;
                }
                return "0x" + hex;
            }
            return "0x00";
        }
        if (typeof (value) === "bigint") {
            value = value.toString(16);
            if (value.length % 2) {
                return ("0x0" + value);
            }
            return "0x" + value;
        }
        if (options.allowMissingPrefix && typeof (value) === "string" && value.substring(0, 2) !== "0x") {
            value = "0x" + value;
        }
        if (isHexable$1(value)) {
            return value.toHexString();
        }
        if (isHexString$1(value)) {
            if (value.length % 2) {
                if (options.hexPad === "left") {
                    value = "0x0" + value.substring(2);
                }
                else if (options.hexPad === "right") {
                    value += "0";
                }
                else {
                    logger$o.throwArgumentError("hex data is odd-length", "value", value);
                }
            }
            return value.toLowerCase();
        }
        if (isBytes$1(value)) {
            let result = "0x";
            for (let i = 0; i < value.length; i++) {
                let v = value[i];
                result += HexCharacters$1[(v & 0xf0) >> 4] + HexCharacters$1[v & 0x0f];
            }
            return result;
        }
        return logger$o.throwArgumentError("invalid hexlify value", "value", value);
    }
    /*
    function unoddify(value: BytesLike | Hexable | number): BytesLike | Hexable | number {
        if (typeof(value) === "string" && value.length % 2 && value.substring(0, 2) === "0x") {
            return "0x0" + value.substring(2);
        }
        return value;
    }
    */
    function hexDataLength(data) {
        if (typeof (data) !== "string") {
            data = hexlify$1(data);
        }
        else if (!isHexString$1(data) || (data.length % 2)) {
            return null;
        }
        return (data.length - 2) / 2;
    }
    function hexDataSlice$1(data, offset, endOffset) {
        if (typeof (data) !== "string") {
            data = hexlify$1(data);
        }
        else if (!isHexString$1(data) || (data.length % 2)) {
            logger$o.throwArgumentError("invalid hexData", "value", data);
        }
        offset = 2 + 2 * offset;
        if (endOffset != null) {
            return "0x" + data.substring(offset, 2 + 2 * endOffset);
        }
        return "0x" + data.substring(offset);
    }
    function hexConcat$1(items) {
        let result = "0x";
        items.forEach((item) => {
            result += hexlify$1(item).substring(2);
        });
        return result;
    }
    function hexZeroPad$1(value, length) {
        if (typeof (value) !== "string") {
            value = hexlify$1(value);
        }
        else if (!isHexString$1(value)) {
            logger$o.throwArgumentError("invalid hex string", "value", value);
        }
        if (value.length > 2 * length + 2) {
            logger$o.throwArgumentError("value out of range", "value", arguments[1]);
        }
        while (value.length < 2 * length + 2) {
            value = "0x0" + value.substring(2);
        }
        return value;
    }

    const version$g = "bignumber/5.7.0";

    var BN$1 = BN$2.BN;
    const logger$n = new Logger$1(version$g);
    const _constructorGuard$3 = {};
    const MAX_SAFE$1 = 0x1fffffffffffff;
    // Only warn about passing 10 into radix once
    let _warnedToStringRadix$1 = false;
    let BigNumber$1 = class BigNumber {
        constructor(constructorGuard, hex) {
            if (constructorGuard !== _constructorGuard$3) {
                logger$n.throwError("cannot call constructor directly; use BigNumber.from", Logger$1.errors.UNSUPPORTED_OPERATION, {
                    operation: "new (BigNumber)"
                });
            }
            this._hex = hex;
            this._isBigNumber = true;
            Object.freeze(this);
        }
        fromTwos(value) {
            return toBigNumber$1(toBN$1(this).fromTwos(value));
        }
        toTwos(value) {
            return toBigNumber$1(toBN$1(this).toTwos(value));
        }
        abs() {
            if (this._hex[0] === "-") {
                return BigNumber.from(this._hex.substring(1));
            }
            return this;
        }
        add(other) {
            return toBigNumber$1(toBN$1(this).add(toBN$1(other)));
        }
        sub(other) {
            return toBigNumber$1(toBN$1(this).sub(toBN$1(other)));
        }
        div(other) {
            const o = BigNumber.from(other);
            if (o.isZero()) {
                throwFault$1("division-by-zero", "div");
            }
            return toBigNumber$1(toBN$1(this).div(toBN$1(other)));
        }
        mul(other) {
            return toBigNumber$1(toBN$1(this).mul(toBN$1(other)));
        }
        mod(other) {
            const value = toBN$1(other);
            if (value.isNeg()) {
                throwFault$1("division-by-zero", "mod");
            }
            return toBigNumber$1(toBN$1(this).umod(value));
        }
        pow(other) {
            const value = toBN$1(other);
            if (value.isNeg()) {
                throwFault$1("negative-power", "pow");
            }
            return toBigNumber$1(toBN$1(this).pow(value));
        }
        and(other) {
            const value = toBN$1(other);
            if (this.isNegative() || value.isNeg()) {
                throwFault$1("unbound-bitwise-result", "and");
            }
            return toBigNumber$1(toBN$1(this).and(value));
        }
        or(other) {
            const value = toBN$1(other);
            if (this.isNegative() || value.isNeg()) {
                throwFault$1("unbound-bitwise-result", "or");
            }
            return toBigNumber$1(toBN$1(this).or(value));
        }
        xor(other) {
            const value = toBN$1(other);
            if (this.isNegative() || value.isNeg()) {
                throwFault$1("unbound-bitwise-result", "xor");
            }
            return toBigNumber$1(toBN$1(this).xor(value));
        }
        mask(value) {
            if (this.isNegative() || value < 0) {
                throwFault$1("negative-width", "mask");
            }
            return toBigNumber$1(toBN$1(this).maskn(value));
        }
        shl(value) {
            if (this.isNegative() || value < 0) {
                throwFault$1("negative-width", "shl");
            }
            return toBigNumber$1(toBN$1(this).shln(value));
        }
        shr(value) {
            if (this.isNegative() || value < 0) {
                throwFault$1("negative-width", "shr");
            }
            return toBigNumber$1(toBN$1(this).shrn(value));
        }
        eq(other) {
            return toBN$1(this).eq(toBN$1(other));
        }
        lt(other) {
            return toBN$1(this).lt(toBN$1(other));
        }
        lte(other) {
            return toBN$1(this).lte(toBN$1(other));
        }
        gt(other) {
            return toBN$1(this).gt(toBN$1(other));
        }
        gte(other) {
            return toBN$1(this).gte(toBN$1(other));
        }
        isNegative() {
            return (this._hex[0] === "-");
        }
        isZero() {
            return toBN$1(this).isZero();
        }
        toNumber() {
            try {
                return toBN$1(this).toNumber();
            }
            catch (error) {
                throwFault$1("overflow", "toNumber", this.toString());
            }
            return null;
        }
        toBigInt() {
            try {
                return BigInt(this.toString());
            }
            catch (e) { }
            return logger$n.throwError("this platform does not support BigInt", Logger$1.errors.UNSUPPORTED_OPERATION, {
                value: this.toString()
            });
        }
        toString() {
            // Lots of people expect this, which we do not support, so check (See: #889)
            if (arguments.length > 0) {
                if (arguments[0] === 10) {
                    if (!_warnedToStringRadix$1) {
                        _warnedToStringRadix$1 = true;
                        logger$n.warn("BigNumber.toString does not accept any parameters; base-10 is assumed");
                    }
                }
                else if (arguments[0] === 16) {
                    logger$n.throwError("BigNumber.toString does not accept any parameters; use bigNumber.toHexString()", Logger$1.errors.UNEXPECTED_ARGUMENT, {});
                }
                else {
                    logger$n.throwError("BigNumber.toString does not accept parameters", Logger$1.errors.UNEXPECTED_ARGUMENT, {});
                }
            }
            return toBN$1(this).toString(10);
        }
        toHexString() {
            return this._hex;
        }
        toJSON(key) {
            return { type: "BigNumber", hex: this.toHexString() };
        }
        static from(value) {
            if (value instanceof BigNumber) {
                return value;
            }
            if (typeof (value) === "string") {
                if (value.match(/^-?0x[0-9a-f]+$/i)) {
                    return new BigNumber(_constructorGuard$3, toHex$1(value));
                }
                if (value.match(/^-?[0-9]+$/)) {
                    return new BigNumber(_constructorGuard$3, toHex$1(new BN$1(value)));
                }
                return logger$n.throwArgumentError("invalid BigNumber string", "value", value);
            }
            if (typeof (value) === "number") {
                if (value % 1) {
                    throwFault$1("underflow", "BigNumber.from", value);
                }
                if (value >= MAX_SAFE$1 || value <= -MAX_SAFE$1) {
                    throwFault$1("overflow", "BigNumber.from", value);
                }
                return BigNumber.from(String(value));
            }
            const anyValue = value;
            if (typeof (anyValue) === "bigint") {
                return BigNumber.from(anyValue.toString());
            }
            if (isBytes$1(anyValue)) {
                return BigNumber.from(hexlify$1(anyValue));
            }
            if (anyValue) {
                // Hexable interface (takes priority)
                if (anyValue.toHexString) {
                    const hex = anyValue.toHexString();
                    if (typeof (hex) === "string") {
                        return BigNumber.from(hex);
                    }
                }
                else {
                    // For now, handle legacy JSON-ified values (goes away in v6)
                    let hex = anyValue._hex;
                    // New-form JSON
                    if (hex == null && anyValue.type === "BigNumber") {
                        hex = anyValue.hex;
                    }
                    if (typeof (hex) === "string") {
                        if (isHexString$1(hex) || (hex[0] === "-" && isHexString$1(hex.substring(1)))) {
                            return BigNumber.from(hex);
                        }
                    }
                }
            }
            return logger$n.throwArgumentError("invalid BigNumber value", "value", value);
        }
        static isBigNumber(value) {
            return !!(value && value._isBigNumber);
        }
    };
    // Normalize the hex string
    function toHex$1(value) {
        // For BN, call on the hex string
        if (typeof (value) !== "string") {
            return toHex$1(value.toString(16));
        }
        // If negative, prepend the negative sign to the normalized positive value
        if (value[0] === "-") {
            // Strip off the negative sign
            value = value.substring(1);
            // Cannot have multiple negative signs (e.g. "--0x04")
            if (value[0] === "-") {
                logger$n.throwArgumentError("invalid hex", "value", value);
            }
            // Call toHex on the positive component
            value = toHex$1(value);
            // Do not allow "-0x00"
            if (value === "0x00") {
                return value;
            }
            // Negate the value
            return "-" + value;
        }
        // Add a "0x" prefix if missing
        if (value.substring(0, 2) !== "0x") {
            value = "0x" + value;
        }
        // Normalize zero
        if (value === "0x") {
            return "0x00";
        }
        // Make the string even length
        if (value.length % 2) {
            value = "0x0" + value.substring(2);
        }
        // Trim to smallest even-length string
        while (value.length > 4 && value.substring(0, 4) === "0x00") {
            value = "0x" + value.substring(4);
        }
        return value;
    }
    function toBigNumber$1(value) {
        return BigNumber$1.from(toHex$1(value));
    }
    function toBN$1(value) {
        const hex = BigNumber$1.from(value).toHexString();
        if (hex[0] === "-") {
            return (new BN$1("-" + hex.substring(3), 16));
        }
        return new BN$1(hex.substring(2), 16);
    }
    function throwFault$1(fault, operation, value) {
        const params = { fault: fault, operation: operation };
        if (value != null) {
            params.value = value;
        }
        return logger$n.throwError(fault, Logger$1.errors.NUMERIC_FAULT, params);
    }
    // value should have no prefix
    function _base36To16$1(value) {
        return (new BN$1(value, 36)).toString(16);
    }

    const version$f = "properties/5.7.0";

    var __awaiter$3 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    const logger$m = new Logger$1(version$f);
    function defineReadOnly$1(object, name, value) {
        Object.defineProperty(object, name, {
            enumerable: true,
            value: value,
            writable: false,
        });
    }
    // Crawl up the constructor chain to find a static method
    function getStatic$1(ctor, key) {
        for (let i = 0; i < 32; i++) {
            if (ctor[key]) {
                return ctor[key];
            }
            if (!ctor.prototype || typeof (ctor.prototype) !== "object") {
                break;
            }
            ctor = Object.getPrototypeOf(ctor.prototype).constructor;
        }
        return null;
    }
    function resolveProperties(object) {
        return __awaiter$3(this, void 0, void 0, function* () {
            const promises = Object.keys(object).map((key) => {
                const value = object[key];
                return Promise.resolve(value).then((v) => ({ key: key, value: v }));
            });
            const results = yield Promise.all(promises);
            return results.reduce((accum, result) => {
                accum[(result.key)] = result.value;
                return accum;
            }, {});
        });
    }
    function shallowCopy(object) {
        const result = {};
        for (const key in object) {
            result[key] = object[key];
        }
        return result;
    }
    const opaque$1 = { bigint: true, boolean: true, "function": true, number: true, string: true };
    function _isFrozen$1(object) {
        // Opaque objects are not mutable, so safe to copy by assignment
        if (object === undefined || object === null || opaque$1[typeof (object)]) {
            return true;
        }
        if (Array.isArray(object) || typeof (object) === "object") {
            if (!Object.isFrozen(object)) {
                return false;
            }
            const keys = Object.keys(object);
            for (let i = 0; i < keys.length; i++) {
                let value = null;
                try {
                    value = object[keys[i]];
                }
                catch (error) {
                    // If accessing a value triggers an error, it is a getter
                    // designed to do so (e.g. Result) and is therefore "frozen"
                    continue;
                }
                if (!_isFrozen$1(value)) {
                    return false;
                }
            }
            return true;
        }
        return logger$m.throwArgumentError(`Cannot deepCopy ${typeof (object)}`, "object", object);
    }
    // Returns a new copy of object, such that no properties may be replaced.
    // New properties may be added only to objects.
    function _deepCopy$1(object) {
        if (_isFrozen$1(object)) {
            return object;
        }
        // Arrays are mutable, so we need to create a copy
        if (Array.isArray(object)) {
            return Object.freeze(object.map((item) => deepCopy$1(item)));
        }
        if (typeof (object) === "object") {
            const result = {};
            for (const key in object) {
                const value = object[key];
                if (value === undefined) {
                    continue;
                }
                defineReadOnly$1(result, key, deepCopy$1(value));
            }
            return result;
        }
        return logger$m.throwArgumentError(`Cannot deepCopy ${typeof (object)}`, "object", object);
    }
    function deepCopy$1(object) {
        return _deepCopy$1(object);
    }
    let Description$1 = class Description {
        constructor(info) {
            for (const key in info) {
                this[key] = deepCopy$1(info[key]);
            }
        }
    };

    const version$e = "abi/5.7.0";

    const logger$l = new Logger$1(version$e);
    const _constructorGuard$2 = {};
    let ModifiersBytes$1 = { calldata: true, memory: true, storage: true };
    let ModifiersNest$1 = { calldata: true, memory: true };
    function checkModifier$1(type, name) {
        if (type === "bytes" || type === "string") {
            if (ModifiersBytes$1[name]) {
                return true;
            }
        }
        else if (type === "address") {
            if (name === "payable") {
                return true;
            }
        }
        else if (type.indexOf("[") >= 0 || type === "tuple") {
            if (ModifiersNest$1[name]) {
                return true;
            }
        }
        if (ModifiersBytes$1[name] || name === "payable") {
            logger$l.throwArgumentError("invalid modifier", "name", name);
        }
        return false;
    }
    // @TODO: Make sure that children of an indexed tuple are marked with a null indexed
    function parseParamType$1(param, allowIndexed) {
        let originalParam = param;
        function throwError(i) {
            logger$l.throwArgumentError(`unexpected character at position ${i}`, "param", param);
        }
        param = param.replace(/\s/g, " ");
        function newNode(parent) {
            let node = { type: "", name: "", parent: parent, state: { allowType: true } };
            if (allowIndexed) {
                node.indexed = false;
            }
            return node;
        }
        let parent = { type: "", name: "", state: { allowType: true } };
        let node = parent;
        for (let i = 0; i < param.length; i++) {
            let c = param[i];
            switch (c) {
                case "(":
                    if (node.state.allowType && node.type === "") {
                        node.type = "tuple";
                    }
                    else if (!node.state.allowParams) {
                        throwError(i);
                    }
                    node.state.allowType = false;
                    node.type = verifyType$1(node.type);
                    node.components = [newNode(node)];
                    node = node.components[0];
                    break;
                case ")":
                    delete node.state;
                    if (node.name === "indexed") {
                        if (!allowIndexed) {
                            throwError(i);
                        }
                        node.indexed = true;
                        node.name = "";
                    }
                    if (checkModifier$1(node.type, node.name)) {
                        node.name = "";
                    }
                    node.type = verifyType$1(node.type);
                    let child = node;
                    node = node.parent;
                    if (!node) {
                        throwError(i);
                    }
                    delete child.parent;
                    node.state.allowParams = false;
                    node.state.allowName = true;
                    node.state.allowArray = true;
                    break;
                case ",":
                    delete node.state;
                    if (node.name === "indexed") {
                        if (!allowIndexed) {
                            throwError(i);
                        }
                        node.indexed = true;
                        node.name = "";
                    }
                    if (checkModifier$1(node.type, node.name)) {
                        node.name = "";
                    }
                    node.type = verifyType$1(node.type);
                    let sibling = newNode(node.parent);
                    //{ type: "", name: "", parent: node.parent, state: { allowType: true } };
                    node.parent.components.push(sibling);
                    delete node.parent;
                    node = sibling;
                    break;
                // Hit a space...
                case " ":
                    // If reading type, the type is done and may read a param or name
                    if (node.state.allowType) {
                        if (node.type !== "") {
                            node.type = verifyType$1(node.type);
                            delete node.state.allowType;
                            node.state.allowName = true;
                            node.state.allowParams = true;
                        }
                    }
                    // If reading name, the name is done
                    if (node.state.allowName) {
                        if (node.name !== "") {
                            if (node.name === "indexed") {
                                if (!allowIndexed) {
                                    throwError(i);
                                }
                                if (node.indexed) {
                                    throwError(i);
                                }
                                node.indexed = true;
                                node.name = "";
                            }
                            else if (checkModifier$1(node.type, node.name)) {
                                node.name = "";
                            }
                            else {
                                node.state.allowName = false;
                            }
                        }
                    }
                    break;
                case "[":
                    if (!node.state.allowArray) {
                        throwError(i);
                    }
                    node.type += c;
                    node.state.allowArray = false;
                    node.state.allowName = false;
                    node.state.readArray = true;
                    break;
                case "]":
                    if (!node.state.readArray) {
                        throwError(i);
                    }
                    node.type += c;
                    node.state.readArray = false;
                    node.state.allowArray = true;
                    node.state.allowName = true;
                    break;
                default:
                    if (node.state.allowType) {
                        node.type += c;
                        node.state.allowParams = true;
                        node.state.allowArray = true;
                    }
                    else if (node.state.allowName) {
                        node.name += c;
                        delete node.state.allowArray;
                    }
                    else if (node.state.readArray) {
                        node.type += c;
                    }
                    else {
                        throwError(i);
                    }
            }
        }
        if (node.parent) {
            logger$l.throwArgumentError("unexpected eof", "param", param);
        }
        delete parent.state;
        if (node.name === "indexed") {
            if (!allowIndexed) {
                throwError(originalParam.length - 7);
            }
            if (node.indexed) {
                throwError(originalParam.length - 7);
            }
            node.indexed = true;
            node.name = "";
        }
        else if (checkModifier$1(node.type, node.name)) {
            node.name = "";
        }
        parent.type = verifyType$1(parent.type);
        return parent;
    }
    function populate$1(object, params) {
        for (let key in params) {
            defineReadOnly$1(object, key, params[key]);
        }
    }
    const FormatTypes$1 = Object.freeze({
        // Bare formatting, as is needed for computing a sighash of an event or function
        sighash: "sighash",
        // Human-Readable with Minimal spacing and without names (compact human-readable)
        minimal: "minimal",
        // Human-Readable with nice spacing, including all names
        full: "full",
        // JSON-format a la Solidity
        json: "json"
    });
    const paramTypeArray$1 = new RegExp(/^(.*)\[([0-9]*)\]$/);
    let ParamType$1 = class ParamType {
        constructor(constructorGuard, params) {
            if (constructorGuard !== _constructorGuard$2) {
                logger$l.throwError("use fromString", Logger$1.errors.UNSUPPORTED_OPERATION, {
                    operation: "new ParamType()"
                });
            }
            populate$1(this, params);
            let match = this.type.match(paramTypeArray$1);
            if (match) {
                populate$1(this, {
                    arrayLength: parseInt(match[2] || "-1"),
                    arrayChildren: ParamType.fromObject({
                        type: match[1],
                        components: this.components
                    }),
                    baseType: "array"
                });
            }
            else {
                populate$1(this, {
                    arrayLength: null,
                    arrayChildren: null,
                    baseType: ((this.components != null) ? "tuple" : this.type)
                });
            }
            this._isParamType = true;
            Object.freeze(this);
        }
        // Format the parameter fragment
        //   - sighash: "(uint256,address)"
        //   - minimal: "tuple(uint256,address) indexed"
        //   - full:    "tuple(uint256 foo, address bar) indexed baz"
        format(format) {
            if (!format) {
                format = FormatTypes$1.sighash;
            }
            if (!FormatTypes$1[format]) {
                logger$l.throwArgumentError("invalid format type", "format", format);
            }
            if (format === FormatTypes$1.json) {
                let result = {
                    type: ((this.baseType === "tuple") ? "tuple" : this.type),
                    name: (this.name || undefined)
                };
                if (typeof (this.indexed) === "boolean") {
                    result.indexed = this.indexed;
                }
                if (this.components) {
                    result.components = this.components.map((comp) => JSON.parse(comp.format(format)));
                }
                return JSON.stringify(result);
            }
            let result = "";
            // Array
            if (this.baseType === "array") {
                result += this.arrayChildren.format(format);
                result += "[" + (this.arrayLength < 0 ? "" : String(this.arrayLength)) + "]";
            }
            else {
                if (this.baseType === "tuple") {
                    if (format !== FormatTypes$1.sighash) {
                        result += this.type;
                    }
                    result += "(" + this.components.map((comp) => comp.format(format)).join((format === FormatTypes$1.full) ? ", " : ",") + ")";
                }
                else {
                    result += this.type;
                }
            }
            if (format !== FormatTypes$1.sighash) {
                if (this.indexed === true) {
                    result += " indexed";
                }
                if (format === FormatTypes$1.full && this.name) {
                    result += " " + this.name;
                }
            }
            return result;
        }
        static from(value, allowIndexed) {
            if (typeof (value) === "string") {
                return ParamType.fromString(value, allowIndexed);
            }
            return ParamType.fromObject(value);
        }
        static fromObject(value) {
            if (ParamType.isParamType(value)) {
                return value;
            }
            return new ParamType(_constructorGuard$2, {
                name: (value.name || null),
                type: verifyType$1(value.type),
                indexed: ((value.indexed == null) ? null : !!value.indexed),
                components: (value.components ? value.components.map(ParamType.fromObject) : null)
            });
        }
        static fromString(value, allowIndexed) {
            function ParamTypify(node) {
                return ParamType.fromObject({
                    name: node.name,
                    type: node.type,
                    indexed: node.indexed,
                    components: node.components
                });
            }
            return ParamTypify(parseParamType$1(value, !!allowIndexed));
        }
        static isParamType(value) {
            return !!(value != null && value._isParamType);
        }
    };
    function parseParams$1(value, allowIndex) {
        return splitNesting$1(value).map((param) => ParamType$1.fromString(param, allowIndex));
    }
    let Fragment$1 = class Fragment {
        constructor(constructorGuard, params) {
            if (constructorGuard !== _constructorGuard$2) {
                logger$l.throwError("use a static from method", Logger$1.errors.UNSUPPORTED_OPERATION, {
                    operation: "new Fragment()"
                });
            }
            populate$1(this, params);
            this._isFragment = true;
            Object.freeze(this);
        }
        static from(value) {
            if (Fragment.isFragment(value)) {
                return value;
            }
            if (typeof (value) === "string") {
                return Fragment.fromString(value);
            }
            return Fragment.fromObject(value);
        }
        static fromObject(value) {
            if (Fragment.isFragment(value)) {
                return value;
            }
            switch (value.type) {
                case "function":
                    return FunctionFragment$1.fromObject(value);
                case "event":
                    return EventFragment$1.fromObject(value);
                case "constructor":
                    return ConstructorFragment$1.fromObject(value);
                case "error":
                    return ErrorFragment$1.fromObject(value);
                case "fallback":
                case "receive":
                    // @TODO: Something? Maybe return a FunctionFragment? A custom DefaultFunctionFragment?
                    return null;
            }
            return logger$l.throwArgumentError("invalid fragment object", "value", value);
        }
        static fromString(value) {
            // Make sure the "returns" is surrounded by a space and all whitespace is exactly one space
            value = value.replace(/\s/g, " ");
            value = value.replace(/\(/g, " (").replace(/\)/g, ") ").replace(/\s+/g, " ");
            value = value.trim();
            if (value.split(" ")[0] === "event") {
                return EventFragment$1.fromString(value.substring(5).trim());
            }
            else if (value.split(" ")[0] === "function") {
                return FunctionFragment$1.fromString(value.substring(8).trim());
            }
            else if (value.split("(")[0].trim() === "constructor") {
                return ConstructorFragment$1.fromString(value.trim());
            }
            else if (value.split(" ")[0] === "error") {
                return ErrorFragment$1.fromString(value.substring(5).trim());
            }
            return logger$l.throwArgumentError("unsupported fragment", "value", value);
        }
        static isFragment(value) {
            return !!(value && value._isFragment);
        }
    };
    let EventFragment$1 = class EventFragment extends Fragment$1 {
        format(format) {
            if (!format) {
                format = FormatTypes$1.sighash;
            }
            if (!FormatTypes$1[format]) {
                logger$l.throwArgumentError("invalid format type", "format", format);
            }
            if (format === FormatTypes$1.json) {
                return JSON.stringify({
                    type: "event",
                    anonymous: this.anonymous,
                    name: this.name,
                    inputs: this.inputs.map((input) => JSON.parse(input.format(format)))
                });
            }
            let result = "";
            if (format !== FormatTypes$1.sighash) {
                result += "event ";
            }
            result += this.name + "(" + this.inputs.map((input) => input.format(format)).join((format === FormatTypes$1.full) ? ", " : ",") + ") ";
            if (format !== FormatTypes$1.sighash) {
                if (this.anonymous) {
                    result += "anonymous ";
                }
            }
            return result.trim();
        }
        static from(value) {
            if (typeof (value) === "string") {
                return EventFragment.fromString(value);
            }
            return EventFragment.fromObject(value);
        }
        static fromObject(value) {
            if (EventFragment.isEventFragment(value)) {
                return value;
            }
            if (value.type !== "event") {
                logger$l.throwArgumentError("invalid event object", "value", value);
            }
            const params = {
                name: verifyIdentifier$1(value.name),
                anonymous: value.anonymous,
                inputs: (value.inputs ? value.inputs.map(ParamType$1.fromObject) : []),
                type: "event"
            };
            return new EventFragment(_constructorGuard$2, params);
        }
        static fromString(value) {
            let match = value.match(regexParen$1);
            if (!match) {
                logger$l.throwArgumentError("invalid event string", "value", value);
            }
            let anonymous = false;
            match[3].split(" ").forEach((modifier) => {
                switch (modifier.trim()) {
                    case "anonymous":
                        anonymous = true;
                        break;
                    case "":
                        break;
                    default:
                        logger$l.warn("unknown modifier: " + modifier);
                }
            });
            return EventFragment.fromObject({
                name: match[1].trim(),
                anonymous: anonymous,
                inputs: parseParams$1(match[2], true),
                type: "event"
            });
        }
        static isEventFragment(value) {
            return (value && value._isFragment && value.type === "event");
        }
    };
    function parseGas$1(value, params) {
        params.gas = null;
        let comps = value.split("@");
        if (comps.length !== 1) {
            if (comps.length > 2) {
                logger$l.throwArgumentError("invalid human-readable ABI signature", "value", value);
            }
            if (!comps[1].match(/^[0-9]+$/)) {
                logger$l.throwArgumentError("invalid human-readable ABI signature gas", "value", value);
            }
            params.gas = BigNumber$1.from(comps[1]);
            return comps[0];
        }
        return value;
    }
    function parseModifiers$1(value, params) {
        params.constant = false;
        params.payable = false;
        params.stateMutability = "nonpayable";
        value.split(" ").forEach((modifier) => {
            switch (modifier.trim()) {
                case "constant":
                    params.constant = true;
                    break;
                case "payable":
                    params.payable = true;
                    params.stateMutability = "payable";
                    break;
                case "nonpayable":
                    params.payable = false;
                    params.stateMutability = "nonpayable";
                    break;
                case "pure":
                    params.constant = true;
                    params.stateMutability = "pure";
                    break;
                case "view":
                    params.constant = true;
                    params.stateMutability = "view";
                    break;
                case "external":
                case "public":
                case "":
                    break;
                default:
                    console.log("unknown modifier: " + modifier);
            }
        });
    }
    function verifyState$1(value) {
        let result = {
            constant: false,
            payable: true,
            stateMutability: "payable"
        };
        if (value.stateMutability != null) {
            result.stateMutability = value.stateMutability;
            // Set (and check things are consistent) the constant property
            result.constant = (result.stateMutability === "view" || result.stateMutability === "pure");
            if (value.constant != null) {
                if ((!!value.constant) !== result.constant) {
                    logger$l.throwArgumentError("cannot have constant function with mutability " + result.stateMutability, "value", value);
                }
            }
            // Set (and check things are consistent) the payable property
            result.payable = (result.stateMutability === "payable");
            if (value.payable != null) {
                if ((!!value.payable) !== result.payable) {
                    logger$l.throwArgumentError("cannot have payable function with mutability " + result.stateMutability, "value", value);
                }
            }
        }
        else if (value.payable != null) {
            result.payable = !!value.payable;
            // If payable we can assume non-constant; otherwise we can't assume
            if (value.constant == null && !result.payable && value.type !== "constructor") {
                logger$l.throwArgumentError("unable to determine stateMutability", "value", value);
            }
            result.constant = !!value.constant;
            if (result.constant) {
                result.stateMutability = "view";
            }
            else {
                result.stateMutability = (result.payable ? "payable" : "nonpayable");
            }
            if (result.payable && result.constant) {
                logger$l.throwArgumentError("cannot have constant payable function", "value", value);
            }
        }
        else if (value.constant != null) {
            result.constant = !!value.constant;
            result.payable = !result.constant;
            result.stateMutability = (result.constant ? "view" : "payable");
        }
        else if (value.type !== "constructor") {
            logger$l.throwArgumentError("unable to determine stateMutability", "value", value);
        }
        return result;
    }
    let ConstructorFragment$1 = class ConstructorFragment extends Fragment$1 {
        format(format) {
            if (!format) {
                format = FormatTypes$1.sighash;
            }
            if (!FormatTypes$1[format]) {
                logger$l.throwArgumentError("invalid format type", "format", format);
            }
            if (format === FormatTypes$1.json) {
                return JSON.stringify({
                    type: "constructor",
                    stateMutability: ((this.stateMutability !== "nonpayable") ? this.stateMutability : undefined),
                    payable: this.payable,
                    gas: (this.gas ? this.gas.toNumber() : undefined),
                    inputs: this.inputs.map((input) => JSON.parse(input.format(format)))
                });
            }
            if (format === FormatTypes$1.sighash) {
                logger$l.throwError("cannot format a constructor for sighash", Logger$1.errors.UNSUPPORTED_OPERATION, {
                    operation: "format(sighash)"
                });
            }
            let result = "constructor(" + this.inputs.map((input) => input.format(format)).join((format === FormatTypes$1.full) ? ", " : ",") + ") ";
            if (this.stateMutability && this.stateMutability !== "nonpayable") {
                result += this.stateMutability + " ";
            }
            return result.trim();
        }
        static from(value) {
            if (typeof (value) === "string") {
                return ConstructorFragment.fromString(value);
            }
            return ConstructorFragment.fromObject(value);
        }
        static fromObject(value) {
            if (ConstructorFragment.isConstructorFragment(value)) {
                return value;
            }
            if (value.type !== "constructor") {
                logger$l.throwArgumentError("invalid constructor object", "value", value);
            }
            let state = verifyState$1(value);
            if (state.constant) {
                logger$l.throwArgumentError("constructor cannot be constant", "value", value);
            }
            const params = {
                name: null,
                type: value.type,
                inputs: (value.inputs ? value.inputs.map(ParamType$1.fromObject) : []),
                payable: state.payable,
                stateMutability: state.stateMutability,
                gas: (value.gas ? BigNumber$1.from(value.gas) : null)
            };
            return new ConstructorFragment(_constructorGuard$2, params);
        }
        static fromString(value) {
            let params = { type: "constructor" };
            value = parseGas$1(value, params);
            let parens = value.match(regexParen$1);
            if (!parens || parens[1].trim() !== "constructor") {
                logger$l.throwArgumentError("invalid constructor string", "value", value);
            }
            params.inputs = parseParams$1(parens[2].trim(), false);
            parseModifiers$1(parens[3].trim(), params);
            return ConstructorFragment.fromObject(params);
        }
        static isConstructorFragment(value) {
            return (value && value._isFragment && value.type === "constructor");
        }
    };
    let FunctionFragment$1 = class FunctionFragment extends ConstructorFragment$1 {
        format(format) {
            if (!format) {
                format = FormatTypes$1.sighash;
            }
            if (!FormatTypes$1[format]) {
                logger$l.throwArgumentError("invalid format type", "format", format);
            }
            if (format === FormatTypes$1.json) {
                return JSON.stringify({
                    type: "function",
                    name: this.name,
                    constant: this.constant,
                    stateMutability: ((this.stateMutability !== "nonpayable") ? this.stateMutability : undefined),
                    payable: this.payable,
                    gas: (this.gas ? this.gas.toNumber() : undefined),
                    inputs: this.inputs.map((input) => JSON.parse(input.format(format))),
                    outputs: this.outputs.map((output) => JSON.parse(output.format(format))),
                });
            }
            let result = "";
            if (format !== FormatTypes$1.sighash) {
                result += "function ";
            }
            result += this.name + "(" + this.inputs.map((input) => input.format(format)).join((format === FormatTypes$1.full) ? ", " : ",") + ") ";
            if (format !== FormatTypes$1.sighash) {
                if (this.stateMutability) {
                    if (this.stateMutability !== "nonpayable") {
                        result += (this.stateMutability + " ");
                    }
                }
                else if (this.constant) {
                    result += "view ";
                }
                if (this.outputs && this.outputs.length) {
                    result += "returns (" + this.outputs.map((output) => output.format(format)).join(", ") + ") ";
                }
                if (this.gas != null) {
                    result += "@" + this.gas.toString() + " ";
                }
            }
            return result.trim();
        }
        static from(value) {
            if (typeof (value) === "string") {
                return FunctionFragment.fromString(value);
            }
            return FunctionFragment.fromObject(value);
        }
        static fromObject(value) {
            if (FunctionFragment.isFunctionFragment(value)) {
                return value;
            }
            if (value.type !== "function") {
                logger$l.throwArgumentError("invalid function object", "value", value);
            }
            let state = verifyState$1(value);
            const params = {
                type: value.type,
                name: verifyIdentifier$1(value.name),
                constant: state.constant,
                inputs: (value.inputs ? value.inputs.map(ParamType$1.fromObject) : []),
                outputs: (value.outputs ? value.outputs.map(ParamType$1.fromObject) : []),
                payable: state.payable,
                stateMutability: state.stateMutability,
                gas: (value.gas ? BigNumber$1.from(value.gas) : null)
            };
            return new FunctionFragment(_constructorGuard$2, params);
        }
        static fromString(value) {
            let params = { type: "function" };
            value = parseGas$1(value, params);
            let comps = value.split(" returns ");
            if (comps.length > 2) {
                logger$l.throwArgumentError("invalid function string", "value", value);
            }
            let parens = comps[0].match(regexParen$1);
            if (!parens) {
                logger$l.throwArgumentError("invalid function signature", "value", value);
            }
            params.name = parens[1].trim();
            if (params.name) {
                verifyIdentifier$1(params.name);
            }
            params.inputs = parseParams$1(parens[2], false);
            parseModifiers$1(parens[3].trim(), params);
            // We have outputs
            if (comps.length > 1) {
                let returns = comps[1].match(regexParen$1);
                if (returns[1].trim() != "" || returns[3].trim() != "") {
                    logger$l.throwArgumentError("unexpected tokens", "value", value);
                }
                params.outputs = parseParams$1(returns[2], false);
            }
            else {
                params.outputs = [];
            }
            return FunctionFragment.fromObject(params);
        }
        static isFunctionFragment(value) {
            return (value && value._isFragment && value.type === "function");
        }
    };
    //export class StructFragment extends Fragment {
    //}
    function checkForbidden$1(fragment) {
        const sig = fragment.format();
        if (sig === "Error(string)" || sig === "Panic(uint256)") {
            logger$l.throwArgumentError(`cannot specify user defined ${sig} error`, "fragment", fragment);
        }
        return fragment;
    }
    let ErrorFragment$1 = class ErrorFragment extends Fragment$1 {
        format(format) {
            if (!format) {
                format = FormatTypes$1.sighash;
            }
            if (!FormatTypes$1[format]) {
                logger$l.throwArgumentError("invalid format type", "format", format);
            }
            if (format === FormatTypes$1.json) {
                return JSON.stringify({
                    type: "error",
                    name: this.name,
                    inputs: this.inputs.map((input) => JSON.parse(input.format(format))),
                });
            }
            let result = "";
            if (format !== FormatTypes$1.sighash) {
                result += "error ";
            }
            result += this.name + "(" + this.inputs.map((input) => input.format(format)).join((format === FormatTypes$1.full) ? ", " : ",") + ") ";
            return result.trim();
        }
        static from(value) {
            if (typeof (value) === "string") {
                return ErrorFragment.fromString(value);
            }
            return ErrorFragment.fromObject(value);
        }
        static fromObject(value) {
            if (ErrorFragment.isErrorFragment(value)) {
                return value;
            }
            if (value.type !== "error") {
                logger$l.throwArgumentError("invalid error object", "value", value);
            }
            const params = {
                type: value.type,
                name: verifyIdentifier$1(value.name),
                inputs: (value.inputs ? value.inputs.map(ParamType$1.fromObject) : [])
            };
            return checkForbidden$1(new ErrorFragment(_constructorGuard$2, params));
        }
        static fromString(value) {
            let params = { type: "error" };
            let parens = value.match(regexParen$1);
            if (!parens) {
                logger$l.throwArgumentError("invalid error signature", "value", value);
            }
            params.name = parens[1].trim();
            if (params.name) {
                verifyIdentifier$1(params.name);
            }
            params.inputs = parseParams$1(parens[2], false);
            return checkForbidden$1(ErrorFragment.fromObject(params));
        }
        static isErrorFragment(value) {
            return (value && value._isFragment && value.type === "error");
        }
    };
    function verifyType$1(type) {
        // These need to be transformed to their full description
        if (type.match(/^uint($|[^1-9])/)) {
            type = "uint256" + type.substring(4);
        }
        else if (type.match(/^int($|[^1-9])/)) {
            type = "int256" + type.substring(3);
        }
        // @TODO: more verification
        return type;
    }
    // See: https://github.com/ethereum/solidity/blob/1f8f1a3db93a548d0555e3e14cfc55a10e25b60e/docs/grammar/SolidityLexer.g4#L234
    const regexIdentifier$1 = new RegExp("^[a-zA-Z$_][a-zA-Z0-9$_]*$");
    function verifyIdentifier$1(value) {
        if (!value || !value.match(regexIdentifier$1)) {
            logger$l.throwArgumentError(`invalid identifier "${value}"`, "value", value);
        }
        return value;
    }
    const regexParen$1 = new RegExp("^([^)(]*)\\((.*)\\)([^)(]*)$");
    function splitNesting$1(value) {
        value = value.trim();
        let result = [];
        let accum = "";
        let depth = 0;
        for (let offset = 0; offset < value.length; offset++) {
            let c = value[offset];
            if (c === "," && depth === 0) {
                result.push(accum);
                accum = "";
            }
            else {
                accum += c;
                if (c === "(") {
                    depth++;
                }
                else if (c === ")") {
                    depth--;
                    if (depth === -1) {
                        logger$l.throwArgumentError("unbalanced parenthesis", "value", value);
                    }
                }
            }
        }
        if (accum) {
            result.push(accum);
        }
        return result;
    }

    const logger$k = new Logger$1(version$e);
    function checkResultErrors(result) {
        // Find the first error (if any)
        const errors = [];
        const checkErrors = function (path, object) {
            if (!Array.isArray(object)) {
                return;
            }
            for (let key in object) {
                const childPath = path.slice();
                childPath.push(key);
                try {
                    checkErrors(childPath, object[key]);
                }
                catch (error) {
                    errors.push({ path: childPath, error: error });
                }
            }
        };
        checkErrors([], result);
        return errors;
    }
    let Coder$1 = class Coder {
        constructor(name, type, localName, dynamic) {
            // @TODO: defineReadOnly these
            this.name = name;
            this.type = type;
            this.localName = localName;
            this.dynamic = dynamic;
        }
        _throwError(message, value) {
            logger$k.throwArgumentError(message, this.localName, value);
        }
    };
    let Writer$1 = class Writer {
        constructor(wordSize) {
            defineReadOnly$1(this, "wordSize", wordSize || 32);
            this._data = [];
            this._dataLength = 0;
            this._padding = new Uint8Array(wordSize);
        }
        get data() {
            return hexConcat$1(this._data);
        }
        get length() { return this._dataLength; }
        _writeData(data) {
            this._data.push(data);
            this._dataLength += data.length;
            return data.length;
        }
        appendWriter(writer) {
            return this._writeData(concat$1(writer._data));
        }
        // Arrayish items; padded on the right to wordSize
        writeBytes(value) {
            let bytes = arrayify$1(value);
            const paddingOffset = bytes.length % this.wordSize;
            if (paddingOffset) {
                bytes = concat$1([bytes, this._padding.slice(paddingOffset)]);
            }
            return this._writeData(bytes);
        }
        _getValue(value) {
            let bytes = arrayify$1(BigNumber$1.from(value));
            if (bytes.length > this.wordSize) {
                logger$k.throwError("value out-of-bounds", Logger$1.errors.BUFFER_OVERRUN, {
                    length: this.wordSize,
                    offset: bytes.length
                });
            }
            if (bytes.length % this.wordSize) {
                bytes = concat$1([this._padding.slice(bytes.length % this.wordSize), bytes]);
            }
            return bytes;
        }
        // BigNumberish items; padded on the left to wordSize
        writeValue(value) {
            return this._writeData(this._getValue(value));
        }
        writeUpdatableValue() {
            const offset = this._data.length;
            this._data.push(this._padding);
            this._dataLength += this.wordSize;
            return (value) => {
                this._data[offset] = this._getValue(value);
            };
        }
    };
    let Reader$1 = class Reader {
        constructor(data, wordSize, coerceFunc, allowLoose) {
            defineReadOnly$1(this, "_data", arrayify$1(data));
            defineReadOnly$1(this, "wordSize", wordSize || 32);
            defineReadOnly$1(this, "_coerceFunc", coerceFunc);
            defineReadOnly$1(this, "allowLoose", allowLoose);
            this._offset = 0;
        }
        get data() { return hexlify$1(this._data); }
        get consumed() { return this._offset; }
        // The default Coerce function
        static coerce(name, value) {
            let match = name.match("^u?int([0-9]+)$");
            if (match && parseInt(match[1]) <= 48) {
                value = value.toNumber();
            }
            return value;
        }
        coerce(name, value) {
            if (this._coerceFunc) {
                return this._coerceFunc(name, value);
            }
            return Reader.coerce(name, value);
        }
        _peekBytes(offset, length, loose) {
            let alignedLength = Math.ceil(length / this.wordSize) * this.wordSize;
            if (this._offset + alignedLength > this._data.length) {
                if (this.allowLoose && loose && this._offset + length <= this._data.length) {
                    alignedLength = length;
                }
                else {
                    logger$k.throwError("data out-of-bounds", Logger$1.errors.BUFFER_OVERRUN, {
                        length: this._data.length,
                        offset: this._offset + alignedLength
                    });
                }
            }
            return this._data.slice(this._offset, this._offset + alignedLength);
        }
        subReader(offset) {
            return new Reader(this._data.slice(this._offset + offset), this.wordSize, this._coerceFunc, this.allowLoose);
        }
        readBytes(length, loose) {
            let bytes = this._peekBytes(0, length, !!loose);
            this._offset += bytes.length;
            // @TODO: Make sure the length..end bytes are all 0?
            return bytes.slice(0, length);
        }
        readValue() {
            return BigNumber$1.from(this.readBytes(this.wordSize));
        }
    };

    function keccak256$1(data) {
        return '0x' + sha3.keccak_256(arrayify$1(data));
    }

    const version$d = "rlp/5.7.0";

    const logger$j = new Logger$1(version$d);
    function arrayifyInteger(value) {
        const result = [];
        while (value) {
            result.unshift(value & 0xff);
            value >>= 8;
        }
        return result;
    }
    function _encode(object) {
        if (Array.isArray(object)) {
            let payload = [];
            object.forEach(function (child) {
                payload = payload.concat(_encode(child));
            });
            if (payload.length <= 55) {
                payload.unshift(0xc0 + payload.length);
                return payload;
            }
            const length = arrayifyInteger(payload.length);
            length.unshift(0xf7 + length.length);
            return length.concat(payload);
        }
        if (!isBytesLike$1(object)) {
            logger$j.throwArgumentError("RLP object must be BytesLike", "object", object);
        }
        const data = Array.prototype.slice.call(arrayify$1(object));
        if (data.length === 1 && data[0] <= 0x7f) {
            return data;
        }
        else if (data.length <= 55) {
            data.unshift(0x80 + data.length);
            return data;
        }
        const length = arrayifyInteger(data.length);
        length.unshift(0xb7 + length.length);
        return length.concat(data);
    }
    function encode(object) {
        return hexlify$1(_encode(object));
    }

    const version$c = "address/5.7.0";

    const logger$i = new Logger$1(version$c);
    function getChecksumAddress$1(address) {
        if (!isHexString$1(address, 20)) {
            logger$i.throwArgumentError("invalid address", "address", address);
        }
        address = address.toLowerCase();
        const chars = address.substring(2).split("");
        const expanded = new Uint8Array(40);
        for (let i = 0; i < 40; i++) {
            expanded[i] = chars[i].charCodeAt(0);
        }
        const hashed = arrayify$1(keccak256$1(expanded));
        for (let i = 0; i < 40; i += 2) {
            if ((hashed[i >> 1] >> 4) >= 8) {
                chars[i] = chars[i].toUpperCase();
            }
            if ((hashed[i >> 1] & 0x0f) >= 8) {
                chars[i + 1] = chars[i + 1].toUpperCase();
            }
        }
        return "0x" + chars.join("");
    }
    // Shims for environments that are missing some required constants and functions
    const MAX_SAFE_INTEGER$1 = 0x1fffffffffffff;
    function log10$1(x) {
        if (Math.log10) {
            return Math.log10(x);
        }
        return Math.log(x) / Math.LN10;
    }
    // See: https://en.wikipedia.org/wiki/International_Bank_Account_Number
    // Create lookup table
    const ibanLookup$1 = {};
    for (let i = 0; i < 10; i++) {
        ibanLookup$1[String(i)] = String(i);
    }
    for (let i = 0; i < 26; i++) {
        ibanLookup$1[String.fromCharCode(65 + i)] = String(10 + i);
    }
    // How many decimal digits can we process? (for 64-bit float, this is 15)
    const safeDigits$1 = Math.floor(log10$1(MAX_SAFE_INTEGER$1));
    function ibanChecksum$1(address) {
        address = address.toUpperCase();
        address = address.substring(4) + address.substring(0, 2) + "00";
        let expanded = address.split("").map((c) => { return ibanLookup$1[c]; }).join("");
        // Javascript can handle integers safely up to 15 (decimal) digits
        while (expanded.length >= safeDigits$1) {
            let block = expanded.substring(0, safeDigits$1);
            expanded = parseInt(block, 10) % 97 + expanded.substring(block.length);
        }
        let checksum = String(98 - (parseInt(expanded, 10) % 97));
        while (checksum.length < 2) {
            checksum = "0" + checksum;
        }
        return checksum;
    }
    function getAddress$1(address) {
        let result = null;
        if (typeof (address) !== "string") {
            logger$i.throwArgumentError("invalid address", "address", address);
        }
        if (address.match(/^(0x)?[0-9a-fA-F]{40}$/)) {
            // Missing the 0x prefix
            if (address.substring(0, 2) !== "0x") {
                address = "0x" + address;
            }
            result = getChecksumAddress$1(address);
            // It is a checksummed address with a bad checksum
            if (address.match(/([A-F].*[a-f])|([a-f].*[A-F])/) && result !== address) {
                logger$i.throwArgumentError("bad address checksum", "address", address);
            }
            // Maybe ICAP? (we only support direct mode)
        }
        else if (address.match(/^XE[0-9]{2}[0-9A-Za-z]{30,31}$/)) {
            // It is an ICAP address with a bad checksum
            if (address.substring(2, 4) !== ibanChecksum$1(address)) {
                logger$i.throwArgumentError("bad icap checksum", "address", address);
            }
            result = _base36To16$1(address.substring(4));
            while (result.length < 40) {
                result = "0" + result;
            }
            result = getChecksumAddress$1("0x" + result);
        }
        else {
            logger$i.throwArgumentError("invalid address", "address", address);
        }
        return result;
    }
    // http://ethereum.stackexchange.com/questions/760/how-is-the-address-of-an-ethereum-contract-computed
    function getContractAddress(transaction) {
        let from = null;
        try {
            from = getAddress$1(transaction.from);
        }
        catch (error) {
            logger$i.throwArgumentError("missing from address", "transaction", transaction);
        }
        const nonce = stripZeros(arrayify$1(BigNumber$1.from(transaction.nonce).toHexString()));
        return getAddress$1(hexDataSlice$1(keccak256$1(encode([from, nonce])), 12));
    }

    let AddressCoder$1 = class AddressCoder extends Coder$1 {
        constructor(localName) {
            super("address", "address", localName, false);
        }
        defaultValue() {
            return "0x0000000000000000000000000000000000000000";
        }
        encode(writer, value) {
            try {
                value = getAddress$1(value);
            }
            catch (error) {
                this._throwError(error.message, value);
            }
            return writer.writeValue(value);
        }
        decode(reader) {
            return getAddress$1(hexZeroPad$1(reader.readValue().toHexString(), 20));
        }
    };

    // Clones the functionality of an existing Coder, but without a localName
    let AnonymousCoder$1 = class AnonymousCoder extends Coder$1 {
        constructor(coder) {
            super(coder.name, coder.type, undefined, coder.dynamic);
            this.coder = coder;
        }
        defaultValue() {
            return this.coder.defaultValue();
        }
        encode(writer, value) {
            return this.coder.encode(writer, value);
        }
        decode(reader) {
            return this.coder.decode(reader);
        }
    };

    const logger$h = new Logger$1(version$e);
    function pack$1(writer, coders, values) {
        let arrayValues = null;
        if (Array.isArray(values)) {
            arrayValues = values;
        }
        else if (values && typeof (values) === "object") {
            let unique = {};
            arrayValues = coders.map((coder) => {
                const name = coder.localName;
                if (!name) {
                    logger$h.throwError("cannot encode object for signature with missing names", Logger$1.errors.INVALID_ARGUMENT, {
                        argument: "values",
                        coder: coder,
                        value: values
                    });
                }
                if (unique[name]) {
                    logger$h.throwError("cannot encode object for signature with duplicate names", Logger$1.errors.INVALID_ARGUMENT, {
                        argument: "values",
                        coder: coder,
                        value: values
                    });
                }
                unique[name] = true;
                return values[name];
            });
        }
        else {
            logger$h.throwArgumentError("invalid tuple value", "tuple", values);
        }
        if (coders.length !== arrayValues.length) {
            logger$h.throwArgumentError("types/value length mismatch", "tuple", values);
        }
        let staticWriter = new Writer$1(writer.wordSize);
        let dynamicWriter = new Writer$1(writer.wordSize);
        let updateFuncs = [];
        coders.forEach((coder, index) => {
            let value = arrayValues[index];
            if (coder.dynamic) {
                // Get current dynamic offset (for the future pointer)
                let dynamicOffset = dynamicWriter.length;
                // Encode the dynamic value into the dynamicWriter
                coder.encode(dynamicWriter, value);
                // Prepare to populate the correct offset once we are done
                let updateFunc = staticWriter.writeUpdatableValue();
                updateFuncs.push((baseOffset) => {
                    updateFunc(baseOffset + dynamicOffset);
                });
            }
            else {
                coder.encode(staticWriter, value);
            }
        });
        // Backfill all the dynamic offsets, now that we know the static length
        updateFuncs.forEach((func) => { func(staticWriter.length); });
        let length = writer.appendWriter(staticWriter);
        length += writer.appendWriter(dynamicWriter);
        return length;
    }
    function unpack$1(reader, coders) {
        let values = [];
        // A reader anchored to this base
        let baseReader = reader.subReader(0);
        coders.forEach((coder) => {
            let value = null;
            if (coder.dynamic) {
                let offset = reader.readValue();
                let offsetReader = baseReader.subReader(offset.toNumber());
                try {
                    value = coder.decode(offsetReader);
                }
                catch (error) {
                    // Cannot recover from this
                    if (error.code === Logger$1.errors.BUFFER_OVERRUN) {
                        throw error;
                    }
                    value = error;
                    value.baseType = coder.name;
                    value.name = coder.localName;
                    value.type = coder.type;
                }
            }
            else {
                try {
                    value = coder.decode(reader);
                }
                catch (error) {
                    // Cannot recover from this
                    if (error.code === Logger$1.errors.BUFFER_OVERRUN) {
                        throw error;
                    }
                    value = error;
                    value.baseType = coder.name;
                    value.name = coder.localName;
                    value.type = coder.type;
                }
            }
            if (value != undefined) {
                values.push(value);
            }
        });
        // We only output named properties for uniquely named coders
        const uniqueNames = coders.reduce((accum, coder) => {
            const name = coder.localName;
            if (name) {
                if (!accum[name]) {
                    accum[name] = 0;
                }
                accum[name]++;
            }
            return accum;
        }, {});
        // Add any named parameters (i.e. tuples)
        coders.forEach((coder, index) => {
            let name = coder.localName;
            if (!name || uniqueNames[name] !== 1) {
                return;
            }
            if (name === "length") {
                name = "_length";
            }
            if (values[name] != null) {
                return;
            }
            const value = values[index];
            if (value instanceof Error) {
                Object.defineProperty(values, name, {
                    enumerable: true,
                    get: () => { throw value; }
                });
            }
            else {
                values[name] = value;
            }
        });
        for (let i = 0; i < values.length; i++) {
            const value = values[i];
            if (value instanceof Error) {
                Object.defineProperty(values, i, {
                    enumerable: true,
                    get: () => { throw value; }
                });
            }
        }
        return Object.freeze(values);
    }
    let ArrayCoder$1 = class ArrayCoder extends Coder$1 {
        constructor(coder, length, localName) {
            const type = (coder.type + "[" + (length >= 0 ? length : "") + "]");
            const dynamic = (length === -1 || coder.dynamic);
            super("array", type, localName, dynamic);
            this.coder = coder;
            this.length = length;
        }
        defaultValue() {
            // Verifies the child coder is valid (even if the array is dynamic or 0-length)
            const defaultChild = this.coder.defaultValue();
            const result = [];
            for (let i = 0; i < this.length; i++) {
                result.push(defaultChild);
            }
            return result;
        }
        encode(writer, value) {
            if (!Array.isArray(value)) {
                this._throwError("expected array value", value);
            }
            let count = this.length;
            if (count === -1) {
                count = value.length;
                writer.writeValue(value.length);
            }
            logger$h.checkArgumentCount(value.length, count, "coder array" + (this.localName ? (" " + this.localName) : ""));
            let coders = [];
            for (let i = 0; i < value.length; i++) {
                coders.push(this.coder);
            }
            return pack$1(writer, coders, value);
        }
        decode(reader) {
            let count = this.length;
            if (count === -1) {
                count = reader.readValue().toNumber();
                // Check that there is *roughly* enough data to ensure
                // stray random data is not being read as a length. Each
                // slot requires at least 32 bytes for their value (or 32
                // bytes as a link to the data). This could use a much
                // tighter bound, but we are erroring on the side of safety.
                if (count * 32 > reader._data.length) {
                    logger$h.throwError("insufficient data length", Logger$1.errors.BUFFER_OVERRUN, {
                        length: reader._data.length,
                        count: count
                    });
                }
            }
            let coders = [];
            for (let i = 0; i < count; i++) {
                coders.push(new AnonymousCoder$1(this.coder));
            }
            return reader.coerce(this.name, unpack$1(reader, coders));
        }
    };

    let BooleanCoder$1 = class BooleanCoder extends Coder$1 {
        constructor(localName) {
            super("bool", "bool", localName, false);
        }
        defaultValue() {
            return false;
        }
        encode(writer, value) {
            return writer.writeValue(value ? 1 : 0);
        }
        decode(reader) {
            return reader.coerce(this.type, !reader.readValue().isZero());
        }
    };

    let DynamicBytesCoder$1 = class DynamicBytesCoder extends Coder$1 {
        constructor(type, localName) {
            super(type, type, localName, true);
        }
        defaultValue() {
            return "0x";
        }
        encode(writer, value) {
            value = arrayify$1(value);
            let length = writer.writeValue(value.length);
            length += writer.writeBytes(value);
            return length;
        }
        decode(reader) {
            return reader.readBytes(reader.readValue().toNumber(), true);
        }
    };
    let BytesCoder$1 = class BytesCoder extends DynamicBytesCoder$1 {
        constructor(localName) {
            super("bytes", localName);
        }
        decode(reader) {
            return reader.coerce(this.name, hexlify$1(super.decode(reader)));
        }
    };

    // @TODO: Merge this with bytes
    let FixedBytesCoder$1 = class FixedBytesCoder extends Coder$1 {
        constructor(size, localName) {
            let name = "bytes" + String(size);
            super(name, name, localName, false);
            this.size = size;
        }
        defaultValue() {
            return ("0x0000000000000000000000000000000000000000000000000000000000000000").substring(0, 2 + this.size * 2);
        }
        encode(writer, value) {
            let data = arrayify$1(value);
            if (data.length !== this.size) {
                this._throwError("incorrect data length", value);
            }
            return writer.writeBytes(data);
        }
        decode(reader) {
            return reader.coerce(this.name, hexlify$1(reader.readBytes(this.size)));
        }
    };

    let NullCoder$1 = class NullCoder extends Coder$1 {
        constructor(localName) {
            super("null", "", localName, false);
        }
        defaultValue() {
            return null;
        }
        encode(writer, value) {
            if (value != null) {
                this._throwError("not null", value);
            }
            return writer.writeBytes([]);
        }
        decode(reader) {
            reader.readBytes(0);
            return reader.coerce(this.name, null);
        }
    };

    const NegativeOne$1 = ( /*#__PURE__*/BigNumber$1.from(-1));
    const Zero$1 = ( /*#__PURE__*/BigNumber$1.from(0));
    const One$1 = ( /*#__PURE__*/BigNumber$1.from(1));
    const MaxUint256$1 = ( /*#__PURE__*/BigNumber$1.from("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"));

    let NumberCoder$1 = class NumberCoder extends Coder$1 {
        constructor(size, signed, localName) {
            const name = ((signed ? "int" : "uint") + (size * 8));
            super(name, name, localName, false);
            this.size = size;
            this.signed = signed;
        }
        defaultValue() {
            return 0;
        }
        encode(writer, value) {
            let v = BigNumber$1.from(value);
            // Check bounds are safe for encoding
            let maxUintValue = MaxUint256$1.mask(writer.wordSize * 8);
            if (this.signed) {
                let bounds = maxUintValue.mask(this.size * 8 - 1);
                if (v.gt(bounds) || v.lt(bounds.add(One$1).mul(NegativeOne$1))) {
                    this._throwError("value out-of-bounds", value);
                }
            }
            else if (v.lt(Zero$1) || v.gt(maxUintValue.mask(this.size * 8))) {
                this._throwError("value out-of-bounds", value);
            }
            v = v.toTwos(this.size * 8).mask(this.size * 8);
            if (this.signed) {
                v = v.fromTwos(this.size * 8).toTwos(8 * writer.wordSize);
            }
            return writer.writeValue(v);
        }
        decode(reader) {
            let value = reader.readValue().mask(this.size * 8);
            if (this.signed) {
                value = value.fromTwos(this.size * 8);
            }
            return reader.coerce(this.name, value);
        }
    };

    const version$b = "strings/5.7.0";

    const logger$g = new Logger$1(version$b);
    ///////////////////////////////
    var UnicodeNormalizationForm$1;
    (function (UnicodeNormalizationForm) {
        UnicodeNormalizationForm["current"] = "";
        UnicodeNormalizationForm["NFC"] = "NFC";
        UnicodeNormalizationForm["NFD"] = "NFD";
        UnicodeNormalizationForm["NFKC"] = "NFKC";
        UnicodeNormalizationForm["NFKD"] = "NFKD";
    })(UnicodeNormalizationForm$1 || (UnicodeNormalizationForm$1 = {}));
    var Utf8ErrorReason$1;
    (function (Utf8ErrorReason) {
        // A continuation byte was present where there was nothing to continue
        // - offset = the index the codepoint began in
        Utf8ErrorReason["UNEXPECTED_CONTINUE"] = "unexpected continuation byte";
        // An invalid (non-continuation) byte to start a UTF-8 codepoint was found
        // - offset = the index the codepoint began in
        Utf8ErrorReason["BAD_PREFIX"] = "bad codepoint prefix";
        // The string is too short to process the expected codepoint
        // - offset = the index the codepoint began in
        Utf8ErrorReason["OVERRUN"] = "string overrun";
        // A missing continuation byte was expected but not found
        // - offset = the index the continuation byte was expected at
        Utf8ErrorReason["MISSING_CONTINUE"] = "missing continuation byte";
        // The computed code point is outside the range for UTF-8
        // - offset       = start of this codepoint
        // - badCodepoint = the computed codepoint; outside the UTF-8 range
        Utf8ErrorReason["OUT_OF_RANGE"] = "out of UTF-8 range";
        // UTF-8 strings may not contain UTF-16 surrogate pairs
        // - offset       = start of this codepoint
        // - badCodepoint = the computed codepoint; inside the UTF-16 surrogate range
        Utf8ErrorReason["UTF16_SURROGATE"] = "UTF-16 surrogate";
        // The string is an overlong representation
        // - offset       = start of this codepoint
        // - badCodepoint = the computed codepoint; already bounds checked
        Utf8ErrorReason["OVERLONG"] = "overlong representation";
    })(Utf8ErrorReason$1 || (Utf8ErrorReason$1 = {}));
    function errorFunc$1(reason, offset, bytes, output, badCodepoint) {
        return logger$g.throwArgumentError(`invalid codepoint at offset ${offset}; ${reason}`, "bytes", bytes);
    }
    function ignoreFunc$1(reason, offset, bytes, output, badCodepoint) {
        // If there is an invalid prefix (including stray continuation), skip any additional continuation bytes
        if (reason === Utf8ErrorReason$1.BAD_PREFIX || reason === Utf8ErrorReason$1.UNEXPECTED_CONTINUE) {
            let i = 0;
            for (let o = offset + 1; o < bytes.length; o++) {
                if (bytes[o] >> 6 !== 0x02) {
                    break;
                }
                i++;
            }
            return i;
        }
        // This byte runs us past the end of the string, so just jump to the end
        // (but the first byte was read already read and therefore skipped)
        if (reason === Utf8ErrorReason$1.OVERRUN) {
            return bytes.length - offset - 1;
        }
        // Nothing to skip
        return 0;
    }
    function replaceFunc$1(reason, offset, bytes, output, badCodepoint) {
        // Overlong representations are otherwise "valid" code points; just non-deistingtished
        if (reason === Utf8ErrorReason$1.OVERLONG) {
            output.push(badCodepoint);
            return 0;
        }
        // Put the replacement character into the output
        output.push(0xfffd);
        // Otherwise, process as if ignoring errors
        return ignoreFunc$1(reason, offset, bytes);
    }
    // Common error handing strategies
    const Utf8ErrorFuncs$1 = Object.freeze({
        error: errorFunc$1,
        ignore: ignoreFunc$1,
        replace: replaceFunc$1
    });
    // http://stackoverflow.com/questions/13356493/decode-utf-8-with-javascript#13691499
    function getUtf8CodePoints$1(bytes, onError) {
        if (onError == null) {
            onError = Utf8ErrorFuncs$1.error;
        }
        bytes = arrayify$1(bytes);
        const result = [];
        let i = 0;
        // Invalid bytes are ignored
        while (i < bytes.length) {
            const c = bytes[i++];
            // 0xxx xxxx
            if (c >> 7 === 0) {
                result.push(c);
                continue;
            }
            // Multibyte; how many bytes left for this character?
            let extraLength = null;
            let overlongMask = null;
            // 110x xxxx 10xx xxxx
            if ((c & 0xe0) === 0xc0) {
                extraLength = 1;
                overlongMask = 0x7f;
                // 1110 xxxx 10xx xxxx 10xx xxxx
            }
            else if ((c & 0xf0) === 0xe0) {
                extraLength = 2;
                overlongMask = 0x7ff;
                // 1111 0xxx 10xx xxxx 10xx xxxx 10xx xxxx
            }
            else if ((c & 0xf8) === 0xf0) {
                extraLength = 3;
                overlongMask = 0xffff;
            }
            else {
                if ((c & 0xc0) === 0x80) {
                    i += onError(Utf8ErrorReason$1.UNEXPECTED_CONTINUE, i - 1, bytes, result);
                }
                else {
                    i += onError(Utf8ErrorReason$1.BAD_PREFIX, i - 1, bytes, result);
                }
                continue;
            }
            // Do we have enough bytes in our data?
            if (i - 1 + extraLength >= bytes.length) {
                i += onError(Utf8ErrorReason$1.OVERRUN, i - 1, bytes, result);
                continue;
            }
            // Remove the length prefix from the char
            let res = c & ((1 << (8 - extraLength - 1)) - 1);
            for (let j = 0; j < extraLength; j++) {
                let nextChar = bytes[i];
                // Invalid continuation byte
                if ((nextChar & 0xc0) != 0x80) {
                    i += onError(Utf8ErrorReason$1.MISSING_CONTINUE, i, bytes, result);
                    res = null;
                    break;
                }
                res = (res << 6) | (nextChar & 0x3f);
                i++;
            }
            // See above loop for invalid continuation byte
            if (res === null) {
                continue;
            }
            // Maximum code point
            if (res > 0x10ffff) {
                i += onError(Utf8ErrorReason$1.OUT_OF_RANGE, i - 1 - extraLength, bytes, result, res);
                continue;
            }
            // Reserved for UTF-16 surrogate halves
            if (res >= 0xd800 && res <= 0xdfff) {
                i += onError(Utf8ErrorReason$1.UTF16_SURROGATE, i - 1 - extraLength, bytes, result, res);
                continue;
            }
            // Check for overlong sequences (more bytes than needed)
            if (res <= overlongMask) {
                i += onError(Utf8ErrorReason$1.OVERLONG, i - 1 - extraLength, bytes, result, res);
                continue;
            }
            result.push(res);
        }
        return result;
    }
    // http://stackoverflow.com/questions/18729405/how-to-convert-utf8-string-to-byte-array
    function toUtf8Bytes$1(str, form = UnicodeNormalizationForm$1.current) {
        if (form != UnicodeNormalizationForm$1.current) {
            logger$g.checkNormalize();
            str = str.normalize(form);
        }
        let result = [];
        for (let i = 0; i < str.length; i++) {
            const c = str.charCodeAt(i);
            if (c < 0x80) {
                result.push(c);
            }
            else if (c < 0x800) {
                result.push((c >> 6) | 0xc0);
                result.push((c & 0x3f) | 0x80);
            }
            else if ((c & 0xfc00) == 0xd800) {
                i++;
                const c2 = str.charCodeAt(i);
                if (i >= str.length || (c2 & 0xfc00) !== 0xdc00) {
                    throw new Error("invalid utf-8 string");
                }
                // Surrogate Pair
                const pair = 0x10000 + ((c & 0x03ff) << 10) + (c2 & 0x03ff);
                result.push((pair >> 18) | 0xf0);
                result.push(((pair >> 12) & 0x3f) | 0x80);
                result.push(((pair >> 6) & 0x3f) | 0x80);
                result.push((pair & 0x3f) | 0x80);
            }
            else {
                result.push((c >> 12) | 0xe0);
                result.push(((c >> 6) & 0x3f) | 0x80);
                result.push((c & 0x3f) | 0x80);
            }
        }
        return arrayify$1(result);
    }
    function _toUtf8String$1(codePoints) {
        return codePoints.map((codePoint) => {
            if (codePoint <= 0xffff) {
                return String.fromCharCode(codePoint);
            }
            codePoint -= 0x10000;
            return String.fromCharCode((((codePoint >> 10) & 0x3ff) + 0xd800), ((codePoint & 0x3ff) + 0xdc00));
        }).join("");
    }
    function toUtf8String$1(bytes, onError) {
        return _toUtf8String$1(getUtf8CodePoints$1(bytes, onError));
    }

    let StringCoder$1 = class StringCoder extends DynamicBytesCoder$1 {
        constructor(localName) {
            super("string", localName);
        }
        defaultValue() {
            return "";
        }
        encode(writer, value) {
            return super.encode(writer, toUtf8Bytes$1(value));
        }
        decode(reader) {
            return toUtf8String$1(super.decode(reader));
        }
    };

    let TupleCoder$1 = class TupleCoder extends Coder$1 {
        constructor(coders, localName) {
            let dynamic = false;
            const types = [];
            coders.forEach((coder) => {
                if (coder.dynamic) {
                    dynamic = true;
                }
                types.push(coder.type);
            });
            const type = ("tuple(" + types.join(",") + ")");
            super("tuple", type, localName, dynamic);
            this.coders = coders;
        }
        defaultValue() {
            const values = [];
            this.coders.forEach((coder) => {
                values.push(coder.defaultValue());
            });
            // We only output named properties for uniquely named coders
            const uniqueNames = this.coders.reduce((accum, coder) => {
                const name = coder.localName;
                if (name) {
                    if (!accum[name]) {
                        accum[name] = 0;
                    }
                    accum[name]++;
                }
                return accum;
            }, {});
            // Add named values
            this.coders.forEach((coder, index) => {
                let name = coder.localName;
                if (!name || uniqueNames[name] !== 1) {
                    return;
                }
                if (name === "length") {
                    name = "_length";
                }
                if (values[name] != null) {
                    return;
                }
                values[name] = values[index];
            });
            return Object.freeze(values);
        }
        encode(writer, value) {
            return pack$1(writer, this.coders, value);
        }
        decode(reader) {
            return reader.coerce(this.name, unpack$1(reader, this.coders));
        }
    };

    const logger$f = new Logger$1(version$e);
    const paramTypeBytes$1 = new RegExp(/^bytes([0-9]*)$/);
    const paramTypeNumber$1 = new RegExp(/^(u?int)([0-9]*)$/);
    let AbiCoder$1 = class AbiCoder {
        constructor(coerceFunc) {
            defineReadOnly$1(this, "coerceFunc", coerceFunc || null);
        }
        _getCoder(param) {
            switch (param.baseType) {
                case "address":
                    return new AddressCoder$1(param.name);
                case "bool":
                    return new BooleanCoder$1(param.name);
                case "string":
                    return new StringCoder$1(param.name);
                case "bytes":
                    return new BytesCoder$1(param.name);
                case "array":
                    return new ArrayCoder$1(this._getCoder(param.arrayChildren), param.arrayLength, param.name);
                case "tuple":
                    return new TupleCoder$1((param.components || []).map((component) => {
                        return this._getCoder(component);
                    }), param.name);
                case "":
                    return new NullCoder$1(param.name);
            }
            // u?int[0-9]*
            let match = param.type.match(paramTypeNumber$1);
            if (match) {
                let size = parseInt(match[2] || "256");
                if (size === 0 || size > 256 || (size % 8) !== 0) {
                    logger$f.throwArgumentError("invalid " + match[1] + " bit length", "param", param);
                }
                return new NumberCoder$1(size / 8, (match[1] === "int"), param.name);
            }
            // bytes[0-9]+
            match = param.type.match(paramTypeBytes$1);
            if (match) {
                let size = parseInt(match[1]);
                if (size === 0 || size > 32) {
                    logger$f.throwArgumentError("invalid bytes length", "param", param);
                }
                return new FixedBytesCoder$1(size, param.name);
            }
            return logger$f.throwArgumentError("invalid type", "type", param.type);
        }
        _getWordSize() { return 32; }
        _getReader(data, allowLoose) {
            return new Reader$1(data, this._getWordSize(), this.coerceFunc, allowLoose);
        }
        _getWriter() {
            return new Writer$1(this._getWordSize());
        }
        getDefaultValue(types) {
            const coders = types.map((type) => this._getCoder(ParamType$1.from(type)));
            const coder = new TupleCoder$1(coders, "_");
            return coder.defaultValue();
        }
        encode(types, values) {
            if (types.length !== values.length) {
                logger$f.throwError("types/values length mismatch", Logger$1.errors.INVALID_ARGUMENT, {
                    count: { types: types.length, values: values.length },
                    value: { types: types, values: values }
                });
            }
            const coders = types.map((type) => this._getCoder(ParamType$1.from(type)));
            const coder = (new TupleCoder$1(coders, "_"));
            const writer = this._getWriter();
            coder.encode(writer, values);
            return writer.data;
        }
        decode(types, data, loose) {
            const coders = types.map((type) => this._getCoder(ParamType$1.from(type)));
            const coder = new TupleCoder$1(coders, "_");
            return coder.decode(this._getReader(arrayify$1(data), loose));
        }
    };
    const defaultAbiCoder$1 = new AbiCoder$1();

    function id$1(text) {
        return keccak256$1(toUtf8Bytes$1(text));
    }

    const logger$e = new Logger$1(version$e);
    let LogDescription$1 = class LogDescription extends Description$1 {
    };
    let TransactionDescription$1 = class TransactionDescription extends Description$1 {
    };
    let ErrorDescription$1 = class ErrorDescription extends Description$1 {
    };
    let Indexed$1 = class Indexed extends Description$1 {
        static isIndexed(value) {
            return !!(value && value._isIndexed);
        }
    };
    const BuiltinErrors$1 = {
        "0x08c379a0": { signature: "Error(string)", name: "Error", inputs: ["string"], reason: true },
        "0x4e487b71": { signature: "Panic(uint256)", name: "Panic", inputs: ["uint256"] }
    };
    function wrapAccessError$1(property, error) {
        const wrap = new Error(`deferred error during ABI decoding triggered accessing ${property}`);
        wrap.error = error;
        return wrap;
    }
    /*
    function checkNames(fragment: Fragment, type: "input" | "output", params: Array<ParamType>): void {
        params.reduce((accum, param) => {
            if (param.name) {
                if (accum[param.name]) {
                    logger.throwArgumentError(`duplicate ${ type } parameter ${ JSON.stringify(param.name) } in ${ fragment.format("full") }`, "fragment", fragment);
                }
                accum[param.name] = true;
            }
            return accum;
        }, <{ [ name: string ]: boolean }>{ });
    }
    */
    let Interface$1 = class Interface {
        constructor(fragments) {
            let abi = [];
            if (typeof (fragments) === "string") {
                abi = JSON.parse(fragments);
            }
            else {
                abi = fragments;
            }
            defineReadOnly$1(this, "fragments", abi.map((fragment) => {
                return Fragment$1.from(fragment);
            }).filter((fragment) => (fragment != null)));
            defineReadOnly$1(this, "_abiCoder", getStatic$1(new.target, "getAbiCoder")());
            defineReadOnly$1(this, "functions", {});
            defineReadOnly$1(this, "errors", {});
            defineReadOnly$1(this, "events", {});
            defineReadOnly$1(this, "structs", {});
            // Add all fragments by their signature
            this.fragments.forEach((fragment) => {
                let bucket = null;
                switch (fragment.type) {
                    case "constructor":
                        if (this.deploy) {
                            logger$e.warn("duplicate definition - constructor");
                            return;
                        }
                        //checkNames(fragment, "input", fragment.inputs);
                        defineReadOnly$1(this, "deploy", fragment);
                        return;
                    case "function":
                        //checkNames(fragment, "input", fragment.inputs);
                        //checkNames(fragment, "output", (<FunctionFragment>fragment).outputs);
                        bucket = this.functions;
                        break;
                    case "event":
                        //checkNames(fragment, "input", fragment.inputs);
                        bucket = this.events;
                        break;
                    case "error":
                        bucket = this.errors;
                        break;
                    default:
                        return;
                }
                let signature = fragment.format();
                if (bucket[signature]) {
                    logger$e.warn("duplicate definition - " + signature);
                    return;
                }
                bucket[signature] = fragment;
            });
            // If we do not have a constructor add a default
            if (!this.deploy) {
                defineReadOnly$1(this, "deploy", ConstructorFragment$1.from({
                    payable: false,
                    type: "constructor"
                }));
            }
            defineReadOnly$1(this, "_isInterface", true);
        }
        format(format) {
            if (!format) {
                format = FormatTypes$1.full;
            }
            if (format === FormatTypes$1.sighash) {
                logger$e.throwArgumentError("interface does not support formatting sighash", "format", format);
            }
            const abi = this.fragments.map((fragment) => fragment.format(format));
            // We need to re-bundle the JSON fragments a bit
            if (format === FormatTypes$1.json) {
                return JSON.stringify(abi.map((j) => JSON.parse(j)));
            }
            return abi;
        }
        // Sub-classes can override these to handle other blockchains
        static getAbiCoder() {
            return defaultAbiCoder$1;
        }
        static getAddress(address) {
            return getAddress$1(address);
        }
        static getSighash(fragment) {
            return hexDataSlice$1(id$1(fragment.format()), 0, 4);
        }
        static getEventTopic(eventFragment) {
            return id$1(eventFragment.format());
        }
        // Find a function definition by any means necessary (unless it is ambiguous)
        getFunction(nameOrSignatureOrSighash) {
            if (isHexString$1(nameOrSignatureOrSighash)) {
                for (const name in this.functions) {
                    if (nameOrSignatureOrSighash === this.getSighash(name)) {
                        return this.functions[name];
                    }
                }
                logger$e.throwArgumentError("no matching function", "sighash", nameOrSignatureOrSighash);
            }
            // It is a bare name, look up the function (will return null if ambiguous)
            if (nameOrSignatureOrSighash.indexOf("(") === -1) {
                const name = nameOrSignatureOrSighash.trim();
                const matching = Object.keys(this.functions).filter((f) => (f.split("(" /* fix:) */)[0] === name));
                if (matching.length === 0) {
                    logger$e.throwArgumentError("no matching function", "name", name);
                }
                else if (matching.length > 1) {
                    logger$e.throwArgumentError("multiple matching functions", "name", name);
                }
                return this.functions[matching[0]];
            }
            // Normalize the signature and lookup the function
            const result = this.functions[FunctionFragment$1.fromString(nameOrSignatureOrSighash).format()];
            if (!result) {
                logger$e.throwArgumentError("no matching function", "signature", nameOrSignatureOrSighash);
            }
            return result;
        }
        // Find an event definition by any means necessary (unless it is ambiguous)
        getEvent(nameOrSignatureOrTopic) {
            if (isHexString$1(nameOrSignatureOrTopic)) {
                const topichash = nameOrSignatureOrTopic.toLowerCase();
                for (const name in this.events) {
                    if (topichash === this.getEventTopic(name)) {
                        return this.events[name];
                    }
                }
                logger$e.throwArgumentError("no matching event", "topichash", topichash);
            }
            // It is a bare name, look up the function (will return null if ambiguous)
            if (nameOrSignatureOrTopic.indexOf("(") === -1) {
                const name = nameOrSignatureOrTopic.trim();
                const matching = Object.keys(this.events).filter((f) => (f.split("(" /* fix:) */)[0] === name));
                if (matching.length === 0) {
                    logger$e.throwArgumentError("no matching event", "name", name);
                }
                else if (matching.length > 1) {
                    logger$e.throwArgumentError("multiple matching events", "name", name);
                }
                return this.events[matching[0]];
            }
            // Normalize the signature and lookup the function
            const result = this.events[EventFragment$1.fromString(nameOrSignatureOrTopic).format()];
            if (!result) {
                logger$e.throwArgumentError("no matching event", "signature", nameOrSignatureOrTopic);
            }
            return result;
        }
        // Find a function definition by any means necessary (unless it is ambiguous)
        getError(nameOrSignatureOrSighash) {
            if (isHexString$1(nameOrSignatureOrSighash)) {
                const getSighash = getStatic$1(this.constructor, "getSighash");
                for (const name in this.errors) {
                    const error = this.errors[name];
                    if (nameOrSignatureOrSighash === getSighash(error)) {
                        return this.errors[name];
                    }
                }
                logger$e.throwArgumentError("no matching error", "sighash", nameOrSignatureOrSighash);
            }
            // It is a bare name, look up the function (will return null if ambiguous)
            if (nameOrSignatureOrSighash.indexOf("(") === -1) {
                const name = nameOrSignatureOrSighash.trim();
                const matching = Object.keys(this.errors).filter((f) => (f.split("(" /* fix:) */)[0] === name));
                if (matching.length === 0) {
                    logger$e.throwArgumentError("no matching error", "name", name);
                }
                else if (matching.length > 1) {
                    logger$e.throwArgumentError("multiple matching errors", "name", name);
                }
                return this.errors[matching[0]];
            }
            // Normalize the signature and lookup the function
            const result = this.errors[FunctionFragment$1.fromString(nameOrSignatureOrSighash).format()];
            if (!result) {
                logger$e.throwArgumentError("no matching error", "signature", nameOrSignatureOrSighash);
            }
            return result;
        }
        // Get the sighash (the bytes4 selector) used by Solidity to identify a function
        getSighash(fragment) {
            if (typeof (fragment) === "string") {
                try {
                    fragment = this.getFunction(fragment);
                }
                catch (error) {
                    try {
                        fragment = this.getError(fragment);
                    }
                    catch (_) {
                        throw error;
                    }
                }
            }
            return getStatic$1(this.constructor, "getSighash")(fragment);
        }
        // Get the topic (the bytes32 hash) used by Solidity to identify an event
        getEventTopic(eventFragment) {
            if (typeof (eventFragment) === "string") {
                eventFragment = this.getEvent(eventFragment);
            }
            return getStatic$1(this.constructor, "getEventTopic")(eventFragment);
        }
        _decodeParams(params, data) {
            return this._abiCoder.decode(params, data);
        }
        _encodeParams(params, values) {
            return this._abiCoder.encode(params, values);
        }
        encodeDeploy(values) {
            return this._encodeParams(this.deploy.inputs, values || []);
        }
        decodeErrorResult(fragment, data) {
            if (typeof (fragment) === "string") {
                fragment = this.getError(fragment);
            }
            const bytes = arrayify$1(data);
            if (hexlify$1(bytes.slice(0, 4)) !== this.getSighash(fragment)) {
                logger$e.throwArgumentError(`data signature does not match error ${fragment.name}.`, "data", hexlify$1(bytes));
            }
            return this._decodeParams(fragment.inputs, bytes.slice(4));
        }
        encodeErrorResult(fragment, values) {
            if (typeof (fragment) === "string") {
                fragment = this.getError(fragment);
            }
            return hexlify$1(concat$1([
                this.getSighash(fragment),
                this._encodeParams(fragment.inputs, values || [])
            ]));
        }
        // Decode the data for a function call (e.g. tx.data)
        decodeFunctionData(functionFragment, data) {
            if (typeof (functionFragment) === "string") {
                functionFragment = this.getFunction(functionFragment);
            }
            const bytes = arrayify$1(data);
            if (hexlify$1(bytes.slice(0, 4)) !== this.getSighash(functionFragment)) {
                logger$e.throwArgumentError(`data signature does not match function ${functionFragment.name}.`, "data", hexlify$1(bytes));
            }
            return this._decodeParams(functionFragment.inputs, bytes.slice(4));
        }
        // Encode the data for a function call (e.g. tx.data)
        encodeFunctionData(functionFragment, values) {
            if (typeof (functionFragment) === "string") {
                functionFragment = this.getFunction(functionFragment);
            }
            return hexlify$1(concat$1([
                this.getSighash(functionFragment),
                this._encodeParams(functionFragment.inputs, values || [])
            ]));
        }
        // Decode the result from a function call (e.g. from eth_call)
        decodeFunctionResult(functionFragment, data) {
            if (typeof (functionFragment) === "string") {
                functionFragment = this.getFunction(functionFragment);
            }
            let bytes = arrayify$1(data);
            let reason = null;
            let message = "";
            let errorArgs = null;
            let errorName = null;
            let errorSignature = null;
            switch (bytes.length % this._abiCoder._getWordSize()) {
                case 0:
                    try {
                        return this._abiCoder.decode(functionFragment.outputs, bytes);
                    }
                    catch (error) { }
                    break;
                case 4: {
                    const selector = hexlify$1(bytes.slice(0, 4));
                    const builtin = BuiltinErrors$1[selector];
                    if (builtin) {
                        errorArgs = this._abiCoder.decode(builtin.inputs, bytes.slice(4));
                        errorName = builtin.name;
                        errorSignature = builtin.signature;
                        if (builtin.reason) {
                            reason = errorArgs[0];
                        }
                        if (errorName === "Error") {
                            message = `; VM Exception while processing transaction: reverted with reason string ${JSON.stringify(errorArgs[0])}`;
                        }
                        else if (errorName === "Panic") {
                            message = `; VM Exception while processing transaction: reverted with panic code ${errorArgs[0]}`;
                        }
                    }
                    else {
                        try {
                            const error = this.getError(selector);
                            errorArgs = this._abiCoder.decode(error.inputs, bytes.slice(4));
                            errorName = error.name;
                            errorSignature = error.format();
                        }
                        catch (error) { }
                    }
                    break;
                }
            }
            return logger$e.throwError("call revert exception" + message, Logger$1.errors.CALL_EXCEPTION, {
                method: functionFragment.format(),
                data: hexlify$1(data), errorArgs, errorName, errorSignature, reason
            });
        }
        // Encode the result for a function call (e.g. for eth_call)
        encodeFunctionResult(functionFragment, values) {
            if (typeof (functionFragment) === "string") {
                functionFragment = this.getFunction(functionFragment);
            }
            return hexlify$1(this._abiCoder.encode(functionFragment.outputs, values || []));
        }
        // Create the filter for the event with search criteria (e.g. for eth_filterLog)
        encodeFilterTopics(eventFragment, values) {
            if (typeof (eventFragment) === "string") {
                eventFragment = this.getEvent(eventFragment);
            }
            if (values.length > eventFragment.inputs.length) {
                logger$e.throwError("too many arguments for " + eventFragment.format(), Logger$1.errors.UNEXPECTED_ARGUMENT, {
                    argument: "values",
                    value: values
                });
            }
            let topics = [];
            if (!eventFragment.anonymous) {
                topics.push(this.getEventTopic(eventFragment));
            }
            const encodeTopic = (param, value) => {
                if (param.type === "string") {
                    return id$1(value);
                }
                else if (param.type === "bytes") {
                    return keccak256$1(hexlify$1(value));
                }
                if (param.type === "bool" && typeof (value) === "boolean") {
                    value = (value ? "0x01" : "0x00");
                }
                if (param.type.match(/^u?int/)) {
                    value = BigNumber$1.from(value).toHexString();
                }
                // Check addresses are valid
                if (param.type === "address") {
                    this._abiCoder.encode(["address"], [value]);
                }
                return hexZeroPad$1(hexlify$1(value), 32);
            };
            values.forEach((value, index) => {
                let param = eventFragment.inputs[index];
                if (!param.indexed) {
                    if (value != null) {
                        logger$e.throwArgumentError("cannot filter non-indexed parameters; must be null", ("contract." + param.name), value);
                    }
                    return;
                }
                if (value == null) {
                    topics.push(null);
                }
                else if (param.baseType === "array" || param.baseType === "tuple") {
                    logger$e.throwArgumentError("filtering with tuples or arrays not supported", ("contract." + param.name), value);
                }
                else if (Array.isArray(value)) {
                    topics.push(value.map((value) => encodeTopic(param, value)));
                }
                else {
                    topics.push(encodeTopic(param, value));
                }
            });
            // Trim off trailing nulls
            while (topics.length && topics[topics.length - 1] === null) {
                topics.pop();
            }
            return topics;
        }
        encodeEventLog(eventFragment, values) {
            if (typeof (eventFragment) === "string") {
                eventFragment = this.getEvent(eventFragment);
            }
            const topics = [];
            const dataTypes = [];
            const dataValues = [];
            if (!eventFragment.anonymous) {
                topics.push(this.getEventTopic(eventFragment));
            }
            if (values.length !== eventFragment.inputs.length) {
                logger$e.throwArgumentError("event arguments/values mismatch", "values", values);
            }
            eventFragment.inputs.forEach((param, index) => {
                const value = values[index];
                if (param.indexed) {
                    if (param.type === "string") {
                        topics.push(id$1(value));
                    }
                    else if (param.type === "bytes") {
                        topics.push(keccak256$1(value));
                    }
                    else if (param.baseType === "tuple" || param.baseType === "array") {
                        // @TODO
                        throw new Error("not implemented");
                    }
                    else {
                        topics.push(this._abiCoder.encode([param.type], [value]));
                    }
                }
                else {
                    dataTypes.push(param);
                    dataValues.push(value);
                }
            });
            return {
                data: this._abiCoder.encode(dataTypes, dataValues),
                topics: topics
            };
        }
        // Decode a filter for the event and the search criteria
        decodeEventLog(eventFragment, data, topics) {
            if (typeof (eventFragment) === "string") {
                eventFragment = this.getEvent(eventFragment);
            }
            if (topics != null && !eventFragment.anonymous) {
                let topicHash = this.getEventTopic(eventFragment);
                if (!isHexString$1(topics[0], 32) || topics[0].toLowerCase() !== topicHash) {
                    logger$e.throwError("fragment/topic mismatch", Logger$1.errors.INVALID_ARGUMENT, { argument: "topics[0]", expected: topicHash, value: topics[0] });
                }
                topics = topics.slice(1);
            }
            let indexed = [];
            let nonIndexed = [];
            let dynamic = [];
            eventFragment.inputs.forEach((param, index) => {
                if (param.indexed) {
                    if (param.type === "string" || param.type === "bytes" || param.baseType === "tuple" || param.baseType === "array") {
                        indexed.push(ParamType$1.fromObject({ type: "bytes32", name: param.name }));
                        dynamic.push(true);
                    }
                    else {
                        indexed.push(param);
                        dynamic.push(false);
                    }
                }
                else {
                    nonIndexed.push(param);
                    dynamic.push(false);
                }
            });
            let resultIndexed = (topics != null) ? this._abiCoder.decode(indexed, concat$1(topics)) : null;
            let resultNonIndexed = this._abiCoder.decode(nonIndexed, data, true);
            let result = [];
            let nonIndexedIndex = 0, indexedIndex = 0;
            eventFragment.inputs.forEach((param, index) => {
                if (param.indexed) {
                    if (resultIndexed == null) {
                        result[index] = new Indexed$1({ _isIndexed: true, hash: null });
                    }
                    else if (dynamic[index]) {
                        result[index] = new Indexed$1({ _isIndexed: true, hash: resultIndexed[indexedIndex++] });
                    }
                    else {
                        try {
                            result[index] = resultIndexed[indexedIndex++];
                        }
                        catch (error) {
                            result[index] = error;
                        }
                    }
                }
                else {
                    try {
                        result[index] = resultNonIndexed[nonIndexedIndex++];
                    }
                    catch (error) {
                        result[index] = error;
                    }
                }
                // Add the keyword argument if named and safe
                if (param.name && result[param.name] == null) {
                    const value = result[index];
                    // Make error named values throw on access
                    if (value instanceof Error) {
                        Object.defineProperty(result, param.name, {
                            enumerable: true,
                            get: () => { throw wrapAccessError$1(`property ${JSON.stringify(param.name)}`, value); }
                        });
                    }
                    else {
                        result[param.name] = value;
                    }
                }
            });
            // Make all error indexed values throw on access
            for (let i = 0; i < result.length; i++) {
                const value = result[i];
                if (value instanceof Error) {
                    Object.defineProperty(result, i, {
                        enumerable: true,
                        get: () => { throw wrapAccessError$1(`index ${i}`, value); }
                    });
                }
            }
            return Object.freeze(result);
        }
        // Given a transaction, find the matching function fragment (if any) and
        // determine all its properties and call parameters
        parseTransaction(tx) {
            let fragment = this.getFunction(tx.data.substring(0, 10).toLowerCase());
            if (!fragment) {
                return null;
            }
            return new TransactionDescription$1({
                args: this._abiCoder.decode(fragment.inputs, "0x" + tx.data.substring(10)),
                functionFragment: fragment,
                name: fragment.name,
                signature: fragment.format(),
                sighash: this.getSighash(fragment),
                value: BigNumber$1.from(tx.value || "0"),
            });
        }
        // @TODO
        //parseCallResult(data: BytesLike): ??
        // Given an event log, find the matching event fragment (if any) and
        // determine all its properties and values
        parseLog(log) {
            let fragment = this.getEvent(log.topics[0]);
            if (!fragment || fragment.anonymous) {
                return null;
            }
            // @TODO: If anonymous, and the only method, and the input count matches, should we parse?
            //        Probably not, because just because it is the only event in the ABI does
            //        not mean we have the full ABI; maybe just a fragment?
            return new LogDescription$1({
                eventFragment: fragment,
                name: fragment.name,
                signature: fragment.format(),
                topic: this.getEventTopic(fragment),
                args: this.decodeEventLog(fragment, log.data, log.topics)
            });
        }
        parseError(data) {
            const hexData = hexlify$1(data);
            let fragment = this.getError(hexData.substring(0, 10).toLowerCase());
            if (!fragment) {
                return null;
            }
            return new ErrorDescription$1({
                args: this._abiCoder.decode(fragment.inputs, "0x" + hexData.substring(10)),
                errorFragment: fragment,
                name: fragment.name,
                signature: fragment.format(),
                sighash: this.getSighash(fragment),
            });
        }
        /*
        static from(value: Array<Fragment | string | JsonAbi> | string | Interface) {
            if (Interface.isInterface(value)) {
                return value;
            }
            if (typeof(value) === "string") {
                return new Interface(JSON.parse(value));
            }
            return new Interface(value);
        }
        */
        static isInterface(value) {
            return !!(value && value._isInterface);
        }
    };

    const version$a = "abstract-provider/5.7.0";

    var __awaiter$2 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    const logger$d = new Logger$1(version$a);
    ///////////////////////////////
    // Exported Abstracts
    class Provider {
        constructor() {
            logger$d.checkAbstract(new.target, Provider);
            defineReadOnly$1(this, "_isProvider", true);
        }
        getFeeData() {
            return __awaiter$2(this, void 0, void 0, function* () {
                const { block, gasPrice } = yield resolveProperties({
                    block: this.getBlock("latest"),
                    gasPrice: this.getGasPrice().catch((error) => {
                        // @TODO: Why is this now failing on Calaveras?
                        //console.log(error);
                        return null;
                    })
                });
                let lastBaseFeePerGas = null, maxFeePerGas = null, maxPriorityFeePerGas = null;
                if (block && block.baseFeePerGas) {
                    // We may want to compute this more accurately in the future,
                    // using the formula "check if the base fee is correct".
                    // See: https://eips.ethereum.org/EIPS/eip-1559
                    lastBaseFeePerGas = block.baseFeePerGas;
                    maxPriorityFeePerGas = BigNumber$1.from("1500000000");
                    maxFeePerGas = block.baseFeePerGas.mul(2).add(maxPriorityFeePerGas);
                }
                return { lastBaseFeePerGas, maxFeePerGas, maxPriorityFeePerGas, gasPrice };
            });
        }
        // Alias for "on"
        addListener(eventName, listener) {
            return this.on(eventName, listener);
        }
        // Alias for "off"
        removeListener(eventName, listener) {
            return this.off(eventName, listener);
        }
        static isProvider(value) {
            return !!(value && value._isProvider);
        }
    }

    const version$9 = "abstract-signer/5.7.0";

    var __awaiter$1 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    const logger$c = new Logger$1(version$9);
    const allowedTransactionKeys = [
        "accessList", "ccipReadEnabled", "chainId", "customData", "data", "from", "gasLimit", "gasPrice", "maxFeePerGas", "maxPriorityFeePerGas", "nonce", "to", "type", "value"
    ];
    const forwardErrors = [
        Logger$1.errors.INSUFFICIENT_FUNDS,
        Logger$1.errors.NONCE_EXPIRED,
        Logger$1.errors.REPLACEMENT_UNDERPRICED,
    ];
    class Signer {
        ///////////////////
        // Sub-classes MUST call super
        constructor() {
            logger$c.checkAbstract(new.target, Signer);
            defineReadOnly$1(this, "_isSigner", true);
        }
        ///////////////////
        // Sub-classes MAY override these
        getBalance(blockTag) {
            return __awaiter$1(this, void 0, void 0, function* () {
                this._checkProvider("getBalance");
                return yield this.provider.getBalance(this.getAddress(), blockTag);
            });
        }
        getTransactionCount(blockTag) {
            return __awaiter$1(this, void 0, void 0, function* () {
                this._checkProvider("getTransactionCount");
                return yield this.provider.getTransactionCount(this.getAddress(), blockTag);
            });
        }
        // Populates "from" if unspecified, and estimates the gas for the transaction
        estimateGas(transaction) {
            return __awaiter$1(this, void 0, void 0, function* () {
                this._checkProvider("estimateGas");
                const tx = yield resolveProperties(this.checkTransaction(transaction));
                return yield this.provider.estimateGas(tx);
            });
        }
        // Populates "from" if unspecified, and calls with the transaction
        call(transaction, blockTag) {
            return __awaiter$1(this, void 0, void 0, function* () {
                this._checkProvider("call");
                const tx = yield resolveProperties(this.checkTransaction(transaction));
                return yield this.provider.call(tx, blockTag);
            });
        }
        // Populates all fields in a transaction, signs it and sends it to the network
        sendTransaction(transaction) {
            return __awaiter$1(this, void 0, void 0, function* () {
                this._checkProvider("sendTransaction");
                const tx = yield this.populateTransaction(transaction);
                const signedTx = yield this.signTransaction(tx);
                return yield this.provider.sendTransaction(signedTx);
            });
        }
        getChainId() {
            return __awaiter$1(this, void 0, void 0, function* () {
                this._checkProvider("getChainId");
                const network = yield this.provider.getNetwork();
                return network.chainId;
            });
        }
        getGasPrice() {
            return __awaiter$1(this, void 0, void 0, function* () {
                this._checkProvider("getGasPrice");
                return yield this.provider.getGasPrice();
            });
        }
        getFeeData() {
            return __awaiter$1(this, void 0, void 0, function* () {
                this._checkProvider("getFeeData");
                return yield this.provider.getFeeData();
            });
        }
        resolveName(name) {
            return __awaiter$1(this, void 0, void 0, function* () {
                this._checkProvider("resolveName");
                return yield this.provider.resolveName(name);
            });
        }
        // Checks a transaction does not contain invalid keys and if
        // no "from" is provided, populates it.
        // - does NOT require a provider
        // - adds "from" is not present
        // - returns a COPY (safe to mutate the result)
        // By default called from: (overriding these prevents it)
        //   - call
        //   - estimateGas
        //   - populateTransaction (and therefor sendTransaction)
        checkTransaction(transaction) {
            for (const key in transaction) {
                if (allowedTransactionKeys.indexOf(key) === -1) {
                    logger$c.throwArgumentError("invalid transaction key: " + key, "transaction", transaction);
                }
            }
            const tx = shallowCopy(transaction);
            if (tx.from == null) {
                tx.from = this.getAddress();
            }
            else {
                // Make sure any provided address matches this signer
                tx.from = Promise.all([
                    Promise.resolve(tx.from),
                    this.getAddress()
                ]).then((result) => {
                    if (result[0].toLowerCase() !== result[1].toLowerCase()) {
                        logger$c.throwArgumentError("from address mismatch", "transaction", transaction);
                    }
                    return result[0];
                });
            }
            return tx;
        }
        // Populates ALL keys for a transaction and checks that "from" matches
        // this Signer. Should be used by sendTransaction but NOT by signTransaction.
        // By default called from: (overriding these prevents it)
        //   - sendTransaction
        //
        // Notes:
        //  - We allow gasPrice for EIP-1559 as long as it matches maxFeePerGas
        populateTransaction(transaction) {
            return __awaiter$1(this, void 0, void 0, function* () {
                const tx = yield resolveProperties(this.checkTransaction(transaction));
                if (tx.to != null) {
                    tx.to = Promise.resolve(tx.to).then((to) => __awaiter$1(this, void 0, void 0, function* () {
                        if (to == null) {
                            return null;
                        }
                        const address = yield this.resolveName(to);
                        if (address == null) {
                            logger$c.throwArgumentError("provided ENS name resolves to null", "tx.to", to);
                        }
                        return address;
                    }));
                    // Prevent this error from causing an UnhandledPromiseException
                    tx.to.catch((error) => { });
                }
                // Do not allow mixing pre-eip-1559 and eip-1559 properties
                const hasEip1559 = (tx.maxFeePerGas != null || tx.maxPriorityFeePerGas != null);
                if (tx.gasPrice != null && (tx.type === 2 || hasEip1559)) {
                    logger$c.throwArgumentError("eip-1559 transaction do not support gasPrice", "transaction", transaction);
                }
                else if ((tx.type === 0 || tx.type === 1) && hasEip1559) {
                    logger$c.throwArgumentError("pre-eip-1559 transaction do not support maxFeePerGas/maxPriorityFeePerGas", "transaction", transaction);
                }
                if ((tx.type === 2 || tx.type == null) && (tx.maxFeePerGas != null && tx.maxPriorityFeePerGas != null)) {
                    // Fully-formed EIP-1559 transaction (skip getFeeData)
                    tx.type = 2;
                }
                else if (tx.type === 0 || tx.type === 1) {
                    // Explicit Legacy or EIP-2930 transaction
                    // Populate missing gasPrice
                    if (tx.gasPrice == null) {
                        tx.gasPrice = this.getGasPrice();
                    }
                }
                else {
                    // We need to get fee data to determine things
                    const feeData = yield this.getFeeData();
                    if (tx.type == null) {
                        // We need to auto-detect the intended type of this transaction...
                        if (feeData.maxFeePerGas != null && feeData.maxPriorityFeePerGas != null) {
                            // The network supports EIP-1559!
                            // Upgrade transaction from null to eip-1559
                            tx.type = 2;
                            if (tx.gasPrice != null) {
                                // Using legacy gasPrice property on an eip-1559 network,
                                // so use gasPrice as both fee properties
                                const gasPrice = tx.gasPrice;
                                delete tx.gasPrice;
                                tx.maxFeePerGas = gasPrice;
                                tx.maxPriorityFeePerGas = gasPrice;
                            }
                            else {
                                // Populate missing fee data
                                if (tx.maxFeePerGas == null) {
                                    tx.maxFeePerGas = feeData.maxFeePerGas;
                                }
                                if (tx.maxPriorityFeePerGas == null) {
                                    tx.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
                                }
                            }
                        }
                        else if (feeData.gasPrice != null) {
                            // Network doesn't support EIP-1559...
                            // ...but they are trying to use EIP-1559 properties
                            if (hasEip1559) {
                                logger$c.throwError("network does not support EIP-1559", Logger$1.errors.UNSUPPORTED_OPERATION, {
                                    operation: "populateTransaction"
                                });
                            }
                            // Populate missing fee data
                            if (tx.gasPrice == null) {
                                tx.gasPrice = feeData.gasPrice;
                            }
                            // Explicitly set untyped transaction to legacy
                            tx.type = 0;
                        }
                        else {
                            // getFeeData has failed us.
                            logger$c.throwError("failed to get consistent fee data", Logger$1.errors.UNSUPPORTED_OPERATION, {
                                operation: "signer.getFeeData"
                            });
                        }
                    }
                    else if (tx.type === 2) {
                        // Explicitly using EIP-1559
                        // Populate missing fee data
                        if (tx.maxFeePerGas == null) {
                            tx.maxFeePerGas = feeData.maxFeePerGas;
                        }
                        if (tx.maxPriorityFeePerGas == null) {
                            tx.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
                        }
                    }
                }
                if (tx.nonce == null) {
                    tx.nonce = this.getTransactionCount("pending");
                }
                if (tx.gasLimit == null) {
                    tx.gasLimit = this.estimateGas(tx).catch((error) => {
                        if (forwardErrors.indexOf(error.code) >= 0) {
                            throw error;
                        }
                        return logger$c.throwError("cannot estimate gas; transaction may fail or may require manual gas limit", Logger$1.errors.UNPREDICTABLE_GAS_LIMIT, {
                            error: error,
                            tx: tx
                        });
                    });
                }
                if (tx.chainId == null) {
                    tx.chainId = this.getChainId();
                }
                else {
                    tx.chainId = Promise.all([
                        Promise.resolve(tx.chainId),
                        this.getChainId()
                    ]).then((results) => {
                        if (results[1] !== 0 && results[0] !== results[1]) {
                            logger$c.throwArgumentError("chainId address mismatch", "transaction", transaction);
                        }
                        return results[0];
                    });
                }
                return yield resolveProperties(tx);
            });
        }
        ///////////////////
        // Sub-classes SHOULD leave these alone
        _checkProvider(operation) {
            if (!this.provider) {
                logger$c.throwError("missing provider", Logger$1.errors.UNSUPPORTED_OPERATION, {
                    operation: (operation || "_checkProvider")
                });
            }
        }
        static isSigner(value) {
            return !!(value && value._isSigner);
        }
    }
    class VoidSigner extends Signer {
        constructor(address, provider) {
            super();
            defineReadOnly$1(this, "address", address);
            defineReadOnly$1(this, "provider", provider || null);
        }
        getAddress() {
            return Promise.resolve(this.address);
        }
        _fail(message, operation) {
            return Promise.resolve().then(() => {
                logger$c.throwError(message, Logger$1.errors.UNSUPPORTED_OPERATION, { operation: operation });
            });
        }
        signMessage(message) {
            return this._fail("VoidSigner cannot sign messages", "signMessage");
        }
        signTransaction(transaction) {
            return this._fail("VoidSigner cannot sign transactions", "signTransaction");
        }
        _signTypedData(domain, types, value) {
            return this._fail("VoidSigner cannot sign typed data", "signTypedData");
        }
        connect(provider) {
            return new VoidSigner(this.address, provider);
        }
    }

    const version$8 = "transactions/5.7.0";

    const logger$b = new Logger$1(version$8);
    var TransactionTypes;
    (function (TransactionTypes) {
        TransactionTypes[TransactionTypes["legacy"] = 0] = "legacy";
        TransactionTypes[TransactionTypes["eip2930"] = 1] = "eip2930";
        TransactionTypes[TransactionTypes["eip1559"] = 2] = "eip1559";
    })(TransactionTypes || (TransactionTypes = {}));
    function accessSetify(addr, storageKeys) {
        return {
            address: getAddress$1(addr),
            storageKeys: (storageKeys || []).map((storageKey, index) => {
                if (hexDataLength(storageKey) !== 32) {
                    logger$b.throwArgumentError("invalid access list storageKey", `accessList[${addr}:${index}]`, storageKey);
                }
                return storageKey.toLowerCase();
            })
        };
    }
    function accessListify(value) {
        if (Array.isArray(value)) {
            return value.map((set, index) => {
                if (Array.isArray(set)) {
                    if (set.length > 2) {
                        logger$b.throwArgumentError("access list expected to be [ address, storageKeys[] ]", `value[${index}]`, set);
                    }
                    return accessSetify(set[0], set[1]);
                }
                return accessSetify(set.address, set.storageKeys);
            });
        }
        const result = Object.keys(value).map((addr) => {
            const storageKeys = value[addr].reduce((accum, storageKey) => {
                accum[storageKey] = true;
                return accum;
            }, {});
            return accessSetify(addr, Object.keys(storageKeys).sort());
        });
        result.sort((a, b) => (a.address.localeCompare(b.address)));
        return result;
    }

    const version$7 = "contracts/5.7.0";

    var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    const logger$a = new Logger$1(version$7);
    function resolveName(resolver, nameOrPromise) {
        return __awaiter(this, void 0, void 0, function* () {
            const name = yield nameOrPromise;
            if (typeof (name) !== "string") {
                logger$a.throwArgumentError("invalid address or ENS name", "name", name);
            }
            // If it is already an address, just use it (after adding checksum)
            try {
                return getAddress$1(name);
            }
            catch (error) { }
            if (!resolver) {
                logger$a.throwError("a provider or signer is needed to resolve ENS names", Logger$1.errors.UNSUPPORTED_OPERATION, {
                    operation: "resolveName"
                });
            }
            const address = yield resolver.resolveName(name);
            if (address == null) {
                logger$a.throwArgumentError("resolver or addr is not configured for ENS name", "name", name);
            }
            return address;
        });
    }
    // Recursively replaces ENS names with promises to resolve the name and resolves all properties
    function resolveAddresses(resolver, value, paramType) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Array.isArray(paramType)) {
                return yield Promise.all(paramType.map((paramType, index) => {
                    return resolveAddresses(resolver, ((Array.isArray(value)) ? value[index] : value[paramType.name]), paramType);
                }));
            }
            if (paramType.type === "address") {
                return yield resolveName(resolver, value);
            }
            if (paramType.type === "tuple") {
                return yield resolveAddresses(resolver, value, paramType.components);
            }
            if (paramType.baseType === "array") {
                if (!Array.isArray(value)) {
                    return Promise.reject(logger$a.makeError("invalid value for array", Logger$1.errors.INVALID_ARGUMENT, {
                        argument: "value",
                        value
                    }));
                }
                return yield Promise.all(value.map((v) => resolveAddresses(resolver, v, paramType.arrayChildren)));
            }
            return value;
        });
    }
    function populateTransaction(contract, fragment, args) {
        return __awaiter(this, void 0, void 0, function* () {
            // If an extra argument is given, it is overrides
            let overrides = {};
            if (args.length === fragment.inputs.length + 1 && typeof (args[args.length - 1]) === "object") {
                overrides = shallowCopy(args.pop());
            }
            // Make sure the parameter count matches
            logger$a.checkArgumentCount(args.length, fragment.inputs.length, "passed to contract");
            // Populate "from" override (allow promises)
            if (contract.signer) {
                if (overrides.from) {
                    // Contracts with a Signer are from the Signer's frame-of-reference;
                    // but we allow overriding "from" if it matches the signer
                    overrides.from = resolveProperties({
                        override: resolveName(contract.signer, overrides.from),
                        signer: contract.signer.getAddress()
                    }).then((check) => __awaiter(this, void 0, void 0, function* () {
                        if (getAddress$1(check.signer) !== check.override) {
                            logger$a.throwError("Contract with a Signer cannot override from", Logger$1.errors.UNSUPPORTED_OPERATION, {
                                operation: "overrides.from"
                            });
                        }
                        return check.override;
                    }));
                }
                else {
                    overrides.from = contract.signer.getAddress();
                }
            }
            else if (overrides.from) {
                overrides.from = resolveName(contract.provider, overrides.from);
                //} else {
                // Contracts without a signer can override "from", and if
                // unspecified the zero address is used
                //overrides.from = AddressZero;
            }
            // Wait for all dependencies to be resolved (prefer the signer over the provider)
            const resolved = yield resolveProperties({
                args: resolveAddresses(contract.signer || contract.provider, args, fragment.inputs),
                address: contract.resolvedAddress,
                overrides: (resolveProperties(overrides) || {})
            });
            // The ABI coded transaction
            const data = contract.interface.encodeFunctionData(fragment, resolved.args);
            const tx = {
                data: data,
                to: resolved.address
            };
            // Resolved Overrides
            const ro = resolved.overrides;
            // Populate simple overrides
            if (ro.nonce != null) {
                tx.nonce = BigNumber$1.from(ro.nonce).toNumber();
            }
            if (ro.gasLimit != null) {
                tx.gasLimit = BigNumber$1.from(ro.gasLimit);
            }
            if (ro.gasPrice != null) {
                tx.gasPrice = BigNumber$1.from(ro.gasPrice);
            }
            if (ro.maxFeePerGas != null) {
                tx.maxFeePerGas = BigNumber$1.from(ro.maxFeePerGas);
            }
            if (ro.maxPriorityFeePerGas != null) {
                tx.maxPriorityFeePerGas = BigNumber$1.from(ro.maxPriorityFeePerGas);
            }
            if (ro.from != null) {
                tx.from = ro.from;
            }
            if (ro.type != null) {
                tx.type = ro.type;
            }
            if (ro.accessList != null) {
                tx.accessList = accessListify(ro.accessList);
            }
            // If there was no "gasLimit" override, but the ABI specifies a default, use it
            if (tx.gasLimit == null && fragment.gas != null) {
                // Compute the intrinsic gas cost for this transaction
                // @TODO: This is based on the yellow paper as of Petersburg; this is something
                // we may wish to parameterize in v6 as part of the Network object. Since this
                // is always a non-nil to address, we can ignore G_create, but may wish to add
                // similar logic to the ContractFactory.
                let intrinsic = 21000;
                const bytes = arrayify$1(data);
                for (let i = 0; i < bytes.length; i++) {
                    intrinsic += 4;
                    if (bytes[i]) {
                        intrinsic += 64;
                    }
                }
                tx.gasLimit = BigNumber$1.from(fragment.gas).add(intrinsic);
            }
            // Populate "value" override
            if (ro.value) {
                const roValue = BigNumber$1.from(ro.value);
                if (!roValue.isZero() && !fragment.payable) {
                    logger$a.throwError("non-payable method cannot override value", Logger$1.errors.UNSUPPORTED_OPERATION, {
                        operation: "overrides.value",
                        value: overrides.value
                    });
                }
                tx.value = roValue;
            }
            if (ro.customData) {
                tx.customData = shallowCopy(ro.customData);
            }
            if (ro.ccipReadEnabled) {
                tx.ccipReadEnabled = !!ro.ccipReadEnabled;
            }
            // Remove the overrides
            delete overrides.nonce;
            delete overrides.gasLimit;
            delete overrides.gasPrice;
            delete overrides.from;
            delete overrides.value;
            delete overrides.type;
            delete overrides.accessList;
            delete overrides.maxFeePerGas;
            delete overrides.maxPriorityFeePerGas;
            delete overrides.customData;
            delete overrides.ccipReadEnabled;
            // Make sure there are no stray overrides, which may indicate a
            // typo or using an unsupported key.
            const leftovers = Object.keys(overrides).filter((key) => (overrides[key] != null));
            if (leftovers.length) {
                logger$a.throwError(`cannot override ${leftovers.map((l) => JSON.stringify(l)).join(",")}`, Logger$1.errors.UNSUPPORTED_OPERATION, {
                    operation: "overrides",
                    overrides: leftovers
                });
            }
            return tx;
        });
    }
    function buildPopulate(contract, fragment) {
        return function (...args) {
            return populateTransaction(contract, fragment, args);
        };
    }
    function buildEstimate(contract, fragment) {
        const signerOrProvider = (contract.signer || contract.provider);
        return function (...args) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!signerOrProvider) {
                    logger$a.throwError("estimate require a provider or signer", Logger$1.errors.UNSUPPORTED_OPERATION, {
                        operation: "estimateGas"
                    });
                }
                const tx = yield populateTransaction(contract, fragment, args);
                return yield signerOrProvider.estimateGas(tx);
            });
        };
    }
    function addContractWait(contract, tx) {
        const wait = tx.wait.bind(tx);
        tx.wait = (confirmations) => {
            return wait(confirmations).then((receipt) => {
                receipt.events = receipt.logs.map((log) => {
                    let event = deepCopy$1(log);
                    let parsed = null;
                    try {
                        parsed = contract.interface.parseLog(log);
                    }
                    catch (e) { }
                    // Successfully parsed the event log; include it
                    if (parsed) {
                        event.args = parsed.args;
                        event.decode = (data, topics) => {
                            return contract.interface.decodeEventLog(parsed.eventFragment, data, topics);
                        };
                        event.event = parsed.name;
                        event.eventSignature = parsed.signature;
                    }
                    // Useful operations
                    event.removeListener = () => { return contract.provider; };
                    event.getBlock = () => {
                        return contract.provider.getBlock(receipt.blockHash);
                    };
                    event.getTransaction = () => {
                        return contract.provider.getTransaction(receipt.transactionHash);
                    };
                    event.getTransactionReceipt = () => {
                        return Promise.resolve(receipt);
                    };
                    return event;
                });
                return receipt;
            });
        };
    }
    function buildCall(contract, fragment, collapseSimple) {
        const signerOrProvider = (contract.signer || contract.provider);
        return function (...args) {
            return __awaiter(this, void 0, void 0, function* () {
                // Extract the "blockTag" override if present
                let blockTag = undefined;
                if (args.length === fragment.inputs.length + 1 && typeof (args[args.length - 1]) === "object") {
                    const overrides = shallowCopy(args.pop());
                    if (overrides.blockTag != null) {
                        blockTag = yield overrides.blockTag;
                    }
                    delete overrides.blockTag;
                    args.push(overrides);
                }
                // If the contract was just deployed, wait until it is mined
                if (contract.deployTransaction != null) {
                    yield contract._deployed(blockTag);
                }
                // Call a node and get the result
                const tx = yield populateTransaction(contract, fragment, args);
                const result = yield signerOrProvider.call(tx, blockTag);
                try {
                    let value = contract.interface.decodeFunctionResult(fragment, result);
                    if (collapseSimple && fragment.outputs.length === 1) {
                        value = value[0];
                    }
                    return value;
                }
                catch (error) {
                    if (error.code === Logger$1.errors.CALL_EXCEPTION) {
                        error.address = contract.address;
                        error.args = args;
                        error.transaction = tx;
                    }
                    throw error;
                }
            });
        };
    }
    function buildSend(contract, fragment) {
        return function (...args) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!contract.signer) {
                    logger$a.throwError("sending a transaction requires a signer", Logger$1.errors.UNSUPPORTED_OPERATION, {
                        operation: "sendTransaction"
                    });
                }
                // If the contract was just deployed, wait until it is mined
                if (contract.deployTransaction != null) {
                    yield contract._deployed();
                }
                const txRequest = yield populateTransaction(contract, fragment, args);
                const tx = yield contract.signer.sendTransaction(txRequest);
                // Tweak the tx.wait so the receipt has extra properties
                addContractWait(contract, tx);
                return tx;
            });
        };
    }
    function buildDefault(contract, fragment, collapseSimple) {
        if (fragment.constant) {
            return buildCall(contract, fragment, collapseSimple);
        }
        return buildSend(contract, fragment);
    }
    function getEventTag(filter) {
        if (filter.address && (filter.topics == null || filter.topics.length === 0)) {
            return "*";
        }
        return (filter.address || "*") + "@" + (filter.topics ? filter.topics.map((topic) => {
            if (Array.isArray(topic)) {
                return topic.join("|");
            }
            return topic;
        }).join(":") : "");
    }
    class RunningEvent {
        constructor(tag, filter) {
            defineReadOnly$1(this, "tag", tag);
            defineReadOnly$1(this, "filter", filter);
            this._listeners = [];
        }
        addListener(listener, once) {
            this._listeners.push({ listener: listener, once: once });
        }
        removeListener(listener) {
            let done = false;
            this._listeners = this._listeners.filter((item) => {
                if (done || item.listener !== listener) {
                    return true;
                }
                done = true;
                return false;
            });
        }
        removeAllListeners() {
            this._listeners = [];
        }
        listeners() {
            return this._listeners.map((i) => i.listener);
        }
        listenerCount() {
            return this._listeners.length;
        }
        run(args) {
            const listenerCount = this.listenerCount();
            this._listeners = this._listeners.filter((item) => {
                const argsCopy = args.slice();
                // Call the callback in the next event loop
                setTimeout(() => {
                    item.listener.apply(this, argsCopy);
                }, 0);
                // Reschedule it if it not "once"
                return !(item.once);
            });
            return listenerCount;
        }
        prepareEvent(event) {
        }
        // Returns the array that will be applied to an emit
        getEmit(event) {
            return [event];
        }
    }
    class ErrorRunningEvent extends RunningEvent {
        constructor() {
            super("error", null);
        }
    }
    // @TODO Fragment should inherit Wildcard? and just override getEmit?
    //       or have a common abstract super class, with enough constructor
    //       options to configure both.
    // A Fragment Event will populate all the properties that Wildcard
    // will, and additionally dereference the arguments when emitting
    class FragmentRunningEvent extends RunningEvent {
        constructor(address, contractInterface, fragment, topics) {
            const filter = {
                address: address
            };
            let topic = contractInterface.getEventTopic(fragment);
            if (topics) {
                if (topic !== topics[0]) {
                    logger$a.throwArgumentError("topic mismatch", "topics", topics);
                }
                filter.topics = topics.slice();
            }
            else {
                filter.topics = [topic];
            }
            super(getEventTag(filter), filter);
            defineReadOnly$1(this, "address", address);
            defineReadOnly$1(this, "interface", contractInterface);
            defineReadOnly$1(this, "fragment", fragment);
        }
        prepareEvent(event) {
            super.prepareEvent(event);
            event.event = this.fragment.name;
            event.eventSignature = this.fragment.format();
            event.decode = (data, topics) => {
                return this.interface.decodeEventLog(this.fragment, data, topics);
            };
            try {
                event.args = this.interface.decodeEventLog(this.fragment, event.data, event.topics);
            }
            catch (error) {
                event.args = null;
                event.decodeError = error;
            }
        }
        getEmit(event) {
            const errors = checkResultErrors(event.args);
            if (errors.length) {
                throw errors[0].error;
            }
            const args = (event.args || []).slice();
            args.push(event);
            return args;
        }
    }
    // A Wildcard Event will attempt to populate:
    //  - event            The name of the event name
    //  - eventSignature   The full signature of the event
    //  - decode           A function to decode data and topics
    //  - args             The decoded data and topics
    class WildcardRunningEvent extends RunningEvent {
        constructor(address, contractInterface) {
            super("*", { address: address });
            defineReadOnly$1(this, "address", address);
            defineReadOnly$1(this, "interface", contractInterface);
        }
        prepareEvent(event) {
            super.prepareEvent(event);
            try {
                const parsed = this.interface.parseLog(event);
                event.event = parsed.name;
                event.eventSignature = parsed.signature;
                event.decode = (data, topics) => {
                    return this.interface.decodeEventLog(parsed.eventFragment, data, topics);
                };
                event.args = parsed.args;
            }
            catch (error) {
                // No matching event
            }
        }
    }
    class BaseContract {
        constructor(addressOrName, contractInterface, signerOrProvider) {
            // @TODO: Maybe still check the addressOrName looks like a valid address or name?
            //address = getAddress(address);
            defineReadOnly$1(this, "interface", getStatic$1(new.target, "getInterface")(contractInterface));
            if (signerOrProvider == null) {
                defineReadOnly$1(this, "provider", null);
                defineReadOnly$1(this, "signer", null);
            }
            else if (Signer.isSigner(signerOrProvider)) {
                defineReadOnly$1(this, "provider", signerOrProvider.provider || null);
                defineReadOnly$1(this, "signer", signerOrProvider);
            }
            else if (Provider.isProvider(signerOrProvider)) {
                defineReadOnly$1(this, "provider", signerOrProvider);
                defineReadOnly$1(this, "signer", null);
            }
            else {
                logger$a.throwArgumentError("invalid signer or provider", "signerOrProvider", signerOrProvider);
            }
            defineReadOnly$1(this, "callStatic", {});
            defineReadOnly$1(this, "estimateGas", {});
            defineReadOnly$1(this, "functions", {});
            defineReadOnly$1(this, "populateTransaction", {});
            defineReadOnly$1(this, "filters", {});
            {
                const uniqueFilters = {};
                Object.keys(this.interface.events).forEach((eventSignature) => {
                    const event = this.interface.events[eventSignature];
                    defineReadOnly$1(this.filters, eventSignature, (...args) => {
                        return {
                            address: this.address,
                            topics: this.interface.encodeFilterTopics(event, args)
                        };
                    });
                    if (!uniqueFilters[event.name]) {
                        uniqueFilters[event.name] = [];
                    }
                    uniqueFilters[event.name].push(eventSignature);
                });
                Object.keys(uniqueFilters).forEach((name) => {
                    const filters = uniqueFilters[name];
                    if (filters.length === 1) {
                        defineReadOnly$1(this.filters, name, this.filters[filters[0]]);
                    }
                    else {
                        logger$a.warn(`Duplicate definition of ${name} (${filters.join(", ")})`);
                    }
                });
            }
            defineReadOnly$1(this, "_runningEvents", {});
            defineReadOnly$1(this, "_wrappedEmits", {});
            if (addressOrName == null) {
                logger$a.throwArgumentError("invalid contract address or ENS name", "addressOrName", addressOrName);
            }
            defineReadOnly$1(this, "address", addressOrName);
            if (this.provider) {
                defineReadOnly$1(this, "resolvedAddress", resolveName(this.provider, addressOrName));
            }
            else {
                try {
                    defineReadOnly$1(this, "resolvedAddress", Promise.resolve(getAddress$1(addressOrName)));
                }
                catch (error) {
                    // Without a provider, we cannot use ENS names
                    logger$a.throwError("provider is required to use ENS name as contract address", Logger$1.errors.UNSUPPORTED_OPERATION, {
                        operation: "new Contract"
                    });
                }
            }
            // Swallow bad ENS names to prevent Unhandled Exceptions
            this.resolvedAddress.catch((e) => { });
            const uniqueNames = {};
            const uniqueSignatures = {};
            Object.keys(this.interface.functions).forEach((signature) => {
                const fragment = this.interface.functions[signature];
                // Check that the signature is unique; if not the ABI generation has
                // not been cleaned or may be incorrectly generated
                if (uniqueSignatures[signature]) {
                    logger$a.warn(`Duplicate ABI entry for ${JSON.stringify(signature)}`);
                    return;
                }
                uniqueSignatures[signature] = true;
                // Track unique names; we only expose bare named functions if they
                // are ambiguous
                {
                    const name = fragment.name;
                    if (!uniqueNames[`%${name}`]) {
                        uniqueNames[`%${name}`] = [];
                    }
                    uniqueNames[`%${name}`].push(signature);
                }
                if (this[signature] == null) {
                    defineReadOnly$1(this, signature, buildDefault(this, fragment, true));
                }
                // We do not collapse simple calls on this bucket, which allows
                // frameworks to safely use this without introspection as well as
                // allows decoding error recovery.
                if (this.functions[signature] == null) {
                    defineReadOnly$1(this.functions, signature, buildDefault(this, fragment, false));
                }
                if (this.callStatic[signature] == null) {
                    defineReadOnly$1(this.callStatic, signature, buildCall(this, fragment, true));
                }
                if (this.populateTransaction[signature] == null) {
                    defineReadOnly$1(this.populateTransaction, signature, buildPopulate(this, fragment));
                }
                if (this.estimateGas[signature] == null) {
                    defineReadOnly$1(this.estimateGas, signature, buildEstimate(this, fragment));
                }
            });
            Object.keys(uniqueNames).forEach((name) => {
                // Ambiguous names to not get attached as bare names
                const signatures = uniqueNames[name];
                if (signatures.length > 1) {
                    return;
                }
                // Strip off the leading "%" used for prototype protection
                name = name.substring(1);
                const signature = signatures[0];
                // If overwriting a member property that is null, swallow the error
                try {
                    if (this[name] == null) {
                        defineReadOnly$1(this, name, this[signature]);
                    }
                }
                catch (e) { }
                if (this.functions[name] == null) {
                    defineReadOnly$1(this.functions, name, this.functions[signature]);
                }
                if (this.callStatic[name] == null) {
                    defineReadOnly$1(this.callStatic, name, this.callStatic[signature]);
                }
                if (this.populateTransaction[name] == null) {
                    defineReadOnly$1(this.populateTransaction, name, this.populateTransaction[signature]);
                }
                if (this.estimateGas[name] == null) {
                    defineReadOnly$1(this.estimateGas, name, this.estimateGas[signature]);
                }
            });
        }
        static getContractAddress(transaction) {
            return getContractAddress(transaction);
        }
        static getInterface(contractInterface) {
            if (Interface$1.isInterface(contractInterface)) {
                return contractInterface;
            }
            return new Interface$1(contractInterface);
        }
        // @TODO: Allow timeout?
        deployed() {
            return this._deployed();
        }
        _deployed(blockTag) {
            if (!this._deployedPromise) {
                // If we were just deployed, we know the transaction we should occur in
                if (this.deployTransaction) {
                    this._deployedPromise = this.deployTransaction.wait().then(() => {
                        return this;
                    });
                }
                else {
                    // @TODO: Once we allow a timeout to be passed in, we will wait
                    // up to that many blocks for getCode
                    // Otherwise, poll for our code to be deployed
                    this._deployedPromise = this.provider.getCode(this.address, blockTag).then((code) => {
                        if (code === "0x") {
                            logger$a.throwError("contract not deployed", Logger$1.errors.UNSUPPORTED_OPERATION, {
                                contractAddress: this.address,
                                operation: "getDeployed"
                            });
                        }
                        return this;
                    });
                }
            }
            return this._deployedPromise;
        }
        // @TODO:
        // estimateFallback(overrides?: TransactionRequest): Promise<BigNumber>
        // @TODO:
        // estimateDeploy(bytecode: string, ...args): Promise<BigNumber>
        fallback(overrides) {
            if (!this.signer) {
                logger$a.throwError("sending a transactions require a signer", Logger$1.errors.UNSUPPORTED_OPERATION, { operation: "sendTransaction(fallback)" });
            }
            const tx = shallowCopy(overrides || {});
            ["from", "to"].forEach(function (key) {
                if (tx[key] == null) {
                    return;
                }
                logger$a.throwError("cannot override " + key, Logger$1.errors.UNSUPPORTED_OPERATION, { operation: key });
            });
            tx.to = this.resolvedAddress;
            return this.deployed().then(() => {
                return this.signer.sendTransaction(tx);
            });
        }
        // Reconnect to a different signer or provider
        connect(signerOrProvider) {
            if (typeof (signerOrProvider) === "string") {
                signerOrProvider = new VoidSigner(signerOrProvider, this.provider);
            }
            const contract = new (this.constructor)(this.address, this.interface, signerOrProvider);
            if (this.deployTransaction) {
                defineReadOnly$1(contract, "deployTransaction", this.deployTransaction);
            }
            return contract;
        }
        // Re-attach to a different on-chain instance of this contract
        attach(addressOrName) {
            return new (this.constructor)(addressOrName, this.interface, this.signer || this.provider);
        }
        static isIndexed(value) {
            return Indexed$1.isIndexed(value);
        }
        _normalizeRunningEvent(runningEvent) {
            // Already have an instance of this event running; we can re-use it
            if (this._runningEvents[runningEvent.tag]) {
                return this._runningEvents[runningEvent.tag];
            }
            return runningEvent;
        }
        _getRunningEvent(eventName) {
            if (typeof (eventName) === "string") {
                // Listen for "error" events (if your contract has an error event, include
                // the full signature to bypass this special event keyword)
                if (eventName === "error") {
                    return this._normalizeRunningEvent(new ErrorRunningEvent());
                }
                // Listen for any event that is registered
                if (eventName === "event") {
                    return this._normalizeRunningEvent(new RunningEvent("event", null));
                }
                // Listen for any event
                if (eventName === "*") {
                    return this._normalizeRunningEvent(new WildcardRunningEvent(this.address, this.interface));
                }
                // Get the event Fragment (throws if ambiguous/unknown event)
                const fragment = this.interface.getEvent(eventName);
                return this._normalizeRunningEvent(new FragmentRunningEvent(this.address, this.interface, fragment));
            }
            // We have topics to filter by...
            if (eventName.topics && eventName.topics.length > 0) {
                // Is it a known topichash? (throws if no matching topichash)
                try {
                    const topic = eventName.topics[0];
                    if (typeof (topic) !== "string") {
                        throw new Error("invalid topic"); // @TODO: May happen for anonymous events
                    }
                    const fragment = this.interface.getEvent(topic);
                    return this._normalizeRunningEvent(new FragmentRunningEvent(this.address, this.interface, fragment, eventName.topics));
                }
                catch (error) { }
                // Filter by the unknown topichash
                const filter = {
                    address: this.address,
                    topics: eventName.topics
                };
                return this._normalizeRunningEvent(new RunningEvent(getEventTag(filter), filter));
            }
            return this._normalizeRunningEvent(new WildcardRunningEvent(this.address, this.interface));
        }
        _checkRunningEvents(runningEvent) {
            if (runningEvent.listenerCount() === 0) {
                delete this._runningEvents[runningEvent.tag];
                // If we have a poller for this, remove it
                const emit = this._wrappedEmits[runningEvent.tag];
                if (emit && runningEvent.filter) {
                    this.provider.off(runningEvent.filter, emit);
                    delete this._wrappedEmits[runningEvent.tag];
                }
            }
        }
        // Subclasses can override this to gracefully recover
        // from parse errors if they wish
        _wrapEvent(runningEvent, log, listener) {
            const event = deepCopy$1(log);
            event.removeListener = () => {
                if (!listener) {
                    return;
                }
                runningEvent.removeListener(listener);
                this._checkRunningEvents(runningEvent);
            };
            event.getBlock = () => { return this.provider.getBlock(log.blockHash); };
            event.getTransaction = () => { return this.provider.getTransaction(log.transactionHash); };
            event.getTransactionReceipt = () => { return this.provider.getTransactionReceipt(log.transactionHash); };
            // This may throw if the topics and data mismatch the signature
            runningEvent.prepareEvent(event);
            return event;
        }
        _addEventListener(runningEvent, listener, once) {
            if (!this.provider) {
                logger$a.throwError("events require a provider or a signer with a provider", Logger$1.errors.UNSUPPORTED_OPERATION, { operation: "once" });
            }
            runningEvent.addListener(listener, once);
            // Track this running event and its listeners (may already be there; but no hard in updating)
            this._runningEvents[runningEvent.tag] = runningEvent;
            // If we are not polling the provider, start polling
            if (!this._wrappedEmits[runningEvent.tag]) {
                const wrappedEmit = (log) => {
                    let event = this._wrapEvent(runningEvent, log, listener);
                    // Try to emit the result for the parameterized event...
                    if (event.decodeError == null) {
                        try {
                            const args = runningEvent.getEmit(event);
                            this.emit(runningEvent.filter, ...args);
                        }
                        catch (error) {
                            event.decodeError = error.error;
                        }
                    }
                    // Always emit "event" for fragment-base events
                    if (runningEvent.filter != null) {
                        this.emit("event", event);
                    }
                    // Emit "error" if there was an error
                    if (event.decodeError != null) {
                        this.emit("error", event.decodeError, event);
                    }
                };
                this._wrappedEmits[runningEvent.tag] = wrappedEmit;
                // Special events, like "error" do not have a filter
                if (runningEvent.filter != null) {
                    this.provider.on(runningEvent.filter, wrappedEmit);
                }
            }
        }
        queryFilter(event, fromBlockOrBlockhash, toBlock) {
            const runningEvent = this._getRunningEvent(event);
            const filter = shallowCopy(runningEvent.filter);
            if (typeof (fromBlockOrBlockhash) === "string" && isHexString$1(fromBlockOrBlockhash, 32)) {
                if (toBlock != null) {
                    logger$a.throwArgumentError("cannot specify toBlock with blockhash", "toBlock", toBlock);
                }
                filter.blockHash = fromBlockOrBlockhash;
            }
            else {
                filter.fromBlock = ((fromBlockOrBlockhash != null) ? fromBlockOrBlockhash : 0);
                filter.toBlock = ((toBlock != null) ? toBlock : "latest");
            }
            return this.provider.getLogs(filter).then((logs) => {
                return logs.map((log) => this._wrapEvent(runningEvent, log, null));
            });
        }
        on(event, listener) {
            this._addEventListener(this._getRunningEvent(event), listener, false);
            return this;
        }
        once(event, listener) {
            this._addEventListener(this._getRunningEvent(event), listener, true);
            return this;
        }
        emit(eventName, ...args) {
            if (!this.provider) {
                return false;
            }
            const runningEvent = this._getRunningEvent(eventName);
            const result = (runningEvent.run(args) > 0);
            // May have drained all the "once" events; check for living events
            this._checkRunningEvents(runningEvent);
            return result;
        }
        listenerCount(eventName) {
            if (!this.provider) {
                return 0;
            }
            if (eventName == null) {
                return Object.keys(this._runningEvents).reduce((accum, key) => {
                    return accum + this._runningEvents[key].listenerCount();
                }, 0);
            }
            return this._getRunningEvent(eventName).listenerCount();
        }
        listeners(eventName) {
            if (!this.provider) {
                return [];
            }
            if (eventName == null) {
                const result = [];
                for (let tag in this._runningEvents) {
                    this._runningEvents[tag].listeners().forEach((listener) => {
                        result.push(listener);
                    });
                }
                return result;
            }
            return this._getRunningEvent(eventName).listeners();
        }
        removeAllListeners(eventName) {
            if (!this.provider) {
                return this;
            }
            if (eventName == null) {
                for (const tag in this._runningEvents) {
                    const runningEvent = this._runningEvents[tag];
                    runningEvent.removeAllListeners();
                    this._checkRunningEvents(runningEvent);
                }
                return this;
            }
            // Delete any listeners
            const runningEvent = this._getRunningEvent(eventName);
            runningEvent.removeAllListeners();
            this._checkRunningEvents(runningEvent);
            return this;
        }
        off(eventName, listener) {
            if (!this.provider) {
                return this;
            }
            const runningEvent = this._getRunningEvent(eventName);
            runningEvent.removeListener(listener);
            this._checkRunningEvents(runningEvent);
            return this;
        }
        removeListener(eventName, listener) {
            return this.off(eventName, listener);
        }
    }
    class Contract extends BaseContract {
    }

    const version$6 = "logger/5.7.0";

    let _permanentCensorErrors = false;
    let _censorErrors = false;
    const LogLevels = { debug: 1, "default": 2, info: 2, warning: 3, error: 4, off: 5 };
    let _logLevel = LogLevels["default"];
    let _globalLogger = null;
    function _checkNormalize() {
        try {
            const missing = [];
            // Make sure all forms of normalization are supported
            ["NFD", "NFC", "NFKD", "NFKC"].forEach((form) => {
                try {
                    if ("test".normalize(form) !== "test") {
                        throw new Error("bad normalize");
                    }
                    ;
                }
                catch (error) {
                    missing.push(form);
                }
            });
            if (missing.length) {
                throw new Error("missing " + missing.join(", "));
            }
            if (String.fromCharCode(0xe9).normalize("NFD") !== String.fromCharCode(0x65, 0x0301)) {
                throw new Error("broken implementation");
            }
        }
        catch (error) {
            return error.message;
        }
        return null;
    }
    const _normalizeError = _checkNormalize();
    var LogLevel;
    (function (LogLevel) {
        LogLevel["DEBUG"] = "DEBUG";
        LogLevel["INFO"] = "INFO";
        LogLevel["WARNING"] = "WARNING";
        LogLevel["ERROR"] = "ERROR";
        LogLevel["OFF"] = "OFF";
    })(LogLevel || (LogLevel = {}));
    var ErrorCode;
    (function (ErrorCode) {
        ///////////////////
        // Generic Errors
        // Unknown Error
        ErrorCode["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
        // Not Implemented
        ErrorCode["NOT_IMPLEMENTED"] = "NOT_IMPLEMENTED";
        // Unsupported Operation
        //   - operation
        ErrorCode["UNSUPPORTED_OPERATION"] = "UNSUPPORTED_OPERATION";
        // Network Error (i.e. Ethereum Network, such as an invalid chain ID)
        //   - event ("noNetwork" is not re-thrown in provider.ready; otherwise thrown)
        ErrorCode["NETWORK_ERROR"] = "NETWORK_ERROR";
        // Some sort of bad response from the server
        ErrorCode["SERVER_ERROR"] = "SERVER_ERROR";
        // Timeout
        ErrorCode["TIMEOUT"] = "TIMEOUT";
        ///////////////////
        // Operational  Errors
        // Buffer Overrun
        ErrorCode["BUFFER_OVERRUN"] = "BUFFER_OVERRUN";
        // Numeric Fault
        //   - operation: the operation being executed
        //   - fault: the reason this faulted
        ErrorCode["NUMERIC_FAULT"] = "NUMERIC_FAULT";
        ///////////////////
        // Argument Errors
        // Missing new operator to an object
        //  - name: The name of the class
        ErrorCode["MISSING_NEW"] = "MISSING_NEW";
        // Invalid argument (e.g. value is incompatible with type) to a function:
        //   - argument: The argument name that was invalid
        //   - value: The value of the argument
        ErrorCode["INVALID_ARGUMENT"] = "INVALID_ARGUMENT";
        // Missing argument to a function:
        //   - count: The number of arguments received
        //   - expectedCount: The number of arguments expected
        ErrorCode["MISSING_ARGUMENT"] = "MISSING_ARGUMENT";
        // Too many arguments
        //   - count: The number of arguments received
        //   - expectedCount: The number of arguments expected
        ErrorCode["UNEXPECTED_ARGUMENT"] = "UNEXPECTED_ARGUMENT";
        ///////////////////
        // Blockchain Errors
        // Call exception
        //  - transaction: the transaction
        //  - address?: the contract address
        //  - args?: The arguments passed into the function
        //  - method?: The Solidity method signature
        //  - errorSignature?: The EIP848 error signature
        //  - errorArgs?: The EIP848 error parameters
        //  - reason: The reason (only for EIP848 "Error(string)")
        ErrorCode["CALL_EXCEPTION"] = "CALL_EXCEPTION";
        // Insufficient funds (< value + gasLimit * gasPrice)
        //   - transaction: the transaction attempted
        ErrorCode["INSUFFICIENT_FUNDS"] = "INSUFFICIENT_FUNDS";
        // Nonce has already been used
        //   - transaction: the transaction attempted
        ErrorCode["NONCE_EXPIRED"] = "NONCE_EXPIRED";
        // The replacement fee for the transaction is too low
        //   - transaction: the transaction attempted
        ErrorCode["REPLACEMENT_UNDERPRICED"] = "REPLACEMENT_UNDERPRICED";
        // The gas limit could not be estimated
        //   - transaction: the transaction passed to estimateGas
        ErrorCode["UNPREDICTABLE_GAS_LIMIT"] = "UNPREDICTABLE_GAS_LIMIT";
        // The transaction was replaced by one with a higher gas price
        //   - reason: "cancelled", "replaced" or "repriced"
        //   - cancelled: true if reason == "cancelled" or reason == "replaced")
        //   - hash: original transaction hash
        //   - replacement: the full TransactionsResponse for the replacement
        //   - receipt: the receipt of the replacement
        ErrorCode["TRANSACTION_REPLACED"] = "TRANSACTION_REPLACED";
        ///////////////////
        // Interaction Errors
        // The user rejected the action, such as signing a message or sending
        // a transaction
        ErrorCode["ACTION_REJECTED"] = "ACTION_REJECTED";
    })(ErrorCode || (ErrorCode = {}));
    const HEX = "0123456789abcdef";
    class Logger {
        constructor(version) {
            Object.defineProperty(this, "version", {
                enumerable: true,
                value: version,
                writable: false
            });
        }
        _log(logLevel, args) {
            const level = logLevel.toLowerCase();
            if (LogLevels[level] == null) {
                this.throwArgumentError("invalid log level name", "logLevel", logLevel);
            }
            if (_logLevel > LogLevels[level]) {
                return;
            }
            console.log.apply(console, args);
        }
        debug(...args) {
            this._log(Logger.levels.DEBUG, args);
        }
        info(...args) {
            this._log(Logger.levels.INFO, args);
        }
        warn(...args) {
            this._log(Logger.levels.WARNING, args);
        }
        makeError(message, code, params) {
            // Errors are being censored
            if (_censorErrors) {
                return this.makeError("censored error", code, {});
            }
            if (!code) {
                code = Logger.errors.UNKNOWN_ERROR;
            }
            if (!params) {
                params = {};
            }
            const messageDetails = [];
            Object.keys(params).forEach((key) => {
                const value = params[key];
                try {
                    if (value instanceof Uint8Array) {
                        let hex = "";
                        for (let i = 0; i < value.length; i++) {
                            hex += HEX[value[i] >> 4];
                            hex += HEX[value[i] & 0x0f];
                        }
                        messageDetails.push(key + "=Uint8Array(0x" + hex + ")");
                    }
                    else {
                        messageDetails.push(key + "=" + JSON.stringify(value));
                    }
                }
                catch (error) {
                    messageDetails.push(key + "=" + JSON.stringify(params[key].toString()));
                }
            });
            messageDetails.push(`code=${code}`);
            messageDetails.push(`version=${this.version}`);
            const reason = message;
            let url = "";
            switch (code) {
                case ErrorCode.NUMERIC_FAULT: {
                    url = "NUMERIC_FAULT";
                    const fault = message;
                    switch (fault) {
                        case "overflow":
                        case "underflow":
                        case "division-by-zero":
                            url += "-" + fault;
                            break;
                        case "negative-power":
                        case "negative-width":
                            url += "-unsupported";
                            break;
                        case "unbound-bitwise-result":
                            url += "-unbound-result";
                            break;
                    }
                    break;
                }
                case ErrorCode.CALL_EXCEPTION:
                case ErrorCode.INSUFFICIENT_FUNDS:
                case ErrorCode.MISSING_NEW:
                case ErrorCode.NONCE_EXPIRED:
                case ErrorCode.REPLACEMENT_UNDERPRICED:
                case ErrorCode.TRANSACTION_REPLACED:
                case ErrorCode.UNPREDICTABLE_GAS_LIMIT:
                    url = code;
                    break;
            }
            if (url) {
                message += " [ See: https:/\/links.ethers.org/v5-errors-" + url + " ]";
            }
            if (messageDetails.length) {
                message += " (" + messageDetails.join(", ") + ")";
            }
            // @TODO: Any??
            const error = new Error(message);
            error.reason = reason;
            error.code = code;
            Object.keys(params).forEach(function (key) {
                error[key] = params[key];
            });
            return error;
        }
        throwError(message, code, params) {
            throw this.makeError(message, code, params);
        }
        throwArgumentError(message, name, value) {
            return this.throwError(message, Logger.errors.INVALID_ARGUMENT, {
                argument: name,
                value: value
            });
        }
        assert(condition, message, code, params) {
            if (!!condition) {
                return;
            }
            this.throwError(message, code, params);
        }
        assertArgument(condition, message, name, value) {
            if (!!condition) {
                return;
            }
            this.throwArgumentError(message, name, value);
        }
        checkNormalize(message) {
            if (_normalizeError) {
                this.throwError("platform missing String.prototype.normalize", Logger.errors.UNSUPPORTED_OPERATION, {
                    operation: "String.prototype.normalize", form: _normalizeError
                });
            }
        }
        checkSafeUint53(value, message) {
            if (typeof (value) !== "number") {
                return;
            }
            if (message == null) {
                message = "value not safe";
            }
            if (value < 0 || value >= 0x1fffffffffffff) {
                this.throwError(message, Logger.errors.NUMERIC_FAULT, {
                    operation: "checkSafeInteger",
                    fault: "out-of-safe-range",
                    value: value
                });
            }
            if (value % 1) {
                this.throwError(message, Logger.errors.NUMERIC_FAULT, {
                    operation: "checkSafeInteger",
                    fault: "non-integer",
                    value: value
                });
            }
        }
        checkArgumentCount(count, expectedCount, message) {
            if (message) {
                message = ": " + message;
            }
            else {
                message = "";
            }
            if (count < expectedCount) {
                this.throwError("missing argument" + message, Logger.errors.MISSING_ARGUMENT, {
                    count: count,
                    expectedCount: expectedCount
                });
            }
            if (count > expectedCount) {
                this.throwError("too many arguments" + message, Logger.errors.UNEXPECTED_ARGUMENT, {
                    count: count,
                    expectedCount: expectedCount
                });
            }
        }
        checkNew(target, kind) {
            if (target === Object || target == null) {
                this.throwError("missing new", Logger.errors.MISSING_NEW, { name: kind.name });
            }
        }
        checkAbstract(target, kind) {
            if (target === kind) {
                this.throwError("cannot instantiate abstract class " + JSON.stringify(kind.name) + " directly; use a sub-class", Logger.errors.UNSUPPORTED_OPERATION, { name: target.name, operation: "new" });
            }
            else if (target === Object || target == null) {
                this.throwError("missing new", Logger.errors.MISSING_NEW, { name: kind.name });
            }
        }
        static globalLogger() {
            if (!_globalLogger) {
                _globalLogger = new Logger(version$6);
            }
            return _globalLogger;
        }
        static setCensorship(censorship, permanent) {
            if (!censorship && permanent) {
                this.globalLogger().throwError("cannot permanently disable censorship", Logger.errors.UNSUPPORTED_OPERATION, {
                    operation: "setCensorship"
                });
            }
            if (_permanentCensorErrors) {
                if (!censorship) {
                    return;
                }
                this.globalLogger().throwError("error censorship permanent", Logger.errors.UNSUPPORTED_OPERATION, {
                    operation: "setCensorship"
                });
            }
            _censorErrors = !!censorship;
            _permanentCensorErrors = !!permanent;
        }
        static setLogLevel(logLevel) {
            const level = LogLevels[logLevel.toLowerCase()];
            if (level == null) {
                Logger.globalLogger().warn("invalid log level - " + logLevel);
                return;
            }
            _logLevel = level;
        }
        static from(version) {
            return new Logger(version);
        }
    }
    Logger.errors = ErrorCode;
    Logger.levels = LogLevel;

    const version$5 = "bytes/5.7.0";

    const logger$9 = new Logger(version$5);
    ///////////////////////////////
    function isHexable(value) {
        return !!(value.toHexString);
    }
    function addSlice(array) {
        if (array.slice) {
            return array;
        }
        array.slice = function () {
            const args = Array.prototype.slice.call(arguments);
            return addSlice(new Uint8Array(Array.prototype.slice.apply(array, args)));
        };
        return array;
    }
    function isBytesLike(value) {
        return ((isHexString(value) && !(value.length % 2)) || isBytes(value));
    }
    function isInteger(value) {
        return (typeof (value) === "number" && value == value && (value % 1) === 0);
    }
    function isBytes(value) {
        if (value == null) {
            return false;
        }
        if (value.constructor === Uint8Array) {
            return true;
        }
        if (typeof (value) === "string") {
            return false;
        }
        if (!isInteger(value.length) || value.length < 0) {
            return false;
        }
        for (let i = 0; i < value.length; i++) {
            const v = value[i];
            if (!isInteger(v) || v < 0 || v >= 256) {
                return false;
            }
        }
        return true;
    }
    function arrayify(value, options) {
        if (!options) {
            options = {};
        }
        if (typeof (value) === "number") {
            logger$9.checkSafeUint53(value, "invalid arrayify value");
            const result = [];
            while (value) {
                result.unshift(value & 0xff);
                value = parseInt(String(value / 256));
            }
            if (result.length === 0) {
                result.push(0);
            }
            return addSlice(new Uint8Array(result));
        }
        if (options.allowMissingPrefix && typeof (value) === "string" && value.substring(0, 2) !== "0x") {
            value = "0x" + value;
        }
        if (isHexable(value)) {
            value = value.toHexString();
        }
        if (isHexString(value)) {
            let hex = value.substring(2);
            if (hex.length % 2) {
                if (options.hexPad === "left") {
                    hex = "0" + hex;
                }
                else if (options.hexPad === "right") {
                    hex += "0";
                }
                else {
                    logger$9.throwArgumentError("hex data is odd-length", "value", value);
                }
            }
            const result = [];
            for (let i = 0; i < hex.length; i += 2) {
                result.push(parseInt(hex.substring(i, i + 2), 16));
            }
            return addSlice(new Uint8Array(result));
        }
        if (isBytes(value)) {
            return addSlice(new Uint8Array(value));
        }
        return logger$9.throwArgumentError("invalid arrayify value", "value", value);
    }
    function concat(items) {
        const objects = items.map(item => arrayify(item));
        const length = objects.reduce((accum, item) => (accum + item.length), 0);
        const result = new Uint8Array(length);
        objects.reduce((offset, object) => {
            result.set(object, offset);
            return offset + object.length;
        }, 0);
        return addSlice(result);
    }
    function zeroPad(value, length) {
        value = arrayify(value);
        if (value.length > length) {
            logger$9.throwArgumentError("value out of range", "value", arguments[0]);
        }
        const result = new Uint8Array(length);
        result.set(value, length - value.length);
        return addSlice(result);
    }
    function isHexString(value, length) {
        if (typeof (value) !== "string" || !value.match(/^0x[0-9A-Fa-f]*$/)) {
            return false;
        }
        if (length && value.length !== 2 + 2 * length) {
            return false;
        }
        return true;
    }
    const HexCharacters = "0123456789abcdef";
    function hexlify(value, options) {
        if (!options) {
            options = {};
        }
        if (typeof (value) === "number") {
            logger$9.checkSafeUint53(value, "invalid hexlify value");
            let hex = "";
            while (value) {
                hex = HexCharacters[value & 0xf] + hex;
                value = Math.floor(value / 16);
            }
            if (hex.length) {
                if (hex.length % 2) {
                    hex = "0" + hex;
                }
                return "0x" + hex;
            }
            return "0x00";
        }
        if (typeof (value) === "bigint") {
            value = value.toString(16);
            if (value.length % 2) {
                return ("0x0" + value);
            }
            return "0x" + value;
        }
        if (options.allowMissingPrefix && typeof (value) === "string" && value.substring(0, 2) !== "0x") {
            value = "0x" + value;
        }
        if (isHexable(value)) {
            return value.toHexString();
        }
        if (isHexString(value)) {
            if (value.length % 2) {
                if (options.hexPad === "left") {
                    value = "0x0" + value.substring(2);
                }
                else if (options.hexPad === "right") {
                    value += "0";
                }
                else {
                    logger$9.throwArgumentError("hex data is odd-length", "value", value);
                }
            }
            return value.toLowerCase();
        }
        if (isBytes(value)) {
            let result = "0x";
            for (let i = 0; i < value.length; i++) {
                let v = value[i];
                result += HexCharacters[(v & 0xf0) >> 4] + HexCharacters[v & 0x0f];
            }
            return result;
        }
        return logger$9.throwArgumentError("invalid hexlify value", "value", value);
    }
    function hexDataSlice(data, offset, endOffset) {
        if (typeof (data) !== "string") {
            data = hexlify(data);
        }
        else if (!isHexString(data) || (data.length % 2)) {
            logger$9.throwArgumentError("invalid hexData", "value", data);
        }
        offset = 2 + 2 * offset;
        if (endOffset != null) {
            return "0x" + data.substring(offset, 2 + 2 * endOffset);
        }
        return "0x" + data.substring(offset);
    }
    function hexConcat(items) {
        let result = "0x";
        items.forEach((item) => {
            result += hexlify(item).substring(2);
        });
        return result;
    }
    function hexZeroPad(value, length) {
        if (typeof (value) !== "string") {
            value = hexlify(value);
        }
        else if (!isHexString(value)) {
            logger$9.throwArgumentError("invalid hex string", "value", value);
        }
        if (value.length > 2 * length + 2) {
            logger$9.throwArgumentError("value out of range", "value", arguments[1]);
        }
        while (value.length < 2 * length + 2) {
            value = "0x0" + value.substring(2);
        }
        return value;
    }
    function splitSignature(signature) {
        const result = {
            r: "0x",
            s: "0x",
            _vs: "0x",
            recoveryParam: 0,
            v: 0,
            yParityAndS: "0x",
            compact: "0x"
        };
        if (isBytesLike(signature)) {
            let bytes = arrayify(signature);
            // Get the r, s and v
            if (bytes.length === 64) {
                // EIP-2098; pull the v from the top bit of s and clear it
                result.v = 27 + (bytes[32] >> 7);
                bytes[32] &= 0x7f;
                result.r = hexlify(bytes.slice(0, 32));
                result.s = hexlify(bytes.slice(32, 64));
            }
            else if (bytes.length === 65) {
                result.r = hexlify(bytes.slice(0, 32));
                result.s = hexlify(bytes.slice(32, 64));
                result.v = bytes[64];
            }
            else {
                logger$9.throwArgumentError("invalid signature string", "signature", signature);
            }
            // Allow a recid to be used as the v
            if (result.v < 27) {
                if (result.v === 0 || result.v === 1) {
                    result.v += 27;
                }
                else {
                    logger$9.throwArgumentError("signature invalid v byte", "signature", signature);
                }
            }
            // Compute recoveryParam from v
            result.recoveryParam = 1 - (result.v % 2);
            // Compute _vs from recoveryParam and s
            if (result.recoveryParam) {
                bytes[32] |= 0x80;
            }
            result._vs = hexlify(bytes.slice(32, 64));
        }
        else {
            result.r = signature.r;
            result.s = signature.s;
            result.v = signature.v;
            result.recoveryParam = signature.recoveryParam;
            result._vs = signature._vs;
            // If the _vs is available, use it to populate missing s, v and recoveryParam
            // and verify non-missing s, v and recoveryParam
            if (result._vs != null) {
                const vs = zeroPad(arrayify(result._vs), 32);
                result._vs = hexlify(vs);
                // Set or check the recid
                const recoveryParam = ((vs[0] >= 128) ? 1 : 0);
                if (result.recoveryParam == null) {
                    result.recoveryParam = recoveryParam;
                }
                else if (result.recoveryParam !== recoveryParam) {
                    logger$9.throwArgumentError("signature recoveryParam mismatch _vs", "signature", signature);
                }
                // Set or check the s
                vs[0] &= 0x7f;
                const s = hexlify(vs);
                if (result.s == null) {
                    result.s = s;
                }
                else if (result.s !== s) {
                    logger$9.throwArgumentError("signature v mismatch _vs", "signature", signature);
                }
            }
            // Use recid and v to populate each other
            if (result.recoveryParam == null) {
                if (result.v == null) {
                    logger$9.throwArgumentError("signature missing v and recoveryParam", "signature", signature);
                }
                else if (result.v === 0 || result.v === 1) {
                    result.recoveryParam = result.v;
                }
                else {
                    result.recoveryParam = 1 - (result.v % 2);
                }
            }
            else {
                if (result.v == null) {
                    result.v = 27 + result.recoveryParam;
                }
                else {
                    const recId = (result.v === 0 || result.v === 1) ? result.v : (1 - (result.v % 2));
                    if (result.recoveryParam !== recId) {
                        logger$9.throwArgumentError("signature recoveryParam mismatch v", "signature", signature);
                    }
                }
            }
            if (result.r == null || !isHexString(result.r)) {
                logger$9.throwArgumentError("signature missing or invalid r", "signature", signature);
            }
            else {
                result.r = hexZeroPad(result.r, 32);
            }
            if (result.s == null || !isHexString(result.s)) {
                logger$9.throwArgumentError("signature missing or invalid s", "signature", signature);
            }
            else {
                result.s = hexZeroPad(result.s, 32);
            }
            const vs = arrayify(result.s);
            if (vs[0] >= 128) {
                logger$9.throwArgumentError("signature s out of range", "signature", signature);
            }
            if (result.recoveryParam) {
                vs[0] |= 0x80;
            }
            const _vs = hexlify(vs);
            if (result._vs) {
                if (!isHexString(result._vs)) {
                    logger$9.throwArgumentError("signature invalid _vs", "signature", signature);
                }
                result._vs = hexZeroPad(result._vs, 32);
            }
            // Set or check the _vs
            if (result._vs == null) {
                result._vs = _vs;
            }
            else if (result._vs !== _vs) {
                logger$9.throwArgumentError("signature _vs mismatch v and s", "signature", signature);
            }
        }
        result.yParityAndS = result._vs;
        result.compact = result.r + result.yParityAndS.substring(2);
        return result;
    }

    const version$4 = "bignumber/5.7.0";

    var BN = BN$2.BN;
    const logger$8 = new Logger(version$4);
    const _constructorGuard$1 = {};
    const MAX_SAFE = 0x1fffffffffffff;
    // Only warn about passing 10 into radix once
    let _warnedToStringRadix = false;
    class BigNumber {
        constructor(constructorGuard, hex) {
            if (constructorGuard !== _constructorGuard$1) {
                logger$8.throwError("cannot call constructor directly; use BigNumber.from", Logger.errors.UNSUPPORTED_OPERATION, {
                    operation: "new (BigNumber)"
                });
            }
            this._hex = hex;
            this._isBigNumber = true;
            Object.freeze(this);
        }
        fromTwos(value) {
            return toBigNumber(toBN(this).fromTwos(value));
        }
        toTwos(value) {
            return toBigNumber(toBN(this).toTwos(value));
        }
        abs() {
            if (this._hex[0] === "-") {
                return BigNumber.from(this._hex.substring(1));
            }
            return this;
        }
        add(other) {
            return toBigNumber(toBN(this).add(toBN(other)));
        }
        sub(other) {
            return toBigNumber(toBN(this).sub(toBN(other)));
        }
        div(other) {
            const o = BigNumber.from(other);
            if (o.isZero()) {
                throwFault("division-by-zero", "div");
            }
            return toBigNumber(toBN(this).div(toBN(other)));
        }
        mul(other) {
            return toBigNumber(toBN(this).mul(toBN(other)));
        }
        mod(other) {
            const value = toBN(other);
            if (value.isNeg()) {
                throwFault("division-by-zero", "mod");
            }
            return toBigNumber(toBN(this).umod(value));
        }
        pow(other) {
            const value = toBN(other);
            if (value.isNeg()) {
                throwFault("negative-power", "pow");
            }
            return toBigNumber(toBN(this).pow(value));
        }
        and(other) {
            const value = toBN(other);
            if (this.isNegative() || value.isNeg()) {
                throwFault("unbound-bitwise-result", "and");
            }
            return toBigNumber(toBN(this).and(value));
        }
        or(other) {
            const value = toBN(other);
            if (this.isNegative() || value.isNeg()) {
                throwFault("unbound-bitwise-result", "or");
            }
            return toBigNumber(toBN(this).or(value));
        }
        xor(other) {
            const value = toBN(other);
            if (this.isNegative() || value.isNeg()) {
                throwFault("unbound-bitwise-result", "xor");
            }
            return toBigNumber(toBN(this).xor(value));
        }
        mask(value) {
            if (this.isNegative() || value < 0) {
                throwFault("negative-width", "mask");
            }
            return toBigNumber(toBN(this).maskn(value));
        }
        shl(value) {
            if (this.isNegative() || value < 0) {
                throwFault("negative-width", "shl");
            }
            return toBigNumber(toBN(this).shln(value));
        }
        shr(value) {
            if (this.isNegative() || value < 0) {
                throwFault("negative-width", "shr");
            }
            return toBigNumber(toBN(this).shrn(value));
        }
        eq(other) {
            return toBN(this).eq(toBN(other));
        }
        lt(other) {
            return toBN(this).lt(toBN(other));
        }
        lte(other) {
            return toBN(this).lte(toBN(other));
        }
        gt(other) {
            return toBN(this).gt(toBN(other));
        }
        gte(other) {
            return toBN(this).gte(toBN(other));
        }
        isNegative() {
            return (this._hex[0] === "-");
        }
        isZero() {
            return toBN(this).isZero();
        }
        toNumber() {
            try {
                return toBN(this).toNumber();
            }
            catch (error) {
                throwFault("overflow", "toNumber", this.toString());
            }
            return null;
        }
        toBigInt() {
            try {
                return BigInt(this.toString());
            }
            catch (e) { }
            return logger$8.throwError("this platform does not support BigInt", Logger.errors.UNSUPPORTED_OPERATION, {
                value: this.toString()
            });
        }
        toString() {
            // Lots of people expect this, which we do not support, so check (See: #889)
            if (arguments.length > 0) {
                if (arguments[0] === 10) {
                    if (!_warnedToStringRadix) {
                        _warnedToStringRadix = true;
                        logger$8.warn("BigNumber.toString does not accept any parameters; base-10 is assumed");
                    }
                }
                else if (arguments[0] === 16) {
                    logger$8.throwError("BigNumber.toString does not accept any parameters; use bigNumber.toHexString()", Logger.errors.UNEXPECTED_ARGUMENT, {});
                }
                else {
                    logger$8.throwError("BigNumber.toString does not accept parameters", Logger.errors.UNEXPECTED_ARGUMENT, {});
                }
            }
            return toBN(this).toString(10);
        }
        toHexString() {
            return this._hex;
        }
        toJSON(key) {
            return { type: "BigNumber", hex: this.toHexString() };
        }
        static from(value) {
            if (value instanceof BigNumber) {
                return value;
            }
            if (typeof (value) === "string") {
                if (value.match(/^-?0x[0-9a-f]+$/i)) {
                    return new BigNumber(_constructorGuard$1, toHex(value));
                }
                if (value.match(/^-?[0-9]+$/)) {
                    return new BigNumber(_constructorGuard$1, toHex(new BN(value)));
                }
                return logger$8.throwArgumentError("invalid BigNumber string", "value", value);
            }
            if (typeof (value) === "number") {
                if (value % 1) {
                    throwFault("underflow", "BigNumber.from", value);
                }
                if (value >= MAX_SAFE || value <= -MAX_SAFE) {
                    throwFault("overflow", "BigNumber.from", value);
                }
                return BigNumber.from(String(value));
            }
            const anyValue = value;
            if (typeof (anyValue) === "bigint") {
                return BigNumber.from(anyValue.toString());
            }
            if (isBytes(anyValue)) {
                return BigNumber.from(hexlify(anyValue));
            }
            if (anyValue) {
                // Hexable interface (takes priority)
                if (anyValue.toHexString) {
                    const hex = anyValue.toHexString();
                    if (typeof (hex) === "string") {
                        return BigNumber.from(hex);
                    }
                }
                else {
                    // For now, handle legacy JSON-ified values (goes away in v6)
                    let hex = anyValue._hex;
                    // New-form JSON
                    if (hex == null && anyValue.type === "BigNumber") {
                        hex = anyValue.hex;
                    }
                    if (typeof (hex) === "string") {
                        if (isHexString(hex) || (hex[0] === "-" && isHexString(hex.substring(1)))) {
                            return BigNumber.from(hex);
                        }
                    }
                }
            }
            return logger$8.throwArgumentError("invalid BigNumber value", "value", value);
        }
        static isBigNumber(value) {
            return !!(value && value._isBigNumber);
        }
    }
    // Normalize the hex string
    function toHex(value) {
        // For BN, call on the hex string
        if (typeof (value) !== "string") {
            return toHex(value.toString(16));
        }
        // If negative, prepend the negative sign to the normalized positive value
        if (value[0] === "-") {
            // Strip off the negative sign
            value = value.substring(1);
            // Cannot have multiple negative signs (e.g. "--0x04")
            if (value[0] === "-") {
                logger$8.throwArgumentError("invalid hex", "value", value);
            }
            // Call toHex on the positive component
            value = toHex(value);
            // Do not allow "-0x00"
            if (value === "0x00") {
                return value;
            }
            // Negate the value
            return "-" + value;
        }
        // Add a "0x" prefix if missing
        if (value.substring(0, 2) !== "0x") {
            value = "0x" + value;
        }
        // Normalize zero
        if (value === "0x") {
            return "0x00";
        }
        // Make the string even length
        if (value.length % 2) {
            value = "0x0" + value.substring(2);
        }
        // Trim to smallest even-length string
        while (value.length > 4 && value.substring(0, 4) === "0x00") {
            value = "0x" + value.substring(4);
        }
        return value;
    }
    function toBigNumber(value) {
        return BigNumber.from(toHex(value));
    }
    function toBN(value) {
        const hex = BigNumber.from(value).toHexString();
        if (hex[0] === "-") {
            return (new BN("-" + hex.substring(3), 16));
        }
        return new BN(hex.substring(2), 16);
    }
    function throwFault(fault, operation, value) {
        const params = { fault: fault, operation: operation };
        if (value != null) {
            params.value = value;
        }
        return logger$8.throwError(fault, Logger.errors.NUMERIC_FAULT, params);
    }
    // value should have no prefix
    function _base36To16(value) {
        return (new BN(value, 36)).toString(16);
    }

    const version$3 = "properties/5.7.0";

    (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    const logger$7 = new Logger(version$3);
    function defineReadOnly(object, name, value) {
        Object.defineProperty(object, name, {
            enumerable: true,
            value: value,
            writable: false,
        });
    }
    // Crawl up the constructor chain to find a static method
    function getStatic(ctor, key) {
        for (let i = 0; i < 32; i++) {
            if (ctor[key]) {
                return ctor[key];
            }
            if (!ctor.prototype || typeof (ctor.prototype) !== "object") {
                break;
            }
            ctor = Object.getPrototypeOf(ctor.prototype).constructor;
        }
        return null;
    }
    const opaque = { bigint: true, boolean: true, "function": true, number: true, string: true };
    function _isFrozen(object) {
        // Opaque objects are not mutable, so safe to copy by assignment
        if (object === undefined || object === null || opaque[typeof (object)]) {
            return true;
        }
        if (Array.isArray(object) || typeof (object) === "object") {
            if (!Object.isFrozen(object)) {
                return false;
            }
            const keys = Object.keys(object);
            for (let i = 0; i < keys.length; i++) {
                let value = null;
                try {
                    value = object[keys[i]];
                }
                catch (error) {
                    // If accessing a value triggers an error, it is a getter
                    // designed to do so (e.g. Result) and is therefore "frozen"
                    continue;
                }
                if (!_isFrozen(value)) {
                    return false;
                }
            }
            return true;
        }
        return logger$7.throwArgumentError(`Cannot deepCopy ${typeof (object)}`, "object", object);
    }
    // Returns a new copy of object, such that no properties may be replaced.
    // New properties may be added only to objects.
    function _deepCopy(object) {
        if (_isFrozen(object)) {
            return object;
        }
        // Arrays are mutable, so we need to create a copy
        if (Array.isArray(object)) {
            return Object.freeze(object.map((item) => deepCopy(item)));
        }
        if (typeof (object) === "object") {
            const result = {};
            for (const key in object) {
                const value = object[key];
                if (value === undefined) {
                    continue;
                }
                defineReadOnly(result, key, deepCopy(value));
            }
            return result;
        }
        return logger$7.throwArgumentError(`Cannot deepCopy ${typeof (object)}`, "object", object);
    }
    function deepCopy(object) {
        return _deepCopy(object);
    }
    class Description {
        constructor(info) {
            for (const key in info) {
                this[key] = deepCopy(info[key]);
            }
        }
    }

    const NegativeOne = ( /*#__PURE__*/BigNumber.from(-1));
    const Zero = ( /*#__PURE__*/BigNumber.from(0));
    const One = ( /*#__PURE__*/BigNumber.from(1));
    const MaxUint256 = ( /*#__PURE__*/BigNumber.from("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"));

    function keccak256(data) {
        return '0x' + sha3.keccak_256(arrayify(data));
    }

    const version$2 = "strings/5.7.0";

    const logger$6 = new Logger(version$2);
    ///////////////////////////////
    var UnicodeNormalizationForm;
    (function (UnicodeNormalizationForm) {
        UnicodeNormalizationForm["current"] = "";
        UnicodeNormalizationForm["NFC"] = "NFC";
        UnicodeNormalizationForm["NFD"] = "NFD";
        UnicodeNormalizationForm["NFKC"] = "NFKC";
        UnicodeNormalizationForm["NFKD"] = "NFKD";
    })(UnicodeNormalizationForm || (UnicodeNormalizationForm = {}));
    var Utf8ErrorReason;
    (function (Utf8ErrorReason) {
        // A continuation byte was present where there was nothing to continue
        // - offset = the index the codepoint began in
        Utf8ErrorReason["UNEXPECTED_CONTINUE"] = "unexpected continuation byte";
        // An invalid (non-continuation) byte to start a UTF-8 codepoint was found
        // - offset = the index the codepoint began in
        Utf8ErrorReason["BAD_PREFIX"] = "bad codepoint prefix";
        // The string is too short to process the expected codepoint
        // - offset = the index the codepoint began in
        Utf8ErrorReason["OVERRUN"] = "string overrun";
        // A missing continuation byte was expected but not found
        // - offset = the index the continuation byte was expected at
        Utf8ErrorReason["MISSING_CONTINUE"] = "missing continuation byte";
        // The computed code point is outside the range for UTF-8
        // - offset       = start of this codepoint
        // - badCodepoint = the computed codepoint; outside the UTF-8 range
        Utf8ErrorReason["OUT_OF_RANGE"] = "out of UTF-8 range";
        // UTF-8 strings may not contain UTF-16 surrogate pairs
        // - offset       = start of this codepoint
        // - badCodepoint = the computed codepoint; inside the UTF-16 surrogate range
        Utf8ErrorReason["UTF16_SURROGATE"] = "UTF-16 surrogate";
        // The string is an overlong representation
        // - offset       = start of this codepoint
        // - badCodepoint = the computed codepoint; already bounds checked
        Utf8ErrorReason["OVERLONG"] = "overlong representation";
    })(Utf8ErrorReason || (Utf8ErrorReason = {}));
    function errorFunc(reason, offset, bytes, output, badCodepoint) {
        return logger$6.throwArgumentError(`invalid codepoint at offset ${offset}; ${reason}`, "bytes", bytes);
    }
    function ignoreFunc(reason, offset, bytes, output, badCodepoint) {
        // If there is an invalid prefix (including stray continuation), skip any additional continuation bytes
        if (reason === Utf8ErrorReason.BAD_PREFIX || reason === Utf8ErrorReason.UNEXPECTED_CONTINUE) {
            let i = 0;
            for (let o = offset + 1; o < bytes.length; o++) {
                if (bytes[o] >> 6 !== 0x02) {
                    break;
                }
                i++;
            }
            return i;
        }
        // This byte runs us past the end of the string, so just jump to the end
        // (but the first byte was read already read and therefore skipped)
        if (reason === Utf8ErrorReason.OVERRUN) {
            return bytes.length - offset - 1;
        }
        // Nothing to skip
        return 0;
    }
    function replaceFunc(reason, offset, bytes, output, badCodepoint) {
        // Overlong representations are otherwise "valid" code points; just non-deistingtished
        if (reason === Utf8ErrorReason.OVERLONG) {
            output.push(badCodepoint);
            return 0;
        }
        // Put the replacement character into the output
        output.push(0xfffd);
        // Otherwise, process as if ignoring errors
        return ignoreFunc(reason, offset, bytes);
    }
    // Common error handing strategies
    const Utf8ErrorFuncs = Object.freeze({
        error: errorFunc,
        ignore: ignoreFunc,
        replace: replaceFunc
    });
    // http://stackoverflow.com/questions/13356493/decode-utf-8-with-javascript#13691499
    function getUtf8CodePoints(bytes, onError) {
        if (onError == null) {
            onError = Utf8ErrorFuncs.error;
        }
        bytes = arrayify(bytes);
        const result = [];
        let i = 0;
        // Invalid bytes are ignored
        while (i < bytes.length) {
            const c = bytes[i++];
            // 0xxx xxxx
            if (c >> 7 === 0) {
                result.push(c);
                continue;
            }
            // Multibyte; how many bytes left for this character?
            let extraLength = null;
            let overlongMask = null;
            // 110x xxxx 10xx xxxx
            if ((c & 0xe0) === 0xc0) {
                extraLength = 1;
                overlongMask = 0x7f;
                // 1110 xxxx 10xx xxxx 10xx xxxx
            }
            else if ((c & 0xf0) === 0xe0) {
                extraLength = 2;
                overlongMask = 0x7ff;
                // 1111 0xxx 10xx xxxx 10xx xxxx 10xx xxxx
            }
            else if ((c & 0xf8) === 0xf0) {
                extraLength = 3;
                overlongMask = 0xffff;
            }
            else {
                if ((c & 0xc0) === 0x80) {
                    i += onError(Utf8ErrorReason.UNEXPECTED_CONTINUE, i - 1, bytes, result);
                }
                else {
                    i += onError(Utf8ErrorReason.BAD_PREFIX, i - 1, bytes, result);
                }
                continue;
            }
            // Do we have enough bytes in our data?
            if (i - 1 + extraLength >= bytes.length) {
                i += onError(Utf8ErrorReason.OVERRUN, i - 1, bytes, result);
                continue;
            }
            // Remove the length prefix from the char
            let res = c & ((1 << (8 - extraLength - 1)) - 1);
            for (let j = 0; j < extraLength; j++) {
                let nextChar = bytes[i];
                // Invalid continuation byte
                if ((nextChar & 0xc0) != 0x80) {
                    i += onError(Utf8ErrorReason.MISSING_CONTINUE, i, bytes, result);
                    res = null;
                    break;
                }
                res = (res << 6) | (nextChar & 0x3f);
                i++;
            }
            // See above loop for invalid continuation byte
            if (res === null) {
                continue;
            }
            // Maximum code point
            if (res > 0x10ffff) {
                i += onError(Utf8ErrorReason.OUT_OF_RANGE, i - 1 - extraLength, bytes, result, res);
                continue;
            }
            // Reserved for UTF-16 surrogate halves
            if (res >= 0xd800 && res <= 0xdfff) {
                i += onError(Utf8ErrorReason.UTF16_SURROGATE, i - 1 - extraLength, bytes, result, res);
                continue;
            }
            // Check for overlong sequences (more bytes than needed)
            if (res <= overlongMask) {
                i += onError(Utf8ErrorReason.OVERLONG, i - 1 - extraLength, bytes, result, res);
                continue;
            }
            result.push(res);
        }
        return result;
    }
    // http://stackoverflow.com/questions/18729405/how-to-convert-utf8-string-to-byte-array
    function toUtf8Bytes(str, form = UnicodeNormalizationForm.current) {
        if (form != UnicodeNormalizationForm.current) {
            logger$6.checkNormalize();
            str = str.normalize(form);
        }
        let result = [];
        for (let i = 0; i < str.length; i++) {
            const c = str.charCodeAt(i);
            if (c < 0x80) {
                result.push(c);
            }
            else if (c < 0x800) {
                result.push((c >> 6) | 0xc0);
                result.push((c & 0x3f) | 0x80);
            }
            else if ((c & 0xfc00) == 0xd800) {
                i++;
                const c2 = str.charCodeAt(i);
                if (i >= str.length || (c2 & 0xfc00) !== 0xdc00) {
                    throw new Error("invalid utf-8 string");
                }
                // Surrogate Pair
                const pair = 0x10000 + ((c & 0x03ff) << 10) + (c2 & 0x03ff);
                result.push((pair >> 18) | 0xf0);
                result.push(((pair >> 12) & 0x3f) | 0x80);
                result.push(((pair >> 6) & 0x3f) | 0x80);
                result.push((pair & 0x3f) | 0x80);
            }
            else {
                result.push((c >> 12) | 0xe0);
                result.push(((c >> 6) & 0x3f) | 0x80);
                result.push((c & 0x3f) | 0x80);
            }
        }
        return arrayify(result);
    }
    function _toUtf8String(codePoints) {
        return codePoints.map((codePoint) => {
            if (codePoint <= 0xffff) {
                return String.fromCharCode(codePoint);
            }
            codePoint -= 0x10000;
            return String.fromCharCode((((codePoint >> 10) & 0x3ff) + 0xd800), ((codePoint & 0x3ff) + 0xdc00));
        }).join("");
    }
    function toUtf8String(bytes, onError) {
        return _toUtf8String(getUtf8CodePoints(bytes, onError));
    }

    function id(text) {
        return keccak256(toUtf8Bytes(text));
    }

    const version$1 = "address/5.7.0";

    const logger$5 = new Logger(version$1);
    function getChecksumAddress(address) {
        if (!isHexString(address, 20)) {
            logger$5.throwArgumentError("invalid address", "address", address);
        }
        address = address.toLowerCase();
        const chars = address.substring(2).split("");
        const expanded = new Uint8Array(40);
        for (let i = 0; i < 40; i++) {
            expanded[i] = chars[i].charCodeAt(0);
        }
        const hashed = arrayify(keccak256(expanded));
        for (let i = 0; i < 40; i += 2) {
            if ((hashed[i >> 1] >> 4) >= 8) {
                chars[i] = chars[i].toUpperCase();
            }
            if ((hashed[i >> 1] & 0x0f) >= 8) {
                chars[i + 1] = chars[i + 1].toUpperCase();
            }
        }
        return "0x" + chars.join("");
    }
    // Shims for environments that are missing some required constants and functions
    const MAX_SAFE_INTEGER = 0x1fffffffffffff;
    function log10(x) {
        if (Math.log10) {
            return Math.log10(x);
        }
        return Math.log(x) / Math.LN10;
    }
    // See: https://en.wikipedia.org/wiki/International_Bank_Account_Number
    // Create lookup table
    const ibanLookup = {};
    for (let i = 0; i < 10; i++) {
        ibanLookup[String(i)] = String(i);
    }
    for (let i = 0; i < 26; i++) {
        ibanLookup[String.fromCharCode(65 + i)] = String(10 + i);
    }
    // How many decimal digits can we process? (for 64-bit float, this is 15)
    const safeDigits = Math.floor(log10(MAX_SAFE_INTEGER));
    function ibanChecksum(address) {
        address = address.toUpperCase();
        address = address.substring(4) + address.substring(0, 2) + "00";
        let expanded = address.split("").map((c) => { return ibanLookup[c]; }).join("");
        // Javascript can handle integers safely up to 15 (decimal) digits
        while (expanded.length >= safeDigits) {
            let block = expanded.substring(0, safeDigits);
            expanded = parseInt(block, 10) % 97 + expanded.substring(block.length);
        }
        let checksum = String(98 - (parseInt(expanded, 10) % 97));
        while (checksum.length < 2) {
            checksum = "0" + checksum;
        }
        return checksum;
    }
    function getAddress(address) {
        let result = null;
        if (typeof (address) !== "string") {
            logger$5.throwArgumentError("invalid address", "address", address);
        }
        if (address.match(/^(0x)?[0-9a-fA-F]{40}$/)) {
            // Missing the 0x prefix
            if (address.substring(0, 2) !== "0x") {
                address = "0x" + address;
            }
            result = getChecksumAddress(address);
            // It is a checksummed address with a bad checksum
            if (address.match(/([A-F].*[a-f])|([a-f].*[A-F])/) && result !== address) {
                logger$5.throwArgumentError("bad address checksum", "address", address);
            }
            // Maybe ICAP? (we only support direct mode)
        }
        else if (address.match(/^XE[0-9]{2}[0-9A-Za-z]{30,31}$/)) {
            // It is an ICAP address with a bad checksum
            if (address.substring(2, 4) !== ibanChecksum(address)) {
                logger$5.throwArgumentError("bad icap checksum", "address", address);
            }
            result = _base36To16(address.substring(4));
            while (result.length < 40) {
                result = "0" + result;
            }
            result = getChecksumAddress("0x" + result);
        }
        else {
            logger$5.throwArgumentError("invalid address", "address", address);
        }
        return result;
    }

    const version = "abi/5.7.0";

    const logger$4 = new Logger(version);
    const _constructorGuard = {};
    let ModifiersBytes = { calldata: true, memory: true, storage: true };
    let ModifiersNest = { calldata: true, memory: true };
    function checkModifier(type, name) {
        if (type === "bytes" || type === "string") {
            if (ModifiersBytes[name]) {
                return true;
            }
        }
        else if (type === "address") {
            if (name === "payable") {
                return true;
            }
        }
        else if (type.indexOf("[") >= 0 || type === "tuple") {
            if (ModifiersNest[name]) {
                return true;
            }
        }
        if (ModifiersBytes[name] || name === "payable") {
            logger$4.throwArgumentError("invalid modifier", "name", name);
        }
        return false;
    }
    // @TODO: Make sure that children of an indexed tuple are marked with a null indexed
    function parseParamType(param, allowIndexed) {
        let originalParam = param;
        function throwError(i) {
            logger$4.throwArgumentError(`unexpected character at position ${i}`, "param", param);
        }
        param = param.replace(/\s/g, " ");
        function newNode(parent) {
            let node = { type: "", name: "", parent: parent, state: { allowType: true } };
            if (allowIndexed) {
                node.indexed = false;
            }
            return node;
        }
        let parent = { type: "", name: "", state: { allowType: true } };
        let node = parent;
        for (let i = 0; i < param.length; i++) {
            let c = param[i];
            switch (c) {
                case "(":
                    if (node.state.allowType && node.type === "") {
                        node.type = "tuple";
                    }
                    else if (!node.state.allowParams) {
                        throwError(i);
                    }
                    node.state.allowType = false;
                    node.type = verifyType(node.type);
                    node.components = [newNode(node)];
                    node = node.components[0];
                    break;
                case ")":
                    delete node.state;
                    if (node.name === "indexed") {
                        if (!allowIndexed) {
                            throwError(i);
                        }
                        node.indexed = true;
                        node.name = "";
                    }
                    if (checkModifier(node.type, node.name)) {
                        node.name = "";
                    }
                    node.type = verifyType(node.type);
                    let child = node;
                    node = node.parent;
                    if (!node) {
                        throwError(i);
                    }
                    delete child.parent;
                    node.state.allowParams = false;
                    node.state.allowName = true;
                    node.state.allowArray = true;
                    break;
                case ",":
                    delete node.state;
                    if (node.name === "indexed") {
                        if (!allowIndexed) {
                            throwError(i);
                        }
                        node.indexed = true;
                        node.name = "";
                    }
                    if (checkModifier(node.type, node.name)) {
                        node.name = "";
                    }
                    node.type = verifyType(node.type);
                    let sibling = newNode(node.parent);
                    //{ type: "", name: "", parent: node.parent, state: { allowType: true } };
                    node.parent.components.push(sibling);
                    delete node.parent;
                    node = sibling;
                    break;
                // Hit a space...
                case " ":
                    // If reading type, the type is done and may read a param or name
                    if (node.state.allowType) {
                        if (node.type !== "") {
                            node.type = verifyType(node.type);
                            delete node.state.allowType;
                            node.state.allowName = true;
                            node.state.allowParams = true;
                        }
                    }
                    // If reading name, the name is done
                    if (node.state.allowName) {
                        if (node.name !== "") {
                            if (node.name === "indexed") {
                                if (!allowIndexed) {
                                    throwError(i);
                                }
                                if (node.indexed) {
                                    throwError(i);
                                }
                                node.indexed = true;
                                node.name = "";
                            }
                            else if (checkModifier(node.type, node.name)) {
                                node.name = "";
                            }
                            else {
                                node.state.allowName = false;
                            }
                        }
                    }
                    break;
                case "[":
                    if (!node.state.allowArray) {
                        throwError(i);
                    }
                    node.type += c;
                    node.state.allowArray = false;
                    node.state.allowName = false;
                    node.state.readArray = true;
                    break;
                case "]":
                    if (!node.state.readArray) {
                        throwError(i);
                    }
                    node.type += c;
                    node.state.readArray = false;
                    node.state.allowArray = true;
                    node.state.allowName = true;
                    break;
                default:
                    if (node.state.allowType) {
                        node.type += c;
                        node.state.allowParams = true;
                        node.state.allowArray = true;
                    }
                    else if (node.state.allowName) {
                        node.name += c;
                        delete node.state.allowArray;
                    }
                    else if (node.state.readArray) {
                        node.type += c;
                    }
                    else {
                        throwError(i);
                    }
            }
        }
        if (node.parent) {
            logger$4.throwArgumentError("unexpected eof", "param", param);
        }
        delete parent.state;
        if (node.name === "indexed") {
            if (!allowIndexed) {
                throwError(originalParam.length - 7);
            }
            if (node.indexed) {
                throwError(originalParam.length - 7);
            }
            node.indexed = true;
            node.name = "";
        }
        else if (checkModifier(node.type, node.name)) {
            node.name = "";
        }
        parent.type = verifyType(parent.type);
        return parent;
    }
    function populate(object, params) {
        for (let key in params) {
            defineReadOnly(object, key, params[key]);
        }
    }
    const FormatTypes = Object.freeze({
        // Bare formatting, as is needed for computing a sighash of an event or function
        sighash: "sighash",
        // Human-Readable with Minimal spacing and without names (compact human-readable)
        minimal: "minimal",
        // Human-Readable with nice spacing, including all names
        full: "full",
        // JSON-format a la Solidity
        json: "json"
    });
    const paramTypeArray = new RegExp(/^(.*)\[([0-9]*)\]$/);
    class ParamType {
        constructor(constructorGuard, params) {
            if (constructorGuard !== _constructorGuard) {
                logger$4.throwError("use fromString", Logger.errors.UNSUPPORTED_OPERATION, {
                    operation: "new ParamType()"
                });
            }
            populate(this, params);
            let match = this.type.match(paramTypeArray);
            if (match) {
                populate(this, {
                    arrayLength: parseInt(match[2] || "-1"),
                    arrayChildren: ParamType.fromObject({
                        type: match[1],
                        components: this.components
                    }),
                    baseType: "array"
                });
            }
            else {
                populate(this, {
                    arrayLength: null,
                    arrayChildren: null,
                    baseType: ((this.components != null) ? "tuple" : this.type)
                });
            }
            this._isParamType = true;
            Object.freeze(this);
        }
        // Format the parameter fragment
        //   - sighash: "(uint256,address)"
        //   - minimal: "tuple(uint256,address) indexed"
        //   - full:    "tuple(uint256 foo, address bar) indexed baz"
        format(format) {
            if (!format) {
                format = FormatTypes.sighash;
            }
            if (!FormatTypes[format]) {
                logger$4.throwArgumentError("invalid format type", "format", format);
            }
            if (format === FormatTypes.json) {
                let result = {
                    type: ((this.baseType === "tuple") ? "tuple" : this.type),
                    name: (this.name || undefined)
                };
                if (typeof (this.indexed) === "boolean") {
                    result.indexed = this.indexed;
                }
                if (this.components) {
                    result.components = this.components.map((comp) => JSON.parse(comp.format(format)));
                }
                return JSON.stringify(result);
            }
            let result = "";
            // Array
            if (this.baseType === "array") {
                result += this.arrayChildren.format(format);
                result += "[" + (this.arrayLength < 0 ? "" : String(this.arrayLength)) + "]";
            }
            else {
                if (this.baseType === "tuple") {
                    if (format !== FormatTypes.sighash) {
                        result += this.type;
                    }
                    result += "(" + this.components.map((comp) => comp.format(format)).join((format === FormatTypes.full) ? ", " : ",") + ")";
                }
                else {
                    result += this.type;
                }
            }
            if (format !== FormatTypes.sighash) {
                if (this.indexed === true) {
                    result += " indexed";
                }
                if (format === FormatTypes.full && this.name) {
                    result += " " + this.name;
                }
            }
            return result;
        }
        static from(value, allowIndexed) {
            if (typeof (value) === "string") {
                return ParamType.fromString(value, allowIndexed);
            }
            return ParamType.fromObject(value);
        }
        static fromObject(value) {
            if (ParamType.isParamType(value)) {
                return value;
            }
            return new ParamType(_constructorGuard, {
                name: (value.name || null),
                type: verifyType(value.type),
                indexed: ((value.indexed == null) ? null : !!value.indexed),
                components: (value.components ? value.components.map(ParamType.fromObject) : null)
            });
        }
        static fromString(value, allowIndexed) {
            function ParamTypify(node) {
                return ParamType.fromObject({
                    name: node.name,
                    type: node.type,
                    indexed: node.indexed,
                    components: node.components
                });
            }
            return ParamTypify(parseParamType(value, !!allowIndexed));
        }
        static isParamType(value) {
            return !!(value != null && value._isParamType);
        }
    }
    function parseParams(value, allowIndex) {
        return splitNesting(value).map((param) => ParamType.fromString(param, allowIndex));
    }
    class Fragment {
        constructor(constructorGuard, params) {
            if (constructorGuard !== _constructorGuard) {
                logger$4.throwError("use a static from method", Logger.errors.UNSUPPORTED_OPERATION, {
                    operation: "new Fragment()"
                });
            }
            populate(this, params);
            this._isFragment = true;
            Object.freeze(this);
        }
        static from(value) {
            if (Fragment.isFragment(value)) {
                return value;
            }
            if (typeof (value) === "string") {
                return Fragment.fromString(value);
            }
            return Fragment.fromObject(value);
        }
        static fromObject(value) {
            if (Fragment.isFragment(value)) {
                return value;
            }
            switch (value.type) {
                case "function":
                    return FunctionFragment.fromObject(value);
                case "event":
                    return EventFragment.fromObject(value);
                case "constructor":
                    return ConstructorFragment.fromObject(value);
                case "error":
                    return ErrorFragment.fromObject(value);
                case "fallback":
                case "receive":
                    // @TODO: Something? Maybe return a FunctionFragment? A custom DefaultFunctionFragment?
                    return null;
            }
            return logger$4.throwArgumentError("invalid fragment object", "value", value);
        }
        static fromString(value) {
            // Make sure the "returns" is surrounded by a space and all whitespace is exactly one space
            value = value.replace(/\s/g, " ");
            value = value.replace(/\(/g, " (").replace(/\)/g, ") ").replace(/\s+/g, " ");
            value = value.trim();
            if (value.split(" ")[0] === "event") {
                return EventFragment.fromString(value.substring(5).trim());
            }
            else if (value.split(" ")[0] === "function") {
                return FunctionFragment.fromString(value.substring(8).trim());
            }
            else if (value.split("(")[0].trim() === "constructor") {
                return ConstructorFragment.fromString(value.trim());
            }
            else if (value.split(" ")[0] === "error") {
                return ErrorFragment.fromString(value.substring(5).trim());
            }
            return logger$4.throwArgumentError("unsupported fragment", "value", value);
        }
        static isFragment(value) {
            return !!(value && value._isFragment);
        }
    }
    class EventFragment extends Fragment {
        format(format) {
            if (!format) {
                format = FormatTypes.sighash;
            }
            if (!FormatTypes[format]) {
                logger$4.throwArgumentError("invalid format type", "format", format);
            }
            if (format === FormatTypes.json) {
                return JSON.stringify({
                    type: "event",
                    anonymous: this.anonymous,
                    name: this.name,
                    inputs: this.inputs.map((input) => JSON.parse(input.format(format)))
                });
            }
            let result = "";
            if (format !== FormatTypes.sighash) {
                result += "event ";
            }
            result += this.name + "(" + this.inputs.map((input) => input.format(format)).join((format === FormatTypes.full) ? ", " : ",") + ") ";
            if (format !== FormatTypes.sighash) {
                if (this.anonymous) {
                    result += "anonymous ";
                }
            }
            return result.trim();
        }
        static from(value) {
            if (typeof (value) === "string") {
                return EventFragment.fromString(value);
            }
            return EventFragment.fromObject(value);
        }
        static fromObject(value) {
            if (EventFragment.isEventFragment(value)) {
                return value;
            }
            if (value.type !== "event") {
                logger$4.throwArgumentError("invalid event object", "value", value);
            }
            const params = {
                name: verifyIdentifier(value.name),
                anonymous: value.anonymous,
                inputs: (value.inputs ? value.inputs.map(ParamType.fromObject) : []),
                type: "event"
            };
            return new EventFragment(_constructorGuard, params);
        }
        static fromString(value) {
            let match = value.match(regexParen);
            if (!match) {
                logger$4.throwArgumentError("invalid event string", "value", value);
            }
            let anonymous = false;
            match[3].split(" ").forEach((modifier) => {
                switch (modifier.trim()) {
                    case "anonymous":
                        anonymous = true;
                        break;
                    case "":
                        break;
                    default:
                        logger$4.warn("unknown modifier: " + modifier);
                }
            });
            return EventFragment.fromObject({
                name: match[1].trim(),
                anonymous: anonymous,
                inputs: parseParams(match[2], true),
                type: "event"
            });
        }
        static isEventFragment(value) {
            return (value && value._isFragment && value.type === "event");
        }
    }
    function parseGas(value, params) {
        params.gas = null;
        let comps = value.split("@");
        if (comps.length !== 1) {
            if (comps.length > 2) {
                logger$4.throwArgumentError("invalid human-readable ABI signature", "value", value);
            }
            if (!comps[1].match(/^[0-9]+$/)) {
                logger$4.throwArgumentError("invalid human-readable ABI signature gas", "value", value);
            }
            params.gas = BigNumber.from(comps[1]);
            return comps[0];
        }
        return value;
    }
    function parseModifiers(value, params) {
        params.constant = false;
        params.payable = false;
        params.stateMutability = "nonpayable";
        value.split(" ").forEach((modifier) => {
            switch (modifier.trim()) {
                case "constant":
                    params.constant = true;
                    break;
                case "payable":
                    params.payable = true;
                    params.stateMutability = "payable";
                    break;
                case "nonpayable":
                    params.payable = false;
                    params.stateMutability = "nonpayable";
                    break;
                case "pure":
                    params.constant = true;
                    params.stateMutability = "pure";
                    break;
                case "view":
                    params.constant = true;
                    params.stateMutability = "view";
                    break;
                case "external":
                case "public":
                case "":
                    break;
                default:
                    console.log("unknown modifier: " + modifier);
            }
        });
    }
    function verifyState(value) {
        let result = {
            constant: false,
            payable: true,
            stateMutability: "payable"
        };
        if (value.stateMutability != null) {
            result.stateMutability = value.stateMutability;
            // Set (and check things are consistent) the constant property
            result.constant = (result.stateMutability === "view" || result.stateMutability === "pure");
            if (value.constant != null) {
                if ((!!value.constant) !== result.constant) {
                    logger$4.throwArgumentError("cannot have constant function with mutability " + result.stateMutability, "value", value);
                }
            }
            // Set (and check things are consistent) the payable property
            result.payable = (result.stateMutability === "payable");
            if (value.payable != null) {
                if ((!!value.payable) !== result.payable) {
                    logger$4.throwArgumentError("cannot have payable function with mutability " + result.stateMutability, "value", value);
                }
            }
        }
        else if (value.payable != null) {
            result.payable = !!value.payable;
            // If payable we can assume non-constant; otherwise we can't assume
            if (value.constant == null && !result.payable && value.type !== "constructor") {
                logger$4.throwArgumentError("unable to determine stateMutability", "value", value);
            }
            result.constant = !!value.constant;
            if (result.constant) {
                result.stateMutability = "view";
            }
            else {
                result.stateMutability = (result.payable ? "payable" : "nonpayable");
            }
            if (result.payable && result.constant) {
                logger$4.throwArgumentError("cannot have constant payable function", "value", value);
            }
        }
        else if (value.constant != null) {
            result.constant = !!value.constant;
            result.payable = !result.constant;
            result.stateMutability = (result.constant ? "view" : "payable");
        }
        else if (value.type !== "constructor") {
            logger$4.throwArgumentError("unable to determine stateMutability", "value", value);
        }
        return result;
    }
    class ConstructorFragment extends Fragment {
        format(format) {
            if (!format) {
                format = FormatTypes.sighash;
            }
            if (!FormatTypes[format]) {
                logger$4.throwArgumentError("invalid format type", "format", format);
            }
            if (format === FormatTypes.json) {
                return JSON.stringify({
                    type: "constructor",
                    stateMutability: ((this.stateMutability !== "nonpayable") ? this.stateMutability : undefined),
                    payable: this.payable,
                    gas: (this.gas ? this.gas.toNumber() : undefined),
                    inputs: this.inputs.map((input) => JSON.parse(input.format(format)))
                });
            }
            if (format === FormatTypes.sighash) {
                logger$4.throwError("cannot format a constructor for sighash", Logger.errors.UNSUPPORTED_OPERATION, {
                    operation: "format(sighash)"
                });
            }
            let result = "constructor(" + this.inputs.map((input) => input.format(format)).join((format === FormatTypes.full) ? ", " : ",") + ") ";
            if (this.stateMutability && this.stateMutability !== "nonpayable") {
                result += this.stateMutability + " ";
            }
            return result.trim();
        }
        static from(value) {
            if (typeof (value) === "string") {
                return ConstructorFragment.fromString(value);
            }
            return ConstructorFragment.fromObject(value);
        }
        static fromObject(value) {
            if (ConstructorFragment.isConstructorFragment(value)) {
                return value;
            }
            if (value.type !== "constructor") {
                logger$4.throwArgumentError("invalid constructor object", "value", value);
            }
            let state = verifyState(value);
            if (state.constant) {
                logger$4.throwArgumentError("constructor cannot be constant", "value", value);
            }
            const params = {
                name: null,
                type: value.type,
                inputs: (value.inputs ? value.inputs.map(ParamType.fromObject) : []),
                payable: state.payable,
                stateMutability: state.stateMutability,
                gas: (value.gas ? BigNumber.from(value.gas) : null)
            };
            return new ConstructorFragment(_constructorGuard, params);
        }
        static fromString(value) {
            let params = { type: "constructor" };
            value = parseGas(value, params);
            let parens = value.match(regexParen);
            if (!parens || parens[1].trim() !== "constructor") {
                logger$4.throwArgumentError("invalid constructor string", "value", value);
            }
            params.inputs = parseParams(parens[2].trim(), false);
            parseModifiers(parens[3].trim(), params);
            return ConstructorFragment.fromObject(params);
        }
        static isConstructorFragment(value) {
            return (value && value._isFragment && value.type === "constructor");
        }
    }
    class FunctionFragment extends ConstructorFragment {
        format(format) {
            if (!format) {
                format = FormatTypes.sighash;
            }
            if (!FormatTypes[format]) {
                logger$4.throwArgumentError("invalid format type", "format", format);
            }
            if (format === FormatTypes.json) {
                return JSON.stringify({
                    type: "function",
                    name: this.name,
                    constant: this.constant,
                    stateMutability: ((this.stateMutability !== "nonpayable") ? this.stateMutability : undefined),
                    payable: this.payable,
                    gas: (this.gas ? this.gas.toNumber() : undefined),
                    inputs: this.inputs.map((input) => JSON.parse(input.format(format))),
                    outputs: this.outputs.map((output) => JSON.parse(output.format(format))),
                });
            }
            let result = "";
            if (format !== FormatTypes.sighash) {
                result += "function ";
            }
            result += this.name + "(" + this.inputs.map((input) => input.format(format)).join((format === FormatTypes.full) ? ", " : ",") + ") ";
            if (format !== FormatTypes.sighash) {
                if (this.stateMutability) {
                    if (this.stateMutability !== "nonpayable") {
                        result += (this.stateMutability + " ");
                    }
                }
                else if (this.constant) {
                    result += "view ";
                }
                if (this.outputs && this.outputs.length) {
                    result += "returns (" + this.outputs.map((output) => output.format(format)).join(", ") + ") ";
                }
                if (this.gas != null) {
                    result += "@" + this.gas.toString() + " ";
                }
            }
            return result.trim();
        }
        static from(value) {
            if (typeof (value) === "string") {
                return FunctionFragment.fromString(value);
            }
            return FunctionFragment.fromObject(value);
        }
        static fromObject(value) {
            if (FunctionFragment.isFunctionFragment(value)) {
                return value;
            }
            if (value.type !== "function") {
                logger$4.throwArgumentError("invalid function object", "value", value);
            }
            let state = verifyState(value);
            const params = {
                type: value.type,
                name: verifyIdentifier(value.name),
                constant: state.constant,
                inputs: (value.inputs ? value.inputs.map(ParamType.fromObject) : []),
                outputs: (value.outputs ? value.outputs.map(ParamType.fromObject) : []),
                payable: state.payable,
                stateMutability: state.stateMutability,
                gas: (value.gas ? BigNumber.from(value.gas) : null)
            };
            return new FunctionFragment(_constructorGuard, params);
        }
        static fromString(value) {
            let params = { type: "function" };
            value = parseGas(value, params);
            let comps = value.split(" returns ");
            if (comps.length > 2) {
                logger$4.throwArgumentError("invalid function string", "value", value);
            }
            let parens = comps[0].match(regexParen);
            if (!parens) {
                logger$4.throwArgumentError("invalid function signature", "value", value);
            }
            params.name = parens[1].trim();
            if (params.name) {
                verifyIdentifier(params.name);
            }
            params.inputs = parseParams(parens[2], false);
            parseModifiers(parens[3].trim(), params);
            // We have outputs
            if (comps.length > 1) {
                let returns = comps[1].match(regexParen);
                if (returns[1].trim() != "" || returns[3].trim() != "") {
                    logger$4.throwArgumentError("unexpected tokens", "value", value);
                }
                params.outputs = parseParams(returns[2], false);
            }
            else {
                params.outputs = [];
            }
            return FunctionFragment.fromObject(params);
        }
        static isFunctionFragment(value) {
            return (value && value._isFragment && value.type === "function");
        }
    }
    //export class StructFragment extends Fragment {
    //}
    function checkForbidden(fragment) {
        const sig = fragment.format();
        if (sig === "Error(string)" || sig === "Panic(uint256)") {
            logger$4.throwArgumentError(`cannot specify user defined ${sig} error`, "fragment", fragment);
        }
        return fragment;
    }
    class ErrorFragment extends Fragment {
        format(format) {
            if (!format) {
                format = FormatTypes.sighash;
            }
            if (!FormatTypes[format]) {
                logger$4.throwArgumentError("invalid format type", "format", format);
            }
            if (format === FormatTypes.json) {
                return JSON.stringify({
                    type: "error",
                    name: this.name,
                    inputs: this.inputs.map((input) => JSON.parse(input.format(format))),
                });
            }
            let result = "";
            if (format !== FormatTypes.sighash) {
                result += "error ";
            }
            result += this.name + "(" + this.inputs.map((input) => input.format(format)).join((format === FormatTypes.full) ? ", " : ",") + ") ";
            return result.trim();
        }
        static from(value) {
            if (typeof (value) === "string") {
                return ErrorFragment.fromString(value);
            }
            return ErrorFragment.fromObject(value);
        }
        static fromObject(value) {
            if (ErrorFragment.isErrorFragment(value)) {
                return value;
            }
            if (value.type !== "error") {
                logger$4.throwArgumentError("invalid error object", "value", value);
            }
            const params = {
                type: value.type,
                name: verifyIdentifier(value.name),
                inputs: (value.inputs ? value.inputs.map(ParamType.fromObject) : [])
            };
            return checkForbidden(new ErrorFragment(_constructorGuard, params));
        }
        static fromString(value) {
            let params = { type: "error" };
            let parens = value.match(regexParen);
            if (!parens) {
                logger$4.throwArgumentError("invalid error signature", "value", value);
            }
            params.name = parens[1].trim();
            if (params.name) {
                verifyIdentifier(params.name);
            }
            params.inputs = parseParams(parens[2], false);
            return checkForbidden(ErrorFragment.fromObject(params));
        }
        static isErrorFragment(value) {
            return (value && value._isFragment && value.type === "error");
        }
    }
    function verifyType(type) {
        // These need to be transformed to their full description
        if (type.match(/^uint($|[^1-9])/)) {
            type = "uint256" + type.substring(4);
        }
        else if (type.match(/^int($|[^1-9])/)) {
            type = "int256" + type.substring(3);
        }
        // @TODO: more verification
        return type;
    }
    // See: https://github.com/ethereum/solidity/blob/1f8f1a3db93a548d0555e3e14cfc55a10e25b60e/docs/grammar/SolidityLexer.g4#L234
    const regexIdentifier = new RegExp("^[a-zA-Z$_][a-zA-Z0-9$_]*$");
    function verifyIdentifier(value) {
        if (!value || !value.match(regexIdentifier)) {
            logger$4.throwArgumentError(`invalid identifier "${value}"`, "value", value);
        }
        return value;
    }
    const regexParen = new RegExp("^([^)(]*)\\((.*)\\)([^)(]*)$");
    function splitNesting(value) {
        value = value.trim();
        let result = [];
        let accum = "";
        let depth = 0;
        for (let offset = 0; offset < value.length; offset++) {
            let c = value[offset];
            if (c === "," && depth === 0) {
                result.push(accum);
                accum = "";
            }
            else {
                accum += c;
                if (c === "(") {
                    depth++;
                }
                else if (c === ")") {
                    depth--;
                    if (depth === -1) {
                        logger$4.throwArgumentError("unbalanced parenthesis", "value", value);
                    }
                }
            }
        }
        if (accum) {
            result.push(accum);
        }
        return result;
    }

    const logger$3 = new Logger(version);
    class Coder {
        constructor(name, type, localName, dynamic) {
            // @TODO: defineReadOnly these
            this.name = name;
            this.type = type;
            this.localName = localName;
            this.dynamic = dynamic;
        }
        _throwError(message, value) {
            logger$3.throwArgumentError(message, this.localName, value);
        }
    }
    class Writer {
        constructor(wordSize) {
            defineReadOnly(this, "wordSize", wordSize || 32);
            this._data = [];
            this._dataLength = 0;
            this._padding = new Uint8Array(wordSize);
        }
        get data() {
            return hexConcat(this._data);
        }
        get length() { return this._dataLength; }
        _writeData(data) {
            this._data.push(data);
            this._dataLength += data.length;
            return data.length;
        }
        appendWriter(writer) {
            return this._writeData(concat(writer._data));
        }
        // Arrayish items; padded on the right to wordSize
        writeBytes(value) {
            let bytes = arrayify(value);
            const paddingOffset = bytes.length % this.wordSize;
            if (paddingOffset) {
                bytes = concat([bytes, this._padding.slice(paddingOffset)]);
            }
            return this._writeData(bytes);
        }
        _getValue(value) {
            let bytes = arrayify(BigNumber.from(value));
            if (bytes.length > this.wordSize) {
                logger$3.throwError("value out-of-bounds", Logger.errors.BUFFER_OVERRUN, {
                    length: this.wordSize,
                    offset: bytes.length
                });
            }
            if (bytes.length % this.wordSize) {
                bytes = concat([this._padding.slice(bytes.length % this.wordSize), bytes]);
            }
            return bytes;
        }
        // BigNumberish items; padded on the left to wordSize
        writeValue(value) {
            return this._writeData(this._getValue(value));
        }
        writeUpdatableValue() {
            const offset = this._data.length;
            this._data.push(this._padding);
            this._dataLength += this.wordSize;
            return (value) => {
                this._data[offset] = this._getValue(value);
            };
        }
    }
    class Reader {
        constructor(data, wordSize, coerceFunc, allowLoose) {
            defineReadOnly(this, "_data", arrayify(data));
            defineReadOnly(this, "wordSize", wordSize || 32);
            defineReadOnly(this, "_coerceFunc", coerceFunc);
            defineReadOnly(this, "allowLoose", allowLoose);
            this._offset = 0;
        }
        get data() { return hexlify(this._data); }
        get consumed() { return this._offset; }
        // The default Coerce function
        static coerce(name, value) {
            let match = name.match("^u?int([0-9]+)$");
            if (match && parseInt(match[1]) <= 48) {
                value = value.toNumber();
            }
            return value;
        }
        coerce(name, value) {
            if (this._coerceFunc) {
                return this._coerceFunc(name, value);
            }
            return Reader.coerce(name, value);
        }
        _peekBytes(offset, length, loose) {
            let alignedLength = Math.ceil(length / this.wordSize) * this.wordSize;
            if (this._offset + alignedLength > this._data.length) {
                if (this.allowLoose && loose && this._offset + length <= this._data.length) {
                    alignedLength = length;
                }
                else {
                    logger$3.throwError("data out-of-bounds", Logger.errors.BUFFER_OVERRUN, {
                        length: this._data.length,
                        offset: this._offset + alignedLength
                    });
                }
            }
            return this._data.slice(this._offset, this._offset + alignedLength);
        }
        subReader(offset) {
            return new Reader(this._data.slice(this._offset + offset), this.wordSize, this._coerceFunc, this.allowLoose);
        }
        readBytes(length, loose) {
            let bytes = this._peekBytes(0, length, !!loose);
            this._offset += bytes.length;
            // @TODO: Make sure the length..end bytes are all 0?
            return bytes.slice(0, length);
        }
        readValue() {
            return BigNumber.from(this.readBytes(this.wordSize));
        }
    }

    class AddressCoder extends Coder {
        constructor(localName) {
            super("address", "address", localName, false);
        }
        defaultValue() {
            return "0x0000000000000000000000000000000000000000";
        }
        encode(writer, value) {
            try {
                value = getAddress(value);
            }
            catch (error) {
                this._throwError(error.message, value);
            }
            return writer.writeValue(value);
        }
        decode(reader) {
            return getAddress(hexZeroPad(reader.readValue().toHexString(), 20));
        }
    }

    // Clones the functionality of an existing Coder, but without a localName
    class AnonymousCoder extends Coder {
        constructor(coder) {
            super(coder.name, coder.type, undefined, coder.dynamic);
            this.coder = coder;
        }
        defaultValue() {
            return this.coder.defaultValue();
        }
        encode(writer, value) {
            return this.coder.encode(writer, value);
        }
        decode(reader) {
            return this.coder.decode(reader);
        }
    }

    const logger$2 = new Logger(version);
    function pack(writer, coders, values) {
        let arrayValues = null;
        if (Array.isArray(values)) {
            arrayValues = values;
        }
        else if (values && typeof (values) === "object") {
            let unique = {};
            arrayValues = coders.map((coder) => {
                const name = coder.localName;
                if (!name) {
                    logger$2.throwError("cannot encode object for signature with missing names", Logger.errors.INVALID_ARGUMENT, {
                        argument: "values",
                        coder: coder,
                        value: values
                    });
                }
                if (unique[name]) {
                    logger$2.throwError("cannot encode object for signature with duplicate names", Logger.errors.INVALID_ARGUMENT, {
                        argument: "values",
                        coder: coder,
                        value: values
                    });
                }
                unique[name] = true;
                return values[name];
            });
        }
        else {
            logger$2.throwArgumentError("invalid tuple value", "tuple", values);
        }
        if (coders.length !== arrayValues.length) {
            logger$2.throwArgumentError("types/value length mismatch", "tuple", values);
        }
        let staticWriter = new Writer(writer.wordSize);
        let dynamicWriter = new Writer(writer.wordSize);
        let updateFuncs = [];
        coders.forEach((coder, index) => {
            let value = arrayValues[index];
            if (coder.dynamic) {
                // Get current dynamic offset (for the future pointer)
                let dynamicOffset = dynamicWriter.length;
                // Encode the dynamic value into the dynamicWriter
                coder.encode(dynamicWriter, value);
                // Prepare to populate the correct offset once we are done
                let updateFunc = staticWriter.writeUpdatableValue();
                updateFuncs.push((baseOffset) => {
                    updateFunc(baseOffset + dynamicOffset);
                });
            }
            else {
                coder.encode(staticWriter, value);
            }
        });
        // Backfill all the dynamic offsets, now that we know the static length
        updateFuncs.forEach((func) => { func(staticWriter.length); });
        let length = writer.appendWriter(staticWriter);
        length += writer.appendWriter(dynamicWriter);
        return length;
    }
    function unpack(reader, coders) {
        let values = [];
        // A reader anchored to this base
        let baseReader = reader.subReader(0);
        coders.forEach((coder) => {
            let value = null;
            if (coder.dynamic) {
                let offset = reader.readValue();
                let offsetReader = baseReader.subReader(offset.toNumber());
                try {
                    value = coder.decode(offsetReader);
                }
                catch (error) {
                    // Cannot recover from this
                    if (error.code === Logger.errors.BUFFER_OVERRUN) {
                        throw error;
                    }
                    value = error;
                    value.baseType = coder.name;
                    value.name = coder.localName;
                    value.type = coder.type;
                }
            }
            else {
                try {
                    value = coder.decode(reader);
                }
                catch (error) {
                    // Cannot recover from this
                    if (error.code === Logger.errors.BUFFER_OVERRUN) {
                        throw error;
                    }
                    value = error;
                    value.baseType = coder.name;
                    value.name = coder.localName;
                    value.type = coder.type;
                }
            }
            if (value != undefined) {
                values.push(value);
            }
        });
        // We only output named properties for uniquely named coders
        const uniqueNames = coders.reduce((accum, coder) => {
            const name = coder.localName;
            if (name) {
                if (!accum[name]) {
                    accum[name] = 0;
                }
                accum[name]++;
            }
            return accum;
        }, {});
        // Add any named parameters (i.e. tuples)
        coders.forEach((coder, index) => {
            let name = coder.localName;
            if (!name || uniqueNames[name] !== 1) {
                return;
            }
            if (name === "length") {
                name = "_length";
            }
            if (values[name] != null) {
                return;
            }
            const value = values[index];
            if (value instanceof Error) {
                Object.defineProperty(values, name, {
                    enumerable: true,
                    get: () => { throw value; }
                });
            }
            else {
                values[name] = value;
            }
        });
        for (let i = 0; i < values.length; i++) {
            const value = values[i];
            if (value instanceof Error) {
                Object.defineProperty(values, i, {
                    enumerable: true,
                    get: () => { throw value; }
                });
            }
        }
        return Object.freeze(values);
    }
    class ArrayCoder extends Coder {
        constructor(coder, length, localName) {
            const type = (coder.type + "[" + (length >= 0 ? length : "") + "]");
            const dynamic = (length === -1 || coder.dynamic);
            super("array", type, localName, dynamic);
            this.coder = coder;
            this.length = length;
        }
        defaultValue() {
            // Verifies the child coder is valid (even if the array is dynamic or 0-length)
            const defaultChild = this.coder.defaultValue();
            const result = [];
            for (let i = 0; i < this.length; i++) {
                result.push(defaultChild);
            }
            return result;
        }
        encode(writer, value) {
            if (!Array.isArray(value)) {
                this._throwError("expected array value", value);
            }
            let count = this.length;
            if (count === -1) {
                count = value.length;
                writer.writeValue(value.length);
            }
            logger$2.checkArgumentCount(value.length, count, "coder array" + (this.localName ? (" " + this.localName) : ""));
            let coders = [];
            for (let i = 0; i < value.length; i++) {
                coders.push(this.coder);
            }
            return pack(writer, coders, value);
        }
        decode(reader) {
            let count = this.length;
            if (count === -1) {
                count = reader.readValue().toNumber();
                // Check that there is *roughly* enough data to ensure
                // stray random data is not being read as a length. Each
                // slot requires at least 32 bytes for their value (or 32
                // bytes as a link to the data). This could use a much
                // tighter bound, but we are erroring on the side of safety.
                if (count * 32 > reader._data.length) {
                    logger$2.throwError("insufficient data length", Logger.errors.BUFFER_OVERRUN, {
                        length: reader._data.length,
                        count: count
                    });
                }
            }
            let coders = [];
            for (let i = 0; i < count; i++) {
                coders.push(new AnonymousCoder(this.coder));
            }
            return reader.coerce(this.name, unpack(reader, coders));
        }
    }

    class BooleanCoder extends Coder {
        constructor(localName) {
            super("bool", "bool", localName, false);
        }
        defaultValue() {
            return false;
        }
        encode(writer, value) {
            return writer.writeValue(value ? 1 : 0);
        }
        decode(reader) {
            return reader.coerce(this.type, !reader.readValue().isZero());
        }
    }

    class DynamicBytesCoder extends Coder {
        constructor(type, localName) {
            super(type, type, localName, true);
        }
        defaultValue() {
            return "0x";
        }
        encode(writer, value) {
            value = arrayify(value);
            let length = writer.writeValue(value.length);
            length += writer.writeBytes(value);
            return length;
        }
        decode(reader) {
            return reader.readBytes(reader.readValue().toNumber(), true);
        }
    }
    class BytesCoder extends DynamicBytesCoder {
        constructor(localName) {
            super("bytes", localName);
        }
        decode(reader) {
            return reader.coerce(this.name, hexlify(super.decode(reader)));
        }
    }

    // @TODO: Merge this with bytes
    class FixedBytesCoder extends Coder {
        constructor(size, localName) {
            let name = "bytes" + String(size);
            super(name, name, localName, false);
            this.size = size;
        }
        defaultValue() {
            return ("0x0000000000000000000000000000000000000000000000000000000000000000").substring(0, 2 + this.size * 2);
        }
        encode(writer, value) {
            let data = arrayify(value);
            if (data.length !== this.size) {
                this._throwError("incorrect data length", value);
            }
            return writer.writeBytes(data);
        }
        decode(reader) {
            return reader.coerce(this.name, hexlify(reader.readBytes(this.size)));
        }
    }

    class NullCoder extends Coder {
        constructor(localName) {
            super("null", "", localName, false);
        }
        defaultValue() {
            return null;
        }
        encode(writer, value) {
            if (value != null) {
                this._throwError("not null", value);
            }
            return writer.writeBytes([]);
        }
        decode(reader) {
            reader.readBytes(0);
            return reader.coerce(this.name, null);
        }
    }

    class NumberCoder extends Coder {
        constructor(size, signed, localName) {
            const name = ((signed ? "int" : "uint") + (size * 8));
            super(name, name, localName, false);
            this.size = size;
            this.signed = signed;
        }
        defaultValue() {
            return 0;
        }
        encode(writer, value) {
            let v = BigNumber.from(value);
            // Check bounds are safe for encoding
            let maxUintValue = MaxUint256.mask(writer.wordSize * 8);
            if (this.signed) {
                let bounds = maxUintValue.mask(this.size * 8 - 1);
                if (v.gt(bounds) || v.lt(bounds.add(One).mul(NegativeOne))) {
                    this._throwError("value out-of-bounds", value);
                }
            }
            else if (v.lt(Zero) || v.gt(maxUintValue.mask(this.size * 8))) {
                this._throwError("value out-of-bounds", value);
            }
            v = v.toTwos(this.size * 8).mask(this.size * 8);
            if (this.signed) {
                v = v.fromTwos(this.size * 8).toTwos(8 * writer.wordSize);
            }
            return writer.writeValue(v);
        }
        decode(reader) {
            let value = reader.readValue().mask(this.size * 8);
            if (this.signed) {
                value = value.fromTwos(this.size * 8);
            }
            return reader.coerce(this.name, value);
        }
    }

    class StringCoder extends DynamicBytesCoder {
        constructor(localName) {
            super("string", localName);
        }
        defaultValue() {
            return "";
        }
        encode(writer, value) {
            return super.encode(writer, toUtf8Bytes(value));
        }
        decode(reader) {
            return toUtf8String(super.decode(reader));
        }
    }

    class TupleCoder extends Coder {
        constructor(coders, localName) {
            let dynamic = false;
            const types = [];
            coders.forEach((coder) => {
                if (coder.dynamic) {
                    dynamic = true;
                }
                types.push(coder.type);
            });
            const type = ("tuple(" + types.join(",") + ")");
            super("tuple", type, localName, dynamic);
            this.coders = coders;
        }
        defaultValue() {
            const values = [];
            this.coders.forEach((coder) => {
                values.push(coder.defaultValue());
            });
            // We only output named properties for uniquely named coders
            const uniqueNames = this.coders.reduce((accum, coder) => {
                const name = coder.localName;
                if (name) {
                    if (!accum[name]) {
                        accum[name] = 0;
                    }
                    accum[name]++;
                }
                return accum;
            }, {});
            // Add named values
            this.coders.forEach((coder, index) => {
                let name = coder.localName;
                if (!name || uniqueNames[name] !== 1) {
                    return;
                }
                if (name === "length") {
                    name = "_length";
                }
                if (values[name] != null) {
                    return;
                }
                values[name] = values[index];
            });
            return Object.freeze(values);
        }
        encode(writer, value) {
            return pack(writer, this.coders, value);
        }
        decode(reader) {
            return reader.coerce(this.name, unpack(reader, this.coders));
        }
    }

    const logger$1 = new Logger(version);
    const paramTypeBytes = new RegExp(/^bytes([0-9]*)$/);
    const paramTypeNumber = new RegExp(/^(u?int)([0-9]*)$/);
    class AbiCoder {
        constructor(coerceFunc) {
            defineReadOnly(this, "coerceFunc", coerceFunc || null);
        }
        _getCoder(param) {
            switch (param.baseType) {
                case "address":
                    return new AddressCoder(param.name);
                case "bool":
                    return new BooleanCoder(param.name);
                case "string":
                    return new StringCoder(param.name);
                case "bytes":
                    return new BytesCoder(param.name);
                case "array":
                    return new ArrayCoder(this._getCoder(param.arrayChildren), param.arrayLength, param.name);
                case "tuple":
                    return new TupleCoder((param.components || []).map((component) => {
                        return this._getCoder(component);
                    }), param.name);
                case "":
                    return new NullCoder(param.name);
            }
            // u?int[0-9]*
            let match = param.type.match(paramTypeNumber);
            if (match) {
                let size = parseInt(match[2] || "256");
                if (size === 0 || size > 256 || (size % 8) !== 0) {
                    logger$1.throwArgumentError("invalid " + match[1] + " bit length", "param", param);
                }
                return new NumberCoder(size / 8, (match[1] === "int"), param.name);
            }
            // bytes[0-9]+
            match = param.type.match(paramTypeBytes);
            if (match) {
                let size = parseInt(match[1]);
                if (size === 0 || size > 32) {
                    logger$1.throwArgumentError("invalid bytes length", "param", param);
                }
                return new FixedBytesCoder(size, param.name);
            }
            return logger$1.throwArgumentError("invalid type", "type", param.type);
        }
        _getWordSize() { return 32; }
        _getReader(data, allowLoose) {
            return new Reader(data, this._getWordSize(), this.coerceFunc, allowLoose);
        }
        _getWriter() {
            return new Writer(this._getWordSize());
        }
        getDefaultValue(types) {
            const coders = types.map((type) => this._getCoder(ParamType.from(type)));
            const coder = new TupleCoder(coders, "_");
            return coder.defaultValue();
        }
        encode(types, values) {
            if (types.length !== values.length) {
                logger$1.throwError("types/values length mismatch", Logger.errors.INVALID_ARGUMENT, {
                    count: { types: types.length, values: values.length },
                    value: { types: types, values: values }
                });
            }
            const coders = types.map((type) => this._getCoder(ParamType.from(type)));
            const coder = (new TupleCoder(coders, "_"));
            const writer = this._getWriter();
            coder.encode(writer, values);
            return writer.data;
        }
        decode(types, data, loose) {
            const coders = types.map((type) => this._getCoder(ParamType.from(type)));
            const coder = new TupleCoder(coders, "_");
            return coder.decode(this._getReader(arrayify(data), loose));
        }
    }
    const defaultAbiCoder = new AbiCoder();

    const logger = new Logger(version);
    class LogDescription extends Description {
    }
    class TransactionDescription extends Description {
    }
    class ErrorDescription extends Description {
    }
    class Indexed extends Description {
        static isIndexed(value) {
            return !!(value && value._isIndexed);
        }
    }
    const BuiltinErrors = {
        "0x08c379a0": { signature: "Error(string)", name: "Error", inputs: ["string"], reason: true },
        "0x4e487b71": { signature: "Panic(uint256)", name: "Panic", inputs: ["uint256"] }
    };
    function wrapAccessError(property, error) {
        const wrap = new Error(`deferred error during ABI decoding triggered accessing ${property}`);
        wrap.error = error;
        return wrap;
    }
    /*
    function checkNames(fragment: Fragment, type: "input" | "output", params: Array<ParamType>): void {
        params.reduce((accum, param) => {
            if (param.name) {
                if (accum[param.name]) {
                    logger.throwArgumentError(`duplicate ${ type } parameter ${ JSON.stringify(param.name) } in ${ fragment.format("full") }`, "fragment", fragment);
                }
                accum[param.name] = true;
            }
            return accum;
        }, <{ [ name: string ]: boolean }>{ });
    }
    */
    class Interface {
        constructor(fragments) {
            let abi = [];
            if (typeof (fragments) === "string") {
                abi = JSON.parse(fragments);
            }
            else {
                abi = fragments;
            }
            defineReadOnly(this, "fragments", abi.map((fragment) => {
                return Fragment.from(fragment);
            }).filter((fragment) => (fragment != null)));
            defineReadOnly(this, "_abiCoder", getStatic(new.target, "getAbiCoder")());
            defineReadOnly(this, "functions", {});
            defineReadOnly(this, "errors", {});
            defineReadOnly(this, "events", {});
            defineReadOnly(this, "structs", {});
            // Add all fragments by their signature
            this.fragments.forEach((fragment) => {
                let bucket = null;
                switch (fragment.type) {
                    case "constructor":
                        if (this.deploy) {
                            logger.warn("duplicate definition - constructor");
                            return;
                        }
                        //checkNames(fragment, "input", fragment.inputs);
                        defineReadOnly(this, "deploy", fragment);
                        return;
                    case "function":
                        //checkNames(fragment, "input", fragment.inputs);
                        //checkNames(fragment, "output", (<FunctionFragment>fragment).outputs);
                        bucket = this.functions;
                        break;
                    case "event":
                        //checkNames(fragment, "input", fragment.inputs);
                        bucket = this.events;
                        break;
                    case "error":
                        bucket = this.errors;
                        break;
                    default:
                        return;
                }
                let signature = fragment.format();
                if (bucket[signature]) {
                    logger.warn("duplicate definition - " + signature);
                    return;
                }
                bucket[signature] = fragment;
            });
            // If we do not have a constructor add a default
            if (!this.deploy) {
                defineReadOnly(this, "deploy", ConstructorFragment.from({
                    payable: false,
                    type: "constructor"
                }));
            }
            defineReadOnly(this, "_isInterface", true);
        }
        format(format) {
            if (!format) {
                format = FormatTypes.full;
            }
            if (format === FormatTypes.sighash) {
                logger.throwArgumentError("interface does not support formatting sighash", "format", format);
            }
            const abi = this.fragments.map((fragment) => fragment.format(format));
            // We need to re-bundle the JSON fragments a bit
            if (format === FormatTypes.json) {
                return JSON.stringify(abi.map((j) => JSON.parse(j)));
            }
            return abi;
        }
        // Sub-classes can override these to handle other blockchains
        static getAbiCoder() {
            return defaultAbiCoder;
        }
        static getAddress(address) {
            return getAddress(address);
        }
        static getSighash(fragment) {
            return hexDataSlice(id(fragment.format()), 0, 4);
        }
        static getEventTopic(eventFragment) {
            return id(eventFragment.format());
        }
        // Find a function definition by any means necessary (unless it is ambiguous)
        getFunction(nameOrSignatureOrSighash) {
            if (isHexString(nameOrSignatureOrSighash)) {
                for (const name in this.functions) {
                    if (nameOrSignatureOrSighash === this.getSighash(name)) {
                        return this.functions[name];
                    }
                }
                logger.throwArgumentError("no matching function", "sighash", nameOrSignatureOrSighash);
            }
            // It is a bare name, look up the function (will return null if ambiguous)
            if (nameOrSignatureOrSighash.indexOf("(") === -1) {
                const name = nameOrSignatureOrSighash.trim();
                const matching = Object.keys(this.functions).filter((f) => (f.split("(" /* fix:) */)[0] === name));
                if (matching.length === 0) {
                    logger.throwArgumentError("no matching function", "name", name);
                }
                else if (matching.length > 1) {
                    logger.throwArgumentError("multiple matching functions", "name", name);
                }
                return this.functions[matching[0]];
            }
            // Normalize the signature and lookup the function
            const result = this.functions[FunctionFragment.fromString(nameOrSignatureOrSighash).format()];
            if (!result) {
                logger.throwArgumentError("no matching function", "signature", nameOrSignatureOrSighash);
            }
            return result;
        }
        // Find an event definition by any means necessary (unless it is ambiguous)
        getEvent(nameOrSignatureOrTopic) {
            if (isHexString(nameOrSignatureOrTopic)) {
                const topichash = nameOrSignatureOrTopic.toLowerCase();
                for (const name in this.events) {
                    if (topichash === this.getEventTopic(name)) {
                        return this.events[name];
                    }
                }
                logger.throwArgumentError("no matching event", "topichash", topichash);
            }
            // It is a bare name, look up the function (will return null if ambiguous)
            if (nameOrSignatureOrTopic.indexOf("(") === -1) {
                const name = nameOrSignatureOrTopic.trim();
                const matching = Object.keys(this.events).filter((f) => (f.split("(" /* fix:) */)[0] === name));
                if (matching.length === 0) {
                    logger.throwArgumentError("no matching event", "name", name);
                }
                else if (matching.length > 1) {
                    logger.throwArgumentError("multiple matching events", "name", name);
                }
                return this.events[matching[0]];
            }
            // Normalize the signature and lookup the function
            const result = this.events[EventFragment.fromString(nameOrSignatureOrTopic).format()];
            if (!result) {
                logger.throwArgumentError("no matching event", "signature", nameOrSignatureOrTopic);
            }
            return result;
        }
        // Find a function definition by any means necessary (unless it is ambiguous)
        getError(nameOrSignatureOrSighash) {
            if (isHexString(nameOrSignatureOrSighash)) {
                const getSighash = getStatic(this.constructor, "getSighash");
                for (const name in this.errors) {
                    const error = this.errors[name];
                    if (nameOrSignatureOrSighash === getSighash(error)) {
                        return this.errors[name];
                    }
                }
                logger.throwArgumentError("no matching error", "sighash", nameOrSignatureOrSighash);
            }
            // It is a bare name, look up the function (will return null if ambiguous)
            if (nameOrSignatureOrSighash.indexOf("(") === -1) {
                const name = nameOrSignatureOrSighash.trim();
                const matching = Object.keys(this.errors).filter((f) => (f.split("(" /* fix:) */)[0] === name));
                if (matching.length === 0) {
                    logger.throwArgumentError("no matching error", "name", name);
                }
                else if (matching.length > 1) {
                    logger.throwArgumentError("multiple matching errors", "name", name);
                }
                return this.errors[matching[0]];
            }
            // Normalize the signature and lookup the function
            const result = this.errors[FunctionFragment.fromString(nameOrSignatureOrSighash).format()];
            if (!result) {
                logger.throwArgumentError("no matching error", "signature", nameOrSignatureOrSighash);
            }
            return result;
        }
        // Get the sighash (the bytes4 selector) used by Solidity to identify a function
        getSighash(fragment) {
            if (typeof (fragment) === "string") {
                try {
                    fragment = this.getFunction(fragment);
                }
                catch (error) {
                    try {
                        fragment = this.getError(fragment);
                    }
                    catch (_) {
                        throw error;
                    }
                }
            }
            return getStatic(this.constructor, "getSighash")(fragment);
        }
        // Get the topic (the bytes32 hash) used by Solidity to identify an event
        getEventTopic(eventFragment) {
            if (typeof (eventFragment) === "string") {
                eventFragment = this.getEvent(eventFragment);
            }
            return getStatic(this.constructor, "getEventTopic")(eventFragment);
        }
        _decodeParams(params, data) {
            return this._abiCoder.decode(params, data);
        }
        _encodeParams(params, values) {
            return this._abiCoder.encode(params, values);
        }
        encodeDeploy(values) {
            return this._encodeParams(this.deploy.inputs, values || []);
        }
        decodeErrorResult(fragment, data) {
            if (typeof (fragment) === "string") {
                fragment = this.getError(fragment);
            }
            const bytes = arrayify(data);
            if (hexlify(bytes.slice(0, 4)) !== this.getSighash(fragment)) {
                logger.throwArgumentError(`data signature does not match error ${fragment.name}.`, "data", hexlify(bytes));
            }
            return this._decodeParams(fragment.inputs, bytes.slice(4));
        }
        encodeErrorResult(fragment, values) {
            if (typeof (fragment) === "string") {
                fragment = this.getError(fragment);
            }
            return hexlify(concat([
                this.getSighash(fragment),
                this._encodeParams(fragment.inputs, values || [])
            ]));
        }
        // Decode the data for a function call (e.g. tx.data)
        decodeFunctionData(functionFragment, data) {
            if (typeof (functionFragment) === "string") {
                functionFragment = this.getFunction(functionFragment);
            }
            const bytes = arrayify(data);
            if (hexlify(bytes.slice(0, 4)) !== this.getSighash(functionFragment)) {
                logger.throwArgumentError(`data signature does not match function ${functionFragment.name}.`, "data", hexlify(bytes));
            }
            return this._decodeParams(functionFragment.inputs, bytes.slice(4));
        }
        // Encode the data for a function call (e.g. tx.data)
        encodeFunctionData(functionFragment, values) {
            if (typeof (functionFragment) === "string") {
                functionFragment = this.getFunction(functionFragment);
            }
            return hexlify(concat([
                this.getSighash(functionFragment),
                this._encodeParams(functionFragment.inputs, values || [])
            ]));
        }
        // Decode the result from a function call (e.g. from eth_call)
        decodeFunctionResult(functionFragment, data) {
            if (typeof (functionFragment) === "string") {
                functionFragment = this.getFunction(functionFragment);
            }
            let bytes = arrayify(data);
            let reason = null;
            let message = "";
            let errorArgs = null;
            let errorName = null;
            let errorSignature = null;
            switch (bytes.length % this._abiCoder._getWordSize()) {
                case 0:
                    try {
                        return this._abiCoder.decode(functionFragment.outputs, bytes);
                    }
                    catch (error) { }
                    break;
                case 4: {
                    const selector = hexlify(bytes.slice(0, 4));
                    const builtin = BuiltinErrors[selector];
                    if (builtin) {
                        errorArgs = this._abiCoder.decode(builtin.inputs, bytes.slice(4));
                        errorName = builtin.name;
                        errorSignature = builtin.signature;
                        if (builtin.reason) {
                            reason = errorArgs[0];
                        }
                        if (errorName === "Error") {
                            message = `; VM Exception while processing transaction: reverted with reason string ${JSON.stringify(errorArgs[0])}`;
                        }
                        else if (errorName === "Panic") {
                            message = `; VM Exception while processing transaction: reverted with panic code ${errorArgs[0]}`;
                        }
                    }
                    else {
                        try {
                            const error = this.getError(selector);
                            errorArgs = this._abiCoder.decode(error.inputs, bytes.slice(4));
                            errorName = error.name;
                            errorSignature = error.format();
                        }
                        catch (error) { }
                    }
                    break;
                }
            }
            return logger.throwError("call revert exception" + message, Logger.errors.CALL_EXCEPTION, {
                method: functionFragment.format(),
                data: hexlify(data), errorArgs, errorName, errorSignature, reason
            });
        }
        // Encode the result for a function call (e.g. for eth_call)
        encodeFunctionResult(functionFragment, values) {
            if (typeof (functionFragment) === "string") {
                functionFragment = this.getFunction(functionFragment);
            }
            return hexlify(this._abiCoder.encode(functionFragment.outputs, values || []));
        }
        // Create the filter for the event with search criteria (e.g. for eth_filterLog)
        encodeFilterTopics(eventFragment, values) {
            if (typeof (eventFragment) === "string") {
                eventFragment = this.getEvent(eventFragment);
            }
            if (values.length > eventFragment.inputs.length) {
                logger.throwError("too many arguments for " + eventFragment.format(), Logger.errors.UNEXPECTED_ARGUMENT, {
                    argument: "values",
                    value: values
                });
            }
            let topics = [];
            if (!eventFragment.anonymous) {
                topics.push(this.getEventTopic(eventFragment));
            }
            const encodeTopic = (param, value) => {
                if (param.type === "string") {
                    return id(value);
                }
                else if (param.type === "bytes") {
                    return keccak256(hexlify(value));
                }
                if (param.type === "bool" && typeof (value) === "boolean") {
                    value = (value ? "0x01" : "0x00");
                }
                if (param.type.match(/^u?int/)) {
                    value = BigNumber.from(value).toHexString();
                }
                // Check addresses are valid
                if (param.type === "address") {
                    this._abiCoder.encode(["address"], [value]);
                }
                return hexZeroPad(hexlify(value), 32);
            };
            values.forEach((value, index) => {
                let param = eventFragment.inputs[index];
                if (!param.indexed) {
                    if (value != null) {
                        logger.throwArgumentError("cannot filter non-indexed parameters; must be null", ("contract." + param.name), value);
                    }
                    return;
                }
                if (value == null) {
                    topics.push(null);
                }
                else if (param.baseType === "array" || param.baseType === "tuple") {
                    logger.throwArgumentError("filtering with tuples or arrays not supported", ("contract." + param.name), value);
                }
                else if (Array.isArray(value)) {
                    topics.push(value.map((value) => encodeTopic(param, value)));
                }
                else {
                    topics.push(encodeTopic(param, value));
                }
            });
            // Trim off trailing nulls
            while (topics.length && topics[topics.length - 1] === null) {
                topics.pop();
            }
            return topics;
        }
        encodeEventLog(eventFragment, values) {
            if (typeof (eventFragment) === "string") {
                eventFragment = this.getEvent(eventFragment);
            }
            const topics = [];
            const dataTypes = [];
            const dataValues = [];
            if (!eventFragment.anonymous) {
                topics.push(this.getEventTopic(eventFragment));
            }
            if (values.length !== eventFragment.inputs.length) {
                logger.throwArgumentError("event arguments/values mismatch", "values", values);
            }
            eventFragment.inputs.forEach((param, index) => {
                const value = values[index];
                if (param.indexed) {
                    if (param.type === "string") {
                        topics.push(id(value));
                    }
                    else if (param.type === "bytes") {
                        topics.push(keccak256(value));
                    }
                    else if (param.baseType === "tuple" || param.baseType === "array") {
                        // @TODO
                        throw new Error("not implemented");
                    }
                    else {
                        topics.push(this._abiCoder.encode([param.type], [value]));
                    }
                }
                else {
                    dataTypes.push(param);
                    dataValues.push(value);
                }
            });
            return {
                data: this._abiCoder.encode(dataTypes, dataValues),
                topics: topics
            };
        }
        // Decode a filter for the event and the search criteria
        decodeEventLog(eventFragment, data, topics) {
            if (typeof (eventFragment) === "string") {
                eventFragment = this.getEvent(eventFragment);
            }
            if (topics != null && !eventFragment.anonymous) {
                let topicHash = this.getEventTopic(eventFragment);
                if (!isHexString(topics[0], 32) || topics[0].toLowerCase() !== topicHash) {
                    logger.throwError("fragment/topic mismatch", Logger.errors.INVALID_ARGUMENT, { argument: "topics[0]", expected: topicHash, value: topics[0] });
                }
                topics = topics.slice(1);
            }
            let indexed = [];
            let nonIndexed = [];
            let dynamic = [];
            eventFragment.inputs.forEach((param, index) => {
                if (param.indexed) {
                    if (param.type === "string" || param.type === "bytes" || param.baseType === "tuple" || param.baseType === "array") {
                        indexed.push(ParamType.fromObject({ type: "bytes32", name: param.name }));
                        dynamic.push(true);
                    }
                    else {
                        indexed.push(param);
                        dynamic.push(false);
                    }
                }
                else {
                    nonIndexed.push(param);
                    dynamic.push(false);
                }
            });
            let resultIndexed = (topics != null) ? this._abiCoder.decode(indexed, concat(topics)) : null;
            let resultNonIndexed = this._abiCoder.decode(nonIndexed, data, true);
            let result = [];
            let nonIndexedIndex = 0, indexedIndex = 0;
            eventFragment.inputs.forEach((param, index) => {
                if (param.indexed) {
                    if (resultIndexed == null) {
                        result[index] = new Indexed({ _isIndexed: true, hash: null });
                    }
                    else if (dynamic[index]) {
                        result[index] = new Indexed({ _isIndexed: true, hash: resultIndexed[indexedIndex++] });
                    }
                    else {
                        try {
                            result[index] = resultIndexed[indexedIndex++];
                        }
                        catch (error) {
                            result[index] = error;
                        }
                    }
                }
                else {
                    try {
                        result[index] = resultNonIndexed[nonIndexedIndex++];
                    }
                    catch (error) {
                        result[index] = error;
                    }
                }
                // Add the keyword argument if named and safe
                if (param.name && result[param.name] == null) {
                    const value = result[index];
                    // Make error named values throw on access
                    if (value instanceof Error) {
                        Object.defineProperty(result, param.name, {
                            enumerable: true,
                            get: () => { throw wrapAccessError(`property ${JSON.stringify(param.name)}`, value); }
                        });
                    }
                    else {
                        result[param.name] = value;
                    }
                }
            });
            // Make all error indexed values throw on access
            for (let i = 0; i < result.length; i++) {
                const value = result[i];
                if (value instanceof Error) {
                    Object.defineProperty(result, i, {
                        enumerable: true,
                        get: () => { throw wrapAccessError(`index ${i}`, value); }
                    });
                }
            }
            return Object.freeze(result);
        }
        // Given a transaction, find the matching function fragment (if any) and
        // determine all its properties and call parameters
        parseTransaction(tx) {
            let fragment = this.getFunction(tx.data.substring(0, 10).toLowerCase());
            if (!fragment) {
                return null;
            }
            return new TransactionDescription({
                args: this._abiCoder.decode(fragment.inputs, "0x" + tx.data.substring(10)),
                functionFragment: fragment,
                name: fragment.name,
                signature: fragment.format(),
                sighash: this.getSighash(fragment),
                value: BigNumber.from(tx.value || "0"),
            });
        }
        // @TODO
        //parseCallResult(data: BytesLike): ??
        // Given an event log, find the matching event fragment (if any) and
        // determine all its properties and values
        parseLog(log) {
            let fragment = this.getEvent(log.topics[0]);
            if (!fragment || fragment.anonymous) {
                return null;
            }
            // @TODO: If anonymous, and the only method, and the input count matches, should we parse?
            //        Probably not, because just because it is the only event in the ABI does
            //        not mean we have the full ABI; maybe just a fragment?
            return new LogDescription({
                eventFragment: fragment,
                name: fragment.name,
                signature: fragment.format(),
                topic: this.getEventTopic(fragment),
                args: this.decodeEventLog(fragment, log.data, log.topics)
            });
        }
        parseError(data) {
            const hexData = hexlify(data);
            let fragment = this.getError(hexData.substring(0, 10).toLowerCase());
            if (!fragment) {
                return null;
            }
            return new ErrorDescription({
                args: this._abiCoder.decode(fragment.inputs, "0x" + hexData.substring(10)),
                errorFragment: fragment,
                name: fragment.name,
                signature: fragment.format(),
                sighash: this.getSighash(fragment),
            });
        }
        /*
        static from(value: Array<Fragment | string | JsonAbi> | string | Interface) {
            if (Interface.isInterface(value)) {
                return value;
            }
            if (typeof(value) === "string") {
                return new Interface(JSON.parse(value));
            }
            return new Interface(value);
        }
        */
        static isInterface(value) {
            return !!(value && value._isInterface);
        }
    }

    var gelatoAbi = [
        {
            inputs: [{ internalType: 'address', name: '_gelato', type: 'address' }],
            stateMutability: 'nonpayable',
            type: 'constructor',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'sponsor',
                    type: 'address',
                },
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'target',
                    type: 'address',
                },
                {
                    indexed: true,
                    internalType: 'address',
                    name: 'feeToken',
                    type: 'address',
                },
                {
                    indexed: false,
                    internalType: 'uint256',
                    name: 'oneBalanceChainId',
                    type: 'uint256',
                },
                {
                    indexed: false,
                    internalType: 'uint256',
                    name: 'nativeToFeeTokenXRateNumerator',
                    type: 'uint256',
                },
                {
                    indexed: false,
                    internalType: 'uint256',
                    name: 'nativeToFeeTokenXRateDenominator',
                    type: 'uint256',
                },
                {
                    indexed: false,
                    internalType: 'bytes32',
                    name: 'correlationId',
                    type: 'bytes32',
                },
            ],
            name: 'LogUseGelato1Balance',
            type: 'event',
        },
        {
            inputs: [],
            name: 'DOMAIN_SEPARATOR',
            outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [],
            name: 'SPONSORED_CALL_ERC2771_TYPEHASH',
            outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [],
            name: 'gelato',
            outputs: [{ internalType: 'address', name: '', type: 'address' }],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [],
            name: 'name',
            outputs: [{ internalType: 'string', name: '', type: 'string' }],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [
                {
                    components: [
                        { internalType: 'uint256', name: 'chainId', type: 'uint256' },
                        { internalType: 'address', name: 'target', type: 'address' },
                        { internalType: 'bytes', name: 'data', type: 'bytes' },
                        { internalType: 'address', name: 'user', type: 'address' },
                        { internalType: 'uint256', name: 'userNonce', type: 'uint256' },
                        { internalType: 'uint256', name: 'userDeadline', type: 'uint256' },
                    ],
                    internalType: 'struct CallWithERC2771',
                    name: '_call',
                    type: 'tuple',
                },
                { internalType: 'address', name: '_sponsor', type: 'address' },
                { internalType: 'address', name: '_feeToken', type: 'address' },
                {
                    internalType: 'uint256',
                    name: '_oneBalanceChainId',
                    type: 'uint256',
                },
                { internalType: 'bytes', name: '_userSignature', type: 'bytes' },
                {
                    internalType: 'uint256',
                    name: '_nativeToFeeTokenXRateNumerator',
                    type: 'uint256',
                },
                {
                    internalType: 'uint256',
                    name: '_nativeToFeeTokenXRateDenominator',
                    type: 'uint256',
                },
                { internalType: 'bytes32', name: '_correlationId', type: 'bytes32' },
            ],
            name: 'sponsoredCallERC2771',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [{ internalType: 'address', name: '', type: 'address' }],
            name: 'userNonce',
            outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [],
            name: 'version',
            outputs: [{ internalType: 'string', name: '', type: 'string' }],
            stateMutability: 'view',
            type: 'function',
        },
    ];

    function gelatoEIP712DomainTypeData(chain) {
        return {
            name: 'GelatoRelay1BalanceERC2771',
            version: '1',
            verifyingContract: GELATO_RELAY_ADDRESS,
            chainId: chain,
        };
    }
    const GELATO_RELAY_ADDRESS = '0xd8253782c45a12053594b9deB72d8e8aB2Fca54c';
    const EIP712_SPONSORED_CALL_ERC2771_TYPE_DATA = {
        SponsoredCallERC2771: [
            { name: 'chainId', type: 'uint256' },
            { name: 'target', type: 'address' },
            { name: 'data', type: 'bytes' },
            { name: 'user', type: 'address' },
            { name: 'userNonce', type: 'uint256' },
            { name: 'userDeadline', type: 'uint256' },
        ],
    };
    const DEFAULT_DEADLINE_GAP = 86400;
    async function getGelatoRequestStruct(provider, chainId, target, metaTxToSign, deadline) {
        const signerAddress = await provider.getAddress();
        const relayerAddress = GELATO_RELAY_ADDRESS;
        const gelatoRelayerContract = new Contract(relayerAddress, gelatoAbi);
        const contract = gelatoRelayerContract.connect(provider);
        const userNonce = await contract.userNonce(await provider.getAddress());
        let data;
        try {
            const iface = new Interface([metaTxToSign.func]);
            data = iface.encodeFunctionData(metaTxToSign.functionName, metaTxToSign.parameters);
        }
        catch (e) {
            console.log(e);
            throw new Error('could not create data');
        }
        const gelatoRequestStruct = {
            chainId,
            target: target,
            data: data,
            user: signerAddress,
            userNonce: Number(userNonce),
            userDeadline: deadline ?? calculateDeadline(DEFAULT_DEADLINE_GAP),
        };
        return gelatoRequestStruct;
    }
    const getGaslessTxToSign = async (chain, contractAddress, provider, metaTxToSign, deadline) => {
        const domain = gelatoEIP712DomainTypeData(chain);
        const types = { ...EIP712_SPONSORED_CALL_ERC2771_TYPE_DATA };
        const value = await getGelatoRequestStruct(provider, chain, contractAddress, metaTxToSign, deadline);
        return { domain, types, value };
    };
    function calculateDeadline(gap) {
        return Math.floor(Date.now() / 1000) + gap;
    }

    const MAX_INT = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    const POLYGON_USDC = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';
    const ERC20_PERMIT_TYPE = {
        Permit: [
            {
                name: 'owner',
                type: 'address',
            },
            {
                name: 'spender',
                type: 'address',
            },
            {
                name: 'value',
                type: 'uint256',
            },
            {
                name: 'nonce',
                type: 'uint256',
            },
            {
                name: 'deadline',
                type: 'uint256',
            },
        ],
    };
    const ERC20_PERMIT_ABI_INTERFACE = [
        'function EIP712_VERSION() view returns (string)',
        'function nonces(address) view returns (uint256)',
        'function name() view returns (string)',
    ];
    const getERC2612PermitTypeData = async (provider, token, owner, spender, amount, deadline) => {
        const tokenAddress = token.verifyingContract || token;
        const contract = new Contract(tokenAddress, ERC20_PERMIT_ABI_INTERFACE, provider);
        const [nonce, name, chainId] = await Promise.all([
            contract.nonces(owner),
            contract.name(),
            137,
        ]);
        let version;
        try {
            version = await contract.EIP712_VERSION();
        }
        catch (error) {
            // DEV: Polygon USDC requires version 2 for EIP712_VERSION 
            // If using a custom token please make sure it supports permit and set the appropriate version number 
            if (tokenAddress === POLYGON_USDC) {
                version = '2';
            }
            else {
                version = '1';
            }
        }
        const types = ERC20_PERMIT_TYPE;
        const value = {
            owner,
            spender,
            value: amount,
            nonce,
            deadline,
        };
        const domain = {
            name,
            version,
            chainId,
            verifyingContract: tokenAddress,
        };
        const erc20PermitToSign = {
            domain,
            types,
            value,
        };
        return erc20PermitToSign;
    };
    async function getSignERC20Permit(buyerAddress, paymentIntentResponse, provider) {
        const contractAddress = paymentIntentResponse.contractAddress;
        const deadline = paymentIntentResponse.parameters['deadline'];
        const tokenAddress = paymentIntentResponse.parameters['paymentTokenAddress'];
        const amount = paymentIntentResponse.parameters['totalPrice'];
        if (!amount)
            throw new Error("No Amount set");
        const typeData = await getERC2612PermitTypeData(provider, tokenAddress, buyerAddress, contractAddress, amount, deadline);
        const permitType = { Permit: typeData.types.Permit };
        return { domain: typeData.domain, types: permitType, value: typeData.value };
    }
    async function buildPaymentTransaction(permitSignature, paymentIntentResponse, provider) {
        const contractAddress = paymentIntentResponse.contractAddress;
        const functionName = paymentIntentResponse.functionName;
        const func = paymentIntentResponse.functionSignature;
        const chain = paymentIntentResponse.chain;
        const chainId = chainInfo[chain].chainId;
        const splitPermitSignature = splitSignature(permitSignature);
        const permitTransactionParams = [
            splitPermitSignature.v,
            splitPermitSignature.r,
            splitPermitSignature.s,
        ];
        const orderPropertiesToExtract = [
            'paymentTokenAddress',
            'fromAddress',
            'transfers',
            'totalPrice',
            'deadline',
        ];
        const distributionParams = [];
        orderPropertiesToExtract.forEach(key => {
            // Check if the property exists in the object
            if (paymentIntentResponse.parameters.hasOwnProperty(key)) {
                // Retrieve the value and push it into the orderedParams array
                distributionParams.push(paymentIntentResponse.parameters[key]);
            }
        });
        const functionCall = { functionName, func, parameters: [...distributionParams, ...permitTransactionParams] };
        return getGaslessTxToSign(chainId, contractAddress, provider, functionCall);
    }
    async function getPaymentTransactionSignatureData(wallet, intent) {
        const buyersAddress = await wallet.getAddress();
        const permitTypeData = await getSignERC20Permit(buyersAddress, intent, wallet);
        const permitTxSignature = await wallet._signTypedData(permitTypeData.domain, permitTypeData.types, permitTypeData.value);
        const paymentMetaTransaction = await buildPaymentTransaction(permitTxSignature, intent, wallet);
        // Sign meta transaction for token distribution.
        const paymentTxSignature = await wallet._signTypedData(paymentMetaTransaction.domain, paymentMetaTransaction.types, paymentMetaTransaction.value);
        const metaTransactionDeadline = paymentMetaTransaction.value.userDeadline;
        return { paymentTxSignature, permitTxSignature, metaTransactionDeadline };
    }
    const chainInfo = {
        'polygon': {
            chainId: 137
        }
    };

    exports.MAX_INT = MAX_INT;
    exports.POLYGON_USDC = POLYGON_USDC;
    exports.buildPaymentTransaction = buildPaymentTransaction;
    exports.getERC2612PermitTypeData = getERC2612PermitTypeData;
    exports.getPaymentTransactionSignatureData = getPaymentTransactionSignatureData;
    exports.getSignERC20Permit = getSignERC20Permit;

}));
