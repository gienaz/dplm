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
     /* mixer.clipAction(gltf.animations[0]).play();
      mixer.clipAction(gltf.animations[1]).play();
      mixer.clipAction(gltf.animations[2]).play();*/

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
  
//Position

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

//FOV
const fovSlider = document.getElementById('fov');
const fovNumber = document.getElementById('fovn');
const nearSlider = document.getElementById('ncd');
const nearNumber = document.getElementById('ncdn');

// Синхронизация FOV
function setFOV(val) {
  camera.fov = parseFloat(val);
  camera.updateProjectionMatrix(); // обязательно!
}
fovSlider.addEventListener('input', e => {
  fovNumber.value = e.target.value;
  setFOV(e.target.value);
});
fovNumber.addEventListener('input', e => {
  fovSlider.value = e.target.value;
  setFOV(e.target.value);
});

// Синхронизация near
function setNear(val) {
  camera.near = parseFloat(val);
  camera.updateProjectionMatrix(); // обязательно!
}
nearSlider.addEventListener('input', e => {
  nearNumber.value = e.target.value;
  setNear(e.target.value);
});
nearNumber.addEventListener('input', e => {
  nearSlider.value = e.target.value;
  setNear(e.target.value);
});


//Wireframe

// Получаем элементы управления
const wireColor = document.getElementById('wireColor');
const wireOpacity = document.getElementById('wireOpacity');
const wireOpacityNum = document.getElementById('wireOpacityNum');
const wireSwitch = document.getElementById('wireframeSwitch');
const onlyWireframeSwitch = document.getElementById('onlyWireframeSwitch');

const wireframeHelpers = new Map();

function setWireframeProps(color, opacity, toggle, onlyWireframe) {
  models.forEach(model => {
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
        }

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
    });
  });

  // После обхода: удаляем wireframe-меши, если они больше не нужны
  if (!toggle || onlyWireframe) {
    wireframeHelpers.forEach((wireMesh, obj) => {
      if (wireMesh.parent) wireMesh.parent.remove(wireMesh);
    });
    wireframeHelpers.clear();
  }
}



  wireSwitch.addEventListener('input', (e) =>{
    setWireframeProps(wireColor.value, wireOpacity.value, wireSwitch.checked, onlyWireframeSwitch.checked);
});

onlyWireframeSwitch.addEventListener('input', (e) => {
  setWireframeProps(wireColor.value, wireOpacity.value, wireSwitch.checked, onlyWireframeSwitch.checked)
});
// Слушаем изменение цвета
wireColor.addEventListener('input', (e) => {
  setWireframeProps(e.target.value, parseFloat(wireOpacity.value),wireSwitch.checked,onlyWireframeSwitch.checked);
});

// Слушаем изменение opacity (синхронизируем с числовым input)
syncSliderAndNumber(wireOpacity, wireOpacityNum, (val) => {
  setWireframeProps(wireColor.value, val, wireSwitch.checked, onlyWireframeSwitch.checked);
});

// Если нужно, можно сразу применить значения при загрузке модели:
setWireframeProps(wireColor.value, parseFloat(wireOpacity.value), wireSwitch.checked, onlyWireframeSwitch.checked);



//Background

// Найди элементы
const bgSwitch = document.getElementById('bgSwitch');
const bgParams = document.getElementById('bgParams');
const bgTypeRadios = document.getElementsByName('bgType');
const bgColor = document.getElementById('bgColor');
const bgGradColor1 = document.getElementById('bgGradColor1');
const bgGradColor2 = document.getElementById('bgGradColor2');
const bgGradDirection = document.getElementById('bgGradDirection');

// Функция обновления фона
function updateBackground() {
  if (!bgSwitch.checked) {
    // Прозрачный фон
    renderer.setClearColor(0x000000, 0);
    scene.background = null;
    // Для градиента: убираем фон у body
    document.body.style.background = 'none';
    return;
  }

  // Определяем выбранный тип
  let bgType = 'color';
  for (let radio of bgTypeRadios) {
    if (radio.checked) {
      bgType = radio.value;
      break;
    }
  }

  if (bgType === 'color') {
    // Сплошной цвет
    const color = bgColor.value;
    renderer.setClearColor(color, 1);
    scene.background = new THREE.Color(color);
    document.body.style.background = 'none';
  } else {
    // Градиент
    const color1 = bgGradColor1.value;
    const color2 = bgGradColor2.value;
    const direction = bgGradDirection.value;
    // Убираем фон сцены, делаем прозрачным
    renderer.setClearColor(0x000000, 0);
    scene.background = null;
    // Градиент через CSS body
    document.body.style.background = `linear-gradient(${direction}, ${color1}, ${color2})`;
  }
}

// Слушатели событий
bgSwitch.addEventListener('change', updateBackground);
bgColor.addEventListener('input', updateBackground);
bgGradColor1.addEventListener('input', updateBackground);
bgGradColor2.addEventListener('input', updateBackground);
bgGradDirection.addEventListener('change', updateBackground);
for (let radio of bgTypeRadios) {
  radio.addEventListener('change', updateBackground);
}

// Первый запуск
updateBackground();





//Grid

const gridSwitch = document.getElementById('gridSwitch');
const gridColor = document.getElementById('gridColor');

// Функция обновления сетки
function updateGrid() {
  // Вкл/выкл видимость
  grid.visible = gridSwitch.checked;

  // Изменение цвета
  const color = new THREE.Color(gridColor.value);
  grid.material.color.set(color);
  grid.material.vertexColors = false; // чтобы цвет применился ко всей сетке
}

// Слушатели
gridSwitch.addEventListener('change', updateGrid);
gridColor.addEventListener('input', updateGrid);

// Инициализация
updateGrid();