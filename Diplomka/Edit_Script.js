import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Рендерер
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Сцена и камера
const models = [];
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x010101);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(4, 4, 8);

// Управление камерой
const controls = new OrbitControls(camera, renderer.domElement);

// Сетка на полу (GridHelper)
const grid = new THREE.GridHelper(20, 20, 0x111111, 0x111111);
scene.add(grid);

// Свет
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 10, 10);
scene.add(light);
scene.add(new THREE.AmbientLight(0x888888));

// GLTFLoader для загрузки GLB-модели
const loader = new GLTFLoader();

// Замените путь на свой GLB-файл
loader.load(
  'model.glb', // путь к вашей модели
  (gltf) => {
    const model = gltf.scene;
    scene.add(model);
    models.push(model);

    // Если есть анимации, запускаем первую
    if (gltf.animations && gltf.animations.length) {
      const mixer = new THREE.AnimationMixer(model);
      mixer.clipAction(gltf.animations[0]).play();
      mixer.clipAction(gltf.animations[1]).play();
      mixer.clipAction(gltf.animations[2]).play();

      // Обновление анимации в рендер-цикле
      function animate() {
        requestAnimationFrame(animate);
        mixer.update(0.008); // примерно 60 FPS
        controls.update();
        renderer.render(scene, camera);
      }
      animate();
      return;
    };
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  });

  
  function syncSliderAndNumber(slider, number, callback) {
    slider.addEventListener('input', () => {
      number.value = slider.value;
      callback(parseFloat(slider.value));
    });
    number.addEventListener('input', () => {
      slider.value = number.value;
      callback(parseFloat(number.value));
    });
  }


  function applyToModels(callback) {
    models.forEach(model => callback(model));
  }
  
  syncSliderAndNumber(posX, posXn, v => applyToModels(obj => obj.position.x = v));
  syncSliderAndNumber(posY, posYn, v => applyToModels(obj => obj.position.y = v));
  syncSliderAndNumber(posZ, posZn, v => applyToModels(obj => obj.position.z = v));
  
  // Rotation (градусы -> радианы)
  syncSliderAndNumber(rotX, rotXn, v => applyToModels(obj => obj.rotation.x = v * Math.PI / 180));
  syncSliderAndNumber(rotY, rotYn, v => applyToModels(obj => obj.rotation.y = v * Math.PI / 180));
  syncSliderAndNumber(rotZ, rotZn, v => applyToModels(obj => obj.rotation.z = v * Math.PI / 180));
  
  // Scale
  syncSliderAndNumber(sclX, sclXn, v => applyToModels(obj => obj.scale.x = v));
  syncSliderAndNumber(sclY, sclYn, v => applyToModels(obj => obj.scale.y = v));
  syncSliderAndNumber(sclZ, sclZn, v => applyToModels(obj => obj.scale.z = v));