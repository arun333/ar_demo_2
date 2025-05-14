// src/ARScene.js
import 'aframe'; // Ensure this is at the top
import React, { useState, useEffect, useRef } from 'react';

const ARScene = () => {
  const [arReady, setArReady] = useState(false);
  const [objects, setObjects] = useState([]);
  const sceneRef = useRef(null);
  const reticleRef = useRef(null);

  useEffect(() => {
    const sceneEl = sceneRef.current;
    if (!sceneEl) {
      console.log("Scene element not found yet.");
      return;
    }

    console.log("useEffect for ARScene running. Scene element:", sceneEl);

    // Check for WebXR support
    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
        if (supported) {
          console.log("AR is supported by this browser/device!");
          // A-Frame's "Enter AR" button should appear if AR is supported.
        } else {
          console.warn("AR not supported on this device/browser.");
          alert("AR not supported on this device/browser. Make sure you are on a compatible device (e.g., Android with ARCore) and browser (e.g., Chrome).");
        }
      }).catch((err) => {
        console.error("Error checking AR support:", err);
        alert("Error checking AR support. See console for details.");
      });
    } else {
      console.warn("WebXR API (navigator.xr) not available. Please use a compatible browser like Chrome on Android.");
      alert("WebXR API not available. Please use a compatible browser like Chrome on Android.");
    }

    const handleARError = (event) => {
      console.error("AR Session Error Event:", event);
      let message = 'Unknown AR error';
      if (event.detail && event.detail.error && event.detail.error.message) {
        message = event.detail.error.message;
      } else if (event.detail && event.detail.message) {
        message = event.detail.message;
      } else if (event.message) {
        message = event.message;
      }
      alert(`AR Error: ${message}`);
      setArReady(false);
    };

    const handleARSessionStart = (event) => {
      console.log("AR Session Started (enter-vr event). Event detail:", event.detail);
      setArReady(true);
      if (reticleRef.current) {
        reticleRef.current.setAttribute('visible', true);
      }
      // Hide A-Frame's default button if it's still visible
      const enterARButton = sceneEl.querySelector('.a-enter-vr-button'); // A-Frame's button
      if (enterARButton) enterARButton.style.display = 'none';
    };

    const handleARSessionEnd = (event) => {
      console.log("AR Session Ended (exit-vr event). Event detail:", event.detail);
      setArReady(false);
      if (reticleRef.current) {
        reticleRef.current.setAttribute('visible', false);
      }
      const enterARButton = sceneEl.querySelector('.a-enter-vr-button');
      if (enterARButton) enterARButton.style.display = 'block';
    };

    const placeObject = (event) => {
      // Check if the click originated from the scene itself, not UI elements
      // For tap, event.detail.intersection might not always be reliable without raycaster
      // We rely on the reticle's visibility, which is controlled by ar-hit-test
      if (arReady && reticleRef.current && reticleRef.current.getAttribute('visible')) {
        const position = reticleRef.current.getAttribute('position');
        const rotation = reticleRef.current.getAttribute('rotation');

        if (position) {
          const newObject = {
            id: `box-${Date.now()}`,
            position: `${position.x} ${position.y} ${position.z}`,
            rotation: `${rotation.x} ${rotation.y} ${rotation.z}`,
            color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`
          };
          console.log("Placing object:", newObject);
          setObjects(prevObjects => [...prevObjects, newObject]);
        }
      } else {
        console.log("Cannot place object: AR not ready or reticle not visible.");
      }
    };
    
    // Scene loaded event is good for initial checks
    const onSceneLoaded = () => {
        console.log("A-Frame scene <a-scene> has loaded.");
        // The ar-hit-test component will manage the reticle visibility based on found planes
    };

    sceneEl.addEventListener('loaded', onSceneLoaded);
    sceneEl.addEventListener('enter-vr', handleARSessionStart); // 'enter-vr' is used for both VR and AR
    sceneEl.addEventListener('exit-vr', handleARSessionEnd);
    sceneEl.addEventListener('xrballoon FAILED', handleARError); // General XR session failure
    sceneEl.addEventListener('xr-session-init-error', handleARError); // More specific init error


    // Listen for 'select' event, which is standard for XR input
    // If 'select' doesn't work for screen tap on your device, 'click' can be a fallback.
    // sceneEl.addEventListener('click', placeObject);
    
    // WebXR 'select' event is more standard for interactions
    const xrSession = sceneEl.xrSession;
    if (xrSession) {
        console.log("Adding 'select' event listener to existing XR session.");
        xrSession.addEventListener('select', placeObject); // This is the ideal event for taps in AR
    } else {
        console.log("XR session not yet available to add 'select' listener. Will try on session start.");
        sceneEl.addEventListener('enter-vr', function onEnterVRForSelect() {
            if (sceneEl.xrSession) {
                console.log("Adding 'select' event listener to XR session after enter-vr.");
                sceneEl.xrSession.addEventListener('select', placeObject);
                sceneEl.removeEventListener('enter-vr', onEnterVRForSelect); // Clean up this specific listener
            }
        });
    }


    // Cleanup
    return () => {
      console.log("Cleaning up ARScene event listeners.");
      sceneEl.removeEventListener('loaded', onSceneLoaded);
      sceneEl.removeEventListener('enter-vr', handleARSessionStart);
      sceneEl.removeEventListener('exit-vr', handleARSessionEnd);
      sceneEl.removeEventListener('xrballoon FAILED', handleARError);
      sceneEl.removeEventListener('xr-session-init-error', handleARError);
      // sceneEl.removeEventListener('click', placeObject); // if you used click

      if (sceneEl.xrSession) {
        sceneEl.xrSession.removeEventListener('select', placeObject);
      }
      // Also remove the temporary listener if it was added
      // sceneEl.removeEventListener('enter-vr', onEnterVRForSelect); // This is tricky to do correctly if onEnterVRForSelect is not in scope
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  return (
    <>
      <div id="dom-overlay-message" style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10, color: 'white', backgroundColor: 'rgba(0,0,0,0.7)', padding: '10px', borderRadius: '5px' }}>
        {!arReady ? "Click 'ENTER AR' (bottom-right) then scan your surroundings." : "AR Active! Scan for surfaces. Tap to place a box."}
      </div>

      <a-scene
        ref={sceneRef}
        webxr="
          requiredFeatures: hit-test,local-floor;
          optionalFeatures: dom-overlay;
          overlayElement: #dom-overlay-message;
        "
        ar-hit-test="target: #reticle; type:footprint; footprintDepth:0.2"
        renderer="colorManagement: true; physicallyCorrectLights: true;"
        background="color: #222" // Fallback background
      >
        <a-assets>
          {/* <a-asset-item id="my-model" src="path/to/your/model.glb"></a-asset-item> */}
        </a-assets>

        <a-camera position="0 1.6 0" look-controls="enabled: false" wasd-controls="enabled: false">
          {/* No cursor needed for phone tap AR, interaction via screen tap (select event) */}
        </a-camera>

        <a-entity
          id="reticle"
          ref={reticleRef}
          geometry="primitive: ring; radiusInner: 0.04; radiusOuter: 0.06;"
          material="color: white; shader: flat; opacity: 0.8;"
          position="0 -1000 0" // Initially hidden
          rotation="-90 0 0"
          visible="false" // Start invisible, ar-hit-test will make it visible
          ar-hit-test-target // Mark this as a target for ar-hit-test to manage
        ></a-entity>

        <a-light type="ambient" color="#BBB" intensity="0.5"></a-light>
        <a-light type="directional" color="#FFF" intensity="0.8" position="-1 2 1"></a-light>

        {objects.map(obj => (
          <a-box
            key={obj.id}
            position={obj.position}
            rotation={obj.rotation}
            depth="0.2"
            width="0.2"
            height="0.2"
            material={`color: ${obj.color}; roughness: 0.6; metalness: 0.2;`}
            shadow="cast: true; receive: false"
          ></a-box>
        ))}
      </a-scene>
    </>
  );
};

export default ARScene;