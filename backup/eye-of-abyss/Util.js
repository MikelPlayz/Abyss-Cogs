"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Util = void 0;
class Util {
    static random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}
exports.Util = Util;
