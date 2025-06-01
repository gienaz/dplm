

const uploadModal = document.getElementById("uploadModal");
const uploadModalBtn = document.getElementById("uploadModalBtn");
const modalCont = document.getElementById("modalCont");

//открыть
uploadModalBtn.addEventListener('click',()=> {
    uploadModal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    uploadModal.style.pointerEvents = 'all';

    modalCont.style.top = 'calc(50vh - 150px)';
});
//закрыть
uploadModal.addEventListener('click',()=> {
    uploadModal.style.backgroundColor = 'rgba(0, 0, 0, 0)';
    uploadModal.style.pointerEvents = 'none';
    modalCont.style.top = '-300px';

});



const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById('fileInput');

    // Клик по кнопке вызывает выбор файла
    uploadBtn.addEventListener('click', () => {
      fileInput.click();
    });


  fileInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'model/gltf-binary' && !file.name.endsWith('.glb')) {
      alert('Пожалуйста, выберите файл формата .glb');
      return;
    }

  const reader = new FileReader();
  reader.onload = function(e) {
    const arrayBuffer = e.target.result;

    openDB(function(db) {
      const tx = db.transaction('models', 'readwrite');
      const store = tx.objectStore('models');
      // Можно добавить имя, дату, и т.д.
      store.add({ file: arrayBuffer, name: file.name, date: new Date() });

      tx.oncomplete = function() {
        // После сохранения — переход на другую страницу
        window.location.href = 'EditMode.html';
      };
      tx.onerror = function() {
        alert('Ошибка при сохранении файла в IndexedDB');
      };
    });
  };
  reader.onerror = function() {
    alert('Ошибка при чтении файла');
  };

  // Читаем файл как ArrayBuffer (лучше, чем DataURL для бинарных файлов)
  reader.readAsArrayBuffer(file);
});

function openDB(callback) {
  const request = indexedDB.open('modelsDB', 1);

  request.onupgradeneeded = function(event) {
    const db = event.target.result;
    if (!db.objectStoreNames.contains('models')) {
      db.createObjectStore('models', { keyPath: 'id', autoIncrement: true });
    }
  };

  request.onsuccess = function(event) {
    callback(event.target.result);
  };

  request.onerror = function() {
    alert('Ошибка открытия IndexedDB');
  };
}


  //список моделей - только для фронтенда!


const modelQuantity = 6;
const gallery = document.getElementById('modelGallery');

(async () => {
  for (let i = 0; i < modelQuantity; i++) {
    const item = await createModelItem(i);
    gallery.appendChild(item);
  }
})();
async function createModelItem(index) {
  // Получаем имя из modelConfig.json
  let modelName = `Модель ${index + 1}`;
  try {
    const resp = await fetch(`/assets/${index}/modelConfig.json`);
    if (resp.ok) {
      const config = await resp.json();
      if (config.name) modelName = config.name;
    }
  } catch (e) {
    // Если ошибка — оставляем имя по умолчанию
  }

  // Собираем DOM-структуру
  const item = document.createElement('div');
  item.className = 'model-item';
  item.dataset.index = index;

  const img = document.createElement('img');
  img.src = `/assets/${index}/preview.png`;
  img.alt = modelName;

  const cont = document.createElement('div');
  cont.className = 'cont';

  const cont1 = document.createElement('div');
  cont1.className = 'cont1';

  const name = document.createElement('div');
  name.className = 'name';
  name.textContent = modelName;

  const author = document.createElement('div');
  author.className = 'author';
  author.textContent = 'by admin'; // Можно тоже подгружать из config

  const cont2 = document.createElement('div');
  cont2.className = 'cont2';

  const watch = document.createElement('div');
  watch.className = 'watch';
  watch.textContent = `👁️ ${Math.floor(Math.random() * 1000)}`;

  const likes = document.createElement('div');
  likes.className = 'likes';
  likes.textContent = `❤️ ${Math.floor(Math.random() * 100)}`;

  cont1.appendChild(name);
  cont1.appendChild(author);
  cont2.appendChild(watch);
  cont2.appendChild(likes);
  cont.appendChild(cont1);
  cont.appendChild(cont2);

  item.appendChild(img);
  item.appendChild(cont);

  item.addEventListener('click', function() {
    localStorage.setItem('selectedModelIndex', index);
    window.location.href = 'view.html';
  });

  return item;
}

/*
  item
    /image
    cont
      cont1
        name/name
        author/author
      /cont1
      cont2
        watch+likes
      /cont2
    /cont
  /item

*/