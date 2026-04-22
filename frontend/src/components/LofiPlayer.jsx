import { useCallback, useEffect, useRef, useState } from 'react';
import { CloudRain, Coffee, Music, Pause, Play, TreePine, Volume2, VolumeX, Wind, Radio } from 'lucide-react';

// ───────────────────────────────────────────────────
// Ambient Sound Engine (Web Audio API)
// ───────────────────────────────────────────────────

function createNoiseBuffer(ctx, seconds = 2) {
  const size = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(2, size, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < size; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }
  return buffer;
}

function createBrownNoiseBuffer(ctx, seconds = 2) {
  const size = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(2, size, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let last = 0;
    for (let i = 0; i < size; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
  }
  return buffer;
}

class AmbientSound {
  constructor(audioCtx) {
    this.ctx = audioCtx;
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.1;
    this.masterGain.connect(this.ctx.destination);
    this.channels = {};
  }

  createRain() {
    if (this.channels.rain) return this.channels.rain;
    const noise = this.ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(this.ctx, 4);
    noise.loop = true;

    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 800;

    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 5000;

    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    noise.connect(hp).connect(lp).connect(gain).connect(this.masterGain);
    noise.start();
    this.channels.rain = { source: noise, gain };
    return this.channels.rain;
  }

  createCafe() {
    if (this.channels.cafe) return this.channels.cafe;
    const noise = this.ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(this.ctx, 4);
    noise.loop = true;

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 600;
    bp.Q.value = 0.4;

    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2500;

    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    noise.connect(bp).connect(lp).connect(gain).connect(this.masterGain);
    noise.start();

    // subtle murmur layer
    const murmur = this.ctx.createBufferSource();
    murmur.buffer = createBrownNoiseBuffer(this.ctx, 4);
    murmur.loop = true;
    const murmurGain = this.ctx.createGain();
    murmurGain.gain.value = 0;
    const murmurLp = this.ctx.createBiquadFilter();
    murmurLp.type = 'lowpass';
    murmurLp.frequency.value = 400;
    murmur.connect(murmurLp).connect(murmurGain).connect(this.masterGain);
    murmur.start();

    this.channels.cafe = { source: noise, gain, extras: [{ source: murmur, gain: murmurGain }] };
    return this.channels.cafe;
  }

  createWind() {
    if (this.channels.wind) return this.channels.wind;
    const noise = this.ctx.createBufferSource();
    noise.buffer = createBrownNoiseBuffer(this.ctx, 4);
    noise.loop = true;

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 500;
    bp.Q.value = 0.3;

    // LFO modulation for wind gusts
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.15;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 300;
    lfo.connect(lfoGain).connect(bp.frequency);
    lfo.start();

    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    noise.connect(bp).connect(gain).connect(this.masterGain);
    noise.start();

    this.channels.wind = { source: noise, gain, extras: [{ source: lfo }] };
    return this.channels.wind;
  }

  createNature() {
    if (this.channels.nature) return this.channels.nature;
    const noise = this.ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(this.ctx, 4);
    noise.loop = true;

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 3000;
    bp.Q.value = 2;

    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 6000;

    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    noise.connect(bp).connect(lp).connect(gain).connect(this.masterGain);
    noise.start();

    // low rustling layer
    const rustle = this.ctx.createBufferSource();
    rustle.buffer = createBrownNoiseBuffer(this.ctx, 4);
    rustle.loop = true;
    const rustleLp = this.ctx.createBiquadFilter();
    rustleLp.type = 'lowpass';
    rustleLp.frequency.value = 600;
    const rustleGain = this.ctx.createGain();
    rustleGain.gain.value = 0;
    rustle.connect(rustleLp).connect(rustleGain).connect(this.masterGain);
    rustle.start();

    this.channels.nature = { source: noise, gain, extras: [{ source: rustle, gain: rustleGain }] };
    return this.channels.nature;
  }

  createBrownNoise() {
    if (this.channels.brownNoise) return this.channels.brownNoise;
    const noise = this.ctx.createBufferSource();
    noise.buffer = createBrownNoiseBuffer(this.ctx, 4);
    noise.loop = true;

    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    noise.connect(gain).connect(this.masterGain);
    noise.start();

    this.channels.brownNoise = { source: noise, gain };
    return this.channels.brownNoise;
  }

  setChannelVolume(name, vol) {
    const ch = this.channels[name];
    if (!ch) return;
    ch.gain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.1);
    if (ch.extras) {
      ch.extras.forEach((ex) => {
        if (ex.gain) ex.gain.gain.setTargetAtTime(vol * 0.4, this.ctx.currentTime, 0.1);
      });
    }
  }

  setMasterVolume(vol) {
    this.masterGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.1);
  }

  destroy() {
    Object.values(this.channels).forEach((ch) => {
      try { ch.source.stop(); } catch (e) { /* ok */ }
      if (ch.extras) ch.extras.forEach((ex) => { try { ex.source.stop(); } catch (e) { /* ok */ } });
    });
    this.channels = {};
  }
}

// ───────────────────────────────────────────────────
// Sound presets
// ───────────────────────────────────────────────────

const SOUNDS = [
  { id: 'rain', label: 'Rain', icon: CloudRain, create: 'createRain' },
  { id: 'cafe', label: 'Café', icon: Coffee, create: 'createCafe' },
  { id: 'wind', label: 'Wind', icon: Wind, create: 'createWind' },
  { id: 'nature', label: 'Nature', icon: TreePine, create: 'createNature' },
  { id: 'brownNoise', label: 'Focus', icon: Radio, create: 'createBrownNoise' },
];

