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
}

export const useDeviceStore = createStore<DeviceStore>((set) => ({
  devices: [],
  setDevices: (devices : Array<SkyTekDevice>) => set({devices : devices}),

  selected : null,
  selectDevice: (device : SkyTekDevice) => set({selected : device}),
  deselectDevice: () => set({selected : null}),
}))