# Hello World Plugin - Simple Guide

A step-by-step guide to create a simple hello-world plugin with backend API and frontend integration.

## Required Dependencies

- [TinyGo](https://tinygo.org/getting-started/install/) (for compiling Go to WASM)

## Overview

This plugin creates:
- Backend route `/hello` that takes a `name` parameter
- Returns `"Hello {name}"` response
- Frontend form to input name and display greeting
- Complete integration example

## What we are going to create

![Alt text](./assets/Screenshot%202025-08-20%20at%204.50.35 PM.png)

## Project Structure

```
examples/hello-world/
├── main.go                    # WASM backend
├── plugin.yml                 # Plugin manifest
├── Makefile                   # Build automation
├── plugin.tar.gz              # packages frontend, plugin.yml, hello-world.wasm
├── frontend/                  # React frontend
│   ├── package.json
│   ├── vite.config.js
│   ├── src/
│   │   └── App.jsx
│   ├── public/
│   │   └── icon.svg
│   └── dist/                  # Build output
└── hello-world.wasm          # Compiled WASM
```

## Step 1: Create the Backend (WASM)

Create `main.go`:

```go
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

//export handle_hello
func handle_hello(inputPtr, inputLen uint64) uint64 {
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

	// Create hello response
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
		"plugin":    "hello-world",
		"version":   "1.0.0",
		"endpoints": []string{"/hello"},
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
```

## Step 2: Create Plugin Manifest

Create `plugin.yml`:

```yaml
apiVersion: hello-world/v1
kind: Plugin
metadata:
  name: "hello-world"
  version: "1.0.0"
  author: "admin"
  description: "Simple hello world plugin with name greeting"

spec:
  # WASM Configuration
  wasm:
    file: "hello-world.wasm"
    entrypoint: "main"
    memory_limit: "32MB"

  # Build Information
  build:
    go_version: "1.21"
    tinygo_version: "0.30.0"

  # Backend Integration
  backend:
    enabled: true
    routes:
      - path: "/hello"
        methods: ["POST"]
        handler: "handle_hello"
      - path: "/status"
        methods: ["GET"]
        handler: "handle_status"

  # Frontend Integration
  frontend:
    enabled: true
    navigation: # Only one navigation is required. 
      - label: "Hello World"
        icon: "icon.svg"
        path: "/plugins/hello-world"
    routes:
      - path: "/plugins/hello-world"
        component: "plugin-component.js"
```

## Step 3: Create Frontend

### Initialize project (use react)
```
npm create vite@latest

#Install dev dependencies

npm install --save-dev @babel/core @babel/plugin-transform-react-jsx @rollup/pluginutils vite-plugin-css-injected-by-js

```

### Vite Configuration

In `frontend/vite.config.js`:

```javascript
import { defineConfig } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    cssInjectedByJsPlugin(), // inject css directly into js
    react({
      babel: {
        //
        plugins: [
          function customReactGlobalPlugin() {
            return {
              visitor: {
                ImportDeclaration(path) {
                  if (path.node.source.value === "react") {
                    path.remove(); // Remove the react import (import React from "react") statements
                  }
                },
                MemberExpression(path) {
                  // replace React.x with window.React.x
                  if (
                    path.node.object.name === "React" &&
                    !path.node.property.name.startsWith("_")
                  ) {
                    path.node.object = {
                      type: "MemberExpression",
                      object: { type: "Identifier", name: "window" },
                      property: { type: "Identifier", name: "React" },
                    };
                  }
                },
              },
            };
          },
          [
            "@babel/plugin-transform-react-jsx",
            {
              // converts jsx to syntax like  window.React.createElement
              runtime: "classic",
              pragma: "window.React.createElement",
              pragmaFrag: "window.React.Fragment",
            },
          ],
        ],
      },
    }),
  ],
  build: {
    cssCodeSplit: false,
    lib: {
      entry: path.resolve(__dirname, "./src/App.jsx"), // entry file path
      name: "PluginComponent",
      fileName: () => `plugin-component.js`, // build output file name
      formats: ["es"],
    },
    rollupOptions: {
      external: ["react"],
      output: {
        globals: {
          react: "React",
        },
      },
    },
  },
});
```

### React Component

Create `frontend/src/App.jsx`:

```jsx
//const React = window.React; // use when building project using ```npm run build```

// import React from "react"; // use in development mode


//uncomment any one from above as per build/development requirement

function App({ pluginId, theme }) {
  // these props are passed by the pluginloader from host always include this
  
  const [name, setName] = React.useState('');  // always use this format for using any hooks
  const [greeting, setGreeting] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [currentTheme, setCurrentTheme] = React.useState(theme);
  const baseAPI = "http://localhost:4000/api"

  // Theme change listener
  React.useEffect(() => {
    const onThemeChange = (e) => {
      const newTheme = e.detail?.theme;
      if (newTheme) {
        setCurrentTheme(newTheme);
      }
    };

    window.addEventListener("theme-toggle", onThemeChange);
    return () => window.removeEventListener("theme-toggle", onThemeChange);
  }, []);

  const getThemeStyles = () => ({
    backgroundColor: currentTheme === "dark" ? "#1a202c" : "#ffffff",
    color: currentTheme === "dark" ? "white" : "black",
    borderColor: currentTheme === "dark" ? "#4a5568" : "#e2e8f0",
  });

  const sayHello = async () => {
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }

    setLoading(true);
    setError('');
    setGreeting('');

    try {
      const response = await fetch(`${baseAPI}/plugins/${pluginId}/hello`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('jwtToken'),
        },
        body: JSON.stringify({
          name: name.trim()
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        setGreeting(data.message);
      } else {
        setError(data.error || 'Unknown error occurred');
      }
    } catch (err) {
      setError('Failed to connect to the plugin: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sayHello();
    }
  };

  const clearAll = () => {
    setName('');
    setGreeting('');
    setError('');
  };

  return (
    <div style={{
      padding: '30px',
      maxWidth: '600px',
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      ...getThemeStyles()
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '40px',
        borderBottom: `2px solid ${getThemeStyles().borderColor}`,
        paddingBottom: '20px'
      }}>
        <h1 style={{
          margin: '0 0 10px 0',
          fontSize: '2.5rem',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          👋 Hello World Plugin
        </h1>
        <p style={{
          margin: 0,
          fontSize: '1.1rem',
          color: currentTheme === "dark" ? "#a0aec0" : "#718096"
        }}>
          Enter your name and get a personalized greeting!
        </p>
      </div>

      {/* Input Section */}
      <div style={{
        marginBottom: '30px',
        padding: '25px',
        border: `1px solid ${getThemeStyles().borderColor}`,
        borderRadius: '12px',
        backgroundColor: currentTheme === "dark" ? "#2d3748" : "#f7fafc"
      }}>
        <label style={{
          display: 'block',
          marginBottom: '10px',
          fontSize: '1.1rem',
          fontWeight: '600'
        }}>
          What's your name?
        </label>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter your name here..."
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px 16px',
              fontSize: '1rem',
              border: `2px solid ${getThemeStyles().borderColor}`,
              borderRadius: '8px',
              backgroundColor: getThemeStyles().backgroundColor,
              color: getThemeStyles().color,
              outline: 'none',
              transition: 'all 0.2s ease',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea';
              e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = getThemeStyles().borderColor;
              e.target.style.boxShadow = 'none';
            }}
          />
          
          <button
            onClick={sayHello}
            disabled={loading || !name.trim()}
            style={{
              padding: '12px 24px',
              fontSize: '1rem',
              fontWeight: '600',
              backgroundColor: loading || !name.trim() ? '#a0aec0' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading || !name.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              minWidth: '100px'
            }}
            onMouseEnter={(e) => {
              if (!loading && name.trim()) {
                e.target.style.backgroundColor = '#5a67d8';
                e.target.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && name.trim()) {
                e.target.style.backgroundColor = '#667eea';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            {loading ? '...' : 'Say Hello'}
          </button>

          {(name || greeting || error) && (
            <button
              onClick={clearAll}
              style={{
                padding: '12px 16px',
                fontSize: '1rem',
                backgroundColor: 'transparent',
                color: currentTheme === "dark" ? "#a0aec0" : "#718096",
                border: `1px solid ${getThemeStyles().borderColor}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = currentTheme === "dark" ? "#4a5568" : "#edf2f7";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Response Section */}
      {(greeting || error) && (
        <div style={{
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px',
          border: `1px solid ${error ? '#f56565' : '#48bb78'}`,
          backgroundColor: error 
            ? (currentTheme === "dark" ? '#742a2a' : '#fed7d7')
            : (currentTheme === "dark" ? '#2f855a' : '#c6f6d5')
        }}>
          {error ? (
            <div>
              <h3 style={{
                margin: '0 0 10px 0',
                color: '#f56565',
                fontSize: '1.2rem',
                fontWeight: '600'
              }}>
                ❌ Error
              </h3>
              <p style={{ margin: 0, color: '#f56565' }}>{error}</p>
            </div>
          ) : (
            <div>
              <h3 style={{
                margin: '0 0 10px 0',
                color: '#48bb78',
                fontSize: '1.2rem',
                fontWeight: '600'
              }}>
                🎉 Greeting
              </h3>
              <p style={{
                margin: 0,
                fontSize: '1.3rem',
                fontWeight: '500',
                color: '#48bb78'
              }}>
                {greeting}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Plugin Info */}
      <div style={{
        marginTop: '40px',
        padding: '20px',
        border: `1px solid ${getThemeStyles().borderColor}`,
        borderRadius: '8px',
        backgroundColor: currentTheme === "dark" ? "#2d3748" : "#f7fafc",
        fontSize: '0.9rem',
        color: currentTheme === "dark" ? "#a0aec0" : "#718096"
      }}>
        <strong>Plugin Info:</strong>
        <br />
        Plugin ID: {pluginId}
        <br />
        Theme: {currentTheme}
        <br />
        Backend Route: POST /api/plugins/{pluginId}/hello
      </div>
    </div>
  );
}

export default App;
```

### Plugin Icon

Attach icon for plugin navigation `frontend/public/icon.svg`: (SVG icon)


## Step 4: Create Build System

Create `Makefile`:

```makefile
# Makefile
.PHONY: build package

build:
	tinygo build -o hello-world.wasm -target wasi main.go

package:
	tar -czf plugin.tar.gz plugin.yml hello-world.wasm frontend/dist/ 
```

Build `frontend`
```
cd frontend 
npm run build
```

Build `backend` at root
```
make build
```

Package `frontend` and `backend` together (at project root)
```
make package
```


## Step 5: Install it using `Plugin Manager` from `Kubestellar Ui frontend system`
- Run Kubestellar UI locally
- Go to `Plugin Manager` tab
- Click on install from local path
- Select plugin.tar.gz file of current plugin
- Click Install


This hello-world plugin demonstrates the complete flow from user input in the frontend, through the KubeStellar plugin system, to the WASM backend, and back with a personalized response!
