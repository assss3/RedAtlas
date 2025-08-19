import { Router } from 'express';
import { AnuncioController } from './anuncio.controller';
import { AnuncioService } from './anuncio.service';
import { AnuncioRepository } from './anuncio.repository';
import { requireAdmin } from '../../config/role.middleware';
import { validate } from '../../config/express-validation.middleware';
import { createAnuncioValidation, updateAnuncioValidation, getAnuncioValidation } from './anuncio.validations';

const router = Router();
const anuncioRepository = new AnuncioRepository();
const anuncioService = new AnuncioService(anuncioRepository);
const anuncioController = new AnuncioController(anuncioService);

router.post('/', requireAdmin, validate(createAnuncioValidation), anuncioController.create);
router.get('/', anuncioController.findAll);
router.get('/property/:propertyId', anuncioController.findByProperty);
router.get('/:id', validate(getAnuncioValidation), anuncioController.findById);
router.put('/:id', requireAdmin, validate(updateAnuncioValidation), anuncioController.update);
router.delete('/:id', requireAdmin, validate(getAnuncioValidation), anuncioController.delete);
router.patch('/:id/restore', requireAdmin, validate(getAnuncioValidation), anuncioController.restore);

export { router as anuncioRoutes };