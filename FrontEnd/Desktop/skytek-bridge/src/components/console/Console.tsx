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
import Typography from '@mui/material/Typography';
import RocketIcon from '@mui/icons-material/RocketLaunchOutlined';

// Import our store
import { useStore } from 'zustand'
import { useDeviceStore } from '../../api/store/DeviceStore';

// API
import {getDevices, navigate, refreshDevices, selectDevice} from '../../api/Client';
import DeviceStatus from './../DeviceStatus';

// Types

interface Props {

}

const Console = ({} : Props) => {
  // Here is the Zustand store of our devices.
  const deviceStore = useStore(useDeviceStore);

  // Here we issue a command to sync the client and server devices.
  useEffect(() => {
    refreshDevices()
  }, []);

  return (
    <div>
      <Box sx={{ flexGrow: 1}}>
        <Grid container spacing={2}>
          <Grid item xs={12} style={{padding:'0px'}} >
            <Typography sx={{ mt: 4, mb: 2 }} variant="h6" component="div">
              Console
            </Typography>

          </Grid>
        </Grid>
      </Box>
    </div>
  );
};

export default Console;