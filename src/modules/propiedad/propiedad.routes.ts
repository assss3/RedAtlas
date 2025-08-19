import { Router } from 'express';
import { PropiedadController } from './propiedad.controller';
import { PropiedadService } from './propiedad.service';
import { PropiedadRepository } from './propiedad.repository';
import { requireAdmin } from '../../config/role.middleware';
import { validate } from '../../config/express-validation.middleware';
import { createPropertyValidation, updatePropertyValidation, getPropertyValidation } from './propiedad.validations';

const router = Router();
const propiedadRepository = new PropiedadRepository();
const propiedadService = new PropiedadService(propiedadRepository);
const propiedadController = new PropiedadController(propiedadService);

router.post('/', requireAdmin, validate(createPropertyValidation), propiedadController.create);
router.get('/', propiedadController.findAll);
router.get('/:id', validate(getPropertyValidation), propiedadController.findById);
router.put('/:id', requireAdmin, validate(updatePropertyValidation), propiedadController.update);
router.delete('/:id', requireAdmin, validate(getPropertyValidation), propiedadController.delete);
router.patch('/:id/restore', requireAdmin, validate(getPropertyValidation), propiedadController.restore);

export { router as propiedadRoutes };