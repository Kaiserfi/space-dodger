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



def creak(d, f0, f1, rough):   # a hinge creak: a slow, scraping, wobbling tone
    n = int(d * SR); ph = 0; o = []
    for i in range(n):
        t = i / n; f = (f0 + (f1 - f0) * t) * (1 + 0.04 * math.sin(i / SR * 2 * math.pi * 23))
        ph += f / SR; o.append((2 * (ph % 1) - 1) * (0.6 + rough * random.random()))
    o = mix(gain(bq(o, 'bp', 900, 3), 1), gain(bq(o, 'bp', 1900, 4), 0.5))
    return shape(o, lambda t: min(1, t / 0.15) * min(1, (1 - t) / 0.3) * (0.7 + 0.3 * math.sin(t * 17)))
latch = lambda v=1: gain(mix(env(bq(noise(0.03), 'bp', 2600, 2), 0.001, 0.02), ring_(2200, 0.06)), v)
def ring_(f, d): return [math.sin(2 * math.pi * f * i / SR) * math.exp(-i / SR * 60) * 0.4 for i in range(int(d * SR))]
thud = lambda v=1, f=180: gain(mix(env(bq(noise(0.18), 'lp', f * 2), 0.001, 0.15), [math.sin(2 * math.pi * f * (1 - 0.3 * i / SR) * i / SR) * math.exp(-i / SR * 22) for i in range(int(0.2 * SR))]), v)


# a floorboard-style creak: wood rubbing in tiny stick-slip catches. A train of little clicks whose rate glides,
# rung through a few wooden resonances, so it groans rather than whistles
def creakboard(d, r0, r1, vol, seed):
    random.seed(seed); n = int(d * SR); x = [0.0] * n; t = 0.0
    while True:
        k = t / d; rate = r0 + (r1 - r0) * k + 8 * math.sin(k * 11)
        t += (1 / rate) * (0.85 + 0.3 * random.random())
        i = int(t * SR)
        if i >= n: break
        x[i] += 0.6 + 0.4 * random.random()
    body = mix(gain(bq(x, 'bp', 760, 5), 1.0), gain(bq(x, 'bp', 1450, 6), 0.7), gain(bq(x, 'bp', 2600, 7), 0.35), gain(bq(noise(d), 'bp', 1200, 2), 0.04))
    return gain(shape(body, lambda k: min(1, k / 0.18) * min(1, (1 - k) / 0.25) * (0.75 + 0.25 * math.sin(k * 9))), vol)
save('door-open.wav', creakboard(0.42, 150, 260, 1.0, 3))    # rising as the door swings open
save('door-close.wav', creakboard(0.34, 250, 140, 1.0, 8))   # falling as it swings shut
