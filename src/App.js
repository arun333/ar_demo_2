// src/App.js
import React, { useEffect, useRef } from 'react';
import 'aframe';
import './App.css';

function App() {
  // useRef will give us a reference to the <a-scene> DOM element
  const sceneRef = useRef(null);

  // useEffect is a React Hook that runs after the component renders.
  // We use it here to set up event listeners for AR.
  useEffect(() => {
    const sceneEl = sceneRef.current; // Get the <a-scene> element

    if (sceneEl) {
      const arButton = document.getElementById('my-ar-button');

      // Check if the browser supports WebXR and the 'immersive-ar' session type
      if (navigator.xr) {
        navigator.xr.isSessionSupported('immersive-ar')
          .then((supported) => {
            if (supported) {
              arButton.disabled = false; // Enable the button if AR is supported
              arButton.textContent = "Enter AR";
            } else {
              arButton.textContent = "AR Not Supported by Browser";
            }
          })
          .catch((err) => {
            console.error("Error checking AR support:", err);
            arButton.textContent = "AR Support Check Error";
          });
      } else {
        arButton.textContent = "WebXR API Not Found";
      }

      // When the button is clicked, try to enter AR mode
      arButton.addEventListener('click', () => {
        // 'enterVR()' is A-Frame's method to request an immersive session.
        // For AR, it uses WebXR's 'immersive-ar' mode.
        sceneEl.enterVR(true).catch(err => { // Pass true for AR
            console.error("Could not enter AR mode:", err);
            alert("Could not enter AR. Make sure your browser supports WebXR and has camera permissions.");
        });
      });

      // When successfully entering AR mode
      sceneEl.addEventListener('enter-vr', () => {
        console.log("Entered AR Mode");
        arButton.style.display = 'none'; // Hide the button
        // You could show instructions here, e.g., "Scan for a surface"
      });

      // When exiting AR mode
      sceneEl.addEventListener('exit-vr', () => {
        console.log("Exited AR Mode");
        arButton.style.display = 'block'; // Show the button again
      });
    }

    // Cleanup function for useEffect (optional here, but good practice)
    return () => {
      if (sceneEl) {
        const arButton = document.getElementById('my-ar-button');
        if (arButton) {
            // Remove event listener if component unmounts (not strictly needed for App.js but good habit)
        }
      }
    };
  }, []); // The empty array [] means this useEffect runs once after initial render

  return (
    <div className="App">
      {/* The button to enter AR. We'll style it a bit. */}
      <button
        id="my-ar-button"
        disabled /* Start disabled until we check for AR support */
        style={{
          position: 'absolute',
          zIndex: 10000, /* Make sure it's on top */
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '12px 20px',
          fontSize: '16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Checking AR...
      </button>

      <a-scene
        ref={sceneRef} // Assign the ref to our scene
        // Configure WebXR for A-Frame:
        // - 'requiredFeatures: hit-test' tells the browser we need hit-testing.
        // - 'optionalFeatures: dom-overlay' allows HTML elements on top of AR.
        // - 'overlayElement: #overlay-content' (optional) points to an HTML element for overlay.
        webxr="requiredFeatures: hit-test,local-floor;
               optionalFeatures: dom-overlay,light-estimation,anchors;
               referenceSpaceType: local-floor;" // 'local-floor' is good for placing on ground
        vr-mode-ui="enabled: false" // Disable A-Frame's default "Enter VR" button
      >
        {/* Camera - no changes needed for basic AR entry */}
        <a-camera position="0 1.6 0" look-controls="enabled: false" wasd-controls="enabled: false"></a-camera>

        {/* Lights are important for seeing your 3D models */}
        <a-entity light="type: ambient; color: #CCC; intensity: 0.8"></a-entity>
        <a-entity light="type: directional; color: #FFF; intensity: 0.6; position: -0.5 1 1"></a-entity>

        {/* We'll keep the box for now to see something when AR starts.
            It will appear at 0,0,0 relative to where AR tracking starts. */}
        <a-box id="test-box" position="0 0.5 -1.5" rotation="0 45 0" color="#4CC3D9" visible="true"></a-box>

        {/* Sky is usually not needed/visible in AR mode, but doesn't hurt */}
        {/* <a-sky color="#ECECEC"></a-sky> */}
      </a-scene>
    </div>
  );
}

export default App;