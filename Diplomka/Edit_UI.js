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

  
});


const bgSwitch = document.getElementById('bgSwitch');
const bgAccordeon = document.getElementById('bgAccordeon');
const bgContent = document.getElementById('bgContent');
const hdribackgroundSwitch = document.getElementById('hdribackgroundCheck');

bgSwitch.addEventListener('change', () => {
  if (bgSwitch.checked) {
    bgAccordeon.classList.add('active');
  } else {
    bgAccordeon.classList.remove('active');
  }
  bgContent.classList.toggle('open');


  if(hdriSwitch.checked)
  {
    hdribackgroundSwitch.style.display='block';
  }
  else{
    hdribackgroundSwitch.style.display='none';
  }
});

const gridSwitch = document.getElementById('gridSwitch');
const gridAccordeon = document.getElementById('gridAccordeon');
const gridContent = document.getElementById('gridContent');

gridSwitch.addEventListener('change', () => {
  if (gridSwitch.checked) {
    gridAccordeon.classList.add('active');
  } else {
    gridAccordeon.classList.remove('active');
  }
  gridContent.classList.toggle('open');

});

const hdriSwitch = document.getElementById('hdriSwitch');
const hdriAccordeon = document.getElementById('hdriAccordeon');
const hdriContent = document.getElementById('hdriContent');

hdriSwitch.addEventListener('change', () => {
  if (hdriSwitch.checked) {
    hdriAccordeon.classList.add('active');
  } else {
    hdriAccordeon.classList.remove('active');
  }
  hdriContent.classList.toggle('open');

});


if(hdriSwitch.checked)
{
  hdribackgroundSwitch.style.display='block';
}
else{
  hdribackgroundSwitch.style.display='none';
}