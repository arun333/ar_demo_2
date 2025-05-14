import 'aframe'; // Import A-Frame. IMPORTANT: Must be imported before <a-scene>
import React, { useState, useEffect, useRef } from 'react';

const ARScene = () => {
  const [arReady, setArReady] = useState(false);
  const [objects, setObjects] = useState([]); // To store placed objects
  const sceneRef = useRef(null);
  const reticleRef = useRef(null); // Reference to the reticle entity

  useEffect(() => {
    const sceneEl = sceneRef.current;
    if (!sceneEl) return;

    // Check for WebXR support
    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
        if (supported) {
          console.log("AR is supported!");
          // No need to setArReady here, A-Frame handles session start
        } else {
          console.log("AR not supported on this device/browser.");
          alert("AR not supported on this device/browser.");
        }
      });
    } else {
      console.log("WebXR API not available.");
      alert("WebXR API not available. Please use a compatible browser like Chrome on Android.");
    }

    const handleARError = (event) => {
      console.error("AR Error:", event);
      alert(`AR Error: ${event.detail?.error?.message || 'Unknown AR error'}`);
    };

    const handleARSessionStart = () => {
      console.log("AR Session Started");
      setArReady(true); // Now we are in AR
      // Hide the enter AR button or show "Exit AR"
      const enterARButton = document.getElementById('my-enter-ar-button');
      if(enterARButton) enterARButton.style.display = 'none';

      // Make reticle visible only in AR
      if (reticleRef.current) {
        reticleRef.current.setAttribute('visible', true);
      }
    };

    const handleARSessionEnd = () => {
      console.log("AR Session Ended");
      setArReady(false);
      // Show the enter AR button again
      const enterARButton = document.getElementById('my-enter-ar-button');
      if(enterARButton) enterARButton.style.display = 'block';
      
      // Hide reticle when not in AR
      if (reticleRef.current) {
        reticleRef.current.setAttribute('visible', false);
      }
    };

    // Event listener for placing objects on tap
    const placeObject = (event) => {
      if (arReady && reticleRef.current && reticleRef.current.getAttribute('visible')) {
        // Get reticle's current position and rotation
        const position = reticleRef.current.getAttribute('position');
        const rotation = reticleRef.current.getAttribute('rotation'); // Or use orientation for better alignment

        if (position) {
          const newObject = {
            id: `box-${Date.now()}`, // Unique ID
            position: `${position.x} ${position.y} ${position.z}`,
            rotation: `${rotation.x} ${rotation.y} ${rotation.z}`,
            color: `#${Math.floor(Math.random()*16777215).toString(16)}` // Random color
          };
          setObjects(prevObjects => [...prevObjects, newObject]);
          console.log("Placed object at:", newObject.position);
        }
      }
    };

    sceneEl.addEventListener('loaded', () => {
      console.log("A-Frame scene loaded.");
      // The ar-hit-test component will manage the reticle visibility based on found planes
    });

    sceneEl.addEventListener('enter-vr', handleARSessionStart); // 'enter-vr' is used for both VR and AR
    sceneEl.addEventListener('exit-vr', handleARSessionEnd);
    sceneEl.addEventListener('xr-session-init-error', handleARError);

    // Listen for clicks on the scene (for placing objects)
    // Note: Clicks are often translated to 'select' events in WebXR
    sceneEl.addEventListener('click', placeObject); 
    // Alternatively, listen to 'select' event which is more standard for XR inputs
    // sceneEl.addEventListener('select', placeObject); // Requires a controller or gaze input for some setups


    // Cleanup
    return () => {
      sceneEl.removeEventListener('loaded', () => console.log("A-Frame scene listener removed."));
      sceneEl.removeEventListener('enter-vr', handleARSessionStart);
      sceneEl.removeEventListener('exit-vr', handleARSessionEnd);
      sceneEl.removeEventListener('xr-session-init-error', handleARError);
      sceneEl.removeEventListener('click', placeObject);
      // sceneEl.removeEventListener('select', placeObject);
    };
  }, [arReady]); // Rerun effect if arReady changes

  return (
    <>
      {/* DOM Overlay for UI elements like buttons or instructions */}
      <div id="dom-overlay" style={{ position: 'absolute', top: 0, left: 0, zIndex: 1, padding: '10px', color: 'white', backgroundColor: 'rgba(0,0,0,0.5)'}}>
        <p>Scan surroundings. Tap screen to place a box.</p>
        {/* A-Frame's default VR/AR UI button will appear if not customized */}
      </div>

      <a-scene
        ref={sceneRef}
        webxr="
          requiredFeatures: hit-test,local-floor;
          optionalFeatures: dom-overlay;
          overlayElement: #dom-overlay;
        "
        ar-hit-test="target: #reticle; type:footprint; footprintDepth:0.2" // target the reticle, type can be 'plane' or 'footprint'
        // ar-hit-test="target: #reticle; type:plane" // For wider planes
        // For finer control, you might need custom hit-test logic
        // or listen to ar-hit-test-select event if available.
        // cursor="rayOrigin: mouse; fuse: false" // For desktop debugging
        // renderer="colorManagement: true;" // Good for PBR materials
      >
        <a-assets>
          {/* Preload any assets here if needed */}
        </a-assets>

        {/* Camera Rig */}
        <a-camera position="0 1.6 0" look-controls="enabled: false" wasd-controls="enabled: false">
          {/* You could add a cursor for desktop interaction, but it's not typical for phone AR tap */}
        </a-camera>

        {/* Reticle: A visual indicator for where an object will be placed */}
        <a-entity
          id="reticle"
          ref={reticleRef}
          geometry="primitive: ring; radiusInner: 0.05; radiusOuter: 0.08;"
          material="color: white; shader: flat; opacity: 0.7;"
          position="0 -1000 0" // Initially hidden far away
          rotation="-90 0 0"
          visible="false" // Managed by ar-hit-test or AR session start
        ></a-entity>

        {/* Light */}
        <a-light type="ambient" color="#888"></a-light>
        <a-light type="directional" color="#FFF" intensity="0.6" position="-0.5 1 1"></a-light>

        {/* Placed Objects */}
        {objects.map(obj => (
          <a-box
            key={obj.id}
            position={obj.position}
            rotation={obj.rotation}
            depth="0.2"
            width="0.2"
            height="0.2"
            material={`color: ${obj.color};`}
            shadow // Enable shadows if you add a ground plane and directional light with shadow casting
          ></a-box>
        ))}

        {/* Optional: A simple floor for non-AR mode or when AR tracking is lost temporarily */}
        {/* <a-plane
          position="0 0 -2"
          rotation="-90 0 0"
          width="10"
          height="10"
          material="shader:grid; colorGrid: #555; colorCenterLine: #777"
          visible={!arReady} // Show only when not in AR
        ></a-plane> */}
      </a-scene>
    </>
  );
};

export default ARScene;