/**
 * 한글 맞춤법 검사기 - 설정 모듈
 * @file config.js
 */

const CONFIG = {
  // Gemini API 설정
  GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent',
  
  // 맞춤법 검사 규칙 (폴백용)
  SPELLING_RULES: {
    '않됩니다': '안 됩니다',
    '않돼요': '안 돼요',
    '않되': '안 되',
    '않돼': '안 돼',
    '안돼': '안 돼',
    '안되': '안 되',
    '되요': '돼요',
    '대요': '돼요',
    '되가지고': '돼 가지고',
    '웬지': '왠지',
    '웬만하면': '왠만하면',
    '웬만큼': '왠만큼',
    '왠일': '웬일',
    '어떻해': '어떡해',
    '어떻케': '어떡해',
    '몇일': '며칠',
    '금새': '금세',
    '넒은': '넓은',
    '넒다': '넓다',
    '닫쳐': '닫혀',
    '담굼': '담금',
    '담습': '답습',
    '바램': '바람',
    '있따': '이따'
  },
  
  // 오타 패턴 (정규식)
  ERROR_PATTERNS: [
    { pattern: /않\s*돼/g, correct: '안 돼', description: '않돼 -> 안 돼' },
    { pattern: /않\s*되/g, correct: '안 되', description: '않되 -> 안 되' },
    { pattern: /되\s*요(?![가-힣])/g, correct: '돼요', description: '되요 -> 돼요' },
    { pattern: /웬지(?![가-힣])/g, correct: '왠지', description: '웬지 -> 왠지' },
    { pattern: /웬만하/g, correct: '왠만하', description: '웬만하 -> 왠만하' },
    { pattern: /왠일/g, correct: '웬일', description: '왠일 -> 웬일' },
    { pattern: /어떻[해케]/g, correct: '어떡해', description: '어떻해 -> 어떡해' },
    { pattern: /몇일/g, correct: '며칠', description: '몇일 -> 며칠' },
    { pattern: /금새/g, correct: '금세', description: '금새 -> 금세' },
    { pattern: /바램/g, correct: '바람', description: '바램 -> 바람' },
    { pattern: /넒/g, correct: '넓', description: '넒 -> 넓' },
    { pattern: /닫쳐/g, correct: '닫혀', description: '닫쳐 -> 닫혀' },
    { pattern: /담굼/g, correct: '담금', description: '담굼 -> 담금' },
    { pattern: /대요(?![가-힣])/g, correct: '돼요', description: '대요 -> 돼요' },
    { pattern: /되가지고/g, correct: '돼 가지고', description: '되가지고 -> 돼 가지고' },
    { pattern: /있따/g, correct: '이따', description: '있따 -> 이따' }
  ]
};

const STATE = {
  highlightedElements: [],
  autoCheckEnabled: true,
  lastCheckStats: {
    totalNodes: 0,
    checkedNodes: 0,
    foundErrors: 0
  },
  lastCheckMethod: 'rule-based'
};
