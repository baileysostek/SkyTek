export class SkyTekDevice {
  // This is a unique ID which identifys this specific SkyTekDevice
  uuid : string;

  // These properties are published about the device. 
  name : string;
  port : string;
  capabilities : Array<SkyTekCapability>[]; 

  // Things the device can do
  constructor(uuid: string, port : string){
    this.uuid = uuid;
    this.port = port;
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

// Errors
export class SkyTekError{
  // Properties
  readonly error_type : SkyTekErrorType;
  readonly error_name : string;
  readonly error_description : string;

  constructor(error_type : SkyTekErrorType, error_name : string, error_description : string){
    this.error_type = error_type;
    this.error_name = error_name;
    this.error_description = error_description;
  }
}

export enum SkyTekErrorType{
  QUERY_TIMEOUT, 
}