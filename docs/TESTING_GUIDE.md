# Testing Guide - Red Atlas Express

## Overview

This project includes comprehensive unit tests for all business modules using Jest and TypeScript.

## Test Structure

```
tests/
├── unit/                          # Unit tests
│   ├── usuario.service.test.ts    # User service tests
│   ├── usuario.controller.test.ts # User controller tests
│   ├── propiedad.service.test.ts  # Property service tests
│   ├── anuncio.service.test.ts    # Listing service tests
│   ├── transaccion.service.test.ts # Transaction service tests
│   ├── transaccion.controller.test.ts # Transaction controller tests
│   ├── auth.service.test.ts       # Authentication service tests
│   ├── cache.service.test.ts      # Cache service tests
│   ├── cursor-pagination.helper.test.ts # Pagination helper tests
│   └── error.middleware.test.ts   # Error middleware tests
├── integration/                   # Integration tests (future)
├── setup.ts                      # Test setup and configuration
└── test-runner.ts                # Custom test runner
```

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Unit Tests Only
```bash
npm run test:unit
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Generate Coverage Report
```bash
npm run test:coverage
```

### Run Custom Test Runner
```bash
npx ts-node tests/test-runner.ts
```

## Test Coverage

The tests cover:

### Services (Business Logic)
- ✅ **UsuarioService**: User creation, validation, CRUD operations
- ✅ **PropiedadService**: Property management, caching, search filters
- ✅ **AnuncioService**: Listing management, dual search methods, status updates
- ✅ **TransaccionService**: Transaction lifecycle, business rules, entity updates
- ✅ **AuthService**: Login, token generation, refresh token validation

### Controllers (HTTP Layer)
- ✅ **UsuarioController**: Request handling, response formatting
- ✅ **TransaccionController**: Role-based access control, business operations

### Utilities & Middleware
- ✅ **CacheService**: Redis operations, key generation, invalidation
- ✅ **CursorPaginationHelper**: Pagination logic, cursor encoding/decoding
- ✅ **Error Middleware**: Error handling, response formatting

## Test Features

### Mocking Strategy
- **External Dependencies**: Redis, bcrypt, JWT, TypeORM repositories
- **Service Dependencies**: Cross-service calls properly mocked
- **Environment Variables**: Test-specific configuration

### Coverage Areas
- **Happy Path**: Successful operations and expected flows
- **Error Handling**: Validation errors, not found scenarios, business rule violations
- **Edge Cases**: Invalid inputs, missing data, role restrictions
- **Business Logic**: Transaction state changes, property availability, cache invalidation

### Role-Based Testing
- **USER Role**: Can create transactions, limited access
- **ADMIN Role**: Can manage properties/listings, complete/cancel transactions
- **Authentication**: Token validation, refresh token handling

## Configuration

### Jest Configuration (`jest.config.js`)
- TypeScript support with ts-jest
- Coverage collection from src/ directory
- Test environment setup
- Module name mapping

### Test Setup (`tests/setup.ts`)
- Environment variables for testing
- reflect-metadata initialization
- Mock configurations

## Best Practices

### Test Structure
```typescript
describe('ServiceName', () => {
  let service: ServiceName;
  let mockDependency: jest.Mocked<DependencyType>;

  beforeEach(() => {
    // Setup mocks and service instance
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should handle success case', async () => {
      // Arrange, Act, Assert
    });

    it('should handle error case', async () => {
      // Test error scenarios
    });
  });
});
```

### Mocking Guidelines
- Mock external dependencies (Redis, databases)
- Mock service dependencies for unit isolation
- Use jest.clearAllMocks() in beforeEach
- Verify mock calls with proper parameters

### Assertions
- Test return values and side effects
- Verify service method calls
- Check error throwing for invalid inputs
- Validate response formatting in controllers

## Future Enhancements

### Integration Tests
- Database integration with test containers
- Full HTTP request/response testing
- End-to-end business flow validation

### Performance Tests
- Load testing for search endpoints
- Cache performance validation
- Database query optimization testing

### Security Tests
- Authentication bypass attempts
- Authorization boundary testing
- Input sanitization validation