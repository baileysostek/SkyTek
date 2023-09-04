// Here we define and implement all client-side API calls. 
// These calls are limited to only using javascript functionality availabe to a browser.
// We use IPC Channels to communicate between the client and server.

// ImportTypes
import { SkyTekDevice } from 'src/types';

// The goal of these API functions are to interface with the Zustand device state for the user so that the react lifecycle can pick up on the zustand event changes and update the DOM automatically for the user
// Import Zustand Stores
import { useDeviceStore } from './store/DeviceStore';

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
ipcRenderer.on("/addDevice", (_event, device : SkyTekDevice) => {
  let devices = [...useDeviceStore.getState().devices];
  devices.push(device);
  useDeviceStore.getState().setDevices(devices);
});
// Subscribe to an IPC Channel for listening for device disconnects.
ipcRenderer.on("/removeDevice", (_event, device : SkyTekDevice) => {
  let devices = [...useDeviceStore.getState().devices];
  console.log("Removing", device, devices);
  let deviceIndex = devices.map((skyTekDevice) => (skyTekDevice.port)).indexOf(device.port);
  if(deviceIndex >= 0){
    devices.splice(deviceIndex, 1);
    useDeviceStore.getState().setDevices(devices);
  }
});


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