// Import React
import React, { useState, useEffect } from 'react';

// Styling - Material UI
import Button from '@mui/material/Button';

// Map Imports
import { Map as PigeonMap, Marker, Overlay } from 'pigeon-maps'
import { osm } from 'pigeon-maps/providers'

// Import our store
import { useStore } from 'zustand'
import { useDeviceStore } from '../api/store/DeviceStore';

// API
import { subscribeGlobal } from '../api/Client';

// Define constants to be referenced below

// Interfaces and types used in this component.
interface Props {
  height: number;
}

export type LatLon = {
    lat:number,
    lon:number
}

// The component itself.
const SkyTekMap = ({ height }: Props) => {

  // Position of the devices
  const [positions, setPositions] = useState<Array<LatLon>>(new Array<LatLon>());
  const [devices, setDevices] = useState<Map<string, LatLon>>(new Map<string, LatLon>());

  useEffect(() => {
    // Here we will subscribe to all GPS messages
    let subscriber = subscribeGlobal("/gps", (data : JSON) => {
      if(data.hasOwnProperty("uuid")){
        //@ts-ignore
        let device_uuid = data.uuid;
        let deviceMap = devices;
        
        // Update Devices
        //@ts-ignore
        deviceMap.set(device_uuid, {lat:data.lat, lon:data.lng});
        setDevices(deviceMap);

        console.log(deviceMap);

        let newPositions = Array<LatLon>();
        for(let position of deviceMap.values()){
          newPositions.push(position);
        }
        setPositions(newPositions);
      }
    });

    return () => {

    }
  }, []);

  return (
    <div>
      <PigeonMap center={[42.345280, -71.552193]} zoom={12} width={800} height={600}>
        {positions.map((position, index) => (<Marker key={index} anchor={[position.lat, position.lon]} payload={1} onClick={({ event, anchor, payload }) => {}} />))}
    
        {/* <Overlay anchor={[position.lat, position.lon]} offset={[120, 79]}>
            <img src='pigeon.jpg' width={240} height={158} alt='' />
        </Overlay> */}
      </PigeonMap>
    </div>
  );
};

export default SkyTekMap;