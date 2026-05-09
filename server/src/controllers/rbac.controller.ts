import { Request, Response } from 'express';
import Role from '../models/Role.model';
import Permission from '../models/Permission.model';
import User from '../models/User.model';

// Roles
export const getRoles = async (req: Request, res: Response) => {
    try {
        const roles = await Role.find().populate('permissions');
        res.json(roles);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export const createRole = async (req: Request, res: Response) => {
    try {
        const { name, displayName, permissions, description } = req.body;
        const role = new Role({ name, displayName, permissions, description });
        await role.save();
        res.status(201).json(role);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
};

export const updateRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const role = await Role.findByIdAndUpdate(id, req.body, { new: true });
        res.json(role);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
};

// Permissions
export const getPermissions = async (req: Request, res: Response) => {
    try {
        const permissions = await Permission.find();
        res.json(permissions);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
};

export const createPermission = async (req: Request, res: Response) => {
    try {
        const perm = new Permission(req.body);
        await perm.save();
        res.status(201).json(perm);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
};

// Assignment
export const assignRoleToUser = async (req: Request, res: Response) => {
    try {
        const { userId, roleId } = req.body;
        const role = await Role.findById(roleId);
        if (!role) return res.status(404).json({ message: 'Role not found' });

        const user = await User.findByIdAndUpdate(userId, { 
            roleRef: roleId,
            role: role.name // Sync string field for compatibility
        }, { new: true });
        
        res.json(user);
    } catch (err: any) {
        res.status(400).json({ message: err.message });
    }
};
