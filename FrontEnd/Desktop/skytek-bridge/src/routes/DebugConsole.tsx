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
import { query } from '../api/Client';
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

  const queryDevice = () => {
    let start = new Date().getTime();
    // We are waiting for a response, so set this to true.
    setWaitingForResponse(true);
    // Issue the query
    query(deviceStore.selected, command).then((data) => {
      console.log("data", data);
      setResult(data);
    }).finally(() => {
      console.log("Pong:", (new Date().getTime() - start));
      // Now that we have a response, we are no longer waiting.
      setWaitingForResponse(false);
    })
  }
  
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
    
              <Grid item xs={12} style={{padding:'0px'}} >
                <div style={{height:'100%'}}>
                  <TextField fullWidth label="Message" variant="filled" value={command} inputProps={{maxLength:64}} sx={{color:'#FFFFFF', width:'calc(100% - 128px)'}} onChange={(event) => {
                    let value = event.target.value;
                    setCommand(value);
                  }} onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      queryDevice();
                    }
                  }}/>
                  <Button variant={'outlined'} onClick={() => {
                    queryDevice();
                  }} sx={{height:'100%', width:'128px'}}>
                    Send
                  </Button>
                </div>
              </Grid>

              {waitingForResponse ? <CircularProgress/> : <></>}
              {result ? JSON.stringify(result) : <></>}
            </Grid>
          </Box>
        </div>
      </Grid>
    </Grid>
  );
};

export default DebugConsole;