class LobbyManager:
    def __init__(self, proxy_server, db_manager):
        self.proxy = proxy_server
        self.db = db_manager

    def start(self):
        print("[LobbyManager] Lobby system online.")

    def handle_bots_command(self, player):
        if not self.proxy.is_whitelisted(player.username):
            print(f"[LobbyManager] Unauthorized: {player.username}")
            return
        bot_list = list(self.proxy.bots.keys())
        print(f"[LobbyManager] Bots for {player.username}: {bot_list}")
