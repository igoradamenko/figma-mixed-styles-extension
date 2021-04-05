log('Inited');

chrome.runtime.onMessage.addListener((message, sender) => {
  if (sender.tab) {
    log('Got message, but not from the popup');
    return;
  }

  log(`Got message ${message.type} from the popup`);

  runBridge(message);

  log('Sent request to bridge');
});

function runBridge(message) {
  const SCRIPT_ID = 'figma-mixed-styles-extension-request';

  let script = document.getElementById(SCRIPT_ID)

  if (script) {
    script.remove();
  }

  script = document.createElement('script');
  script.src = chrome.runtime.getURL('figma-bridge.js');
  script.id = SCRIPT_ID;
  script.dataset.type = message.type;

  script.addEventListener('figma-mixed-styles-event', e => {
    chrome.runtime.sendMessage(e.detail);
    log(`Resent message ${e.detail.type} from bridge to popup`);
  });

  document.body.appendChild(script);
}

function log(...rest) {
  console.log('[FIGMA MIXED STYLES: BG]', ...rest);
}
