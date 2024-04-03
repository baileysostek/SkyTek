// Import React
import React, { Children, useState, ReactNode } from 'react';

// Import Types
import { SkyTekDevice } from '../types';

// Import our store
import { useStore } from 'zustand'
import { useDeviceStore } from '../api/store/DeviceStore';

// API
import { getRoute, navigate, query, subscribe } from '../api/Client';

// Types
interface Props {
  children: ReactNode
}

const SideBarOffset = ({children}: Props) => {

  // Here is the Zustand store of our devices.
  const deviceStore = useStore(useDeviceStore);

  const drawerWidth = 64;

  const hasDevice = () => {
    return !!deviceStore.selected;
  }

  return (
    <div style={{margin:'0px', marginLeft:hasDevice() ? '64px' : '0px', width:hasDevice() ? 'calc(100% - 64px)' : '100%', height:'100%'}}>
      {children}
    </div>
  );
};

export default SideBarOffset;