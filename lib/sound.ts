// Comprehensive Web Audio API synthesizer for student-friendly sound effects
// Instant response, 0ms latency, zero external assets, 100% offline reliable!

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => undefined);
  }
  return audioCtx;
}

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem("hocvui_sound_enabled");
  return stored === null ? true : stored === "true";
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("hocvui_sound_enabled", enabled ? "true" : "false");
}

/**
 * 1. Âm thanh búng nhẹ vui tai khi bấm chọn đáp án A/B/C/D (Bubble pop)
 */
export function playSelectSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(420, now);
  osc.frequency.exponentialRampToValueAtTime(840, now + 0.08);

  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.1);
}

/**
 * 2. Âm thanh click nhạy khi bấm nút chọn đề, chuyển tab, bấm link
 */
export function playClickSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(580, now);
  osc.frequency.exponentialRampToValueAtTime(320, now + 0.06);

  gain.gain.setValueAtTime(0.14, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.08);
}

/**
 * 3. Âm thanh xuất phát rộn ràng khi bấm nút "Bắt đầu làm bài" / "Vào luyện ngay"
 */
export function playStartSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // C4 -> E4 -> G4 -> C5 (nốt đi lên tạo cảm giác sẵn sàng bứt phá)
  const notes = [261.63, 329.63, 392.0, 523.25];

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now + idx * 0.06);

    gain.gain.setValueAtTime(0, now + idx * 0.06);
    gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.06 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.06);
    osc.stop(now + idx * 0.06 + 0.2);
  });
}

/**
 * 4. Âm thanh lướt sang câu tiếp theo (Whoosh / flip)
 */
export function playNextSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(440, now);
  osc.frequency.exponentialRampToValueAtTime(660, now + 0.1);

  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.13);
}

/**
 * 5. Âm thanh leng keng vui sướng khi TRẢ LỜI ĐÚNG (E5 -> G#5 -> B5 -> E6)
 */
export function playCorrectSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [659.25, 830.61, 987.77, 1318.51]; // E5, G#5, B5, E6

  notes.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + index * 0.07);

    gain.gain.setValueAtTime(0, now + index * 0.07);
    gain.gain.linearRampToValueAtTime(0.2, now + index * 0.07 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.07 + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + index * 0.07);
    osc.stop(now + index * 0.07 + 0.32);
  });
}

/**
 * 6. Âm thanh êm dịu, nhắc nhở nhẹ nhàng khi TRẢ LỜI CHƯA ĐÚNG (Boing / Try again)
 */
export function playWrongSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(311.13, now); // Eb4
  osc.frequency.exponentialRampToValueAtTime(220.0, now + 0.24); // A3

  gain.gain.setValueAtTime(0.16, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.3);
}

/**
 * 7. Âm thanh chiến thắng hào hùng khi HOÀN THÀNH BÀI THI (Fanfare arpeggio)
 */
export function playFanfareSound() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // C5, E5, G5, G5, C6 (khúc nhạc mừng chiến thắng)
  const notes = [
    { f: 523.25, d: 0.12 },
    { f: 659.25, d: 0.12 },
    { f: 783.99, d: 0.12 },
    { f: 783.99, d: 0.15 },
    { f: 1046.5, d: 0.6 },
  ];

  let currentOffset = 0;
  notes.forEach((note, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = index === notes.length - 1 ? "triangle" : "sine";
    osc.frequency.setValueAtTime(note.f, now + currentOffset);

    gain.gain.setValueAtTime(0, now + currentOffset);
    gain.gain.linearRampToValueAtTime(0.24, now + currentOffset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + currentOffset + note.d);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + currentOffset);
    osc.stop(now + currentOffset + note.d + 0.05);

    currentOffset += index === 2 ? 0.1 : 0.12;
  });
}
