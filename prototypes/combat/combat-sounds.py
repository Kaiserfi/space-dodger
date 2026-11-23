# combat sounds, made the game's way: noise, oscillators, filters, envelopes
import math, random, struct, wave
SR = 44100; random.seed(9)
def save(name, x, peak=0.85):
    m = max(abs(v) for v in x) or 1
    with wave.open(name, 'w') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(b''.join(struct.pack('<h', int(v / m * peak * 32767)) for v in x))
def sil(s): return [0.0] * int(s * SR)
def bq(x, kind, f, q=0.7):
    w0 = 2 * math.pi * f / SR; a = math.sin(w0) / (2 * q); c = math.cos(w0)
    if kind == 'lp': b0, b1, b2 = (1 - c) / 2, 1 - c, (1 - c) / 2
    elif kind == 'hp': b0, b1, b2 = (1 + c) / 2, -(1 + c), (1 + c) / 2
    else: b0, b1, b2 = a, 0, -a
    a0, a1, a2 = 1 + a, -2 * c, 1 - a; y = []; x1 = x2 = y1 = y2 = 0
    for v in x:
        o = (b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0; x2, x1, y2, y1 = x1, v, y1, o; y.append(o)
    return y
def noise(d): return [random.uniform(-1, 1) for _ in range(int(d * SR))]
def env(x, a, r):
    n = len(x); return [v * min(1, i / (a * SR + 1)) * min(1, (n - i) / (r * SR + 1)) for i, v in enumerate(x)]
def sweep_bp(x, f0, f1, q):   # a band-pass that slides, for whooshes
    out = []; step = 512
    for s in range(0, len(x), step):
        f = f0 + (f1 - f0) * s / len(x); out += bq(x[s:s + step], 'bp', f, q)
    return out
def tone(d, f0, f1, kind='saw', jit=0):
    n = int(d * SR); ph = 0; o = []
    for i in range(n):
        f = (f0 + (f1 - f0) * i / n) * (1 + jit * (random.random() - 0.5)); ph += f / SR
        o.append(2 * (ph % 1) - 1 if kind == 'saw' else math.sin(2 * math.pi * ph))
    return o
def mix(*parts):
    n = max(len(p) for p in parts); o = [0.0] * n
    for p in parts:
        for i, v in enumerate(p): o[i] += v
    return o
def voice(d, f0, f1, formants, jit=0.02, breath=0.2):
    src = tone(d, f0, f1, 'saw', jit); src = [s + random.uniform(-1, 1) * breath for s in src]
    o = mix(*[[v * g for v in bq(src, 'bp', f, q)] for f, q, g in formants]); return env(o, 0.02, d * 0.5)
swing = env(sweep_bp(noise(0.32), 500, 2400, 1.4), 0.12, 0.12)                       # a sword swishing through the air
hit = mix(env(bq(noise(0.18), 'lp', 900), 0.002, 0.15), env([v * 0.8 for v in tone(0.15, 120, 60, 'sine')], 0.002, 0.12))   # a dull thud on armour or hide
clang = mix(*[env([math.sin(2 * math.pi * f * i / SR) * math.exp(-i / SR * 6) * g for i in range(int(0.9 * SR))], 0.001, 0.3) for f, g in [(620, 1), (1544, 0.6), (2490, 0.4), (3711, 0.25)]], env(bq(noise(0.05), 'hp', 3000), 0.001, 0.04))   # a blow ringing off the shield
miss = env(sweep_bp(noise(0.28), 1800, 700, 1.0), 0.05, 0.15)                         # a swing that cuts only air
hurt_m = voice(0.32, 150, 105, [(500, 4, 1), (1100, 5, 0.5), (2400, 6, 0.15)])         # "oof"
hurt_f = voice(0.3, 290, 220, [(800, 4, 1), (1300, 5, 0.6), (2800, 6, 0.2)])           # "ah!"
gob_atk = voice(0.42, 230, 330, [(700, 3, 1), (1600, 4, 0.6)], jit=0.25, breath=0.5)    # a snarling yell
gob_hurt = voice(0.28, 520, 760, [(1000, 4, 1), (2200, 5, 0.6)], jit=0.12, breath=0.3) # a squeal
gob_die = voice(0.9, 420, 140, [(800, 4, 1), (1800, 5, 0.5)], jit=0.15, breath=0.35)   # a falling wail
for n, x in [('sword-swing', swing), ('hit', hit), ('shield-block', clang), ('miss', miss), ('hurt-male', hurt_m), ('hurt-female', hurt_f),
             ('goblin-attack', gob_atk), ('goblin-hurt', gob_hurt), ('goblin-death', gob_die)]: save(n + '.wav', x)
# one round in order: you swing and hit, the goblin squeals; it snarls, you block; it hits you (male, then female); you miss; final blow; it dies
seq = (swing + mix(hit, sil(0.05) + gob_hurt) + sil(0.5) + gob_atk + mix(swing, sil(0.12) + clang) + sil(0.5) + gob_atk + mix(swing, sil(0.1) + hit, sil(0.12) + hurt_m)
       + sil(0.5) + gob_atk + mix(swing, sil(0.1) + hit, sil(0.12) + hurt_f) + sil(0.5) + swing + miss + sil(0.5) + swing + mix(hit, sil(0.05) + gob_die))
save('combat-round.wav', seq); print('ok', round(len(seq) / SR, 1), 's')
