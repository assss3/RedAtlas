import { Router } from 'express';
import { TransaccionController } from './transaccion.controller';
import { TransaccionService } from './transaccion.service';
import { TransaccionRepository } from './transaccion.repository';
import { AnuncioService } from '../anuncio/anuncio.service';
import { AnuncioRepository } from '../anuncio/anuncio.repository';
import { PropiedadService } from '../propiedad/propiedad.service';
import { PropiedadRepository } from '../propiedad/propiedad.repository';
import { requireRole } from '../../config/middlewares';
import { UserRole } from '../usuario/usuario.interfaces';
import { validate } from '../../config/express-validation.middleware';
import { searchTransaccionValidation } from './transaccion.validations';

const router = Router();
const transaccionRepository = new TransaccionRepository();
const anuncioRepository = new AnuncioRepository();
const propiedadRepository = new PropiedadRepository();
const propiedadService = new PropiedadService(propiedadRepository);
const anuncioService = new AnuncioService(anuncioRepository, propiedadService);
const transaccionService = new TransaccionService(transaccionRepository, anuncioService, propiedadService);
const transaccionController = new TransaccionController(transaccionService);

router.post('/', requireRole([UserRole.USER]), transaccionController.create);
router.get('/search', validate(searchTransaccionValidation), transaccionController.searchWithFilters);
router.get('/', transaccionController.findAll);
router.get('/user/:userId', transaccionController.findByUser);
router.get('/anuncio/:anuncioId', transaccionController.findByAnuncio);
router.get('/:id', transaccionController.findById);
router.put('/:id', requireRole([UserRole.ADMIN]), transaccionController.update);
router.delete('/:id', requireRole([UserRole.ADMIN]), transaccionController.delete);
router.patch('/:id/restore',requireRole([UserRole.ADMIN]), transaccionController.restore);
router.patch('/:id/cancel', requireRole([UserRole.ADMIN]), transaccionController.cancel);
router.patch('/:id/complete', requireRole([UserRole.ADMIN]), transaccionController.complete);

export { router as transaccionRoutes };