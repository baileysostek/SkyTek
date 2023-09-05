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
import { query } from '../api/Client';

// Types

interface Props {
  message: string;
}

const DeviceList = ({ message }: Props) => {

  // Here is the Zustand store of our devices.
  const deviceStore = useStore(useDeviceStore);

  // Theme Info
  const Demo = styled('div')(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
  }));

  // This function will populate the list with the passed template element
  function listDevices() {
    return deviceStore?.devices?.map((device, index) =>
      <ListItem key={index} onClick={() => {
        query([device, "skytek"]).then((data) => {
          console.log("data", data);
        }).catch((err) => {
          console.log("GPS Error:", err);
        })
      }}>
        <ListItemAvatar>
          <Avatar>
            <RocketIcon />
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={device.port}
          secondary={true ? "" : null}
        />
      </ListItem>,
    );
  }

  return (
    <div>
      <Box sx={{ flexGrow: 1, maxWidth: 752 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography sx={{ mt: 4, mb: 2 }} variant="h6" component="div">
            </Typography>
            <Demo>
              <List dense={false}>
                {listDevices()}
              </List>
            </Demo>
          </Grid>
        </Grid>
      </Box>
    </div>
  );
};

export default DeviceList;