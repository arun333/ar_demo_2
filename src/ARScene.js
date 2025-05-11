import React, { useEffect, useRef } from 'react';

const ARScene = () => {
  const rayRef = useRef(null);
  const shapeRef = useRef(null);

  useEffect(() => {
    const scene = document.querySelector('a-scene');
    let hitTestSource = null;
    let localSpace = null;

    // Confirm WebXR session
    scene.addEventListener('enter-vr', async () => {
      console.log("🔁 AR session starting...");
      const session = scene.renderer.xr.getSession();
      if (!session) {
        alert("❌ Failed to start WebXR session");
        return;
      }

      const viewerSpace = await session.requestReferenceSpace('viewer');
      localSpace = await session.requestReferenceSpace('local');
      hitTestSource = await session.requestHitTestSource({ space: viewerSpace });

      // Place red circle on tap
      scene.addEventListener('click', () => {
        const pos = rayRef.current.getAttribute('position');
        shapeRef.current.setAttribute('position', pos);
        shapeRef.current.setAttribute('visible', 'true');
      });

      // Track surface and show yellow ray
      const onXRFrame = (time, frame) => {
        const pose = frame.getViewerPose(localSpace);
        if (!pose) return;

        const hits = frame.getHitTestResults(hitTestSource);
        if (hits.length > 0) {
          const hit = hits[0].getPose(localSpace);
          const { x, y, z } = hit.transform.position;
          rayRef.current.setAttribute('position', `${x} ${y} ${z}`);
          rayRef.current.setAttribute('visible', 'true');
        }

        session.requestAnimationFrame(onXRFrame);
      };

      session.requestAnimationFrame(onXRFrame);
    });
  }, []);

  const startARSession = async () => {
    if (!navigator.xr) {
      alert('❌ WebXR not available');
      return;
    }

    const supported = await navigator.xr.isSessionSupported('immersive-ar');
    if (!supported) {
      alert('❌ immersive-ar not supported on this device/browser');
      return;
    }

    const scene = document.querySelector('a-scene');

    const enterAR = () => {
      console.log("🟢 Entering AR...");
      scene.enterVR(); // Triggers AR session
    };

    if (scene.hasLoaded) {
      enterAR();
    } else {
      scene.addEventListener('loaded', enterAR);
    }
  };

  return (
    <div>
      {/* Start AR button */}
      <button
        onClick={startARSession}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 10,
          padding: '10px 20px',
          background: '#000',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
        }}
      >
        Start AR
      </button>

      {/* AR Scene */}
      <a-scene
        webxr="optionalFeatures: hit-test; requiredFeatures: local-floor;"
        vr-mode-ui="enabled: false"
        renderer="colorManagement: true;"
        background="color: black"
        embedded
        style={{
          width: '100%',
          height: '100%',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 0,
        }}
      >
        {/* Debug box so scene isn’t empty */}
        <a-box position="0 1.6 -2" color="blue" depth="0.5" height="0.5" width="0.5"></a-box>

        {/* Yellow ray on surface */}
        <a-cylinder
          ref={rayRef}
          color="yellow"
          radius="0.01"
          height="0.1"
          rotation="-90 0 0"
          visible="false"
        ></a-cylinder>

        {/* Circle placed when tapped */}
        <a-circle
          ref={shapeRef}
          color="red"
          radius="0.2"
          rotation="-90 0 0"
          visible="false"
        ></a-circle>

        <a-light type="ambient" intensity="0.5"></a-light>
        <a-camera position="0 1.6 0"></a-camera>
      </a-scene>
    </div>
  );
};

export default ARScene;
