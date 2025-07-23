"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Spreadsheet = void 0;
const google_spreadsheet_1 = require("google-spreadsheet");
const google_auth_library_1 = require("google-auth-library");
class Spreadsheet {
    constructor(id, clientEmail, privateKey) {
        this.auth = new google_auth_library_1.JWT({ "email": clientEmail, "key": privateKey.split(String.raw `\n`).join("\n"), "scopes": ["https://www.googleapis.com/auth/spreadsheets"] });
        this.sheet = new google_spreadsheet_1.GoogleSpreadsheet(id, this.auth);
    }
    worksheet(title) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sheet.loadInfo();
            return this.sheet.sheetsByTitle[title];
        });
    }
    rows(title) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.worksheet(title)).getRows().then();
        });
    }
}
exports.Spreadsheet = Spreadsheet;
