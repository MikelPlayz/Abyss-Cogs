const { Client, GatewayIntentBits, AuditLogEvent, EmbedBuilder, Colors } = require('discord.js');
const { CronJob } = require('cron');
const moment = require('moment-timezone');
const config = require('./config.json');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences
  ]
});

const channels = {
  alert: null,
  join: null,
  leave: null
};

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag} Created by MikelPlayz/makattac`);

  try {
    // Fetch channels
    channels.alert = await client.channels.fetch(config.alertChannelId).catch(() => null);
    channels.join = await client.channels.fetch(config.joinChannelId).catch(() => null);
    channels.leave = await client.channels.fetch(config.leaveChannelId).catch(() => null);

    if (!channels.alert) console.warn("⚠️ Alert channel not found or inaccessible.");
    if (!channels.join) console.warn("⚠️ Join channel not found or inaccessible.");
    if (!channels.leave) console.warn("⚠️ Leave channel not found or inaccessible.");

    // Scheduled messages
    if (channels.alert) {
      config.messages.forEach(({ time, message }) => {
        const [hour, minute] = time.split(':').map(Number);

        const job = new CronJob(
          `${minute} ${hour} * * *`,
          () => {
            const now = moment().tz(config.timezone);
            console.log(`[${now.format()}] Sending scheduled alert: "${message}"`);
            channels.alert.send(message).catch(console.error);
          },
          null,
          true,
          config.timezone
        );

        console.log(`Scheduled message: "${message}" at ${time} (${config.timezone})`);
      });
    }
  } catch (err) {
    console.error("❌ Channel setup error:", err);
  }
});

// 📥 Member joined
client.on('guildMemberAdd', async member => {
  const joinTime = moment().tz(config.timezone).format('YYYY-MM-DD HH:mm:ss z');
  const createdAt = member.user.createdAt;
  let possibleAlt = false;

  // Check for other accounts created within 5 minutes
  const closeAccounts = member.guild.members.cache.filter(m =>
    m.id !== member.id &&
    Math.abs(m.user.createdTimestamp - member.user.createdTimestamp) < 5 * 60 * 1000
  );

  if (closeAccounts.size > 0) {
    possibleAlt = true;
  }

  const embed = new EmbedBuilder()
    .setTitle("📥 Member Joined")
    .setColor(Colors.Red)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: "User", value: `${member.user.tag} (<@${member.id}>)`, inline: false },
      { name: "Joined At", value: joinTime, inline: true },
      { name: "Account Created", value: moment(createdAt).tz(config.timezone).format('YYYY-MM-DD HH:mm:ss z'), inline: true }
    )
    .setFooter({ text: `User ID: ${member.id}` })
    .setTimestamp();

  if (possibleAlt) {
    embed.addFields({ name: "⚠️ Possible Alt Detected", value: `Account creation time is similar to other member(s). Investigate manually.` });
  }

  if (channels.join) channels.join.send({ embeds: [embed] });
});

// 📤 Member left (with kick check) (Trying to make better)
client.on('guildMemberRemove', async member => {
  const leaveTime = moment().tz(config.timezone).format('YYYY-MM-DD HH:mm:ss z');
  let leaveReason = "Voluntary leave";

  try {
    const fetchedLogs = await member.guild.fetchAuditLogs({
      limit: 1,
      type: Discord.AuditLogEvent.MemberBanAdd
    });
    const banLog = fetchedLogs.entries.first();

    if (banLog && banLog.target.id === member.id && (Date.now() - banLog.createdTimestamp) < 5000) {
      leaveReason = `🚫 Banned by ${banLog.executor.tag}`;
    } else {
      const kickLogs = await member.guild.fetchAuditLogs({
        limit: 1,
        type: Discord.AuditLogEvent.MemberKick
      });
      const kickLog = kickLogs.entries.first();
      if (kickLog && kickLog.target.id === member.id && (Date.now() - kickLog.createdTimestamp) < 5000) {
        leaveReason = `🔨 Kicked by ${kickLog.executor.tag}`;
      }
    }
  } catch (err) {
    console.error("Error fetching audit logs:", err);
  }

  const embed = new EmbedBuilder()
    .setTitle("📤 Member Left")
    .setColor(Colors.Red)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: "User", value: `${member.user.tag} (<@${member.id}>)`, inline: false },
      { name: "Left At", value: leaveTime, inline: true },
      { name: "Reason", value: leaveReason, inline: true }
    )
    .setFooter({ text: `User ID: ${member.id}` })
    .setTimestamp();

  if (channels.leave) channels.leave.send({ embeds: [embed] });
});
// Login
client.login(config.token);
