#!/bin/bash

# 빌런 참교육 - 서버 시작 스크립트

# 프로젝트 디렉토리로 이동
cd "$(dirname "$0")" || exit 1

# 포트 확인
PORT=8000

# 이미 실행 중인 서버가 있는지 확인
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  포트 $PORT에서 이미 서버가 실행 중입니다."
    echo "서버를 종료하려면 ./stop-server.sh 를 실행하세요."
    exit 1
fi

# Python 서버 시작
echo "🚀 서버를 시작합니다..."
echo "📡 http://localhost:$PORT"
echo "🛑 종료하려면 Ctrl+C 또는 ./stop-server.sh 를 실행하세요."
echo ""

python3 -m http.server $PORT
