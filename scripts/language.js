const languageSwitch = document.getElementById('language-switch');
const englishElements = document.querySelectorAll('.english');
const frenchElements = document.querySelectorAll('.french');

function updateLanguage() {
  if (languageSwitch.checked) {
    // Show French elements, apply styles
    frenchElements.forEach(element => {
      element.style.display = '';
      element.style.textAlign = '';
      element.style.marginBottom = '';
    });
    // Hide English elements and remove styles
    englishElements.forEach(element => {
      element.style.display = 'none';
      element.style.textAlign = ''; // Remove previously applied styles
      element.style.marginBottom = '';
    });
  } else {
    // Show English elements, apply styles
    englishElements.forEach(element => {
      element.style.display = '';
      element.style.textAlign = '';
      element.style.marginBottom = '';
    });
    // Hide French elements and remove styles
    frenchElements.forEach(element => {
      element.style.display = 'none';
      element.style.textAlign = ''; // Remove previously applied styles
      element.style.marginBottom = '';
    });
  }
}

languageSwitch.addEventListener('change', updateLanguage);

// Call updateLanguage function on page load (optional)
updateLanguage();
