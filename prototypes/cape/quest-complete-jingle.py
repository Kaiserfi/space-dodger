# a quest-complete fanfare, made the way the game makes sounds: oscillators, filters and envelopes
import math, random, struct, wave
SR = 44100; random.seed(2)
N = lambda name: 440 * 2 ** ((name - 69) / 12)   # midi note to Hz
out = [0.0] * int(SR * 4.2)
def lowpass(x, f):
    a = 1 - math.exp(-2 * math.pi * f / SR); y = 0; r = []
    for v in x: y += a * (v - y); r.append(y)
    return r
def brass(midi, start, dur, vol=0.22, bright=2600):
    f = N(midi); n = int(dur * SR); s = []
    for i in range(n):
        t = i / SR
        vib = 1 + (0.006 * math.sin(2 * math.pi * 5.5 * t) if t > 0.25 else 0)
        ph = f * vib * t
        v = (2 * (ph % 1) - 1) * 0.6 + (1 if (ph * 1.002) % 1 < 0.5 else -1) * 0.25 + math.sin(2 * math.pi * ph / 2) * 0.35
        env = min(1, t / 0.025) * (0.85 + 0.15 * math.exp(-t * 8)) * min(1, max(0, (dur - t) / 0.12))
        s.append(v * env * vol)
    s = lowpass(s, bright)
    o = int(start * SR)
    for i, v in enumerate(s):
        if o + i < len(out): out[o + i] += v
def bell(midi, start, vol=0.12):   # a glockenspiel sparkle on top
    f = N(midi); o = int(start * SR)
    for i in range(int(1.2 * SR)):
        t = i / SR; v = (math.sin(2 * math.pi * f * t) + 0.4 * math.sin(2 * math.pi * f * 2.76 * t)) * math.exp(-t * 4) * vol
        if o + i < len(out): out[o + i] += v
def drum(start, vol=0.5, f0=110):   # a soft timpani hit
    o = int(start * SR)
    for i in range(int(0.7 * SR)):
        t = i / SR; v = (math.sin(2 * math.pi * f0 * (1 - 0.15 * min(1, t * 6)) * t) + random.uniform(-0.3, 0.3) * math.exp(-t * 30)) * math.exp(-t * 5) * vol
        if o + i < len(out): out[o + i] += v
# the fanfare in C major: a rising pickup, "ta-ta-ta TAAA", then a bright held chord with sparkles
pick = [(67, 0.0, 0.13), (72, 0.15, 0.13), (76, 0.30, 0.13)]
for m, s0, d in pick: brass(m, s0, d)
drum(0.0, 0.3, 98); drum(0.45, 0.55, 98)
brass(79, 0.45, 0.42); brass(76, 0.90, 0.16); brass(79, 1.08, 0.16)   # TAA - da - da
drum(1.25, 0.6, 82)
for m in (72, 76, 79, 84): brass(m, 1.25, 2.6, 0.17, 2200)              # the held final chord
brass(48, 1.25, 2.6, 0.2, 900)                                        # a low C underneath
for k, m in enumerate((84, 88, 91, 96)): bell(m, 1.3 + k * 0.09)      # sparkle up the chord
bell(96, 2.0, 0.08); bell(91, 2.25, 0.06)
pk = max(abs(v) for v in out)
with wave.open('quest-complete-jingle.wav', 'w') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(b''.join(struct.pack('<h', int(v / pk * 0.85 * 32767)) for v in out))
print('ok', round(len(out) / SR, 1), 's')
