import {SerialPort, ReadlineParser } from "serialport";

export class SkyTekDevice {
  name : string;
  port : SerialPort;
  capabilities : Array<SkyTekCapability>[]; 

  // Things the device can do
  constructor(){

  }

  test : () => {
    
  }
}

// This is the 
export class SkyTekCapability{
  // Properties
  name : string;

  constructor(capability_name : string){
    this.name = capability_name;

  }
}
