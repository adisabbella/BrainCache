import { Router } from 'express';
import { contentController } from '../controllers/contentController';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { CreateContentSchema, UpdateContentSchema } from '../validators/contentSchemas';

const router = Router();

// All content endpoints require authentication.
router.use(authenticate);

// GET /api/content
router.get('/', contentController.list);

// GET /api/content/random
// IMPORTANT: this must be registered BEFORE /:id so Express does not treat
// the literal string "random" as a dynamic :id parameter.
router.get('/random', contentController.getRandom);

// GET /api/content/:id
router.get('/:id', contentController.getOne);

// POST /api/content
router.post('/', validate(CreateContentSchema), contentController.create);

// PATCH /api/content/:id
router.patch('/:id', validate(UpdateContentSchema), contentController.update);

// DELETE /api/content/:id
router.delete('/:id', contentController.delete);

// POST /api/content/:id/share — enable sharing
router.post('/:id/share', contentController.enableSharing);

// DELETE /api/content/:id/share — disable sharing
router.delete('/:id/share', contentController.disableSharing);

export default router;
