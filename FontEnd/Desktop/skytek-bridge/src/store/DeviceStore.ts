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

export function get(route:string, data:any = null, duration:number = QUERY_TIMEOUT) : Promise<any> {
  return new Promise((resolve, reject) => {
    // Setup a callback that will terminate this promise after the QUERY_TIMEOUT has elapsed.
    let timeout_id = setTimeout(() => {
      reject(); // TODO: Query Error
    }, duration);

    // Here is where we send the event.
    ipcRenderer.invoke(route, data).then((result : any) => {
      clearTimeout(timeout_id);
      resolve(result);
    });
  });
}