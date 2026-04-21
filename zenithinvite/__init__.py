from .zenithinvite import ZenithInvite


async def setup(bot):
    await bot.add_cog(ZenithInvite(bot))