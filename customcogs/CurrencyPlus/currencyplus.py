from __future__ import annotations

import asyncio
import csv
import io
import re
from dataclasses import dataclass
from datetime import datetime, time, timedelta, timezone
from typing import Dict, List, Optional, Tuple

import discord
from redbot.core import commands, Config
from redbot.core.bot import Red
from redbot.core.utils.chat_formatting import box

# --- Optional dependency notes ---
# This cog uses Google Sheets via gspread + google-auth.
# Install in your Red venv:
#   pip install gspread google-auth
try:
    import gspread
    from google.oauth2.service_account import Credentials
except Exception:  # pragma: no cover
    gspread = None
    Credentials = None


CURRENCY_CHOICES = ("gold", "credit")


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def parse_hhmm(s: str) -> time:
    """
    Accepts 'HH:MM' 24h format.
    """
    m = re.fullmatch(r"(\d{1,2}):(\d{2})", s.strip())
    if not m:
        raise ValueError("Time must be HH:MM (24h).")
    hh = int(m.group(1))
    mm = int(m.group(2))
    if hh < 0 or hh > 23 or mm < 0 or mm > 59:
        raise ValueError("Time must be a valid 24h HH:MM.")
    return time(hour=hh, minute=mm, tzinfo=timezone.utc)


def is_probably_header(row: List[str]) -> bool:
    if not row or len(row) < 2:
        return True
    a, b = row[0].strip().lower(), row[1].strip().lower()
    # common headers: name, userid, id, total, amount, balance
    return any(x in a for x in ("name", "user", "id")) or any(
        x in b for x in ("total", "amount", "balance")
    )


def normalize_currency(cur: str) -> str:
    cur = cur.strip().lower()
    if cur not in CURRENCY_CHOICES:
        raise ValueError(f"Currency must be one of: {', '.join(CURRENCY_CHOICES)}")
    return cur


@dataclass
class Txn:
    ts: str
    user_id: int
    currency: str
    delta: int
    new_balance: int
    actor_id: int
    reason: str
    kind: str  # ADD/REMOVE/SET/IMPORT/etc


