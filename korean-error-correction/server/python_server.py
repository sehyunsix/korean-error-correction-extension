#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
한국어 맞춤법 교정 서버 (ET5 모델 사용)
ET5-typos-corrector 모델: https://huggingface.co/j5ng/et5-typos-corrector
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from transformers import T5ForConditionalGeneration, T5Tokenizer
from datetime import datetime
import logging

app = Flask(__name__)
CORS(app)  # Chrome 확장 프로그램에서 접근 가능하도록

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# 전역 변수
model = None
tokenizer = None
device = None

def load_model():
    """ET5 모델 로드"""
    global model, tokenizer, device
    
    logger.info("🔄 ET5 맞춤법 교정 모델 로딩 중...")
    
    try:
        # 디바이스 설정 (GPU 사용 가능하면 GPU, 아니면 CPU)
        device = "cuda:0" if torch.cuda.is_available() else "cpu"
        # Mac M1/M2의 경우: device = "mps:0" if torch.backends.mps.is_available() else "cpu"
        
        logger.info(f"📱 디바이스: {device}")
        
        # 모델과 토크나이저 로드
        model = T5ForConditionalGeneration.from_pretrained("j5ng/et5-typos-corrector")
        tokenizer = T5Tokenizer.from_pretrained("j5ng/et5-typos-corrector")
        
        # 모델을 디바이스로 이동
        model = model.to(device)
        model.eval()  # 평가 모드
        
        logger.info("✅ 모델 로딩 완료!")
        return True
        
    except Exception as e:
        logger.error(f"❌ 모델 로딩 실패: {str(e)}")
        return False

def correct_typos(text):
    """맞춤법 교정 함수"""
    if not model or not tokenizer:
        raise Exception("모델이 로드되지 않았습니다")
    
    # 입력 텍스트 전처리
    input_text = "맞춤법을 고쳐주세요: " + text
    
    # 입력 인코딩
    input_encoding = tokenizer(
        input_text,
        return_tensors="pt",
        max_length=512,
        truncation=True
    )
    
    input_ids = input_encoding.input_ids.to(device)
    attention_mask = input_encoding.attention_mask.to(device)
    
    # 모델 추론
    with torch.no_grad():
        output_encoding = model.generate(
            input_ids=input_ids,
            attention_mask=attention_mask,
            max_length=512,
            num_beams=5,
            early_stopping=True,
        )
    
    # 출력 디코딩
    output_text = tokenizer.decode(output_encoding[0], skip_special_tokens=True)
    
    return output_text

@app.route('/health', methods=['GET'])
def health_check():
    """헬스 체크"""
    logger.info("💚 Health check")
    return jsonify({
        'status': 'ok',
        'message': 'Korean Spell Checker Server (ET5) is running',
        'model': 'ET5-typos-corrector',
        'device': str(device),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/check', methods=['POST'])
def check_spelling():
    """맞춤법 검사 API"""
    logs = []
    
    def add_log(message, log_type='info'):
        timestamp = datetime.now().strftime('%H:%M:%S')
        logs.append({
            'timestamp': timestamp,
            'message': message,
            'type': log_type
        })
        logger.info(message)
    
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text or not isinstance(text, str):
            add_log('❌ 잘못된 요청: 텍스트 없음', 'error')
            return jsonify({
                'success': False,
                'message': '텍스트를 입력해주세요.',
                'logs': logs
            }), 400
        
        add_log('=== 맞춤법 교정 요청 ===', 'info')
        add_log(f'📝 텍스트 길이: {len(text)}자', 'info')
        add_log(f'📄 텍스트: "{text[:100]}{"..." if len(text) > 100 else ""}"', 'info')
        
        # 모델이 로드되지 않았으면 로드
        if model is None:
            add_log('🔄 모델 로딩...', 'info')
            if not load_model():
                add_log('❌ 모델 로딩 실패', 'error')
                return jsonify({
                    'success': False,
                    'message': '모델을 로드할 수 없습니다',
                    'logs': logs
                }), 500
        
        add_log('🔍 ET5 모델로 맞춤법 교정 중...', 'info')
        
        start_time = datetime.now()
        
        # 맞춤법 교정
        corrected_text = correct_typos(text)
        
        duration = (datetime.now() - start_time).total_seconds() * 1000
        
        add_log(f'⏱️ 교정 소요 시간: {duration:.0f}ms', 'info')
        
        # 원본과 교정본 비교
        if text == corrected_text:
            add_log('✨ 오류가 발견되지 않았습니다', 'success')
            errors = []
        else:
            add_log(f'✅ 교정 완료: "{corrected_text[:100]}{"..." if len(corrected_text) > 100 else ""}"', 'success')
            # 간단한 차이 감지 (단어 단위)
            original_words = text.split()
            corrected_words = corrected_text.split()
            
            errors = []
            for i, (orig, corr) in enumerate(zip(original_words, corrected_words)):
                if orig != corr:
                    errors.append({
                        'token': orig,
                        'suggestions': [corr],
                        'info': 'ET5 모델 교정',
                        'type': 'spell'
                    })
                    add_log(f'  ✓ "{orig}" → "{corr}"', 'warning')
        
        add_log('=== 응답 전송 ===', 'info')
        
        return jsonify({
            'success': True,
            'original_text': text,
            'corrected_text': corrected_text,
            'text': corrected_text,  # 호환성을 위해
            'errors': errors,
            'errorCount': len(errors),
            'duration': duration,
            'logs': logs
        })
        
    except Exception as e:
        add_log(f'❌ 오류 발생: {str(e)}', 'error')
        logger.exception("Error in check_spelling")
        return jsonify({
            'success': False,
            'message': str(e),
            'logs': logs
        }), 500

@app.before_request
def log_request():
    """요청 로깅"""
    logger.info(f"[{datetime.now().isoformat()}] {request.method} {request.path}")

if __name__ == '__main__':
    print('')
    print('╔════════════════════════════════════════════════╗')
    print('║   🚀 한글 맞춤법 교정 서버 시작 중...          ║')
    print('║   📦 ET5-typos-corrector 모델 사용             ║')
    print('╚════════════════════════════════════════════════╝')
    print('')
    
    # 서버 시작 전 모델 로드
    if not load_model():
        print('❌ 모델 로드 실패. 서버를 종료합니다.')
        exit(1)
    
    print('')
    print('╔════════════════════════════════════════════════╗')
    print('║   ✅ 서버 준비 완료!                           ║')
    print('╠════════════════════════════════════════════════╣')
    print('║   📍 URL: http://localhost:3000                ║')
    print('║   📝 API: POST /api/check                      ║')
    print('║   💚 Health: GET /health                       ║')
    print('╠════════════════════════════════════════════════╣')
    print('║   🛑 종료: Ctrl + C                            ║')
    print('╚════════════════════════════════════════════════╝')
    print('')
    
    # Flask 서버 실행
    app.run(host='0.0.0.0', port=3000, debug=False)

