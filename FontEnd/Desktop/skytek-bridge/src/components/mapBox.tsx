// Import React
import React, { useState, useEffect } from 'react';

// Styling - Material UI
import Button from '@mui/material/Button';

// Map Imports
import { Map, Marker, Overlay } from 'pigeon-maps'
import { osm } from 'pigeon-maps/providers'

// Import our store
import { useStore } from 'zustand'
import { useDeviceStore, getDevices, query } from '../store/DeviceStore';

interface Props {
  height: number;
}

export type LatLon = {
    lat:number,
    lon:number
}

const MapBox = ({ height }: Props) => {

  // Devices
  const deviceStore = useStore(useDeviceStore);

  // Position of the devices
  const [positions, setPositions] = useState<Array<LatLon>>([{lat:42.345280, lon:-71.552193}]);

  useEffect(() => {
    let timeout: any;

    function queryGPS(){
      timeout = setTimeout(() => {
        let newPositions : Array<LatLon> = [];
        let promises = [];
        console.log("Devices:", deviceStore.devices);
        for(let device of deviceStore.devices){
          promises.push(new Promise((resolve, reject) => {
            query([device, "/gps"]).then((data) => {
              console.log("GPS", data);
            });
          }));
        }

        Promise.all(promises).then(() => {
          setPositions(newPositions);
          queryGPS();
        });

      }, 1000);
    }

    queryGPS();

    return function cleanup() {
      clearTimeout(timeout);
    };
  });

  return (
    <Map center={[42.345280, -71.552193]} zoom={12} width={600} height={400}>
        {positions.map((position, index) => (<Marker key={index} anchor={[position.lat, position.lon]} payload={1} onClick={({ event, anchor, payload }) => {}} />))}
    
        {/* <Overlay anchor={[position.lat, position.lon]} offset={[120, 79]}>
            <img src='pigeon.jpg' width={240} height={158} alt='' />
        </Overlay> */}
    </Map>
  );
};

export default MapBox;