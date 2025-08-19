import { body, param } from 'express-validator';

export const createPropertyValidation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('price')
    .isNumeric()
    .withMessage('Price must be a number')
    .isFloat({ min: 0 })
    .withMessage('Price must be greater than 0'),
  body('location')
    .matches(/^POINT\(-?\d+\.?\d*\s-?\d+\.?\d*\)$/)
    .withMessage('Location must be in POINT(longitude latitude) format')
];

export const updatePropertyValidation = [
  param('id')
    .isUUID()
    .withMessage('Property ID must be a valid UUID'),
  body('title')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('price')
    .optional()
    .isNumeric()
    .withMessage('Price must be a number')
    .isFloat({ min: 0 })
    .withMessage('Price must be greater than 0'),
  body('location')
    .optional()
    .matches(/^POINT\(-?\d+\.?\d*\s-?\d+\.?\d*\)$/)
    .withMessage('Location must be in POINT(longitude latitude) format')
];

export const getPropertyValidation = [
  param('id')
    .isUUID()
    .withMessage('Property ID must be a valid UUID')
];