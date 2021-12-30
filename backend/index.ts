"use strict";
import app from "./app";
import { PORT } from "./config";
import initMarketPrices from "./utils/martketPrices";

initMarketPrices()
.then( res => {
  app.locals.marketPrices = res.prices;
  app.locals.marketMods = res.mods;
  console.log("Market prices initialized.")
  app.listen(PORT, () => {
    console.log(`Express App started on http://localhost:${PORT}/`);
  });
});

