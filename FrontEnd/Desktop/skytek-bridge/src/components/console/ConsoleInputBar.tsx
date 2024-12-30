import React from "react";

import { Box, Button, IconButton, TextField, Tooltip } from "@mui/material"
import DataObjectIcon from '@mui/icons-material/DataObject';

type ConsoleInputBarProps = {
  onSubmit ?: (command : string) => void
}

const ConsoleInputBar = ({
  onSubmit = (command : string) => {},
} : ConsoleInputBarProps) => {
  const [command, setCommand] = React.useState<string>('');

  const handleOnSubmit = () => {
    onSubmit(command);
  }

  // Console Input Bar
  return <Box
    sx={{
      display: 'flex',
      alignItems: 'center', // Vertically align items
      gap: 2, // Adds spacing between the boxes
      width: '100%', // Ensures the parent box spans full width
    }}
  >
    {/* Variable width box with TextField */}
    <Box
      sx={{
        flexGrow: 1, // Allows it to grow and shrink
        minWidth: 0, // Ensures proper resizing when space is limited
      }}
    >
      <TextField
        fullWidth // Ensures the TextField takes full width of the box
        label="Command Line"
        variant="outlined"
        size='small'
        onChange={(event) => {
          let value = event.target.value;
          setCommand(value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            handleOnSubmit();
          }
        }}
      />
      <Tooltip title={'JSON Builder'}>
        <IconButton tabIndex={-1} sx={{
          transform: "translateX(-100%)",
          position:'absolute',
        }}>
          {/* Button for constructing and sending objects */}
          <DataObjectIcon/>
        </IconButton>
      </Tooltip>
    </Box>

    {/* Fixed width box with Button */}
    <Box
      sx={{
        minWidth: 128,
        flexShrink: 0, // Prevents shrinking
      }}
    >
      <Button variant="contained" onClick={handleOnSubmit} sx={{width:'100%', height:'100%'}}>Send</Button>
    </Box>
  </Box>
}

export default ConsoleInputBar;