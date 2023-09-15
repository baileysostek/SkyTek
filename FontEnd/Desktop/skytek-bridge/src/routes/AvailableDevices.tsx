
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

const AvailableDevices = ({}: Props) => {

  // Here is the Zustand store of our devices.
  const deviceStore = useStore(useDeviceStore);

  // Theme Info
  const Demo = styled('div')(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
  }));


  return (
  <div>
    <NavBar/>
    <DeviceList></DeviceList>
  </div>
  );
};

export default AvailableDevices;