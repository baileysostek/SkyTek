import React from 'react';
import './App.css';

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

// Indicate that the app has loaded
const { ipcRenderer } = window.require('electron');
ipcRenderer.invoke("/onLoad").then((result : any) => {

}).catch((error) => {
  console.log("Error", error);
})

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
    <NavBar></NavBar>
    {/* Content */}
    <div className='AppContent'>
      <div style={{marginTop:'64px', width:'100vw', height:'calc(100vh - 64px)', backgroundColor:'char'}}>
        <React.StrictMode>
          <RouterProvider router={router} />  
        </React.StrictMode>
      </div>
    </div>
  </div>
, document.body);