
// Import React
import { ListItem, ListItemButton, ListItemText } from '@mui/material';
import React, { useEffect } from 'react';

export enum TransactionStatus {
  UNKNOWN,
  WAITING_FOR_RESPONSE,
  RESPONSE_SUCCEEDED,
  RESPONSE_ERROR
}

export type DeviceTransaction<RequestType, ResponseType> = {
  // Timing information
  startTime : number;
  endTime : number;
  duration : number;
  // The request that the user sent
  request : RequestType;
  // Status of this request
  status : TransactionStatus;
  // If we got a response from this request
  response ?: ResponseType;
  // If there was an error of somekind issuing this request.
  errorMessage ?: string;
  error ?: boolean;
}

type TransactionProps<RequestType, ResponseType> = {
  transaction : DeviceTransaction<RequestType, ResponseType>
}

const Transaction = (props : TransactionProps<any, any>) => {
  return <ListItem>
    <ListItemButton>
      {JSON.stringify(props)}
    </ListItemButton>
  </ListItem>
}
export default Transaction;