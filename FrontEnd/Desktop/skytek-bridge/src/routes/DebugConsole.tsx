// Import React
import React from 'react';

// Import our store
import { useStore } from 'zustand'
import { useDeviceStore } from '../api/store/DeviceStore';

// Material UI
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';

// Import other Components
import DeviceList from '../components/DeviceList';
import Console from '../components/console/Console';
import { useEffect } from 'react';

// Material UI
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import RocketIcon from '@mui/icons-material/RocketLaunchOutlined';
import { useNavigate } from 'react-router-dom';
import { CircularProgress } from '@mui/material';


// Types
interface Props {

}

const DebugConsole = ({}: Props) => {
  // Store State
  const [command, setCommand] = React.useState<string>('');
  const [waitingForResponse, setWaitingForResponse] = React.useState<boolean>(false);
  const [result, setResult] = React.useState<JSON>({} as JSON);

  // Here is the Zustand store of our devices.
  const deviceStore = useStore(useDeviceStore);

  // Allow us to navigate to different pages.
  const navigate = useNavigate();

  // Theme Info
  const Demo = styled('div')(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
  }));

  // Define a redirect callback here for when we have no selected device.
  useEffect(() => {
    if(!deviceStore.selected){
      navigate('/');
      return;
    }
  }, [deviceStore.selected]); 
  
  return (
    <Console/>
  );
};

export default DebugConsole;