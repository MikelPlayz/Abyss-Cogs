"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Embeds = void 0;
const Main_1 = require("./Main");
class Embeds {
    // TEMPLATE
    static template(title, description = "", color = this.neutral) {
        return {
            "title": title,
            "description": description,
            "color": color,
            "thumbnail": { "url": `https://cravatar.eu/helmavatar/${Main_1.config.get().credentials.username}/24.png` }
        };
    }
    // CONNECTION
    static connected() { return this.template(`<#${Main_1.config.get().discord.chatChannelID}> Connected`); }
    static alreadyConnected() { return this.template("Already Connected"); }
    static attemptedConnection() { return this.template("Attempted Connection", `<#${Main_1.config.get().discord.infoChannelID}>`); }
    static disconnected(info = undefined) {
        if (!info) {
            return this.template(`<#${Main_1.config.get().discord.chatChannelID}> Disconnected`);
        }
        const embed = this.template(`<#${Main_1.config.get().discord.chatChannelID}> ${info.type}`);
        embed.fields = [{ "name": "Reason", "value": info.message }];
        return embed;
    }
    static alreadyDisconnected() { return this.template("Already Disconnected"); }
    // MISC
    static death() { return this.template(`<#${Main_1.config.get().discord.chatChannelID}> Died`); }
    static messageSent() { return this.template("Message Sent"); }
    static exiting() { return this.template("Exiting"); }
    // AUTO-RECONNECT
    static autoReconnectEnabled() { return this.template("Auto-Reconnect Enabled"); }
    static autoReconnectDisabled() { return this.template("Auto-Reconnect Disabled"); }
    static autoReconnectIntervalSet() { return this.template("Auto-Reconnect Interval Set"); }
    // STATUS
    static online() { return this.template("Online"); }
    static offline() { return this.template("Offline"); }
    // SERVER
    static hostSet() { return this.template("Host Set"); }
    static portSet() { return this.template("Port Set"); }
    static versionSet() { return this.template("Version Set"); }
    // COMMAND
    static commandExecuted() { return this.template("Command Executed"); }
    static commandNotFound() { return this.template("Command Not Found"); }
    // VALIDATION
    static invalidOption(option) { return this.template(`Invalid ${option}`); }
    static invalidArguments() { return this.template("Invalid Arguments"); }
    // DROP
    static inventoryDropped() { return this.template("Dropping Inventory"); }
    static armorDropped() { return this.template("Dropping Armor"); }
    static offhandDropped() { return this.template("Dropping Offhand"); }
    static mainhandDropped() { return this.template("Dropping Mainhand"); }
    // ACTION
    static actionStarted() { return this.template("Action Started"); }
    static actionStopped() { return this.template("Action Stopped"); }
    // LOGGER
    static loggerEnabled() { return this.template("Logger Enabled"); }
    static loggerDisabled() { return this.template("Logger Disabled"); }
    static loggerPath() { return this.template("Logger Path"); }
    // DASHBOARD
    static emptyDashboard() { return this.template("Dashboard"); }
    // FILTER
    static filterEnabled() { return this.template("Filter Enabled"); }
    static filterAlreadyEnabled() { return this.template("Filter Already Enabled"); }
    static filterDisabled() { return this.template("Filter Disabled"); }
    static filterAlreadyDisabled() { return this.template("Filter Already Disabled"); }
    static filterReset() { return this.template("Filter Reset"); }
    static filterEmpty() { return this.template("Filter Empty"); }
    static filterAdded(item) { return this.template(`\`${item}\` Added`); }
    static filterAlreadyAdded(item) { return this.template(`\`${item}\` Already Added`); }
    static filterRemoved(item) { return this.template(`\`${item}\` Removed`); }
    static filterAlreadyRemoved(item) { return this.template(`\`${item}\` Already Removed`); }
    static filterPasted() { return this.template("Filter Pasted"); }
    static filterList(items) {
        let formatted = "";
        for (let i = 0; i < items.length - 1; i++) {
            formatted += `**\`${items[i]}\`**,\n`;
        }
        return this.template("Filter", formatted + `**\`${items[items.length - 1]}\`**`);
    }
    // ADVERTISEMENTS
    static adEnabled() { return this.template("Advertisement Enabled"); }
    static adAlreadyEnabled() { return this.template("Advertisement Already Enabled"); }
    static adDisabled() { return this.template("Advertisement Disabled"); }
    static adAlreadyDisabled() { return this.template("Advertisement Enabled"); }
    static adsReset() { return this.template("Advertisements Reset"); }
    static adsEmpty() { return this.template("Advertisements Empty"); }
    static adNotFound() { return this.template("Advertisement Not Found"); }
    static adAdded(name) { return this.template(`\`${name}\` Advertisement Added`); }
    static adAlreadyAdded(name) { return this.template(`\`${name}\` Advertisement Already Added`); }
    static adRemoved(name) { return this.template(`\`${name}\` Advertisement Removed`); }
    static adAlreadyRemoved(name) { return this.template(`\`${name}\` Advertisement Already Removed`); }
    static adEdited(name) { return this.template(`\`${name}\` Advertisement Edited`); }
    static adInfo(ad) { return this.template(ad.name, `**\`${ad.interval / 60000}m + ...${ad.randomizer / 60000}m\`**\n${ad.text}\n\n`); }
    static adList(ads) {
        let formatted = "";
        for (const ad of ads) {
            formatted += `**__${ad.name}__**: ` + this.adInfo(ad).description;
        }
        return this.template("Advertisements", formatted);
    }
}
exports.Embeds = Embeds;
Embeds.green = 2817792;
Embeds.red = 16711680;
Embeds.neutral = 7803166;
