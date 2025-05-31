import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { PMREMGenerator } from 'three';
// --- 1. Загрузка конфига (пример: из localStorage) ---
const modelIndex = 1;
const assetPath = `/assets/${modelIndex}/`;

// --- 1. Загружаем modelConfig.json ---
let modelConfig = null;

fetch(assetPath + 'modelConfig.json')
  .then(res => res.json())
  .then(config => {
    modelConfig = config;
    initScene();
  })
  .catch(err => {
    alert('Ошибка загрузки modelConfig.json');
    throw err;
  });



function initScene(){
// --- 3. Three.js базовая сцена ---
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  modelConfig.camera.fov,
  window.innerWidth / window.innerHeight,
  modelConfig.camera.near,
  1000
);
const controls = new OrbitControls(camera, renderer.domElement);
const wireframeHelpers = new Map();




// --- 4. Сетка ---
if (modelConfig.grid?.toggle) {
  const grid = new THREE.GridHelper(20, 20, modelConfig.grid.color || 0x111111, modelConfig.grid.color || 0x111111);
  scene.add(grid);
}

// --- 5. Загрузка модели ---
const loader = new GLTFLoader();
let model;
loader.load(
  assetPath + 'model.glb', // путь к твоей модели
  (gltf) => {
    model = gltf.scene;
    // --- 6. Применяем трансформации из конфига ---
    model.position.set(
        modelConfig.transform.location.x,
        modelConfig.transform.location.y,
        modelConfig.transform.location.z
    );
    model.rotation.set(
        degToRad(modelConfig.transform.rotation.x),
        degToRad(modelConfig.transform.rotation.y),
        degToRad(modelConfig.transform.rotation.z)
    );
    model.scale.set(
        modelConfig.transform.scale.x,
        modelConfig.transform.scale.y,
        modelConfig.transform.scale.z
    );
    
    camera.position.set(
    modelConfig.camera.position.x,
    modelConfig.camera.position.y,
    modelConfig.camera.position.z
    );
    controls.target.set(
        modelConfig.camera.target.x,
        modelConfig.camera.target.y,
        modelConfig.camera.target.z
    )
      controls.update();
    //frameModel(model,camera,controls);
    
    applyHdriLighting(renderer, scene, modelConfig.lighting, function(loadedEnvMap) {
    envMap = loadedEnvMap;
    updateBackground();
    });

    setWireframeProps(modelConfig.wireframe.color, modelConfig.wireframe.opacity, modelConfig.wireframe.toggle,modelConfig.wireframe.onlyWireframe);
    updateBackground();

    console.log(modelConfig);
    console.log(camera.fov);

    // --- 7. Применяем материалы и текстуры (если нужно) ---
    // (Здесь можно пройтись по modelConfig.materials.textureSets и применить текстуры к нужным мешам)

    scene.add(model);
  }
);

// --- 8. Рендер-цикл ---
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// --- 9. Resize ---
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

function degToRad(deg) {
  return deg * Math.PI / 180;
}
function setWireframeProps(color, opacity, toggle, onlyWireframe) {


    model.traverse(obj => {
      // Пропускаем все wireframe-меши, чтобы не зациклиться!
      if (obj.isMesh && !obj.isWireframeHelper && obj.material) {
        // Удаляем старый wireframe helper, если есть
        if (wireframeHelpers.has(obj)) {
          const wireMesh = wireframeHelpers.get(obj);
          if (wireMesh.parent) wireMesh.parent.remove(wireMesh);
          wireframeHelpers.delete(obj);
        }

        // Сохраняем оригинальные параметры
        if (toggle && !obj.material._originalParams) {
          obj.material._originalParams = {
            color: obj.material.color.clone(),
            opacity: obj.material.opacity,
            transparent: obj.material.transparent,
            wireframe: obj.material.wireframe,
            visible: obj.material.visible
          };

        if (toggle) {
          if (onlyWireframe) {
            // Только сетка, обычный материал скрываем
            obj.material.wireframe = true;
            obj.material.color.set(color);
            obj.material.opacity = opacity;
            obj.material.transparent = opacity < 1;
            obj.material.visible = true;
          } else {
            // Показываем обычный материал, wireframe отдельно
            obj.material.wireframe = false;
            
            obj.material.color.copy(obj.material._originalParams.color);

            obj.material.opacity = 1;
            obj.material.transparent = false;
            obj.material.visible = true;

            // Создаем wireframe-меш только если его нет
            if (!wireframeHelpers.has(obj)) {
              const wireMat = obj.material.clone();
              wireMat.wireframe = true;
              wireMat.color.set(color);
              wireMat.opacity = opacity;
              wireMat.transparent = opacity < 1;
              wireMat.depthTest = true;
              wireMat.depthWrite = false;
              wireMat.polygonOffset = true;
              wireMat.polygonOffsetFactor = -1;
              wireMat.polygonOffsetUnits = -1;

              const wireMesh = new THREE.Mesh(obj.geometry, wireMat);
              wireMesh.renderOrder = 1;
              wireMesh.isWireframeHelper = true; // ВАЖНО: помечаем как wireframe helper

              obj.add(wireMesh);
              wireframeHelpers.set(obj, wireMesh);
            } else {
              // Обновляем параметры wireframe-меша
              const wireMesh = wireframeHelpers.get(obj);
              wireMesh.material.color.set(color);
              wireMesh.material.opacity = opacity;
              wireMesh.material.transparent = opacity < 1;
              wireMesh.material.needsUpdate = true;
            }
          }
        } else if (obj.material._originalParams) {
          // Восстанавливаем оригинальные параметры
          obj.material.wireframe = obj.material._originalParams.wireframe;
          obj.material.color.copy(obj.material._originalParams.color);
          obj.material.opacity = obj.material._originalParams.opacity;
          obj.material.transparent = obj.material._originalParams.transparent;
          obj.material.visible = obj.material._originalParams.visible;
          obj.material.needsUpdate = true;
        }
      }
    };
  });
  if (!toggle || onlyWireframe) {
    wireframeHelpers.forEach((wireMesh, obj) => {
      if (wireMesh.parent) wireMesh.parent.remove(wireMesh);
    });
    wireframeHelpers.clear();
  }
}
function frameModel(model, camera, controls) {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3()).length();
    const center = box.getCenter(new THREE.Vector3());

    camera.updateProjectionMatrix();

    camera.position.copy(center);
    camera.position.x += size / 2;
    camera.position.y += size / 5;
    camera.position.z += size / 2;
    camera.lookAt(center);

    if (controls) {
      controls.target.copy(center);
      controls.update();
    }
    
  }
