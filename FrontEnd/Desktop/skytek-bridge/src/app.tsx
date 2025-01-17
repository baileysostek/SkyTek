import React from 'react';
import './app.css';

import * as ReactDOM from 'react-dom';
import { setRouter } from './api/Client';

// Import our router here
import {
  createHashRouter,
  RouterProvider,
} from "react-router-dom";

import AvailableDevices from './routes/AvailableDevices';
import NavBar from './components/NavBar';
import DeviceDashboard from './routes/DeviceDashboard';
import SideBar from './components/SideBar';
import { useDeviceStore } from './api/store/DeviceStore';
import DebugConsole from './routes/DebugConsole';

// Indicate that the app has loaded
const { ipcRenderer } = window.require('electron');
ipcRenderer.invoke("/onLoad").then((result : any) => {

}).catch((error) => {
  console.log("Error", error);
})

const hasDevice = () => {
  return !!useDeviceStore.getState().selected;
}

// Define our router
const router = createHashRouter([
  {
    path: "/",
    element: <AvailableDevices/>
  },
  {
    path: "/device",
    element: <DeviceDashboard/>
  },
]);
setRouter(router);

// Define our router
ReactDOM.render(
  <div style={{width:'100vw'}}>
    {/* Navbar and Sidebar */}
    {/* <NavBar></NavBar> */}
    <SideBar></SideBar>
    {/* Content */}
    <div className='AppContent'>
      <div style={{width:'100vw', height:'100vh'}}>
        <React.StrictMode>
          <RouterProvider router={router} />  
        </React.StrictMode>
      </div>
    </div>
  </div>
, document.body);