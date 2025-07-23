"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrencySystem = void 0;
const time_utilities_1 = require("@sapphire/time-utilities");
const Main_1 = require("./Main");
const Util_1 = require("./Util");
class CurrencySystem {
    sheet;
    constructor(sheet) {
        this.sheet = sheet;
    }
    async add(currency, from, to, amount, reason) {
        if (currency === "all") {
            for (let i = 0; i < Main_1.config.get().currencies.length; i++) {
                await this.add(Main_1.config.get().currencies[i], from, to, amount, reason);
            }
            return;
        }
        const worksheet = await this.sheet.worksheet(Util_1.Util.capitalize(currency));
        await worksheet.addRow({
            "Awarded By": from,
            "Awarded To": to,
            "Amount": amount,
            "Reason": reason,
            "Time": new time_utilities_1.Timestamp("MM-DD-YYYY HH:mm:ss").displayUTC()
        });
    }
    async remove(currency, from, to, amount, reason) {
        await this.add(currency, from, to, -amount, reason);
    }
    async balance(currency, of) {
        const rows = await this.sheet.rows(Util_1.Util.capitalize(currency));
        for (let i = 0; i < rows.length; i++) {
            if (rows[i]["Name"] === of) {
                return rows[i]["Total"];
            }
        }
        return 0;
    }
}
exports.CurrencySystem = CurrencySystem;
