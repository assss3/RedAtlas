import { Router } from 'express';
import { UsuarioController } from './usuario.controller';
import { UsuarioService } from './usuario.service';
import { UsuarioRepository } from './usuario.repository';
import { requireAdmin } from '../../config/role.middleware';
import { validate } from '../../config/express-validation.middleware';
import { createUserValidation, updateUserValidation, getUserValidation } from './usuario.validations';

const router = Router();
const usuarioRepository = new UsuarioRepository();
const usuarioService = new UsuarioService(usuarioRepository);
const usuarioController = new UsuarioController(usuarioService);

router.post('/', requireAdmin, validate(createUserValidation), usuarioController.create);
router.get('/', usuarioController.findAll);
router.get('/:id', validate(getUserValidation), usuarioController.findById);
router.put('/:id', validate(updateUserValidation), usuarioController.update);
router.delete('/:id', validate(getUserValidation), usuarioController.delete);

export { router as usuarioRoutes };