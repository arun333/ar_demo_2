import React, { useEffect, useRef } from 'react';

const ARScene = () => {
  const rayRef = useRef(null);        // Yellow ray pointing to surface
  const shapeRef = useRef(null);      // Circle to be placed on tap

  useEffect(() => {
    const scene = document.querySelector('a-scene');
    let hitTestSource = null;
    let localSpace = null;

    // When user enters AR, set up WebXR hit test
    scene.addEventListener('enter-vr', async () => {
      const session = scene.renderer.xr.getSession();
      if (!session) return;

      const viewerSpace = await session.requestReferenceSpace('viewer');
      localSpace = await session.requestReferenceSpace('local');
      hitTestSource = await session.requestHitTestSource({ space: viewerSpace });

      // On user tap, place a shape at the ray position
      scene.addEventListener('click', () => {
        const pos = rayRef.current.getAttribute('position');
        shapeRef.current.setAttribute('position', pos);
        shapeRef.current.setAttribute('visible', 'true');
      });

      // XR frame loop to update ray position on detected surface
      const onXRFrame = (time, frame) => {
        const viewerPose = frame.getViewerPose(localSpace);
        if (!viewerPose) return;

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
      {/* Button to manually start WebXR AR session */}
      <button
        onClick={() => {
          const scene = document.querySelector('a-scene');
          if (scene) {
            scene.enterVR(); // This triggers the camera and AR session
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

      {/* A-Frame WebXR Scene */}
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
        {/* Yellow ray showing detected surface */}
        <a-cylinder
          ref={rayRef}
          color="yellow"
          radius="0.01"
          height="0.1"
          rotation="-90 0 0"
          visible="false"
        ></a-cylinder>

        {/* Red circle placed on tap */}
        <a-circle
          ref={shapeRef}
          color="red"
          radius="0.2"
          rotation="-90 0 0"
          visible="false"
        ></a-circle>

        {/* Ambient light and camera */}
        <a-light type="ambient" intensity="0.5"></a-light>
        <a-camera position="0 1.6 0"></a-camera>
      </a-scene>
    </div>
  );
};

export default ARScene;
