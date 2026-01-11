#!/bin/bash

# Generate a secure AUTH_SECRET for NextAuth.js
# Run this script with: bash scripts/generate-auth-secret.sh

echo "Generating secure AUTH_SECRET..."
echo ""
SECRET=$(openssl rand -base64 32)
echo "Your generated AUTH_SECRET:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$SECRET"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Add this to your .env.local file:"
echo "AUTH_SECRET=$SECRET"
echo ""
