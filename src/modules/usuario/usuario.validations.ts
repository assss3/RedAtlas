import { body, param } from 'express-validator';

export const createUserValidation = [
  body('nombre')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 30 })
    .withMessage('Name must be between 2 and 30 characters'),
  body('email')
    .isEmail()
    .withMessage('Email must be a valid email address')
    .notEmpty()
    .withMessage('Email is required'),
  body('passwordHash')
    .isLength({ min: 6 , max: 20 })
    .withMessage('Password must be between 6 and 20 characters long')
    .notEmpty()
    .withMessage('Password is required'),
  body('rol')
    .isIn(['ADMIN', 'USER'])
    .withMessage('Role must be either ADMIN or USER')
];

export const updateUserValidation = [
  param('id')
    .isUUID()
    .withMessage('User ID must be a valid UUID'),
  body('nombre')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email must be a valid email address'),
  body('rol')
    .optional()
    .isIn(['ADMIN', 'USER'])
    .withMessage('Role must be either ADMIN or USER')
];

export const getUserValidation = [
  param('id')
    .isUUID()
    .withMessage('User ID must be a valid UUID')
];