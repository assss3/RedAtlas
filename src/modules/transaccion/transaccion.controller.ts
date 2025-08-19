import { Request, Response, NextFunction } from 'express';
import { TransaccionService } from './transaccion.service';
import { AuthenticatedRequest } from '../../core/interfaces';

export class TransaccionController {
  constructor(private transaccionService: TransaccionService) {}

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
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
      const transacciones = await this.transaccionService.findAll(tenantId!);
      res.json(transacciones);
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
}