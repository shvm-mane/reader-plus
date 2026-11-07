chrome.action.onClicked.addListener((tab) => {
  chrome.scripting
    .executeScript({ target: { tabId: tab.id }, files: ["Readability.js", "reader.js"] })
    .catch(() => {});
});
