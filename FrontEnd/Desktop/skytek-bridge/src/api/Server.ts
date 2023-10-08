// Here we define and implement all server-side API calls. 
// These calls and functions can use the full suite of NodeJS features by being executed within the Electron process. 
// We use IPC Channels to communicate between the client and server.
import {SerialPort, ReadlineParser } from "serialport";
import { mainWindow } from "../index";
import { v4 as uuidv4 } from 'uuid';
import { SkyTekDevice } from "../types";
import { ipcMain } from "electron";
import { log } from "./logging/Logger";

// Import FS
import * as fs from "fs";

// Import Mustache for substitution.
import Mustache from 'mustache';

// Define constants for capabilities
const CAPABILITIES_DIRECTORY_PATH = "./src/components/capabilities/"; // Relative Path to Base
const CAPABILITY_PREFIX = "SkyTek_"; // Prefix for files.
const CAPABILITY_EXTENSION = ".tsx";

// Define any constants here
const COMMAND_START_CHARACTER = '/';
const COMMAND_END_CHARACTER = '\n';
const UUID_DELIMITER_CHARACTER = ':';
const SKYTEK_ID_REQUEST = 'skytek';

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

type SkyTekInitializationResponse = {
  id : string, 
  version: number
}

let interval : NodeJS.Timeout | null = null;
ipcMain.handle("/onLoad", () => {
  init(); // When the application loads, init the Server.
});

//TODO:singleton
function init(){
  if(interval){
    clearInterval(interval);
  }
  interval = setInterval(() => {
    discover();
  }, 1000)


  let capabilitiesContent = fs.readdirSync(CAPABILITIES_DIRECTORY_PATH);
  let capabilities = [];
  for(let file of capabilitiesContent){
    if(file.startsWith(CAPABILITY_PREFIX)){
      let capabilityName = file.replace(CAPABILITY_PREFIX, "").replace(CAPABILITY_EXTENSION, "");
      capabilities.push(capabilityName);
    }
  }

  console.log("Capability Handlers discovered:", capabilities);

  mainWindow.webContents.send("/getRegisteredCapabilities", capabilities);
}

