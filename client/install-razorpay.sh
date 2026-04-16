#!/bin/bash

# Razorpay React Native Installation Script
# Run this from the client directory

echo "🚀 Installing Razorpay React Native SDK..."
echo ""

# Install the package
npx expo install react-native-razorpay

echo ""
echo "✅ Installation complete!"
echo ""
echo "📋 Next steps:"
echo "1. If using bare workflow, run: cd ios && pod install && cd .."
echo "2. Test the integration with test cards"
echo "3. See RAZORPAY_INTEGRATION_GUIDE.md for full documentation"
echo ""
echo "🧪 Test Cards:"
echo "   Success: 4111 1111 1111 1111"
echo "   Failure: 4000 0000 0000 0002"
echo ""
