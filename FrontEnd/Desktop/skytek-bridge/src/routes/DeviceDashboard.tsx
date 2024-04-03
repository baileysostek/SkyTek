
// Material UI
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';

// Import our store
import { useStore } from 'zustand'
import { useDeviceStore } from '../api/store/DeviceStore';

// API
import { useEffect, useState } from 'react';
import { ReactJSXElement } from '@emotion/react/types/jsx-namespace';
import { navigate } from '../api/Client';
import { SkyTekDevice } from 'src/types';

// Types
interface Props {

}

const DeviceDashboard = ({}: Props) => {
  // Here is the Zustand store of our devices.
  const deviceStore = useStore(useDeviceStore);

  const [capabilities, setCapabilities] = useState<Map<string, ReactJSXElement>>(new Map<string, ReactJSXElement>());

  // Define a redirect callback here for when we have no selected device.
  useEffect(() => {
    if(!deviceStore.selected){
      navigate('/');
      return;
    }
  }, [deviceStore.selected]); 

  // Every time the device dashboard loads, we will do a refresh of the capabilities.
  useEffect(() => {

    console.log("deviceStore.capabilities", deviceStore.capabilities)

    let allCapabilities = deviceStore.capabilities;

    let newCapabilities = new Map<string, ReactJSXElement>();
    for(let capabilityName of allCapabilities){
      let externalCapability = (require("../components/capabilities/SkyTek_"+capabilityName+".tsx").default);
      newCapabilities.set(capabilityName, externalCapability);
    }

    setCapabilities(newCapabilities);

  }, [deviceStore.capabilities]); // Do every time we select a device.

  // HasDevice
  const hasDevice = () => {
    return !!deviceStore.selected;
  }

  const hasCapability = (item : string) => {
    return deviceStore.capabilities?.includes(item);
  }

  const mapCapabilityToElement = (capability : string) => {
    if(capabilities?.has(capability)){
      let SkyTekCapability = capabilities.get(capability);
      //@ts-ignore - We are doing some hacky stuff here to dynamically load plugins / 3rd party content.
      return <SkyTekCapability style={{width:'100%', height:'100%'}}/>
    } else {
      return <>No handler for {capability} found </>
    }
  }

  return (
    <Grid container spacing={2} style={{margin:'0px',  width:'100%', height:'100%', textAlign:'center'}}>
      {!hasDevice() ? <></> : deviceStore.selected.capabilities.filter(hasCapability).map((item : string , index : number) => (
        <Grid item xs={12} key={index} style={{padding:'0px'}}>
          {mapCapabilityToElement(item)}
        </Grid>
      ))}
    </Grid>
  );
};

export default DeviceDashboard;