// Import our store
import { useStore } from 'zustand'
import { useDeviceStore } from '../api/store/DeviceStore';

// Material UI
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

// Import other Components
import DeviceList from '../components/DeviceList';
import { useEffect } from 'react';
import { SkyTekDevice } from '../types';
import { Button } from '@mui/material';
import { query } from 'src/api/Client';

// Types
interface Props {

}

const AvailableDevices = ({}: Props) => {

  // Here is the Zustand store of our devices.
  const deviceStore = useStore(useDeviceStore);

  // Theme Info
  const Demo = styled('div')(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
  }));
  
  return (
    
    <Grid container spacing={2} style={{width:'100%', textAlign:'center', margin:'0px', padding:'0px'}}>
      <Grid item xs={12} style={{padding:'0px'}}>
        <Typography sx={{ mt: 4, mb: 2 }} variant="h4" component="div">
          Available Devices
        </Typography>
        <DeviceList/>
      </Grid>
    </Grid>
  );
};

export default AvailableDevices;