
// Import React
import React, { useEffect } from 'react';
import Transaction, { DeviceTransaction } from './Transaction';
import { List } from '@mui/material';

type TransactionListProps = {
  transactions : Array<DeviceTransaction<any, any>>
}

const TransactionList = (props : TransactionListProps) => {
  const listRef = React.useRef(null); // Reference for the list container
  const bottomRef = React.useRef(null); // Reference for the bottom element

  // Here we have an effect to track when the number of transactions rendered changes
  React.useEffect(() => {
    // When the length of the transactions changes, scroll the bottomRef element into view.
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [props.transactions.length, bottomRef]);

  // Return our list of transactions
  return <List ref={listRef}>
    {/* The content of this list, in this case all of the transactions that have happened */}
    {props.transactions.map((transaction : DeviceTransaction<any, any>, index : number) => (
      <Transaction key={index} transaction={transaction}/>
    ))}
    {/* Ref to the bottom of the list */}
    <div ref={bottomRef} />
  </List>
}
export default TransactionList;