// Import React
import React, { useEffect } from 'react';

// Import our store
import { useStore } from 'zustand'
import { useDeviceStore } from '../../api/store/DeviceStore';

// Use the API
import { query, QueryError } from '../../api/Client';

// Material UI
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';

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
import Transaction, { DeviceTransaction, TransactionStatus } from './Transaction';
import TransactionList from './TransactionList';
import ConsoleInputBar from './ConsoleInputBar';


// Types
interface ConsoleProps {
  allowedMessagesInFlight ?: number
}

const Console = ({
  allowedMessagesInFlight = 1
}: ConsoleProps) => {
  // Store State
  const [waitingForResponse, setWaitingForResponse] = React.useState<boolean>(false);

  const [transactions, setTransactions] = React.useState<Array<DeviceTransaction<any, any>>>([]);
  const appendTransaction = (transaction : DeviceTransaction<any, any>) => {
    const transactionsCopy : Array<DeviceTransaction<any, any>> = [...transactions];
    transactionsCopy.push(transaction);
    setTransactions(transactionsCopy);
  }

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

  const queryDevice = (command : string) => {
    // At this point in time we need to append a new transaction
    let startTime : number= new Date().getTime();

    // Build a new transaction
    const transaction : DeviceTransaction<any, any> = {
      startTime,
      endTime: undefined,
      duration: 0,
      request: command,
      status: TransactionStatus.UNKNOWN,
    };
    // Append this transaction
    appendTransaction(transaction);

    // We are waiting for a response, so set this to true.
    setWaitingForResponse(true);
    // Issue the query
    query(deviceStore.selected, command).then((data) => {
      // We got data back from this query without error!
      transaction.response = data;

      console.log("data", data);
    }).catch((error : QueryError) => {
      // There was an error resolving this query.
      console.log("err", error);
      transaction.errorMessage = error.msg;
    }).finally(() => {
      const endTime : number = new Date().getTime();
      transaction.endTime = endTime;
      const duration : number = (endTime - startTime);
      transaction.duration = duration;

      console.log("Pong:", duration);
      // Now that we have a response, we are no longer waiting.
      setWaitingForResponse(false);
    })
  }
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Variable sized box */}
      <Box
        sx={{
          flexGrow: 1, // Takes up remaining space
          overflow: 'auto', // Handles content overflow
          backgroundColor: 'lightblue', // Example styling
        }}
      > 
        {/* Message List */}
        <TransactionList transactions={transactions}/>
      </Box>
      
      {/* Content-fitting box */}
      <Box
        sx={{
          flexShrink: 0, // Prevents shrinking
          backgroundColor: 'lightgreen', // Example styling
          padding: 2, // Adds some spacing
        }}
      >
        <ConsoleInputBar
          onSubmit={queryDevice}
        />
      </Box>
    </Box>
  );
};

export default Console;