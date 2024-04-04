// Import React
import React, { useEffect, useState } from 'react';

// Material UI
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';
import RocketIcon from '@mui/icons-material/RocketLaunchOutlined';
import Typography from '@mui/material/Typography';

// Import our store
import { useStore } from 'zustand'
import { useDeviceStore } from '../api/store/DeviceStore';

// API
import {getDevices, navigate, refreshDevices, selectDevice} from '../api/Client';
import DeviceStatus from './DeviceStatus';
import { SkyTekDevice } from 'src/types';
import PulseDot from './PulseDot';

// Types

interface Props {

}

interface DeviceStatusProps {
  device: SkyTekDevice;
  index : number;
}

const DeviceList = ({} : Props) => {
  // Here is the Zustand store of our devices.
  const deviceStore = useStore(useDeviceStore);

  // We use this to determine which device is hovered.
  const [hovered, setHovered] = useState<number>(-1);

  // Here we issue a command to sync the client and server devices.
  useEffect(() => {
    refreshDevices()
  }, []);

  // This function will populate the list with the passed template element
  function listDevices() {
    if(!(deviceStore?.devices) || (deviceStore?.devices?.length <= 0)){
      return <Typography sx={{ mt: 2}} style={{paddingLeft:'16px'}} variant="h6" component="div">
        No Available Devices
      </Typography>
    }
    return deviceStore?.devices?.map((device, index) =>
      <div
        key={index}
        style={{paddingLeft : '16px', paddingTop:(index > 0) ? '12px' : '0px'}}
        onClick={() => {
          selectDevice(device);
          navigate("/device");
        }}
      >
        <DeviceStatus device={device} index={index}/>
      </div>,
    );
  }

  // This function will render one of the devices in the device list
  const DeviceStatus = ({ device, index }: DeviceStatusProps) => {
    return (
      <div style={{transition:'borderColor 2s', border:"2px solid", borderColor:(hovered == index) ? "#404040" : "#202020", borderRadius:"24px", overflow:"hidden"}}>
        <ListItem
          style={{paddingLeft:'8px'}}
          onMouseEnter={() => {
            setHovered(index);
          }}
          onMouseLeave={() => {
            setHovered(-1);
          }}
        >
          <ListItemAvatar>
            <PulseDot device={device}>
              <RocketIcon style={{width:'80%', height:'80%', marginLeft:'10%', marginTop:'10%'}}/>
            </PulseDot>
          </ListItemAvatar>
          <ListItemText
            style={{minWidth:'128px'}}
            primary={device.port}
            secondary={true ? index : null}
          />
        </ListItem>
      </div>
    );
  };
  
  return (
    <div>
      <Box sx={{ flexGrow: 1}}>
        <Grid container spacing={2}>
          <Grid item xs={12} style={{padding:'12px'}} >
            <List dense={false}>
              {listDevices()}
            </List>
          </Grid>
        </Grid>
      </Box>
    </div>
  );
};

export default DeviceList;