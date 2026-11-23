import math, random, struct, wave
SR = 44100; random.seed(5)
def save(n, x, pk=0.85):
    m = max(abs(v) for v in x) or 1
    with wave.open(n, 'w') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(b''.join(struct.pack('<h', int(v / m * pk * 32767)) for v in x))
def sil(s): return [0.0] * int(s * SR)
def noise(d): return [random.uniform(-1, 1) for _ in range(int(d * SR))]
def bq(x, kind, f, q=0.7):
    w0 = 2 * math.pi * f / SR; a = math.sin(w0) / (2 * q); c = math.cos(w0)
    b0, b1, b2 = {'lp': ((1 - c) / 2, 1 - c, (1 - c) / 2), 'hp': ((1 + c) / 2, -(1 + c), (1 + c) / 2), 'bp': (a, 0, -a)}[kind]
    a0, a1, a2 = 1 + a, -2 * c, 1 - a; y = []; x1 = x2 = y1 = y2 = 0
    for v in x: o = (b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0; x2, x1, y2, y1 = x1, v, y1, o; y.append(o)
    return y
def env(x, a, r): n = len(x); return [v * min(1, i / (a * SR + 1)) * min(1, (n - i) / (r * SR + 1)) for i, v in enumerate(x)]
def shape(x, f): n = len(x); return [v * f(i / n) for i, v in enumerate(x)]
def mix(*ps):
    n = max(len(p) for p in ps); o = [0.0] * n
    for p in ps:
        for i, v in enumerate(p): o[i] += v
    return o
def at(x, s): return sil(s) + x
def gain(x, g): return [v * g for v in x]
def bell(fs, d, decay):   # metal ringing: a few inharmonic partials
    return [sum(math.sin(2 * math.pi * f * i / SR) * g * math.exp(-i / SR * decay * (1 + k * 0.6)) for k, (f, g) in enumerate(fs)) for i in range(int(d * SR))]
def sweep(x, f0, f1, q, kind='bp'):
    out = []; st = 400
    for s in range(0, len(x), st): out += bq(x[s:s + st], kind, f0 + (f1 - f0) * s / len(x), q)
    return out



# mining: a pick biting into rock. A bright metallic strike (like the anvil, but higher and shorter),
# a gritty crunch of stone giving way, a low knock in the rock, and a few chips of rubble falling
def pick(pitch=1.0):
    ring = bell([(1650 * pitch, 1), (3420 * pitch, 0.5), (5280 * pitch, 0.3)], 0.32, 14)
    crunch = env(bq(bq(noise(0.12), 'bp', 2100, 0.9), 'hp', 900), 0.001, 0.1)
    knock = env(bq(noise(0.1), 'lp', 320), 0.001, 0.08)
    chips = mix(*[at(gain(env(bq(noise(0.03), 'bp', random.uniform(2500, 4200), 2.5), 0.001, 0.025), random.uniform(0.15, 0.35)), random.uniform(0.07, 0.32)) for _ in range(5)])
    return env(mix(gain(ring, 0.55), gain(crunch, 1.1), gain(knock, 0.9), chips), 0.001, 0.12)
save('mining.wav', pick(1.0))
save('mining-three-swings.wav', pick(1.0) + sil(0.55) + pick(1.04) + sil(0.55) + pick(0.97))
