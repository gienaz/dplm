import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { PMREMGenerator } from 'three';

// Получить превьюшку модели: const dataURL = localStorage.getItem('previewDataUrl');
let modelConfig = {
  name: "enter name",
  transform: {
    location: {
      x:0,
      y:0,
      z:0
    },
    rotation:{
      x:0,
      y:0,
      z:0
    },
    scale:{
      x:1,
      y:1,
      z:1
    }
  },
  camera:{
    fov:30,
    near:0.05,
    position: {
      x : 0,
      y : 0,
      z : 0
    },
    target:{
      x:0,
      y:0,
      z:0
    }
  },
  wireframe:{
    toggle:false,
    onlyWireframe:false,
    color: "#ffffff",
    opacity:1
  },
  background:{
    toggle:true,
    bgType: "hdri",
    flatcolor: "#000000",
    gradColor1: "#111111",
    gradColor2: "#000000",
    gradType: "vertical"
  },
  grid:{
    toggle:true,
    color: "#111111"
  },
  lighting:{
    hdri:{
      toggle:true,
      image:" ",
      brightness:1.1,
      rotation:0
    }
  },
  materials:{
    matType:"primal",
    textureSets:[{
      baseColor: " ",
      roughness: " ",
      metallic: " ",
      normalMap: " "
    }]
  }
};


function SaveConfig(){
  document.getElementById("debug").textContent = JSON.stringify(modelConfig, null, 2);
}


// Рендерер
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha:true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Сцена и камера
const models = [];
let originalMaterials = [];
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

// GLTFLoader для загрузки GLB-модели
const loader = new GLTFLoader();

let mixer = null;

function animate() {
  requestAnimationFrame(animate);
  if (mixer) mixer.update(0.008); // обновляем анимацию, если она есть
  if (controls) controls.update();
  renderer.render(scene, camera);
}

animate();

loader.load(
  'model1.glb',
  (gltf) => {
    const model = gltf.scene;
    scene.add(model);
    models.push(model);
    fillMaterialSlotSelector(models); 
    saveOriginalMaterials(models);
    frameModel(model, camera, controls);

    // Если есть анимации, создаём mixer
    if (gltf.animations && gltf.animations.length) {
      mixer = new THREE.AnimationMixer(model);
      // mixer.clipAction(gltf.animations[0]).play(); // и т.д.
    }
  }
);


  
  renderer.shadowMap.enabled = true;
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  });

    function frameModel(model, camera, controls) {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3()).length();
    const center = box.getCenter(new THREE.Vector3());

    camera.near = size / 100;
    camera.far = size * 100;
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
  
function syncSliderAndNumber(slider, number, onValue, onConfigUpdate) {
  slider.addEventListener('input', () => {
    number.value = slider.value;
    onValue(parseFloat(slider.value));
    if (onConfigUpdate) onConfigUpdate(parseFloat(slider.value));
  });
  number.addEventListener('input', () => {
    slider.value = number.value;
    onValue(parseFloat(number.value));
    if (onConfigUpdate) onConfigUpdate(parseFloat(number.value));
  });
}


  function applyToModels(callback) {
    models.forEach(model => callback(model));
  }
  
// Position
syncSliderAndNumber(posX, posXn,
  v => applyToModels(obj => obj.position.x = v),
  v => modelConfig.transform.location.x = v
);
syncSliderAndNumber(posY, posYn,
  v => applyToModels(obj => obj.position.y = v),
  v => modelConfig.transform.location.y = v
);
syncSliderAndNumber(posZ, posZn,
  v => applyToModels(obj => obj.position.z = v),
  v => modelConfig.transform.location.z = v
);

// Rotation (градусы -> радианы)
syncSliderAndNumber(rotX, rotXn,
  v => applyToModels(obj => obj.rotation.x = v * Math.PI / 180),
  v => modelConfig.transform.rotation.x = v
);
syncSliderAndNumber(rotY, rotYn,
  v => applyToModels(obj => obj.rotation.y = v * Math.PI / 180),
  v => modelConfig.transform.rotation.y = v
);
syncSliderAndNumber(rotZ, rotZn,
  v => applyToModels(obj => obj.rotation.z = v * Math.PI / 180),
  v => modelConfig.transform.rotation.z = v
);

