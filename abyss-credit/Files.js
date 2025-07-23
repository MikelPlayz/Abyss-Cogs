"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Files = void 0;
const fs_1 = require("fs");
class Files {
    static read(path) {
        return (0, fs_1.readFileSync)(path, "utf-8").toString();
    }
    static readDirectory(path) {
        return (0, fs_1.readdirSync)(path, "utf-8");
    }
    static write(path, data) {
        if (!this.exists(path)) {
            this.create(path);
        }
        (0, fs_1.appendFileSync)(path, data, "utf-8");
    }
    static create(path) {
        (0, fs_1.writeFileSync)(path, "", "utf-8");
    }
    static delete(path) {
        (0, fs_1.unlinkSync)(path);
    }
    static exists(path) {
        return (0, fs_1.existsSync)(path);
    }
}
exports.Files = Files;
