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
      const { cursor, limit } = req.query;
      const result = await this.propiedadService.findAll(tenantId!, cursor as string, limit ? parseInt(limit as string) : undefined);
      res.json(result);
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

  searchWithFilters = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req;
      const filters = { ...req.query, tenantId: tenantId! };
      const result = await this.propiedadService.searchWithFilters(filters as any);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  findNearby = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req;
      const { lat, lng, radius, cursor, limit } = req.query;
      const result = await this.propiedadService.findNearby(
        parseFloat(lat as string),
        parseFloat(lng as string), 
        parseFloat(radius as string),
        tenantId!,
        cursor as string,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}