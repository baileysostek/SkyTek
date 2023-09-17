
// Material UI
import { styled } from '@mui/material/styles';
import DeviceList from '../components/DeviceList';

// Import our store
import { useStore } from 'zustand'
import { useDeviceStore } from '../api/store/DeviceStore';


// API
import NavBar from '../components/NavBar';
import SkyTekMap from '../components/SkyTekMap';

// Types
interface Props {

}

const DeviceDashboard = ({}: Props) => {

  // Here is the Zustand store of our devices.
  const deviceStore = useStore(useDeviceStore);

  return (
  <div>
    <SkyTekMap height={100}></SkyTekMap>
  </div>
  );
};

export default DeviceDashboard;