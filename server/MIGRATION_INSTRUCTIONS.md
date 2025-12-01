# Database Migration Instructions

## Adding Gender Field to User Model

To apply the gender field migration to your database, run the following commands:

```bash
# Navigate to server directory
cd server

# Run migrations
python manage.py makemigrations
python manage.py migrate
```

## What was added:

1. **Gender field** in User model with choices:
   - `male` - Male
   - `female` - Female
   - `prefer_not_to_say` - Prefer not to say

2. **Phone number** field (already existed, now exposed in API)

## API Changes:

The `/api/user/` endpoint now accepts and returns:
- `phone_number` (string, optional)
- `gender` (string, optional, choices: 'male', 'female', 'prefer_not_to_say')

## Frontend Changes:

1. Added phone number input field
2. Added gender selection modal
3. Implemented AsyncStorage fallback for offline support
4. Both fields are optional and can be updated independently

## Testing:

After migration, test the following:
1. Update user profile with phone number
2. Update user profile with gender
3. Verify data persists in database
4. Test AsyncStorage fallback when API fails
