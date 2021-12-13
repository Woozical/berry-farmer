"use strict";
/** Database & SQL Driver setup */
import { Client } from "pg";
import { getDatabaseUri } from "./config";

const db = process.env.NODE_ENV === "production" ?
            new Client({ connectionString: getDatabaseUri(), ssl: { rejectUnauthorized: false } })
            :
            new Client({ connectionString: getDatabaseUri() });

db.connect();

export default db;