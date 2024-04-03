// Here we define and implement all client-side API calls. 
// These calls are limited to only using javascript functionality availabe to a browser.
// We use IPC Channels to communicate between the client and server.

// Import Types
import { SkyTekSubscriber, SkyTekDevice } from '../types';

// Import UUID so we can use UUIDs
import { v4 as uuidv4 } from 'uuid';

// The goal of these API functions are to interface with the Zustand device state for the user so that the react lifecycle can pick up on the zustand event changes and update the DOM automatically for the user
// Import Zustand Stores
import { useDeviceStore } from './store/DeviceStore';
import { IpcRendererEvent } from 'electron';
import { Router } from 'react-router-dom';
import { DEVICE_CAPABILITIES, ADD_DEVICE, REMOVE_DEVICE } from './Topics';

// These are the functions that connect to the API, they store data in the zustand store
// Import IPC Renderer to allow the frontend to talk to the backend.
const { ipcRenderer } = window.require('electron');

// This is the maximum amount of time in MS that a backend query should take.
const QUERY_TIMEOUT = 10 * 1000; // 10s


// Register an API call for requesting that the host hardware look for what devices are available.
export function getDevices() : Promise<Array<SkyTekDevice>>{
  return new Promise((resolve, reject) => {
    get("/devices").then((skytekDevices : Array<SkyTekDevice>) => {
      resolve(skytekDevices);
    }).catch((error : any) => {
      reject(error);
    });
  });
}
// Subscribe to an IPC Channel for listening for device connections.
ipcRenderer.on(ADD_DEVICE, (_event, device : SkyTekDevice) => {
  let devices = [...useDeviceStore.getState().devices];
  devices.push(device);
  useDeviceStore.getState().setDevices(devices);
});
// Subscribe to an IPC Channel for listening for device disconnects.
ipcRenderer.on(REMOVE_DEVICE, (_event, device : SkyTekDevice) => {
  let devices = [...useDeviceStore.getState().devices];
  console.log("Removing", device, devices);
  let deviceIndex = devices.map((skyTekDevice) => (skyTekDevice.port)).indexOf(device.port);
  if(deviceIndex >= 0){
    let device = devices.splice(deviceIndex, 1)[0];
    useDeviceStore.getState().setDevices(devices);

    // Clean up event listeners on this device.
    if(eventListeners.has(device)){
      let listeners = eventListeners.get(device);

      // Keep a count of the listeners we removed.
      let removedCount = 0;
      let initialCount = eventListeners.get(device).length;

      // For each eventListener
      for(let listener of listeners){
        if(listener.autoCleanup){ // Remove the event listener if autoCleanup is enabled.
          let index = listeners.indexOf(listener);
          // Remove
          listeners.splice(index, 1)
          removedCount++;
        }
      }

      console.log("[CLEANUP] - Listeners before:", initialCount, "Listeners after:", eventListeners.get(device).length, "Removed:", removedCount);

      // TODO: cleanup the selected device if it just dropped out.
    }
  }
});

export function refreshDevices(){
  return timeout(new Promise((resolve, reject) => {
    // Here is where we send the event.
    let devices = [...useDeviceStore.getState().devices];
    ipcRenderer.invoke("/refreshDevices", devices).then((result : any) => {
      resolve(result);
    }).catch((error) => {
      console.log("Error", error)
      reject(error)
    })
  }), QUERY_TIMEOUT);
}

// Here we are going to register a function that allows for a user to select a specific device to be their controlled device. 
export function selectDevice(device : SkyTekDevice){
  useDeviceStore.getState().selectDevice(device);
} 

export function deselectDevice(){
  useDeviceStore.getState().deselectDevice();
} 

function timeout(prom : Promise<any>, time : number) : Promise<number> {
	let timer : any;
	return Promise.race([
		prom,
		new Promise((_r, rej) => timer = setTimeout(rej, time))
	]).finally(() => clearTimeout(timer));
}

