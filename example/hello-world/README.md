# Hello World Plugin Example

A simple KubeStellar UI plugin with WASM backend and React frontend.

## Prerequisites

- **TinyGo** (v0.30.0+) - `brew install tinygo` (macOS) or [download](https://tinygo.org/getting-started/install/)
- **Node.js** (v18+) - For frontend build
- **Go** (v1.21+) - For backend development

## Build & Package

```bash
# 1. Build frontend
cd frontend
npm install
npm run build

# 2. Build WASM backend
cd ..
make build

# 3. Package everything
make package
```

## Installation

1. Start KubeStellar UI locally
2. Go to **Plugin Manager** tab
3. Click **"Install from Local Path"**
4. Select `plugin.tar.gz`
5. Click **Install**

## API Endpoints

- `POST /hello` - Returns personalized greeting
- `GET /status` - Returns plugin health status

## Project Structure

```
hello-world/
├── main.go                    # WASM backend
├── plugin.yml                 # Plugin manifest
├── Makefile                   # Build automation
├── hello-world.wasm          # Compiled WASM
├── plugin.tar.gz             # Final package
└── frontend/                  # React frontend
    ├── src/App.jsx           # Main component
    └── dist/                 # Built assets
```

## Development

```bash
# Frontend development
cd frontend && npm run dev

# Rebuild backend
make build
