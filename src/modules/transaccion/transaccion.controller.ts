import { Request, Response, NextFunction } from 'express';
import { TransaccionService } from './transaccion.service';
import { AuthenticatedRequest } from '../../core/interfaces';
import { UserRole } from '../usuario/usuario.interfaces';
import { ValidationError } from '../../core/errors';

export class TransaccionController {
  constructor(private transaccionService: TransaccionService) {}

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Validar que solo USER puede crear transacciones
      if (req.userRole !== UserRole.USER) {
        throw new ValidationError('Solo usuarios con rol USER pueden crear transacciones');
      }
      
      const { tenantId, userId } = req;
      const transaccion = await this.transaccionService.create({
        ...req.body,
        tenantId,
        userId,
      });
      res.status(201).json(transaccion);
    } catch (error) {
      next(error);
    }
  };

  findById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req;
      const transaccion = await this.transaccionService.findById(req.params.id, tenantId!);
      res.json(transaccion);
    } catch (error) {
      next(error);
    }
  };

  findAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req;
      const { cursor, limit } = req.query;
      const result = await this.transaccionService.findAll(tenantId!, cursor as string, limit ? parseInt(limit as string) : undefined);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  findByUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req;
      const transacciones = await this.transaccionService.findByUserId(req.params.userId, tenantId!);
      res.json(transacciones);
    } catch (error) {
      next(error);
    }
  };

  findByAnuncio = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req;
      const transacciones = await this.transaccionService.findByAnuncioId(req.params.anuncioId, tenantId!);
      res.json(transacciones);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req;
      const transaccion = await this.transaccionService.update(req.params.id, req.body, tenantId!);
      res.json(transaccion);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req;
      await this.transaccionService.delete(req.params.id, tenantId!);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  restore = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req;
      const transaccion = await this.transaccionService.restore(req.params.id, tenantId!);
      res.json(transaccion);
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Validar que solo ADMIN puede cancelar transacciones
      if (req.userRole !== UserRole.ADMIN) {
        throw new ValidationError('Solo usuarios con rol ADMIN pueden cancelar transacciones');
      }
      
      const { tenantId } = req;
      const transaccion = await this.transaccionService.cancel(req.params.id, tenantId!);
      res.json(transaccion);
    } catch (error) {
      next(error);
    }
  };

  complete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Validar que solo ADMIN puede completar transacciones
      if (req.userRole !== UserRole.ADMIN) {
        throw new ValidationError('Solo usuarios con rol ADMIN pueden completar transacciones');
      }
      
      const { tenantId } = req;
      const transaccion = await this.transaccionService.complete(req.params.id, tenantId!);
      res.json(transaccion);
    } catch (error) {
      next(error);
    }
  };
}