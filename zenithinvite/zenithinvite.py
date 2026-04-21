from __future__ import annotations

import re
from typing import Optional

import discord
from redbot.core import commands, Config
from redbot.core.bot import Red


DEFAULT_IGN_REGEX = r"^[A-Za-z0-9_]{1,16}$"


class InviteIGNModal(discord.ui.Modal):
    def __init__(self, cog: "ZenithInvite", guild_id: int):
        super().__init__(title="Request an Invite")
        self.cog = cog
        self.guild_id = guild_id

        self.ign = discord.ui.TextInput(
            label="In-Game Name",
            placeholder="Enter your in-game username",
            required=True,
            min_length=1,
            max_length=64,
        )
        self.add_item(self.ign)

    async def on_submit(self, interaction: discord.Interaction) -> None:
        guild = interaction.guild
        if guild is None or guild.id != self.guild_id:
            await interaction.response.send_message(
                "This form can only be used in the server it belongs to.",
                ephemeral=True,
            )
            return

        ign = str(self.ign.value).strip()

        guild_conf = self.cog.config.guild(guild)
        validation_enabled = await guild_conf.validation_enabled()
        ign_regex = await guild_conf.ign_regex()
        ign_max_length = await guild_conf.ign_max_length()

        if len(ign) > ign_max_length:
            await interaction.response.send_message(
                f"That username is too long. Maximum length is `{ign_max_length}` characters.",
                ephemeral=True,
            )
            return

        if validation_enabled:
            try:
                compiled = re.compile(ign_regex)
            except re.error:
                await interaction.response.send_message(
                    "The configured IGN validation regex is invalid. "
                    "Please contact an admin.",
                    ephemeral=True,
                )
                return

            if not compiled.fullmatch(ign):
                await interaction.response.send_message(
                    "That username does not match the allowed format for this server.",
                    ephemeral=True,
                )
                return

        command_channel_id = await guild_conf.command_channel_id()
        command_template = await guild_conf.command_template()
        success_message = await guild_conf.success_message()

        if not command_channel_id:
            await interaction.response.send_message(
                "This invite panel is not fully configured yet. "
                "An admin needs to set the command channel.",
                ephemeral=True,
            )
            return

        if not command_template:
            await interaction.response.send_message(
                "This invite panel is not fully configured yet. "
                "An admin needs to set the command template.",
                ephemeral=True,
            )
            return

        command_channel = self.cog.bot.get_channel(command_channel_id)
        if not isinstance(command_channel, discord.TextChannel):
            try:
                fetched = await self.cog.bot.fetch_channel(command_channel_id)
            except (discord.NotFound, discord.Forbidden, discord.HTTPException):
                fetched = None

            if isinstance(fetched, discord.TextChannel):
                command_channel = fetched
            else:
                await interaction.response.send_message(
                    "The configured command channel could not be found.",
                    ephemeral=True,
                )
                return

        try:
            rendered_command = command_template.format(
                ign=ign,
                user_id=interaction.user.id,
                user_name=str(interaction.user),
                user_mention=interaction.user.mention,
                guild_id=guild.id,
                guild_name=guild.name,
                source_guild_id=guild.id,
                source_guild_name=guild.name,
                source_channel_id=interaction.channel.id if interaction.channel else 0,
                source_channel_name=interaction.channel.name if interaction.channel else "unknown",
            )
        except Exception as e:
            await interaction.response.send_message(
                f"The configured command template is invalid: `{e}`",
                ephemeral=True,
            )
            return

        try:
            await command_channel.send(rendered_command)
        except discord.Forbidden:
            await interaction.response.send_message(
                "I do not have permission to send messages in the configured command channel.",
                ephemeral=True,
            )
            return
        except discord.HTTPException:
            await interaction.response.send_message(
                "I tried to send the command, but Discord rejected it.",
                ephemeral=True,
            )
            return

        try:
            reply = success_message.format(ign=ign)
        except Exception:
            reply = f"Your request has been submitted for `{ign}`."

        await interaction.response.send_message(reply, ephemeral=True)