class CurrencyCog(commands.Cog):
    """
    Two-currency system (Gold + Credit) with:
    - Negative balances allowed
    - Role-gated admin changes
    - Google Sheets transaction log
    - Daily export of all balances to a totals tab
    """

    def __init__(self, bot: Red):
        self.bot = bot
        self.config = Config.get_conf(self, identifier=9812749812734, force_registration=True)

        default_guild = {
            # Permissions
            "manager_role_id": None,  # role that can add/remove/set/import/export config

            # Google Sheets
            "gs_enabled": False,
            "gs_service_account_json_path": "",  # path on the machine running Red
            "gs_spreadsheet_id": "",
            "gs_transactions_tab": "Transactions",
            "gs_totals_tab": "Totals",

            # Daily export
            "daily_export_enabled": True,
            "daily_export_time_utc": "03:00",  # HH:MM UTC
            "daily_export_include_username": False,  # optional best-effort username display
        }

        default_member = {
            "gold": 0,
            "credit": 0,
        }

        self.config.register_guild(**default_guild)
        self.config.register_member(**default_member)

        self._daily_task: Optional[asyncio.Task] = None

    # ---------------------------
    # Red lifecycle
    # ---------------------------

    async def cog_load(self) -> None:
        self._start_daily_loop()

    async def cog_unload(self) -> None:
        if self._daily_task and not self._daily_task.done():
            self._daily_task.cancel()

    def _start_daily_loop(self) -> None:
        if self._daily_task and not self._daily_task.done():
            return
        self._daily_task = asyncio.create_task(self._daily_export_loop())

    # ---------------------------
    # Helpers: permissions
    # ---------------------------

    async def _is_manager(self, ctx: commands.Context) -> bool:
        role_id = await self.config.guild(ctx.guild).manager_role_id()
        if not role_id:
            return False
        role = ctx.guild.get_role(int(role_id))
        if not role:
            return False
        return role in ctx.author.roles

    def _manager_check(self):
        async def pred(ctx: commands.Context):
            return await self._is_manager(ctx)

        return commands.check(pred)

    # ---------------------------
    # Helpers: balances
    # ---------------------------

    async def _get_balance(self, member: discord.abc.User, currency: str) -> int:
        currency = normalize_currency(currency)
        return await self.config.member(member).get_raw(currency)

    async def _set_balance(self, member: discord.abc.User, currency: str, value: int) -> int:
        currency = normalize_currency(currency)
        await self.config.member(member).set_raw(currency, value=value)
        return value

    async def _add_delta(self, member: discord.abc.User, currency: str, delta: int) -> int:
        currency = normalize_currency(currency)
        current = await self._get_balance(member, currency)
        new_val = current + int(delta)
        await self._set_balance(member, currency, new_val)
        return new_val

    # ---------------------------
    # Google Sheets helpers
    # ---------------------------

    async def _gs_client(self, guild: discord.Guild):
        """
        Returns gspread client or raises a RuntimeError with useful message.
        """
        if gspread is None or Credentials is None:
            raise RuntimeError(
                "Google Sheets deps missing. Install: `pip install gspread google-auth`"
            )

        conf = self.config.guild(guild)
        enabled = await conf.gs_enabled()
        if not enabled:
            raise RuntimeError("Google Sheets is disabled. Enable it with /currency sheets enable true.")

        json_path = await conf.gs_service_account_json_path()
        sheet_id = await conf.gs_spreadsheet_id()
        if not json_path or not sheet_id:
            raise RuntimeError("Sheets not configured. Set service account path + spreadsheet id.")

        scopes = [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive",
        ]
        creds = Credentials.from_service_account_file(json_path, scopes=scopes)
        return gspread.authorize(creds)

    async def _gs_open(self, guild: discord.Guild):
        client = await self._gs_client(guild)
        sheet_id = await self.config.guild(guild).gs_spreadsheet_id()
        return client.open_by_key(sheet_id)

    async def _gs_append_transaction(self, guild: discord.Guild, txn: Txn):
        """
        Append 1 row to transactions tab.
        """
        sh = await self._gs_open(guild)
        tab_name = await self.config.guild(guild).gs_transactions_tab()
        try:
            ws = sh.worksheet(tab_name)
        except Exception:
            ws = sh.add_worksheet(title=tab_name, rows=2000, cols=12)
            ws.append_row(
                ["timestamp_utc", "user_id", "currency", "delta", "new_balance", "actor_id", "kind", "reason"],
                value_input_option="RAW",
            )

        ws.append_row(
            [txn.ts, str(txn.user_id), txn.currency, txn.delta, txn.new_balance, str(txn.actor_id), txn.kind, txn.reason],
            value_input_option="RAW",
        )

    async def _gs_write_totals(self, guild: discord.Guild, rows: List[List[str]]):
        """
        Overwrite totals tab with provided rows (including header).
        """
        sh = await self._gs_open(guild)
        tab_name = await self.config.guild(guild).gs_totals_tab()
        try:
            ws = sh.worksheet(tab_name)
        except Exception:
            ws = sh.add_worksheet(title=tab_name, rows=5000, cols=8)

        # Clear and write in one go
        ws.clear()
        # Update starting at A1
        ws.update("A1", rows, value_input_option="RAW")

    # ---------------------------
    # Daily export loop
    # ---------------------------

    async def _daily_export_loop(self):
        await self.bot.wait_until_red_ready()
        while True:
            try:
                # Sleep until next scheduled time per-guild, then run exports
                # We do a short tick loop so changes apply quickly without restart.
                await asyncio.sleep(30)

                for guild in self.bot.guilds:
                    conf = self.config.guild(guild)
                    if not await conf.daily_export_enabled():
                        continue
                    # If sheets disabled, skip silently
                    if not await conf.gs_enabled():
                        continue

                    # Determine if it's time (UTC)
                    target_str = await conf.daily_export_time_utc()
                    try:
                        target_t = parse_hhmm(target_str)
                    except Exception:
                        # bad config; skip
                        continue

                    now = datetime.now(timezone.utc)
                    target_dt = datetime.combine(now.date(), target_t, tzinfo=timezone.utc)
                    # Consider "due" if within the last 60 seconds of target and we haven't run today.
                    # We'll store last_run_date in memory via config (guild).
                    last_run = await conf.get_raw("daily_export_last_run", default="")
                    today_key = now.date().isoformat()

                    # If already ran today, skip
                    if last_run == today_key:
                        continue

                    # If we're past target but within a 10 minute window, run
                    if now >= target_dt and now - target_dt <= timedelta(minutes=10):
                        await self._export_totals_for_guild(guild, reason="DAILY")
                        await conf.set_raw("daily_export_last_run", value=today_key)

            except asyncio.CancelledError:
                break
            except Exception:
                # Don't crash the loop; just continue
                continue

    async def _export_totals_for_guild(self, guild: discord.Guild, reason: str = "MANUAL"):
        """
        Build rows and write totals tab.
        """
        include_username = await self.config.guild(guild).daily_export_include_username()

        members_data = await self.config.all_members(guild=guild)

        # Build sorted list by gold desc then credit desc
        compiled: List[Tuple[int, int, int]] = []
        for user_id_str, data in members_data.items():
            try:
                uid = int(user_id_str)
            except Exception:
                continue
            gold = int(data.get("gold", 0))
            credit = int(data.get("credit", 0))
            compiled.append((uid, gold, credit))
        compiled.sort(key=lambda x: (x[1], x[2]), reverse=True)

        header = ["discord_id", "gold", "credit", "last_updated_utc"]
        if include_username:
            header.insert(1, "username")

        ts = utc_now_iso()

        rows: List[List[str]] = [header]
        for uid, gold, credit in compiled:
            uname = ""
            if include_username:
                m = guild.get_member(uid)
                if m:
                    uname = str(m)
                else:
                    u = self.bot.get_user(uid)
                    uname = str(u) if u else ""
            if include_username:
                rows.append([str(uid), uname, str(gold), str(credit), ts])
            else:
                rows.append([str(uid), str(gold), str(credit), ts])

        await self._gs_write_totals(guild, rows)

        # Optionally also log that an export happened (as a transaction-like audit entry).
        # Not required; keeping it quiet by default.

    # ---------------------------
    # Commands
    # ---------------------------

    @commands.hybrid_group(name="currency", invoke_without_command=True)
    async def currency_group(self, ctx: commands.Context):
        """Currency commands (Gold + Credit)."""
        await ctx.send_help()

    @currency_group.hybrid_command(name="balance")
    async def balance(self, ctx: commands.Context, member: Optional[discord.Member] = None):
        """Check your (or someone else's) Gold/Credit balance."""
        member = member or ctx.author
        gold = await self._get_balance(member, "gold")
        credit = await self._get_balance(member, "credit")
        await ctx.reply(
            f"**{member.display_name}**\n"
            f"🪙 **Gold:** `{gold}`\n"
            f"💳 **Credit:** `{credit}`",
            mention_author=False,
        )

    # ---- Admin / Manager actions ----

    @currency_group.hybrid_command(name="add")
    @commands.guild_only()
    async def add(
        self,
        ctx: commands.Context,
        currency: str,
        member: discord.Member,
        amount: int,
        *,
        reason: str = "No reason provided",
    ):
        """Add to a user's balance (can go negative if amount is negative)."""
        if not await self._is_manager(ctx):
            return await ctx.reply("You don't have permission to use this command.", mention_author=False)

        currency = normalize_currency(currency)
        amount = int(amount)

        new_bal = await self._add_delta(member, currency, amount)

        # Log to sheets
        try:
            txn = Txn(
                ts=utc_now_iso(),
                user_id=member.id,
                currency=currency,
                delta=amount,
                new_balance=new_bal,
                actor_id=ctx.author.id,
                reason=reason,
                kind="ADD",
            )
            if await self.config.guild(ctx.guild).gs_enabled():
                await self._gs_append_transaction(ctx.guild, txn)
        except Exception as e:
            await ctx.reply(f"Updated balance, but failed to log to Sheets: `{e}`", mention_author=False)
            return

        await ctx.reply(
            f"✅ Updated **{member.display_name}** {currency} by `{amount}` → new balance: `{new_bal}`",
            mention_author=False,
        )

    @currency_group.hybrid_command(name="remove")
    @commands.guild_only()
    async def remove(
        self,
        ctx: commands.Context,
        currency: str,
        member: discord.Member,
        amount: int,
        *,
        reason: str = "No reason provided",
    ):
        """Remove from a user's balance (will go negative if needed)."""
        if not await self._is_manager(ctx):
            return await ctx.reply("You don't have permission to use this command.", mention_author=False)

        currency = normalize_currency(currency)
        amount = int(amount)

        new_bal = await self._add_delta(member, currency, -abs(amount))

        try:
            txn = Txn(
                ts=utc_now_iso(),
                user_id=member.id,
                currency=currency,
                delta=-abs(amount),
                new_balance=new_bal,
                actor_id=ctx.author.id,
                reason=reason,
                kind="REMOVE",
            )
            if await self.config.guild(ctx.guild).gs_enabled():
                await self._gs_append_transaction(ctx.guild, txn)
        except Exception as e:
            await ctx.reply(f"Updated balance, but failed to log to Sheets: `{e}`", mention_author=False)
            return

        await ctx.reply(
            f"✅ Updated **{member.display_name}** {currency} by `-{abs(amount)}` → new balance: `{new_bal}`",
            mention_author=False,
        )

    @currency_group.hybrid_command(name="set")
    @commands.guild_only()
    async def set_balance(
        self,
        ctx: commands.Context,
        currency: str,
        member: discord.Member,
        amount: int,
        *,
        reason: str = "No reason provided",
    ):
        """Set a user's balance directly (can be negative)."""
        if not await self._is_manager(ctx):
            return await ctx.reply("You don't have permission to use this command.", mention_author=False)

        currency = normalize_currency(currency)
        amount = int(amount)

        await self._set_balance(member, currency, amount)

        try:
            txn = Txn(
                ts=utc_now_iso(),
                user_id=member.id,
                currency=currency,
                delta=0,
                new_balance=amount,
                actor_id=ctx.author.id,
                reason=reason,
                kind="SET",
            )
            if await self.config.guild(ctx.guild).gs_enabled():
                await self._gs_append_transaction(ctx.guild, txn)
        except Exception as e:
            await ctx.reply(f"Set balance, but failed to log to Sheets: `{e}`", mention_author=False)
            return

        await ctx.reply(
            f"✅ Set **{member.display_name}** {currency} to `{amount}`",
            mention_author=False,
        )

    @currency_group.hybrid_command(name="importcsv")
    @commands.guild_only()
    async def import_csv(
        self,
        ctx: commands.Context,
        currency: str,
        attachment: discord.Attachment,
        *,
        reason: str = "CSV import",
    ):
        """
        Import balances from a 2-column CSV: discord_id, amount
        Overwrites the chosen currency for each user ID found.
        """
        if not await self._is_manager(ctx):
            return await ctx.reply("You don't have permission to use this command.", mention_author=False)

        currency = normalize_currency(currency)

        if not attachment.filename.lower().endswith((".csv", ".txt")):
            return await ctx.reply("Please upload a `.csv` file.", mention_author=False)

        raw = await attachment.read()
        text = raw.decode("utf-8", errors="replace")
        f = io.StringIO(text)

        reader = csv.reader(f)
        rows = list(reader)

        if not rows:
            return await ctx.reply("CSV appears empty.", mention_author=False)

        # Skip header row if it looks like one
        start_idx = 1 if is_probably_header(rows[0]) else 0

        updated = 0
        failed: List[str] = []

        for i, row in enumerate(rows[start_idx:], start=start_idx + 1):
            if len(row) < 2:
                continue
            uid_raw = row[0].strip()
            amt_raw = row[1].strip()

            try:
                uid = int(uid_raw)
                amt = int(float(amt_raw)) if re.search(r"[.eE]", amt_raw) else int(amt_raw)
            except Exception:
                failed.append(f"Line {i}: `{uid_raw}`, `{amt_raw}`")
                continue

            user = self.bot.get_user(uid)
            if user is None:
                # Create a fake User reference; Config can still store by ID via member if they are in guild
                member = ctx.guild.get_member(uid)
                if member is None:
                    failed.append(f"Line {i}: user `{uid}` not in guild")
                    continue
                user = member

            await self._set_balance(user, currency, amt)
            updated += 1

            # Log import as a txn row (delta not meaningful here; we log SET-style)
            try:
                if await self.config.guild(ctx.guild).gs_enabled():
                    txn = Txn(
                        ts=utc_now_iso(),
                        user_id=uid,
                        currency=currency,
                        delta=0,
                        new_balance=amt,
                        actor_id=ctx.author.id,
                        reason=reason,
                        kind="IMPORT",
                    )
                    await self._gs_append_transaction(ctx.guild, txn)
            except Exception:
                # don't fail whole import if sheets hiccup
                pass

        msg = f"✅ Imported `{updated}` rows into **{currency}**."
        if failed:
            # show up to 10 failures
            preview = "\n".join(failed[:10])
            msg += f"\n⚠️ Failed `{len(failed)}` rows (showing up to 10):\n{box(preview)}"
        await ctx.reply(msg, mention_author=False)

    # ---- Google Sheets config ----

    @currency_group.group(name="sheets")
    @commands.guild_only()
    async def sheets_group(self, ctx: commands.Context):
        """Configure Google Sheets integration."""
        await ctx.send_help()

    @sheets_group.command(name="enable")
    async def sheets_enable(self, ctx: commands.Context, enabled: bool):
        if not await self._is_manager(ctx):
            return await ctx.reply("You don't have permission.", mention_author=False)
        await self.config.guild(ctx.guild).gs_enabled.set(enabled)
        await ctx.reply(f"Google Sheets logging is now set to: `{enabled}`", mention_author=False)

    @sheets_group.command(name="serviceaccount")
    async def sheets_serviceaccount(self, ctx: commands.Context, json_path: str):
        if not await self._is_manager(ctx):
            return await ctx.reply("You don't have permission.", mention_author=False)
        await self.config.guild(ctx.guild).gs_service_account_json_path.set(json_path)
        await ctx.reply("✅ Service account JSON path saved.", mention_author=False)

    @sheets_group.command(name="spreadsheet")
    async def sheets_spreadsheet(self, ctx: commands.Context, spreadsheet_id: str):
        if not await self._is_manager(ctx):
            return await ctx.reply("You don't have permission.", mention_author=False)
        await self.config.guild(ctx.guild).gs_spreadsheet_id.set(spreadsheet_id)
        await ctx.reply("✅ Spreadsheet ID saved.", mention_author=False)

    @sheets_group.command(name="tabs")
    async def sheets_tabs(self, ctx: commands.Context, transactions_tab: str, totals_tab: str):
        if not await self._is_manager(ctx):
            return await ctx.reply("You don't have permission.", mention_author=False)
        conf = self.config.guild(ctx.guild)
        await conf.gs_transactions_tab.set(transactions_tab)
        await conf.gs_totals_tab.set(totals_tab)
        await ctx.reply("✅ Tab names saved.", mention_author=False)

    @sheets_group.command(name="test")
    async def sheets_test(self, ctx: commands.Context):
        if not await self._is_manager(ctx):
            return await ctx.reply("You don't have permission.", mention_author=False)
        try:
            await self._gs_open(ctx.guild)
            await ctx.reply("✅ Sheets connection looks good.", mention_author=False)
        except Exception as e:
            await ctx.reply(f"❌ Sheets test failed: `{e}`", mention_author=False)

    # ---- Daily export controls ----

    @currency_group.group(name="export")
    @commands.guild_only()
    async def export_group(self, ctx: commands.Context):
        """Daily totals export controls."""
        await ctx.send_help()

    @export_group.command(name="now")
    async def export_now(self, ctx: commands.Context):
        if not await self._is_manager(ctx):
            return await ctx.reply("You don't have permission.", mention_author=False)
        try:
            await self._export_totals_for_guild(ctx.guild, reason="MANUAL")
            await ctx.reply("✅ Totals sheet updated now.", mention_author=False)
        except Exception as e:
            await ctx.reply(f"❌ Export failed: `{e}`", mention_author=False)

    @export_group.command(name="enable")
    async def export_enable(self, ctx: commands.Context, enabled: bool):
        if not await self._is_manager(ctx):
            return await ctx.reply("You don't have permission.", mention_author=False)
        await self.config.guild(ctx.guild).daily_export_enabled.set(enabled)
        await ctx.reply(f"Daily export enabled set to `{enabled}`", mention_author=False)

    @export_group.command(name="time")
    async def export_time(self, ctx: commands.Context, hhmm_utc: str):
        if not await self._is_manager(ctx):
            return await ctx.reply("You don't have permission.", mention_author=False)
        try:
            parse_hhmm(hhmm_utc)
        except Exception as e:
            return await ctx.reply(f"Invalid time: {e}", mention_author=False)

        await self.config.guild(ctx.guild).daily_export_time_utc.set(hhmm_utc)
        await ctx.reply(f"✅ Daily export time (UTC) set to `{hhmm_utc}`", mention_author=False)

    @export_group.command(name="username")
    async def export_username(self, ctx: commands.Context, enabled: bool):
        if not await self._is_manager(ctx):
            return await ctx.reply("You don't have permission.", mention_author=False)
        await self.config.guild(ctx.guild).daily_export_include_username.set(enabled)
        await ctx.reply(f"✅ Include username column set to `{enabled}`", mention_author=False)

    # ---- Manager role ----

    @currency_group.command(name="setmanagerrole")
    @commands.guild_only()
    async def set_manager_role(self, ctx: commands.Context, role: discord.Role):
        """Set the role allowed to add/remove/set/import/export."""
        if not ctx.author.guild_permissions.administrator:
            return await ctx.reply("Only server administrators can set the manager role.", mention_author=False)

        await self.config.guild(ctx.guild).manager_role_id.set(role.id)
        await ctx.reply(f"✅ Manager role set to: **{role.name}**", mention_author=False)


async def setup(bot: Red):
    await bot.add_cog(CurrencyCog(bot))
