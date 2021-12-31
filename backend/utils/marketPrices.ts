import db from "../db";

/** Randomly intializes a list of pokemon type modifiers. For each pokemon type,
 *  there is a 20% that it will be considered "hot" or "not" (evenly split chance).
 *  A berry that's pokemon type is "hot" will receive a final 1.5x modifier to its market
 *  price. If its type is in the "not" category it will receive a final 0.5x modifier.
 */

interface PokeTypePriceMods {
  hot: Set<String>,
  not: Set<String>
}

function initPokeTypeMods(){
  const pokeTypes = [ 
    "normal", "fire", "water", "grass", "electric", 
    "ice", "fighting", "poison", "ground", "flying",
    "psychic", "bug", "rock", "ghost", "dark",
    "dragon", "steel", "fairy"
  ];
  const mods:PokeTypePriceMods = { hot: new Set(), not: new Set() };
  for (let type of pokeTypes){
    const roll = Math.random();
    if (roll < 0.1) mods.hot.add(type);
    else if (roll > 0.9) mods.not.add(type);
  }
  return mods;
}

/** Runs at server startup / reset, initializes market price
 *  modifiers. These are ephemeral by design, so they are not stored
 *  as a column in db.
 */
async function initMarketPrices(){
  const q = await db.query('SELECT name, poke_power AS "pokePower", poke_type AS "pokeType" FROM berry_profiles');
  const mods = initPokeTypeMods();
  const prices = new Map();
  for (let { name, pokePower, pokeType } of q.rows){
    const priceModifier = mods.hot.has(pokeType) ? 1.5 : mods.not.has(pokeType) ? 0.5 : 1;
    const price = Number(((Number(pokePower) * (0.7 + (Math.random() * 0.6))) * priceModifier).toFixed(2));
    prices.set(name, price);
  }
  return { prices, mods };
}

export default initMarketPrices;