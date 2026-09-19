(() => {
  if (window.__qrStudioInitialized) return;
  window.__qrStudioInitialized = true;
  const textInput = document.querySelector('#qr-text');
  const contentType = document.querySelector('#content-type');
  const primaryLabel = document.querySelector('#primary-label');
  const photoFileInput = document.querySelector('#photo-file');
  const photoUrlInput = document.querySelector('#photo-url');
  const photoLinkRow = document.querySelector('#photo-link-row');
  const photoLinkInput = document.querySelector('#photo-link');
  const copyPhotoLink = document.querySelector('#copy-photo-link');
  const extraFields = {
    styled: document.querySelector('#styled-fields'),
    photo: document.querySelector('#photo-fields'),
    contact: document.querySelector('#contact-fields'),
    wifi: document.querySelector('#wifi-fields')
  };
  const foregroundInput = document.querySelector('#foreground');
  const backgroundInput = document.querySelector('#background');
  const sizeInput = document.querySelector('#size');
  const canvas = document.querySelector('#qr-canvas');
  const emptyState = document.querySelector('#empty-state');
  const status = document.querySelector('#status');
  const downloadButton = document.querySelector('#download');
  const characterCount = document.querySelector('#character-count');
  const sizeLabel = document.querySelector('#size-label');
  let debounceTimer;
  let photoObjectUrl = '';

  function encodeViewData(data) {
    const bytes = new TextEncoder().encode(JSON.stringify(data));
    let binary = '';
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function decodeViewData(value) {
    const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4));
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0))));
  }

  function getStyledData() {
    return {
      title: document.querySelector('#styled-title').value.trim() || 'A note worth sharing',
      message: document.querySelector('#styled-message').value.trim(),
      textColor: document.querySelector('#styled-text-color').value,
      cardColor: document.querySelector('#styled-card-color').value,
      bold: document.querySelector('#styled-bold').checked,
      size: document.querySelector('#styled-size').value
    };
  }

  function getHostedViewerUrl() {
    const base = `${window.location.origin}${window.location.pathname}`;
    return `${base}#view=${encodeViewData(getStyledData())}`;
  }

  function renderViewer() {
    const value = new URLSearchParams(window.location.hash.slice(1)).get('view');
    if (!value) return false;
    try {
      const data = decodeViewData(value);
      document.querySelector('.page-shell').hidden = true;
      document.querySelector('#message-viewer').hidden = false;
      document.querySelector('#viewer-title').textContent = data.title;
      document.querySelector('#viewer-message').textContent = data.message;
      const card = document.querySelector('#viewer-card');
      card.style.color = data.textColor;
      card.style.backgroundColor = data.cardColor;
      const message = document.querySelector('#viewer-message');
      message.style.fontWeight = data.bold ? '760' : '400';
      message.style.fontSize = `${data.size}px`;
      return true;
    } catch (error) {
      return false;
    }
  }

  if (renderViewer()) return;

  function escapeVcard(value) {
    return value.replace(/[\\,;\n]/g, (character) => ({ '\\': '\\\\', ',': '\\,', ';': '\\;', '\n': '\\n' }[character]));
  }

  function getQrValue() {
    const type = contentType.value;
    if (type === 'styled') {
      const data = getStyledData();
      return data.message ? getHostedViewerUrl() : '';
    }
    if (type === 'photo') return photoUrlInput.value.trim();
    if (type === 'contact') {
      const name = document.querySelector('#contact-name').value.trim();
      const phone = document.querySelector('#contact-phone').value.trim();
      const email = document.querySelector('#contact-email').value.trim();
      const company = document.querySelector('#contact-company').value.trim();
      if (!name && !phone && !email && !company) return '';
      return ['BEGIN:VCARD', 'VERSION:3.0', `FN:${escapeVcard(name)}`, `ORG:${escapeVcard(company)}`, `TEL:${escapeVcard(phone)}`, `EMAIL:${escapeVcard(email)}`, 'END:VCARD'].join('\n');
    }
    if (type === 'wifi') {
      const name = document.querySelector('#wifi-name').value.trim();
      const password = document.querySelector('#wifi-password').value;
      const security = document.querySelector('#wifi-security').value;
      if (!name) return '';
      return `WIFI:T:${security};S:${name.replace(/[\\;,:\"]/g, '\\$&')};P:${password.replace(/[\\;,:\"]/g, '\\$&')};;`;
    }
    return textInput.value.trim();
  }

  function updateMode() {
    const type = contentType.value;
    Object.entries(extraFields).forEach(([fieldType, element]) => { element.hidden = fieldType !== type; });
    textInput.closest('.field').hidden = type !== 'text';
    primaryLabel.textContent = type === 'text' ? 'Text or URL' : type === 'photo' ? 'Photo link preview' : type === 'styled' ? 'Styled message preview' : 'Details preview';
    scheduleRender();
  }

  function handlePhotoFile() {
    const file = photoFileInput.files[0];
    if (!file) return;
    if (photoObjectUrl) URL.revokeObjectURL(photoObjectUrl);
    photoObjectUrl = URL.createObjectURL(file);
    photoUrlInput.value = photoObjectUrl;
    photoLinkInput.value = photoObjectUrl;
    photoLinkRow.hidden = false;
    scheduleRender();
  }

  function updateLabels() {
    document.querySelector('#foreground-value').textContent = foregroundInput.value.toUpperCase();
    document.querySelector('#background-value').textContent = backgroundInput.value.toUpperCase();
    characterCount.textContent = `${getQrValue().length.toLocaleString()} / 2,000`;
    sizeLabel.textContent = `${sizeInput.value} × ${sizeInput.value} px`;
    document.querySelector('#styled-text-value').textContent = document.querySelector('#styled-text-color').value.toUpperCase();
    document.querySelector('#styled-card-value').textContent = document.querySelector('#styled-card-color').value.toUpperCase();
  }

  function renderQr() {
    const value = getQrValue();
    updateLabels();
    if (!value) {
      canvas.hidden = true;
      emptyState.hidden = false;
      downloadButton.disabled = true;
      status.textContent = 'Waiting';
      return;
    }
    status.textContent = 'Updating';
    QRCode.toCanvas(canvas, value, {
      width: Number(sizeInput.value),
      margin: 2,
      color: { dark: foregroundInput.value, light: backgroundInput.value },
      errorCorrectionLevel: 'H'
    }, (error) => {
      if (error) {
        status.textContent = 'Try again';
        downloadButton.disabled = true;
        return;
      }
      canvas.hidden = false;
      emptyState.hidden = true;
      downloadButton.disabled = false;
      status.textContent = 'Live';
    });
  }

  function scheduleRender() {
    clearTimeout(debounceTimer);
    status.textContent = 'Typing';
    debounceTimer = setTimeout(renderQr, 260);
  }

  textInput.addEventListener('input', scheduleRender);
  photoFileInput.addEventListener('change', handlePhotoFile);
  photoUrlInput.addEventListener('input', () => {
    photoLinkRow.hidden = !photoUrlInput.value.trim();
    scheduleRender();
  });
  copyPhotoLink.addEventListener('click', async () => {
    await navigator.clipboard.writeText(photoLinkInput.value);
    copyPhotoLink.textContent = 'Copied';
    setTimeout(() => { copyPhotoLink.textContent = 'Copy link'; }, 1200);
  });
  contentType.addEventListener('change', updateMode);
  document.querySelectorAll('[data-qr-input]').forEach((input) => input.addEventListener('input', scheduleRender));
  foregroundInput.addEventListener('input', scheduleRender);
  backgroundInput.addEventListener('input', scheduleRender);
  sizeInput.addEventListener('change', renderQr);
  document.querySelector('#generate').addEventListener('click', renderQr);
  downloadButton.addEventListener('click', () => {
    if (downloadButton.disabled) return;
    const link = document.createElement('a');
    link.download = 'qr-studio-code.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });

  updateLabels();
  updateMode();
  renderQr();
})();
