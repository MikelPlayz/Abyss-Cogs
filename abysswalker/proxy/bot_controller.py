import threading
import time
import random
from minecraft.networking.connection import Connection
from minecraft.networking.packets import ChatPacket

class BotController:
    def __init__(self, bot_name, account_data, proxy_server):
        self.name = bot_name
        self.proxy = proxy_server
        self.account_data = account_data  # Expects dict with username, email, access_token
        self.connection = None
        self.connected = False
        self.server = None
        self.advertising = False
        self.controlled_by = None  # Track player currently in control

    def handle_player_input(self, player_username, command_text):
        if not self.connected:
            raise Exception("Bot not connected.")

        if self.controlled_by != player_username:
            print(f"[Bot {self.name}] Unauthorized input from {player_username}.")
            return

        self.send_chat(command_text)
        print(f"[Bot {self.name}] {player_username} made bot say: {command_text}")
        if self.proxy.discord:
            self.proxy.discord.loop.create_task(
                self.proxy.discord.send_embed(self.name, f"**{player_username} instructed bot to say:** {command_text}")
            )