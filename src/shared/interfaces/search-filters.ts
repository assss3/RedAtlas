export interface AnuncioSearchFilters {
  tenantId: string;
  status?: string;
  tipo?: string;
  propertyId?: string;
  minPrice?: number;
  maxPrice?: number;
  // Filtros de propiedad
  propertyTipo?: string;
  propertyStatus?: string;
  pais?: string;
  ciudad?: string;
  minSuperficie?: number;
  maxSuperficie?: number;
  ambientes?: number;
  // Paginación
  page?: number;
  limit?: number;
}

export interface SearchResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}