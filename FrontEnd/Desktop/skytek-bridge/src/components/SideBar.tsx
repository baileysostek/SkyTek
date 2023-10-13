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
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
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

// Types
interface Props {

}

const SideBar = ({}: Props) => {

  // Here is the Zustand store of our devices.
  const deviceStore = useStore(useDeviceStore);

  const drawerWidth = 64;

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

  return (
    <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="persistent"
        anchor="left"
        open={hasDevice()}
      >
        <DrawerHeader>
          {deviceStore.selected ? <PulseDot device={deviceStore.selected}>
            <IconButton onClick={() => {
              // ToDo: do something on click? Maybe onHover we report round trip time or last communication time?
            }}>
              {/* The Heartbeat Dot */}
              <ChevronLeftIcon/>
            </IconButton>
          </PulseDot> : null}
        </DrawerHeader>
        <Divider />
        {/* List all of the features present on every SkyTek device. */}
        {/* Settings */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => {
            navigate("/device/test");
            getRoute();
          }}>
            <ListItemIcon style={{minWidth:'0px', paddingLeft:'4px'}}>
              <SettingsIcon></SettingsIcon>
            </ListItemIcon>
            {/* <ListItemText primary={text} /> */}
          </ListItemButton>
        </ListItem>
        {/* List all of the capabilities of this device specifically. */}
        {/* Map requests its own tab */}
        <Divider />
        <List>
          {['Inbox', 'Starred', 'Send email', 'Drafts'].map((text, index) => (
            <ListItem key={text} disablePadding>
              <ListItemButton>
                <ListItemIcon style={{minWidth:'0px', paddingLeft:'4px'}}>
                  {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
                </ListItemIcon>
                {/* <ListItemText primary={text} /> */}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        {/* Flex downwards to create a space between the back button and settings */}
        <Box sx={{ flexGrow: 1 }}></Box> {/* Take up the remaining space */}
        {/* Render the Back button at the bottom of the drawer. */}
        <ListItem disablePadding>
            <ListItemButton onClick={() => {
              disconnect();
            }}>
              <ListItemIcon style={{minWidth:'0px', paddingLeft:'4px'}}>
                <ChevronLeftIcon></ChevronLeftIcon>
              </ListItemIcon>
            </ListItemButton>
          </ListItem>
      </Drawer>
  );
};

export default SideBar;