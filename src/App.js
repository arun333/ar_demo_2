// src/App.js
import React, { useEffect, useRef } from 'react';
import 'aframe';
import './App.css';
import './components/ARHitTestReticle'; 

function App() {
  const sceneRef = useRef(null);

  useEffect(() => {
    // ... (keep the existing useEffect code for the AR button and enter/exit events)
    // The existing useEffect code is fine, no changes needed there for this step.
    const sceneEl = sceneRef.current;
    if (sceneEl) {
      const arButton = document.getElementById('my-ar-button');

      if (navigator.xr) {
        navigator.xr.isSessionSupported('immersive-ar')
          .then((supported) => {
            if (supported) {
              arButton.disabled = false;
              arButton.textContent = "Enter AR";
            } else {
              arButton.textContent = "AR Not Supported"; // Or "Try WebXR Viewer"
            }
          })
          .catch((err) => {
            console.error("Error checking AR support:", err);
            arButton.textContent = "AR Support Check Error";
          });
      } else {
        arButton.textContent = "WebXR API Not Found";
      }

      arButton.addEventListener('click', () => {
        sceneEl.enterVR(true).catch(err => {
            console.error("Could not enter AR mode:", err);
            alert("Could not enter AR. Ensure your browser/viewer supports WebXR and has permissions.");
        });
      });

      sceneEl.addEventListener('enter-vr', () => {
        console.log("Entered AR Mode");
        arButton.style.display = 'none';
        // When entering AR, tell our reticle component to start working
        const reticleEntity = document.getElementById('reticle');
        if (reticleEntity) {
          reticleEntity.setAttribute('ar-hit-test-reticle', 'enabled', true);
        }
      });

      sceneEl.addEventListener('exit-vr', () => {
        console.log("Exited AR Mode");
        arButton.style.display = 'block';
        // When exiting AR, tell our reticle component to stop
        const reticleEntity = document.getElementById('reticle');
        if (reticleEntity) {
          reticleEntity.setAttribute('ar-hit-test-reticle', 'enabled', false);
        }
      });
    }
  }, []);

  return (
    <div className="App">
      <button id="my-ar-button" /* ... (keep button styling) */ >
        Checking AR...
      </button>

      <a-scene
        ref={sceneRef}
        webxr="requiredFeatures: hit-test,local-floor;
               optionalFeatures: dom-overlay,light-estimation;
               referenceSpaceType: local-floor;"
        vr-mode-ui="enabled: false"
      >
        <a-camera position="0 1.6 0" look-controls="enabled: false" wasd-controls="enabled: false"></a-camera>

        <a-entity light="type: ambient; color: #CCC; intensity: 0.8"></a-entity>
        <a-entity light="type: directional; color: #FFF; intensity: 0.6; position: -0.5 1 1"></a-entity>

        {/* The Reticle Entity:
            - id="reticle": So we can easily find it.
            - geometry: A ring shape.
            - material: Simple flat white color.
            - position="0 0 -0.5": Initially placed slightly in front of the camera.
            - visible="false": Starts hidden. Our component will make it visible.
            - ar-hit-test-reticle: Our custom component we are about to create.
                                   'enabled: false' means it won't do anything until we enter AR.
        */}
        <a-entity
          id="reticle"
          geometry="primitive: ring; radiusInner: 0.015; radiusOuter: 0.025;"
          material="shader: flat; color: white; transparent: true; opacity: 0.8;"
          position="0 0 -0.5" /* Relative to camera if not hit-testing yet */
          visible="false"
          ar-hit-test-reticle="enabled: false" /* Our custom component */
        ></a-entity>

        {/* Box is still here for now, we'll remove/hide it later */}
        <a-box id="test-box" position="0 0.5 -1.5" color="#4CC3D9" visible="false"></a-box>
        {/* Let's hide the box by default, we'll place things with hit-test now */}

      </a-scene>
    </div>
  );
}

export default App;