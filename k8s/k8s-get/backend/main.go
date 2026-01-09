package main

import "fmt"

func handle_k8s_get() {
	fmt.Println("k8s-get: k8s get handler called")
}

func handle_status() {
	fmt.Println(`{"status":"ok","service":"k8s-get","version":"1.0.1"}`)
}

func main() {
}
