import { Request, Response, NextFunction } from 'express';
import { Readable } from 'stream';
import multer from 'multer';
import { ImportService } from './import.service';
import { AuthenticatedRequest } from '../../core/interfaces';
import { ValidationError } from '../../core/errors';
import { FileHashService } from '../../shared/services/file-hash.service';

interface MulterRequest extends AuthenticatedRequest {
  file?: Express.Multer.File;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req: any, file: any, cb: any) => {
    console.log('File filter - mimetype:', file.mimetype, 'filename:', file.originalname);
    if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
      return cb(new Error('Only CSV files are allowed'));
    }
    cb(null, true);
  },
});

export class ImportController {
  constructor(private importService: ImportService) {}

  uploadMiddleware = upload.single('file');

  createImport = async (req: MulterRequest, res: Response, next: NextFunction) => {
    try {
      console.log('Import request received');
      console.log('File:', { name: req.file?.originalname, size: req.file?.size });
      
      const { tenantId, userId } = req;

      if (!req.file) {
        throw new ValidationError('CSV file is required');
      }

      // Calcular hash del archivo para deduplicación
      const { hash: fileHash, size: fileSize } = FileHashService.getFileInfo(req.file.buffer);
      console.log(`File hash: ${fileHash}, size: ${fileSize} bytes`);
      
      // Verificar si el archivo ya fue procesado
      const existingImport = await this.importService.findByFileHash(tenantId!, fileHash);
      if (existingImport) {
        return res.status(409).json({
          type: '/errors/duplicate-file',
          title: 'Duplicate file',
          status: 409,
          detail: `File already processed in import ${existingImport.id}`,
          instance: req.originalUrl,
          existingImport: {
            id: existingImport.id,
            filename: existingImport.filename,
            status: existingImport.status,
            createdAt: existingImport.createdAt
          }
        });
      }

      const fileStream = new Readable({
        read() {
          this.push(req.file!.buffer);
          this.push(null);
        }
      });

      const result = await this.importService.processCSVImport(
        fileStream,
        req.file.originalname,
        tenantId!,
        userId!,
        fileHash,
        fileSize
      );

      res.status(202).json(result);
    } catch (error) {
      console.error('Import error:', error);
      next(error);
    }
  };

  getImportStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req;
      const { importId } = req.params;

      const status = await this.importService.getImportStatus(importId, tenantId!);
      res.json(status);
    } catch (error) {
      next(error);
    }
  };

  getImportHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req;
      const history = await this.importService.getImportHistory(tenantId!);
      res.json(history);
    } catch (error) {
      next(error);
    }
  };
}