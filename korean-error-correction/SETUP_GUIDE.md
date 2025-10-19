# 한글 맞춤법 검사기 설치 가이드 (v6.3.0)

## 📋 목차
1. [빠른 설치 (5분 완성)](#빠른-설치-5분-완성)
2. [상세 설치 가이드](#상세-설치-가이드)
3. [초기 설정](#초기-설정)
4. [문제 해결](#문제-해결)

---

## ⚡ 빠른 설치 (5분 완성)

### 1단계: 다운로드
```bash
# Git으로 클론
git clone https://github.com/sehyunsix/korean-error-correction-extension.git
cd korean-error-correction-extension

# 또는 ZIP 다운로드
# https://github.com/sehyunsix/korean-error-correction-extension
# → Code → Download ZIP → 압축 해제
```

### 2단계: Chrome에 설치
1. Chrome에서 `chrome://extensions/` 접속
2. 우측 상단 **"개발자 모드"** 토글 ON
3. **"압축해제된 확장 프로그램을 로드합니다"** 클릭
4. 다운로드한 폴더의 **`korean-error-correction`** 폴더 선택

### 3단계: 즉시 사용!
1. 아무 웹페이지에서 한글 텍스트 드래그
2. **"맞춤법 검사"** 버튼 클릭
3. 끝! 🎉

> 💡 **API Key 없이도 바로 사용 가능합니다!**

---

## 📖 상세 설치 가이드

### 사전 요구사항
- **Chrome 브라우저** (최신 버전 권장)
- Git (선택사항 - ZIP 다운로드 가능)
- **Gemini API Key** (선택사항 - 더 나은 품질을 원할 경우)

### Step 1: 소스 코드 다운로드

#### 방법 A: Git Clone (권장)
```bash
git clone https://github.com/sehyunsix/korean-error-correction-extension.git
cd korean-error-correction-extension
```

#### 방법 B: ZIP 다운로드
1. https://github.com/sehyunsix/korean-error-correction-extension 접속
2. 녹색 **"Code"** 버튼 클릭
3. **"Download ZIP"** 선택
4. 다운로드한 ZIP 파일 압축 해제

### Step 2: Chrome 확장 프로그램 등록

1. **Chrome 확장 프로그램 페이지 열기**
   - 주소창에 `chrome://extensions/` 입력 후 Enter
   - 또는 메뉴 → 도구 더보기 → 확장 프로그램

2. **개발자 모드 활성화**
   - 우측 상단 "개발자 모드" 토글 클릭 (파란색으로 변경)

3. **확장 프로그램 로드**
   - 좌측 상단 **"압축해제된 확장 프로그램을 로드합니다"** 버튼 클릭
   - 다운로드한 폴더 내의 **`korean-error-correction`** 폴더 선택
   - (주의: 상위 폴더가 아닌 내부의 `korean-error-correction` 폴더)

4. **설치 확인**
   - 확장 프로그램 목록에 "한글 맞춤법 검사기" 표시
   - Chrome 우측 상단에 확장 프로그램 아이콘 표시
   - 버전: v6.3.0

### Step 3: 권한 확인
확장 프로그램이 다음 권한을 요청합니다:
- ✅ **activeTab**: 현재 탭의 텍스트 읽기/쓰기
- ✅ **storage**: 설정 및 API Key 저장
- ✅ **contextMenus**: 우클릭 메뉴 추가

> 모든 권한은 맞춤법 검사 기능에 필요합니다.

---

## ⚙️ 초기 설정

### 필수 설정 (없음!)
기본 설정으로 바로 사용 가능합니다. 추가 설정은 모두 선택사항입니다.

### 선택 설정 1: 단축키 변경

1. 확장 프로그램 아이콘 클릭
2. **"⌨️ 단축키 설정"** 섹션 찾기
3. 입력 필드 클릭
4. 원하는 키 조합 입력 (예: `F1`, `Cmd+K`, `Shift+Q`)
5. **저장** 버튼 클릭

**권장 단축키:**
- `F1` - 다른 프로그램과 충돌 없음
- `Cmd+E` (Mac) / `Ctrl+E` (Windows) - 기본값
- `Cmd+Shift+K` - Grammarly 스타일

### 선택 설정 2: Gemini API 설정 (더 나은 품질)

#### API Key 발급
1. [Google AI Studio](https://aistudio.google.com/app/apikey) 접속
2. Google 계정으로 로그인
3. **"Create API Key"** 클릭
4. 생성된 API Key 복사

#### 확장 프로그램 설정
1. 확장 프로그램 아이콘 클릭
2. **"🤖 AI 엔진 설정"** 섹션 찾기
3. API Key 입력 후 **"저장"** 클릭
4. 🔄 버튼 클릭하여 **30개 이상의 모델 목록** 로드
5. 드롭다운에서 원하는 모델 선택:
   - **빠른 응답**: `gemini-2.0-flash-exp`, `gemini-flash-latest`
   - **고품질**: `gemini-2.5-pro-preview`, `gemini-pro-latest`
   - **실험적**: Image Generation, TTS 모델
   - **경량**: Gemma 3 시리즈 (1B, 4B 등)

#### API Key 없이 사용하기
- API Key 없이도 기본 맞춤법 검사 사용 가능
- Gemini API를 설정하면 더욱 정확한 검사 가능

---

## 🚀 사용 방법

### 방법 1: 플로팅 버튼 (권장! 🆕)
1. 웹페이지에서 한글 텍스트 드래그
2. 마우스 커서 근처에 **"맞춤법 검사"** 버튼 자동 등장
3. 버튼 클릭 → 즉시 검사 시작!

### 방법 2: 단축키
1. 텍스트 선택
2. 설정한 단축키 입력 (기본: `Cmd+E` / `Ctrl+E`)
3. 검사 시작

### 방법 3: 우클릭 메뉴
1. 텍스트 선택
2. 우클릭 → **"맞춤법 검사"**
3. 검사 시작

### 교정 결과 사용하기
1. **2단 레이아웃**에서 원문 vs 교정 결과 비교
2. 각 수정 항목에서 **✓ 적용** 또는 **✕ 거절** 선택
3. **이전/다음** 버튼으로 수정 사항 순회
4. **전체 적용** 또는 **전체 거절** 한 번에 처리
5. **수정하기**: 승인된 수정만 원문에 적용
6. **복사하기**: 최종 텍스트 클립보드 복사

---

## 🐛 문제 해결

### 플로팅 버튼이 나타나지 않아요

**원인:**
- 한글이 포함되지 않은 텍스트
- 너무 짧은 텍스트 (2자 미만)
- Chrome 내부 페이지 (chrome://, chrome-extension://)

**해결:**
1. 한글이 포함된 텍스트(2자 이상) 선택
2. 웹페이지 새로고침 (F5)
3. 확장 프로그램 재시작:
   - `chrome://extensions/`
   - "한글 맞춤법 검사기" 끄기 → 켜기

### 단축키가 작동하지 않아요

**원인:**
- 다른 확장 프로그램이나 브라우저와 충돌
- Chrome 내부 페이지에서 사용 시도

**해결:**
1. 확장 프로그램 아이콘 → **"⌨️ 단축키 설정"**
2. 다른 키로 변경 (권장: `F1`, `F2`)
3. 웹페이지 새로고침 (F5)
4. Chrome 내부 페이지가 아닌지 확인

### 수정 사항이 적용되지 않아요

**원인:**
- 수정 항목이 거절 상태
- contenteditable 요소에서 작동 제한

**해결:**
1. 수정 항목의 **✓ 적용** 버튼이 초록색인지 확인
2. **수정하기** 버튼 클릭 확인
3. contenteditable 요소(블로그 에디터 등)에서는:
   - **복사하기** 버튼 사용 권장
   - 복사 후 직접 붙여넣기

### Gemini API 오류 (404, 403)

**원인:**
- API Key가 유효하지 않음
- 선택한 모델을 사용할 수 없음
- API 할당량 초과

**해결:**
1. API Key가 올바른지 확인
2. 🔄 버튼으로 모델 목록 새로고침
3. 다른 모델 선택:
   - 권장: `gemini-flash-latest`
   - 또는: `gemini-2.0-flash-exp`
4. [Google AI Studio](https://aistudio.google.com/)에서 할당량 확인

### 확장 프로그램이 로드되지 않아요

**원인:**
- 잘못된 폴더 선택
- manifest.json 파일 누락
- 권한 문제

**해결:**
1. 올바른 폴더 선택:
   - ❌ `korean-error-correction-extension` (상위 폴더)
   - ✅ `korean-error-correction-extension/korean-error-correction` (내부 폴더)
2. 폴더에 `manifest.json` 파일이 있는지 확인
3. 폴더 권한 확인 (읽기 가능)

---

## 🔧 고급 설정

### 개발자 콘솔 확인
1. 웹페이지에서 F12 (개발자 도구)
2. **Console** 탭 클릭
3. 확장 프로그램 로그 확인:
   - `🎉 한글 맞춤법 검사기 Content Script 로드 완료!`
   - `⌨️ 단축키 설정 로드: ...`

### 확장 프로그램 업데이트
```bash
cd korean-error-correction-extension
git pull origin main
```
또는 ZIP을 다시 다운로드 후 재설치

### 확장 프로그램 제거
1. `chrome://extensions/` 접속
2. "한글 맞춤법 검사기" 찾기
3. **"삭제"** 버튼 클릭
4. 저장된 설정도 삭제하려면:
   - Chrome 설정 → 개인정보 보호 및 보안
   - 인터넷 사용 기록 삭제
   - 쿠키 및 기타 사이트 데이터 삭제

---

## 📝 추가 정보

### 버전 확인
- 확장 프로그램 목록에서 버전 확인
- 현재 최신 버전: **v6.3.0**

### 지원하는 웹사이트
- ✅ 모든 웹페이지 (Google Docs, 블로그 등)
- ✅ Textarea, Input 필드
- ✅ ContentEditable 요소
- ❌ Chrome 내부 페이지 (chrome://)
- ❌ Chrome 웹 스토어 페이지

### 관련 문서
- [README.md](../../README.md) - 전체 기능 소개
- [API_ERROR_GUIDE.md](./API_ERROR_GUIDE.md) - API 오류 해결
- [LOG_GUIDE.md](./LOG_GUIDE.md) - 로그 해석 가이드

### 문의 및 버그 리포트
- GitHub Issues: https://github.com/sehyunsix/korean-error-correction-extension/issues

---

**Made with ❤️ for Korean writers**
