function falsyNoZero(value:any):boolean{
  return (value !== 0 && !value);
}

async function asyncReattempt(callBack:Function, maxAttempts:number, count=0) : Promise<any>{
  if (count >= maxAttempts) throw new Error(`Exceded maximum reattempts on asynchronous operaton ${callBack.name}`);
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

const numToAbbr = new Map([
  ["01", "Jan"], ["02", "Feb"], ["03", "Mar"], ["04", "Apr"],
  ["05", "May"], ["06", "Jun"], ["07", "Jul"], ["08", "Aug"],
  ["09", "Sep"], ["10", "Oct"], ["11", "Nov"], ["12", "Dec"]
]);

/** The built-in javascript Date constructor parses hyphenated dates to Midnight GMT, this slightly changes
 *  the syntax of the string passed to Date constructor so that it parses it to local time. It then returns
 *  the date object.
 */
function hStringToDate(hString:string):Date{
  const [year, month, date] = hString.split('-');
  return new Date(`${numToAbbr.get(month)} ${date} ${year}`);
}

export { falsyNoZero, asyncReattempt, dateToHString, hStringToDate };