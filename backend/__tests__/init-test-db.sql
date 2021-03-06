DROP DATABASE IF EXISTS berry_farmer_test;
CREATE DATABASE berry_farmer_test;

\c berry_farmer_test

CREATE TABLE users (
    username text PRIMARY KEY,
    email text UNIQUE NOT NULL,
    password text NOT NULL,
    is_admin boolean DEFAULT false NOT NULL,
    funds numeric  DEFAULT 0 NOT NULL CONSTRAINT positive_funds CHECK (funds >= 0)
);

CREATE TABLE geo_profiles (
    id serial PRIMARY KEY,
    name text NOT NULL,
    region text NOT NULL,
    country text NOT NULL,
    tz_offset numeric DEFAULT 0 NOT NULL,
    
    CONSTRAINT uc_geo_profiles_name_region_country UNIQUE (
        name, region, country
    )
);

CREATE TABLE farms (
    id serial PRIMARY KEY,
    length smallint DEFAULT 3 NOT NULL CONSTRAINT length_valid_range CHECK (length >= 3 AND length <= 9),
    width smallint DEFAULT 3 NOT NULL CONSTRAINT width_valid_range CHECK (width >= 3 AND width <= 9),
    irrigation_lvl smallint DEFAULT 0 NOT NULL CONSTRAINT irrig_lvl_valid_range CHECK (irrigation_lvl >= 0 AND irrigation_lvl <= 5),
    last_checked_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    owner text NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    location integer NOT NULL REFERENCES geo_profiles(id)
);

CREATE TABLE weather_data (
    location integer REFERENCES geo_profiles(id) ON DELETE CASCADE,
    date date NOT NULL,
    avg_temp numeric NOT NULL,
    avg_cloud numeric NOT NULL,
    total_rainfall numeric NOT NULL CONSTRAINT positive_total_rainfall CHECK (total_rainfall >= 0),
    
    CONSTRAINT pk_weather_data PRIMARY KEY (
        location, date
    )
);

CREATE TABLE berry_profiles (
    name text PRIMARY KEY,
    growth_time smallint NOT NULL CONSTRAINT growth_time_above_zero CHECK (growth_time > 0),
    max_harvest smallint DEFAULT 5 NOT NULL,
    size numeric NOT NULL,
    dry_rate numeric NOT NULL CONSTRAINT dry_rate_above_zero CHECK (dry_rate > 0),
    poke_type text NOT NULL,
    poke_power numeric NOT NULL,
    ideal_temp numeric NOT NULL,
    ideal_cloud numeric NOT NULL
);

CREATE TABLE crops (
    id serial PRIMARY KEY ,
    berry_type text NOT NULL REFERENCES berry_profiles(name),
    cur_growth_stage smallint DEFAULT 0 NOT NULL CONSTRAINT cur_growth_stage_valid_range CHECK (cur_growth_stage >= 0 AND cur_growth_stage <= 4),
    health numeric DEFAULT 100 NOT NULL CONSTRAINT health_valid_range CHECK (health >= 0 AND health <= 100),
    moisture numeric DEFAULT 0 NOT NULL CONSTRAINT positive_moisture CHECK (moisture >= 0),
    planted_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    farm_id integer NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    farm_x smallint NOT NULL CONSTRAINT positive_farm_x CHECK (farm_x >= 0),
    farm_y smallint NOT NULL CONSTRAINT positive_farm_y CHECK (farm_y >= 0),
    
    CONSTRAINT uc_crops_farm_coords UNIQUE (
        farm_id, farm_x, farm_y
    )
);

CREATE TABLE user_inventories (
    username text NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    berry_type text NOT NULL REFERENCES berry_profiles(name),
    amount integer DEFAULT 0 NOT NULL CONSTRAINT positive_amount CHECK (amount >= 0),

    CONSTRAINT user_inventories_pk PRIMARY KEY (
        username, berry_type
    )
);

