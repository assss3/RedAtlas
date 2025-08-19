import { body, param } from 'express-validator';

export const createPropertyValidation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('tipo')
    .isIn(['departamento', 'casa', 'terreno', 'local', 'oficina'])
    .withMessage('Tipo must be one of: departamento, casa, terreno, local, oficina'),
  body('superficie')
    .isNumeric()
    .withMessage('Superficie must be a number')
    .isFloat({ min: 0 })
    .withMessage('Superficie must be greater than 0'),
  body('pais')
    .notEmpty()
    .withMessage('Pais is required'),
  body('ciudad')
    .notEmpty()
    .withMessage('Ciudad is required'),
  body('calle')
    .notEmpty()
    .withMessage('Calle is required'),
  body('altura')
    .notEmpty()
    .withMessage('Altura is required'),
  body('ambientes')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Ambientes must be a positive integer'),
  body('location')
    .optional()
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
  body('tipo')
    .optional()
    .isIn(['departamento', 'casa', 'terreno', 'local', 'oficina'])
    .withMessage('Tipo must be one of: departamento, casa, terreno, local, oficina'),
  body('superficie')
    .optional()
    .isNumeric()
    .withMessage('Superficie must be a number')
    .isFloat({ min: 0 })
    .withMessage('Superficie must be greater than 0'),
  body('ambientes')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Ambientes must be a positive integer'),
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