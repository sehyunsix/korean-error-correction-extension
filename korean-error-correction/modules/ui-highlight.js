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
 * 툴팁 요소 생성
 */
function createTooltip(part) {
  const tooltip = document.createElement('div');
  tooltip.style.cssText = `
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    background: #2c3e50;
    color: white;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 13px;
    white-space: normal;
    max-width: 280px;
    min-width: 150px;
    z-index: 99999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    display: none;
    pointer-events: none;
    line-height: 1.5;
  `;

  const suggestionText = part.suggestions && part.suggestions.length > 0
    ? part.suggestions.join(', ')
    : '제안 없음';

  const infoText = part.info || '맞춤법 오류';

  tooltip.innerHTML = `
    <div style="font-weight: bold; color: #ff6b6b; margin-bottom: 6px; font-size: 14px;">
      ❌ "${part.content}"
    </div>
    <div style="color: #fff; margin-bottom: 4px; font-size: 12px;">
      <strong>제안:</strong> ${suggestionText}
    </div>
    <div style="color: #bdc3c7; font-size: 11px; border-top: 1px solid #555; padding-top: 4px; margin-top: 4px;">
      ${infoText}
    </div>
  `;

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
 * 수정된 텍스트용 툴팁 생성
 */
function createCorrectedTooltip(replacement) {
  const tooltip = document.createElement('div');
  tooltip.style.cssText = `
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    background: #27ae60;
    color: white;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 13px;
    white-space: normal;
    max-width: 280px;
    min-width: 150px;
    z-index: 99999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    display: none;
    pointer-events: none;
    line-height: 1.5;
  `;

  tooltip.innerHTML = `
    <div style="font-weight: bold; color: #fff; margin-bottom: 6px; font-size: 14px;">
      ✅ "${replacement.corrected}"
    </div>
    <div style="color: #ecf0f1; margin-bottom: 4px; font-size: 12px;">
      <strong>원본:</strong> "${replacement.original}"
    </div>
    <div style="color: #d5f4e6; font-size: 11px; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 4px; margin-top: 4px;">
      ${replacement.info}
    </div>
  `;

  return tooltip;
}
