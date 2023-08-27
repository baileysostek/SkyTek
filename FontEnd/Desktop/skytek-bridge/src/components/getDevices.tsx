import React, { useState, useEffect } from 'react';

// Material UI
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import FolderIcon from '@mui/icons-material/Folder';
import DeleteIcon from '@mui/icons-material/Delete';

// Import our API to talk to the backend.
const { ipcRenderer } = window.require('electron');

// Types
import { SkyTekDevice } from '../types';

interface Props {
  message: string;
}


const DeviceList = ({ message }: Props) => {

  // State for this list
  const [deviceList, setDeviceList] = useState<Array<any>>([]);

  // Subscribe to our API Responses
  useState(() => {
    ipcRenderer.on("test", (event : any, data : any) => {
      console.log("Data", data);
      setDeviceList([data]);
    });
  });

  // Theme Info
  const Demo = styled('div')(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
  }));

  // This function will populate the list with the passed template element
  function populate(template: React.ReactElement) {
    return deviceList.map((value) =>
      React.cloneElement(template, {
        key: value.id,
      }),
    );
  }

  return (
    <div>
      <Button variant="contained" onClick={() => {
        ipcRenderer.send("test", {});
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
                {populate(
                  <ListItem>
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
                )}
              </List>
            </Demo>
          </Grid>
        </Grid>
      </Box>
    </div>
  );
};

export default DeviceList;