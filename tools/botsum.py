#!/usr/bin/env python3
# 봇 결과 줄(JSON) 묶음 요약: python3 tools/botsum.py qa_out/k10.txt
import sys, json
rows = [json.loads(l) for f in sys.argv[1:] for l in open(f) if l.strip().startswith('{')]
for d in sorted(rows, key=lambda d: (d['cls'], d['seed'])):
    print('%-4s s%-2d %6.2fh  wipes %d  deaths %2d (hero %d bear %2d kin %d)  lapse %d  vacAvg %.2f vacMax %d  rec %2d  kin→ %2d  births %2d  %s' % (d['cls'], d['seed'], d['hours'], d['wipes'], d['deaths'], d['heroDeaths'], d['bearDeaths'], d['kinDeaths'], d['lapse'], d['vacAvg'], d['vacMax'], d['recruits'], d['kinSent'], d['births'], 'STUCK' if d.get('stuck') else ''))
by = {}
for d in rows: by.setdefault(d['cls'], []).append(d)
for c, L in sorted(by.items()):
    n = len(L); med = sorted(x['hours'] for x in L)[n // 2]
    print('%s: n=%d  median %.2fh  wipes %d  deaths %.1f/run  lapses %d' % (c, n, med, sum(x['wipes'] for x in L), sum(x['deaths'] for x in L) / n, sum(x['lapse'] for x in L)))
# 2.2.4: 묶음 전체 — 평균 시간 · 들판 몫 · 쓰러짐 · 전멸 · 대 끊김, 시나리오 n 을 깬 뒤의 가문 수(평균), 처음 들어갈 때 레벨 − 권장(BOTNOFIELD 판이면 시나리오만 한 사람)
if rows:
    n = len(rows); H = sum(d['hours'] for d in rows) / n
    fs = [d['fieldH'] / d['hours'] for d in rows if d.get('fieldH') is not None and d['hours']]
    print('ALL n=%d  mean %.2fh (min %.2f max %.2f)  field share %s  wipes %d  deaths %.1f/run  lapses %d  stuck %d' % (n, H, min(d['hours'] for d in rows), max(d['hours'] for d in rows), ('%.0f%%' % (100 * sum(fs) / len(fs))) if fs else '-', sum(d['wipes'] for d in rows), sum(d['deaths'] for d in rows) / n, sum(d['lapse'] for d in rows), sum(1 for d in rows if d.get('stuck'))))
    ha = [d['hAt'] for d in rows if d.get('hAt')]
    if ha: print('houses after scenario 1..15: ' + ' '.join('%d:%.1f' % (i + 1, sum(h[i] for h in ha if len(h) > i) / len([h for h in ha if len(h) > i])) for i in range(15) if any(len(h) > i for h in ha)))
    el = [(d['eL'], d['rAt']) for d in rows if d.get('eL') and d.get('rAt')]
    if el: print('entry L - rec, scenario 1..30: ' + ' '.join('%d:%+.1f' % (i + 1, sum(e[i] - r[i] for e, r in el if len(e) > i and len(r) > i) / max(1, len([1 for e, r in el if len(e) > i and len(r) > i]))) for i in range(30)))
    bd = {}
    for d in rows:
        for k, v in (d.get('bdc') or {}).items(): bd[k] = bd.get(k, 0) + v
    if bd: print('bearer deaths by house (per run): ' + ' '.join('%s:%.2f' % (k, v / n) for k, v in sorted(bd.items(), key=lambda x: -x[1])))
    # 2.2.6: 가문(병과)마다 준 피해 몫 · 맹주 병과마다 시간 · 필살기 · 기술 쓴 수
    dm = {}
    for d in rows:
        tot = sum((d.get('dmg') or {}).values()) or 1
        one = {}
        for k, v in (d.get('dmg') or {}).items(): one[k.rstrip('+')] = one.get(k.rstrip('+'), 0) + v / tot
        for k, v in one.items(): dm.setdefault(k, []).append(v)
    if dm: print('damage share by house (mean over runs it appears in, master forms merged): ' + ' '.join('%s:%.1f%%' % (k, 100 * sum(v) / len(v)) for k, v in sorted(dm.items(), key=lambda x: -sum(x[1]) / len(x[1]))))
    dmm = {}
    for d in rows:
        tot = sum((d.get('dmg') or {}).values()) or 1
        for k, v in (d.get('dmg') or {}).items():
            if k.endswith('+'): dmm.setdefault(k, []).append(v / tot)
    if dmm: print('  of which master forms: ' + ' '.join('%s:%.1f%%' % (k, 100 * sum(v) / len(v)) for k, v in sorted(dmm.items())))
    print('hours by hero class: ' + ' '.join('%s:%.2f' % (c, sum(x['hours'] for x in L) / len(L)) for c, L in sorted(by.items())))
    ul = {}
    for d in rows:
        for k, v in (d.get('ult') or {}).items(): ul[k.split(':')[1]] = ul.get(k.split(':')[1], 0) + v
    if ul: print('ults used (total): ' + ' '.join('%s:%d' % (k, v) for k, v in sorted(ul.items(), key=lambda x: -x[1])))
    sk = {}
    for d in rows:
        for k, v in (d.get('sk') or {}).items(): sk[k] = sk.get(k, 0) + v
    if sk: print('skills used (per run): ' + ' '.join('%s:%.0f' % (k, v / n) for k, v in sorted(sk.items(), key=lambda x: -x[1])))
    ds = {}
    for d in rows:
        tot = sum((d.get('dmg') or {}).values()) or 1
        for k, v in (d.get('dsk') or {}).items(): ds[k] = ds.get(k, 0) + v / tot / n
    if ds:
        by_c = {}
        for k, v in ds.items(): c, h = k.split(':'); by_c.setdefault(c, []).append((h, v))
        print('damage by source (share of all, per run): ' + ' | '.join(c + ' ' + ' '.join('%s %.1f%%' % (h, 100 * v) for h, v in sorted(L, key=lambda x: -x[1])[:5]) for c, L in sorted(by_c.items(), key=lambda x: -sum(v for h, v in x[1]))))
