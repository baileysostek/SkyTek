import { ReactNode, useEffect, useState } from 'react';
import { SkyTekDevice } from '../types';
import { SkyTekSubscriber, subscribe, unsubscribe } from '../api/Client';

interface Props {
  children:ReactNode | null;
  device: SkyTekDevice;
  onHeartbeat? : () => void
}

const HEARTBEAT_RATE = 1000;
const WATCHDOG_TIMER = HEARTBEAT_RATE * 2;

const PulseDot = ({ children, device, onHeartbeat }: Props) => {

  // We want to be able to tell our PulseDot to pulse so we need to hold a reference to a variable to indicate pulse
  const [shouldPulse, setShouldPulse] = useState<boolean>(false);

  // Create a Timer that can trigger an event when a device becomes unresponsive.
  const [timer, setTimer] = useState<Timeout | null>(null);
  const [unresponsive, setUnresponsive] = useState<boolean>(false);

  useEffect(() => {
    refresh();
    
    console.log("Adding Subscriber");

    // When this component is mounted in the dom, subscribe to heartbeat messages.
    let subscriber : SkyTekSubscriber = subscribe(device, "heartbeat", (data) => {
      // Notify this component that we should pulse.
      setShouldPulse(true);

      // If there is a heartbeat callback defined
      if (onHeartbeat != null) {
        onHeartbeat();
      }
      
      console.log("Heartbeat data", data);

      // Add a timeout to indicate that pulse should stop 100ms later.
      setTimeout(() => {
        setShouldPulse(false);
      }, 100);
    });

    // When unnmounted from dom
    return () => {
      // If we have a timer, clear the timer
      if(timer){
        clearInterval(timer);
      }

      // de-register our subscriber
      if(unsubscribe(subscriber)){
        console.log("Unsubscribed");
      } else {
        console.error("Could not Unsubscribe");
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
    <div style={{width:48, height:48, outline:'solid #FFFFFF 2px', borderRadius:'50%', transition:'background-color 0.15s ease-out', backgroundColor: ((unresponsive) ? "#FF9900" : (shouldPulse ? '#AAFFAA' : '#116622'))}}>
      {children}
    </div>
  );
};

export default PulseDot;