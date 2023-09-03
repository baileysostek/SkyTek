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
const MapBox = ({ height }: Props) => {

  // Devices
  const deviceStore = useStore(useDeviceStore);

  // Position of the devices
  const [positions, setPositions] = useState<Array<LatLon>>([{lat:42.345280, lon:-71.552193}]);

  useEffect(() => {
    let timer = setInterval(() => {
      // queryGPS();
    }, 1000);
    return () => {
      clearInterval(timer)
    }
  }, [deviceStore.devices]);

  function queryGPS(){
    let newPositions : Array<LatLon> = [];
    let promises = [];
    console.log("Devices:", deviceStore.devices);
    for(let device of deviceStore.devices){
      promises.push(new Promise((resolve, reject) => {
        query([device, "gps"]).then((data) => {
          let newPos = {lat:data.lat, lon:-data.lng};
          setPositions([newPos]);
          console.log("Set GPS Position to:", newPos);
        }).catch((err) => {
          console.log("GPS Error:", err);
        })
      }));
    }

    Promise.all(promises).then((responses) => {
      console.log("Response Data:", newPositions) ;
      for(let response of responses){

      }
      setPositions(newPositions);
    })
  }

  return (
    <div>
      <Button onClick={() => {
        queryGPS();
      }}>
        Query GPS
      </Button>
      <Map center={[42.345280, -71.552193]} zoom={12} width={800} height={600}>
        {positions.map((position, index) => (<Marker key={index} anchor={[position.lat, position.lon]} payload={1} onClick={({ event, anchor, payload }) => {}} />))}
    
        {/* <Overlay anchor={[position.lat, position.lon]} offset={[120, 79]}>
            <img src='pigeon.jpg' width={240} height={158} alt='' />
        </Overlay> */}
      </Map>
    </div>
  );
};

export default MapBox;