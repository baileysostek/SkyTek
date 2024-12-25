// Here we define and implement all server-side API calls. 
// These calls and functions can use the full suite of NodeJS features by being executed within the Electron process. 
// We use IPC Channels to communicate between the client and server.
import {SerialPort, ReadlineParser } from "serialport";
import { mainWindow } from "../index";
import { v4 as uuidv4 } from 'uuid';
import { SkyTekDevice } from "../types";
import { ipcMain } from "electron";
import { log } from "./logging/Logger";
import Express from 'express';

// Import FS
import * as fs from "fs";

// TODO: Refactor to config file.
// Flag for if this is debug or not
const DEBUG = true;
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

// This is a map relating a device UUID to the port that it is connected to.
let deviceIdToPort = new Map<string, string>();

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

// Define the rate at which this backend server polls for new SkyTek Devices.
const DEVICE_DISCOVERY_POLLING_INTERVAL = 1000; // 1000ms = 1 second.
// Define a variable to hold the NodeJS.Timeout instance pointing to our polling loop.
let device_polling_interval : NodeJS.Timeout | null = null;

/**
 * When our Electron window loads, we omit an onLoad message over the onLoad channel, this file intercepts this message and tries to initialize our server.
 */
ipcMain.handle("/onLoad", () => {
  // Initialize our singleton
  Server.initialize();
});

// Singleton instance of our server
class Server {
  // Hold onto the singleton instance of this server.
  private static instance: Server = null;

  // Define the constructor for this Server class.
  private constructor() {
    init();
  }

  /**
   * Here we define the initializer for our Singleton instance. Traditional implementations of the singleton design pattern do not have a separate initialize method,
   * however I find that this design decision introduces unpredictability into the system. It becomes hard to track which call to getInstance is executed first. 
   * Because of this, I separate initialize to its own function which is called ONCE in the place where you want to load your singleton instance.
   * 
   * A byproduct of this design decision is that you can stack singleton initializer and allow them to rely on one-another and start in predictable ways. 
   */
  static initialize() : boolean {
    // If we have not initialized yet, initialize
    if (this.instance == null) {
      // Initialize a new singleton instance. 
      this.instance = new Server();
      // We were able to initialize our server, so we return true
      return true;
    } else {
      // The singleton has already initialized, return false because we did not initialize a new instance of the singleton.
      return false;
    }
  }

  /**
   * Getter for our singleton server instance. 
   * @returns {Server | null} Returns the instance of the Server singleton or null if this instance is not initialized yet.
   */
  static getInstance() : Server {
    return this.instance;
  }

  /**
   * This function is called whenever a message is processed by the device
   */
  static processMessage(data : JSON) : boolean {

    return false;
  }
}

function init(){
  // If we already have a polling loop going, clear that interval.
  if(device_polling_interval){
    clearInterval(device_polling_interval);
  }
  // Define function that polls for new SkyTek devices at a fixed interval.
  device_polling_interval = setInterval(() => {
    discover();
  }, DEVICE_DISCOVERY_POLLING_INTERVAL);

  // Determine the capabilities that the system knows about. 
  // These capabilities can have matching TS libraries which are dynamically loaded in the frontend.
  let capabilitiesContent = fs.readdirSync(CAPABILITIES_DIRECTORY_PATH);
  let capabilities = [];
  for(let file of capabilitiesContent){
    if(file.startsWith(CAPABILITY_PREFIX)){
      let capabilityName = file.replace(CAPABILITY_PREFIX, "").replace(CAPABILITY_EXTENSION, "");
      capabilities.push(capabilityName);
    }
  }

  console.log("Capability Handlers discovered:", capabilities);
  // Tell the frontend which capabilities this backend recognizes.
  mainWindow.webContents.send("/getRegisteredCapabilities", capabilities);

  // If this is debug
  if (DEBUG) {
    // Setup an interval to display debug information.
    setInterval(() => {
      // If we have any waiting callbacks
      if (callbacks.values.length) {
        // Print the number of waiting callbacks.
        console.log(callbacks.values.length, "waiting callbacks.");
      }
    }, 1000);
  }

  // Initialize our express instance
  const app = Express();

  app.get('/query/:id/:query', (req, res) => {
    // Determine the port that this device is connected through, based off the device UUID
    let devicePort = deviceIdToPort.get(req.params.id);
    // Check if we have a device with that device ID
    if (devices.has(devicePort)) {
      let device = devices.get(devicePort);
      // If we have a device
      if (device) {
        let response = {};
        query(device.device, req.params.query).then((data) => {
          response = data;
          res.statusCode = 200;
        }).catch((error) => {
          response = error;
          res.statusCode = 401;
          console.log("Error", error)
        }).finally(() => {
          res.json(response);
          console.log("Response Sent");
        });
      } else {
        res.send("No device with uuid:" + req.params.id + " exists.");
      }
    } else {
      res.send("No device with uuid:" + req.params.id + " exists.");
    }
  })

  app.get('/devices', (req, res) => {
    console.log("Devices", devices);
    let response = {devices:[]};
    for(let controlledDevice of devices.values()){
      let device = controlledDevice.device;
      response.devices.push(device);
    }
    res.json(response);
  });
  
  app.listen(8080)
}

