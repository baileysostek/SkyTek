// Here we define sybmols that our modules can import and use to determine how Third Party Content is rendered. 

const noExports = Symbol('no exports');

export function test(){
  return noExports;
}