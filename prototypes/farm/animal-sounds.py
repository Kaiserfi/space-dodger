# synthesise farm animal sounds the way the game makes its sounds: oscillators, noise, filters and envelopes
import math, random, struct, wave, sys
SR = 44100
random.seed(4)
def saw(ph): return 2 * (ph % 1) - 1
def biquad(x, kind, f, q):
    w = 2 * math.pi * f / SR; a = math.sin(w) / (2 * q); c = math.cos(w)
    if kind == 'bp': b0, b1, b2 = a, 0, -a
    else: b0 = b2 = (1 - c) / 2; b1 = 1 - c
    a0, a1, a2 = 1 + a, -2 * c, 1 - a
    y = []; x1 = x2 = y1 = y2 = 0
    for v in x:
        o = (b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0
        x2, x1, y2, y1 = x1, v, y1, o; y.append(o)
    return y
def formants(src, fs):   # a voice: the source through a few vowel resonances
    out = [0] * len(src)
    for f, q, g in fs:
        b = biquad(src, 'bp', f, q)
        for i in range(len(out)): out[i] += b[i] * g
    return out
def env(n, a, r, sus=1.0):
    e = []
    for i in range(n):
        t = i / SR; T = n / SR
        e.append(min(1, t / a) * min(1, max(0, (T - t) / r)) * sus)
    return e
def tone(dur, f0fn, vib=0, vibrate=5, jitter=0.0):
    n = int(dur * SR); ph = 0; out = []
    for i in range(n):
        t = i / SR
        f = f0fn(t / dur) * (1 + vib * math.sin(2 * math.pi * vibrate * t)) * (1 + jitter * (random.random() - 0.5))
        ph += f / SR; out.append(saw(ph))
    return out
def norm(x, peak=0.8):
    m = max(abs(v) for v in x) or 1; return [v / m * peak for v in x]
def save(name, x):
    x = norm(x)
    with wave.open(name, 'w') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, v)) * 32767)) for v in x))
def silence(s): return [0.0] * int(s * SR)

# cow: a long low "mmmoooo", the pitch rising then sinking, the mouth opening from m to o
def moo():
    d = 1.6; src = tone(d, lambda k: 105 + 40 * math.sin(math.pi * min(1, k * 1.3)) - 25 * k, vib=0.012, vibrate=5.5)
    n = len(src); out = [0] * n
    seg = 6
    for s in range(seg):   # slide the formants from a closed "m" to an open "oo"
        k = s / (seg - 1); a, b = int(n * s / seg), int(n * (s + 1) / seg)
        part = formants(src[max(0, a - 2000):b], [(250 + 300 * k, 4, 1.0), (700 + 200 * k, 5, 0.5 * k + 0.1), (2400, 6, 0.05)])
        part = part[a - max(0, a - 2000):]
        for i, v in enumerate(part): out[a + i] = v
    e = env(n, 0.18, 0.45)
    return [v * g for v, g in zip(out, e)]

# sheep: a bleating "baa-aa-aa", a mid voice that wobbles fast in loudness
def baa():
    d = 1.0; src = tone(d, lambda k: 340 - 60 * k, vib=0.02, vibrate=7, jitter=0.02)
    out = formants(src, [(750, 5, 1.0), (1250, 6, 0.6), (2600, 7, 0.2)])
    n = len(out); e = env(n, 0.03, 0.25)
    return [v * g * (0.55 + 0.45 * math.sin(2 * math.pi * 11 * i / SR)) for i, (v, g) in enumerate(zip(out, e))]

# pig: two short snorty grunts, low and rough with some breathy noise
def grunt(d, f):
    src = tone(d, lambda k: f * (1.15 - 0.3 * k), jitter=0.25)
    noise = [random.uniform(-1, 1) * 0.6 for _ in src]
    mix = [a + b for a, b in zip(src, noise)]
    out = formants(mix, [(380, 3, 1.0), (900, 4, 0.5)])
    e = env(len(out), 0.01, 0.08)
    return [v * g for v, g in zip(out, e)]
def oink(): return grunt(0.2, 140) + silence(0.09) + grunt(0.26, 120)

# chicken: quick clucks, then a rising "bawk"
def cluck(f, d):
    src = tone(d, lambda k: f * (1 + 0.4 * k))
    out = formants(src, [(1100, 6, 1.0), (2300, 7, 0.4)])
    e = env(len(out), 0.004, 0.03)
    return [v * g for v, g in zip(out, e)]
def bawk():
    src = tone(0.38, lambda k: 520 + 380 * math.sin(math.pi * k * 0.8), vib=0.03, vibrate=14)
    out = formants(src, [(900, 5, 1.0), (1900, 6, 0.6)])
    e = env(len(out), 0.02, 0.12)
    return [v * g for v, g in zip(out, e)]
def chicken():
    out = []
    for f, gap in [(600, 0.11), (640, 0.13), (580, 0.09), (620, 0.22)]: out += cluck(f, 0.06) + silence(gap)
    return out + bawk()

save('cow-moo.wav', moo()); save('sheep-baa.wav', baa()); save('pig-oink.wav', oink()); save('chicken-cluck.wav', chicken())
# all four in a row
save('farm-animals-all.wav', moo() + silence(0.5) + baa() + silence(0.5) + oink() + silence(0.5) + chicken())
print('ok')
