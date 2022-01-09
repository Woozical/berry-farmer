export function addCommas(num:number) {
  const [strNum, strDec] = String(num).split('.');
  let subStrings = [];
  for (let i = strNum.length; i > 0; i -= 3){
    if (i / 3 < 1){
      subStrings.push(strNum.slice(0, i));
      break;
    }
    subStrings.push(strNum.slice(i-3, i));
  }
  return strDec ? subStrings.reverse().join(',') + '.' + strDec : subStrings.reverse().join(',');
}

export function titleCase(string:string){
  return string[0].toUpperCase() + string.slice(1)
}

// Returns, in string form, how many months/weeks/days/hours/minutes ago from now a certain date is.
export function timeAgo(date:Date):string{
  const monthMS = 2629800000;
  const weekMS = 604800000;
  const dayMS = 86400000;
  const hourMS = 3600000;
  const minuteMS = 60000;
  const delta = Date.now() - date.getTime();
  if (delta >= monthMS){
    const num = delta/ monthMS;
    return `${num.toFixed(0)} month${num >= 2 ? 's' : ''} ago`;
  
  } else if (delta >= weekMS){
    const num = delta/ weekMS;
    return `${num.toFixed(0)} week${num >= 2 ? 's' : ''} ago`;
  
  } else if (delta >= dayMS){
    const num = delta/ dayMS;
    return `${num.toFixed(0)} day${num >= 2 ? 's' : ''} ago`;
  
  } else if (delta >= hourMS){
    const num = delta/ hourMS;
    return `${num.toFixed(0)} hour${num >= 2 ? 's' : ''} ago`;
  
  } else if (delta >= minuteMS){
    const num = delta/ minuteMS;
    return `${num.toFixed(0)} minute${num >= 2 ? 's' : ''} ago`;
  
  } else {
    return `Less than 1 minute ago`;
  }
}

// Converts an array of crop objects, which each contain propertes X and Y, into a matrix of
// crop objects where the matrix coords match the crop X and Y properties
export function cropArrToMatrix(cropArr:Array<any>, length:number, width:number){
  const matrix = Array.from(Array(length), () => Array.from(Array(width)));
  for (let crop of cropArr){
    matrix[crop.y][crop.x] = crop;
  }
  return matrix;
}

// Unpacks a matrix of crop objects into a 1 dimensional array
export function cropMatrixToArr(cropMatrix:Array<Array<any>>){
  const arr = [];
  for (let i = 0; i < cropMatrix.length; i++){
    for (let j = 0; j < cropMatrix[i].length; j++){
      if (cropMatrix[i][j]) arr.push(cropMatrix[i][j]);
    }
  }
  return arr;
}

export function validateFormData(formData:any, schema:any){
  const validateRequired = (input:any) => (input !== null && input !== undefined && input !== "");
  const validateMinLength = (input:string, min:number) => (input.length >= min);
  const validateMaxLength = (input:string, max:number) => (input.length <= max);
  const validateType = (input:any, type:string) => (typeof input === type);
  const validateMatch = (input:string, target:string) => (input === target);
  
  const validateFormat = (input:string, format:string) => {
    switch (format){
      case "email":
        const atIdx = input.indexOf("@");
        if (atIdx <= 0) return false;
        const dotIdx = input.slice(atIdx).indexOf(".");
        return ((dotIdx > 1) && (dotIdx < input.slice(atIdx).length - 1));
      default:
        throw new Error(`Error: attempted to validate with unsupported format: ${format}`)
    }
  }
  
  const errors = {};
  for (let field of Object.keys(schema)){
    //@ts-ignore
    errors[field] = [];
    for (let validator of Object.keys(schema[field])){
      switch (validator){
        case "required":
          //@ts-ignore
          if (!validateRequired(formData[field])) errors[field].push("This field is required.");
          break;
        case "minLength":
          if (!validateMinLength(formData[field], schema[field][validator])){
            //@ts-ignore
            errors[field].push(`This field's minimum length is ${schema[field][validator]}.`);
          }
          break;
        case "maxLength":
          if (!validateMaxLength(formData[field], schema[field][validator])){
            //@ts-ignore
            errors[field].push(`This field's maximum length is ${schema[field][validator]}.`);
          }
          break;
        case "type":
          if (!validateType(formData[field], schema[field][validator])){
            //@ts-ignore
            errors[field].push(`This field's must be of type ${schema[field][validator]}.`);
          }
          break;
        case "format":
          if (!validateFormat(formData[field], schema[field][validator])){
            //@ts-ignore
            errors[field].push(`This field does not follow ${schema[field][validator]} format.`);
          }
          break;
        case "match":
          // try and get more scuffed than this
          const value = formData[field];
          const matcherKey = schema[field][validator];
          const target = formData[matcherKey]
          if (!validateMatch(value, target)){
            //@ts-ignore
            errors[field].push('Fields must match.');
          }
          break;
        default:
          throw new Error(`Error: attempted to use unsupported validator: ${validator}`);
      }
    }
  }
  for (let field of Object.keys(errors)){
    //@ts-ignore
    if (errors[field].length < 1) delete errors[field];
  }
  return Object.keys(errors).length > 0 ? {errors, success : false } : { success: true };
}