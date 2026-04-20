import asyncio
import csv
import io
import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional, Tuple

import discord
import gspread
from google.oauth2.service_account import Credentials

from redbot.core import Config, app_commands, commands
from redbot.core.bot import Red
from redbot.core.data_manager import cog_data_path


CRED_FILE_NAME = "gsheets_service_account.json"


@dataclass
class SheetTarget:
    spreadsheet_id: str
    worksheet_name: str


class CurrencyPlus(commands.Cog):
    """Gold/Credit currency cog with Google Sheets transaction logging and CSV import."""

    def __init__(self, bot: Red):
        self.bot = bot
        self.config = Config.get_conf(self, identifier=981237451230987, force_registration=True)

        default_guild = {
            "staff_role_id": None,
            "gsheet": {
                "spreadsheet_id": None,
                "worksheet_name": None,
            },
        }

        # Use custom user IDs directly so imports do not depend on Discord cache/API fetches
        default_custom_user = {
            "gold": 0,
            "credit": 0,
        }

        self.config.register_guild(**default_guild)
        self.config.init_custom("user", 1)
        self.config.register_custom("user", **default_custom_user)

    # --------------------------------------------------
    # Helpers
    # --------------------------------------------------

    def _get_data_path(self) -> str:
        return str(cog_data_path(self))

    def _cred_file_path(self) -> str:
        return os.path.join(self._get_data_path(), CRED_FILE_NAME)

    def _utc_ts(self) -> str:
        return datetime.now(timezone.utc).isoformat(timespec="seconds")

    def _user_group(self, user_id: int):
        return self.config.custom("user", str(user_id))

    async def _get_staff_role_id(self, guild: discord.Guild) -> Optional[int]:
        return await self.config.guild(guild).staff_role_id()

    async def _is_staff(self, member: discord.Member) -> bool:
        role_id = await self._get_staff_role_id(member.guild)
        if role_id is None:
            return False
        return any(role.id == role_id for role in member.roles)

    async def _staff_check(self, ctx: commands.Context) -> bool:
        if not ctx.guild or not isinstance(ctx.author, discord.Member):
            return False

        if await self._is_staff(ctx.author):
            return True

        await ctx.send("You don't have permission to do that.")
        return False

    async def _get_balances_by_id(self, user_id: int) -> Tuple[int, int]:
        data = await self._user_group(user_id).all()
        return int(data.get("gold", 0)), int(data.get("credit", 0))

    async def _set_balances_by_id(self, user_id: int, gold: int, credit: int) -> None:
        group = self._user_group(user_id)
        await group.gold.set(int(gold))
        await group.credit.set(int(credit))

    async def _set_gold_only_by_id(self, user_id: int, gold: int) -> Tuple[int, int]:
        async with self._user_group(user_id).all() as data:
            data["gold"] = int(gold)
            return int(data["gold"]), int(data["credit"])

    async def _set_credit_only_by_id(self, user_id: int, credit: int) -> Tuple[int, int]:
        async with self._user_group(user_id).all() as data:
            data["credit"] = int(credit)
            return int(data["gold"]), int(data["credit"])

    async def _apply_delta_by_id(
        self,
        user_id: int,
        gold_delta: int = 0,
        credit_delta: int = 0,
    ) -> Tuple[int, int]:
        async with self._user_group(user_id).all() as data:
            data["gold"] = int(data.get("gold", 0)) + int(gold_delta)
            data["credit"] = int(data.get("credit", 0)) + int(credit_delta)
            return int(data["gold"]), int(data["credit"])

    async def _load_sheet_target(self, guild: discord.Guild) -> Optional[SheetTarget]:
        gsheet = await self.config.guild(guild).gsheet()
        spreadsheet_id = gsheet.get("spreadsheet_id")
        worksheet_name = gsheet.get("worksheet_name")

        if not spreadsheet_id or not worksheet_name:
            return None

        return SheetTarget(spreadsheet_id=spreadsheet_id, worksheet_name=worksheet_name)

    def _build_gspread_client(self) -> gspread.Client:
        with open(self._cred_file_path(), "r", encoding="utf-8") as f:
            info = json.load(f)

        scopes = [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive.file",
            "https://www.googleapis.com/auth/drive",
        ]
        creds = Credentials.from_service_account_info(info, scopes=scopes)
        return gspread.authorize(creds)

    async def _append_log_row(
        self,
        guild: discord.Guild,
        action: str,
        moderator: discord.abc.User,
        target_id: int,
        target_display: str,
        currency: str,
        delta: int,
        new_gold: int,
        new_credit: int,
        reason: str = "",
    ) -> None:
        sheet_target = await self._load_sheet_target(guild)
        if not sheet_target:
            return

        row = [
            self._utc_ts(),
            str(guild.id),
            action,
            str(moderator.id),
            str(moderator),
            str(target_id),
            target_display,
            currency,
            str(delta),
            str(new_gold),
            str(new_credit),
            reason or "",
        ]

        def _sync_append():
            client = self._build_gspread_client()
            sh = client.open_by_key(sheet_target.spreadsheet_id)
            ws = sh.worksheet(sheet_target.worksheet_name)
            ws.append_row(row, value_input_option="USER_ENTERED")

        await asyncio.to_thread(_sync_append)

    # --------------------------------------------------
    # Public balance command
    # --------------------------------------------------

    @commands.hybrid_command(name="balance", description="Show your Gold and Credit balance.")
    @app_commands.describe(member="Optional member to check instead of yourself.")
    async def balance(self, ctx: commands.Context, member: Optional[discord.Member] = None):
        member = member or ctx.author
        gold, credit = await self._get_balances_by_id(member.id)

        embed = discord.Embed(title="Balance")
        embed.description = f"**{member.mention}**"
        embed.add_field(name="Gold", value=str(gold), inline=True)
        embed.add_field(name="Credit", value=str(credit), inline=True)
        await ctx.send(embed=embed)

    # --------------------------------------------------
    # Staff currency edit commands
    # --------------------------------------------------

    @commands.hybrid_command(name="addgold", description="Add Gold to a member.")
    @app_commands.describe(member="Member to modify.", amount="Amount of Gold to add.", reason="Optional reason.")
    async def addgold(self, ctx: commands.Context, member: discord.Member, amount: int, *, reason: str = ""):
        if not await self._staff_check(ctx):
            return
        if amount <= 0:
            await ctx.send("Amount must be positive.")
            return

        new_gold, new_credit = await self._apply_delta_by_id(member.id, gold_delta=amount)
        await self._append_log_row(
            ctx.guild, "add", ctx.author, member.id, str(member), "gold", amount, new_gold, new_credit, reason
        )
        await ctx.send(f"✅ Added **{amount} Gold** to {member.mention}. New Gold: **{new_gold}**")

    @commands.hybrid_command(name="takegold", description="Remove Gold from a member.")
    @app_commands.describe(member="Member to modify.", amount="Amount of Gold to remove.", reason="Optional reason.")
    async def takegold(self, ctx: commands.Context, member: discord.Member, amount: int, *, reason: str = ""):
        if not await self._staff_check(ctx):
            return
        if amount <= 0:
            await ctx.send("Amount must be positive.")
            return

        new_gold, new_credit = await self._apply_delta_by_id(member.id, gold_delta=-amount)
        await self._append_log_row(
            ctx.guild, "take", ctx.author, member.id, str(member), "gold", -amount, new_gold, new_credit, reason
        )
        await ctx.send(f"✅ Took **{amount} Gold** from {member.mention}. New Gold: **{new_gold}**")

    @commands.hybrid_command(name="addcredit", description="Add Credit to a member.")
    @app_commands.describe(member="Member to modify.", amount="Amount of Credit to add.", reason="Optional reason.")
    async def addcredit(self, ctx: commands.Context, member: discord.Member, amount: int, *, reason: str = ""):
        if not await self._staff_check(ctx):
            return
        if amount <= 0:
            await ctx.send("Amount must be positive.")
            return

        new_gold, new_credit = await self._apply_delta_by_id(member.id, credit_delta=amount)
        await self._append_log_row(
            ctx.guild, "add", ctx.author, member.id, str(member), "credit", amount, new_gold, new_credit, reason
        )
        await ctx.send(f"✅ Added **{amount} Credit** to {member.mention}. New Credit: **{new_credit}**")

    @commands.hybrid_command(name="takecredit", description="Remove Credit from a member.")
    @app_commands.describe(member="Member to modify.", amount="Amount of Credit to remove.", reason="Optional reason.")
    async def takecredit(self, ctx: commands.Context, member: discord.Member, amount: int, *, reason: str = ""):
        if not await self._staff_check(ctx):
            return
        if amount <= 0:
            await ctx.send("Amount must be positive.")
            return

        new_gold, new_credit = await self._apply_delta_by_id(member.id, credit_delta=-amount)
        await self._append_log_row(
            ctx.guild, "take", ctx.author, member.id, str(member), "credit", -amount, new_gold, new_credit, reason
        )
        await ctx.send(f"✅ Took **{amount} Credit** from {member.mention}. New Credit: **{new_credit}**")

    # --------------------------------------------------
    # Setup commands
    # --------------------------------------------------

    @commands.hybrid_group(name="currencyset", description="Currency cog setup commands.")
    @commands.admin_or_permissions(administrator=True)
    async def currencyset(self, ctx: commands.Context):
        if ctx.invoked_subcommand is None:
            role_id = await self.config.guild(ctx.guild).staff_role_id()
            gsheet = await self.config.guild(ctx.guild).gsheet()

            embed = discord.Embed(title="CurrencyPlus Setup")
            embed.add_field(
                name="Staff Role ID",
                value=str(role_id) if role_id else "Not set",
                inline=False,
            )

            if gsheet.get("spreadsheet_id") and gsheet.get("worksheet_name"):
                embed.add_field(
                    name="Google Sheet",
                    value=(
                        f"Spreadsheet ID: `{gsheet.get('spreadsheet_id')}`\n"
                        f"Worksheet: `{gsheet.get('worksheet_name')}`"
                    ),
                    inline=False,
                )
            else:
                embed.add_field(name="Google Sheet", value="Not set", inline=False)

            creds_exists = os.path.exists(self._cred_file_path())
            embed.add_field(name="Credentials JSON", value="Saved" if creds_exists else "Not set", inline=False)

            await ctx.send(embed=embed)

    @currencyset.command(name="role", description="Set the role allowed to modify balances.")
    async def currencyset_role(self, ctx: commands.Context, role: discord.Role):
        await self.config.guild(ctx.guild).staff_role_id.set(role.id)
        await ctx.send(f"✅ Staff currency role set to {role.mention}")

    @currencyset.command(name="gsheet", description="Set the Google Sheet target used for transaction logs.")
    async def currencyset_gsheet(self, ctx: commands.Context, spreadsheet_id: str, worksheet_name: str):
        await self.config.guild(ctx.guild).gsheet.set(
            {
                "spreadsheet_id": spreadsheet_id,
                "worksheet_name": worksheet_name,
            }
        )
        await ctx.send("✅ Google Sheet logging target set.")

    @currencyset.command(name="creds", description="Upload the Google service account JSON.")
    @app_commands.describe(file="The Google service account JSON file.")
    async def currencyset_creds(self, ctx: commands.Context, file: discord.Attachment):
        if not file.filename.lower().endswith(".json"):
            await ctx.send("Please upload a valid `.json` credentials file.")
            return

        try:
            raw = await file.read()
            json.loads(raw.decode("utf-8"))
        except Exception:
            await ctx.send("That file is not valid JSON.")
            return

        os.makedirs(self._get_data_path(), exist_ok=True)

        with open(self._cred_file_path(), "wb") as f:
            f.write(raw)

        await ctx.send(
            "✅ Credentials saved. Make sure your Google Sheet is shared with the service account email as an Editor."
        )

    # --------------------------------------------------
    # Import commands
    # --------------------------------------------------

    @commands.hybrid_group(name="currencyimport", description="Import balances from CSV files.")
    @commands.admin_or_permissions(administrator=True)
    async def currencyimport(self, ctx: commands.Context):
        if ctx.invoked_subcommand is None:
            await ctx.send("Use `/currencyimport goldcsv` or `/currencyimport creditcsv`.")

    @currencyimport.command(name="goldcsv", description="Import Gold balances from a CSV with Name,Total.")
    @app_commands.describe(file="CSV file using columns Name,Total.")
    async def currencyimport_goldcsv(self, ctx: commands.Context, file: discord.Attachment):
        await ctx.defer()

        if not file.filename.lower().endswith(".csv"):
            await ctx.send("Please upload a `.csv` file.")
            return

        try:
            raw = await file.read()
            text = raw.decode("utf-8-sig", errors="replace")
        except Exception:
            await ctx.send("Could not read that CSV file.")
            return

        reader = csv.DictReader(io.StringIO(text))
        if not reader.fieldnames:
            await ctx.send("CSV appears to be empty or invalid.")
            return

        normalized_headers = {h.strip().lower(): h for h in reader.fieldnames if h}
        if "name" not in normalized_headers or "total" not in normalized_headers:
            await ctx.send("Gold CSV must contain headers `Name` and `Total`.")
            return

        name_key = normalized_headers["name"]
        total_key = normalized_headers["total"]

        updated = 0
        failed = 0

        for row in reader:
            try:
                user_id_raw = str(row.get(name_key, "")).strip()
                total_raw = str(row.get(total_key, "")).strip()

                if not user_id_raw:
                    failed += 1
                    continue

                user_id = int(user_id_raw)
                gold_amount = int(float(total_raw or 0))
            except Exception:
                failed += 1
                continue

            await self._set_gold_only_by_id(user_id, gold_amount)
            updated += 1

        await ctx.send(
            f"✅ Gold CSV import complete. Updated **{updated}** users. Failed **{failed}** rows."
        )

    @currencyimport.command(name="creditcsv", description="Import Credit balances from a CSV with Name,Total.")
    @app_commands.describe(file="CSV file using columns Name,Total.")
    async def currencyimport_creditcsv(self, ctx: commands.Context, file: discord.Attachment):
        await ctx.defer()

        if not file.filename.lower().endswith(".csv"):
            await ctx.send("Please upload a `.csv` file.")
            return

        try:
            raw = await file.read()
            text = raw.decode("utf-8-sig", errors="replace")
        except Exception:
            await ctx.send("Could not read that CSV file.")
            return

        reader = csv.DictReader(io.StringIO(text))
        if not reader.fieldnames:
            await ctx.send("CSV appears to be empty or invalid.")
            return

        normalized_headers = {h.strip().lower(): h for h in reader.fieldnames if h}
        if "name" not in normalized_headers or "total" not in normalized_headers:
            await ctx.send("Credit CSV must contain headers `Name` and `Total`.")
            return

        name_key = normalized_headers["name"]
        total_key = normalized_headers["total"]

        updated = 0
        failed = 0

        for row in reader:
            try:
                user_id_raw = str(row.get(name_key, "")).strip()
                total_raw = str(row.get(total_key, "")).strip()

                if not user_id_raw:
                    failed += 1
                    continue

                user_id = int(user_id_raw)
                credit_amount = int(float(total_raw or 0))
            except Exception:
                failed += 1
                continue

            await self._set_credit_only_by_id(user_id, credit_amount)
            updated += 1

        await ctx.send(
            f"✅ Credit CSV import complete. Updated **{updated}** users. Failed **{failed}** rows."
        )