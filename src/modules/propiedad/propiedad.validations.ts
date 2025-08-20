import { body, param, query } from 'express-validator';

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

export const searchPropiedadValidation = [
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
    .isIn(['createdAt', 'superficie', 'tipo'])
    .withMessage('OrderBy must be createdAt, superficie, or tipo'),
  query('orderDirection')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('OrderDirection must be ASC or DESC'),
  query('status')
    .optional()
    .isIn(['disponible', 'no_disponible'])
    .withMessage('Status must be disponible or no_disponible'),
  query('tipo')
    .optional()
    .isIn(['departamento', 'casa', 'terreno', 'local', 'oficina'])
    .withMessage('Tipo must be departamento, casa, terreno, local, or oficina'),
  query('pais')
    .optional()
    .isString()
    .withMessage('Pais must be a string'),
  query('ciudad')
    .optional()
    .isString()
    .withMessage('Ciudad must be a string'),
  query('calle')
    .optional()
    .isString()
    .withMessage('Calle must be a string'),
  query('title')
    .optional()
    .isString()
    .withMessage('Title must be a string'),
  query('minSuperficie')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Min superficie must be a positive number')
    .toFloat(),
  query('maxSuperficie')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max superficie must be a positive number')
    .toFloat(),
  query('ambientes')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Ambientes must be a positive integer')
    .toInt()
];

export const geoSearchValidation = [
  query('lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90')
    .toFloat(),
  query('lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180')
    .toFloat(),
  query('radius')
    .isFloat({ min: 0.1, max: 50000 })
    .withMessage('Radius must be between 0.1 and 50000 meters')
    .toFloat(),
  query('cursor')
    .optional()
    .isString()
    .withMessage('Cursor must be a string'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt()
];