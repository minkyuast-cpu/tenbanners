#!/bin/bash
# 여러 판을 나란히: tools/botmany.sh "inf mag cle" "1 2 3 4" [병렬 수]   (환경 변수 CMDK 등은 그대로 넘어간다)
cd "$(dirname "$0")/.."
P=${3:-4}
for c in $1; do for sd in $2; do echo "$c $sd"; done; done | xargs -P $P -n 2 sh -c 'timeout 1200 node tools/bot.js $0 $1 2>&1 | grep "^BOT " | sed "s/^BOT //"'
