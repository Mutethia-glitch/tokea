/** Keep escaped transport line breaks out of native UI; never mutate stored content. */
export function displayCopy(value:string):string{
  return value.replace(/\\r\\n|\\n|\\r/g,"\n").replace(/\\t/g," ");
}
