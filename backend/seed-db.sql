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

INSERT INTO weather_data (location, date, avg_temp, avg_cloud, avg_rainfall, chance_rain)
  VALUES (1, '2020-10-20', 55, 75, 0.2, 0.5),
         (1, '2020-10-21', 50, 80, 0, 0),
         (2, '2021-12-11', 66, 15, 0, 0),
         (3, '2021-12-11', 70, 10, 0, 0),
         (4, '2021-12-11', 65, 15, 0, 0),
         (5, '2021-12-11', 44, 70, 0.6, 0.9);

INSERT INTO berry_profiles (name, growth_time, size, dry_rate, poke_type, poke_power, ideal_temp, ideal_cloud)
  VALUES ('cheri', 3, 20, 10, 'fire', 60, 90, 15),
         ('chesto', 3, 80, 30, 'water', 60, 70, 15),
         ('pecha', 3, 40, 15, 'electric', 60, 70, 70);

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