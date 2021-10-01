var contextScrub = async function (requestDetails) {
  console.log("(scrub)Scrubbing info from contextualized request");
  try {
    var headerScrub = function (context) {
      if (!context) {
        console.error("Context not found");
      } else {
        if ((context.name = "onionbrowser")) {
          var ua = "MYOB/6.66 (AN/ON)";
          if (onionHost(requestDetails.url)) {
            for (var header of requestDetails.requestHeaders) {
              if (header.name.toLowerCase() === "user-agent") {
                header.value = ua;
                console.log("(scrub)User-Agent header modified", header.value);
              }
            }
          }
          return {
            requestHeaders: requestDetails.requestHeaders,
          };
        }
      }
    };
    var contextGet = async function (tabInfo) {
      try {
        console.log("(scrub)Tab info from Function", tabInfo);
        context = await browser.contextualIdentities.get(tabInfo.cookieStoreId);
        return context;
      } catch (error) {
        console.log("(scrub)Conext Error", error);
      }
    };
    var tabFind = async function (tabId) {
      try {
        context = await browser.contextualIdentities.query({
          name: "onionbrowser",
        });
        tabId.cookieStoreId = context[0].cookieStoreId;
        console.log("(scrub) forcing context", tabId.cookieStoreId);
        return tabId;
      } catch (error) {
        console.log("(scrub)Context Error", error);
      }
    };
    var tabGet = async function (tabId) {
      try {
        console.log("(scrub)Tab ID from Request", tabId);
        let tabInfo = await browser.tabs.get(tabId);
        return tabInfo;
      } catch (error) {
        console.log("(scrub)Tab error", error);
      }
    };
    if (requestDetails.tabId > 0) {
      if (onionHost(requestDetails.url)) {
        console.log("(Proxy)Onion URL detected, ");
        var tab = tabGet(requestDetails.tabId);
        var mtab = tab.then(tabFind);
        requestDetails.tabId = mtab;
        var context = mtab.then(contextGet);
        var req = await context.then(headerScrub);
        console.log("(scrub)Scrubbing Onion Request", req);
        return req;
      } else {
        var tab = tabGet(requestDetails.tabId);
        var context = tab.then(contextGet);
        var req = await context.then(headerScrub);
        console.log("(scrub)Scrubbing Onion Request", req);
        return req;
      }
    }
  } catch (error) {
    console.log("(scrub)Not scrubbing non-Onion request.", error);
  }
};

var contextSetup = async function (requestDetails) {
  console.log("(isolate)Forcing Onion requests into context");
  try {
    var tabFind = async function (tabId) {
      try {
        context = await browser.contextualIdentities.query({
          name: "onionbrowser",
        });
        if (tabId.cookieStoreId != context[0].cookieStoreId) {
          console.log(
            "(isolate) forcing",
            requestDetails.url,
            " context",
            tabId.cookieStoreId,
            context[0].cookieStoreId
          );
          function Create(window) {
            function onCreated(tab) {
              console.log("(isolate) Closing old, un-isolated tab");
              browser.tabs.remove(tabId.id);
            }
            function onError(error) {
              console.log(`Error: ${error}`);
            }
            created = browser.tabs.create({
              active: true,
              cookieStoreId: context[0].cookieStoreId,
              url: requestDetails.url,
              windowId: window.id,
            });
            created.then(onCreated, onError);
          }
          getting = browser.windows.getCurrent();
          getting.then(Create);
          return tabId;
        }
      } catch (error) {
        console.log("(isolate)Context Error", error);
      }
    };
    var routerTabFind = async function (tabId) {
      try {
        context = await browser.contextualIdentities.query({
          name: "routerconsole",
        });
        if (tabId.cookieStoreId != context[0].cookieStoreId) {
          console.log(
            "(isolate) forcing",
            requestDetails.url,
            " context",
            tabId.cookieStoreId,
            context[0].cookieStoreId
          );
          function Create(window) {
            function onCreated(tab) {
              console.log("(isolate) Closing old, un-isolated tab");
              browser.tabs.remove(tabId.id);
              browser.tabs.remove(window.tabs[0].id);
            }
            function onError(error) {
              console.log(`Error: ${error}`);
            }
            created = browser.tabs.create({
              active: true,
              cookieStoreId: context[0].cookieStoreId,
              url: requestDetails.url,
              windowId: window.id,
            });
            created.then(onCreated, onError);
          }
          getting = browser.windows.getCurrent();
          getting.then(Create);
          return tabId;
        }
      } catch (error) {
        console.log("(isolate)Context Error", error);
      }
    };
    var tabGet = async function (tabId) {
      try {
        console.log("(isolate)Tab ID from Request", tabId);
        let tabInfo = await browser.tabs.get(tabId);
        return tabInfo;
      } catch (error) {
        console.log("(isolate)Tab error", error);
      }
    };
    if (requestDetails.tabId > 0) {
      if (onionHost(requestDetails.url)) {
        var tab = tabGet(requestDetails.tabId);
        var mtab = tab.then(tabFind);
        return requestDetails;
      }
    }
  } catch (error) {
    console.log(
      "(isolate)Not an Onion request, no need to force into alternate cookiestore.",
      error
    );
  }
};

function onionHostName(url) {
  let hostname = "";
  if (url.indexOf("://") > -1) {
    hostname = url.split("/")[2];
  } else {
    hostname = url.split("/")[0];
  }
  return hostname;
}

function onionHost(url) {
  let hostname = onionHostName(url);
  return hostname.endsWith(".onion");
}

browser.webRequest.onBeforeRequest.addListener(
  contextSetup,
  { urls: ["<all_urls>"] },
  ["blocking"]
);

