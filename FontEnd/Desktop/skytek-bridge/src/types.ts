import {SerialPort, ReadlineParser } from "serialport";

export class SkyTekDevice {
  name : string;
  id   : string;
  port : SerialPort;
  capabilities : Array<SkyTekCapability>[]; 

  // Things the device can do
  constructor(){

  }

  test : () => {
    
  }
}

// Some Capabilities
// - Seraialport - Devices with Serial Port Capabilities Can print out data over a serial bit stream.
// - SkyTekCore  - Devices with this capability can listen for and respond to SkyTek Commands. This is the API that all SkyTekDevices use
// - Vehicle     - This Capability states that the device can be 
// - PyroChannel - This Device Can Fire PyroChannels
// - Radio       - This Device Can communicate with a base station over point-to-point radio
// - Position    - This Device Can know its GPS Position
// - Acceleration- This device knows its XYZ ACC
// - Altitude    - This Device knows its altitude

// This is the 
export class SkyTekCapability{
  // Properties
  name : string;

  constructor(capability_name : string){
    this.name = capability_name;

  }
}
