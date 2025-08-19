import { Router } from 'express';
import { AnuncioController } from './anuncio.controller';
import { AnuncioService } from './anuncio.service';
import { AnuncioRepository } from './anuncio.repository';
import { validate } from '../../config/express-validation.middleware';
import { createAnuncioValidation, updateAnuncioValidation, getAnuncioValidation, searchAnunciosValidation } from './anuncio.validations';
import { requireRole } from '../../config/middlewares';
import { UserRole } from '../usuario/usuario.interfaces';

const router = Router();
const anuncioRepository = new AnuncioRepository();
const anuncioService = new AnuncioService(anuncioRepository);
const anuncioController = new AnuncioController(anuncioService);

router.post('/', requireRole([UserRole.ADMIN]), validate(createAnuncioValidation), anuncioController.create);
router.get('/search', anuncioController.search);
router.get('/searchAnuncios', validate(searchAnunciosValidation), anuncioController.searchAnuncios);
router.get('/', anuncioController.findAll);
router.get('/property/:propertyId', anuncioController.findByProperty);
router.get('/:id', validate(getAnuncioValidation), anuncioController.findById);
router.put('/:id', requireRole([UserRole.ADMIN]), validate(updateAnuncioValidation), anuncioController.update);
router.delete('/:id', requireRole([UserRole.ADMIN]), validate(getAnuncioValidation), anuncioController.delete);
router.patch('/:id/restore', requireRole([UserRole.ADMIN]), validate(getAnuncioValidation), anuncioController.restore);

export { router as anuncioRoutes };