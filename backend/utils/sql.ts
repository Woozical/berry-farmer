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

/** Accepts an an array 'filters', which contains objects representing conditionals with the following properties:
 *  column: the name of the column
 *  operation: the string form operation (e.g. "ILIKE", ">", "<")
 *  value: the parameter for the WHERE clause
 *  Returns an object with a string representing a SQL WHERE clause that includes all of the provided conditionals,
 *  and an array that are the position mapped parameters for each conditional
 *  ---
 *  sqlForFilter([
      {column: "name", operation: "ILIKE", value: "Dog"},
      {column: "num_employees", operation: ">", value: 3},
      {column: "num_employees", operation: "<", value: 6}])
    
    Returns:
    {
      string: '"name" ILIKE $1 AND "num_employees" > $2 AND num_employees < $3',
      values: ["%Dog%", 3, 6]
    }
 */
export interface SQLFilter {
  column: string, operation: string, value?: any
}
export function sqlForFilter(filters:Array<SQLFilter>){
  let string = '';
  let values = [];
  for (let i = 0; i < filters.length; i++){
    const condi = {...filters[i]};
    if (condi.operation.includes("LIKE")) condi.value = `%${condi.value}%`;
    string += `"${condi.column}" ${condi.operation} $${i+1}`;
    string = (i === filters.length - 1) ? string : (string + " AND ");
    values.push(condi.value);
  }
  return {string, values};
}