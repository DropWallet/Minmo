# Testing Documentation

This file documents the test suite for MinMo, including what's tested, how to run tests, and what's covered.

## Test Files

### `__tests__/smoke.test.js`
**Purpose:** Basic sanity checks to ensure the test setup works
**Coverage:**
- Test runner functionality
- Basic assertions

### `__tests__/db.test.ts`
**Purpose:** Tests database-related logic and data structures
**Coverage:**
- Type validation for `CreateEntryInput` and `Entry`
- FTS5 search query formatting logic
- Data structure validation

**Note:** Full database integration tests require expo-sqlite native modules which aren't available in Jest. See `__tests__/db.integration.test.ts` for integration test documentation.

**Test Cases:**
1. **Type Validation**
   - Validate `CreateEntryInput` structure
   - Validate `Entry` structure
   - Test minimal vs full input

2. **Search Query Formatting**
   - Format single word queries for FTS5 (`"word" OR word*`)
   - Format multi-word queries for FTS5
   - Handle empty queries
   - Trim whitespace correctly

### `__tests__/db.integration.test.ts`
**Purpose:** Documents expected behavior for database integration tests
**Coverage:**
- Manual test checklist for all database operations
- Integration test examples (require device/simulator or proper mocking)

**Note:** These tests document expected behavior but require actual database access. They can be run manually on device/simulator or with proper test database setup.

### `__tests__/utils.test.ts`
**Purpose:** Tests utility functions
**Coverage:**
- `formatDateWithOrdinal()` - Date formatting with ordinal suffixes
- `getDailyPrompt()` - Daily prompt selection
- `getAllPrompts()` - Prompt list retrieval

**Test Cases:**
1. **Date Formatting**
   - Format date with correct ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
   - Handle all ordinal cases (st, nd, rd, th)
   - Format current date correctly
   - Match expected pattern

2. **Daily Prompts**
   - Return a valid prompt string
   - Return the same prompt for the same day (deterministic)
   - Return all available prompts
   - Verify daily prompt is in the prompts list

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npm test __tests__/db.test.ts
npm test __tests__/utils.test.ts
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Run Tests Verbosely
```bash
npm test -- --verbose
```

## Test Coverage

### Currently Covered
- ✅ Database type validation (`CreateEntryInput`, `Entry`)
- ✅ Search query formatting logic (FTS5 query construction)
- ✅ Date formatting utilities
- ✅ Daily prompt selection
- ✅ Data structure validation

### Not Yet Covered (Future)
- ❌ Full database integration tests (require native modules or device)
- ❌ UI component rendering
- ❌ Navigation flows
- ❌ Audio recording/playback
- ❌ Photo capture/selection
- ❌ File system operations
- ❌ Integration tests for full user flows
- ❌ Error boundary testing
- ❌ Performance testing

## Test Structure

### Database Tests
- Use actual database operations (not mocked)
- Clear database before each test for isolation
- Test both success and failure cases
- Verify data integrity (correct fields, ordering, etc.)

### Utility Tests
- Test pure functions with predictable inputs/outputs
- Test edge cases and boundary conditions
- Verify deterministic behavior where expected

## Notes

- **Database Isolation:** Tests clear the database before each test to ensure isolation. In production, you might want to use a separate test database.
- **Async Operations:** All database operations are async and properly awaited in tests.
- **Error Handling:** Tests verify that errors are handled gracefully (e.g., null returns for non-existent entries).
- **Search Testing:** Search tests verify both exact matches and prefix matching, as well as relevance ranking.

## Adding New Tests

When adding new functionality, consider:

1. **Unit Tests:** Test individual functions in isolation
2. **Integration Tests:** Test how components work together
3. **Edge Cases:** Test boundary conditions, null values, empty inputs
4. **Error Cases:** Test error handling and recovery
5. **Performance:** For critical paths, consider performance benchmarks

### Example Test Structure
```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should do something correctly', async () => {
    // Arrange
    const input = { ... };
    
    // Act
    const result = await functionUnderTest(input);
    
    // Assert
    expect(result).toBeDefined();
    expect(result.property).toBe(expectedValue);
  });
});
```

## Test Maintenance

- Keep tests up to date with code changes
- Remove obsolete tests when functionality changes
- Add tests for bug fixes to prevent regressions
- Review test coverage periodically
- Ensure tests run quickly (under 10 seconds for full suite)

## CI Integration

Tests are automatically run in GitHub Actions on:
- Every push to `main` branch
- Every pull request

See `.github/workflows/ci.yml` for CI configuration.

