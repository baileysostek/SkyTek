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
import { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import { SkyTekDevice } from '../types';

// Types
interface Props {
  device : SkyTekDevice
}

const UUIDViewer = ({device}: Props) => {

  const [uuid, setUUID] = useState<string>("XXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX");
  const [loading, setLoading] = useState<boolean>(true);

  // When this component mounts, request the UUID of the device.
  useEffect(() => {
    if(device){
      console.log('device', device)
      setUUID(device.uuid);
      setLoading(false);
    }
  }, [device])

  // if(loading){
  //   return <> Loading </>
  // }

  return (
    <Grid container style={{width:'100%', textAlign:'center', margin:'0px', padding:'0px'}}>
      <Grid item xs={8} style={{border: '1.5px solid white', borderRadius:'4px', textAlign:'center'}}>
        <div style={{margin:'auto'}}>
          {uuid}
        </div>
      </Grid>
      <Grid item xs={4}>
        <Button color="inherit" variant="outlined">Regenerate</Button>
      </Grid>
    </Grid>
  );
};

export default UUIDViewer;