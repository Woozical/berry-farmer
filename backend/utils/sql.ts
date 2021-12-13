"use strict";
import { BadRequestError } from "../expressError";
/** Accepts two objects, the first containing the data to be inserted into the DB.
 * The second object is a map of variable names and how they should be renamed to fit
 * the DB schema. e.g. { "firstName" : "first_name" }
 * ----
 * sqlForPartialUpdate(
 *  { firstName : "John", lastName : "Doe", age : 40 }, {"firstName" : "first_name", "lastName" : "last_name" }
 * )
 * Returns:
 * {  setCols: '"first_name"=$1, "last_name"=$2", "age"=$3',
 *    data: ["John", "Doe", 40]
 * }
 */

 export function sqlForPartialUpdate(dataToUpdate:Object, jsToSql:any={}) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}