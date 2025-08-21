# Swagger Documentation Updates

## Changes Made

### API Description Updates
- Added section explaining unified search approach
- Documented that `GET /` endpoints internally use `searchWithFilters` without filters
- Explained the relationship between listing endpoints and property-enhanced search

### Endpoint Changes

#### Listings Module
**Before:**
- `/api/listings/search` → Basic search with properties filters
- `/api/listings/searchAnuncios` → Advanced search with validation

**After:**
- `/api/listings/search` → Standard search with validation and ordering
- `/api/listings/searchWithPropertiesFilters` → Enhanced search including property filters

#### Updated Descriptions
All search endpoints now clarify that:
- When no filters are provided, they return all records (equivalent to `findAll`)
- Support cursor-based pagination
- Include proper validation and ordering

### New Parameters for Property-Enhanced Search
Added property filter parameters to `/api/listings/searchWithPropertiesFilters`:
- `propertyTipo`: Property type filter
- `propertyStatus`: Property status filter  
- `pais`: Country filter
- `ciudad`: City filter
- `minSuperficie`: Minimum surface area
- `maxSuperficie`: Maximum surface area
- `ambientes`: Number of rooms

### Behavioral Documentation
- Clarified that search endpoints without filters behave like the old `findAll` methods
- Maintained all existing response schemas and error handling
- Preserved backward compatibility for existing API consumers

## Impact
- API documentation now accurately reflects the unified search implementation
- Developers can understand the relationship between listing and property-enhanced search
- Clear guidance on when to use each search endpoint