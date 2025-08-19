export interface OrderParams {
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface OrderConfig {
  allowedFields: string[];
  defaultField: string;
  defaultDirection: 'ASC' | 'DESC';
}

export class OrderValidationHelper {
  static validateAndGetOrder(
    params: OrderParams,
    config: OrderConfig
  ): { field: string; direction: 'ASC' | 'DESC' } {
    const { orderBy, orderDirection } = params;
    
    // Validar campo de ordenamiento
    const field = orderBy && config.allowedFields.includes(orderBy) 
      ? orderBy 
      : config.defaultField;
    
    // Validar dirección
    const direction = orderDirection && ['ASC', 'DESC'].includes(orderDirection)
      ? orderDirection
      : config.defaultDirection;
    
    return { field, direction };
  }
}