// ImportTypes
import { SkyTekDevice } from 'src/types';

// Zustand Store stuff
import { createStore } from 'zustand/vanilla'

interface DeviceStore {
  devices: Array<SkyTekDevice>;
  setDevices: (devices: Array<SkyTekDevice>) => void;
}

export const useDeviceStore = createStore<DeviceStore>((set) => ({
  devices: [],
  setDevices: (devices : Array<SkyTekDevice>) => set({devices : devices}),
}))

// These are the functions that connect to the API, they store data in the zustand store
// Import IPC Renderer to allow the frontend to talk to the backend.
const { ipcRenderer } = window.require('electron');

// This is the maximum amount of time in MS that a backend query should take.
const QUERY_TIMEOUT = 10 * 1000; // 10s


export function getDevices() : Promise<Array<SkyTekDevice>>{
  return new Promise((resolve, reject) => {
    get("/devices").then((devices : Array<SkyTekDevice>) => {
      useDeviceStore.getState().setDevices(devices);
      console.log("Response:", devices);
      resolve(useDeviceStore.getState().devices);
    }).catch((error : any) => {
      reject(error);
    });
  });
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