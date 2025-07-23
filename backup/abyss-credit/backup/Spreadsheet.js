"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Spreadsheet = void 0;
const google_spreadsheet_1 = require("google-spreadsheet");
class Spreadsheet {
    sheet;
    clientEmail;
    privateKey;
    constructor(id, clientEmail, privateKey) {
        this.sheet = new google_spreadsheet_1.GoogleSpreadsheet(id);
        this.clientEmail = clientEmail;
        this.privateKey = privateKey.split(String.raw `\n`).join("\n");
    }
    async worksheet(title) {
        await this.sheet.useServiceAccountAuth({ client_email: this.clientEmail, private_key: this.privateKey });
        await this.sheet.loadInfo();
        return this.sheet.sheetsByTitle[title];
    }
    async rows(title) {
        return (await this.worksheet(title)).getRows().then();
    }
}
exports.Spreadsheet = Spreadsheet;