export function discover():  Promise<Array<SkyTekDevice>> {
  // We dont know how long this function will take to return, so we will return a promise that we can then observe the lifecycle of.
  return new Promise((resolve, reject) => {
    // Request a list of all serial ports
    SerialPort.list().then((ports) => {

      // Get a set of the keys of the connected devices
      let connectedDevices = Array.from(devices.keys());

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
          continue;
        }

        // Push new promise onto our array of promises to execute
        connections.push(new Promise((resolve, reject) => {
          // Create a connection to that serial port. 
          const port = new SerialPort({ path: portPath, baudRate:115200 }, (err) => {
            // console.log("Port Creation Error:", err); // Sometimes we wont be able to talk to the serial port, if that is the case return.
            return resolve("Error: Could not open connection to device.");
          });

          // Define a new parser to parse the data that comes out of this serial port.
          const parser: ReadlineParser = new ReadlineParser();
          port.pipe(parser);

          // Here we do our SkyTek Handshake to confirm that we are talking with a SkyTek device.
          // Generate a new UUID for this message. 
          let uuid =  uuidv4().replaceAll("-", "");

          // build our message here
          let request = COMMAND_START_CHARACTER+uuid+UUID_DELIMITER_CHARACTER+SKYTEK_ID_REQUEST;

          // Here we need to persist the initial listener we use to listen for response
          let requestResponseListener : (chunk: any) => void;

          // Write the command to the port. 
          port.write(request, (err) => {
            // Ensure command was written to port.
            if (err) {
              console.log('Error: Could not write message.');
              return reject(err?.message);
            } else {
              console.log("Device connected on port:", portPath, ". Attempting to connect to device...");
              console.log(request);

              // Pipe all data from this port to our callback listeners.
              requestResponseListener = (data) => {
                resolveCallbacks(null, data);
              };
              parser.on('data', requestResponseListener);
            }
            
            // Add the listener to our set of callbacks
            // Eventually this CB will trigger if we get a response from the device.
            registerCallback(uuid, (data : JSON | null) => {
              // We received data from our SkyTek device
              console.log(portPath, "data:", data);
              
              // Once confirmed that we are talking with a SkyTek device, we create an instance of that device with the capabilities the device says it has.
              let device_uuid;
              if(data.hasOwnProperty("uuid")){
                //@ts-ignore // TODO: cast the JSON returned to an expected type.
                device_uuid = data.uuid;
              }else{
                device_uuid = uuidv4();
                console.log("Warning: SkyTek device does not define ID");
              }

              // Create our SkyTek device.
              let device = new SkyTekDevice(device_uuid, portPath);

              // At this point we have a device
              // Keep track of it in our list of devices
              devices.set(portPath, {
                port : port,
                parser : parser,
                device : device,
                callback : null,
              }); 

              // Now we need to remove the old listener
              parser.removeListener('data', requestResponseListener); // Remove old Listener

              // Register a new listener aware of our device context.
              console.log("Registering new Listener");
              parser.on('data', (data) => {
                resolveCallbacks(device, data);
              });

              // Register a callback for the device disconnecting / closing
              port.on('close', (err : any) => {
                console.log("Serial Port closed", err);
                removeDevice(device);
              });

              // At this point we have a valid SkyTek device, lets get its capabilities
              query(device, "capabilities").then((data) => {
                if(data.hasOwnProperty("capabilities")){
                  //@ts-ignore - We have ensured that this property does in fact exist.
                  for(let capability of data.capabilities){
                    console.log("Searching for capability:", capability);

                    device.addCapability(capability);

                    //TODO load code here telling the FrontEnd what component it should try to render.

                    // let capabilityCode = require(
                    //   Mustache.render(
                    //     "{{{CAPABILITIES_DIRECTORY_PATH}}}{{{CAPABILITY_PREFIX}}}{{{capability}}}{{{CAPABILITY_EXTENSION}}}",
                    //     {
                    //       CAPABILITIES_DIRECTORY_PATH,
                    //       CAPABILITY_PREFIX,
                    //       capability,
                    //       CAPABILITY_EXTENSION
                    //     }
                    //   )
                    // );
                    
                    // console.log(capabilityCode);
                  }
                }
              }).catch((err) => {
                console.log("Error reading capabilities:", err);
              }).finally(() => { // No matter how the promise resolves, return the new device.
                // We have configured this device and retrieved as much information about its state as possible, broadcast the capabilites and existance of this device.
                // Broadcast Device Available
                broadcastDeviceAvailable(device);
                // Resolve this promise.
                return resolve(device);
              })
            })
          });
        }));  
      }

      // We have constructed a promise which tries to connect to a port and communicate with a SkyTek device.
      // Here we execute all of those promises and wait for them to return.
      Promise.all(connections).then((data) => {
      }).catch((err) => {
        console.log("Promise All Error:", err);
      }).finally(() => {
        // Now we will remove any devices that we had registered but did not see in this discovery process.
        for(let deviceKey of connectedDevices){
          removeDevice(devices.get(deviceKey).device);
        }
        
        // Update the Zustand store with the updated device list.
        let skytekDevices = Array.from(devices.values()).map(controlledDevice => controlledDevice.device);

        //Return the map of connected devices
        resolve(skytekDevices);
      });

    }).catch((error) => {
      reject(error);
    });
  });
}

/**
 * This function allows someone to write to the standard in (stdin) of a Serial port and listen for the response.
 */
