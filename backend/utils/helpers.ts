import { BadRequestError } from "../expressError";
import type { ValidatorResult } from "jsonschema";

/** Evaluates if a given value is falsy, except treats zeroes as truthy */
function falsyNoZero(value:any):boolean{
  return (value !== 0 && !value);
}

/** Attempts to execute a given asynchronous callback function, re-attempting to do so any time
 *  an error is thrown. This will continue until a number of attempts maxAttempts has been reached,
 *  at which point it will throw an error.
 */
async function asyncReattempt(callBack:Function, maxAttempts:number, count=0) : Promise<any>{
  if (count >= maxAttempts) throw new Error(`Exceded maximum reattempts on asynchronous operation ${callBack.name}`);
  try {
    return await callBack();
  } catch (err:any){
    return await asyncReattempt(callBack, maxAttempts, count+1);
  }
}

/** Accepts an instance of Date and returns a string in YYYY-MM-DD format */
function dateToHString(date:Date):string{
  const zero = date.getDate() < 10 ? '0' : '';
  const mZero = date.getMonth() < 9 ? '0' : '';
  return `${date.getFullYear()}-${mZero}${date.getMonth()+1}-${zero}${date.getDate()}`;
}

/** The built-in javascript Date constructor parses hyphenated date strings to Midnight GMT, this slightly changes
 *  the syntax of the string passed to Date constructor so that it parses it Midnight local time. It then returns
 *  the date object. Since all other date operations use local time, this function is for consistency.
 */
function hStringToDate(hString:string):Date{
  const numToAbbr = new Map([
    ["01", "Jan"], ["02", "Feb"], ["03", "Mar"], ["04", "Apr"],
    ["05", "May"], ["06", "Jun"], ["07", "Jul"], ["08", "Aug"],
    ["09", "Sep"], ["10", "Oct"], ["11", "Nov"], ["12", "Dec"]
  ]);
  const [year, month, date] = hString.split('-');
  return new Date(`${numToAbbr.get(month)} ${date} ${year}`);
}

function invalidBadRequest(validator:ValidatorResult) : BadRequestError{
  let msg = "";
  validator.errors.forEach( (err, idx, arr) => {
    const punc = (idx === arr.length-1) ? "." : ", ";
    msg += err.message + punc;
  });
  return new BadRequestError(msg || "Bad Request");
}

export { invalidBadRequest, falsyNoZero, asyncReattempt, dateToHString, hStringToDate };