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