browser.webRequest.onBeforeSendHeaders.addListener(
  contextScrub,
  { urls: ["<all_urls>"] },
  ["blocking", "requestHeaders"]
);

var coolheadersSetup = function (e) {
  var asyncSetPageAction = new Promise((resolve, reject) => {
    window.setTimeout(() => {
      if (e.tabId != undefined) {
        popup = browser.pageAction.getPopup({ tabId: e.tabId });
        popup.then(gotPopup);
      }
      function gotPopup(p) {
        console.log("(scrub)(header check) checking popup", p);
        console.log(
          "(scrub)(header check) checking headers",
          e.responseHeaders
        );
        let headers = e.responseHeaders.filter((word) =>
          word.name.toUpperCase().includes("ONION")
        );
        console.log("(scrub)(header check) checking filtered headers", headers);
        for (i = headers.length - 1; i >= 0; i--) {
          let header = headers[i];
          console.log("(scrub)(header check) checking header", header);
          if (header.name.toUpperCase().endsWith("ONION-LOCATION")) {
            var tab = browser.tabs.get(e.tabId);
            tab.then(altSrc);
            function altSrc(tab) {
              console.log("(scrub) X-ONION-LOCATION", header.value);
              let url = new URL(header.value);
              browser.pageAction.setPopup({
                tabId: e.tabId,
                popup: "location.html",
              });
              browser.pageAction.setIcon({
                path: "icons/onion.png",
                tabId: e.tabId,
              });
              let eurl = new URL(tab.url);
              console.log("(scrub)(header check) formatted url", eurl);
              browser.pageAction.setTitle({
                tabId: e.tabId,
                title: "http://" + url.host + eurl.pathname,
              });
              browser.pageAction.show(e.tabId);
            }
            break;
          }
        }
      }
      resolve({ responseHeaders: e.responseHeaders });
    }, 2000);
  });
  return asyncSetPageAction;
};

function getTabURL(tab) {
  console.log("(scrub)(equiv check) popup check", tab);

  if (tab.id != undefined) {
    popup = browser.pageAction.getPopup({ tabId: tab.id });
    console.log("(scrub)(equiv check) popup check");
    popup.then(gotPopup);
  }
  function gotPopup(p) {
    if (p.length != 0) return;
    if (tab.url.startsWith("https")) {
      if (tab.url.includes(".onion")) {
        browser.pageAction.setPopup({
          tabId: tab.id,
          popup: "security.html",
        });
        browser.pageAction.setIcon({
          path: "icons/onion.png",
          tabId: tab.id,
        });
        console.log(tab.url);
      } else {
        try {
          browser.tabs
            .sendMessage(tab.id, { req: "onion-location" })
            .then((response) => {
              if (response != undefined) {
                console.log(
                  "(scrub)(equiv check) onion-location response object",
                  response
                );
                if (response.content.toUpperCase() != "NO-ALT-LOCATION") {
                  browser.pageAction.setPopup({
                    tabId: tab.id,
                    popup: "location.html",
                  });
                  browser.pageAction.setIcon({
                    path: "icons/onion.png",
                    tabId: tab.id,
                  });
                  browser.pageAction.setTitle({
                    tabId: tab.id,
                    title: response.content,
                  });
                  browser.pageAction.show(tab.id);
                }
              }
            });
          console.log("(scrub)(equiv check)", tab.id, tab.url);
        } catch (e) {
          console.log("(scrub)(equiv check)", e);
        }
      }
    }
  }
}

function getClearTab(tobj) {
  function setupTabs(tobj) {
    if (typeof tobj == "number") {
      browser.tabs.get(tobj).then(getTabURL, onError);
    }
    if (typeof tobj.tabId == "number") {
      console.log("(scrub) tobj", tobj);
      browser.tabs.get(tobj.tabId).then(getTabURL, onError);
    } else {
      for (let tab in tobj.tabIds) {
        console.log("(scrub) tab", tobj.tabIds[tab]);
        browser.tabs.get(tobj.tabIds[tab]).then(getTabURL, onError);
      }
    }
  }
  if (tobj != undefined) {
    setupTabs(tobj);
  } else {
    browser.tabs.query({}).then(setupTabs);
  }
}

// Listen for onHeaderReceived for the target page.
// Set "blocking" and "responseHeaders".
browser.webRequest.onHeadersReceived.addListener(
  coolheadersSetup,
  { urls: ["*://*.onion/*", "https://*/*"] },
  ["responseHeaders"]
);

browser.tabs.onActivated.addListener(getClearTab);
browser.tabs.onAttached.addListener(getClearTab);
browser.tabs.onCreated.addListener(getClearTab);
browser.tabs.onDetached.addListener(getClearTab);
browser.tabs.onHighlighted.addListener(getClearTab);
browser.tabs.onMoved.addListener(getClearTab);
browser.tabs.onReplaced.addListener(getClearTab);

browser.pageAction.onClicked.addListener(getClearTab);

function reloadTabs(tabs) {
  for (let tab of tabs) {
    browser.tabs.reload(tab.id);
  }
}

function reloadError(error) {
  console.log(`Error: ${error}`);
}

let querying = browser.tabs.query({});
querying.then(reloadTabs, onError);

// Listen for onHeaderReceived for the target page.
// Set "blocking" and "responseHeaders".
browser.webRequest.onHeadersReceived.addListener(
  coolheadersSetup,
  { urls: ["*://*.onion/*", "https://*/*"] },
  ["responseHeaders"]
);

browser.webNavigation.onDOMContentLoaded.addListener(getClearTab, filter);
browser.webNavigation.onDOMContentLoaded.addListener(
  logOnDOMContentLoaded,
  filter
);