// Scale
syncSliderAndNumber(sclX, sclXn,
  v => applyToModels(obj => obj.scale.x = v),
  v => modelConfig.transform.scale.x = v
);
syncSliderAndNumber(sclY, sclYn,
  v => applyToModels(obj => obj.scale.y = v),
  v => modelConfig.transform.scale.y = v
);
syncSliderAndNumber(sclZ, sclZn,
  v => applyToModels(obj => obj.scale.z = v),
  v => modelConfig.transform.scale.z = v
);
//FOV
const fovSlider = document.getElementById('fov');
const fovNumber = document.getElementById('fovn');
const nearSlider = document.getElementById('ncd');
const nearNumber = document.getElementById('ncdn');

// Синхронизация FOV
function setFOV(val) {
  camera.fov = parseFloat(val);
  modelConfig.camera.fov = camera.fov;
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
  modelConfig.camera.near = camera.near;

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

  modelConfig.wireframe.toggle = toggle;
  modelConfig.wireframe.onlyWireframe = onlyWireframe;
  modelConfig.wireframe.color = color;
  modelConfig.wireframe.opacity = opacity;
  


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
const bgTypeRadios = document.getElementsByName('bgType');
const bgColor = document.getElementById('bgColor');
const bgGradColor1 = document.getElementById('bgGradColor1');
const bgGradColor2 = document.getElementById('bgGradColor2');
const bgGradDirection = document.getElementById('bgGradDirection');
const bgSwitch = document.getElementById('bgSwitch');



function updateBackground() {
  
  // Определяем выбранный тип
  
  modelConfig.background.toggle = bgSwitch.checked;
  for (let radio of bgTypeRadios) {
      if (radio.checked) {
        modelConfig.background.bgType = radio.value;
        break;
      }
    }
  modelConfig.background.flatcolor = bgColor.value;
  modelConfig.background.gradColor1 = bgGradColor1.value;
  modelConfig.background.gradColor2 = bgGradColor2.value;
  modelConfig.background.gradType = bgGradDirection.value;

  if (!bgSwitch.checked) {
      // Фон выключен — делаем прозрачным
      renderer.setClearColor(0x000000, 0); // прозрачный фон рендерера
      scene.background = null;             // прозрачный фон сцены
      document.body.style.background = 'none'; // убираем фон у body
      return;
    }
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
  } else if (bgType === 'gradient') {
    // Градиент
    const color1 = bgGradColor1.value;
    const color2 = bgGradColor2.value;
    const direction = bgGradDirection.value;
    renderer.setClearColor(0x000000, 0);
    scene.background = null;
    document.body.style.background = `linear-gradient(${direction}, ${color1}, ${color2})`;
  } else if (bgType === 'hdri') {
    // Фон — HDRI
    document.body.style.background = 'none';
    if (envMap) {
      scene.background = envMap;
    }
  }
}

bgSwitch.addEventListener('input', updateBackground);
// Слушатели событий
for (let radio of bgTypeRadios) {
  radio.addEventListener('change', updateBackground);
}
bgColor.addEventListener('input', updateBackground);
bgGradColor1.addEventListener('input', updateBackground);
bgGradColor2.addEventListener('input', updateBackground);
bgGradDirection.addEventListener('change', updateBackground);





//Grid

const gridSwitch = document.getElementById('gridSwitch');
const gridColor = document.getElementById('gridColor');

