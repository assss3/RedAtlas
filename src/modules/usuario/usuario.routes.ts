import { Router } from 'express';
import { UsuarioController } from './usuario.controller';
import { UsuarioService } from './usuario.service';
import { UsuarioRepository } from './usuario.repository';
import { validate } from '../../config/express-validation.middleware';
import { createUserValidation, updateUserValidation, getUserValidation } from './usuario.validations';
import { UserRole } from '../usuario/usuario.interfaces';
import { requireRole } from '../../config/middlewares';

const router = Router();
const usuarioRepository = new UsuarioRepository();
const usuarioService = new UsuarioService(usuarioRepository);
const usuarioController = new UsuarioController(usuarioService);

router.post('/', requireRole([UserRole.ADMIN]), validate(createUserValidation), usuarioController.create);
router.get('/', usuarioController.findAll);
router.get('/:id', validate(getUserValidation), usuarioController.findById);
router.put('/:id', validate(updateUserValidation), usuarioController.update);
router.delete('/:id', validate(getUserValidation), usuarioController.delete);

export { router as usuarioRoutes };