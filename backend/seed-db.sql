\c berry_farmer

INSERT INTO users (username, email, password)
  VALUES ('johndoe', 'jd@mail.com', 'testpw'),
         ('janedoe', 'jd2@mail.com', 'testpw'),
         ('abc123', 'abc123@mail.com', 'testpw');

INSERT INTO geo_profiles (name, region, country)
  VALUES ('London', 'England', 'United Kingdom'),
         ('Las Vegas', 'Nevada', 'United States'),
         ('Tuscon', 'Arizona', 'United States'),
         ('Henderson', 'Nevada', 'United States'),
         ('Boston', 'Massachusetts', 'United States');

INSERT INTO farms (owner, location)
  VALUES ('johndoe', 1),
         ('janedoe', 2),
         ('abc123', 3);

INSERT INTO weather_data (location, date, avg_temp, avg_cloud, total_rainfall)
  VALUES (1, '2020-10-20', 55, 75, 0.2),
         (1, '2020-10-21', 50, 80, 0),
         (2, '2021-12-11', 66, 15, 0),
         (3, '2021-12-11', 70, 10, 0),
         (4, '2021-12-11', 65, 15, 0),
         (5, '2021-12-11', 44, 70, 0.6);

INSERT INTO berry_profiles (name, growth_time, max_harvest, size, dry_rate, poke_type, poke_power, ideal_temp, ideal_cloud)
  VALUES ('cheri', 3, 5, 20, 15, 'fire', 60, 35, 0),
         ('chesto', 3, 5, 80, 26.25, 'water', 60, 23, 50),
         ('pecha', 3, 5, 40, 15, 'electric', 60, 16, 100),
         ('rawst', 3, 5, 32, 18.75, 'grass', 60, 24, 15),
         ('aspear', 3, 5, 50, 15, 'ice', 60, -5, 40),
         ('leppa', 4, 5, 28, 15, 'fighting', 60, 23, 35),
         ('oran', 4, 5, 35, 19.5, 'poison', 60, 30, 60),
         ('persim', 4, 5, 47, 3.75, 'ground', 60, 32, 10),
         ('lum', 12, 5, 34, 8, 'flying', 60, 20, 0),
         ('sitrus', 8, 5, 95, 7, 'psychic', 60, 24, 15),
         ('figy', 5, 5, 100, 12.5, 'bug', 60, 26, 35),
         ('wiki', 5, 5, 115, 2.5, 'rock', 60, 28, 50),
         ('mago', 5, 5, 126, 10, 'ghost', 60, 10, 85),
         ('aguav', 5, 5, 64, 12, 'dragon', 60, 16, 70),
         ('iapapa', 5, 5, 223, 10, 'dark', 60, 5, 65),
         ('razz', 2, 10, 120, 28, 'steel', 60, 13, 65),
         ('bluk', 2, 10, 108, 35, 'fire', 70, 35, 0),
         ('nanab', 2, 10, 77, 61.25, 'water', 70, 23, 50),
         ('wepear', 2, 10, 74, 35, 'electric', 70, 16, 100),
         ('pinap', 2, 10, 80, 43.75, 'grass', 70, 24, 15),
         ('pomeg', 8, 5, 135, 8, 'ice', 70, -5, 40),
         ('kelpsy', 8, 5, 150, 8, 'fighting', 70, 23, 35),
         ('qualot', 8, 5, 110, 10.4, 'poison', 70, 30, 60),
         ('hondew', 8, 5, 162, 2, 'ground', 70, 32, 10),
         ('grepa', 8, 5, 149, 8, 'flying', 70, 20, 0),
         ('tamato', 8, 5, 200, 8, 'psychic', 70, 24, 15),
         ('cornn', 6, 10, 75, 12.5, 'bug', 70, 26, 35),
         ('magost', 6, 10, 140, 2.5, 'rock', 70, 28, 50),
         ('rabuta', 6, 10, 226, 10, 'ghost', 70, 10, 85),
         ('nomel', 6, 10, 285, 12, 'dragon', 70, 16, 70),
         ('spelon', 15, 15, 133, 8, 'dark', 70, 5, 65),
         ('pamtre', 15, 15, 244, 6.4, 'steel', 70, 13, 65),
         ('watmel', 15, 15, 250, 8, 'fire', 80, 35, 0),
         ('durin', 15, 15, 280, 14, 'water', 80, 23, 50),
         ('belue', 15, 15, 300, 8, 'electric', 80, 16, 100),
         ('occa', 18, 5, 90, 6, 'fire', 60, 35, 0),
         ('passho', 18, 5, 33, 10.5, 'water', 60, 23, 50),
         ('wacan', 18, 5, 250, 6, 'electric', 60, 16, 100),
         ('rindo', 18, 5, 156, 7.5, 'grass', 60, 24, 15),
         ('yache', 18, 5, 135, 6, 'ice', 60, -5, 40),
         ('chople', 18, 5, 77, 6, 'fighting', 60, 23, 35),
         ('kebia', 18, 5, 90, 7.8, 'poison', 60, 30, 60),
         ('shuca', 18, 5, 42, 1.5, 'ground', 60, 32, 10),
         ('coba', 18, 5, 278, 6, 'flying', 60, 20, 0),
         ('payapa', 18, 5, 252, 6, 'psychic', 60, 24, 15),
         ('tanga', 18, 5, 42, 7.5, 'bug', 60, 26, 35),
         ('charti', 18, 5, 28, 1.5, 'rock', 60, 28, 50),
         ('kasib', 18, 5, 144, 6, 'ghost', 60, 10, 85),
         ('haban', 18, 5, 23, 7.2, 'dragon', 60, 16, 70),
         ('colbur', 18, 5, 39, 6, 'dark', 60, 5, 65),
         ('babiri', 18, 5, 265, 4.8, 'steel', 60, 13, 65),
         ('chilan', 18, 5, 34, 6, 'normal', 60, 23, 35),
         ('liechi', 24, 5, 111, 5, 'grass', 80, 24, 15),
         ('ganlon', 24, 5, 33, 4, 'ice', 80, -5, 40),
         ('salac', 24, 5, 95, 4, 'fighting', 80, 23, 35),
         ('petaya', 24, 5, 237, 5.2, 'poison', 80, 30, 60),
         ('apicot', 24, 5, 75, 1, 'ground', 80, 32, 10),
         ('lansat', 24, 5, 97, 4, 'flying', 80, 20, 0),
         ('starf', 24, 5, 153, 4, 'psychic', 80, 24, 15),
         ('enigma', 24, 5, 155, 8.75, 'bug', 80, 26, 35),
         ('micle', 24, 5, 41, 1.75, 'rock', 80, 28, 50),
         ('custap', 24, 5, 267, 7, 'ghost', 80, 10, 85),
         ('jaboca', 24, 5, 33, 8.4, 'dragon', 80, 16, 70),
         ('rowap', 24, 5, 52, 7, 'dark', 80, 5, 65);

INSERT INTO crops (berry_type, farm_id, farm_x, farm_y)
  VALUES ('cheri', 1, 0, 0),
         ('chesto', 1, 0, 1),
         ('cheri', 1, 2, 2),
         ('pecha', 2, 0, 0),
         ('cheri', 3, 1, 1);

INSERT INTO user_inventories (username, berry_type, amount)
  VALUES ('johndoe', 'cheri', 3),
         ('janedoe', 'chesto', 2),
         ('janedoe', 'cheri', 3),
         ('abc123', 'pecha', 99);