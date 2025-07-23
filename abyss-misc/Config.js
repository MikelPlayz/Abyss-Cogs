"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
const Files_1 = require("./Files");
class Config {
    constructor(path) {
        this.path = path;
        this.load();
    }
    get() {
        return this.data;
    }
    set(data) {
        this.data = data;
    }
    save() {
        Files_1.Files.clear(this.path);
        Files_1.Files.write(this.path, JSON.stringify(this.data, null, "\t"));
    }
    load() {
        this.data = JSON.parse(Files_1.Files.read(this.path));
    }
}
exports.Config = Config;
