import { ReactNode, useEffect, useState } from 'react';
import { SkyTekDevice } from '../types';
import { subscribe } from '../api/Client';

interface Props {
  children:ReactNode | null;
  device: SkyTekDevice;
}

const HEARTBEAT_RATE = 1000;
const WATCHDOG_TIMER = HEARTBEAT_RATE * 2;

const PulseDot = ({ children, device }: Props) => {

  // We want to be able to tell our PulseDot to pulse so we need to hold a reference to a variable to indicate pulse
  const [shouldPulse, setShouldPulse] = useState<boolean>(false);

  // Create a Timer that can trigger an event when a device becomes unresponsive.
  const [timer, setTimer] = useState<Timeout | null>(null);
  const [unresponsive, setUnresponsive] = useState<boolean>(false);

  useEffect(() => {
    refresh();

    console.log("Device", device);

    let subscriber = subscribe(device, "heartbeat", (data) => {
      setShouldPulse(true);
      setTimeout(() => {
        setShouldPulse(false);
      }, 100);
    });

    return () => {
      if(timer){
        clearInterval(timer);
      }
    }
  }, []);
  let refresh = () => {
    if(timer){
      clearInterval(timer);
    }
    let timeout = setTimeout(() => {
      setUnresponsive(true);
    }, WATCHDOG_TIMER);
    setTimer(timeout);
  }


  // When this component is mounted in the dom, subscribe to heartbeat messages.
  useEffect(() => {
    if(shouldPulse){
      if(timer){
        refresh();
        if(unresponsive){
          setUnresponsive(false);
        }
      }
    }
  }, [shouldPulse]);

  return (
    <div style={{width:48, height:48, borderRadius:'50%', transition:'background-color 0.15s ease-out', backgroundColor: ((unresponsive) ? "#FF9900" : (shouldPulse ? '#AAFFAA' : '#116622'))}}>
      {children}
    </div>
  );
};

export default PulseDot;