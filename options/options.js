function SetHostText() {
    var hostid = document.getElementById("hostText");
    hostid.textContent = chrome.i18n.getMessage("hostText");
}

function SetPortText() {
    var portid = document.getElementById("portText");
    portid.textContent = chrome.i18n.getMessage("portText");
}

function SetControlHostText() {
    var controlhostid = document.getElementById("controlHostText");
    controlhostid.textContent = chrome.i18n.getMessage("controlHostText");
}

var handleContextProxyRequest = async function(requestDetails) {
    console.log("(proxy)Searching for proxy by context");
    try {
        var handleProxyRequest = function(context) {
            proxy = {
                failoverTimeout: 0,
                type: "direct",
                proxyDNS: false,
            };
            if (context.name == "onionbrowser") {
                proxy = {
                    type: getScheme(),
                    host: getHost(),
                    port: getPort(),
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
                    name: "onionbrowser",
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

function setupProxy() {
    var controlHost = getControlHost();
    var controlPort = getControlPort();
    var Host = getHost();
    var Port = getPort();
    var Scheme = getScheme();

    /**/
    console.log("Setting up Firefox WebExtension proxy");
    browser.proxy.onRequest.addListener(handleContextProxyRequest, {
        urls: ["<all_urls>"],
    });
    console.log("onion settings created for WebExtension Proxy");
    /**/
}

function SetControlPortText() {
    var controlportid = document.getElementById("controlPortText");
    controlportid.textContent = chrome.i18n.getMessage("controlPortText");
}

function SetControlHelpText() {
    var portid = document.getElementById("controlHelpText");
    portid.textContent = chrome.i18n.getMessage("controlHelpText");
}

function getScheme() {
    const proxy_scheme = document.querySelector("#proxy_scheme");
    console.log("(options)Got Tor proxy scheme:", proxy_scheme.value);
    if (proxy_scheme.value == "HTTP") {
        return "socks";
    }
    if (proxy_scheme.value == "SOCKS") {
        return "socks";
    }
    if (proxy_scheme.value == "http") return "socks";
    if (proxy_scheme.value == "socks") return "socks";
    else return "socks";
}

function getHost() {
    proxy_host = document.getElementById("host").value;
    console.log("Got onion proxy host:", proxy_host);
    if (proxy_host == undefined) {
        return "127.0.0.1";
    }
    return proxy_host;
}

function getPort() {
    proxy_port = document.getElementById("port").value;
    console.log("Got onion proxy port:", proxy_port);
    if (proxy_port == undefined) {
        return "9050";
    }
    return proxy_port;
}

function getControlHost() {
    control_host = document.getElementById("controlhost").value;
    console.log("Got onion control host:", control_host);
    if (control_host == undefined) {
        return "127.0.0.1";
    }
    return control_host;
}

function getControlPort() {
    control_port = document.getElementById("controlport").value;
    console.log("Got onion control port:", control_port);
    if (control_port == undefined) {
        return "9050";
    }
    return control_port;
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

function onError(e) {
    console.error(e);
}

function storeSettings() {
    let proxy_scheme = getScheme();
    let proxy_host = getHost();
    let proxy_port = getPort();
    let control_host = getControlHost();
    let control_port = getControlPort();
    chrome.storage.local.set({
        proxy_scheme,
        proxy_host,
        proxy_port,
        control_host,
        control_port,
    });
    console.log("storing proxy scheme:", proxy_scheme);
    console.log("storing proxy host:", proxy_host);
    console.log("storing proxy port:", proxy_port);
    console.log("storing control host:", control_host);
    console.log("storing control port:", control_port);
    setupProxy();
}

function updateUI(restoredSettings) {
    const selectList = document.querySelector("#proxy_scheme");
    selectList.value = restoredSettings.proxy_scheme;
    console.log("showing proxy scheme:", selectList.value);

    const hostitem = document.getElementById("host");
    hostitem.value = restoredSettings.proxy_host;
    console.log("showing proxy host:", hostitem.value);

    const portitem = document.getElementById("port");
    portitem.value = restoredSettings.proxy_port;
    console.log("showing proxy port:", portitem.value);

    const controlhostitem = document.getElementById("controlhost");
    controlhostitem.value = restoredSettings.control_host;
    console.log("showing control host:", controlhostitem.value);

    const controlportitem = document.getElementById("controlport");
    controlportitem.value = restoredSettings.control_port;
    console.log("showing control port:", controlportitem.value);

    SetHostText();
    SetPortText();
    SetControlHostText();
    SetControlPortText();
    SetControlHelpText();
    setupProxy();
}

function onError(e) {
    console.error(e);
}
chrome.storage.local.get(function(got) {
    checkStoredSettings(got);
    updateUI(got);
});

const saveButton = document.querySelector("#save-button");
saveButton.addEventListener("click", storeSettings);

//EXPERIMENTAL: Open in Onion Tab

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