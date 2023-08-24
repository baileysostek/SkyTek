import * as ReactDOM from 'react-dom';

const { ipcRenderer } = window.require('electron');

const getData = () => {
  ipcRenderer.send("test", {});
};

ipcRenderer.on("test", (event : any, data : any) => {
  console.log("Response:", data);
});

function render() {
  ReactDOM.render(<div className="App">
  <header className="App-header">
    <button onClick={getData}>Get data</button>
  </header>
</div>, document.body);
}

render();