from __future__ import annotations

import discord
from redbot.core import commands, Config
from redbot.core.bot import Red


class JoinLeave(commands.Cog):
    """Join/leave/kick/ban logging cog."""

    def __init__(self, bot: Red):
        self.bot = bot
        self.config = Config.get_conf(self, identifier=928374650192, force_registration=True)

        default_guild = {
            "join_channel_id": None,
            "leave_channel_id": None,
            "embed_color": 0xFF0000,
        }

        self.config.register_guild(**default_guild)

    @commands.group(name="joinleave")
    @commands.guild_only()
    @commands.admin_or_permissions(manage_guild=True)
    async def joinleave_group(self, ctx: commands.Context):
        """Configure join/leave logging."""
        if ctx.invoked_subcommand is None:
            await ctx.send_help()

    @joinleave_group.command(name="setjoin")
    async def set_join_channel(self, ctx: commands.Context, channel: discord.TextChannel):
        """Set the channel for join logs."""
        await self.config.guild(ctx.guild).join_channel_id.set(channel.id)
        await ctx.send(f"Join log channel set to {channel.mention}")

    @joinleave_group.command(name="setleave")
    async def set_leave_channel(self, ctx: commands.Context, channel: discord.TextChannel):
        """Set the channel for leave logs."""
        await self.config.guild(ctx.guild).leave_channel_id.set(channel.id)
        await ctx.send(f"Leave log channel set to {channel.mention}")

    @joinleave_group.command(name="setcolor")
    async def set_color(self, ctx: commands.Context, color: str):
        """
        Set the embed color.

        Example:
        `[p]joinleave setcolor #ff0000`
        `[p]joinleave setcolor ff0000`
        """
        color = color.strip().lower().replace("#", "")
        try:
            color_value = int(color, 16)
        except ValueError:
            await ctx.send("That is not a valid hex color.")
            return

        await self.config.guild(ctx.guild).embed_color.set(color_value)
        await ctx.send(f"Embed color set to `#{color.upper()}`")

    @joinleave_group.command(name="settings")
    async def settings(self, ctx: commands.Context):
        """Show current settings."""
        guild_conf = self.config.guild(ctx.guild)

        join_channel_id = await guild_conf.join_channel_id()
        leave_channel_id = await guild_conf.leave_channel_id()
        embed_color = await guild_conf.embed_color()

        join_channel = ctx.guild.get_channel(join_channel_id) if join_channel_id else None
        leave_channel = ctx.guild.get_channel(leave_channel_id) if leave_channel_id else None

        msg = (
            f"**Join channel:** {join_channel.mention if join_channel else 'Not set'}\n"
            f"**Leave channel:** {leave_channel.mention if leave_channel else 'Not set'}\n"
            f"**Embed color:** `#{embed_color:06X}`"
        )
        await ctx.send(msg)

    async def _get_log_channel(self, guild: discord.Guild, channel_id: int | None) -> discord.TextChannel | None:
        if not channel_id:
            return None

        channel = guild.get_channel(channel_id)
        if isinstance(channel, discord.TextChannel):
            return channel
        return None

    @commands.Cog.listener()
    async def on_member_join(self, member: discord.Member):
        guild_conf = self.config.guild(member.guild)
        channel_id = await guild_conf.join_channel_id()
        embed_color = await guild_conf.embed_color()

        channel = await self._get_log_channel(member.guild, channel_id)
        if channel is None:
            return

        embed = discord.Embed(
            title=f"🎉 {member.name} has joined the guild!",
            color=embed_color,
            timestamp=discord.utils.utcnow(),
        )
        embed.add_field(name="Username", value=member.name, inline=True)
        embed.add_field(name="IGN", value=member.display_name, inline=True)
        embed.set_thumbnail(url=member.display_avatar.url)

        try:
            await channel.send(embed=embed)
        except discord.HTTPException:
            pass

    @commands.Cog.listener()
    async def on_member_remove(self, member: discord.Member):
        guild_conf = self.config.guild(member.guild)
        channel_id = await guild_conf.leave_channel_id()
        embed_color = await guild_conf.embed_color()

        channel = await self._get_log_channel(member.guild, channel_id)
        if channel is None:
            return

        action_taken = "left the guild"
        executor = None

        try:
            if member.guild.me.guild_permissions.view_audit_log:
                # Check recent kick
                async for entry in member.guild.audit_logs(limit=5, action=discord.AuditLogAction.kick):
                    if entry.target and getattr(entry.target, "id", None) == member.id:
                        if (discord.utils.utcnow() - entry.created_at).total_seconds() < 5:
                            action_taken = "was **kicked**"
                            executor = entry.user
                            break

                # If not kicked, check recent ban
                if executor is None:
                    async for entry in member.guild.audit_logs(limit=5, action=discord.AuditLogAction.ban):
                        if entry.target and getattr(entry.target, "id", None) == member.id:
                            if (discord.utils.utcnow() - entry.created_at).total_seconds() < 5:
                                action_taken = "was **banned**"
                                executor = entry.user
                                break
        except Exception as e:
            print(f"Error fetching audit logs: {e}")

        embed = discord.Embed(
            title=f"👋 {member.name} {action_taken}",
            color=embed_color,
            timestamp=discord.utils.utcnow(),
        )
        embed.add_field(name="Username", value=member.name, inline=True)
        embed.add_field(name="IGN", value=member.display_name, inline=True)

        if executor is not None:
            tag = str(executor)
            embed.add_field(name="By", value=tag, inline=False)

        embed.set_thumbnail(url=member.display_avatar.url)

        try:
            await channel.send(embed=embed)
        except discord.HTTPException:
            pass