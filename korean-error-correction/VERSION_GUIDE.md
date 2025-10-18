# 📝 버전 관리 가이드

## 현재 버전: 1.1.1

## 버전 넘버링 규칙 (Semantic Versioning)

```
MAJOR.MINOR.PATCH
  1  .  1  .  0
```

### 버전 업데이트 기준:

- **MAJOR (1.x.x)**: 호환되지 않는 대규모 변경
  - 예: API 구조 변경, 주요 기능 재설계

- **MINOR (x.1.x)**: 새로운 기능 추가 (하위 호환)
  - 예: 새로운 검사 방식 추가, API 상태 표시 추가

- **PATCH (x.x.1)**: 버그 수정, 작은 개선
  - 예: 오타 수정, 성능 개선, 버그 픽스

---

## 📋 버전 히스토리

### v1.1.1 (2025-10-18)
**버그 수정:**
- 🐛 CSP(Content Security Policy) 오류 수정
- 🔧 `AbortSignal.timeout()` → `AbortController` + `setTimeout`로 변경
- 🔒 안전한 타임아웃 구현으로 보안 강화

### v1.1.0 (2025-10-18)
**새로운 기능:**
- ✨ 팝업에 API 상태 실시간 표시
- ✨ 검사 방식 정보 표시 (API/룰 베이스)
- ✨ 서버 온라인/오프라인 상태 표시
- ✨ 팝업에 버전 정보 자동 표시
- 🐛 Extension context invalidated 오류 수정
- 🐛 API 오류 하이라이트 문제 수정

### v1.0.0 (2025-10-18)
**초기 출시:**
- ✅ 기본 맞춤법 검사 (룰 베이스)
- ✅ hanspell API 통합
- ✅ 실시간 타이핑 검사
- ✅ 자동 검사 토글
- ✅ 클릭하여 수정
- ✅ 오타를 빨간색으로 하이라이트

---

## 🔄 버전 업데이트 방법

### 1. manifest.json 수정

```json
{
  "version": "1.1.0",
  "version_name": "1.1.0 - 설명"
}
```

### 2. popup.html의 초기값 수정 (선택사항)

```html
<span id="versionInfo" style="font-size: 11px; color: #999;">v1.1.0</span>
```

**참고:** `popup.js`가 자동으로 manifest에서 버전을 읽어서 표시하므로, HTML의 초기값은 폴백용입니다.

### 3. VERSION_GUIDE.md 업데이트

이 파일에 새 버전 정보를 추가합니다.

### 4. Git 커밋

```bash
git add .
git commit -m "chore: bump version to 1.1.0"
git tag v1.1.0
git push origin main --tags
```

---

## 💡 버전 업데이트 시나리오

### 시나리오 1: 버그 수정
**현재:** 1.1.0 → **다음:** 1.1.1

```json
{
  "version": "1.1.1",
  "version_name": "1.1.1 - 하이라이트 버그 수정"
}
```

**변경 사항 예:**
- 🐛 특정 웹사이트에서 하이라이트 안 되는 문제 수정
- 🐛 팝업 레이아웃 깨지는 문제 수정

### 시나리오 2: 새 기능 추가
**현재:** 1.1.0 → **다음:** 1.2.0

```json
{
  "version": "1.2.0",
  "version_name": "1.2.0 - 커스텀 규칙 추가 기능"
}
```

**변경 사항 예:**
- ✨ 사용자 정의 맞춤법 규칙 추가 기능
- ✨ 통계 내보내기 기능

### 시나리오 3: 대규모 리팩토링
**현재:** 1.1.0 → **다음:** 2.0.0

```json
{
  "version": "2.0.0",
  "version_name": "2.0.0 - 아키텍처 개편"
}
```

**변경 사항 예:**
- 💥 API 응답 형식 변경
- 💥 설정 저장 구조 변경
- 💥 호환성 깨지는 변경

---

## 🎯 빠른 체크리스트

수정할 때마다 다음을 확인하세요:

```
□ manifest.json의 version 업데이트
□ manifest.json의 version_name 업데이트 (선택)
□ VERSION_GUIDE.md에 변경사항 기록
□ Chrome 확장 프로그램 새로고침하여 테스트
□ Git 커밋 및 태그
```

---

## 📌 참고 사항

1. **버전은 항상 올라가야 함**: 내림차순 불가
2. **Chrome Web Store**: 새 버전 업로드 시 이전 버전보다 높아야 함
3. **자동 업데이트**: 사용자는 Chrome이 자동으로 최신 버전으로 업데이트
4. **롤백**: 문제 발생 시 이전 버전을 다시 패키징하여 업로드 가능

---

## 🔗 유용한 링크

- [Semantic Versioning 2.0.0](https://semver.org/)
- [Chrome Extension Version](https://developer.chrome.com/docs/extensions/mv3/manifest/version/)

