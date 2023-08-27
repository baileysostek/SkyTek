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

export type LatLon = {
    lat:number,
    lon:number
}

const MapBox = ({ height }: Props) => {

  const [count, setCount] = useState(0);
  const [position, setPosition] = useState<LatLon>({lat:42.345280, lon:-71.552193});

  return (
    <Map center={[position.lat, position.lon]} zoom={12} width={600} height={400}>
        <Marker anchor={[position.lat, position.lon]} payload={1} onClick={({ event, anchor, payload }) => {}} />
    
        {/* <Overlay anchor={[position.lat, position.lon]} offset={[120, 79]}>
            <img src='pigeon.jpg' width={240} height={158} alt='' />
        </Overlay> */}
    </Map>
  );
};

export default MapBox;