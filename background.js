//background.js of AHChromeExtenstion
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fetchReviews") {
    fetchReviews().then(sendResponse).catch(console.error);
    return true; // Keep the messaging channel open for async response
  } else if (message.action === "fetchComments") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "getComments" },
        sendResponse
      );
    });
    return true; // Keeps the message channel open for async responses
  }
});

async function fetchReviews(limit = 5) {
  const [activeTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  const [response] = await chrome.scripting.executeScript({
    target: { tabId: activeTab.id },
    func: () => {
      return Array.from(
        document.querySelectorAll('[data-hook="review-title"]')
      ).map((element) => element.textContent);
    },
  });

  return response.result.slice(0, limit);
}

///////////////////////
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fetchComments") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "getComments" },
        sendResponse
      );
    });
    return true; // Keeps the message channel open for async responses
  }
});
