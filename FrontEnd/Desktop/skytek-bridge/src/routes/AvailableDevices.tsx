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
    <Grid container spacing={2} style={{width:'100%', textAlign:'center', margin:'0px'}}>
      <Grid item xs={12}>
        <DeviceList></DeviceList>
      </Grid>
    </Grid>
  );
};

export default AvailableDevices;