function updateBackground() {
  
  if (!modelConfig.background.toggle) {
      // Фон выключен — делаем прозрачным
      renderer.setClearColor(0x000000, 0); // прозрачный фон рендерера
      scene.background = null;             // прозрачный фон сцены
      document.body.style.background = 'none'; // убираем фон у body
      return;
    }

  if (modelConfig.background.bgType === 'color') {
    // Сплошной цвет
    const color = modelConfig.background.flatcolor;
    renderer.setClearColor(color, 1);
    scene.background = new THREE.Color(color);
    document.body.style.background = 'none';
  } if (modelConfig.background.bgType === 'gradient') {
    const gradTexture = createGradientTexture(2048, 2048, modelConfig.background.gradColor1, modelConfig.background.gradColor2, modelConfig.background.gradType);
    scene.background = gradTexture;
    renderer.setClearColor(0x000000, 0); // не обязательно, но можно
    document.body.style.background = 'none';
    }
   else if (modelConfig.background.bgType === 'hdri') {
    // Фон — HDRI
    document.body.style.background = 'none';
    if (envMap) {
      scene.background = envMap;
    }
  }
}

function createGradientTexture(width, height, color1, color2, direction = 'vertical', ditherStrength = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  let grad;
  if (direction === 'vertical') {
    grad = ctx.createLinearGradient(0, 0, 0, height);
  } else if (direction === 'horizontal') {
    grad = ctx.createLinearGradient(0, 0, width, 0);
  } else if (direction === 'diagonal-135') {
    grad = ctx.createLinearGradient(width, 0, 0, height);
  } else {
    grad = ctx.createLinearGradient(0, 0, width, height);
  }
  grad.addColorStop(0, color1);
  grad.addColorStop(1, color2);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Dithering: мягкий шум
  if (ditherStrength > 0) {
    const imgData = ctx.getImageData(0, 0, width, height);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const noise = (Math.random() - 0.5) * ditherStrength;
      imgData.data[i] = Math.min(255, Math.max(0, imgData.data[i] + noise));
      imgData.data[i + 1] = Math.min(255, Math.max(0, imgData.data[i + 1] + noise));
      imgData.data[i + 2] = Math.min(255, Math.max(0, imgData.data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);
  }

  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  return texture;
}


let envMap = null; 
function applyHdriLighting(renderer, scene, lightingConfig, onEnvMapReady) {
  if (!lightingConfig.hdri.toggle) {
    scene.environment = null;
    scene.background = null;
    envMap = null;
    if (onEnvMapReady) onEnvMapReady(null);
    return;
  }

  const pmremGenerator = new PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  new RGBELoader()
    .setDataType(THREE.FloatType)
    .load(lightingConfig.hdri.image, function(texture) {
      envMap = pmremGenerator.fromEquirectangular(texture).texture;
      scene.environment = envMap;
      renderer.toneMappingExposure = lightingConfig.hdri.brightness || 1;

      // Вращение HDRI (можно крутить сцену или материалы, если нужно)
      // scene.rotation.y = lightingConfig.hdri.rotation || 0;

      texture.dispose();
      pmremGenerator.dispose();

      if (onEnvMapReady) onEnvMapReady(envMap);
    });
}
}