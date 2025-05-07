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

const simpleAccordeons = Array.from(document.querySelectorAll('.accordion-header'))
  .filter(header => !header.id);

  simpleAccordeons.forEach(header => {
    header.addEventListener('click', function() {
      const content = this.nextElementSibling;
      const isOpen = content.classList.contains('open');
      
      // Скрываем все
      document.querySelectorAll('.accordion-content').forEach(c => {
        if(c.id) return;
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
  


const wireframeSwitch = document.getElementById('wireframeSwitch');
const wireframeAccordeon = document.getElementById('wireAccordeon');
const accordionContent = document.getElementById('wireframeContent');

wireframeSwitch.addEventListener('change', () => {
  if (wireframeSwitch.checked) {
    wireframeAccordeon.classList.add('active');
  } else {
    wireframeAccordeon.classList.remove('active');
  }
  accordionContent.classList.toggle('open');

  
  console.log(wireframeAccordeon.classList);
  console.log(accordionContent.classList);
});