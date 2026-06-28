import { Router } from 'express';
import { getAllUsers, getUserById, updateUser, deleteUser } from '../../controllers/user.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { cacheMiddleware } from '../../cache/cache.middleware';
import { validate } from '../../middleware/validate';
import { getUserSchema, updateUserSchema } from '../../validations/user.validation';

const router = Router();

// Protect all user routes
router.use(authMiddleware);

// Apply caching for GET requests (5 minutes TTL)
router.get('/', cacheMiddleware(300), getAllUsers);
router.get('/:id', validate(getUserSchema), cacheMiddleware(300), getUserById);

router.put('/:id', validate(updateUserSchema), updateUser);
router.delete('/:id', validate(getUserSchema), deleteUser);

export default router;
