const form = document.getElementById('uploadForm');
const zipInput = document.getElementById('zipInput');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const file = zipInput.files[0];
  if (!file) {
    alert('ZIPファイルを選択してください');
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    alert('ファイルが大きすぎます（最大200MB）');
    return;
  }

  const formData = new FormData();
  formData.append('zipfile', file);

  progressContainer.classList.remove('hidden');
  progressBar.style.width = '0%';
  progressText.textContent = '0%';

  try {
    const response = await fetch('/api/resize-zip', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const data = await response.json();
      alert(`エラー: ${data.error}`);
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resized_images.zip';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    progressBar.style.width = '100%';
    progressText.textContent = '完了';
  } catch (err) {
    console.error(err);
    alert('アップロード中にエラーが発生しました');
  }
});
