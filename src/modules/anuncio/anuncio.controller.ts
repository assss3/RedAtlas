import { Request, Response, NextFunction } from 'express';
import { AnuncioService } from './anuncio.service';
import { AuthenticatedRequest } from '../../core/interfaces';

export class AnuncioController {
  constructor(private anuncioService: AnuncioService) {}

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req;
      const anuncio = await this.anuncioService.create({
        ...req.body,
        tenantId,
      });
      res.status(201).json(anuncio);
    } catch (error) {
      next(error);
    }
  };

  findById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req;
      const anuncio = await this.anuncioService.findById(req.params.id, tenantId!);
      res.json(anuncio);
    } catch (error) {
      next(error);
    }
  };

  findAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req;
      const { cursor, limit } = req.query;
      const result = await this.anuncioService.findAll(tenantId!, cursor as string, limit ? parseInt(limit as string) : undefined);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  findByProperty = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req;
      const anuncios = await this.anuncioService.findByPropertyId(req.params.propertyId, tenantId!);
      res.json(anuncios);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req;
      const anuncio = await this.anuncioService.update(req.params.id, req.body, tenantId!);
      res.json(anuncio);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req;
      await this.anuncioService.delete(req.params.id, tenantId!);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  restore = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req;
      const anuncio = await this.anuncioService.restore(req.params.id, tenantId!);
      res.json(anuncio);
    } catch (error) {
      next(error);
    }
  };

  searchWithPropertiesFilters = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req;
      const filters = { ...req.query, tenantId: tenantId! };
      const result = await this.anuncioService.searchWithPropertiesFilters(filters as any);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  searchWithFilters = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req;
      const filters = { ...req.query, tenantId: tenantId! };
      const result = await this.anuncioService.searchWithFilters(filters as any);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}