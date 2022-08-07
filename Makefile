.PHONY: test
test:
	deno test

.PHONY: build
build:
	deno bundle mod.ts > mod.js

.PHONY: tag
tag/%: build
	sed -i -E "s|deno.land/x/http_ece@(v[0-9]\.[0-9]\.[0-9])|deno.land/x/http_ece@$(@F)|g" *; \
	git commit -m "tag version $(@F)" .; \
	git tag $(@F)
