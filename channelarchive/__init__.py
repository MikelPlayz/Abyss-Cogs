from .channelarchive import ChannelArchive

async def setup(bot):
    await bot.add_cog(ChannelArchive(bot))