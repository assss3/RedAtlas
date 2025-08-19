import { Router } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { authenticateToken } from '../../config/auth.middleware';
import { validate } from '../../config/express-validation.middleware';
import { loginValidation, refreshTokenValidation } from './auth.validations';

const router = Router();
const authService = new AuthService();
const authController = new AuthController(authService);

router.post('/login', validate(loginValidation), authController.login);
router.post('/refresh', validate(refreshTokenValidation), authController.refresh);
router.post('/logout', authenticateToken, authController.logout);

export { router as authRoutes };