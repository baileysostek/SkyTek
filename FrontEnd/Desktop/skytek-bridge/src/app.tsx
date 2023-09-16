import { Button } from '@mui/material';
import * as ReactDOM from 'react-dom';
import { getDevices } from './api/Client';

import DeviceList from './components/DeviceList';
import SkyTekMap from './components/SkyTekMap';

// Import our rotuer here
import {
  createHashRouter,
  RouterProvider,
} from "react-router-dom";
import React from 'react';

import AvailableDevices from './routes/AvailableDevices';
import NavBar from './components/NavBar';

// Indicate that the app has loaded
const { ipcRenderer } = window.require('electron');
ipcRenderer.invoke("/onLoad").then((result : any) => {

}).catch((error) => {
  console.log("Error", error);
})

// Define our rotuer
const router = createHashRouter([
  {
    path: "/",
    element: <AvailableDevices/>,
    children:[
      {
        path:"devices/",
        element: <AvailableDevices/>
      }
    ]
  },
]);

// Define our router
ReactDOM.render(
  <div style={{width:'100vw', marginTop:'16px'}}>
    {/* Navbar and Sidebar */}
    <div style={{position:'absolute', width:'100vw'}}>
      <NavBar></NavBar>
    </div>
    {/* Content */}
    <div style={{width:'100%'}}>
      <div style={{position:'relative', top:'64px'}}>
        <React.StrictMode>
          <RouterProvider router={router} />  
        </React.StrictMode>
      </div>
    </div>
  </div>
, document.body);

// function render() {
//   ReactDOM.render(<div className="App">
//   <Button variant="contained" onClick={() => {
//     getDevices().then((data) => {
//       console.log("Data", data);
//     }).catch((err) => {
//       console.log("Caught Error", err);
//     });
//   }}>
//     Query Connected Devices
//   </Button>
//   <DeviceList message='Test A Roo'/>
//   <SkyTekMap height={200}></SkyTekMap>
// </div>, document.body);
// }

// render();