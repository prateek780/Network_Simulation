import './app.scss';
import QuantumNetworkSimulator from './page';

function App() {
  
  return (
    <>
      <div className="App">
        {/* <h1>Hybrid Classical-Quantum Network Simulator POC</h1> */}
        <QuantumNetworkSimulator />
        {/* <PropertyPanel />  Optional for POC */}
      </div>
    </>
  )
}

export default App
