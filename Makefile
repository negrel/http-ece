.PHONY: lint
lint:
	deno lint

.PHONY: fmt
fmt:
	deno fmt

.PHONY: fmt-check
fmt-check:
	deno fmt --check

.PHONY: test
test: lint fmt
	deno test

.PHONY: tag
tag/%: test
	sed -i -E "s|deno.land/x/http_ece@(v[0-9]+\.[0-9]+\.[0-9]+)|deno.land/x/http_ece@$(@F)|g" *; \
	git commit -m "tag version $(@F)" .; \
	git tag $(@F)

.PHONY: npm
npm/%:
	deno run -A ./scripts/build_npm.ts $(@F)
