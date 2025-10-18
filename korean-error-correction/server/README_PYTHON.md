# 한글 맞춤법 교정 Python 서버 (ET5 모델)

ET5-typos-corrector 모델을 사용한 한국어 구어체 전용 맞춤법 교정 서버입니다.

## 모델 정보

- **모델**: [j5ng/et5-typos-corrector](https://huggingface.co/j5ng/et5-typos-corrector)
- **기반**: ETRI-ET5 모델
- **데이터셋**: 모두의 말뭉치 맞춤법 교정 데이터 (318,882 쌍)
- **특징**: 한국어 구어체 전용 맞춤법 교정

## 설치 방법

### 1. Python 환경 준비

Python 3.8 이상이 필요합니다.

```bash
# Python 버전 확인
python3 --version
```

### 2. 의존성 설치

```bash
cd server

# 가상환경 생성 (선택사항이지만 권장)
python3 -m venv venv
source venv/bin/activate  # Mac/Linux
# venv\Scripts\activate  # Windows

# 패키지 설치
pip install -r requirements.txt
```

### 3. 서버 실행

#### 방법 1: 스크립트 실행 (권장)

```bash
./start-python-server.sh
```

#### 방법 2: 직접 실행

```bash
python3 python_server.py
```

## 처음 실행 시 주의사항

⚠️ **첫 실행 시 모델 다운로드**

서버를 처음 실행하면 Hugging Face에서 ET5 모델을 자동으로 다운로드합니다.
- 모델 크기: 약 1GB
- 다운로드 시간: 인터넷 속도에 따라 5-10분 소요
- 저장 위치: `~/.cache/huggingface/`

## API 사용법

### 맞춤법 검사

```bash
curl -X POST http://localhost:3000/api/check \
  -H "Content-Type: application/json" \
  -d '{"text":"아늬 진짜 무ㅓ하냐고"}'
```

응답:
```json
{
  "success": true,
  "original_text": "아늬 진짜 무ㅓ하냐고",
  "corrected_text": "아니 진짜 뭐 하냐고.",
  "errors": [...],
  "duration": 250
}
```

### 헬스 체크

```bash
curl http://localhost:3000/health
```

## 시스템 요구사항

### 최소 사양
- CPU: 2코어 이상
- RAM: 4GB 이상
- 디스크: 2GB 여유 공간

### 권장 사양 (GPU 사용)
- GPU: NVIDIA GPU (CUDA 지원)
- VRAM: 2GB 이상
- CUDA 11.0 이상

### Mac M1/M2
- MPS 지원 (PyTorch 1.12+)
- 코드에서 device 설정 변경:
  ```python
  device = "mps:0" if torch.backends.mps.is_available() else "cpu"
  ```

## 성능

- **평균 응답 시간** (CPU): 200-500ms
- **평균 응답 시간** (GPU): 50-150ms
- **동시 처리**: 단일 요청 처리 (순차)

## 문제 해결

### 모델 다운로드 실패
```bash
# 수동으로 모델 다운로드
python3 -c "from transformers import T5ForConditionalGeneration, T5Tokenizer; T5ForConditionalGeneration.from_pretrained('j5ng/et5-typos-corrector'); T5Tokenizer.from_pretrained('j5ng/et5-typos-corrector')"
```

### 메모리 부족
- batch_size 줄이기
- max_length 줄이기 (512 → 256)
- num_beams 줄이기 (5 → 3)

### GPU 사용 안됨
```bash
# PyTorch CUDA 확인
python3 -c "import torch; print(torch.cuda.is_available())"
```

## 라이선스

- ET5 모델: Apache 2.0
- 서버 코드: MIT

## 참고 자료

- [ET5-typos-corrector 모델 페이지](https://huggingface.co/j5ng/et5-typos-corrector)
- [ETRI ET5](https://aiopen.etri.re.kr/et5Model)
- [모두의 말뭉치](https://corpus.korean.go.kr/)

