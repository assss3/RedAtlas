import { PropertyImportRow, ProcessedPropertyRow, ImportError } from './import.interfaces';
import { PropertyType } from '../propiedad/propiedad.interfaces';

export class ImportValidator {
  private static readonly REQUIRED_FIELDS = ['title', 'tipo', 'superficie', 'pais', 'ciudad', 'calle', 'altura'];
  private static readonly VALID_TIPOS = Object.values(PropertyType);

  static validateRow(row: PropertyImportRow, rowNumber: number): { isValid: boolean; errors: ImportError[]; data?: ProcessedPropertyRow } {
    const errors: ImportError[] = [];
    
    for (const field of this.REQUIRED_FIELDS) {
      if (!row[field as keyof PropertyImportRow] || row[field as keyof PropertyImportRow]?.toString().trim() === '') {
        errors.push({
          row: rowNumber,
          field,
          message: `Field '${field}' is required`
        });
      }
    }

    if (row.tipo && !this.VALID_TIPOS.includes(row.tipo as PropertyType)) {
      errors.push({
        row: rowNumber,
        field: 'tipo',
        message: `Invalid tipo '${row.tipo}'. Must be one of: ${this.VALID_TIPOS.join(', ')}`
      });
    }

    const superficie = parseFloat(row.superficie);
    if (isNaN(superficie) || superficie <= 0) {
      errors.push({
        row: rowNumber,
        field: 'superficie',
        message: 'Superficie must be a positive number'
      });
    }

    let ambientes: number | undefined;
    if (row.ambientes) {
      ambientes = parseInt(row.ambientes);
      if (isNaN(ambientes) || ambientes <= 0) {
        errors.push({
          row: rowNumber,
          field: 'ambientes',
          message: 'Ambientes must be a positive integer'
        });
      }
    }

    let location: string | undefined;
    if (row.latitude && row.longitude) {
      const lat = parseFloat(row.latitude);
      const lng = parseFloat(row.longitude);
      
      if (isNaN(lat) || lat < -90 || lat > 90) {
        errors.push({
          row: rowNumber,
          field: 'latitude',
          message: 'Latitude must be between -90 and 90'
        });
      }
      
      if (isNaN(lng) || lng < -180 || lng > 180) {
        errors.push({
          row: rowNumber,
          field: 'longitude',
          message: 'Longitude must be between -180 and 180'
        });
      }
      
      if (!isNaN(lat) && !isNaN(lng)) {
        location = `POINT(${lng} ${lat})`;
      }
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    const processedData: ProcessedPropertyRow = {
      title: row.title.trim(),
      tipo: row.tipo as PropertyType,
      superficie,
      pais: row.pais.trim(),
      ciudad: row.ciudad.trim(),
      calle: row.calle.trim(),
      altura: row.altura.trim(),
      ambientes,
      location,
      tenantId: '',
    };

    return { isValid: true, errors: [], data: processedData };
  }
}