// ───────────────────────────────────────────────────
// Component
// ───────────────────────────────────────────────────

export default function LofiPlayer({ compact = false }) {
  const audioCtxRef = useRef(null);
  const engineRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [masterVol, setMasterVol] = useState(10);
  const [muted, setMuted] = useState(false);
  const [channelVols, setChannelVols] = useState(() => {
    const defaults = {};
    SOUNDS.forEach((s) => { defaults[s.id] = 0; });
    return defaults;
  });

  const initEngine = useCallback(() => {
    if (audioCtxRef.current) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioCtxRef.current = ctx;
    engineRef.current = new AmbientSound(ctx);
    // pre-create all channels
    SOUNDS.forEach((s) => engineRef.current[s.create]());
  }, []);

  useEffect(() => {
    return () => {
      if (engineRef.current) engineRef.current.destroy();
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.setMasterVolume(muted ? 0 : masterVol / 100);
  }, [masterVol, muted]);

  const togglePlay = () => {
    if (!isPlaying) {
      initEngine();
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      // If nothing is active, turn on rain by default
      const anyActive = Object.values(channelVols).some((v) => v > 0);
      if (!anyActive) {
        const newVols = { ...channelVols, rain: 70 };
        setChannelVols(newVols);
        if (engineRef.current) engineRef.current.setChannelVolume('rain', 0.7);
      }
    } else {
      if (audioCtxRef.current) audioCtxRef.current.suspend();
    }
    setIsPlaying(!isPlaying);
  };

  const setChannel = (id, vol) => {
    if (!isPlaying) {
      initEngine();
      if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
      setIsPlaying(true);
    }
    const newVols = { ...channelVols, [id]: vol };
    setChannelVols(newVols);
    if (engineRef.current) engineRef.current.setChannelVolume(id, vol / 100);
  };

  const toggleChannel = (id) => {
    const current = channelVols[id];
    setChannel(id, current > 0 ? 0 : 60);
  };

  if (compact) {
    return (
      <div className="border-4 border-neo-black bg-white p-4 shadow-hard">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            className={`flex h-10 w-10 items-center justify-center border-4 border-neo-black shadow-hard-sm transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none ${
              isPlaying ? 'bg-neo-green' : 'bg-white hover:bg-neo-yellow'
            }`}
          >
            {isPlaying ? <Pause size={16} strokeWidth={3} /> : <Play size={16} strokeWidth={3} fill="currentColor" />}
          </button>

          <div className="flex flex-1 flex-wrap gap-2">
            {SOUNDS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => toggleChannel(id)}
                title={label}
                className={`flex h-8 w-8 items-center justify-center border-2 border-neo-black transition-all ${
                  channelVols[id] > 0 ? 'bg-neo-green shadow-hard-sm' : 'bg-white hover:bg-neo-yellow'
                }`}
              >
                <Icon size={14} strokeWidth={2.5} />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setMuted(!muted)}
            className="flex h-8 w-8 items-center justify-center"
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <VolumeX size={16} strokeWidth={2.5} /> : <Volume2 size={16} strokeWidth={2.5} />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 border-4 border-neo-black bg-white p-5 shadow-hard-lg sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b-4 border-neo-black pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border-4 border-neo-black bg-neo-green shadow-hard-sm">
            <Music size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-lg font-black">Ambient Sounds</h3>
            <p className="font-mono text-xs font-bold text-gray-500">Mix your perfect study soundtrack</p>
          </div>
        </div>

        <button
          type="button"
          onClick={togglePlay}
          className={`flex h-12 w-12 items-center justify-center border-4 border-neo-black shadow-hard transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none ${
            isPlaying ? 'bg-neo-green' : 'bg-white hover:bg-neo-yellow'
          }`}
          title={isPlaying ? 'Pause all' : 'Play'}
        >
          {isPlaying ? <Pause size={20} strokeWidth={3} /> : <Play size={20} strokeWidth={3} fill="currentColor" />}
        </button>
      </div>

      {/* Sound channels */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {SOUNDS.map(({ id, label, icon: Icon }) => {
          const active = channelVols[id] > 0;
          return (
            <div key={id} className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => toggleChannel(id)}
                className={`flex h-14 w-14 items-center justify-center border-4 border-neo-black transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none ${
                  active ? 'bg-neo-green shadow-hard' : 'bg-white shadow-hard-sm hover:bg-neo-yellow'
                }`}
              >
                <Icon size={22} strokeWidth={2.5} />
              </button>
              <span className="font-mono text-xs font-bold">{label}</span>
              {active && (
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={channelVols[id]}
                  onChange={(e) => setChannel(id, Number(e.target.value))}
                  className="w-full accent-forest"
                  style={{ height: '4px' }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Master volume */}
      <div className="mt-4 flex items-center gap-3 border-t-4 border-neo-black pt-4">
        <button
          type="button"
          onClick={() => setMuted(!muted)}
          className="flex h-8 w-8 items-center justify-center border-2 border-neo-black bg-white transition-colors hover:bg-neo-yellow"
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <VolumeX size={14} strokeWidth={2.5} /> : <Volume2 size={14} strokeWidth={2.5} />}
        </button>
        <input
          type="range"
          min="0"
          max="100"
          value={masterVol}
          onChange={(e) => setMasterVol(Number(e.target.value))}
          className="flex-1 accent-forest"
          style={{ height: '4px' }}
        />
        <span className="w-8 text-center font-mono text-xs font-bold">{muted ? '0' : masterVol}</span>
      </div>
    </div>
  );
}
