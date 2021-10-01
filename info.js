document.addEventListener("click", (e) => {
  function getCurrentWindow() {
    return chrome.windows.getCurrent();
  }

  if (e.target.id === "window-create-help-panel") {
    let createData = {
      type: "panel",
      incognito: true,
    };
    let creating = browser.windows.create(createData);
    creating.then(() => {
      console.log("The help panel has been created");
    });
  } else if (e.target.id === "window-create-news-panel") {
    let createData = {
      type: "panel",
      incognito: true,
    };
    let creating = browser.windows.create(createData);
    creating.then(() => {
      console.log("The news panel has been created");
    });
  } else if (e.target.id === "window-preface-title") {
    getCurrentWindow().then((currentWindow) => {
      let updateInfo = {
        titlePreface: "Onion Help | ",
      };
      chrome.windows.update(currentWindow.id, updateInfo);
    });
  } else if (e.target.id === "clear-browser-data") {
    forgetBrowsingData();
  } else if (e.target.id === "check-onion-control") {
    echo("Onion Router Detected", "panel-section-onioncontrol-check");
  } else if (e.target.id === "enable-web-rtc") {
    if (e.target.checked) {
      browser.runtime.sendMessage({ rtc: "enableWebRTC" });
    } else {
      browser.runtime.sendMessage({ rtc: "disableWebRTC" });
    }
    return;
  }

  e.preventDefault();
});
