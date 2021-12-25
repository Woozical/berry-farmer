const axios = require("axios");
const BASE_URL = "https://pokeapi.co/api/v2/berry/";
const fs = require("fs");

const typeMods = {
  "fire" : {
    dryRate: 1,
    idealTemp: 35,
    idealCloud: 0
  },
  "water" : {
    dryRate: 1.75,
    idealTemp: 23,
    idealCloud: 50
  },
  "grass" : {
    dryRate: 1.25,
    idealTemp: 24,
    idealCloud: 15
  },
  "electric" : {
    dryRate: 1,
    idealTemp: 16,
    idealCloud: 100
  },
  "ice" : {
    dryRate: 1,
    idealTemp: -5,
    idealCloud: 40
  },
  "fighting" : {
    dryRate: 1,
    idealTemp: 23,
    idealCloud: 35
  },
  "poison" : {
    dryRate: 1.3,
    idealTemp: 30,
    idealCloud: 60
  },
  "ground" : {
    dryRate: 0.25,
    idealTemp: 32,
    idealCloud: 10
  },
  "flying" : {
    dryRate: 1,
    idealTemp: 20,
    idealCloud: 0,
  },
  "psychic" : {
    dryRate: 1,
    idealTemp: 24,
    idealCloud: 15
  },
  "bug" : {
    dryRate: 1.25,
    idealTemp: 26,
    idealCloud: 35
  },
  "rock" : {
    dryRate: 0.25,
    idealTemp: 28,
    idealCloud: 50
  },
  "ghost" : {
    dryRate: 1,
    idealTemp: 10,
    idealCloud: 85
  },
  "dark" : {
    dryRate: 1,
    idealTemp: 5,
    idealCloud: 65
  },
  "dragon" : {
    dryRate: 1.2,
    idealTemp: 16,
    idealCloud: 70
  },
  "steel" : {
    dryRate: 0.8,
    idealTemp: 13,
    idealCloud: 65
  },
  "fairy" : {
    dryRate: 1,
    idealTemp: 21,
    idealCloud: 0
  },
  "normal" : {
    dryRate: 1,
    idealTemp: 23,
    idealCloud: 35
  }
}


function resToProfile(data){
  const profile = {
    growthTime: data.growth_time,
    maxHarvest: data.max_harvest,
    name: data.name,
    size: data.size,
    pokeType: data.natural_gift_type.name,
    pokePower: data.natural_gift_power,
    dryRate: data.soil_dryness,
    idealTemp: null, idealCloud: null
  };
  // dryRate, idealTemp, idealCloud type modifiers
  profile.idealCloud = typeMods[profile.pokeType].idealCloud;
  profile.idealTemp = typeMods[profile.pokeType].idealTemp;
  profile.dryRate = profile.dryRate * typeMods[profile.pokeType].dryRate;

  return profile;
}

function berryProfileToValues(p){
  // Assuming INSERT INTO (name, growth_time, max_harvest, size, dry_rate, poke_type, poke_power, ideal_temp, ideal_cloud)
  return (
    `('${p.name}', ${p.growthTime}, ${p.maxHarvest}, ${p.size}, ${p.dryRate}, '${p.pokeType}', ${p.pokePower}, ${p.idealTemp}, ${p.idealCloud})`
  )
}

function profileListToSQLInsert(arr){
  let s = `\\c berry_farmer;\nINSERT INTO berry_profiles (name, growth_time, max_harvest, size, dry_rate, poke_type, poke_power, ideal_temp, ideal_cloud)\nVALUES `;
  
  for (let i = 0; i < arr.length; i++){
    const values = berryProfileToValues(arr[i]);
    s += (i === arr.length-1) ? `${values};` : `${values},\n`;
  }
  return s.trim();
}

// function pl2SITest(){
//     const data = {
//       growth_time : 3,
//       max_harvest : 5,
//       name : "oingo",
//       size: 3,
//       natural_gift_type : { name: "water" },
//       natural_gift_power : 60,
//       soil_dryness: 15
//   };
//   const arr = [
//     resToProfile(data),
//     resToProfile(data),
//     resToProfile(data)
//   ];
//   const s = profileListToSQLInsert(arr);
//   fs.writeFileSync("berry-profiles.sql", s);
// }

// pl2SITest();

// function r2pTest(){
//   const data = {
//     growth_time : 3,
//     max_harvest : 5,
//     name : "oingo",
//     size: 3,
//     natural_gift_type : { name: "water" },
//     natural_gift_power : 60,
//     soil_dryness: 15
//   }

//   const profile = resToProfile(data);
//   console.log(profile);
// }

// r2pTest();

async function pullBerries(){
  const resArr = [];
  const profiles = [];
  console.log("Requesting PokeApi...");
  for (let i = 1; i <= 64; i++){
    console.log("Berry Profle", i);
    // requests are sequential due to large volume (avoid anti-DDOS measures)
    const res = await axios.get(`${BASE_URL}/${i}`);
    resArr.push(res);
  }
  console.log("Generating SQL insert...");
  for (let res of resArr){
    profiles.push(resToProfile(res.data));
  }
  const s = profileListToSQLInsert(profiles);
  console.log("Writing to file...");
  fs.writeFileSync("berry-profiles.sql", s);
  console.log("Done!");
}

pullBerries();