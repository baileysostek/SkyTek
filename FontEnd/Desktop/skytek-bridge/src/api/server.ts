// Here we define and implement all server-side API calls. 
// These calls and functions can use the full suite of NodeJS features by being executed within the Electron process. 
// We use IPC Channels to communicate between the client and server.

import {SerialPort, ReadlineParser } from "serialport";
import { v4 as uuidv4 } from 'uuid';
import { SkyTekDevice } from "../types";

// Define any constants here
const COMMAND_START_CHARACTER = '/';
const COMMAND_END_CHARACTER = '\n';
const UUID_DELIMITER_CHARACTER = ':';
const SKYTEK_ID_REQUEST = '/skytek';

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

      let connections = Array<Promise<any>>();

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

        // Push new promise onto our array of promises to execute
        connections.push(new Promise((resolve, reject) => {
          // Create a connection to that serial port. 
          const port = new SerialPort({ path: portPath, baudRate:9600 }, (err) => {
            // console.log("Port Creation Error:", err); // Sometimes we wont be able to talk to the serial port, if that is the case return.
            return reject(err);
          });

          // Define a new parser to parse the data that comes out of this serial port.
          const parser: ReadlineParser = new ReadlineParser();
          port.pipe(parser);

          // Here we do our SkyTek Handshake to confirm that we are talking with a SkyTek device.
          port.write(SKYTEK_ID_REQUEST, (err) => {
            if (err) {
              // console.log('Error: Could not write message.');
              return reject('Error: Could not write message.');
            }

            // TODO refactor into call and response system.
            parser.once('data', (data) => {
              // We recieved data from our SkyTek device
              console.log(portPath, "data:", data);
              // Once confirmed that we are talking with a skytek device, we create an instance of that device with the capabilities the device says it has.
              let device = new SkyTekDevice(portPath);

              // Add this new device to our map of devices. Our internal heartbeat loop will monitor connection status and state changes automatically.
              devices.set(portPath, {
                port : port,
                parser : parser,
                device : device,
                callback : null,
              });

              // Pipe all data from this port to our callback listeners.
              parser.on('data', (data) => {
                console.log(portPath, "data", data);
                resolveCallbacks(data);
              });

              return resolve(device);
            });
          });
        }));  
      }

      // We have constructed a promise which trys to connect to a port and communicate with a SkyTek device.
      // Here we execute all of those promises and wait for them to return.
      Promise.all(connections).then((data) => {
        console.log("Promise All Data:", data);
      }).catch((err) => {
        console.log("Promise All Error:", err);
      }).finally(() => {
        // Now we will remove any devices that we had regisered but did not see in this discovery process.
        for(let deviceKey of connectedDevices){
          devices.delete(deviceKey);
        }
        
        console.log(devices);

        //Return the map of connected devices
        resolve(Array.from(devices.values()).map(controlledDevice => controlledDevice.device));
      });

    }).catch((error) => {
      reject(error);
    });
  });
}

// Here we define an enum of all of the message types

/**
 * This function allows someone to write to the standard in (stdin) of a Serial port and listen for the response.
 */
export function query(skyTekDevice : SkyTekDevice, command : string, args : any = []): Promise<JSON> {
  // Check to see if our command starts with the command character
  //TODO: Check that this device has a command handler for the command we are passing.
  return new Promise((resolve, reject) => {
    // Generate a new UUID for this message. 
    let uuid =  uuidv4().replaceAll("-", "");
    console.log("ID", uuid);

    // build our message here
    // TODO account for args
    let request = COMMAND_START_CHARACTER+uuid+UUID_DELIMITER_CHARACTER+command+COMMAND_END_CHARACTER;

    // Log 
    console.log("Writing", request, "to", skyTekDevice);

    if(devices.has(skyTekDevice.port)){
      let device = devices.get(skyTekDevice.port);
      let port = device.port; // Get our real serial port

      // Write the command to the port. 
      port.write(request, (err) => {
        // Ensure command was written to port.
        if (err) {
          console.log('Error: Could not write message.');
          return reject(err?.message);
        }

        console.log("Message Written successfuly.");
        
        // Add the listener to our set of callbacks
        return registerCallback(uuid, (data : JSON | null) => {
            console.log("Resolving Callback:", uuid);
            resolve(data ? data : {} as JSON);
        })
      });

    }else{
      resolve({} as JSON);
    }
  });
}

// Here we store a 
let callbacks = new Map<string, (data : JSON | null) => void>();
function registerCallback(uuid : string, callback : (data : JSON | null) => void){
  callbacks.set(uuid, callback);
}

// Our responses should be json data.
function resolveCallbacks(jsonData : string){
  try{
    // Try parse the json
    let json = JSON.parse(jsonData);

    console.log("JSON data", json, json.hasOwnProperty("id"));

    // If we have a json object with a key of "id", store that value
    if(json.hasOwnProperty("id")){
      let uuid = json.id;
      console.log("message has ID", uuid, callbacks);
      // Check to see if we have a callback waiting on that message.
      if(callbacks.has(uuid)){
        // Execute the callback.
        callbacks.get(uuid)(json); // call the callback with the data passed.
        // Remove that Callback
        callbacks.delete(uuid);
        // At this point we have handled the message coming back. 
        return;
      }
    }
  }catch(err){
    // If we get an error say the error.
    // console.log(err);
    return;
  }

  // If we get here, we had a generic message with no callbacks. This means it could be a boradcast message, so check our event listeners.
  //TODO: event system.
}