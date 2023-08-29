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
import FolderIcon from '@mui/icons-material/Folder';

// Import our store
import { useStore } from 'zustand'
import { useDeviceStore, getDevices, get } from '../store/DeviceStore';

// Types

interface Props {
  message: string;
}

const DeviceList = ({ message }: Props) => {

  const deviceStore = useStore(useDeviceStore);

  // Theme Info
  const Demo = styled('div')(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
  }));

  // This function will populate the list with the passed template element
  function listDevices() {
    return deviceStore?.devices?.map((value, index) =>
      <ListItem key={index} onClick={() => {
        get("/query", [value, "/skytek"]);
      }}>
        <ListItemAvatar>
          <Avatar>
            <FolderIcon />
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary="Single-line item"
          secondary={true ? 'Secondary text' : null}
        />
      </ListItem>,
    );
  }

  return (
    <div>
      <Button variant="contained" onClick={() => {
        getDevices();
      }}>
        Query Connected Devices
      </Button>
      <Box sx={{ flexGrow: 1, maxWidth: 752 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography sx={{ mt: 4, mb: 2 }} variant="h6" component="div">
              Avatar with text
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