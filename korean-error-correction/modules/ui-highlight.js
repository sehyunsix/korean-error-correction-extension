/**
 * 한글 맞춤법 검사기 - UI 하이라이트 모듈
 * @file ui-highlight.js
 */

/**
 * 모든 하이라이트 제거
 */
function clearHighlights() {
  console.log('🧹 하이라이트 제거 중...');
  
  STATE.highlightedElements.forEach(element => {
    try {
      if (element && element.parentNode) {
        const parent = element.parentNode;
        const textNode = document.createTextNode(element.textContent);
        parent.replaceChild(textNode, element);
        parent.normalize();
      }
    } catch (error) {
      console.warn('하이라이트 제거 중 오류:', error);
    }
  });
  
  STATE.highlightedElements = [];
  console.log('✅ 하이라이트 제거 완료');
}

/**
 * 선택된 범위에 하이라이트 적용
 */
function highlightSelectedRange(range, errors, correctedText, hasErrors = true) {
  const selectedText = range.toString();

  if (!hasErrors) {
    // 오류 없음 - 초록색 표시
    const span = document.createElement('span');
    span.textContent = selectedText;
    span.style.cssText = `
      background-color: rgba(76, 175, 80, 0.3);
      border-bottom: 2px solid #4caf50;
      transition: all 0.3s ease;
    `;
    
    try {
      range.deleteContents();
      range.insertNode(span);
      STATE.highlightedElements.push(span);
      
      // 3초 후 페이드아웃
      setTimeout(() => {
        span.style.opacity = '0';
        setTimeout(() => {
          if (span.parentNode) {
            const textNode = document.createTextNode(span.textContent);
            span.parentNode.replaceChild(textNode, span);
            const index = STATE.highlightedElements.indexOf(span);
            if (index > -1) {
              STATE.highlightedElements.splice(index, 1);
            }
          }
        }, 300);
      }, 3000);
      
      console.log('✅ 오류 없음 - 초록색 표시');
    } catch (error) {
      console.error('❌ 하이라이트 적용 실패:', error);
    }
    
    return;
  }

  // 오류가 있는 경우 - 오류 부분만 표시
  try {
    const fragment = range.extractContents();

    // 텍스트 노드들을 순회하면서 오류 토큰 찾기
    const walker = document.createTreeWalker(
      fragment,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    // 각 텍스트 노드에서 오류 토큰 하이라이트
    textNodes.forEach(textNode => {
      highlightErrorsInNode(textNode, errors);
    });

    // 수정된 fragment를 다시 삽입
    range.insertNode(fragment);

    // 선택 해제
    window.getSelection().removeAllRanges();

    console.log(`✅ ${errors.length}개의 오류 단어만 빨간색 표시 완료`);

  } catch (error) {
    console.error('❌ 오류 하이라이트 실패:', error);
    alert('하이라이트 적용에 실패했습니다. 다시 시도해주세요.');
  }
}

/**
 * 텍스트 노드에서 오류 하이라이트
 */
function highlightErrorsInNode(textNode, errors) {
  let text = textNode.textContent;
  let hasErrorInNode = false;

  // 이 텍스트 노드에 오류가 있는지 확인
  errors.forEach(error => {
    if (text.includes(error.token)) {
      hasErrorInNode = true;
    }
  });

  if (hasErrorInNode && textNode.parentNode) {
    const parent = textNode.parentNode;
    const parts = [];
    let lastIndex = 0;

    // 오류 토큰들을 찾아서 하이라이트
    errors.forEach(error => {
      const index = text.indexOf(error.token, lastIndex);
      if (index !== -1) {
        // 오류 앞의 정상 텍스트
        if (index > lastIndex) {
          parts.push({
            type: 'text',
            content: text.substring(lastIndex, index)
          });
        }

        // 오류 부분
        parts.push({
          type: 'error',
          content: error.token,
          suggestions: error.suggestions,
          info: error.info
        });

        lastIndex = index + error.token.length;
      }
    });

    // 남은 정상 텍스트
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex)
      });
    }

    // DOM 노드 생성
    parts.forEach(part => {
      if (part.type === 'text') {
        parent.insertBefore(document.createTextNode(part.content), textNode);
      } else {
        const errorSpan = createErrorSpan(part);
        parent.insertBefore(errorSpan, textNode);
        STATE.highlightedElements.push(errorSpan);
      }
    });

    // 원본 텍스트 노드 제거
    parent.removeChild(textNode);
  }
}

