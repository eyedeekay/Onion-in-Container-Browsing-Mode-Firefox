
function contentUpdateById(id, message) {
	let infoTitle = document.getElementById(id);
	let messageContent = chrome.i18n.getMessage(message);
	if (infoTitle === null) {
		console.log('content error', id, messageContent);
		return;
	}
	infoTitle.textContent = messageContent;
}
contentUpdateById('CertLabel', 'CertLabel');
contentUpdateById('SignedLabel', 'SignedLabel');
contentUpdateById('TypeLabel', 'TypeLabel');
contentUpdateById('addresstype', 'addresstype');
contentUpdateById('clear-browser-data', 'clear-browser-data');
contentUpdateById('controlHelpText', 'controlHelpText');
contentUpdateById('controlHostText', 'controlHostText');
contentUpdateById('controlPortText', 'controlPortText');
contentUpdateById('headline', 'headline');
contentUpdateById('hostText', 'hostText');
contentUpdateById('identity-list', 'identity-list');
contentUpdateById('portText', 'portText');
contentUpdateById('returnhome', 'returnhome');
contentUpdateById('signingcert', 'signingcert');
contentUpdateById('sitecert', 'sitecert');
contentUpdateById('sourcehead', 'sourcehead');
contentUpdateById('text-section-header', 'text-section-header');
contentUpdateById('text-section-helptext', 'text-section-helptext');
contentUpdateById('window-create-news-panel', 'window-create-news-panel');
