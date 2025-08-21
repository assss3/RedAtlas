import { Router } from 'express';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { ImportRepository } from './import.repository';
import { PropiedadRepository } from '../propiedad/propiedad.repository';
import { SQSService } from '../../shared/services/sqs.service';
import { requireRole } from '../../config/middlewares';
import { UserRole } from '../usuario/usuario.interfaces';

const router = Router();

const importRepository = new ImportRepository();
const propiedadRepository = new PropiedadRepository();
const sqsService = new SQSService();
const importService = new ImportService(importRepository, propiedadRepository, sqsService);
const importController = new ImportController(importService);

router.post('/', 
  requireRole([UserRole.ADMIN]), 
  importController.uploadMiddleware,
  importController.createImport
);

router.get('/history', importController.getImportHistory);
router.get('/:importId', importController.getImportStatus);

export { router as importRoutes };