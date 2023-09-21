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

interface Props {
  device: SkyTekDevice;
}

const DeviceStatus = ({ device }: Props) => {

  // We want to be able to tell our PulseDot to pulse so we need to hold a reference to a variable to indicate pulse
  const [shouldPulse, setShouldPulse] = useState<boolean>(false);

  // Store the hovered state.

  // When this component is mounted in the dom, subscribe to heartbeat messages.
  useEffect(() => {
    // Create a new subscriber
    let subscriber = subscribe(device, "heartbeat", (data) => {
      setShouldPulse(true);
      setTimeout(() => {
        setShouldPulse(false);
      }, 100);
    });
  }, []);

  return (
    <div style={{border:"2px solid", borderColor:"#202020", borderRadius:"24px", overflow:"hidden"}}>
      <ListItem onMouseEnter={() => {}}>
        <ListItemAvatar>
          <Avatar>
            <RocketIcon/>
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          style={{minWidth:'128px'}}
          primary={"Port:" + device.port}
          secondary={true ? "SkyTek Version 0.1" : null}
        />
        <PulseDot shouldPulse={shouldPulse} />
      </ListItem>
    </div>
  );
};

export default DeviceStatus;