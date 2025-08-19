import { Router } from 'express';
import { TransaccionController } from './transaccion.controller';
import { TransaccionService } from './transaccion.service';
import { TransaccionRepository } from './transaccion.repository';
import { requireRole } from '../../config/middlewares';
import { UserRole } from '../../core/interfaces';

const router = Router();
const transaccionRepository = new TransaccionRepository();
const transaccionService = new TransaccionService(transaccionRepository);
const transaccionController = new TransaccionController(transaccionService);

router.post('/', requireRole([UserRole.USER, UserRole.ADMIN]), transaccionController.create);
router.get('/', transaccionController.findAll);
router.get('/user/:userId', transaccionController.findByUser);
router.get('/anuncio/:anuncioId', transaccionController.findByAnuncio);
router.get('/:id', transaccionController.findById);
router.put('/:id', transaccionController.update);
router.delete('/:id', transaccionController.delete);
router.patch('/:id/restore', transaccionController.restore);

export { router as transaccionRoutes };