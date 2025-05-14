import React, { useEffect } from 'react';

const ARScene = () => {
  useEffect(() => {
    // WebXR support check
    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
        console.log('WebXR AR Supported:', supported);
        if (!supported) {
          alert('AR not supported on this device or browser.');
        }
      });
    } else {
      alert('WebXR not available in this browser.');
    }
  }, []);

  return (
    <a-scene
      xrweb="mode: ar; overlayUI: false"
      vr-mode-ui="enabled: false"
      renderer="logarithmicDepthBuffer: true;"
      embedded
      style={{ width: '100%', height: '100%', position: 'fixed', top: 0, left: 0 }}
    >
      {/* AR Content */}
      <a-box
        position="0 0 -1"
        rotation="0 45 0"
        color="tomato"
        scale="0.3 0.3 0.3"
      ></a-box>

      {/* Lights */}
      <a-light type="ambient" intensity="1"></a-light>

      {/* Camera */}
      <a-entity camera></a-entity>
    </a-scene>
  );
};

export default ARScene;
