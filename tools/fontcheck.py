#!/usr/bin/env python3
# 글꼴 검사: src 안에서 쓰는 한글 글자가 본문·제목 글꼴(부분 집합)에 모두 있는가. python3 tools/fontcheck.py
import glob, os, sys
from fontTools.ttLib import TTFont
root = os.path.join(os.path.dirname(__file__), '..')
chars = set()
for f in glob.glob(os.path.join(root, 'src', '*.js')) + glob.glob(os.path.join(root, 'src', '*.css')):
    t = open(f, encoding='utf8').read()
    chars |= {c for c in t if 0xAC00 <= ord(c) <= 0xD7A3}
bad = 0
for name in ['TBBodyB-Regular', 'TBTitleB-SemiBold', 'TBBodyB-SemiBold']:
    p = os.path.join(root, 'fonts', name + '.woff2')
    if not os.path.exists(p): continue
    cmap = TTFont(p).getBestCmap()
    miss = sorted(c for c in chars if ord(c) not in cmap)
    print('%s: %d Hangul used, missing %d %s' % (name, len(chars), len(miss), ''.join(miss)))
    if name != 'TBBodyB-SemiBold': bad += len(miss)
sys.exit(1 if bad else 0)
