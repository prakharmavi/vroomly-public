#!/bin/bash

echo "Cleaning previous build..."
rm -rf dist

echo "Building application..."
npm run build

echo "Build completed! You can test it with: serve -s dist"
