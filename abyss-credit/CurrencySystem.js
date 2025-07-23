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
exports.CurrencySystem = void 0;
const time_utilities_1 = require("@sapphire/time-utilities");
const Main_1 = require("./Main");
const Util_1 = require("./Util");
class CurrencySystem {
    constructor(sheet) {
        this.sheet = sheet;
    }
    add(currency, from, to, amount, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            if (currency === "all") {
                for (let i = 0; i < Main_1.config.get().currencies.length; i++) {
                    yield this.add(Main_1.config.get().currencies[i], from, to, amount, reason);
                }
                return;
            }
            const worksheet = yield this.sheet.worksheet(Util_1.Util.capitalize(currency));
            yield worksheet.addRow({ "Awarded By": from, "Awarded To": to, "Amount": amount, "Reason": reason, "Time": new time_utilities_1.Timestamp("MM-DD-YYYY HH:mm:ss").displayUTC() });
        });
    }
    remove(currency, from, to, amount, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.add(currency, from, to, -amount, reason);
        });
    }
    balance(currency, of) {
        return __awaiter(this, void 0, void 0, function* () {
            const rows = yield this.sheet.rows(Util_1.Util.capitalize(currency));
            for (let i = 0; i < rows.length; i++) {
                if (rows[i].get("Name") === of) {
                    return rows[i].get("Total");
                }
            }
            return 0;
        });
    }
}
exports.CurrencySystem = CurrencySystem;