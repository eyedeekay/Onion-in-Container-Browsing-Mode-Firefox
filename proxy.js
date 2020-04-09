browser.privacy.network.peerConnectionEnabled.set({
  value: false
});
console.log("Preliminarily disabled WebRTC.");

chrome.privacy.network.networkPredictionEnabled.set({
  value: false
});
chrome.privacy.network.webRTCIPHandlingPolicy.set({
  value: "disable_non_proxied_udp"
});

function shouldProxyRequest(requestInfo) {
  return requestInfo.parentFrameId != -1;
}

var handleContextProxyRequest = async function(requestDetails) {
  console.log("(proxy)Searching for proxy by context");
  try {
    var handleProxyRequest = function(context) {
      proxy = {
        failoverTimeout: 0,
        type: "direct",
        proxyDns: false
      };
      if (context.name == "onionbrowser") {
        proxy = {
          type: getScheme(),
          host: getHost(),
          port: getPort(),
          proxyDns: true
        };
        console.log(
          "(proxy)Using",
          proxy.type,
          "proxy ",
          proxy.host + ":" + proxy.port
        );
        return proxy;
      }
      return proxy;
    };
    var contextGet = async function(tabInfo) {
      try {
        console.log("(proxy)Tab info from Function", tabInfo);
        context = await browser.contextualIdentities.get(tabInfo.cookieStoreId);
        return context;
      } catch (error) {
        console.log("(proxy)Context Error", error);
      }
    };
    var tabFind = async function(tabId) {
      try {
        context = await browser.contextualIdentities.query({
          name: "onionbrowser"
        });
        tabId.cookieStoreId = context[0].cookieStoreId;
        console.log("(proxy) forcing context", tabId.cookieStoreId);
        return tabId;
      } catch (error) {
        console.log("(proxy)Context Error", error);
      }
    };
    var tabGet = async function(tabId) {
      try {
        console.log("(proxy)Tab ID from Request", tabId);
        let tabInfo = await browser.tabs.get(tabId);
        return tabInfo;
      } catch (error) {
        console.log("(proxy)Tab error", error);
      }
    };

    if (requestDetails.tabId > 0) {
      if (onionHost(requestDetails.url)) {
        console.log("(Proxy)Onion URL detected, ");
        var tab = tabGet(requestDetails.tabId);
        var mtab = tab.then(tabFind);
        requestDetails.tabId = mtab;
        var context = mtab.then(contextGet);
        var proxy = await context.then(handleProxyRequest);
        console.log("(proxy)Returning Onion Proxy", proxy);
        return proxy;
      } else {
        var tab = tabGet(requestDetails.tabId);
        var context = tab.then(contextGet);
        var proxy = await context.then(handleProxyRequest);
        console.log("(proxy)Returning Onion Proxy", proxy);
        return proxy;
      }
    }
  } catch (error) {
    console.log("(proxy)Not using Onion Proxy.", error);
  }
};

var proxy_scheme = "socks";

function getScheme() {
  return "socks";
}

/*
var proxy_host = "127.0.0.1";
var proxy_port = "9050";
var control_host = "127.0.0.1";
var control_port = "9050";
*/

function getHost() {
  if (proxy_host == undefined) {
    proxy_host = "127.0.0.1";
  }
  return proxy_host;
}

function getPort() {
  if (proxy_port == undefined) {
    var scheme = getScheme();
    if (scheme == "socks") {
      proxy_port = "9050";
    } else {
      proxy_port = "9050";
    }
  }
  return proxy_port;
}

function getControlHost() {
  if (control_host == undefined) {
    return "127.0.0.1";
  }
  return control_host;
}

function getControlPort() {
  if (control_port == undefined) {
    return "9050";
  }
  return control_port;
}

function setupProxy() {
  var controlHost = getControlHost();
  var controlPort = getControlPort();
  var Host = getHost();
  var Port = getPort();
  var Scheme = getScheme();

  /**/
  console.log("Setting up Firefox WebExtension proxy");
  browser.proxy.onRequest.addListener(handleContextProxyRequest, {
    urls: ["<all_urls>"]
  });
  console.log("onion settings created for WebExtension Proxy");
  /**/
}

function checkStoredSettings(storedSettings) {
  let defaultSettings = {};
  if (!storedSettings.proxy_scheme) {
    defaultSettings["proxy_scheme"] = "socks";
  }
  if (!storedSettings.proxy_host) {
    defaultSettings["proxy_host"] = "127.0.0.1";
  }
  if (!storedSettings.proxy_port) {
    defaultSettings["proxy_port"] = 9050;
  }
  if (!storedSettings.control_host) {
    defaultSettings["control_host"] = "127.0.0.1";
  }
  if (!storedSettings.control_port) {
    defaultSettings["control_port"] = 9050;
  }
  chrome.storage.local.set(defaultSettings);
}

function update(restoredSettings) {
  proxy_scheme = restoredSettings.proxy_scheme;
  console.log("restoring proxy scheme:", proxy_scheme);
  proxy_host = restoredSettings.proxy_host;
  console.log("restoring proxy host:", proxy_host);
  proxy_port = restoredSettings.proxy_port;
  console.log("restoring proxy port:", proxy_port);
  control_host = restoredSettings.control_host;
  console.log("restoring control host:", control_host);
  control_port = restoredSettings.control_port;
  console.log("restoring control port:", control_port);
}

chrome.storage.local.get(function(got) {
  checkStoredSettings(got);
  update(got);
  setupProxy();
});

// Theme all currently open windows

browser.windows.getAll().then(wins => wins.forEach(themeWindow));
