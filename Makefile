PREFIX:=/usr

default: zip

install: uninstall
	mkdir -p $(PREFIX)/share/webext/onioncbt@eyedeekay.github.io \
		$(PREFIX)/share/mozilla/extensions/{ec8030f7-c20a-464f-9b0e-13a3a9e97384}
	cp -r ./chromium/ $(PREFIX)/share/webext/onioncbt@eyedeekay.github.io/
	cp -r ./icons/ $(PREFIX)/share/webext/onioncbt@eyedeekay.github.io/
	cp -r ./_locales/ $(PREFIX)/share/webext/onioncbt@eyedeekay.github.io/
	cp -r ./options/ $(PREFIX)/share/webext/onioncbt@eyedeekay.github.io/
	cp ./*.js $(PREFIX)/share/webext/onioncbt@eyedeekay.github.io/
	cp ./*.html $(PREFIX)/share/webext/onioncbt@eyedeekay.github.io/
	cp ./*.css $(PREFIX)/share/webext/onioncbt@eyedeekay.github.io/
	cp ./*.md $(PREFIX)/share/webext/onioncbt@eyedeekay.github.io/
	cp ./*.xpi $(PREFIX)/share/webext/onioncbt@eyedeekay.github.io/
	cp ./manifest.json $(PREFIX)/share/webext/onioncbt@eyedeekay.github.io/
	cp ./LICENSE $(PREFIX)/share/webext/onioncbt@eyedeekay.github.io/
	ln -s $(PREFIX)/share/webext/onioncbt@eyedeekay.github.io \
		$(PREFIX)/share/mozilla/extensions/{ec8030f7-c20a-464f-9b0e-13a3a9e97384}

uninstall:
	rm -rf $(PREFIX)/share/webext/onioncbt@eyedeekay.github.io \
		$(PREFIX)/share/webext/onionsetproxy.js@eyedeekay.github.io \
		$(PREFIX)/share/mozilla/extensions/{ec8030f7-c20a-464f-9b0e-13a3a9e97384}

ls:
	ls -lah $(PREFIX)/share/webext/onioncbt@eyedeekay.github.io; \
	ls -lah $(PREFIX)/share/mozilla/extensions/{ec8030f7-c20a-464f-9b0e-13a3a9e97384}

clean:
	rm -f ../onionsetproxy.js.zip ../onion_proxy*.xpi

## EVEN RELEASES are AMO RELEASES
## ODD RELEASES are SELFHOSTED RELEASES

MOZ_VERSION=0.38
VERSION=0.39
VERSION=$(MOZ_VERSION)
#VERSION=1.27

xpi:
	wget -O ../onioncbt@eyedeekay.github.io.xpi \
		https://addons.mozilla.org/firefox/downloads/file/3419789/onionsetproxyjs-$(MOZ_VERSION)-an+fx.xpi
	cp ../onioncbt@eyedeekay.github.io.xpi ./onioncbt@eyedeekay.github.io.xpi

version:
	sed -i 's|$(shell grep "\"version\": " manifest.json)|  \"version\": \"$(VERSION)\",|g' manifest.json

zip: version
	zip --exclude="./onioncbt@eyedeekay.github.io.xpi" \
		--exclude="./onionsetproxy.js@eyedeekay.github.io.xpi" \
		--exclude="./onionsetproxy.js.png" \
		--exclude="./onionsetproxy.js.gif" \
		--exclude="./.git" -r -FS ../onionsetproxy.js.zip *

release:
	cat desc | gothub release -p -u eyedeekay -r onionsetproxy.js -t $(VERSION) -n $(VERSION) -d -

delete-release:
	gothub delete -u eyedeekay -r onionsetproxy.js -t $(VERSION); true

recreate-release: delete-release release upload

upload: upload-xpi upload-deb

upload-xpi:
	gothub upload -u eyedeekay -r onionsetproxy.js -t $(VERSION) -n "onioncbt@eyedeekay.github.io.xpi" -f "./onioncbt@eyedeekay.github.io.xpi"

upload-deb:
	gothub upload -u eyedeekay -r onionsetproxy.js -t $(VERSION) -n "onionsetproxy.js_$(VERSION)-1_amd64.deb" -f "../onionsetproxy.js_$(VERSION)-1_amd64.deb"

lib: libpolyfill

libpolyfill:
	wget -O chromium/browser-polyfill.js https://unpkg.com/webextension-polyfill/dist/browser-polyfill.js

fmt:
	find . -path ./node_modules -prune -o -name '*.js' -exec prettier --write {} \;

deborig:
	rm -rf ../onionsetproxy.js-$(VERSION)
	cp -r . ../onionsetproxy.js-$(VERSION)
	tar \
		-cvz \
		--exclude=.git \
		--exclude=onionsetproxy.js.gif \
		-f ../onionsetproxy.js_$(VERSION).orig.tar.gz \
		.

deb: deborig
	cd ../onionsetproxy.js-$(VERSION) && debuild -us -uc -rfakeroot
