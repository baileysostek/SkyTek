import { useEffect } from 'react';

interface Props {
  shouldPulse: boolean;
}



const PulseDot = ({ shouldPulse }: Props) => {

  // When this component is mounted in the dom, subscribe to heartbeat messages.
  useEffect(() => {
    if(shouldPulse){

    }
  }, [shouldPulse]);

  return (
    <div>
      <div style={{width:32, height:32, borderRadius:16, backgroundColor: shouldPulse ? '#00FF00' : '#FF0000'}}>

      </div>
    </div>
  );
};

export default PulseDot;