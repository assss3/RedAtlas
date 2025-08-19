import { body, param, query } from 'express-validator';

export const createAnuncioValidation = [
  body('propertyId')
    .isUUID()
    .withMessage('Property ID must be a valid UUID')
    .notEmpty()
    .withMessage('Property ID is required'),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters')
];

export const updateAnuncioValidation = [
  param('id')
    .isUUID()
    .withMessage('Anuncio ID must be a valid UUID'),
  body('propertyId')
    .optional()
    .isUUID()
    .withMessage('Property ID must be a valid UUID'),
  body('description')
    .optional()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters')
];

export const getAnuncioValidation = [
  param('id')
    .isUUID()
    .withMessage('Anuncio ID must be a valid UUID')
];

export const searchAnunciosValidation = [
  query('cursor')
    .optional()
    .isString()
    .withMessage('Cursor must be a string'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('orderBy')
    .optional()
    .isIn(['createdAt', 'price'])
    .withMessage('OrderBy must be createdAt or price'),
  query('orderDirection')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('OrderDirection must be ASC or DESC'),
  query('status')
    .optional()
    .isIn(['activo', 'inactivo', 'reservado'])
    .withMessage('Status must be activo, inactivo, or reservado'),
  query('tipo')
    .optional()
    .isIn(['venta', 'alquiler'])
    .withMessage('Tipo must be venta or alquiler'),
  query('propertyId')
    .optional()
    .isUUID()
    .withMessage('Property ID must be a valid UUID'),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Min price must be a positive number')
    .toFloat(),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max price must be a positive number')
    .toFloat()
];