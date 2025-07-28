#!/bin/bash

echo "🧹 Cleaning up Strapi project..."

# Remove log files
echo "📄 Removing log files..."
rm -f *.log
rm -f tests/*.log
rm -f src/**/*.log

# Remove temporary test scripts
echo "🧪 Removing temporary test scripts..."
rm -f test-*.js
rm -f check-*.js
rm -f fix-*.js
rm -f debug-*.js
rm -f verify-*.js

# Remove backup files
echo "💾 Removing backup files..."
find . -name "*.bak" -type f -delete
find . -name "*.backup" -type f -delete
find . -name "*.tmp" -type f -delete

# Clean Strapi cache and build files
echo "🚀 Cleaning Strapi cache and build files..."
rm -rf .strapi
rm -rf .cache
rm -rf build
rm -rf dist
rm -rf .strapi-updater.json

# Clean test artifacts
echo "🧪 Cleaning test artifacts..."
rm -rf coverage
rm -rf tests/temp/*

# Clean node_modules (optional - uncomment if needed)
# echo "📦 Cleaning node_modules..."
# rm -rf node_modules

echo "✅ Cleanup complete!"
echo ""
echo "💡 Tips:"
echo "  - Run 'npm install' if you removed node_modules"
echo "  - Run 'npm run build' to rebuild the admin panel"
echo "  - Run 'npm run develop' to start the development server" 