/**
 * This function discoveres all devices connected to the host's serial ports. This function will notify the frontend when a device is disconnected/discovered and will authenticate through a handshake that the connected devices are SkyTek devices.
 * @returns 
 */
export function discover():  Promise<Array<SkyTekDevice>> {
  // We don't know how long this function will take to return, so we will return a promise that we can then observe the lifecycle of.
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
          // Each message has a unique ID associated with it so the callback handler can execute the correct callback when we eventually get a response.
          let uuid =  uuidv4().replaceAll("-", "");

          // build our message here
          let request = COMMAND_START_CHARACTER+uuid+UUID_DELIMITER_CHARACTER+SKYTEK_ID_REQUEST;

          // Here we need to persist the initial listener we use to listen for response
          let requestResponseListener : (chunk: any) => void;

          // Write the command to the port.
          // console.log(port.settings.path, request)
          port.write(request, (err) => {
            // Ensure command was written to port.
            if (err) {
              console.log('Error: Could not write message.');
              return reject(err?.message);
            }

            console.log("Device connected on port:", portPath, "Attempting to connect to device...");
            console.log(request);

            // Define a handler for when this device this serial port sends data to the host.
            requestResponseListener = (data) => {
              resolveCallbacks(null, data);
            };

            // Pipe all data from this port to our callback listeners.
            parser.on('data', requestResponseListener);
            
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

              // Link the UUID of this device to the port that it is connected through.
              deviceIdToPort.set(device_uuid, portPath);

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
 * Broadcast all of the available devices.
 */
export function synchronizeClientServerDevices(clientDevices : Array<SkyTekDevice>){
  // Create lists of toAdd and toRemove
  let toAdd : Array<SkyTekDevice> = new Array<SkyTekDevice>();
  let toRemove : Array<SkyTekDevice> = new Array<SkyTekDevice>();

  // Create a map of client devices
  let clientDeviceMap = new Map<string, SkyTekDevice>();

  // First find the set of devices to disconnect. This is anything present in the Client that the server does not have.
  for(let clientDevice of clientDevices){
    // Add this value to the map for later
    clientDeviceMap.set(clientDevice.uuid, clientDevice);

    // Check if the server has this device.
    if(devices.has(clientDevice.port)){ // We key on the port.
      // Make sure its the same device
      let serverDevice = devices.get(clientDevice.port);
      if(!(serverDevice.device.uuid == clientDevice.uuid)){
        // This device needs to be removed because the client has the wrong device on this port.
        toRemove.push(clientDevice);
      }
    }
  }

  // Now we look for any devices to add, these are any devices that the server has that the client does not.
  for(let serverDevice of devices.values()){
    let serverUUID = serverDevice.device.uuid;
    if(!clientDeviceMap.has(serverUUID)){ // Check if the client has this device or not.
      // If the client does not know about this device, add it to the to add. 
      toAdd.push(serverDevice.device);
    }
  }

  // Add the new devices.
  for(let device of toAdd){
    broadcastDeviceAvailable(device);
  }
}

/**
 * This function allows for a skytek device to be queried.
 * @param skyTekDevice
 * @param command 
 * @param args 
 * @returns 
 */
export function query(skyTekDevice : SkyTekDevice, command : string, args : any = [], timeout : number = (10 * 1000)): Promise<JSON> {
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
          // It is redundant to send the uuid back with this message. We queried the device by UUID, so we dont need to supply the UUID again in the response.
          // Strip out the uuid.
          // @ts-ignore
          if (data['uuid'] != null) {
            // @ts-ignore
            delete data['uuid'];
          }

          // Resolve and send this data. 
          resolve(data ? data : {} as JSON);
        })
      });

      // Here we define a fallback promise rejection to fail the promise after a timeout.
      // This protects our queries from hanging if an edge device fails to respond after the defined TIMEOUT
      setTimeout(() => {
        return reject("Query timed out");
      }, timeout);

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

/**
 * This function is the handler used to decode messages from edge devices and route them through this frontend ecosystem.
 * NOTE: The modality of how the data gets into resolveCallbcacks does not matter, it could be over USB, TCP/UDP, RS232 anything.
 * Once a message has been constructed it should be put through this function to be injected into the system
 * @param device 
 * @param jsonData 
 * @returns 
 */
