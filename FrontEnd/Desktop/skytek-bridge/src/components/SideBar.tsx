// Import React
import React, { useState } from 'react';

// Import Types
import { SkyTekDevice } from '../types';

// Material UI
import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';

import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';

import HomeIcon from '@mui/icons-material/Home';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import TerminalIcon from '@mui/icons-material/Terminal';
import SettingsIcon from '@mui/icons-material/Settings';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import MailIcon from '@mui/icons-material/Mail';

// Import our store
import { useStore } from 'zustand'
import { useDeviceStore } from '../api/store/DeviceStore';


// API
import { getRoute, navigate, query, subscribe } from '../api/Client';
import PulseDot from './PulseDot';
import { Tooltip } from '@mui/material';

// Types
interface Props {

}

// TODO: get from ENV file.
const SIDEBAR_WIDTH = 64;

const SideBar = ({}: Props) => {

  // Here is the Zustand store of our devices.
  const deviceStore = useStore(useDeviceStore);

  const disconnect = () => {
    navigate("/");
    deviceStore.selectDevice(null);
  }

  const hasDevice = () => {
    return !!deviceStore.selected;
  }

  const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
    justifyContent: 'flex-end',
  }));

  const getDeviceCapabilities = () => {
    // If we have a selected device
    if (hasDevice()) {
      // Get that device
      let selectedDevice = deviceStore.selected;
      // Return the capabilities of that device
      return selectedDevice.capabilities;
    }
    // Otherwise return an empty array.
    return [];
  }

  return (
    <Drawer
        sx={{
          width: SIDEBAR_WIDTH,
          minWidth: SIDEBAR_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            minWidth: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
            backgroundColor:"darkslategrey"
          },
        }}
        variant="persistent"
        anchor="left"
        open={hasDevice()}
      >
        {/* Render the PulseDot for to visualize heartbeat of this device */}
        <DrawerHeader>
          {deviceStore.selected ? <PulseDot device={deviceStore.selected}>
            <Tooltip title={"Monitor Device"} placement='left'>
              <IconButton 
                style={{width:'100%', height:'100%'}}
                onClick={() => {
                  navigate("/device/");
                }}
              >
                {/* The Heartbeat Dot */}
                <HomeIcon/>
              </IconButton>
            </Tooltip>
          </PulseDot> : null}
        </DrawerHeader>
        <Divider />

        {/* List all of the features present on every SkyTek device. */}
        {/* Currently this is just device settings. */}
        {/* Settings */}
        <ListItem disablePadding>
          <Tooltip title={"Device Settings"} placement='left'>
            <ListItemButton 
              style={{minHeight:'64px'}}
              onClick={() => {
                navigate("/device/settings");
              }}
            >
              <ListItemIcon style={{minWidth:'0px', paddingLeft:'4px'}}>
                <SettingsIcon></SettingsIcon>
              </ListItemIcon>
              {/* <ListItemText primary={text} /> */}
            </ListItemButton>
          </Tooltip>
        </ListItem>

        {/* List all of the capabilities of this device specifically. */}
        {/* During the handsake with a device, the device will send all of its capabilities. */}
        {/* Map requests its own tab */}
        <Divider />
        <List style={{padding:'0px'}}>
          {getDeviceCapabilities().map((text, index) => (
            <ListItem key={text} disablePadding>
              <Tooltip title={text} placement='left'>
                <ListItemButton style={{height:SIDEBAR_WIDTH+'px', minHeight:SIDEBAR_WIDTH+'px'}}>
                  <ListItemIcon style={{minWidth:'0px', paddingLeft:'4px'}}>
                    {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
                  </ListItemIcon>
                  {/* <ListItemText primary={text} /> */}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          ))}
        </List>
        {/* Flex downwards to create a space between the back button and settings */}
        <Box sx={{ flexGrow: 1 }}></Box> {/* Take up the remaining space */}
        {/* Render the Console button at the bottom of the drawer. */}
        <Divider />
        <ListItem disablePadding>
            <ListItemButton 
              style={{height:drawerWidth+'px', minHeight:drawerWidth+'px'}}
              onClick={() => {
                // When a user clicks on the Terminal button, Open a terminal to connect to the device.
                navigate("/console");
              }}
            >
              <ListItemIcon style={{minWidth:'0px', paddingLeft:'4px'}}>
                <TerminalIcon></TerminalIcon>
              </ListItemIcon>
            </ListItemButton>
          </ListItem>
        {/* Render the Back button at the bottom of the drawer. */}
        <Divider />
        <ListItem disablePadding>
          <Tooltip title={"Back"} placement='left'>
            <ListItemButton 
              style={{height:SIDEBAR_WIDTH+'px', minHeight:SIDEBAR_WIDTH+'px'}}
              onClick={() => {
                disconnect();
              }}
            >
              <ListItemIcon style={{minWidth:'0px', paddingLeft:'4px'}}>
                <ChevronLeftIcon></ChevronLeftIcon>
              </ListItemIcon>
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </Drawer>
  );
};

export default SideBar;