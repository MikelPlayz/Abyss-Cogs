import json
import os
from dotenv import load_dotenv
from proxy.bot_controller import BotController
from minecraft.networking.packets import ChatPacket, DisconnectPacket, JoinGamePacket, PlayerListItemPacket

class ProxyServer:
    def __init__(self, db_manager):
        self.bots = {}  # bot_name: BotController
        self.db = db_manager
        self.discord = None
        self.player_sessions = {}  # username: connection object (proxy clients)
        self.control_queues = {}  # bot_name: list of waiting usernames

        with open("bot_channels.json") as f:
            self.channel_map = json.load(f)

        with open("whitelist.json") as f:
            self.whitelist = set(json.load(f))

        with open("bot_accounts.json") as f:
            self.account_data = json.load(f)

        load_dotenv(".env")

    def start(self):
        print("[ProxyServer] Registering bots from config...")
        for bot_name, account in self.account_data.items():
            token_env = f"{bot_name.upper()}_TOKEN"
            access_token = os.getenv(token_env)
            account["access_token"] = access_token
            bot = BotController(bot_name, account, self)
            self.bots[bot_name] = bot
            self.control_queues[bot_name] = []
            print(f"[ProxyServer] Registered bot: {bot_name}")

            server = account.get("server")
            port = account.get("port", 25565)
            if server:
                bot.connect(server, port)

        print("[ProxyServer] Ready for player connections.")

    def get_bot(self, bot_name):
        return self.bots.get(bot_name)

    def get_bot_channel(self, bot_name):
        return self.channel_map.get(bot_name)

    def is_whitelisted(self, username):
        return username in self.whitelist

    def assign_control(self, bot_name, player_username):
        bot = self.get_bot(bot_name)
        if bot:
            if not self.is_whitelisted(player_username):
                print(f"[ProxyServer] {player_username} attempted to control bot without permission.")
                return False

            if bot.controlled_by:
                if player_username not in self.control_queues[bot_name]:
                    self.control_queues[bot_name].append(player_username)
                    print(f"[ProxyServer] {player_username} added to queue for {bot_name}.")
                return False

            bot.controlled_by = player_username
            print(f"[ProxyServer] {player_username} is now controlling {bot_name}.")
            if self.discord:
                self.discord.loop.create_task(
                    self.discord.send_embed(bot_name, f"**{player_username} is now controlling {bot_name}.**")
                )
            self.update_player_list()
            return True
        return False

    def remove_control(self, bot_name, player_username):
        bot = self.get_bot(bot_name)
        if bot and bot.controlled_by == player_username:
            bot.controlled_by = None
            print(f"[ProxyServer] {player_username} released control of {bot_name}.")
            if self.discord:
                self.discord.loop.create_task(
                    self.discord.send_embed(bot_name, f"**{player_username} has released control of {bot_name}.**")
                )
            if self.control_queues[bot_name]:
                next_user = self.control_queues[bot_name].pop(0)
                self.assign_control(bot_name, next_user)
            else:
                self.update_player_list()

    def handle_player_connection(self, username, connection):
        if not self.is_whitelisted(username):
            packet = DisconnectPacket()
            packet.reason = "You are not whitelisted."
            connection.write_packet(packet)
            return

        self.player_sessions[username] = connection
        print(f"[ProxyServer] {username} joined proxy.")

        join_packet = JoinGamePacket()
        join_packet.entity_id = 0
        join_packet.gamemode = 0
        join_packet.dimension = 0
        join_packet.hashed_seed = 0
        join_packet.max_players = 1
        join_packet.level_type = "default"
        join_packet.view_distance = 10
        join_packet.reduced_debug_info = True
        join_packet.is_debug = False
        join_packet.is_flat = True
        connection.write_packet(join_packet)

        self.send_bots_list(username)

        connection.register_packet_listener(lambda pkt: self.handle_chat_packet(pkt, username), ChatPacket)

        self.update_player_list()

    def send_bots_list(self, username):
        connection = self.player_sessions.get(username)
        if not connection:
            return

        bot_list = list(self.bots.keys())
        for bot_name in bot_list:
            msg_json = {
                "text": "",
                "extra": [
                    {"text": "[Select] ", "color": "green", "bold": True, "clickEvent": {"action": "run_command", "value": f"/control {bot_name}"}},
                    {"text": f"{bot_name}", "color": "white"}
                ]
            }

            chat_packet = ChatPacket()
            chat_packet.message = json.dumps(msg_json)
            connection.write_packet(chat_packet)

        print(f"[ProxyServer] Sent clickable bot list to {username}.")

    def handle_chat_packet(self, packet, username):
        connection = self.player_sessions.get(username)

        if packet.message.startswith("/control "):
            bot_name = packet.message.split(" ", 1)[1]
            success = self.assign_control(bot_name, username)

            if success:
                feedback = f"§aYou are now controlling bot: {bot_name}"
            else:
                bot = self.get_bot(bot_name)
                if bot and bot.controlled_by != username:
                    position = self.control_queues[bot_name].index(username) + 1 if username in self.control_queues[bot_name] else "?"
                    feedback = f"§e{bot.controlled_by} is controlling {bot_name}, you are #{position} in queue."
                else:
                    feedback = "§cFailed to control bot."

            if connection:
                chat_packet = ChatPacket()
                chat_packet.message = feedback
                connection.write_packet(chat_packet)

        elif packet.message.strip() == "/release":
            for bot_name, bot in self.bots.items():
                if bot.controlled_by == username:
                    self.remove_control(bot_name, username)
                    if connection:
                        chat_packet = ChatPacket()
                        chat_packet.message = f"§aYou have released control of {bot_name}."
                        connection.write_packet(chat_packet)
                    break

    def update_player_list(self):
        for username, connection in self.player_sessions.items():
            packet = PlayerListItemPacket()
            packet.action = 0  # Add player list entrie
            packet.items = []

            for bot_name, bot in self.bots.items():
                if bot.controlled_by:
                    line = {
                        "name": f"§4§l[AbyssWalker] §c{bot.controlled_by} §7--> §c{bot_name}",
                        "ping": 1
                    }
                    packet.items.append(line)
                elif self.control_queues[bot_name]:
                    for idx, queued_user in enumerate(self.control_queues[bot_name], start=1):
                        line = {
                            "name": f"§4§l[Queue] §c{queued_user} §7({idx}) §7for §c{bot_name}",
                            "ping": 1
                        }
                        packet.items.append(line)

            connection.write_packet(packet)
