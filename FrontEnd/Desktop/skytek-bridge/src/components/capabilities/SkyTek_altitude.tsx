import { useEffect, useState } from 'react';
import { subscribeGlobal, unsubscribe } from '../../api/Client';

interface Props {
   
}

const SkyTek_altitude = ({}: Props) => {

  const [altitude, setAltitude] = useState<number>(0);

  useEffect(() => {
    // Here we will subscribe to all GPS messages
    let subscriber = subscribeGlobal("/altitude", (data : JSON) => {
      console.log(data);
      setAltitude(data.alt);
    });

    // Executed on unmount.
    return () => {
      unsubscribe(subscriber);
    }
  }, []);

  return <> Altitude {altitude} </>;
};

export default SkyTek_altitude;