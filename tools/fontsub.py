#!/usr/bin/env python3
# 글꼴 부분 집합 다시 만들기: 본문·제목 글꼴(TB Sans = Pretendard 1.3.9, OFL)을 src 에서 쓰는 글자에 맞춰 다시 자른다.
#   python3 tools/fontsub.py <Pretendard 정적 OTF 폴더>
#   폴더에는 Pretendard-Regular.otf · Pretendard-SemiBold.otf 가 있어야 한다 (npm pack pretendard@1.3.9 → package/dist/public/static).
# 넣는 글자 = 지금 부분 집합에 있던 글자 + src/*.js · src/*.css 에 나오는 글자 가운데 원본 글꼴에 있는 것 (한글 음절 · 낱자 · 기호).
# 이름표는 지금 파일의 것을 그대로 옮긴다 (OFL 의 예약 이름 때문에 「TB Sans」). 끝나면 python3 tools/fontcheck.py 로 확인.
import glob, os, sys
from fontTools.ttLib import TTFont
from fontTools import subset

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
if len(sys.argv) < 2:
    print(__doc__ or 'usage: python3 tools/fontsub.py <Pretendard static OTF dir>'); sys.exit(2)
src_dir = sys.argv[1]
JOBS = [('TBBodyB-Regular', 'Pretendard-Regular.otf'), ('TBBodyB-SemiBold', 'Pretendard-SemiBold.otf'), ('TBTitleB-SemiBold', 'Pretendard-SemiBold.otf')]

used = set()
for f in glob.glob(os.path.join(root, 'src', '*.js')) + glob.glob(os.path.join(root, 'src', '*.css')):
    used |= {ord(c) for c in open(f, encoding='utf8').read() if ord(c) > 0x20}

for out_name, src_name in JOBS:
    out_path = os.path.join(root, 'fonts', out_name + '.woff2')
    old = TTFont(out_path)
    full_path = os.path.join(src_dir, src_name)
    full = TTFont(full_path)
    fc = full.getBestCmap()
    keep = set(old.getBestCmap().keys()) | {u for u in used if u in fc}
    opt = subset.Options()
    opt.layout_features = ['*']
    opt.name_IDs = ['*']
    opt.name_languages = ['*']
    opt.notdef_outline = True
    opt.glyph_names = False
    opt.flavor = 'woff2'
    f = TTFont(full_path)
    s = subset.Subsetter(opt)
    s.populate(unicodes=sorted(keep))
    s.subset(f)
    f['name'] = old['name']          # 「TB Sans」 이름표 그대로
    if 'CFF ' in f and 'CFF ' in old:
        try:
            oc, nc = old['CFF '].cff, f['CFF '].cff
            nc.fontNames = list(oc.fontNames)
            for k in ('FullName', 'FamilyName'):
                if hasattr(oc.topDictIndex[0], k): setattr(nc.topDictIndex[0], k, getattr(oc.topDictIndex[0], k))
        except Exception as e:
            print('  (CFF 이름은 그대로 둔다:', e, ')')
    f.flavor = 'woff2'
    f.save(out_path)
    n = TTFont(out_path).getBestCmap()
    print('%s: %d → %d 글자 (한글 음절 %d)' % (out_name, len(old.getBestCmap()), len(n), sum(1 for k in n if 0xAC00 <= k <= 0xD7A3)))
