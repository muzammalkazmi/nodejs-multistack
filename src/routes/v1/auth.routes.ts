import { Router } from 'express';
import { register, login, logout, refresh } from '../../controllers/auth.controller';
import { validate } from '../../middleware/validate';
import { registerSchema, loginSchema } from '../../validations/auth.validation';
import { authRateLimiter } from '../../middleware/rateLimiter';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), register);
router.post('/login', authRateLimiter, validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', authMiddleware, logout);

export default router;
