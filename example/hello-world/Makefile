# Makefile
.PHONY: build package

build:
	tinygo build -o hello-world.wasm -target wasi main.go

package:
	tar -czf plugin.tar.gz plugin.yml hello-world.wasm frontend/dist/ 