export function query(skyTekDevice : SkyTekDevice, command : string, args : any = []): Promise<JSON> {
  // Check to see if our command starts with the command character
  //TODO: Check that this device has a command handler for the command we are passing.
  return new Promise((resolve, reject) => {
    // Check that we have this device registered.
    if(devices.has(skyTekDevice.port)){
      // Get the device
      let device = devices.get(skyTekDevice.port);
      let port = device.port; // Get our real serial port

      // Generate a new UUID for this message. 
      let uuid =  uuidv4().replaceAll("-", "");

      // build our message here
      // TODO: account for args
      let request = COMMAND_START_CHARACTER+uuid+UUID_DELIMITER_CHARACTER+command;

      // Log 
      console.log("[QUERY-REQUEST]", skyTekDevice.port, ":", uuid, ":", request);

      // Write the command to the port. 
      port.write(request, (err) => {
        // Ensure command was written to port.
        if (err) {
          console.log('Error: Could not write message.');
          return reject(err?.message);
        }
        
        // Add the listener to our set of callbacks
        return registerCallback(uuid, (data : JSON | null) => {
            console.log("[QUERY-RESPONSE]", skyTekDevice.port, ":", uuid, ":", data);
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
function resolveCallbacks(device : SkyTekDevice | null, jsonData : string){
  try{
    // Try parse the json
    let json = JSON.parse(jsonData);

    // If we have a json object with a key of "id", store that value
    // Any message that passes back an "id" is a QUERY type message and we have a single callback which needs to resolve that message
    if(json.hasOwnProperty("id")){
      let uuid = json.id;
      // Check to see if we have a callback waiting on that message.
      if(callbacks.has(uuid)){
        // Delete the UUID off of the response data
        delete json.id;
        // Execute the callback.
        console.log("[QUERY]", (device ? device.port : ""), ":", json);
        callbacks.get(uuid)(json); // call the callback with the data passed.
        // Remove that Callback
        callbacks.delete(uuid);
        // At this point we have handled the message coming back. 
        return;
      }
    }

    // If we get here, we had a generic message with no callbacks. This means it could be a broadcast message, so lets emit that message.
    if(json.hasOwnProperty("topic")){
      let overrideSender = false;
      // If this is a relayed command, it is a PUB-SUB coming from a different device.
      // This means that the device UUID is the remote device's id, not our own.
      if(json.hasOwnProperty("relay")){
        // We are supposed to relay this data. So replace the topic's id with the remote device id.
        overrideSender = json.id;
        // Now that we know this is a command to be relayed, we can delete the relay properties which we no longer need.
        delete json.id;
        delete json.relay;
      }

      // Determine the topic we will emit.
      // Construct the specific Message topic.
      let topic = (json.topic.startsWith("/") ? json.topic : "/"+json.topic);
      // Remove the topic entry from the JSON data
      delete json.topic;

      // Store the UUID of the device that this message originated on.
      let messageOrigin = device.uuid;

      // Send the message
      publishMessageOnTopic(topic, json, messageOrigin, overrideSender);

      // Return from this function, we have handled this message.
      return;
    }

  }catch(err){
    // If we get an error say the error.
    if(err instanceof SyntaxError){
      if(jsonData.startsWith("Error:")){
        console.log((device ? ("["+device.port+"]") : ""), jsonData);
        return;
      }
      console.log("[SYNTAX ERROR]", jsonData);
    }
    return;
  }
  // If we got here we had an error parsing the message we got back from the SkyTek device.
}

function publishMessageOnTopic(topic : string, message: JSON, messageOrigin : string, overrideSender : boolean){
  // Emit the specific message
  if(!overrideSender){
    // This is the specific topic.
    let specificTopic = "/" + messageOrigin + topic;
    // Print the topic and message
    console.log("["+(overrideSender ? "REMOTE-" : "")+"PUB-SUB]", specificTopic, ":", message);
    // Send this message globally.
    mainWindow.webContents.send(specificTopic, message);
  }

  // Print the topic and data that we are about to send.
  console.log("["+(overrideSender ? "REMOTE-" : "")+"PUB-SUB]", topic, ":", message);
  // Emit the global message (done in all cases)
  //@ts-ignore
  message.uuid = messageOrigin; // Add the uuid of the device which this message originated from.
  // Send this message globally.
  mainWindow.webContents.send(topic, message);
}

function broadcastDeviceAvailable(device : SkyTekDevice){
  // Send an IPC message to remove this device.
  mainWindow.webContents.send("/addDevice", device);

  log("Added Device"+device);
}

function removeDevice(skyTekDevice : SkyTekDevice){
  if(devices.has(skyTekDevice.port)){
    devices.delete(skyTekDevice.port);
    // Send an IPC message to remove this device.
    mainWindow.webContents.send("/removeDevice", skyTekDevice);

    console.log("Removed Device", skyTekDevice.port);
  }
}