// Функция обновления сетки
function updateGrid() {

  modelConfig.grid.toggle = gridSwitch.checked;
  modelConfig.grid.color = gridColor.value;

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




//HDRI

// === DOM Elements ===
const hdriSwitch = document.getElementById('hdriSwitch');
const hdriSelector = document.getElementById('hdri-selector');
const hdriCurrent = document.getElementById('hdri-current');
const hdriPreview = document.getElementById('hdri-preview');
const hdriList = document.getElementById('hdri-list');


const hdriBrightness = document.getElementById('hdriBrightness');
const hdriBrightnessNum = document.getElementById('hdriBrightnessNum');
const hdriRotation = document.getElementById('hdriRotation');
const hdriRotationNum = document.getElementById('hdriRotationNum');

// === Конфиг ===
const HDRI_MAX_COUNT = 11;
const HDRI_PATH = 'hdri/';

// === State ===
let hdriOptions = [];
let currentHdri = null;
let envMap = null;
let pmremGenerator = new PMREMGenerator(renderer);
let lastEquirectTexture = null; 

// === Поиск HDRI ===
async function findHdriOptions() {
  const options = [];
  for (let i = 0; i < HDRI_MAX_COUNT; i++) {
    const previewUrl = `${HDRI_PATH}${i}/preview.jpeg`;
    try {
      const resp = await fetch(previewUrl, { method: 'HEAD' });
      if (resp.ok) {
        options.push({
          index: i,
          preview: previewUrl,
          env: `${HDRI_PATH}${i}/enviroment.hdr`
        });
      }
    } catch (e) {
      // ignore
    }
  }
  return options;
}

// === Рендер выпадающего списка ===
function renderHdriList() {
  hdriList.innerHTML = '';
  hdriOptions.forEach(opt => {
    const div = document.createElement('div');
    div.className = 'hdri-option';
    div.innerHTML = `
      <img src="${opt.preview}" alt="HDRI preview">
      <span>HDRI #${opt.index}</span>
    `;
    div.addEventListener('click', () => selectHdri(opt));
    hdriList.appendChild(div);
  });
}

// === Выбор HDRI ===
function selectHdri(opt) {
  hdriPreview.src = opt.preview;
  hdriList.classList.remove('open');
  currentHdri = opt;
  if (hdriSwitch.checked) {
    loadHdriEnvironment(opt.env);
  }
}


// === Открытие/закрытие списка ===
hdriCurrent.addEventListener('click', () => {
  hdriList.classList.toggle('open');
});
document.addEventListener('click', (e) => {
  if (!hdriSelector.contains(e.target)) {
    hdriList.classList.remove('open');
  }
});

// === Переключатель HDRI ===
hdriSwitch.addEventListener('change', () => {
  if (hdriSwitch.checked && currentHdri) {
    loadHdriEnvironment(currentHdri.env);
  } else {
    loadHdriEnvironment(null);
  }
});

// === Инициализация ===
(async function() {
  hdriOptions = await findHdriOptions();
  renderHdriList();
  if (hdriOptions.length > 0) {
    selectHdri(hdriOptions[0]);
  }
})();

function loadHdriEnvironment(hdriPath) {

  modelConfig.lighting.hdri.toggle = hdriSwitch.checked;
  modelConfig.lighting.hdri.image = hdriPath;



  if (!hdriSwitch.checked || !hdriPath) {
    scene.environment = null;
    scene.background = null;
    if (envMap) {
      envMap.dispose();
      envMap = null;
    }
    if (lastEquirectTexture) {
      lastEquirectTexture.dispose();
      lastEquirectTexture = null;
    }
    renderer.toneMappingExposure = parseFloat(hdriBrightness.value);
    return;
  }

  new RGBELoader()
    .load(
      hdriPath,
      function(texture) {
        // Удаляем старые карты
        if (envMap) { envMap.dispose(); envMap = null; }
        if (lastEquirectTexture) { lastEquirectTexture.dispose(); lastEquirectTexture = null; }

        // Для освещения — PMREM
        envMap = pmremGenerator.fromEquirectangular(texture).texture;
        scene.environment = envMap;

        // Для фона — оригинальная equirectangular текстура
        lastEquirectTexture = texture;
        lastEquirectTexture.mapping = THREE.EquirectangularReflectionMapping;
        lastEquirectTexture.rotation = parseFloat(hdriRotation.value);

        // Если выбран режим HDRI background — показываем фон
        let bgType = 'color';
        for (let radio of bgTypeRadios) {
          if (radio.checked) {
            bgType = radio.value;
            break;
          }
        }
        if (bgType === 'hdri') {
          scene.background = lastEquirectTexture;
        } else {
          scene.background = null; // Или что-то другое по твоей логике
        }

        renderer.toneMappingExposure = parseFloat(hdriBrightness.value);
      },
      undefined,
      function(error) {
        console.error('Ошибка загрузки HDRI:', error);
      }
    );
}

// --- Вращение только для фона ---
function updateHdriRotation() {
  const angle = parseFloat(hdriRotation.value);
  hdriRotationNum.value = angle;
  modelConfig.lighting.hdri.rotation = angle;
  if (scene.environment) {
    scene.environmentRotation = new THREE.Euler(0, angle, 0);
  }
  if (scene.background) {
    scene.backgroundRotation = new THREE.Euler(0, angle, 0);
  }
}
hdriRotation.addEventListener('input', updateHdriRotation);
hdriRotationNum.addEventListener('input', function() {
  hdriRotation.value = hdriRotationNum.value;
  updateHdriRotation();
});

// --- Яркость ---


function updateHdriBrightness() {
  const value = parseFloat(hdriBrightness.value);
  modelConfig.lighting.hdri.brightness = value;

  renderer.toneMappingExposure = value;
  hdriBrightnessNum.value = value;
}
hdriBrightness.addEventListener('input', updateHdriBrightness);
hdriBrightnessNum.addEventListener('input', function() {
  hdriBrightness.value = hdriBrightnessNum.value;
  updateHdriBrightness();
});

// --- При смене типа фона ---

for (let radio of bgTypeRadios) {
  radio.addEventListener('change', updateBackground);
}



//Materials

let currentMaterialType = 'primal'; // по умолчанию
const matcapTexture = new THREE.TextureLoader().load('textures/matcap.png');

function saveOriginalMaterials(models) {
  originalMaterials = [];
  models.forEach((model, meshIndex) => {
    model.traverse(obj => {
      if (obj.isMesh && obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((mat, matIndex) => {
            originalMaterials.push({
              mesh: obj,
              meshIndex,
              matIndex,
              material: mat.clone()
            });
          });
        } else {
          originalMaterials.push({
            mesh: obj,
            meshIndex,
            matIndex: 0,
            material: obj.material.clone()
          });
        }
      }
    });
  });
}

