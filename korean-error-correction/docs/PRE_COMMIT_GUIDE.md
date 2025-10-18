# Pre-Commit Hook 가이드

## 📌 개요
이 프로젝트는 Git pre-commit hook을 사용하여 JavaScript 파일의 문법을 자동으로 검사합니다.

## ✅ 설정 완료
`.git/hooks/pre-commit` 파일이 이미 설정되어 있습니다.

## 🔍 작동 방식

### Commit 시 자동 실행
```bash
git add .
git commit -m "커밋 메시지"
```

**실행 과정:**
1. Staged된 `.js` 파일 자동 감지
2. `node --check` 명령으로 각 파일의 syntax 검사
3. 오류 발견 시 commit 차단
4. 모든 파일 통과 시 commit 진행

### 성공 예시
```
🔍 Pre-commit: JavaScript 파일 문법 검사 중...
📝 검사 중: korean-error-correction/content.js
  ✅ OK
📝 검사 중: korean-error-correction/popup.js
  ✅ OK
📝 검사 중: korean-error-correction/background.js
  ✅ OK

✅✅✅ 모든 JavaScript 파일 문법 검사 통과! ✅✅✅
```

### 실패 예시
```
🔍 Pre-commit: JavaScript 파일 문법 검사 중...
📝 검사 중: korean-error-correction/popup.js
  ❌ SyntaxError: Identifier 'result' has already been declared
  ❌ Syntax 오류 발견!

❌❌❌ Commit 실패: JavaScript 파일에 syntax 오류가 있습니다! ❌❌❌
위의 오류를 수정한 후 다시 commit 해주세요.
```

## 🛠️ 수동 문법 검사

Commit 전에 수동으로 검사하고 싶다면:

```bash
# 특정 파일 검사
node --check korean-error-correction/content.js

# 모든 JavaScript 파일 검사
find korean-error-correction -name "*.js" -not -path "*/node_modules/*" -exec node --check {} \;
```

## 🚫 Pre-commit Hook 일시 비활성화

긴급한 경우 hook을 건너뛰려면:
```bash
git commit --no-verify -m "커밋 메시지"
```

⚠️ **주의**: 가급적 사용하지 마세요! Syntax 오류가 코드에 포함될 수 있습니다.

## 🔧 Hook 수정

Hook 파일 위치:
```
.git/hooks/pre-commit
```

수정 후 반드시 실행 권한 확인:
```bash
chmod +x .git/hooks/pre-commit
```

## 📋 검사 항목

현재 검사하는 항목:
- ✅ JavaScript 문법 오류 (SyntaxError)
- ✅ 변수 중복 선언
- ✅ 괄호/중괄호 매칭
- ✅ 잘못된 키워드 사용
- ✅ 기타 JavaScript 파싱 오류

## 💡 팁

1. **IDE/Editor Linting 사용**
   - VSCode, WebStorm 등의 실시간 linting 활용
   - 문제를 commit 전에 미리 발견 가능

2. **자주 Commit**
   - 작은 단위로 자주 commit하면 오류 발견이 쉬움
   - 문제 발생 시 디버깅도 간편

3. **Commit 전 테스트**
   - 브라우저에서 확장 프로그램 로드 테스트
   - Console에 오류 없는지 확인

## 🐛 문제 해결

### Hook이 실행되지 않는 경우
```bash
# 실행 권한 확인
ls -l .git/hooks/pre-commit

# 실행 권한 부여
chmod +x .git/hooks/pre-commit
```

### Node.js가 없는 경우
```bash
# Node.js 설치 확인
node --version

# 없으면 설치 필요
# macOS: brew install node
# Ubuntu: sudo apt install nodejs
```

## 📚 관련 문서
- [LOG_GUIDE.md](./LOG_GUIDE.md) - 로그 출력 가이드
- [DEBUG_SHORTCUT.md](./DEBUG_SHORTCUT.md) - 단축키 디버깅 가이드

