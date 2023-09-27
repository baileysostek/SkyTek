import React, { useEffect, useState } from 'react';

// Material UI
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import RocketIcon from '@mui/icons-material/RocketLaunchOutlined';

// API
import { subscribe } from '../api/Client';

// Types
import { SkyTekDevice } from '../types';
import PulseDot from './PulseDot';
import { width } from '@mui/system';
import { Grid } from '@mui/material';

interface Props {
  device: SkyTekDevice;
}

const DeviceStatus = ({ device }: Props) => {
  return (
    <div style={{border:"2px solid", borderColor:"#202020", borderRadius:"24px", overflow:"hidden"}}>
      <ListItem onMouseEnter={() => {}}>
        <ListItemAvatar>
          <PulseDot device={device}>
            <RocketIcon style={{width:'80%', height:'80%', marginLeft:'10%', marginTop:'10%'}}/>
          </PulseDot>
        </ListItemAvatar>
        <ListItemText
          style={{minWidth:'128px'}}
          primary={"Port:" + device.port}
          secondary={true ? "SkyTek Version 0.1" : null}
        />
      </ListItem>
    </div>
  );
};

export default DeviceStatus;