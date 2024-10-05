<script setup lang="ts">
import { onMounted, ref, onUnmounted } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import mapboxgl from 'mapbox-gl';
import sampleElevationData from './data/sampleElevation.json';

const mapContainer = ref<HTMLDivElement | null>(null);
const canvasContainer = ref<HTMLDivElement | null>(null);

let map: mapboxgl.Map | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let controls: OrbitControls | null = null;
let animationFrameId: number | null = null;

function getColorForHeight(height: number, maxHeight: number): THREE.Color {
  const t = height / maxHeight;
  // 从明亮的黄色 (1, 1, 0.5) 渐变到鲜艳的红色 (1, 0, 0)
  const r = 1;
  const g = 1 - t * 0.8;
  const b = 0.5 - t * 0.5;
  return new THREE.Color(r, g, b);
}

onMounted(() => {
  if (!mapContainer.value || !canvasContainer.value) return;

  // Initialize Mapbox
  mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';
  if (!mapboxgl.accessToken) {
    console.error('Mapbox access token is missing. Please set VITE_MAPBOX_ACCESS_TOKEN in your .env file.');
    return;
  }

  map = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/dark-v10',
    center: [0, 0], // Center of the world
    zoom: 2
  });

  // Initialize Three.js
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  canvasContainer.value.appendChild(renderer.domElement);

  // Add OrbitControls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  controls.screenSpacePanning = false;
  controls.maxPolarAngle = Math.PI / 2;

  // Create 3D bars
  const { width, height, data } = sampleElevationData;
  const geometry = new THREE.BoxGeometry(1, 1, 1);

  const maxHeight = Math.max(...data);
  const scale = 50 / maxHeight; // Adjust this value to change the overall height of the visualization

  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      const index = i + j * width;
      const value = data[index];
      const scaledHeight = value * scale;
      
      const color = getColorForHeight(value, maxHeight);
      const material = new THREE.MeshPhongMaterial({ color });

      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(i - width / 2, scaledHeight / 2, j - height / 2);
      cube.scale.y = scaledHeight;
      scene.add(cube);
    }
  }

  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  camera.position.set(0, 50, 100);
  camera.lookAt(0, 0, 0);

  // Animation loop
  function animate() {
    animationFrameId = requestAnimationFrame(animate);
    if (controls) controls.update();
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }
  animate();

  // Handle window resize
  const handleResize = () => {
    if (!renderer || !camera) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };

  window.addEventListener('resize', handleResize);

  // Clean up event listener on component unmount
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
    }
    if (renderer && renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    if (map) {
      map.remove();
    }
    if (controls) {
      controls.dispose();
    }
  });
});
</script>

<template>
  <div class="visualization-container">
    <div ref="mapContainer" class="map-container"></div>
    <div ref="canvasContainer" class="canvas-container"></div>
  </div>
</template>

<style scoped>
.visualization-container {
  position: relative;
  width: 100vw;
  height: 100vh;
}

.map-container, .canvas-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.canvas-container {
  pointer-events: auto;
}
</style>