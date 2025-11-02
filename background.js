console.log("Background is running");

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: "popup.html" });
});

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type !== "FOCUS_POPUP") return;

  chrome.tabs.update(msg.tabId, { active: true });

});
