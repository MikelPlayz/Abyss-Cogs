import asyncio

async def update_status_loop(bot):
    while True:
        bot_count = len(bot.proxy.bots)
        servers = set(b.server for b in bot.proxy.bots.values() if b.server)
        await bot.change_presence(activity=discord.Game(
            name=f"{bot_count} bots on {len(servers)} servers"
        ))
        await asyncio.sleep(60)
