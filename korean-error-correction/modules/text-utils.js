/**
 * 한글 맞춤법 검사기 - 텍스트 유틸리티 모듈
 * @file text-utils.js
 */

/**
 * 한글이 포함되어 있는지 확인
 */
function containsKorean(text) {
  return /[가-힣]/.test(text);
}

/**
 * 한글 단어 개수 세기
 */
function countKoreanWords(node) {
  if (!node) return 0;
  
  const text = node.textContent || '';
  const koreanMatches = text.match(/[가-힣]+/g);
  return koreanMatches ? koreanMatches.length : 0;
}

/**
 * 텍스트 노드만 수집
 */
function collectTextNodes(node) {
  const textNodes = [];
  const walker = document.createTreeWalker(
    node,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        
        const tagName = parent.tagName.toLowerCase();
        if (['script', 'style', 'noscript', 'iframe'].includes(tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        
        const text = node.textContent.trim();
        if (!text || !containsKorean(text)) {
          return NodeFilter.FILTER_REJECT;
        }
        
        return NodeFilter.FILTER_ACCEPT;
      }
    },
    false
  );
  
  let currentNode;
  while (currentNode = walker.nextNode()) {
    textNodes.push(currentNode);
  }
  
  return textNodes;
}

/**
 * 텍스트에서 오류 찾기 (룰 베이스)
 */
function findErrorsWithRules(text, rules, patterns) {
  const errors = [];
  
  // 규칙 기반 검사
  Object.keys(rules).forEach(wrong => {
    if (text.includes(wrong)) {
      errors.push({
        token: wrong,
        suggestions: [rules[wrong]],
        type: 'rule',
        info: '규칙 기반 교정'
      });
    }
  });
  
  // 패턴 기반 검사
  patterns.forEach(({ pattern, correct, description }) => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        errors.push({
          token: match,
          suggestions: [correct],
          type: 'pattern',
          info: description
        });
      });
    }
  });
  
  return errors;
}
