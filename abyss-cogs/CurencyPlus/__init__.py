from .currencyplus import CurrencyPlus

async def setup(bot):
    await bot.add_cog(CurrencyPlus(bot))