/**
 * 오류 span 요소 생성
 */
function createErrorSpan(part) {
  const errorSpan = document.createElement('span');
  errorSpan.className = 'korean-spell-error';
  errorSpan.textContent = part.content;
  errorSpan.style.cssText = `
    background-color: rgba(255, 0, 0, 0.3);
    border-bottom: 2px solid #f44336;
    cursor: help;
    position: relative;
  `;

  // 툴팁 생성
  const tooltip = createTooltip(part);
  errorSpan.appendChild(tooltip);

  // 마우스 이벤트
  errorSpan.addEventListener('mouseenter', () => {
    tooltip.style.display = 'block';
  });

  errorSpan.addEventListener('mouseleave', () => {
    tooltip.style.display = 'none';
  });

  return errorSpan;
}

/**
 * 툴팁 요소 생성 (Grammarly 스타일 말풍선)
 */
function createTooltip(part) {
  const tooltip = document.createElement('div');
  tooltip.className = 'korean-spell-tooltip-card';
  tooltip.style.cssText = `
    position: fixed;
    left: 0;
    top: 0;
    background: white;
    padding: 0;
    border-radius: 12px;
    font-size: 13px;
    white-space: normal;
    width: 320px;
    z-index: 999999;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
    display: none;
    pointer-events: none;
    animation: tooltipFadeIn 0.2s ease;
  `;

  const suggestionText = part.suggestions && part.suggestions.length > 0
    ? part.suggestions.join(', ')
    : '제안 없음';

  const infoText = part.info || '맞춤법 오류';

  tooltip.innerHTML = `
    <div style="background: #fee2e2; padding: 14px 16px; border-radius: 12px 12px 0 0; border-bottom: 1px solid #fecaca;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
        <div style="width: 24px; height: 24px; background: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0;">⚠</div>
        <div style="font-weight: 700; color: #991b1b; font-size: 15px; flex: 1;">맞춤법 오류</div>
      </div>
      <div style="color: #7f1d1d; font-size: 14px; font-weight: 600; padding-left: 32px;">
        "${part.content}"
      </div>
    </div>
    <div style="padding: 16px; background: white; border-radius: 0 0 12px 12px;">
      <div style="margin-bottom: 12px;">
        <div style="color: #6b7280; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">추천 수정</div>
        <div style="color: #15C39A; font-size: 15px; font-weight: 700; padding: 8px 12px; background: #d1fae5; border-radius: 6px; border: 1px solid #a7f3d0;">
          ${suggestionText}
        </div>
      </div>
      <div style="color: #6b7280; font-size: 12px; line-height: 1.6; padding: 10px; background: #f9fafb; border-radius: 6px; border-left: 3px solid #15C39A;">
        ${infoText}
      </div>
    </div>
  `;

  // CSS 애니메이션 추가
  if (!document.getElementById('tooltip-animation-style')) {
    const style = document.createElement('style');
    style.id = 'tooltip-animation-style';
    style.textContent = `
      @keyframes tooltipFadeIn {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
  }

  return tooltip;
}

/**
 * 수정된 텍스트를 하이라이트와 함께 생성
 * @param {string} originalText - 원본 텍스트
 * @param {string} correctedText - 수정된 텍스트
 * @param {Array} errors - 오류 정보 배열
 * @returns {DocumentFragment} - 하이라이트가 적용된 텍스트 fragment
 */
function createCorrectedTextWithTooltip(originalText, correctedText, errors) {
  const fragment = document.createDocumentFragment();
  
  if (!errors || errors.length === 0) {
    // 오류가 없으면 일반 텍스트로 반환
    fragment.appendChild(document.createTextNode(correctedText));
    return fragment;
  }

  // 오류별로 원본 텍스트를 수정된 텍스트로 매핑
  const replacements = [];
  errors.forEach(error => {
    if (error.token && error.suggestions && error.suggestions.length > 0) {
      replacements.push({
        original: error.token,
        corrected: error.suggestions[0],
        info: error.info || '맞춤법 오류'
      });
    }
  });

  if (replacements.length === 0) {
    fragment.appendChild(document.createTextNode(correctedText));
    return fragment;
  }

  // 수정된 텍스트를 순회하면서 변경된 부분 찾기
  let remainingText = correctedText;
  let processedOriginal = originalText;
  
  replacements.forEach((replacement, index) => {
    const correctedIndex = remainingText.indexOf(replacement.corrected);
    const originalIndex = processedOriginal.indexOf(replacement.original);
    
    if (correctedIndex !== -1 && originalIndex !== -1) {
      // 수정 전의 일반 텍스트 추가
      if (correctedIndex > 0) {
        const beforeText = remainingText.substring(0, correctedIndex);
        fragment.appendChild(document.createTextNode(beforeText));
      }

      // 수정된 부분을 span으로 감싸기
      const correctedSpan = createCorrectedSpan(replacement);
      fragment.appendChild(correctedSpan);
      STATE.highlightedElements.push(correctedSpan);

      // 처리된 텍스트 제거
      remainingText = remainingText.substring(correctedIndex + replacement.corrected.length);
      processedOriginal = processedOriginal.substring(originalIndex + replacement.original.length);
    }
  });

  // 남은 텍스트 추가
  if (remainingText.length > 0) {
    fragment.appendChild(document.createTextNode(remainingText));
  }

  return fragment;
}

/**
 * 수정된 텍스트의 span 요소 생성
 */
function createCorrectedSpan(replacement) {
  const span = document.createElement('span');
  span.className = 'korean-spell-corrected';
  span.textContent = replacement.corrected;
  span.style.cssText = `
    background-color: rgba(76, 175, 80, 0.3);
    border-bottom: 2px solid #4caf50;
    cursor: help;
    position: relative;
    transition: background-color 0.2s;
  `;

  // hover 시 배경색 변경
  span.addEventListener('mouseenter', () => {
    span.style.backgroundColor = 'rgba(76, 175, 80, 0.5)';
  });
  span.addEventListener('mouseleave', () => {
    span.style.backgroundColor = 'rgba(76, 175, 80, 0.3)';
  });

  // 툴팁 생성
  const tooltip = createCorrectedTooltip(replacement);
  span.appendChild(tooltip);

  // 마우스 이벤트로 툴팁 표시/숨김
  span.addEventListener('mouseenter', () => {
    tooltip.style.display = 'block';
  });

  span.addEventListener('mouseleave', () => {
    tooltip.style.display = 'none';
  });

  return span;
}

/**
 * 수정된 텍스트용 툴팁 생성 (Grammarly 스타일 말풍선)
 */
function createCorrectedTooltip(replacement) {
  const tooltip = document.createElement('div');
  tooltip.className = 'korean-spell-corrected-tooltip-card';
  tooltip.style.cssText = `
    position: fixed;
    left: 0;
    top: 0;
    background: white;
    padding: 0;
    border-radius: 12px;
    font-size: 13px;
    white-space: normal;
    width: 320px;
    z-index: 999999;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
    display: none;
    pointer-events: none;
    animation: tooltipFadeIn 0.2s ease;
  `;

  tooltip.innerHTML = `
    <div style="background: #d1fae5; padding: 14px 16px; border-radius: 12px 12px 0 0; border-bottom: 1px solid #a7f3d0;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
        <div style="width: 24px; height: 24px; background: #15C39A; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0;">✓</div>
        <div style="font-weight: 700; color: #065f46; font-size: 15px; flex: 1;">교정 완료</div>
      </div>
      <div style="color: #064e3b; font-size: 14px; font-weight: 600; padding-left: 32px;">
        "${replacement.corrected}"
      </div>
    </div>
    <div style="padding: 16px; background: white; border-radius: 0 0 12px 12px;">
      <div style="margin-bottom: 12px;">
        <div style="color: #6b7280; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">원본 텍스트</div>
        <div style="color: #991b1b; font-size: 14px; font-weight: 600; padding: 8px 12px; background: #fee2e2; border-radius: 6px; border: 1px solid #fecaca; text-decoration: line-through; opacity: 0.8;">
          ${replacement.original}
        </div>
      </div>
      <div style="color: #6b7280; font-size: 12px; line-height: 1.6; padding: 10px; background: #f9fafb; border-radius: 6px; border-left: 3px solid #15C39A;">
        ${replacement.info}
      </div>
    </div>
  `;

  return tooltip;
}
