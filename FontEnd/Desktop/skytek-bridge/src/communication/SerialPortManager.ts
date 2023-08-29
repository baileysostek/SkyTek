import {SerialPort, ReadlineParser } from "serialport";

import { SkyTekDevice } from "../types";

// This is a map of values we will return
let devices = new Map<string, ControlledSkyTekDevice>();

type ControlledSkyTekDevice = {
  port : SerialPort;
  parser : ReadlineParser;
  device : SkyTekDevice;
  callback : (data : string) => void | null;
}

type SerialResponse = {
  id:string,
  data:string,
}

export function discover():  Promise<Array<SkyTekDevice>> {
  // We dont know how long this function will take to return, so we will return a promise that we can then observe the lifecycle of.
  return new Promise((resolve, reject) => {
    // Request a list of all serial ports
    SerialPort.list().then((ports) => {

      // Get a set of the keys of the connected devices
      let connectedDevices = Array.from(devices.keys());
      console.log("Connected:", connectedDevices);

      // Loop through every available serial port.
      for(let portInfo of ports){
        // Define the key for this port
        let portPath = portInfo.path;

        // Check if we already knew about this
        let index = connectedDevices.indexOf(portPath);
        if(index >= 0){
          // We already have this device registered.
          connectedDevices.splice(index, 1);
          continue; // TODO: in the future key on device id?
        }

        // Create a connection to that serial port
        const port = new SerialPort({ path: portPath, baudRate:9600 });
        const parser: ReadlineParser = new ReadlineParser();
        port.pipe(parser);
        parser.on('data', (data) => {
          console.log(data);
          if(devices.has(portPath)){
            let device = devices.get(portPath);
            if(device.callback){
              device.callback(data);
            }
          }
        });

        // Here we do our SkyTek Handshake to confirm that we are talking with a skytek device.

        // Once confirmed that we are talking with a skytek device, we create an instance of that device with the capabilities the device says it has.
        let device = new SkyTekDevice(portPath);

        // Add this new device to our map of devices. Our internal heartbeat loop will monitor connection status and state changes automatically.
        devices.set(portPath, {
          port : port,
          parser : parser,
          device : device,
          callback : null,
        });
      }

      // Now we will remove any devices that we had regisered but did not see in this discovery process.
      for(let deviceKey of connectedDevices){
        devices.delete(deviceKey);
      }
      
      console.log(devices);

      //Return the map of connected devices
      resolve(Array.from(devices.values()).map(controlledDevice => controlledDevice.device));

    }).catch((error) => {
      reject(error);
    });
  });
}

/**
 * This function allows someone to write to the standard in (stdin) of a Serial port and listen for the response.
 */
export function query(skyTekDevice : SkyTekDevice, request : string, args : any = []): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log(skyTekDevice, request, ...args);
    if(devices.has(skyTekDevice.port)){
      let device = devices.get(skyTekDevice.port);
      let port = device.port; // Get our real serial port

      console.log('Writing Message:', request);
      port.write(request, function(err) {
        if (err) {
          console.log('Error: Could not write message.');
          return reject(err?.message);
        }
        console.log('message written');
        device.callback = (data : string) => {
          resolve(data);
          delete device.callback;
        }
      });

    }else{
      resolve("");
    }
  });
}