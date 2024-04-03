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
import { useEffect } from 'react';

// Material UI
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import RocketIcon from '@mui/icons-material/RocketLaunchOutlined';

// Types
interface Props {

}

const DebugConsole = ({}: Props) => {

  // Here is the Zustand store of our devices.
  const deviceStore = useStore(useDeviceStore);

  // Theme Info
  const Demo = styled('div')(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
  }));
  
  return (
    <Grid container spacing={2} style={{width:'100%', textAlign:'center', margin:'0px'}}>
      <Grid item xs={12}>
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
      </Grid>
    </Grid>
  );
};

export default DebugConsole;