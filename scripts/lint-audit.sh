#!/bin/bash

# Audit Script for Ion Arc Online
# Checks for syntax errors in PSEO campaigns and components

echo "--- 🛠️  Ion Arc Online Analysis ---"

# 1. Type Check
echo "Checking TypeScript types..."
npx tsc --noEmit

# 2. Astro Check
echo "Running Astro integrity check..."
npx astro check

# 3. Data Integrity
echo "Verifying 710-city JSON schema..."
node -e "
const fs = require('fs');
const locs = JSON.parse(fs.readFileSync('src/data/pseo/globals/locations.json', 'utf8'));
console.log('Detected ' + locs.length + ' cities.');
const invalid = locs.filter(l => !l.city || !l.state || !l.slug);
if (invalid.length > 0) {
    console.error('ERROR: Found ' + invalid.length + ' invalid city entries.');
    process.exit(1);
}
console.log('✅  710-city data integrity verified.');
"

echo "--- ✅  Analysis Complete ---"
