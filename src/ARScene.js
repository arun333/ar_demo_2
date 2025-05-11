import React, { useEffect, useRef } from 'react';

const ARScene = () => {
  const rayRef = useRef(null);
  const shapeRef = useRef(null);

  useEffect(() => {
    // ✅ WebXR support check
    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
        console.log('AR supported:', supported);
        if (!supported) alert('AR not supported on this device/browser.');
      });
    } else {
      alert('WebXR not available in this browser.');
    }

    const scene = document.querySelector('a-scene');
    let hitTestSource = null;
    let localSpace = null;

    // ✅ When AR session starts, setup hit-test
    scene.addEventListener('enter-vr', async () => {
      const session = scene.renderer.xr.getSession();
      if (!session) return;

      const viewerSpace = await session.requestReferenceSpace('viewer');
      localSpace = await session.requestReferenceSpace('local');
      hitTestSource = await session.requestHitTestSource({ space: viewerSpace });

      // Tap to place circle at ray
      scene.addEventListener('click', () => {
        const pos = rayRef.current.getAttribute('position');
        shapeRef.current.setAttribute('position', pos);
        shapeRef.current.setAttribute('visible', 'true');
      });

      // Hit-test loop
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

  return (
    <div>
      {/* ✅ Start AR Button */}
      <button
        onClick={() => {
          const scene = document.querySelector('a-scene');
          if (scene.hasLoaded) {
            scene.enterVR(); // triggers AR session + camera
          } else {
            scene.addEventListener('loaded', () => scene.enterVR());
          }
        }}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 5,
          padding: '10px 20px',
          background: '#000',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
        }}
      >
        Start AR
      </button>

      {/* ✅ WebXR Scene */}
      <a-scene
        webxr="optionalFeatures: hit-test; requiredFeatures: local-floor;"
        vr-mode-ui="enabled: false"
        renderer="colorManagement: true;"
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
        {/* Ray pointing to detected surface */}
        <a-cylinder
          ref={rayRef}
          color="yellow"
          radius="0.01"
          height="0.1"
          rotation="-90 0 0"
          visible="false"
        ></a-cylinder>

        {/* Circle placed on surface when tapped */}
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
