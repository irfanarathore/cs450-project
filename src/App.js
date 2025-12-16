import React from 'react';
import './App.css';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Disaster & Emergency Response Dashboard</h1>
        <p>Global Disaster Patterns and Emergency Response Analysis (2018-2024)</p>
      </header>
      <main className="App-main">
        <Dashboard />
      </main>
    </div>
  );
}

export default App;

