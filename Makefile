mocha_path := node_modules/mocha/bin/mocha

test:
	$(mocha_path) test/index --timeout=100000

.PHONY: test