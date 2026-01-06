from __future__ import annotations

import asyncio
from redbot.core import commands, Config
from discord.ext.commands import has_role

ROLE_ID = 866073594668384300

TMUX_CTL = "/usr/local/bin/zenith-tmux.sh"
SEND_INVITE = "/usr/local/bin/zenith-send-invite.sh"


class ZenithInvite(commands.Cog):
    """Invite a player in-game via a chosen ZenithProxy instance (tmux)."""

    def __init__(self, bot):
        self.bot = bot
        self._lock = asyncio.Lock()

        self.config = Config.get_conf(self, identifier=987654321123456789, force_registration=True)
        self.config.register_global(chosen_instance=None)

    async def _run(self, *args: str) -> tuple[int, str, str]:
        """
        Runs: sudo <args...>
        Returns: (returncode, stdout, stderr)
        """
        proc = await asyncio.create_subprocess_exec(
            "sudo",
            *args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        out_b, err_b = await proc.communicate()
        out = out_b.decode("utf-8", errors="replace").strip()
        err = err_b.decode("utf-8", errors="replace").strip()
        return proc.returncode, out, err

    @staticmethod
    def _chunk(text: str, limit: int = 1800):
        text = text or ""
        for i in range(0, len(text), limit):
            yield text[i : i + limit]

    async def _get_status_map(self) -> dict[str, bool]:
        # zenith-tmux.sh status output lines:
        # [alt] RUNNING (tmux:zp_alt) or [alt] STOPPED
        code, out, err = await self._run(TMUX_CTL, "status")
        if code != 0:
            raise RuntimeError(err or out or f"status failed with code {code}")

        status: dict[str, bool] = {}
        for line in out.splitlines():
            if line.startswith("[") and "]" in line:
                name = line[1 : line.index("]")]
                status[name] = "RUNNING" in line
        return status

    @commands.group(name="zenith")
    @has_role(ROLE_ID)
    async def zenith(self, ctx: commands.Context):
        """ZenithProxy controls (role restricted)."""
        if ctx.invoked_subcommand is None:
            await ctx.send("Use: `zenith start|stop|restart|status|setinstance|getinstance`")

    @zenith.command(name="setinstance")
    async def zenith_setinstance(self, ctx: commands.Context, alt_folder_name: str):
        """Set the single ZenithProxy instance (folder name) that /invite will use."""
        async with self._lock:
            status = await self._get_status_map()

            if alt_folder_name not in status:
                await ctx.send(
                    "❌ Unknown instance folder. Known instances:\n"
                    + "```" + "\n".join(sorted(status.keys())) + "```"
                )
                return

            await self.config.chosen_instance.set(alt_folder_name)

            state = "RUNNING" if status[alt_folder_name] else "STOPPED"
            await ctx.send(f"✅ Invite instance set to `{alt_folder_name}` (currently {state}).")

    @zenith.command(name="getinstance")
    async def zenith_getinstance(self, ctx: commands.Context):
        """Show which instance /invite will use."""
        chosen = await self.config.chosen_instance()
        if not chosen:
            await ctx.send("No instance set yet. Use: `zenith setinstance <altFolderName>`")
        else:
            await ctx.send(f"Current invite instance: `{chosen}`")

    @zenith.command(name="start")
    async def zenith_start(self, ctx: commands.Context):
        async with self._lock:
            code, out, err = await self._run(TMUX_CTL, "start")
        await ctx.send(f"```{out or err or f'Return code {code}'}```")

    @zenith.command(name="stop")
    async def zenith_stop(self, ctx: commands.Context):
        async with self._lock:
            code, out, err = await self._run(TMUX_CTL, "stop")
        await ctx.send(f"```{out or err or f'Return code {code}'}```")

    @zenith.command(name="restart")
    async def zenith_restart(self, ctx: commands.Context):
        async with self._lock:
            code, out, err = await self._run(TMUX_CTL, "restart")
        await ctx.send(f"```{out or err or f'Return code {code}'}```")

    @zenith.command(name="status")
    async def zenith_status(self, ctx: commands.Context):
        async with self._lock:
            code, out, err = await self._run(TMUX_CTL, "status")
        msg = out or err or f"Return code {code}"
        for part in self._chunk(msg):
            await ctx.send(f"```{part}```")

    @commands.command(name="invite")
    @has_role(ROLE_ID)
    async def invite(self, ctx: commands.Context, ign: str):
        """
        Invite a player using the configured ZenithProxy instance.
        Sends: say /invite <IGN>
        """
        async with self._lock:
            chosen = await self.config.chosen_instance()
            if not chosen:
                await ctx.send("❌ No instance set. Use: `zenith setinstance <altFolderName>`")
                return

            status = await self._get_status_map()
            if chosen not in status:
                await ctx.send(f"❌ Configured instance `{chosen}` no longer exists.")
                return
            if not status[chosen]:
                await ctx.send(f"❌ `{chosen}` is not running. Start it first, then retry.")
                return

            code, out, err = await self._run(SEND_INVITE, chosen, ign)

        if code == 0:
            await ctx.send(f"✅ {out or f'Sent invite for `{ign}` via `{chosen}`'}")
        else:
            await ctx.send(f"❌ {err or out or f'Invite failed (code {code})'}")

    @zenith.error
    @invite.error
    async def _perm_error(self, ctx: commands.Context, error: Exception):
        if isinstance(error, commands.MissingRole):
            await ctx.send("❌ You don’t have permission to use these commands.")
        else:
            raise error


async def setup(bot):
    await bot.add_cog(ZenithInvite(bot))
