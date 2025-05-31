

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
        // Сохраняем base64-строку в localStorage
        localStorage.setItem('myGLBModel', e.target.result);

        // Переход на другую страницу
        window.location.href = 'EditMode.html';
      };
      reader.onerror = function() {
        alert('Ошибка при чтении файла');
      };

      // Читаем файл как DataURL (base64)
      reader.readAsDataURL(file);
    });