// Import React
import React, { useState } from 'react';

// Styling - Material UI
import Button from '@mui/material/Button';

// Map Imports
import { Map, Marker, Overlay } from 'pigeon-maps'
import { osm } from 'pigeon-maps/providers'

interface Props {
  height: number;
}

const MapBox = ({ height }: Props) => {

  const [count, setCount] = useState(0);

  return (
    <Map center={[71, -42]} zoom={12} width={600} height={400}>
        <Marker anchor={[71, -42]} payload={1} onClick={({ event, anchor, payload }) => {}} />
    
        <Overlay anchor={[71, -42]} offset={[120, 79]}>
            <img src='pigeon.jpg' width={240} height={158} alt='' />
        </Overlay>
    </Map>
  );
};

export default MapBox;