import * as ReactDOM from 'react-dom';

import GetDeices from './components/getDevices';
import MapBox from './components/mapBox';

const { ipcRenderer } = window.require('electron');

const getData = () => {
  ipcRenderer.send("test", {});
};

let test = {};
ipcRenderer.on("test", (event : any, data : any) => {
  console.log("Data", data);
  test = data;
});

function render() {
  ReactDOM.render(<div className="App">
  <header className="App-header">
    <button onClick={getData}>Get data</button>
  </header>
  {JSON.stringify(test)}
  <GetDeices message='Test A Roo'/>
  <MapBox height={200}></MapBox>
</div>, document.body);
}

render();