class InvitePanelView(discord.ui.View):
    def __init__(self, cog: "ZenithInvite", guild_id: int, button_label: str = "Request Invite"):
        super().__init__(timeout=None)
        self.cog = cog
        self.guild_id = guild_id

        for item in self.children:
            if isinstance(item, discord.ui.Button) and item.custom_id == "zenithinvite:request_button":
                item.label = button_label

    @discord.ui.button(
        label="Request Invite",
        style=discord.ButtonStyle.primary,
        custom_id="zenithinvite:request_button",
    )
    async def request_button(
        self,
        interaction: discord.Interaction,
        button: discord.ui.Button,
    ) -> None:
        if interaction.guild is None:
            await interaction.response.send_message(
                "This button can only be used inside a server.",
                ephemeral=True,
            )
            return

        modal = InviteIGNModal(self.cog, self.guild_id)
        await interaction.response.send_modal(modal)


class ZenithInvite(commands.Cog):
    """Invite request panel for Zenith integrations."""

    def __init__(self, bot: Red):
        self.bot = bot
        self.config = Config.get_conf(self, identifier=510294882104, force_registration=True)

        default_guild = {
            "panel_channel_id": None,
            "command_channel_id": None,
            "panel_message_id": None,
            "command_template": "invite {ign}",
            "embed_title": "Server Invite Request",
            "embed_description": (
                "Press the button below and enter your in-game name to request an invite."
            ),
            "embed_color": 0xFF0000,
            "button_label": "Request Invite",
            "success_message": (
                "Your request has been submitted for `{ign}`. "
                "If the integration is working, it should process shortly."
            ),
            "validation_enabled": True,
            "ign_regex": DEFAULT_IGN_REGEX,
            "ign_max_length": 64,
        }

        self.config.register_guild(**default_guild)

    async def cog_load(self) -> None:
        self.bot.add_view(InvitePanelView(self, 0))

    def _build_embed(
        self,
        title: str,
        description: str,
        color: int,
        requester: Optional[discord.abc.User] = None,
    ) -> discord.Embed:
        embed = discord.Embed(
            title=title,
            description=description,
            color=color,
            timestamp=discord.utils.utcnow(),
        )
        if requester is not None:
            embed.set_footer(text=f"Requested by {requester}")
        return embed

    async def _get_panel_view(self, guild_id: int, button_label: str) -> discord.ui.View:
        return InvitePanelView(self, guild_id, button_label)

    def _format_channel_ref(self, channel_id: Optional[int]) -> str:
        if not channel_id:
            return "Not set"

        channel = self.bot.get_channel(channel_id)
        if isinstance(channel, discord.TextChannel):
            return f"{channel.mention} (`{channel.id}` in **{channel.guild.name}**)"

        return f"`{channel_id}`"

    async def _resolve_text_channel(self, channel_id: int) -> Optional[discord.TextChannel]:
        channel = self.bot.get_channel(channel_id)
        if isinstance(channel, discord.TextChannel):
            return channel

        try:
            fetched = await self.bot.fetch_channel(channel_id)
        except (discord.NotFound, discord.Forbidden, discord.HTTPException):
            return None

        if isinstance(fetched, discord.TextChannel):
            return fetched
        return None

    @commands.group(name="zenithinvite")
    @commands.guild_only()
    @commands.admin_or_permissions(manage_guild=True)
    async def zenithinvite_group(self, ctx: commands.Context) -> None:
        """Configure the Zenith invite panel."""
        if ctx.invoked_subcommand is None:
            await ctx.send_help()

    @zenithinvite_group.command(name="setpanelchannel")
    async def set_panel_channel(
        self,
        ctx: commands.Context,
        channel: discord.TextChannel,
    ) -> None:
        """Set the channel where the invite panel will be posted."""
        await self.config.guild(ctx.guild).panel_channel_id.set(channel.id)
        await ctx.send(f"Panel channel set to {channel.mention}")

    @zenithinvite_group.command(name="setcommandchannel")
    async def set_command_channel(
        self,
        ctx: commands.Context,
        channel_id: int,
    ) -> None:
        """Set the cross-server command destination channel by ID."""
        channel = await self._resolve_text_channel(channel_id)
        if not isinstance(channel, discord.TextChannel):
            await ctx.send("I could not find a text channel with that ID.")
            return

        me = channel.guild.me
        if me is None:
            await ctx.send("I could not verify my permissions in that server.")
            return

        perms = channel.permissions_for(me)
        if not perms.send_messages:
            await ctx.send(
                f"I found {channel.mention} in **{channel.guild.name}**, "
                "but I do not have permission to send messages there."
            )
            return

        await self.config.guild(ctx.guild).command_channel_id.set(channel.id)
        await ctx.send(
            f"Command channel set to {channel.mention} (`{channel.id}`) in **{channel.guild.name}**"
        )

    @zenithinvite_group.command(name="setcommand")
    async def set_command(
        self,
        ctx: commands.Context,
        *,
        template: str,
    ) -> None:
        """Set the command template. Must include {ign}."""
        if "{ign}" not in template:
            await ctx.send("The command template must include `{ign}`.")
            return

        await self.config.guild(ctx.guild).command_template.set(template)
        await ctx.send(f"Command template set to:\n`{template}`")

    @zenithinvite_group.command(name="setvalidation")
    async def set_validation(self, ctx: commands.Context, enabled: bool) -> None:
        """Enable or disable IGN validation entirely."""
        await self.config.guild(ctx.guild).validation_enabled.set(enabled)
        await ctx.send(f"IGN validation set to `{enabled}`")

    @zenithinvite_group.command(name="setignregex")
    async def set_ign_regex(self, ctx: commands.Context, *, pattern: str) -> None:
        """Set the regex used for username validation."""
        try:
            re.compile(pattern)
        except re.error as e:
            await ctx.send(f"That regex is invalid: `{e}`")
            return

        await self.config.guild(ctx.guild).ign_regex.set(pattern)
        await ctx.send(f"IGN regex updated to:\n`{pattern}`")

    @zenithinvite_group.command(name="resetignregex")
    async def reset_ign_regex(self, ctx: commands.Context) -> None:
        """Reset the IGN regex to the default Java-safe pattern."""
        await self.config.guild(ctx.guild).ign_regex.set(DEFAULT_IGN_REGEX)
        await ctx.send(f"IGN regex reset to default:\n`{DEFAULT_IGN_REGEX}`")

    @zenithinvite_group.command(name="setmaxlength")
    async def set_max_length(self, ctx: commands.Context, length: int) -> None:
        """Set the max allowed username length."""
        if length < 1 or length > 128:
            await ctx.send("Max length must be between 1 and 128.")
            return

        await self.config.guild(ctx.guild).ign_max_length.set(length)
        await ctx.send(f"IGN max length set to `{length}`")

    @zenithinvite_group.command(name="settitle")
    async def set_title(self, ctx: commands.Context, *, title: str) -> None:
        await self.config.guild(ctx.guild).embed_title.set(title)
        await ctx.send("Embed title updated.")

    @zenithinvite_group.command(name="setdescription")
    async def set_description(self, ctx: commands.Context, *, description: str) -> None:
        await self.config.guild(ctx.guild).embed_description.set(description)
        await ctx.send("Embed description updated.")

    @zenithinvite_group.command(name="setbutton")
    async def set_button_label(self, ctx: commands.Context, *, label: str) -> None:
        label = label.strip()
        if not label:
            await ctx.send("Button label cannot be empty.")
            return

        if len(label) > 80:
            await ctx.send("Button label is too long.")
            return

        await self.config.guild(ctx.guild).button_label.set(label)
        await ctx.send(f"Button label set to `{label}`")

    @zenithinvite_group.command(name="setsuccess")
    async def set_success_message(self, ctx: commands.Context, *, message: str) -> None:
        await self.config.guild(ctx.guild).success_message.set(message)
        await ctx.send("Success message updated.")

    @zenithinvite_group.command(name="setcolor")
    async def set_color(self, ctx: commands.Context, color: str) -> None:
        cleaned = color.strip().replace("#", "")
        try:
            value = int(cleaned, 16)
        except ValueError:
            await ctx.send("That is not a valid hex color.")
            return

        await self.config.guild(ctx.guild).embed_color.set(value)
        await ctx.send(f"Embed color set to `#{value:06X}`")

    @zenithinvite_group.command(name="post")
    async def post_panel(self, ctx: commands.Context) -> None:
        guild_conf = self.config.guild(ctx.guild)

        panel_channel_id = await guild_conf.panel_channel_id()
        title = await guild_conf.embed_title()
        description = await guild_conf.embed_description()
        color = await guild_conf.embed_color()
        button_label = await guild_conf.button_label()

        if not panel_channel_id:
            await ctx.send("Set a panel channel first with `setpanelchannel`.")
            return

        panel_channel = ctx.guild.get_channel(panel_channel_id)
        if not isinstance(panel_channel, discord.TextChannel):
            await ctx.send("The configured panel channel could not be found in this server.")
            return

        embed = self._build_embed(title, description, color)
        view = await self._get_panel_view(ctx.guild.id, button_label)

        try:
            message = await panel_channel.send(embed=embed, view=view)
        except discord.Forbidden:
            await ctx.send("I do not have permission to send messages there.")
            return
        except discord.HTTPException:
            await ctx.send("Discord rejected the panel message.")
            return

        await guild_conf.panel_message_id.set(message.id)
        await ctx.send(f"Invite panel posted in {panel_channel.mention}")

    @zenithinvite_group.command(name="refresh")
    async def refresh_panel(self, ctx: commands.Context) -> None:
        guild_conf = self.config.guild(ctx.guild)

        panel_channel_id = await guild_conf.panel_channel_id()
        panel_message_id = await guild_conf.panel_message_id()
        title = await guild_conf.embed_title()
        description = await guild_conf.embed_description()
        color = await guild_conf.embed_color()
        button_label = await guild_conf.button_label()

        if not panel_channel_id or not panel_message_id:
            await ctx.send("No saved panel message exists yet. Use `post` first.")
            return

        panel_channel = ctx.guild.get_channel(panel_channel_id)
        if not isinstance(panel_channel, discord.TextChannel):
            await ctx.send("The configured panel channel could not be found in this server.")
            return

        try:
            message = await panel_channel.fetch_message(panel_message_id)
        except discord.NotFound:
            await ctx.send("The saved panel message no longer exists. Use `post` again.")
            return
        except discord.Forbidden:
            await ctx.send("I do not have permission to access the panel message.")
            return
        except discord.HTTPException:
            await ctx.send("I could not fetch the saved panel message.")
            return

        embed = self._build_embed(title, description, color)
        view = await self._get_panel_view(ctx.guild.id, button_label)

        try:
            await message.edit(embed=embed, view=view)
        except discord.Forbidden:
            await ctx.send("I do not have permission to edit that panel message.")
            return
        except discord.HTTPException:
            await ctx.send("Discord rejected the panel update.")
            return

        await ctx.send("Panel refreshed.")

    @zenithinvite_group.command(name="settings")
    async def settings(self, ctx: commands.Context) -> None:
        guild_conf = self.config.guild(ctx.guild)

        panel_channel_id = await guild_conf.panel_channel_id()
        command_channel_id = await guild_conf.command_channel_id()
        panel_message_id = await guild_conf.panel_message_id()
        command_template = await guild_conf.command_template()
        title = await guild_conf.embed_title()
        description = await guild_conf.embed_description()
        color = await guild_conf.embed_color()
        button_label = await guild_conf.button_label()
        success_message = await guild_conf.success_message()
        validation_enabled = await guild_conf.validation_enabled()
        ign_regex = await guild_conf.ign_regex()
        ign_max_length = await guild_conf.ign_max_length()

        panel_channel = ctx.guild.get_channel(panel_channel_id) if panel_channel_id else None

        msg = (
            f"**Panel channel:** {panel_channel.mention if panel_channel else 'Not set'}\n"
            f"**Command channel:** {self._format_channel_ref(command_channel_id)}\n"
            f"**Panel message ID:** `{panel_message_id or 'Not set'}`\n"
            f"**Command template:** `{command_template}`\n"
            f"**Validation enabled:** `{validation_enabled}`\n"
            f"**IGN regex:** `{ign_regex}`\n"
            f"**IGN max length:** `{ign_max_length}`\n"
            f"**Embed title:** {title}\n"
            f"**Embed description:** {description}\n"
            f"**Button label:** `{button_label}`\n"
            f"**Success message:** `{success_message}`\n"
            f"**Embed color:** `#{color:06X}`"
        )
        await ctx.send(msg)

    @zenithinvite_group.command(name="testcommand")
    async def test_command(self, ctx: commands.Context, ign: str) -> None:
        command_template = await self.config.guild(ctx.guild).command_template()

        try:
            rendered = command_template.format(
                ign=ign,
                user_id=ctx.author.id,
                user_name=str(ctx.author),
                user_mention=ctx.author.mention,
                guild_id=ctx.guild.id,
                guild_name=ctx.guild.name,
                source_guild_id=ctx.guild.id,
                source_guild_name=ctx.guild.name,
                source_channel_id=ctx.channel.id,
                source_channel_name=ctx.channel.name if hasattr(ctx.channel, "name") else "unknown",
            )
        except Exception as e:
            await ctx.send(f"Template error: `{e}`")
            return

        await ctx.send(f"Rendered command:\n`{rendered}`")