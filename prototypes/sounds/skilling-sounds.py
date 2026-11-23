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


# short versions: each plays once per action, so it's one quick beat
# fishing: a quick, wet slap and splash, with a couple of bright droplets
# a soft splash: no sharp attack, just water gently parting and settling
splash = shape(sweep(noise(0.6), 1800, 600, 0.9), lambda t: (min(1, t / 0.12)) * math.exp(-t * 4.5))
low = shape(bq(noise(0.5), 'lp', 380), lambda t: min(1, t / 0.15) * math.exp(-t * 5))
def drip(f): return [math.sin(2 * math.pi * (f + 600 * math.exp(-i / SR * 50)) * i / SR) * math.exp(-i / SR * 35) for i in range(int(0.1 * SR))]
fish = mix(gain(splash, 0.9), gain(low, 0.5), at(gain(drip(900), 0.12), 0.3), at(gain(drip(1200), 0.08), 0.42))
save('fishing.wav', fish)
# smelting: a bellows whoosh into a flare of fire, ending in a short hiss
whoosh = env(sweep(noise(0.45), 300, 1100, 0.8), 0.12, 0.15)
flare = env(bq(bq(noise(0.55), 'lp', 500), 'hp', 70), 0.05, 0.35)
hiss = env(bq(noise(0.3), 'hp', 4200), 0.01, 0.25)
save('smelting.wav', mix(whoosh, at(gain(flare, 1.2), 0.18), at(gain(hiss, 0.5), 0.5)))
# anvil: one ringing strike, played on each swing of the hammer
ring = bell([(950, 1), (2410, 0.55), (3780, 0.35), (5130, 0.2)], 0.5, 7)
thunk = env(bq(noise(0.05), 'lp', 1200), 0.001, 0.04)
save('anvil-smithing.wav', env(mix(ring, gain(thunk, 1.4)), 0.001, 0.15))
# cooking: a short sizzle as the food hits the heat; burnt flares up harsher
def sizzle(d, bright, rough=0):
    base = shape(bq(noise(d), 'hp', bright), lambda t: math.exp(-t * 2.5) * (1 + rough * random.random()))
    pops = [0.0] * len(base)
    for _ in range(6):
        p = random.randint(0, len(base) - 400); a = random.uniform(0.4, 1.0)
        for i in range(300): pops[p + i] += random.uniform(-1, 1) * a * math.exp(-i / 40)
    return env(mix(gain(base, 0.8), gain(bq(pops, 'hp', 2500), 0.5)), 0.01, 0.2)
save('cooking.wav', sizzle(0.7, 3200))
save('cooking-burnt.wav', mix(sizzle(0.8, 1700, 1.2), gain(env(bq(noise(0.6), 'lp', 380), 0.1, 0.3), 0.6)))
