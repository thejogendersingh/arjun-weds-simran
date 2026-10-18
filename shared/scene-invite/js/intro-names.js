// Names are live text, not baked into the shared curtain animation.
export function mountIntroNames(intro, video, couple) {
  const layer = document.createElement('div');
  layer.className = 'ms-intro__names';
  layer.setAttribute('aria-hidden', 'true');
  const lines = [couple.partnerOne, couple.connector || '&', couple.partnerTwo].map((text, index) => {
    const line = document.createElement('span');
    line.className = 'ms-intro__name ms-intro__name--' + index;
    line.textContent = text;
    layer.append(line);
    return line;
  });
  intro.append(layer);
  const resize = () => {
    // Match the video's object-fit:cover geometry, including landscape screens.
    const scale = Math.max(intro.clientWidth / 720, intro.clientHeight / 1280);
    layer.style.width = 720 * scale + 'px';
    layer.style.height = 1280 * scale + 'px';
    lines.forEach((line, i) => {
      const base = i === 1 ? 75 : 86;
      line.style.fontSize = base * scale + 'px';
      line.style.transform = 'translateX(-50%)';
      const max = 540 * scale;
      if (line.scrollWidth > max) line.style.fontSize = base * scale * max / line.scrollWidth + 'px';
    });
  };
  const observer = new ResizeObserver(resize);
  observer.observe(intro);
  document.fonts.ready.then(resize);
  let callback = 0;
  const paint = () => {
    if (!intro.isConnected) { observer.disconnect(); return; }
    const time = video.currentTime;
    lines.forEach((line, i) => {
      const progress = Math.max(0, Math.min(1, (time - [2.65, 3.0, 3.12][i]) / 0.48));
      line.style.opacity = String(progress);
      line.style.filter = 'blur(' + (1 - progress) * 5 + 'px)';
    });
  };
  const tick = () => {
    paint();
    if (intro.isConnected && !video.paused && !video.ended) callback = requestAnimationFrame(tick);
  };
  video.addEventListener('play', () => { cancelAnimationFrame(callback); tick(); });
  video.addEventListener('pause', () => { cancelAnimationFrame(callback); paint(); });
  video.addEventListener('timeupdate', paint);
  video.addEventListener('seeked', paint);
  video.addEventListener('ended', paint);
  document.addEventListener('intro:done', () => {
    cancelAnimationFrame(callback);
    observer.disconnect();
  }, {once:true});
  resize();
  return layer;
}
