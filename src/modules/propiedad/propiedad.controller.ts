import { Request, Response, NextFunction } from 'express';
import { PropiedadService } from './propiedad.service';
import { AuthenticatedRequest } from '../../core/interfaces';

export class PropiedadController {
  constructor(private propiedadService: PropiedadService) {}

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req;
      const propiedad = await this.propiedadService.create({
        ...req.body,
        tenantId,
      });
      res.status(201).json(propiedad);
    } catch (error) {
      next(error);
    }
  };

  findById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req;
      const propiedad = await this.propiedadService.findById(req.params.id, tenantId!);
      res.json(propiedad);
    } catch (error) {
      next(error);
    }
  };

  findAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req;
      const propiedades = await this.propiedadService.findAll(tenantId!);
      res.json(propiedades);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req;
      const propiedad = await this.propiedadService.update(req.params.id, req.body, tenantId!);
      res.json(propiedad);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req;
      await this.propiedadService.delete(req.params.id, tenantId!);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  restore = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req;
      const propiedad = await this.propiedadService.restore(req.params.id, tenantId!);
      res.json(propiedad);
    } catch (error) {
      next(error);
    }
  };
}