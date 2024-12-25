import React, { useState } from 'react';

// Material UI
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import { styled } from '@mui/material/styles';

// Import our store
import { useStore } from 'zustand'
import { useDeviceStore } from '../api/store/DeviceStore';


// API
import PulseDot from './PulseDot';

// Types
interface Props {

}

const NavBar = ({}: Props) => {

  // Here is the Zustand store of our devices.
  const deviceStore = useStore(useDeviceStore);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="fixed" style={{minHeight:'64px', maxHeight:'64px'}}>
        <Toolbar>

          {/* <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton> */}

          {/* Display The Application Name */}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} style={{minWidth:'128px'}}>
            SkyTek Bridge
          </Typography>

          {/* The Heartbeat Dot */}
          {deviceStore.selected ? <PulseDot device={deviceStore.selected}></PulseDot> : null}

          {/* <Button color="inherit">Login</Button> */}
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default NavBar;