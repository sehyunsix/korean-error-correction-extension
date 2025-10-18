# 📤 업로드 가이드

## 포함해야 할 파일/폴더 ✅

### Chrome 확장 프로그램 핵심 파일
- ✅ `manifest.json`
- ✅ `popup.html`
- ✅ `popup.js`
- ✅ `content.js`
- ✅ `background.js`
- ✅ `styles.css`
- ✅ `icon16.png`, `icon48.png`, `icon128.png`

### 문서
- ✅ `README.md`
- ✅ `SETUP_GUIDE.md`
- ✅ `test.html`

### 서버 폴더 (중요!)
- ✅ `server/` 폴더 **포함**
  - ✅ `server/server.js`
  - ✅ `server/package.json`
  - ✅ `server/README.md`

### Git 설정
- ✅ `.gitignore`

---

## 제외해야 할 파일/폴더 ❌

- ❌ `node_modules/` - npm install로 자동 생성
- ❌ `server/node_modules/` - npm install로 자동 생성
- ❌ `.DS_Store` - macOS 시스템 파일
- ❌ `*.log` - 로그 파일

---

## 📦 업로드 전 체크리스트

### 1. `.gitignore` 확인
```bash
cat .gitignore
```
`node_modules`가 포함되어 있는지 확인

### 2. server 폴더 구조 확인
```bash
ls -la server/
```
다음 파일들이 있어야 함:
- `server.js`
- `package.json`
- `README.md`

### 3. node_modules 삭제 (이미 있다면)
```bash
rm -rf node_modules
rm -rf server/node_modules
```

### 4. 전체 파일 구조 확인
```bash
tree -I 'node_modules' -L 2
```

---

## 🚀 GitHub에 업로드하기

### 방법 1: 명령줄 사용

```bash
# 1. Git 초기화
git init

# 2. 모든 파일 추가 (.gitignore가 자동으로 node_modules 제외)
git add .

# 3. 커밋
git commit -m "Initial commit: 한글 맞춤법 검사기 Chrome 확장 프로그램"

# 4. GitHub 저장소 연결
git remote add origin https://github.com/사용자명/저장소명.git

# 5. 푸시
git branch -M main
git push -u origin main
```

### 방법 2: GitHub Desktop 사용

1. GitHub Desktop 열기
2. "Add Local Repository" 선택
3. 프로젝트 폴더 선택
4. Commit 메시지 작성
5. "Publish repository" 클릭

---

## 📋 최종 폴더 구조

```
korean-error-correction/
├── .gitignore                 ✅ 업로드
├── README.md                  ✅ 업로드
├── SETUP_GUIDE.md             ✅ 업로드
├── manifest.json              ✅ 업로드
├── popup.html                 ✅ 업로드
├── popup.js                   ✅ 업로드
├── content.js                 ✅ 업로드
├── background.js              ✅ 업로드
├── styles.css                 ✅ 업로드
├── test.html                  ✅ 업로드
├── icon16.png                 ✅ 업로드
├── icon48.png                 ✅ 업로드
├── icon128.png                ✅ 업로드
├── server/                    ✅ 업로드 (폴더 전체)
│   ├── server.js              ✅ 업로드
│   ├── package.json           ✅ 업로드
│   ├── README.md              ✅ 업로드
│   └── node_modules/          ❌ 제외 (.gitignore가 처리)
└── node_modules/              ❌ 제외 (.gitignore가 처리)
```

---

## 💡 사용자가 다운로드 후 해야 할 일

### Chrome 확장 프로그램만 사용하는 경우
1. 저장소 클론
2. Chrome에 바로 설치
3. 끝!

### 서버도 사용하는 경우
1. 저장소 클론
2. 서버 설치:
   ```bash
   cd server
   npm install
   npm start
   ```
3. `content.js`에서 `USE_API = true` 설정
4. Chrome 확장 프로그램 새로고침

---

## ⚠️ 주의사항

1. **server 폴더는 반드시 포함**
   - 사용자가 hanspell API를 사용하려면 필요
   - `package.json`이 있어야 `npm install` 가능

2. **node_modules는 절대 업로드하지 않기**
   - 용량이 크고 불필요
   - 사용자가 `npm install`로 설치

3. **아이콘 파일 포함**
   - Chrome 확장 프로그램에 필수

4. **README.md 업데이트**
   - 설치 방법 명확히 기재
   - 서버 설치는 선택사항임을 명시

---

## 🎯 README.md에 추가할 뱃지 (선택사항)

```markdown
![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue)
![Node.js](https://img.shields.io/badge/Node.js-v14+-green)
![License](https://img.shields.io/badge/License-MIT-yellow)
```

