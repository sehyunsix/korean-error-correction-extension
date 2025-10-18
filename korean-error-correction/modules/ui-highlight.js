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
