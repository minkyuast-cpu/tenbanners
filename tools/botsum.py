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
