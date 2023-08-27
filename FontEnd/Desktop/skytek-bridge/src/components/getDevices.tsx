import React, { useState } from 'react';
import Button from '@mui/material/Button';

interface Props {
  message: string;
}

const GetDeices = ({ message }: Props) => {

  const [count, setCount] = useState(0);

  return (
    <div>
      <p>The current count is: {count}</p>
      <Button variant="contained" onClick={() => setCount(count + 1)}>
        Click me to increase the count
      </Button>
    </div>
  );
};

export default GetDeices;