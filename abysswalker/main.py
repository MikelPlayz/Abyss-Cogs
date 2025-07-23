if __name__ == "__main__":
    from proxy.proxy_server import ProxyServer
    from discord_bot.bot import DiscordBot
    from lobby.lobby_manager import LobbyManager
    from database.db_manager import DatabaseManager

    print("[AbyssWalker] Proxy Manager starting... Made by MikelPlayz, Forked from ZenithProxy")
    
    db = DatabaseManager()
    db.init_db()

    proxy = ProxyServer(db)
    proxy.start()

    lobby = LobbyManager(proxy, db)
    lobby.start()

    discord_bot = DiscordBot(proxy, lobby, db)
    proxy.discord = discord_bot  # Allow proxy to trigger Discord embeds
    discord_bot.run()