// Применить материал всем слотам всех моделей
function applyMaterialTypeToAll(type) {
  modelConfig.materials.matType = type;
  models.forEach((model, meshIndex) => {
    model.traverse(obj => {
      if (obj.isMesh && obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((mat, matIndex) => {
            let newMaterial = null;
            if (type === 'pbr') {
              newMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                metalness: 0.5,
                roughness: 0.5
              });
            } else if (type === 'matcap') {
              newMaterial = new THREE.MeshMatcapMaterial({
                color: 0xffffff,
                matcap: matcapTexture
              });
            } else if (type === 'primal') {
              // Найди оригинальный материал для этого конкретного Mesh и matIndex
              const orig = originalMaterials.find(
                m => m.mesh === obj && m.matIndex === matIndex
              );
              if (orig && orig.material) {
                newMaterial = orig.material.clone();
              } else {
                newMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
              }
            }
            obj.material[matIndex] = newMaterial;
            obj.material[matIndex].needsUpdate = true;
          });
        } else {
          let newMaterial = null;
          if (type === 'pbr') {
            newMaterial = new THREE.MeshStandardMaterial({
              color: 0xffffff,
              metalness: 0.5,
              roughness: 0.5
            });
          } else if (type === 'matcap') {
            newMaterial = new THREE.MeshMatcapMaterial({
              color: 0xffffff,
              matcap: matcapTexture
            });
          } else if (type === 'primal') {
            const orig = originalMaterials.find(
              m => m.mesh === obj && m.matIndex === 0
            );
            if (orig && orig.material) {
              newMaterial = orig.material.clone();
            } else {
              newMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
            }
          }
          obj.material = newMaterial;
          obj.material.needsUpdate = true;
        }
      }
    });
  });
}

