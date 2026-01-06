from redbot.core import commands
import asyncio

SCRIPT_PATH = "/home/ubuntu/zenith-all.sh"

class ZenithCtl(commands.Cog):
    """Control ZenithProxy instances using the zenith-all.sh script."""

    def __init__(self, bot):
        self.bot = bot
        self._lock = asyncio.Lock()  # prevent start/stop spam collisions

    async def _run(self, action: str) -> tuple[int, str, str]:
        """
        Runs: sudo /home/ubuntu/zenith-all.sh <action>
        Returns: (returncode, stdout, stderr)
        """
        proc = await asyncio.create_subprocess_exec(
            "sudo",
            SCRIPT_PATH,
            action,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        out_b, err_b = await proc.communicate()
        out = out_b.decode("utf-8", errors="replace").strip()
        err = err_b.decode("utf-8", errors="replace").strip()
        return proc.returncode, out, err

    def _chunk(self, text: str, limit: int = 1800):
        # Discord messages have limits; keep it safe
        text = text or ""
        for i in range(0, len(text), limit):
            yield text[i:i + limit]

    @commands.group(name="zenith")
    @commands.is_owner()
    async def zenith(self, ctx: commands.Context):
        """ZenithProxy control group (owner-only)."""
        if ctx.invoked_subcommand is None:
            await ctx.send("Use: `zenith start|stop|restart|status`")

    @zenith.command(name="start")
    async def zenith_start(self, ctx: commands.Context):
        async with self._lock:
            await ctx.send("Starting all ZenithProxy instances...")
            code, out, err = await self._run("start")

        if code != 0:
            msg = f"❌ Start failed (code {code})."
            if err:
                msg += f"\n```{err[:1800]}```"
            await ctx.send(msg)
            return

        if out:
            for part in self._chunk(out):
                await ctx.send(f"```{part}```")
        else:
            await ctx.send("✅ Start command sent.")

    @zenith.command(name="stop")
    async def zenith_stop(self, ctx: commands.Context):
        async with self._lock:
            await ctx.send("Stopping all ZenithProxy instances...")
            code, out, err = await self._run("stop")

        if code != 0:
            msg = f"❌ Stop failed (code {code})."
            if err:
                msg += f"\n```{err[:1800]}```"
            await ctx.send(msg)
            return

        if out:
            for part in self._chunk(out):
                await ctx.send(f"```{part}```")
        else:
            await ctx.send("✅ Stop command sent.")

    @zenith.command(name="restart")
    async def zenith_restart(self, ctx: commands.Context):
        async with self._lock:
            await ctx.send("Restarting all ZenithProxy instances...")
            code, out, err = await self._run("restart")

        if code != 0:
            msg = f"❌ Restart failed (code {code})."
            if err:
                msg += f"\n```{err[:1800]}```"
            await ctx.send(msg)
            return

        if out:
            for part in self._chunk(out):
                await ctx.send(f"```{part}```")
        else:
            await ctx.send("✅ Restart command sent.")

    @zenith.command(name="status")
    async def zenith_status(self, ctx: commands.Context):
        async with self._lock:
            code, out, err = await self._run("status")

        if code != 0:
            msg = f"❌ Status failed (code {code})."
            if err:
                msg += f"\n```{err[:1800]}```"
            await ctx.send(msg)
            return

        if out:
            for part in self._chunk(out):
                await ctx.send(f"```{part}```")
        else:
            await ctx.send("No output from status.")
