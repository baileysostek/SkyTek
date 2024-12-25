import { ReactNode, useEffect, useState } from 'react';
import { SkyTekDevice } from '../types';
import { SkyTekSubscriber, subscribe, unsubscribe } from '../api/Client';
import useWatchdog from '../hooks/useWatchdog';

interface Props {
  children:ReactNode | null;
  device: SkyTekDevice;
}

const HEARTBEAT_RATE = 1000;
const WATCHDOG_TIMER = HEARTBEAT_RATE * 2;

const PulseDot = ({ children, device }: Props) => {

  // We want to be able to tell our PulseDot to pulse so we need to hold a reference to a variable to indicate pulse
  const [shouldPulse, setShouldPulse] = useState<boolean>(false);
  const [unresponsive, setUnresponsive] = useState<boolean>(false);

  useWatchdog({
    device,
    timeout:WATCHDOG_TIMER,
    onHeartbeat () {
      setShouldPulse(true);
      setTimeout(() => {
        setShouldPulse(false);
      }, 100)
    },
    onConnectionLoss() {
      console.log("onConnectionLoss")
      setUnresponsive(true);
    },
    onConnectionRegain() {
      console.log("onConnectionRegain")
      setUnresponsive(false);  
    },
  })

  return (
    <div style={{width:48, height:48, outline:'solid #FFFFFF 2px', borderRadius:'50%', transition:'background-color 0.15s ease-out', backgroundColor: ((unresponsive) ? "#FF9900" : (shouldPulse ? '#AAFFAA' : '#116622'))}}>
      {children}
    </div>
  );
};

export default PulseDot;