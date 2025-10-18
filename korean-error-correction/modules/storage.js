/**
 * 한글 맞춤법 검사기 - Storage 관리 모듈
 * @file storage.js
 */

/**
 * Extension context 유효성 확인
 */
function isExtensionContextValid() {
  try {
    return chrome.runtime && chrome.runtime.id;
  } catch (e) {
    return false;
  }
}

/**
 * 안전하게 storage에서 값 가져오기
 */
async function safeGetStorage(key, defaultValue) {
  try {
    if (!isExtensionContextValid()) {
      console.log('Extension context invalid, using cached value');
      return defaultValue;
    }
    const storageResult = await chrome.storage.sync.get([key]);
    return storageResult[key] !== undefined ? storageResult[key] : defaultValue;
  } catch (error) {
    console.log('Storage access failed, using cached value:', error.message);
    return defaultValue;
  }
}

/**
 * Gemini API Key 가져오기
 */
async function getGeminiApiKey() {
  try {
    const result = await chrome.storage.sync.get(['geminiApiKey']);
    return result.geminiApiKey || null;
  } catch (error) {
    console.error('Failed to get Gemini API Key:', error);
    return null;
  }
}

/**
 * 선택된 Gemini 모델 가져오기
 */
async function getSelectedModel() {
  try {
    const result = await chrome.storage.sync.get(['geminiModel']);
    return result.geminiModel || null;
  } catch (error) {
    console.error('Failed to get selected model:', error);
    return null;
  }
}
