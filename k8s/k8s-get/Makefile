# Makefile
.PHONY: build package

build:
	tinygo build -o k8s-get.wasm -target wasi main.go

package:
	tar -czf plugin.tar.gz plugin.yml k8s-get.wasm frontend/dist/
