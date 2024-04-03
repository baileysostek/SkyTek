// Import our store
import { useStore } from 'zustand'
import { useDeviceStore } from '../api/store/DeviceStore';

// Material UI
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';

// Import other Components
import DeviceList from '../components/DeviceList';
import { useEffect } from 'react';
import { TextField } from '@mui/material';

import UUIDViewer from '../components/UUIDViewer';
import { SkyTekDevice } from '../types';

// Types
interface Props {
  
}

const DeviceSettings = ({}: Props) => {

  // Here is the Zustand store of our devices.
  const deviceStore = useStore(useDeviceStore);
  
  return (
    <Grid container spacing={2} style={{width:'100%', textAlign:'center', margin:'0px', padding:'16px'}}>
      <Grid item xs={12} style={{padding:'0px'}}>
        {/* Device Name */}
        <TextField fullWidth inputProps={{ maxLength: 24 }} id="filled-basic" label="Device Name" variant="filled" />
        {/* Device ID */}
        <UUIDViewer device={deviceStore.selected}></UUIDViewer>
        {/* Paired Bridges */}
        <div> Pair with Bridge </div>
        <div> Known Bridges Drop Down modal?</div>
      </Grid>
    </Grid>
  );
};

export default DeviceSettings;