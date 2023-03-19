.PHONY: fmt
fmt:
	deno fmt

.PHONY: upgrade-deps
upgrade-deps:
	deno run --allow-read=. --allow-write=. --allow-net https://deno.land/x/udd/main.ts denops/**/*.ts
