chrome.action.onClicked.addListener((tab) => {
  chrome.scripting
    .executeScript({ target: { tabId: tab.id }, files: ["Readability.js", "reader.js"] })
    .catch(() => {});
});

chrome.commands.onCommand.addListener(async (cmd, tab) => {
  if (cmd !== "dark" || !tab.url) return;
  const host = new URL(tab.url).hostname;
  const { dark = {} } = await chrome.storage.local.get("dark");
  if (dark[host]) delete dark[host];
  else dark[host] = 1;
  chrome.storage.local.set({ dark }); // dark.js in every tab of that site reacts via onChanged
});
