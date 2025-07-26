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
  console.log(`✅ Logged in as ${client.user.tag} Created by Mikel_Playz!`);

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

// 📤 Member left (with kick check)
client.on('guildMemberRemove', async member => {
  const leaveTime = moment().tz(config.timezone).format('YYYY-MM-DD HH:mm:ss z');
  const joinTime = moment(member.joinedAt).tz(config.timezone).format('YYYY-MM-DD HH:mm:ss z');

  let reasonText = "🚪 Left voluntarily";

  try {
    const logs = await member.guild.fetchAuditLogs({
      limit: 5,
      type: AuditLogEvent.MemberKick
    });

    const kickLog = logs.entries.find(entry =>
      entry.target?.id === member.id &&
      Date.now() - entry.createdTimestamp < 5000
    );

    if (kickLog) {
      const { executor, reason } = kickLog;
      reasonText = `❌ Kicked by **${executor.tag}**${reason ? ` — ${reason}` : ''}`;
    }
  } catch (err) {
    console.error("Audit log fetch error:", err);
  }

  const embed = new EmbedBuilder()
    .setTitle("📤 Member Left")
    .setColor(Colors.Red)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: "User", value: `${member.user.tag} (<@${member.id}>)`, inline: false },
      { name: "Joined At", value: joinTime, inline: true },
      { name: "Left At", value: leaveTime, inline: true },
      { name: "Reason", value: reasonText, inline: false }
    )
    .setFooter({ text: `User ID: ${member.id}` })
    .setTimestamp();

  if (channels.leave) {
    channels.leave.send({ embeds: [embed] });
  }
});

client.login(config.token);
