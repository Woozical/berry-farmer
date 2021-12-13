import db from "../../db";
import bcrypt from "bcrypt";
import { BCRYPT_WORK_FACTOR } from "../../config";

async function commonBeforeAll(){
  await db.query("DELETE FROM users");
  await db.query(
    `INSERT INTO users (username, email, password)
     VALUES ('u1', 'u1@mail.com', $1),
            ('u2', 'u2@mail.com', $2),
            ('u3', 'u3@mail.com', $3)`,
    [
      await bcrypt.hash("pw1", BCRYPT_WORK_FACTOR),
      await bcrypt.hash("pw2", BCRYPT_WORK_FACTOR),
      await bcrypt.hash("pw3", BCRYPT_WORK_FACTOR)
    ]
  );
}

async function commonBeforeEach(){
  await db.query("BEGIN");
}

async function commonAfterEach(){
  await db.query("ROLLBACK");
}

async function commonAfterAll(){
  await db.end(); 
}

export { commonAfterAll, commonAfterEach, commonBeforeAll, commonBeforeEach };