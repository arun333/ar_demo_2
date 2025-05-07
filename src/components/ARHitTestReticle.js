// src/ARHitTestReticle.js
/* global AFRAME, THREE */ // Inform linters that AFRAME and THREE are global

if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available.');
}

AFRAME.registerComponent('ar-hit-test-reticle', {
  // Schema defines the properties of our component.
  // 'enabled' will control if the hit-testing logic is active.
  schema: {
    enabled: { type: 'boolean', default: false }
  },

  // init() is called once when the component is first attached to an entity.
  init: function () {
    this.xrHitTestSource = null;      // Stores the hit-test source from WebXR
    this.viewerSpace = null;          // Stores the viewer reference space
    this.hitMatrix = new THREE.Matrix4(); // A matrix to store hit-test results

    // Bind event handlers to `this` context
    this.onSelect = this.onSelect.bind(this); // We'll use this later for placing objects

    // Get the three.js scene and camera from A-Frame
    this.threeScene = this.el.sceneEl.object3D; // The main three.js scene
    this.threeCamera = this.el.sceneEl.camera;  // The three.js camera

    // Hide the reticle entity (this.el) initially
    this.el.object3D.visible = false;

    // Listen for AR session start to set up hit-testing
    this.el.sceneEl.addEventListener('enter-vr', () => {
      if (this.el.sceneEl.is('ar-mode')) {
        this.setupHitTesting();
      }
    });

    // Listen for AR session end to clean up
    this.el.sceneEl.addEventListener('exit-vr', () => {
      if (this.xrHitTestSource) {
        this.xrHitTestSource.cancel();
        this.xrHitTestSource = null;
      }
      this.el.object3D.visible = false; // Hide reticle on exit
    });
  },

  // setupHitTesting() will be called when AR mode starts
  setupHitTesting: async function () {
    const session = this.el.sceneEl.renderer.xr.getSession();
    if (!session) {
      console.warn('ARHitTestReticle: XR session not available for hit-testing setup.');
      return;
    }

    // Request a 'viewer' reference space. This space is relative to the device's viewpoint.
    try {
      this.viewerSpace = await session.requestReferenceSpace('viewer');
      // Request a hit-test source.
      // It will find surfaces from the center of the viewer's perspective.
      this.xrHitTestSource = await session.requestHitTestSource({ space: this.viewerSpace });
      console.log('ARHitTestReticle: Hit-test source configured.');
    } catch (e) {
      console.error('ARHitTestReticle: Could not start AR hit-test source:', e);
      this.xrHitTestSource = null;
    }
  },

  // tick() is called on every frame (many times per second).
  tick: function () {
    // Only run if the component is enabled, in AR mode, and hit-testing is set up.
    if (!this.data.enabled || !this.el.sceneEl.is('ar-mode') || !this.xrHitTestSource) {
      this.el.object3D.visible = false; // Keep reticle hidden if not ready
      return;
    }

    const frame = this.el.sceneEl.frame; // Get the current WebXR frame
    if (!frame) return;

    // Perform the hit-test using the source and the current frame.
    const hitTestResults = frame.getHitTestResults(this.xrHitTestSource);

    if (hitTestResults.length > 0) {
      // If a hit is found, get the pose (position and orientation) of the hit.
      const hit = hitTestResults[0];
      const referenceSpace = this.el.sceneEl.renderer.xr.getReferenceSpace(); // 'local-floor' usually
      const pose = hit.getPose(referenceSpace);

      // Make the reticle entity (this.el) visible.
      this.el.object3D.visible = true;

      // Apply the hit pose to the reticle entity's matrix.
      // This effectively positions and orients the reticle on the detected surface.
      this.el.object3D.matrix.fromArray(pose.transform.matrix);

      // Decompose the matrix into position, quaternion (rotation), and scale.
      // This is important for A-Frame to correctly update the entity's transform.
      this.el.object3D.matrix.decompose(
        this.el.object3D.position,
        this.el.object3D.quaternion,
        this.el.object3D.scale
      );
    } else {
      // If no hit is found, hide the reticle.
      this.el.object3D.visible = false;
    }
  },
  
  // This function will be called when the user taps the screen (we'll hook this up later).
  onSelect: function () {
    if (this.el.object3D.visible) { // Only if the reticle is visible (meaning it found a surface)
      console.log('ARHitTestReticle: Surface selected!', this.el.object3D.position);
      // In the next step, we'll place the whale here.
      // We can emit an event from here that App.js can listen to.
      this.el.emit('surface-select', { position: this.el.object3D.position.clone(),
                                        orientation: this.el.object3D.quaternion.clone() });
    }
  }
});