function resolveCallbacks(device : SkyTekDevice | null, jsonData : string){
  try{
    // Try parse the json
    let json = JSON.parse(jsonData);

    // If we are logging the data, write this message to the log.

    // If we have a json object with a key of "id", store that value
    // Any message that passes back an "id" is a QUERY type message and we have a single callback which needs to resolve that message
    if(json.hasOwnProperty("id")){
      let uuid = json.id;
      // Check to see if we have a callback waiting on that message.
      if(callbacks.has(uuid)){
        // Delete the UUID off of the response data
        delete json.id;
        // Execute the callback.
        // console.log("[QUERY]", (device ? device.port : ""), ":", json);
        callbacks.get(uuid)(json); // call the callback with the data passed.
        // Remove that Callback
        callbacks.delete(uuid);
        // At this point we have handled the message coming back. 
        return;
      }
    }

    // If we get here, we had a generic message with no callbacks. This means it could be a broadcast message, so lets emit that message.
    if(json.hasOwnProperty("topic")){
      // Store the UUID of the device that this message was transmitted through.
      let messageOrigin = device.uuid;

      // Some devices act as relays for other devices in the network. For example, they may have a communication modality that enables them
      // to talk to both this server over Serial and an edge device. In the case that we detect a message originated from another device, we need to
      // override the message author uuid to emulate that the remote device is directly connected to this server.
      let overrideSender = false;
      // If this is a relayed command, it is a PUB-SUB coming from a different device.
      // This means that the device UUID is the remote device's id, not our own.
      if(json.hasOwnProperty("relay")){
        // Since we are overriding the sender, set the overrideSender flag to true.
        overrideSender = true;
        // We are supposed to relay this data. So replace the messageOrigin uuid with the remote device uuid.
        messageOrigin = json.id;
        // Now that we know this is a command to be relayed, we can delete the relay properties which we no longer need.
        delete json.id;
        delete json.relay;
      }

      // Determine the topic we will emit.
      // Construct the specific Message topic.
      let topic = (json.topic.startsWith("/") ? json.topic : "/"+json.topic);
      // Remove the topic entry from the JSON data
      delete json.topic;

      // Send the message to the frontend. 
      publishMessageOnTopic(topic, json, messageOrigin, overrideSender);

      // Return from this function, we have handled this message.
      return;
    }

  } catch(err) {
    // If we get an error print the error.
    if(err instanceof SyntaxError){
      // Device-side error
      if(jsonData.startsWith("Error:")){
        console.log((device ? ("["+device.port+"]") : ""), jsonData);
        return;
      }
      // Error handling the response data.
      console.log("[SYNTAX ERROR]", jsonData);
    }
    return;
  }
  // If we got here we had an error parsing the message we got back from the SkyTek device.
}

/**
 * This function issues two IPC channel messages notifying the frontend that a backend device has issued a message.
 * One message is sent on the specific topic issued by the device globally, without device specific information.
 *    EXAMPLE  [Device:C28BE5FE680E43A1BE510BA46D06E3FD] Issues a "heartbeat" with the data { msg : 1 }
 *    SERVER intercepts this message and sends [/heartbeat : { msg : 1 }]
 * This is issued on the global "/heartbeat" channel and is not associated with the sender at all.
 * ADDITIONALLY a device-specific message is issued.
 *    EXAMPLE  [Device:C28BE5FE680E43A1BE510BA46D06E3FD] Issues a "heartbeat" with the data { msg : 1 }
 *    SERVER intercepts this message and sends [/C28BE5FE680E43A1BE510BA46D06E3FD/heartbeat : { msg : 1 }]
 * This associates the message with the sender.
 * @param topic 
 * @param message 
 * @param messageOrigin 
 * @param overrideSender 
 */
function publishMessageOnTopic(topic : string, message: JSON, messageOrigin : string, overrideSender : boolean){
  // Emit the specific message
  // This is the specific topic.
  let deviceAndTopic = "/" + messageOrigin + topic;
  // Send a specific message originating from the device.
  console.log("["+(overrideSender ? "REMOTE-" : "")+"PUB-SUB]", deviceAndTopic, ":", message);
  mainWindow.webContents.send(deviceAndTopic, message);

  // Send this message globally, no device just topic.
  // Before we send the topic globally we want to append the UUID of the device that this message originated from.
  message['uuid'] = messageOrigin;
  // Print the message to the console and send the global message
  console.log("["+(overrideSender ? "REMOTE-" : "")+"PUB-SUB]", topic, ":", message);
  mainWindow.webContents.send(topic, message);

  // Log info
  // console.log(devices, messageOrigin);
  if(devices.has(messageOrigin)){
    // Log the info
    // devices.get(messageOrigin).device.log("Data:");
  }
}

function broadcastDeviceAvailable(device : SkyTekDevice){
  // Send an IPC message to remove this device.
  mainWindow.webContents.send("/addDevice", device);

  log("Added Device"+device);
}

function removeDevice(skyTekDevice : SkyTekDevice){
  if(devices.has(skyTekDevice.port)){
    // Desociate the device_uuid from this port
    deviceIdToPort.delete(skyTekDevice.uuid);
    // Delete this device from our list of devices.
    devices.delete(skyTekDevice.port);
    // Send an IPC message to remove this device.
    mainWindow.webContents.send("/removeDevice", skyTekDevice);


    console.log("Removed Device", skyTekDevice.port);
  }
}

export function getDeviceByUUID(uuid : string) : SkyTekDevice | null {
  // Ensure that we have this device
  if (!deviceIdToPort.has(uuid)) {
    console.log("Could not find device:", uuid);
    return null;
  }
  
  // We have this device.
  return devices.get(deviceIdToPort.get(uuid)).device;
}