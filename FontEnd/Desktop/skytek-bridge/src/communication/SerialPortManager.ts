import {SerialPort, ReadlineParser } from "serialport";

import { SkyTekDevice } from "../types";

// Create a Map of ports to Skytek Devicess
const devices = new Map<string, SkyTekDevice>();

export default function discover():  Promise<SkyTekDevice> {
  // We dont know how long this function will take to return, so we will return a promise that we can then observe the lifecycle of.
  return new Promise((resolve, reject) => {
    // Request a list of all serail ports
    SerialPort.list().then((ports) => {
      // Loop through every available serial port.
      for(let portInfo of ports){
        // Create a connection to that serial port
        const port = new SerialPort({ path:portInfo.path , baudRate:9600 });
        const parser: ReadlineParser = new ReadlineParser();
        port.pipe(parser);
        parser.on('data', console.log);
        port.write('/connected\n');

        // Here we do our SkyTek Handshake to confirm that we are talking with a skytek device.

        // Once confirmed that we are talking with a skytek device, we create an instance of that device with the capabilities the device says it has.
        let device = new SkyTekDevice()

        // Add this new device to our map of devices. Our internal heartbeat loop will monitor connection status and state changes automatically.
        devices.set(portInfo.path, device);

        //Return this new device.
        resolve(device);
      }
    }).catch((error) => {
      reject(error);
    });
  });
}