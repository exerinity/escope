function msg(content = '') {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.background = 'rgba(0,0,0,0.3)';
  overlay.style.backdropFilter = 'blur(7px)';
  overlay.style.zIndex = 9999;
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';

  const box = document.createElement('div');
  box.style.background = '#080015';
  box.style.color = 'white';
  box.style.borderRadius = '16px';
  box.style.boxShadow = '0 4px 32px rgba(0,0,0,0.18)';
  box.style.padding = '2rem 2.5rem 1.5rem 2.5rem';
  box.style.maxWidth = '420px';
  box.style.width = '90vw';
  box.style.position = 'relative';
  box.style.fontFamily = 'inherit';
  box.style.textAlign = 'center';

  const close = document.createElement('button');
  close.innerHTML = `
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M6 6L18 18M18 6L6 18"
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-width="2.25"
      />
    </svg>
  `;
  close.setAttribute('aria-label', 'Close');
  close.style.position = 'absolute';
  close.style.top = '12px';
  close.style.right = '16px';
  close.style.background = 'none';
  close.style.border = 'none';
  close.style.padding = '0';
  close.style.lineHeight = '0';
  close.style.cursor = 'pointer';
  close.style.color = '#6000ff';
  close.style.transition = 'color 0.2s';
  close.onmouseenter = () => { close.style.color = '#ff0000'; };
  close.onmouseleave = () => { close.style.color = '#6000ff'; };
  close.onclick = () => document.body.removeChild(overlay);

  const message = document.createElement('div');
  message.style.marginTop = '0.5rem';
  message.style.fontSize = '1.08rem';
  message.style.lineHeight = '1.6';

  if (content instanceof Node) {
    message.appendChild(content);
  } else {
    message.textContent = String(content);
  }

  box.appendChild(close);
  box.appendChild(message);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) document.body.removeChild(overlay);
  });

  return overlay;
}