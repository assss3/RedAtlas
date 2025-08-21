export interface ImportJob {
  id: string;
  tenantId: string;
  userId: string;
  idempotencyKey: string;
  filename: string;
  status: ImportStatus;
  totalRows: number;
  processedRows: number;
  successRows: number;
  errorRows: number;
  errors: ImportError[];
  createdAt: Date;
  updatedAt: Date;
}

export enum ImportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  data?: any;
}

export interface PropertyImportRow {
  title: string;
  tipo: string;
  superficie: string;
  pais: string;
  ciudad: string;
  calle: string;
  altura: string;
  ambientes?: string;
  latitude?: string;
  longitude?: string;
}

export interface ProcessedPropertyRow {
  title: string;
  tipo: string;
  superficie: number;
  pais: string;
  ciudad: string;
  calle: string;
  altura: string;
  ambientes?: number;
  location?: string;
  tenantId: string;
  estimatedValue?: number;
}

export interface BatchProcessMessage {
  importId: string;
  tenantId: string;
  batch: ProcessedPropertyRow[];
  batchNumber: number;
  totalBatches: number;
}