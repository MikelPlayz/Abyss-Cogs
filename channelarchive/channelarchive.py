import html
import io
from datetime import timezone

import discord
from discord import app_commands
from redbot.core import Config, commands


class ChannelArchive(commands.Cog):
    """Archive a channel into an HTML transcript."""

    def __init__(self, bot):
        self.bot = bot
        self.config = Config.get_conf(self, identifier=982734982734, force_registration=True)
        self.config.guild(channel_id=None)

    async def _owner_only(self, interaction: discord.Interaction) -> bool:
        if await self.bot.is_owner(interaction.user):
            return True

        await interaction.response.send_message(
            "Only the bot owner can use this command.",
            ephemeral=True,
        )
        return False

    @app_commands.command(
        name="archive_set_channel",
        description="Set the channel where HTML archives will be sent.",
    )
    async def archive_set_channel(
        self,
        interaction: discord.Interaction,
        channel: discord.TextChannel,
    ):
        if not await self._owner_only(interaction):
            return

        await self.config.guild(interaction.guild).channel_id.set(channel.id)

        await interaction.response.send_message(
            f"Archive output channel set to {channel.mention}.",
            ephemeral=True,
        )

    @app_commands.command(
        name="archive_channel",
        description="Archive this channel into an HTML transcript.",
    )
    async def archive_channel(
        self,
        interaction: discord.Interaction,
        max_messages: int | None = None,
    ):
        if not await self._owner_only(interaction):
            return

        await interaction.response.defer(ephemeral=True, thinking=True)

        guild = interaction.guild
        source_channel = interaction.channel

        output_id = await self.config.guild(guild).channel_id()
        if not output_id:
            await interaction.followup.send(
                "No archive output channel is configured. Use `/archive_set_channel` first.",
                ephemeral=True,
            )
            return

        output_channel = guild.get_channel(output_id)
        if not output_channel:
            await interaction.followup.send(
                "The configured archive output channel no longer exists.",
                ephemeral=True,
            )
            return

        messages = []
        async for msg in source_channel.history(
            limit=max_messages,
            oldest_first=True,
            before=interaction.created_at,
        ):
            messages.append(msg)

        html_text = self._build_html(
            guild=guild,
            channel=source_channel,
            messages=messages,
        )

        filename = f"archive-{source_channel.id}.html"
        file = discord.File(
            io.BytesIO(html_text.encode("utf-8")),
            filename=filename,
        )

        await output_channel.send(
            content=f"Archive for {source_channel.mention}",
            file=file,
            allowed_mentions=discord.AllowedMentions.none(),
        )

        await interaction.followup.send(
            f"Archived `{source_channel}` with `{len(messages)}` messages.",
            ephemeral=True,
        )

    def _build_html(self, guild, channel, messages):
        rows = []

        for msg in messages:
            created = msg.created_at.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
            author = html.escape(str(msg.author))
            avatar = msg.author.display_avatar.url
            content = html.escape(msg.clean_content).replace("\n", "<br>")

            attachments = ""
            if msg.attachments:
                links = []
                for a in msg.attachments:
                    links.append(
                        f'<a href="{html.escape(a.url)}" target="_blank">'
                        f'{html.escape(a.filename)}</a>'
                    )
                attachments = "<div class='attachments'>Attachments: " + ", ".join(links) + "</div>"

            embeds = ""
            if msg.embeds:
                embeds = f"<div class='embeds'>{len(msg.embeds)} embed(s)</div>"

            rows.append(f"""
            <div class="message">
                <img class="avatar" src="{avatar}">
                <div class="body">
                    <div>
                        <span class="author">{author}</span>
                        <span class="time">{created}</span>
                    </div>
                    <div class="content">{content}</div>
                    {attachments}
                    {embeds}
                </div>
            </div>
            """)

        return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Archive - {html.escape(str(channel))}</title>
<style>
body {{
    background: #313338;
    color: #dbdee1;
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 24px;
}}
h1, h2 {{
    margin: 0 0 8px 0;
}}
.header {{
    border-bottom: 1px solid #4e5058;
    margin-bottom: 24px;
    padding-bottom: 16px;
}}
.message {{
    display: flex;
    gap: 12px;
    padding: 8px 0;
}}
.avatar {{
    width: 40px;
    height: 40px;
    border-radius: 50%;
}}
.author {{
    font-weight: bold;
    color: #ffffff;
}}
.time {{
    color: #949ba4;
    font-size: 12px;
    margin-left: 8px;
}}
.content {{
    margin-top: 4px;
    white-space: normal;
}}
.attachments, .embeds {{
    margin-top: 6px;
    color: #b5bac1;
    font-size: 14px;
}}
a {{
    color: #00a8fc;
}}
</style>
</head>
<body>
<div class="header">
    <h1>{html.escape(guild.name)}</h1>
    <h2>#{html.escape(str(channel))}</h2>
    <p>{len(messages)} messages archived.</p>
</div>
{''.join(rows)}
</body>
</html>
"""