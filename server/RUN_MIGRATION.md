# Run Database Migration for Image Upload Feature

## Steps to Apply Migration

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Run the migration:**
   ```bash
   python manage.py migrate inventory
   ```

3. **Verify migration was applied:**
   ```bash
   python manage.py showmigrations inventory
   ```

   You should see:
   ```
   inventory
    [X] 0001_initial
    [X] 0002_orderno_images
   ```

## If Migration Fails

If you encounter issues, you can:

1. **Check migration status:**
   ```bash
   python manage.py showmigrations
   ```

2. **Create migration manually (if needed):**
   ```bash
   python manage.py makemigrations inventory
   ```

3. **Apply all pending migrations:**
   ```bash
   python manage.py migrate
   ```

## Rollback (if needed)

To rollback this migration:
```bash
python manage.py migrate inventory 0001_initial
```

## Database Schema Change

This migration adds the following column to the `inventory_orderno` table:
- **Column:** `images`
- **Type:** JSON (or TEXT depending on database)
- **Nullable:** Yes
- **Default:** `[]` (empty array)
