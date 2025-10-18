#!/bin/bash

# 한글 맞춤법 교정 Python 서버 시작 스크립트 (uv 사용)

echo "🔍 포트 3000 확인 중..."

# 포트 3000이 사용 중인지 확인
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  포트 3000이 이미 사용 중입니다."
    echo "🛑 기존 프로세스 종료 중..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    sleep 1
    echo "✅ 기존 프로세스 종료 완료"
fi

echo ""
echo "📦 uv 확인 중..."

# 현재 디렉토리로 이동
cd "$(dirname "$0")"

# uv가 설치되어 있는지 확인
if ! command -v uv &> /dev/null; then
    echo "❌ uv가 설치되어 있지 않습니다."
    echo "설치 방법: curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

echo "✅ uv 설치됨"

# 가상환경이 없으면 생성
if [ ! -d ".venv" ]; then
    echo "🔨 uv로 가상환경 생성 중..."
    uv venv
    echo "✅ 가상환경 생성 완료"
fi

# 필요한 패키지 설치
echo "📚 uv로 패키지 설치 중..."
uv pip install -r requirements.txt

echo ""
echo "🚀 서버 시작 중..."
echo ""

# Python 서버 실행 (uv run 사용)
uv run python_server.py

