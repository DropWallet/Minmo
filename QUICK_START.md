# Quick Start Guide

## Initial Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Add placeholder assets:**
   - Create `assets/icon.png` (1024x1024)
   - Create `assets/splash.png` (1242x2436)
   - Create `assets/adaptive-icon.png` (1024x1024)
   - Create `assets/favicon.png` (48x48)

   Or use Expo's asset generation:
   ```bash
   npx expo install --fix
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Run on iOS simulator:**
   ```bash
   npm run ios
   ```

5. **Run on Android emulator:**
   ```bash
   npm run android
   ```

## Testing

Run tests:
```bash
npm test
```

Run linting:
```bash
npm run lint
```

Type checking:
```bash
npm run typecheck
```

## Project Structure

```
src/
  components/     # Reusable UI components
  screens/         # Screen components
  db/             # Database schema and queries
  utils/          # Utility functions
  store/          # State management (Zustand)
```

## Next Steps

1. Test recording flow on device/simulator
2. Verify SQLite database creation
3. Test photo capture (camera + library)
4. Implement Entry Detail screen navigation
5. Add search functionality
6. Set up transcription backend (Milestone 2)

## Notes

- FTS5 search may not be available on all SQLite builds; the code falls back to LIKE search automatically
- Transcription toggle is stored locally via AsyncStorage
- All files are saved to app document directory
- Database is initialized on first app launch








