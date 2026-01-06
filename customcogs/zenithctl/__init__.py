from .zenithctl import ZenithCtl

async def setup(bot):
    await bot.add_cog(ZenithCtl(bot))
