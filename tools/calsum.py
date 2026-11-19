#!/usr/bin/env python3
# 난이도 재기 요약 (2.2.3): tools/calib.js scnnat 결과(봇이 제 레벨로 닿은 판 그대로 싸운 줄)를 시나리오마다 레벨 → 이김 · 쓰러짐으로 묶고
#   권장(이기고 쓰러짐 ≤ 1 이 80% 이상) · 반반(이김 50%) · 안전(이김 97% 이상, 쓰러짐 ≤ 1 이 90% 이상)을 찾는다. 이웃 레벨(±2)을 무게 반으로 섞어 고르게 본다.
#   python3 tools/calsum.py 결과파일…   → 시나리오마다 한 줄 + 끝에 DS.REC.scn 꼴(단조로 다듬은 것)
import sys, json, collections
rows = [json.loads(l) for f in sys.argv[1:] for l in open(f) if l.startswith('{')]
by = collections.defaultdict(list)
for r in rows:
    if r.get('skip'): continue
    by[r['n']].append(r)
def stats(rs):
    b = collections.defaultdict(list)
    for r in rs: b[r['L']].append(r)
    Ls = sorted(b)
    out = []
    for L in Ls:
        W = w = c = 0.0
        for M in Ls:
            k = 1.0 if M == L else 0.5 if abs(M - L) <= 2 else 0
            if not k: continue
            for r in b[M]:
                W += k; w += k * r['win']; c += k * (1 if r['win'] and r['dead'] <= 1 else 0)
        out.append((L, len(b[L]), w / W, c / W))
    return out
def first(st, ok):
    for i in range(len(st)):
        if all(ok(x) for x in st[i:]): return st[i][0]
    return None
res = {}
for n in sorted(by):
    st = stats(by[n])
    rec = first(st, lambda x: x[3] >= 0.8); half = first(st, lambda x: x[2] >= 0.5); safe = first(st, lambda x: x[2] >= 0.97 and x[3] >= 0.9)
    lo = st[0][0]
    res[n] = (rec, half, safe, lo)
    print('%2d rec %-4s half %-4s safe %-4s (lowest seen %d)  %s' % (n, rec, half, safe, lo, ' '.join('%d:%d/%d(%d)' % (L, round(w * 100), round(c * 100), k) for L, k, w, c in st)))
def iso(v):      # 단조 다듬기 (이웃 묶음 평균)
    blocks = [[x, 1] for x in v]
    i = 0
    while i < len(blocks) - 1:
        if blocks[i][0] > blocks[i + 1][0]:
            a, b = blocks[i], blocks[i + 1]; blocks[i] = [(a[0] * a[1] + b[0] * b[1]) / (a[1] + b[1]), a[1] + b[1]]; del blocks[i + 1]; i = max(0, i - 1)
        else: i += 1
    out = []
    for x, k in blocks: out += [round(x)] * k
    return out
ns = sorted(res)
R = iso([res[n][0] or res[n][3] for n in ns]); H = iso([res[n][1] or res[n][3] for n in ns]); S = iso([res[n][2] or max(res[n][0] or 0, res[n][3]) for n in ns])
print('scn: { ' + ', '.join('%d: [%d, %d, %d]' % (n, R[i], min(H[i], R[i]), max(S[i], R[i])) for i, n in enumerate(ns)) + ' }')