let pipelineRadios = document.getElementsByName("matPipeline"); 
let PBRsettingsDisplay = document.getElementsByClassName("materialSettingsPBR");
let MatcapsettingsDisplay = document.getElementsByClassName("materialSettingsMatcap");
let PrimalsettingsDisplay = document.getElementsByClassName("materialSettingsPrimal");
// Слушатели на radio-кнопки
pipelineRadios.forEach(radio => {
  radio.addEventListener('change', function() {

    if (this.checked) {
      currentMaterialType = this.value;
      applyMaterialTypeToAll(currentMaterialType);
      if(this.value === "pbr"){
          for (let el of PBRsettingsDisplay) el.style.display = "flex";
          for (let el of MatcapsettingsDisplay) el.style.display = "none";
          for (let el of PrimalsettingsDisplay) el.style.display = "none";}
      else if(this.value === "matcap"){
          for (let el of PBRsettingsDisplay) el.style.display = "none";
          for (let el of MatcapsettingsDisplay) el.style.display = "flex";
          for (let el of PrimalsettingsDisplay) el.style.display = "none";
        }
      else if(this.value === "primal"){
          for (let el of PBRsettingsDisplay) el.style.display = "none";
          for (let el of MatcapsettingsDisplay) el.style.display = "none";
          for (let el of PrimalsettingsDisplay) el.style.display = "flex";
        }
    }
  })
  });


// Material slots
let materialSlots = []; // глобально

function getAllMaterialSlots(models) {
  materialSlots = []; // очищаем перед заполнением!
  models.forEach((model, meshIndex) => {
    model.traverse(obj => {
      if (obj.isMesh && obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((mat, matIndex) => {
            materialSlots.push({
              key: `${obj.uuid}:${matIndex}`,
              mesh: obj,
              matIndex,
              name: mat.name || `Mesh ${obj.name} - Material ${matIndex}`,
              type: mat.type
            });
          });
        } else {
          materialSlots.push({
            key: `${obj.uuid}:0`,
            mesh: obj,
            matIndex: 0,
            name: obj.material.name || `Mesh ${obj.name} - Material`,
            type: obj.material.type
          });
        }
      }
    });
  });
  return materialSlots;
}

function fillMaterialSlotSelector(models) {
  const slots = getAllMaterialSlots(models); // теперь и materialSlots обновится!
  const select = document.getElementById('materialSlot');
  select.innerHTML = '';
  slots.forEach(slot => {
    const option = document.createElement('option');
    option.value = `${slot.key}`;
    option.textContent = `${slot.name} (${slot.type})`;
    select.appendChild(option);
  });
}


// texturesMemory: { [slotKey: string]: { [textureType: string]: dataURL } }
const texturesMemory = {};

// Загрузка текстуры и сохранение в памяти
function handleTextureUpload(slotKey, textureType, fileInput, previewDiv) {
  const file = fileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    if (!texturesMemory[slotKey]) texturesMemory[slotKey] = {};
    texturesMemory[slotKey][textureType] = e.target.result;
    previewDiv.style.backgroundImage = `url(${e.target.result})`;
    // ВАЖНО: вызываем применение текстуры!
    applyTextureToMaterial(slotKey, textureType);
  };
  reader.readAsDataURL(file);
}

function applyTextureToMaterial(slotKey, textureType) {
  console.log('applyTextureToMaterial', slotKey, textureType);
  const slot = materialSlots.find(s => s.key === slotKey);
  if (!slot) return;
  const material = Array.isArray(slot.mesh.material)
    ? slot.mesh.material[slot.matIndex]
    : slot.mesh.material;

  const dataURL = texturesMemory[slotKey]?.[textureType];
  if (dataURL) {
    const tex = new THREE.TextureLoader().load(dataURL, () => {
      material.needsUpdate = true;
    });
    if (textureType === 'baseColor') material.map = tex;
    if (textureType === 'roughness') material.roughnessMap = tex;
    if (textureType === 'metallic') material.metalnessMap = tex;
    if (textureType === 'normal') material.normalMap = tex;
    material.needsUpdate = true;
  }
}

