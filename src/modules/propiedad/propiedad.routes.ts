import { Router } from 'express';
import { PropiedadController } from './propiedad.controller';
import { PropiedadService } from './propiedad.service';
import { PropiedadRepository } from './propiedad.repository';
import { validate } from '../../config/express-validation.middleware';
import { createPropertyValidation, updatePropertyValidation, getPropertyValidation, searchPropiedadValidation } from './propiedad.validations';
import { UserRole } from '../usuario/usuario.interfaces';
import { requireRole } from '../../config/middlewares';

const router = Router();
const propiedadRepository = new PropiedadRepository();
const propiedadService = new PropiedadService(propiedadRepository);
const propiedadController = new PropiedadController(propiedadService);

router.post('/', requireRole([UserRole.ADMIN]), validate(createPropertyValidation), propiedadController.create);
router.get('/search', validate(searchPropiedadValidation), propiedadController.searchWithFilters);
router.get('/', propiedadController.findAll);
router.get('/:id', validate(getPropertyValidation), propiedadController.findById);
router.put('/:id', requireRole([UserRole.ADMIN]), validate(updatePropertyValidation), propiedadController.update);
router.delete('/:id', requireRole([UserRole.ADMIN]), validate(getPropertyValidation), propiedadController.delete);
router.patch('/:id/restore', requireRole([UserRole.ADMIN]), validate(getPropertyValidation), propiedadController.restore);

export { router as propiedadRoutes };