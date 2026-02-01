#!/bin/bash

# 빌런 참교육 - 서버 종료 스크립트

PORT=8000

# 포트에서 실행 중인 프로세스 찾기 및 종료
echo "🛑 포트 $PORT에서 서버를 종료합니다..."

if fuser -k ${PORT}/tcp 2>/dev/null ; then
    echo "✅ 서버가 종료되었습니다."
else
    echo "ℹ️  포트 $PORT에서 실행 중인 서버가 없습니다."
fi