// При смене слота отображаем загруженные текстуры
function updateTexturePreviews(slotKey) {
  ['baseColor', 'roughness', 'metallic', 'normal'].forEach(type => {
    const previewDiv = document.getElementById(type + 'Preview');
    const dataURL = texturesMemory[slotKey]?.[type];
    previewDiv.style.backgroundImage = dataURL ? `url(${dataURL})` : '';
    // ВАЖНО: вызываем применение текстуры!
    applyTextureToMaterial(slotKey, type);
    // Сброс input'а файла
    const input = document.getElementById(type + 'Upload');
    if (input) input.value = '';
  });
}

// Привязка событий
['baseColor', 'roughness', 'metallic', 'normal'].forEach(type => {
  const input = document.getElementById(type + 'Upload');
  const previewDiv = document.getElementById(type + 'Preview');
  input.addEventListener('change', function() {
    // slotKey — это значение выбранного option в select'е слотов
    const slotKey = document.getElementById('materialSlot').value;
    handleTextureUpload(slotKey, type, input, previewDiv);
  });
});

// При смене слота — обновить превью и материал
document.getElementById('materialSlot').addEventListener('change', function() {
  updateTexturePreviews(this.value);
});

// В будущем texturesMemory можно заменить на IndexedDB или серверное хранилище для постоянного сохранения текстур и их привязки к слотам.



// сохранение конфига


// Обработчик на кнопку сохранения

const saveBtn = document.getElementById('saveBtn');
const nameField = document.getElementById("Model_name");
saveBtn.addEventListener('click', () => {
  if(nameField.value.length > 2){
    modelConfig.name = nameField.value;
    saveCameraTransform();
    savePreview(renderer,scene,camera);
    showPreview(modelConfig.preview);
    SaveConfig();
  }
  else{
  triggerShakeRed(nameField);
  }
});

const previewImg = document.getElementById("preview");
function showPreview(url){
  preview.src = localStorage.getItem('previewDataUrl');;
  previewImg.style.display = "block";
  setTimeout(() => {
    previewImg.style.display = "none";
  }, 2000);
}

function savePreview(renderer, scene, camera, cropWidth = 900, cropHeight = 600) {
  const originalSize = renderer.getSize(new THREE.Vector2());
  const originalPixelRatio = renderer.getPixelRatio();
  const originalBackground = scene.background;

  // Делаем фон прозрачным
  scene.background = null;

  // Рендерим в оригинальном размере
  renderer.setPixelRatio(1);
  renderer.setSize(originalSize.x, originalSize.y, false);
  renderer.render(scene, camera);

  // Получаем canvas и создаём crop-canvas
  const srcCanvas = renderer.domElement;
  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = cropWidth;
  cropCanvas.height = cropHeight;
  const ctx = cropCanvas.getContext('2d');

  // Копируем центральную часть
  const sx = Math.max(0, (srcCanvas.width - cropWidth) / 2);
  const sy = Math.max(0, (srcCanvas.height - cropHeight) / 2);
  ctx.clearRect(0, 0, cropWidth, cropHeight);
  ctx.drawImage(srcCanvas, sx, sy, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

  // Сохраняем PNG с прозрачностью
  const dataURL = cropCanvas.toDataURL("image/png");
  localStorage.setItem('previewDataUrl', dataURL);
  /*const a = document.createElement('a');
  a.href = dataURL;
  a.download = 'screenshot_cropped.png';
  a.click();*/
  // Восстанавливаем параметры
  renderer.setSize(originalSize.x, originalSize.y, false);
  renderer.setPixelRatio(originalPixelRatio);
  scene.background = originalBackground;
}

function saveCameraTransform(){
  modelConfig.camera.position.x = camera.position.x;
  modelConfig.camera.position.y = camera.position.y;
  modelConfig.camera.position.z = camera.position.z;

  modelConfig.camera.target = {
    x: controls.target.x,
    y: controls.target.y,
    z: controls.target.z
  };
};

function triggerShakeRed(element) {
  element.classList.remove('shake-red'); // сбрасываем, если уже есть
  // Для перезапуска анимации
  void element.offsetWidth; 
  element.classList.add('shake-red');
  // Можно убрать класс после анимации, чтобы потом снова сработало
  setTimeout(() => {
    element.classList.remove('shake-red');
  }, 1000);
}