export function get(route:string, data:any = null, duration:number = QUERY_TIMEOUT) : Promise<any> {
  return timeout(new Promise((resolve, reject) => {
    // Here is where we send the event.
    ipcRenderer.invoke(route, data).then((result : any) => {
      resolve(result);
    }).catch((err) => {
      reject(err);
    });
  }), duration);
}

export function query(data:any = null, duration:number = QUERY_TIMEOUT) : Promise<any> {
  return timeout(new Promise((resolve, reject) => {
    // Here is where we send the event.
    ipcRenderer.invoke("/query", data).then((result : any) => {
      resolve(result);
    }).catch((error) => {
      console.log("Error", error)
      reject(error)
    })
  }), duration);
}

// When using the Event System some topics can be subscribed to. We define a custom type representing the subscriberID and callback for each instance of a listener.
type SkyTekSubscriber = {
  id: string,
  topic: string,
  autoCleanup: boolean, 
  listener: (event: IpcRendererEvent, ...args: any[]) => void
}

// Hold onto a list of all subscriber actions, these events will be automatically cleaned up by default.
const eventListeners = new Map<SkyTekDevice, Array<SkyTekSubscriber>>();
function addEvent(device : SkyTekDevice, listener : SkyTekSubscriber){
  if(!eventListeners.has(device)){
    eventListeners.set(device, new Array<SkyTekSubscriber>());
  }
  eventListeners.get(device).push(listener);
}
const globalEventListeners = Array<SkyTekSubscriber>();
function addGlobalEvent(listener : SkyTekSubscriber){
  globalEventListeners.push(listener);
}

/**
 * This function allows us to register interest in a specifc device message. 
 * @param {SkyTekDevice} device - The specific SkyTek device we are listening to.
 * @param {string} topic - The message topic that we want to listen for.
 * @param {(data : JSON | null) : void} callback - The callback function which fires when the observed device emits a message about the specific topic.
 * @returns {SkyTekSubscriber} 
 */
export function subscribe(device : SkyTekDevice, topic : string, callback : (data : JSON | null) => void) : SkyTekSubscriber {
  // Create a new subscriber
  let subscriber : SkyTekSubscriber = {
    id : uuidv4(),
    topic : "/"+device.uuid+(topic.startsWith("/") ? topic : "/" + topic),
    autoCleanup: true,
    listener : (_event, data) => {
      callback(data);
    }
  }

  // Register this subscriber with IPC
  ipcRenderer.on(subscriber.topic, subscriber.listener);

  // Store this subscriber in our map of eventListeners
  addEvent(device, subscriber);

  // Return this subscriber
  return subscriber;
}

/**
 * This allows a user to subscribe to a global topic, rather than a message from a specific device.
 * @param topic 
 * @param callback 
 * @returns 
 */
export function subscribeGlobal(topic : string, callback : (data : JSON | null) => void) : SkyTekSubscriber {
  // Create a new subscriber
  let subscriber : SkyTekSubscriber = {
    id : uuidv4(),
    topic : (topic.startsWith("/") ? topic : "/" + topic),
    autoCleanup: true,
    listener : (_event, data) => {
      callback(data);
    }
  }

  // Register this subscriber with IPC
  ipcRenderer.on(subscriber.topic, subscriber.listener);

  // Store this subscriber in our map of eventListeners
  addGlobalEvent(subscriber);

  // Return this subscriber
  return subscriber;
}

// Router
let router : any;
export function setRouter(theRouter : any){
  router = theRouter;
}
export function navigate(path : string) : void {
  router.navigate(path);
}
export function getRoute() : string {
  let route = router.state.location.pathname;
  console.log("route:", route)
  return route;
}



/**
 *  
 */
ipcRenderer.on(DEVICE_CAPABILITIES, (_event, capabilityHandlers : Array<string>) => {
  useDeviceStore.getState().setCapabilities(capabilityHandlers);
});