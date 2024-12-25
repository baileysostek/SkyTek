import React, { useState, useEffect } from 'react';
import { subscribe, unsubscribe } from '../api/Client';
import { SkyTekSubscriber } from '../api/Client';
import { SkyTekDevice } from '../types';

export type WatchdogProps = {
  device : SkyTekDevice;
  timeout : number;
  onHeartbeat ?: () => void;
  onConnectionLoss ?: () => void;
  onConnectionRegain ?: () => void;
}

/**
 * A Watchdog timer hook for ensuring that a heartbeat happens within an anticipated amount of time. 
 * @param {WatchdogProps} props - The properties this watchdog timer needs to provide for this hook to function properly.
 * @returns {Array} - [state, setState, additionalFunctionality]
 */
const useWatchdog = (props : WatchdogProps) => {
  const [hasTimedOut, setHasTimedOut] = React.useState<boolean>(false);

  // Observe the heartbeat of the supplied device.
  useEffect(() => {
    let timer : (Timeout | null) = null;

    // When this component is mounted in the dom, subscribe to heartbeat messages.
    let subscriber : SkyTekSubscriber = subscribe(props.device, "heartbeat", (data) => {
      // Check if we were previously timed out
      if (hasTimedOut) {
        // Reset this flag
        setHasTimedOut(false);
      }
      // If there is a heartbeat callback defined
      if (props.onHeartbeat) {
        props.onHeartbeat();
      }
      // Refresh the timer
      refresh();
    });

    const refresh = () => {
      // Clear the timeout
      clearTimeout(timer);
      // Start a new timeout
      timer = setTimeout(() => {
        // Set the flag indicating that we have timed out.
        setHasTimedOut(true);
      }, props.timeout);
    }

    // When unmounted from dom or the connected device changes.
    return () => {
      // If we have a timer, clear the timer
      if(timer){
        clearInterval(timer);
      }

      // de-register our subscriber
      unsubscribe(subscriber);
    }
  }, [props.device]);
};

export default useWatchdog;