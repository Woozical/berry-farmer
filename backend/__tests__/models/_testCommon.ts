import db from "../../db";

async function commonBeforeAll(){
  await db.query("DELETE FROM users");
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