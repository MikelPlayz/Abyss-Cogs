import discord
from discord import app_commands, Embed
from discord.ext import commands
import asyncio
import random

class DiscordBot(commands.Bot):
    def __init__(self, proxy_server, lobby_manager, db_manager):
        super().__init__(command_prefix="!", intents=discord.Intents.all())
        self.proxy = proxy_server
        self.lobby = lobby_manager
        self.db = db_manager
        self.tree = app_commands.CommandTree(self)

    async def setup_hook(self):
        @self.tree.command(name="connect", description="Connect a bot to a server.")
        async def connect(interaction: discord.Interaction, bot_id: str, server: str, port: int = 25565):
            bot = self.proxy.get_bot(bot_id)
            if bot:
                try:
                    bot.connect(server, port)
                    await self.send_embed(bot_id, f"**Bot {bot_id} connecting to {server}:{port}**")
                    await interaction.response.send_message(f"Bot {bot_id} connecting to {server}:{port}", ephemeral=True)
                except Exception as e:
                    if "https://microsoft.com/link" in str(e):
                        code = self.extract_link_code(str(e))
                        await self.send_embed(bot_id, f"**Bot {bot_id} requires login:** [Click to authenticate](https://microsoft.com/link) - **Code:** `{code}`")
                    else:
                        await self.send_embed(bot_id, f"**Bot {bot_id} failed to connect:** {e}")

        @self.tree.command(name="disconnect", description="Disconnect a bot from the server.")
        async def disconnect(interaction: discord.Interaction, bot_id: str):
            bot = self.proxy.get_bot(bot_id)
            if bot:
                bot.disconnect()
                await self.send_embed(bot_id, f"**Bot {bot_id} has disconnected.**")
                await interaction.response.send_message(f"Bot {bot_id} disconnected.", ephemeral=True)

        @self.tree.command(name="say", description="Make the bot say a message.")
        async def say(interaction: discord.Interaction, bot_id: str, message: str):
            bot = self.proxy.get_bot(bot_id)
            if bot:
                bot.send_chat(message)
                self.db.log_command(interaction.user.name, bot_id, f"say: {message}")
                await self.send_embed(bot_id, f"**Bot {bot_id} said:** {message}")
                await interaction.response.send_message(f"Bot {bot_id} said: {message}", ephemeral=True)

        @self.tree.command(name="advertise", description="Toggle advertisement messages for a bot.")
        async def advertise(interaction: discord.Interaction, bot_id: str, toggle: str, interval: int, message: str):
            bot = self.proxy.get_bot(bot_id)
            if bot:
                if toggle.lower() == "on":
                    async def ad_loop():
                        while bot.advertising:
                            varied_time = random.randint(int(interval * 0.95), int(interval * 1.1))
                            await asyncio.sleep(varied_time * 60)
                            bot.send_chat(message)
                            self.db.log_command(interaction.user.name, bot_id, f"advertise: {message}")
                            await self.send_embed(bot_id, f"**Bot {bot_id} advertised:** {message}")

                    bot.advertising = True
                    self.loop.create_task(ad_loop())
                    await self.send_embed(bot_id, f"**Advertising enabled for {bot_id} every {interval} minutes.**")
                    await interaction.response.send_message(f"Advertising enabled for {bot_id}", ephemeral=True)
                elif toggle.lower() == "off":
                    bot.advertising = False
                    await self.send_embed(bot_id, f"**Advertising disabled for {bot_id}.**")
                    await interaction.response.send_message(f"Advertising disabled for {bot_id}.", ephemeral=True)

    async def on_ready(self):
        print(f"[DiscordBot] Logged in as {self.user}")
        await self.tree.sync()
        from discord_bot.status_updater import update_status_loop
        self.loop.create_task(update_status_loop(self))

    async def send_embed(self, bot_id, message):
        channel = discord.utils.get(self.get_all_channels(), name=f"bot-{bot_id}")
        if channel:
            embed = Embed(description=message, color=0x3498db)
            await channel.send(embed=embed)

    def extract_link_code(self, error_text):
        # Example: Extract CODE from 'https://microsoft.com/link CODE'
        parts = error_text.split()
        for i, part in enumerate(parts):
            if "microsoft.com/link" in part and i + 1 < len(parts):
                return parts[i + 1]
        return "UNKNOWN"
