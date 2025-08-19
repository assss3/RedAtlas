import { Request, Response, NextFunction } from 'express';
import { UsuarioService } from './usuario.service';
import { AuthenticatedRequest } from '../../core/interfaces';

export class UsuarioController {
  constructor(private usuarioService: UsuarioService) {}

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req;
      const usuario = await this.usuarioService.create({
        ...req.body,
        tenantId,
      });
      res.status(201).json(usuario);
    } catch (error) {
      next(error);
    }
  };

  findById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req;
      const usuario = await this.usuarioService.findById(req.params.id, tenantId!);
      res.json(usuario);
    } catch (error) {
      next(error);
    }
  };

  findAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req;
      const usuarios = await this.usuarioService.findAll(tenantId!);
      res.json(usuarios);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req;
      const usuario = await this.usuarioService.update(req.params.id, req.body, tenantId!);
      res.json(usuario);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req;
      await this.usuarioService.delete(req.params.id, tenantId!);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}