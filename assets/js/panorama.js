import * as THREE from './three.module.min.js';

const canvas = document.querySelector('[data-beta-panorama]');

if (canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: false,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.backgroundIntensity = 0.9;
  scene.backgroundBlurriness = 0;

  // The old title screen rendered its panorama through a square projection,
  // then presented that result across the menu viewport.
  const camera = new THREE.PerspectiveCamera(120, 1, 0.1, 10);
  camera.rotation.order = 'YXZ';

  const base = 'assets/img/panorama/title-seed-hd/';
  const faces = [
    base + 'panorama1.png',
    base + 'panorama3.png',
    base + 'panorama4.png',
    base + 'panorama5.png',
    base + 'panorama0.png',
    base + 'panorama2.png'
  ];

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const loader = new THREE.CubeTextureLoader();

  loader.load(faces, (cubeTexture) => {
    cubeTexture.colorSpace = THREE.SRGBColorSpace;
    cubeTexture.magFilter = THREE.LinearFilter;
    cubeTexture.minFilter = THREE.LinearMipmapLinearFilter;
    cubeTexture.generateMipmaps = true;
    cubeTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    cubeTexture.needsUpdate = true;
    scene.background = cubeTexture;

    canvas.classList.add('is-ready');
    const started = performance.now();

    function resize() {
      const width = Math.max(1, canvas.clientWidth);
      const height = Math.max(1, canvas.clientHeight);
      const needsResize = canvas.width !== Math.round(width * renderer.getPixelRatio()) ||
        canvas.height !== Math.round(height * renderer.getPixelRatio());
      if (needsResize) {
        renderer.setSize(width, height, false);
        camera.aspect = 1;
        camera.updateProjectionMatrix();
      }
    }

    function render(now) {
      resize();
      const seconds = reducedMotion ? 0 : (now - started) / 1000;
      camera.rotation.y = Math.PI - seconds * (Math.PI * 2 / 180);
      camera.rotation.x = THREE.MathUtils.degToRad(20 + Math.sin(seconds * Math.PI * 2 / 125.66) * 4);
      renderer.render(scene, camera);
      if (!reducedMotion) requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
  });
}
