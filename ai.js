export function initializeAI() {
  const aiBlocks = document.querySelectorAll('.smart-compose');

  aiBlocks.forEach((block) => {
    const toggleBtn = block.querySelector('.ai-toggle-btn');
    const inputContainer = block.querySelector('.ai-input-container');
    const generateBtn = block.querySelector('.ai-generate-btn');
    const resultContainer = block.querySelector('.ai-result-container');
    const previewBox = block.querySelector('.ai-message-preview');
    const textarea = block.querySelector('.ai-reasons');

    if (!toggleBtn || !inputContainer) return;

    toggleBtn.addEventListener('click', () => {
      inputContainer.classList.toggle('hidden');
    });

    if (!generateBtn || !textarea || !previewBox || !resultContainer) return;

    generateBtn.addEventListener('click', async () => {
      const userInput = textarea.value.trim();
      if (!userInput) {
        alert("Please provide a few reasons or thoughts.");
        return;
      }

      previewBox.textContent = 'Generating message...';
      resultContainer.classList.remove('hidden');
      generateBtn.disabled = true;
      generateBtn.textContent = 'Generating...';

      try {
        const response = await fetch('https://smartcompose.pipedream.net', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bullets: userInput,
            billTitle: block.closest('.bill-card')?.querySelector('h1')?.textContent || 'This bill'
          })
        });

        const data = await response.json();
        previewBox.textContent = data.message || 'Something went wrong.';
      } catch (error) {
        previewBox.textContent = 'Error generating message.';
        console.error(error);
      } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate Message';
      }
    });
  });
}