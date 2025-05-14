import React from 'react';
import './App.css';
import ARScene from './ARScene';

function App() {
  return (
    <div className="App">
      {/* You can add a header or other non-AR elements here if needed */}
      <ARScene />
      {/* A-Frame's default "Enter AR" button will be styled by A-Frame.
          You can create your own custom button and trigger the session manually if preferred.
          Example: <button id="my-custom-enter-ar-button">Enter AR</button>
          And in ARScene.js, attach a click listener to it:
          document.getElementById('my-custom-enter-ar-button').addEventListener('click', () => {
            sceneRef.current.enterVR(true); // true for AR
          });
      */}
    </div>
  );
}

export default App;