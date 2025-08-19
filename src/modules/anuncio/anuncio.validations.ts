import { body, param } from 'express-validator';

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