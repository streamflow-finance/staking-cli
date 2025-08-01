#!/bin/bash

# CLI runner script that bypasses npm argument parsing issues
# Usage: ./cli.sh <command> [options]

# Check if we're in development or production mode
if [ -f "src/index.ts" ]; then
    # Development mode - use TypeScript
    npx tsx src/index.ts "$@"
else
    # Production mode - use compiled JavaScript
    node dist/index.js "$@"
fi 