const form = document.getElementById('uploadForm');
const resultDiv = document.getElementById('result');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('zipInput');
  if (!input.files || input.files.length === 0) return alert('ZIPファイルを選択してください');

  const formData = new FormData();
  formData.append('zipfile', input.files[0]);

  // プログレスバー表示
  progressContainer.classList.remove('hidden');
  progressBar.style.width = '0%';
  progressText.textContent = '0%';
  resultDiv.innerHTML = '<p>変換中…</p>';

  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/resize-zip', true);
  xhr.responseType = 'blob';

  // アップロード進捗
  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      const percent = Math.round((event.loaded / event.total) * 100);
      progressBar.style.width = percent + '%';
      progressText.textContent = percent + '%';
    }
  };

  xhr.onload = () => {
    if (xhr.status === 200) {
      const blob = xhr.response;
      const url = URL.createObjectURL(blob);
      resultDiv.innerHTML = `<a href="${url}" download="resized_images.zip">リサイズ済みZIPをダウンロード</a>`;
      progressBar.style.width = '100%';
      progressText.textContent = '100%';
    } else {
      resultDiv.innerHTML = `<p>エラー: ${xhr.statusText}</p>`;
    }
  };

  xhr.onerror = () => {
    resultDiv.innerHTML = '<p>アップロード中にエラーが発生しました</p>';
  };

  xhr.send(formData);
});
