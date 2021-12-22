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
function dateToHString(date:Date){
  return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`;
}

export { falsyNoZero, asyncReattempt, dateToHString };