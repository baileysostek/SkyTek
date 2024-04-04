// ImportTypes
import { SkyTekDevice } from 'src/types';

// Zustand Store stuff
import { createStore } from 'zustand/vanilla'

interface DeviceStore {
  devices: Array<SkyTekDevice>;
  setDevices: (devices: Array<SkyTekDevice>) => void;

  selected: SkyTekDevice | null;
  selectDevice: (device : SkyTekDevice) => void;
  deselectDevice: () => void;

  capabilities : Array<string>;
  setCapabilities : (capabilities : Array<string>) => void
}

export const useDeviceStore = createStore<DeviceStore>((set) => ({
  devices: [],
  setDevices: (devices : Array<SkyTekDevice>) => set({devices : devices}),

  selected : null,
  selectDevice: (device : SkyTekDevice) => {
    // Check if we are selecting null
    if (device) { // Deselect
      console.log("Deselecting device.");
    }
    // Set the selected device
    set({selected : device});
  },
  deselectDevice: () => set({selected : null}),

  capabilities: [],
  setCapabilities: (capabilities : Array<string>) => set({capabilities : capabilities}),
}))