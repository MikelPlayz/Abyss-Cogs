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

        self.config = Config.get_conf(
            self,
            identifier=982734982734,
            force_registration=True,
        )

        self.config.register_guild(
            channel_id=None,
        )

    async def owner_only_check(self, interaction: discord.Interaction) -> bool:
        if await self.bot.is_owner(interaction.user):
            return True

        if not interaction.response.is_done():
            await interaction.response.send_message(
                "Only the bot owner can use this command.",
                ephemeral=True,
            )

        return False

    @app_commands.command(
        name="archive_set_channel",
        description="Set the channel where HTML archives are sent.",
    )
    async def archive_set_channel(
        self,
        interaction: discord.Interaction,
        channel: discord.TextChannel,
    ):
        if not await self.owner_only_check(interaction):
            return

        await self.config.guild(interaction.guild).channel_id.set(channel.id)

        await interaction.response.send_message(
            f"Archive output channel set to {channel.mention}",
            ephemeral=True,
        )

    @app_commands.command(
        name="archive_channel",
        description="Archive this channel into an HTML transcript.",
    )
    @app_commands.describe(
        max_messages="Maximum amount of messages to archive"
    )
    async def archive_channel(
        self,
        interaction: discord.Interaction,
        max_messages: int | None = None,
    ):
        if not await self.owner_only_check(interaction):
            return

        await interaction.response.defer(
            ephemeral=True,
            thinking=True,
        )

        guild = interaction.guild
        source_channel = interaction.channel

        if not isinstance(source_channel, discord.TextChannel):
            await interaction.followup.send(
                "This command can only be used in text channels.",
                ephemeral=True,
            )
            return

        output_channel_id = await self.config.guild(guild).channel_id()

        if output_channel_id is None:
            await interaction.followup.send(
                "No archive channel configured. Use `/archive_set_channel` first.",
                ephemeral=True,
            )
            return

        output_channel = guild.get_channel(output_channel_id)

        if output_channel is None:
            await interaction.followup.send(
                "Configured archive channel no longer exists.",
                ephemeral=True,
            )
            return

        messages = []

        async for message in source_channel.history(
            limit=max_messages,
            oldest_first=True,
            before=interaction.created_at,
        ):
            messages.append(message)

        html_output = self.build_html(
            guild=guild,
            channel=source_channel,
            messages=messages,
        )

        filename = (
            f"archive-"
            f"{source_channel.name}-"
            f"{source_channel.id}.html"
        )

        file = discord.File(
            io.BytesIO(html_output.encode("utf-8")),
            filename=filename,
        )

        await output_channel.send(
            content=f"Archive for {source_channel.mention}",
            file=file,
            allowed_mentions=discord.AllowedMentions.none(),
        )

        await interaction.followup.send(
            f"Archived {len(messages)} messages from {source_channel.mention}",
            ephemeral=True,
        )

    def build_html(self, guild, channel, messages):
        rows = []

        for message in messages:
            timestamp = message.created_at.astimezone(
                timezone.utc
            ).strftime("%Y-%m-%d %H:%M:%S UTC")

            author_name = html.escape(str(message.author))
            avatar_url = message.author.display_avatar.url

            content = html.escape(
                message.clean_content or ""
            ).replace("\n", "<br>")

            attachment_html = ""

            if message.attachments:
                attachment_links = []

                for attachment in message.attachments:
                    attachment_links.append(
                        f'<a href="{html.escape(attachment.url)}" '
                        f'target="_blank">'
                        f'{html.escape(attachment.filename)}</a>'
                    )

                attachment_html = (
                    "<div class='attachments'>"
                    "Attachments: "
                    + ", ".join(attachment_links)
                    + "</div>"
                )

            embed_html = ""

            if message.embeds:
                embed_html = (
                    f"<div class='embeds'>"
                    f"{len(message.embeds)} embed(s)"
                    f"</div>"
                )

            rows.append(
                f"""
<div class="message">
    <img class="avatar" src="{avatar_url}">
    <div class="body">
        <div class="meta">
            <span class="author">{author_name}</span>
            <span class="time">{timestamp}</span>
        </div>

        <div class="content">
            {content}
        </div>

        {attachment_html}
        {embed_html}
    </div>
</div>
"""
            )

        return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">

<title>
Archive - {html.escape(channel.name)}
</title>

<style>
body {{
    background-color: #313338;
    color: #dbdee1;
    font-family: Arial, sans-serif;
    padding: 20px;
}}

.header {{
    border-bottom: 1px solid #4e5058;
    padding-bottom: 15px;
    margin-bottom: 20px;
}}

.message {{
    display: flex;
    gap: 12px;
    padding: 10px 0;
}}

.avatar {{
    width: 40px;
    height: 40px;
    border-radius: 50%;
}}

.body {{
    flex: 1;
}}

.meta {{
    margin-bottom: 4px;
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
    margin-top: 3px;
    white-space: normal;
}}

.attachments {{
    margin-top: 8px;
    font-size: 14px;
}}

.embeds {{
    margin-top: 8px;
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

    <h2>#{html.escape(channel.name)}</h2>

    <p>
        {len(messages)} messages archived.
    </p>
</div>

{''.join(rows)}

</body>
</html>
"""