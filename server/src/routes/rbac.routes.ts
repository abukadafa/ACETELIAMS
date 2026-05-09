import express from 'express';
import { 
    getRoles, createRole, updateRole, 
    getPermissions, createPermission, assignRoleToUser 
} from '../controllers/rbac.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// Only system admins can manage roles and permissions
router.use(authenticate, authorize('admin'));

router.get('/roles', getRoles);
router.post('/roles', createRole);
router.put('/roles/:id', updateRole);

router.get('/permissions', getPermissions);
router.post('/permissions', createPermission);

router.post('/assign', assignRoleToUser);

export default router;
