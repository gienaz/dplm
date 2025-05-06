/* Вкладки Preferences */

const headers = document.querySelectorAll('.tab-header');
const contents = document.querySelectorAll('.tab-content');

headers.forEach(header => {
  header.addEventListener('click', () => {
    headers.forEach(h => h.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));
    header.classList.add('active');
    document.getElementById(header.dataset.tab).classList.add('active');
  });
});


/* Блоки настроек */
document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', function() {
      const content = this.nextElementSibling;
      const isOpen = content.classList.contains('open');
  
      // Скрываем все
      document.querySelectorAll('.accordion-content').forEach(c => {
        c.classList.remove('open');
        c.previousElementSibling.classList.remove('active');
      });
  
      // Открываем только если не был открыт
      if (!isOpen) {
        content.classList.add('open');
        this.classList.add('active');
      }
    });
  });
  