let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!audioCtx || audioCtx.state === "closed") {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function tone(ctx: AudioContext, freq: number, startTime: number, duration: number, volume = 0.25) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = freq;
  osc.type = "sine";
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
}

export function playNuevoPedido() {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  tone(ctx, 523, t, 0.12);
  tone(ctx, 659, t + 0.14, 0.12);
  tone(ctx, 784, t + 0.28, 0.22);
}

export function playPedidoListo() {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  tone(ctx, 784, t, 0.1, 0.3);
  tone(ctx, 1047, t + 0.13, 0.1, 0.3);
  tone(ctx, 1319, t + 0.26, 0.3, 0.3);
}

export function playError() {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  tone(ctx, 220, t, 0.3, 0.2);
}
