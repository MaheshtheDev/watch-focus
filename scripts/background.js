chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.url && changeInfo.url.includes("watch")) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["scripts/content.js"],
    });
  }
});