import { Button } from '@mui/material';
import * as ReactDOM from 'react-dom';
import { getDevices } from './api/Client';

import DeviceList from './components/DeviceList';
import SkyTekMap from './components/SkyTekMap';


function render() {
  ReactDOM.render(<div className="App">
  <Button variant="contained" onClick={() => {
    getDevices().then((data) => {
      console.log("Data", data);
    }).catch((err) => {
      console.log("Caught Error", err);
    });
  }}>
    Query Connected Devices
  </Button>
  <DeviceList message='Test A Roo'/>
  <SkyTekMap height={200}></SkyTekMap>
</div>, document.body);
}

render();