//go:build wasm

package main

import (
	"encoding/json"
	"fmt"
	"unsafe"
)

// Memory management
var memoryBase uint32 = 0x1000
var memoryOffset uint32 = 0

//export handle_k8s
func handle_k8s_get(inputPtr, inputLen uint64) uint64 {
	// Read input from WASM memory
	input := readInput(inputPtr, inputLen)

	// Parse the input JSON
	var request map[string]interface{}
	if err := json.Unmarshal(input, &request); err != nil {
		return respondError("Invalid JSON input")
	}

	// Get the name parameter
	name, exists := request["name"]
	if !exists {
		return respondError("Missing 'name' parameter")
	}

	nameStr, ok := name.(string)
	if !ok {
		return respondError("Name must be a string")
	}

	// Create k8s response
	response := map[string]interface{}{
		"status":  "success",
		"message": fmt.Sprintf("Hello %s!", nameStr),
		"name":    nameStr,
	}

	return respondJSON(response)
}

//export handle_status
func handle_status(inputPtr, inputLen uint64) uint64 {
	response := map[string]interface{}{
		"status":    "healthy",
		"plugin":    "k8s-get",
		"version":   "1.0.1",
		"endpoints": []string{"/k8s"},
	}

	return respondJSON(response)
}

// Helper functions
func readInput(inputPtr, inputLen uint64) []byte {
	ptr := uintptr(inputPtr)
	len := int(inputLen)
	return unsafe.Slice((*byte)(unsafe.Pointer(ptr)), len)
}

func respondJSON(data interface{}) uint64 {
	jsonBytes, err := json.Marshal(data)
	if err != nil {
		return respondError(fmt.Sprintf("JSON marshal error: %v", err))
	}
	return allocateAndReturn(string(jsonBytes))
}

func respondError(message string) uint64 {
	response := map[string]interface{}{
		"status": "error",
		"error":  message,
	}

	jsonBytes, _ := json.Marshal(response)
	return allocateAndReturn(string(jsonBytes))
}

func allocateAndReturn(data string) uint64 {
	dataBytes := []byte(data)
	size := uint32(len(dataBytes))
	ptr := allocate(size)

	// Copy data to WASM memory
	dest := (*[1024]byte)(unsafe.Pointer(uintptr(ptr)))
	copy(dest[:size], dataBytes)

	// Return combined pointer and size
	return uint64(ptr)<<32 | uint64(size)
}

//export allocate
func allocate(size uint32) uint32 {
	ptr := memoryBase + memoryOffset
	memoryOffset += size
	return ptr
}

//export deallocate
func deallocate(ptr uint32, size uint32) {
	// Simple deallocation
}

func main() {
	// Required for WASM compilation
}
