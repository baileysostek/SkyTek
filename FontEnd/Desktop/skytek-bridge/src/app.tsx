import * as ReactDOM from 'react-dom';

import GetDeices from './components/getDevices';
import MapBox from './components/mapBox';


function render() {
  ReactDOM.render(<div className="App">
  <GetDeices message='Test A Roo'/>
  <MapBox height={200}></MapBox>
</div>, document.body);
}

render();