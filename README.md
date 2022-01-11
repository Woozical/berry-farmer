# BerryFarmer (Express API and React Frontend)
BerryFarmer is a PERN ([Postgres](https://www.postgresql.org/), [Express](https://expressjs.com/), [React](https://reactjs.org/), [Node.js](https://nodejs.org/)) web application that utilizes [WeatherAPI](https://www.weatherapi.com/) to function as a farm management game in which users grow berries from the [Pokemon](https://www.pokemon.com/) franchise. Each user's farm is situated on a real-world location, in which the daily weather patterns of that location influence the growth of their berries. The server avoids the use of scheduled tasks or chron-jobs through the utilization of performing operations based on time deltas. The application is set up so that the backend is a freestanding Web API that can then be consumed by the static react application (or any other interface). Both the frontend and backend project files are included in this repo, but should be considered seperate entities. I've kept most of my notes included in the repo for posterity.


## Installation (Backend)
The backend requires the installation of Node.js and Postgres. Once these are configured, simply type the following command while the backend folder is the current working directory:
```
npm i
```
This will install all necessary packages and dependencies.  

### Berries & PokeAPI

A node script, `pull-berry-profiles.js` is included in the top level directory of the backend. This script can be run to pull game information on Pokemon berries from [PokeAPI](https://pokeapi.co/), that information is then tweaked to match the database schema of this app, and the results are written to a SQL file called `berry-profiles.sql`. The results of this script are already included as part of `seed-db.sql`, but I included it in case you wish to make any adjustments to the berry profiles.

### Databases

The PostgreSQL database can be initialized and seeded by running the following command:
```
npm run init-db
```
This will create a db called "berry_farmer" with the appropriate tables and some seed information on the local Postgres server. Aside from the berry_profiles, the seed information is not particularly suited for being included in production.

Prior to running any tests, the Test database should be initialized by running:
```
npm run init-test-db
```
This will create a db called "berry_farmer_test" with the appropriate tables on the local Postgres server. Seed data is handled by the `_testCommon.ts` files in the `__tests__` folders.
### WeatherAPI

**Important!** This app makes use of the [WeatherAPI](https://www.weatherapi.com/), which requires an API key to access. After registering a free account and retrieving your API key, you may create a `.env` file in the backend directory and store your API key there for use by the Express app, like so:
```
WEATHER_API_KEY=abc123xyz
```


## Installation (Frontend)

Installation of the frontend is fairly simple, so long as Node.js is already installed. As before, simply execute the following command while the frontend folder is the current working directory:
```npm i```
This will install all necessary packages and dependences.

### Pokemon sprites and icons
In order to work properly, the React app will need graphics for each stage of the berry's growth, as well as an icon for each berry. In my deployment, I am using graphics from the Gen 4 Pokemon games. I decided not to include these files in the repo, however, I have included the Python scripts I used to automate retrieval of these graphics from [Bulbapedia](https://bulbapedia.bulbagarden.net/). You will need to have [Python 3](https://www.python.org/) installed on your local machine prior to executing these scripts. The results of these scripts will be saved to a folder called `berry_pull`.

The React app expects all berry-related graphics to be in the `public/assets/berries` folder, and match the following pattern:
`public/assets/berries/{BerryName}/{BerryName}-icon.png`
`public/assets/berries/{BerryName}/{BerryName}TreeBerry.png`
`public/assets/berries/{BerryName}/{BerryName}TreeBloom.png`
`public/assets/berries/{BerryName}/{BerryName}TreeTaller.png`

I've included the Cheri berry in the repo as an example.

The React app also expects the following folder, which is not included: `public/assets/types`.
In this folder should be a .png with an icon for each Pokemon type (e.g. fire, water, bug, etc.), similar to the ones below:
<img height=200px src=https://pm1.narvii.com/6149/23c443950dda5b0823dc64bdbc67661e2c7d4561_hq.jpg />

## Database Schema
<img src=https://raw.githubusercontent.com/Woozical/berry-farmer/master/schema.png />

## API Endpoints

#### /
The home endpoint responds with a simple count of the number of farm, user, and geo_profile records in the database.

Response Example:
```json
{
	"message": "You have reached the BerryFarmer API.",
	"farms": 26,
	"users": 15,
	"locations": 18
}
```
### /auth
#### POST: /auth/register
**Auth Required: None**  
Creates a new user in the database with the given credentials. An initial amount of funds (as defined in `config.ts`) is given to the new user's account. The server then responds with a JSON Web Token that can be used to authenticate further requests.  
Payload Example: { "username": "abc123", "password": "password123", "email": "abc123@mail.com" }  

Response Example:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ5b3UiOiJmb3VuZCIsImEiOiJzZWNyZXQiLCJpYXQiOjE1MTYyMzkwMjJ9.VU-u5u5c4gdljwPPKBH2p0V485tjU9mRlCJfBtzk_Q8"
}
```
#### POST: /auth/login
**Auth Required: None**  
Returns a JSON Web Token with user credentials that can then be used to authenticate future requests.  
Payload Example: { "username": "abc123", "password": "password123" }

Response Example:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ5ZXQiOiJhbm90aGVyIiwic2VjcmV0Ijoid2VsbCBkb25lISIsImlhdCI6MTUxNjIzOTAyMn0.Lbkpv64PGV8r50TbHUInYzkCBWmEUVdopYlJe2EnUjA"
}
```
### /users
#### GET: /users/:username
**Auth Required: Logged In**  
Retrieves information on the given user. `Email` is only included in response if the logged in user is the same user being requested.  

Response Example:
``` json
{  
  "user": {
    "username": "abc123",
    "email": "abc123@mail.com",
    "farmCount": 1,
    "funds": 25.99,
    "inventory": {
      "cheri" : 5
    }
  },
  "message": "ok"
}
```

#### GET: /users/:username/farms
**Auth Required: Logged In**  
Retrieves a list of summary information on farms owned by a given user.

Response Example:
``` json
{
	"farms": [
		{
			"id": 4,
			"length": 9,
			"width": 5,
			"lastCheckedAt": "2022-01-11T10:35:41.210Z",
			"irrigationLVL": 2,
			"locationName": "Las Vegas",
			"locationRegion": "Nevada",
			"locationCountry": "United States"
		},
		{
			"id": 8,
			"length": 3,
			"width": 3,
			"lastCheckedAt": "2022-01-11T11:13:32.352Z",
			"irrigationLVL": 0,
			"locationName": "Boston",
			"locationRegion": "Massachusetts",
			"locationCountry": "United States of America"
		}
	],
	"message": "ok"
}
```
#### DELETE: /users/:username
**Auth Required: Same User**  
Deletes the user, all of their farms, and all crops associated with those farms, from the database.

Response Example: 
``` json
{
  "deleted": "abc123", "message": "ok"
}
```
#### PATCH: /users/:username
**Auth Required: Admin**  
Updates the user in the db. Permitted fields: `email`, `funds`, `isAdmin`  
Payload Example: { "funds": 9999, "isAdmin": true, "email": "newmail@mail.com" }  

Response Example:
```json
{
  "user": {
    "username": "abc123",
    "email": "newmail@mail.com",
    "funds": 9999
  },
  "message": "ok"
}
```
### /locations
#### GET: /locations
**Auth Required: None**  
Retrieves a list of geo_profiles, with pagination (20 results per page). Accepts a query string to filter the results.  
Accepted query parameters: `name`, `region`, `country`, `page`  
Query Example: `/locatons?region=Massachusetts`  

Response Example:
```json
{
	"message": "ok",
	"locations": [
		{
			"id": 5,
			"name": "Boston",
			"region": "Massachusetts",
			"country": "United States of America"
		},
		{
			"id": 9,
			"name": "Ware",
			"region": "Massachusetts",
			"country": "United States of America"
		}
	],
	"page": 0
}
```
#### POST: /locations
**Auth Required: Logged In**  
Creates a new entry in the geo_profiles table. This is done by providing a search term (e.g. a city name, postal code, etc).
This search term is then passed to WeatherAPI, which will respond with a matching Name, Region and Country. This unique 3 combination is saved to the database, as well as weather data for the date of the creation.  
Payload Example: { "search": "89014" }  

Response Example:
```json
{
	"message": "created",
	"location": {
		"id": 33,
		"name": "Henderson",
		"region": "Nevada",
		"country": "USA"
	}
}
```
#### GET: /locations/:locationID
**Auth Required: None**  
Returns geo_profile name, region and country for the given locationID.  

Response Example:
```json
{
	"message": "ok",
	"location": {
		"id": 33,
		"name": "Henderson",
		"region": "Nevada",
		"country": "USA"
	}
}
```
#### PATCH: /locations/:locationID
**Auth Required: Admin**  
Updates the geo_profile in the db. Permitted fields: `name`, `region`, `country`, `tz_offset`  
**WARNING:** geo_profiles are created using data pulled from the WeatherAPI, and are used for 
further communication with that API. Editing these fields in DB may have consequences for this communication.  
Payload Example: { "country": "United States of America", "tz_offset": -8 }  

Response Example:
```json
{
	"message": "updated",
	"location": {
		"id": 33,
		"name": "Henderson",
		"region": "Nevada",
		"country": "United States of America"
	}
}
```
#### DELETE: /locations/:locationID
**Auth Required: Admin**  
Deletes the geo_profile in the db. Note that there is no cascading delete for geo_profiles. That means
that all farms which reference the geo_profile must be deleted, or transferred to a new geo_profile before
the old one can be deleted. Otherwise, the foreign key violation will trigger a BadRequestError.

Response Example:
```json
{
  "message": "ok",
  "deleted": 33
}
```
### /farms
#### POST: /farms
**Auth Required: Admin**  
Creates a new entry in the farms table. Users should use the `/farms/buy` route for farm creation.  
Payload Example: { "locationID": 33, "owner": "abc123", "width": 5 }  

Response Example:
```json
{
  "message": "created",
  "farm": {
    "id": 15,
    "length": 3,
    "width": 5,
    "irrigationLVL": 0,
    "locationID": 33,
    "owner": "abc123"
  }
}
```
#### POST: /farms/buy
**Auth Required: Logged In**   
Creates a new entry in the farms table. User should have requisite funds and not be at max farms per user limit (both defined in the Market model). If both requirements are met, farm is created and funds deducted from user.  
Payload Example: { "locationID": 33 }

Response Example:
```json
{
  "message": "created",
  "farm": {
    "id": 15,
    "length": 3,
    "width": 5,
    "irrigationLVL": 0,
    "locationID": 33,
    "owner": "abc123"
  }
}
```
#### GET: /farms/:farmID
**Auth Required: Logged In**  
Returns farm information for the given farm ID. If an amount of time has passed the `FARM_SYNC_TIMER` (as defined in `config.ts`)
Then the server will respond with a `211` code, meaning that the user must send a POST to `/farms/:farmID/sync` before that
resource is available for viewing.  

Response Example (211):
```json
{
  "message": "needs crop sync. send POST request to /farms/15/sync"
}
```
Response Example (200):
```json
{
	"message": "ok",
	"farm": {
		"id": 15,
		"length": 3,
		"width": 5,
		"irrigationLVL": 0,
		"lastCheckedAt": "2022-01-11T20:52:59.912Z",
		"owner": "abc123",
		"locationName": "Henderson",
		"locationRegion": "Nevada",
		"locationCountry": "United States of America",
		"crops": []
	}
}
```
#### PATCH: /farms/:farmID
**Auth Required: Admin**  
Updates the farm in the db. Permitted fields: `length`, `width`, `irrigationLVL`  
Users should make use of the POST `/farms/:farmID/upgrade` route to change these fields.  
Payload Example: { length: 7, width: 3 }  

Response Example:
```json
{
  "message": "updated",
  "farm": {
    "id": 15,
    "length": 7,
    "width": 3,
    "irrigationLVL": 0,
    "lastCheckedAt": "2022-01-11T20:52:59.912Z",
		"owner": "abc123",
    "locationID": 33
  }
}
```
#### DELETE: /farms/:farmID
**Auth Required: Owner**  
Deletes the farm, and all associated crops, from the db.  

Response Example:
```json
{
  "message": "ok",
  "deleted": 15
}
```
#### POST: /farms/:farmID/sync
**Auth Required: Owner**  
Performs a crop sync operation on the given farm. All crops associated with the farm
have time delta-based operations performed on them, updating their moisture and, possibly, health
and curGrowthStage. This operation requires weather data, and may query WeatherAPI for weather data
on the farm's location if it does not already exist for the requisite dates to check.
Once finished, the farm's `lastCheckedAt` is updated to the time this operation took place, and the server
responds with the updated farm object similar to GET `/farms/:farmID`.

Response Example:
```json
{
	"message": "updated",
	"farm": {
		"id": 15,
		"length": 3,
		"width": 5,
		"irrigationLVL": 0,
		"lastCheckedAt": "2022-01-11T20:52:59.912Z",
		"owner": "abc123",
		"locationName": "Henderson",
		"locationRegion": "Nevada",
		"locationCountry": "United States of America",
		"crops": [
			{
				"id": 40,
				"berryType": "aguav",
				"curGrowthStage": 3,
				"moisture": 21.646842245370365,
				"health": 0,
				"plantedAt": "2022-01-11T03:39:03.456Z",
				"x": 1,
				"y": 1
			}
		]
	}
}
```
#### POST: /farms/:farmID/upgrade
**Auth Required: Owner**  
Increases the length, width, or irrigationLVL of the farm with the given id by 1.  
The owner of the farm must have the requisite funds for the upgrade (defined in Market model) or a BadRequest will
be thrown. Those funds will then be deducted from the user.  
Payload Examples: { "type": "length" } OR { "type": "width" } OR { "type": "irrigation" }

Response Example:
```json
{
  "message": "upgraded",
  "farm": {
    "id": 15,
    "length": 7,
    "width": 3,
    "irrigationLVL": 1,
    "lastCheckedAt": "2022-01-11T20:52:59.912Z",
		"owner": "abc123",
    "locationID": 33
  }
}
```

### /berries
#### GET: /berries/prices
**Auth Required: None**  
Returns an object with the current market value of each berry type in the database. These prices are determined every server reset. Also included are the list of "hot" and "not" pokemon types, which factor into each berry's current market value.

Response Example:
```json
{
  "message": "ok",
  "hot": [ "water", "dragon", "flying" ],
  "not": [ "ghost" ],
  "prices": {
    "cheri": 58.97,
    "chesto": 121.30,
    "pecha": 70.30
  }
}
```
#### GET: /berries/:berryType
**Auth Required: None**  
Returns the berry profile of the given berry type.

Response Example:
```json
{
	"message": "ok",
	"berry": {
		"name": "cheri",
		"growthTime": 3,
		"maxHarvest": 5,
		"size": 20,
		"dryRate": 15,
		"pokeType": "fire",
		"pokePower": 60,
		"idealTemp": 35,
		"idealCloud": 0,
		"price": 58.97
	}
}
```
#### POST: /berries/buy
**Auth Required: Logged In**  
Attempts to buy an amount of given berryType. Upon success, the funds from the buy order are deducted from the logged in user, and the amount of specified berries is added to their inventory. If the logged in user does not have the requisite funds for the amount of berries stated in the payload, a BadRequestError is thrown. **NOTE**: When buying berries, a markup is applied as defined in the Market model. (Default is `1.15` or 15% markup)  
Payload Example: { "berryType": "cheri", "amount": 3 }

Response Example:
```json
{
  "message": "Bought 3 cheri berries for $203.45",
  "buyOrderPrice": 203.45
}
```
#### POST: /berries/sell
**Auth Required: Logged In**  
Attempts to sell an amount of given berryType from the logged in user's inventory. Upon success, the funds from the sell order are added to the logged in user, and the amount of specified berries is deducted from their inventory. If the logged in user does not have the amount of berries stated in the payload, a BadRequestError is thrown.  
Payload Example: { "berryType": "cheri", "amount": 5 }  

Response Example:
```json
{
  "message": "Sold 5 cheri berries for $294.85",
  "sellOrderPrice": 294.85
}
```
### /crops
#### POST: /crops
**Auth Required: Owner**  
Creates a new crop in the database. The farmID in the payload is used for verifying Owner authorization. If the user hitting this route is not an admin, they must have the specified berry type in their inventory, and one of that berry type will be deducted on successful crop creation. If an admin is hitting this route, they may opt to set the curGrowthStage on creation. If curGrowthStage is included in the payload, and the user hitting the route is NOT an admin, a 403 ForbiddenError will be thrown, even if all other fields are valid. Before the crop is created, a farm sync is called on the given ID (to prevent disparity between `plantedAt` and `lastCheckedAt`).  
Payload Example: { "x": 1, "y": 2, "farmID": 15, "berryType": "cheri", "curGrowthStage": 2 (admin only) }  

Response Example:
```json
{
  "message": "created",
  "crop": {
    "id": 41,
    "curGrowthStage": 2,
		"plantedAt": "2022-01-11T03:41:03.456Z",
		"farmID": 15,
		"x": 1,
		"y": 2,
		"moisture": 0,
		"health": 100,
		"berryType": "cheri"
  }
}
```
#### GET: /crops/:cropID
**Auth Required: None**  
Returns information for the crop with the given ID, with adjoined berry profile.  

Response Example:
```json
{
	"message": "ok",
	"crop": {
		"id": 40,
		"curGrowthStage": 3,
		"plantedAt": "2022-01-11T03:39:03.456Z",
		"farmID": 8,
		"x": 1,
		"y": 1,
		"moisture": 21.646842245370365,
		"health": 35,
		"berry": {
			"type": "aguav",
			"growthTime": 5,
			"maxHarvest": 5,
			"size": 64,
			"pokeType": "dragon",
			"dryRate": 12,
			"pokePower": 60,
			"idealCloud": 70,
			"idealTemp": 16
		}
	}
}
```
#### PATCH: /crops/:cropID
**Auth Required: Owner**  
Versatile endpoint, it behaves differently if it's being accessed by admin users. Admin users can patch crop `moisture`, `curGrowthStage` and `health`. When patching `moisture` as admin, the `moisture` is **SET TO** the number specified in the payload.  
Admin => { moisture?, curGrowthStage?, health? } 

If accessed by non-admin farm owners, the payload may **only** contain the moisture field.
The number specified in the payload will be **ADDED TO** the crop's current moisture.
Negative moisture amounts are not permitted.  
User => { moisture }

When accessed by non-admins, this route may respond with a `211` code if the farm this crop exists on
is in need of a sync. This is to prevent users from watering (neglected) crops prior to triggering a growth.

Response Example (211):
```json
{
	"message": "Farm needs crop sync. Send POST request to /farms/8/sync"
}
```
Response Example (200):
```json
{
	"message": "updated",
  "crop": {
    "id": 40,
    "curGrowthStage": 3,
		"plantedAt": "2022-01-11T03:39:03.456Z",
		"farmID": 8,
		"x": 1,
		"y": 1,
		"moisture": 40.123,
		"health": 35,
		"berryType": "aguav"
  }
}
```
#### DELETE: /crops/:cropID
**Auth Required: Owner**  
Removes the crop with the given ID from the database.  

Response Example:
```json
{
  "message": "ok",
  "deleted": 40
}
```
#### POST: /crops/:cropID/harvest
**Auth Required: Owner**  
If given crop is at max growth (`curGrowthStage == 4`),  the Crop model calculates # of berries harvested (based on crop health and max harvest of berry profile) and then adds it to the farm owner's inventory.  
The crop with this ID is then deleted.

Response Example:
```json
{
  "message": "ok",
  "harvest": {
    "amount": 3,
    "berryType": "cheri"
  }
}
```