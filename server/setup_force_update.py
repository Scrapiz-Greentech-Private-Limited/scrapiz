#!/usr/bin/env python
"""
Setup script for Force Update feature
Run this after migrations to initialize AppConfig
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from content.models import AppConfig

def setup_force_update():
    """Initialize AppConfig with default values"""
    print("🚀 Setting up Force Update configuration...")
    
    try:
        # Get or create config
        config = AppConfig.get_config()
        
        print(f"✅ AppConfig initialized!")
        print(f"   - Minimum version: {config.min_app_version}")
        print(f"   - Android URL: {config.force_update_url_android}")
        print(f"   - iOS URL: {config.force_update_url_ios}")
        print(f"   - Enforce sell screen: {config.enforce_sell_screen_gate}")
        print(f"   - Location skip: {config.enable_location_skip}")
        print(f"   - Maintenance mode: {config.maintenance_mode}")
        
        print("\n💡 You can now:")
        print("   1. Update settings via Django admin at /admin/content/appconfig/")
        print("   2. Update via admin dashboard UI")
        print("   3. Update via API: PATCH /api/content/app-config/update/")
        
        print("\n✨ Force Update feature is ready to use!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    setup_force_update()
