import { useEffect, useState } from 'react';

interface Props {
  shouldPulse: boolean;
}

const WATCHDOG_TIMER = 1250;

const PulseDot = ({ shouldPulse }: Props) => {

  // TODO move to somewhere else
  // Create a Timer that can trigger an event when a device becomes unresponsive.
  const [timer, setTimer] = useState<Timeout | null>(null);
  const [unresponsive, setUnresponsive] = useState<boolean>(false);
  useEffect(() => {
    refresh();
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
    <div>
      <div style={{width:32, height:32, borderRadius:16, backgroundColor: ((unresponsive) ? "#FF9900" : (shouldPulse ? '#AAFFAA' : '#116622'))}}>

      </div>
    </div>
  );
};

export default PulseDot;