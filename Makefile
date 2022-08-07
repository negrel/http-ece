.PHONY: lint
lint:
	deno lint

.PHONY: fmt
fmt:
	deno fmt

.PHONY: test
test: lint fmt
	deno test

.PHONY: build
build: lint fmt
	deno bundle mod.ts > dist/mod.js

.PHONY: tag
tag/%: build test
	sed -i -E "s|deno.land/x/http_ece@(v[0-9]\.[0-9]\.[0-9])|deno.land/x/http_ece@$(@F)|g" *; \
	git commit -m "tag version $(@F)" .; \
	git tag $(@F)
