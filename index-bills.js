// This script is specifically for the index.html page to filter static bills.
document.addEventListener("DOMContentLoaded", () => {
  const billDropdown = document.getElementById('bill-filter-dropdown');
  const allBillCards = document.querySelectorAll('.bill-card');

  if (billDropdown && allBillCards.length > 0) {
    // Correctly populate the dropdown with bill titles
    const billTitles = document.querySelectorAll('.bill-card h1');
    
    // Add the "Show All Bills" option once
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Show All Bills';
    billDropdown.appendChild(defaultOption);

    billTitles.forEach(title => {
      const option = document.createElement('option');
      // Use textContent.trim() to clean up the title
      option.value = title.textContent.trim();
      option.textContent = title.textContent.trim();
      billDropdown.appendChild(option);
    });

    // Add an event listener to the dropdown
    billDropdown.addEventListener('change', (event) => {
      const selectedTitle = event.target.value;

      allBillCards.forEach(card => {
        const cardTitle = card.querySelector('h1').textContent.trim();
        if (selectedTitle === '' || cardTitle === selectedTitle) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }
});