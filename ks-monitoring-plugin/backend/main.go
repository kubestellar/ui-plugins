package main

import "fmt"

func handle_hello() {
	fmt.Println("ks-monitoring: hello handler called")
}

func handle_status() {
	fmt.Println(`{"status":"ok","service":"ks-monitoring","version":"1.0.0"}`)
}

func main() {
}
