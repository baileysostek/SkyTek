import React, { useState } from 'react';

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
import Typography from '@mui/material/Typography';
import RocketIcon from '@mui/icons-material/RocketLaunchOutlined';

// Import our store
import { useStore } from 'zustand'
import { useDeviceStore } from '../api/store/DeviceStore';


// API
import {selectDevice} from '../api/Client';
import DeviceStatus from './DeviceStatus';

// Types

interface Props {

}

const DeviceList = ({} : Props) => {

  // Here is the Zustand store of our devices.
  const deviceStore = useStore(useDeviceStore);

  // This function will populate the list with the passed template element
  function listDevices() {
    if(!(deviceStore?.devices) || (deviceStore?.devices?.length <= 0)){
      return <div>No Available Devices</div>
    }
    return deviceStore?.devices?.map((device, index) =>
      <div key={index} onClick={() => {
        selectDevice(device);
      }}>
        <DeviceStatus device={device}/>
      </div>,
    );
  }

  return (
    <div>
      <Box sx={{ flexGrow: 1}}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography sx={{ mt: 4, mb: 2 }} variant="h6" component="div">
              Available Devices
            </Typography>
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