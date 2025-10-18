#!/bin/bash

# 한글 맞춤법 검사 서버 시작 스크립트

echo "🔍 포트 3000 확인 중..."

# 포트 3000이 사용 중인지 확인
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  포트 3000이 이미 사용 중입니다."
    echo "기존 프로세스를 종료하시겠습니까? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "🛑 기존 프로세스 종료 중..."
        lsof -ti:3000 | xargs kill -9 2>/dev/null
        sleep 1
        echo "✅ 기존 프로세스 종료 완료"
    else
        echo "❌ 서버 시작 취소"
        exit 1
    fi
fi

echo ""
echo "🚀 서버 시작 중..."
echo ""

# 서버 시작 (로그 출력)
cd "$(dirname "$0")"
node server.js


