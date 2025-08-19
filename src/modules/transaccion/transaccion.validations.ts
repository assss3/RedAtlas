import { body, param } from 'express-validator';

export const createTransaccionValidation = [
  body('anuncioId')
    .isUUID()
    .withMessage('Anuncio ID must be a valid UUID')
    .notEmpty()
    .withMessage('Anuncio ID is required'),
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .isFloat({ min: 0 })
    .withMessage('Amount must be greater than 0'),
  body('status')
    .optional()
    .isIn(['pending', 'completed', 'cancelled'])
    .withMessage('Status must be pending, completed, or cancelled')
];

export const updateTransaccionValidation = [
  param('id')
    .isUUID()
    .withMessage('Transaction ID must be a valid UUID'),
  body('amount')
    .optional()
    .isNumeric()
    .withMessage('Amount must be a number')
    .isFloat({ min: 0 })
    .withMessage('Amount must be greater than 0'),
  body('status')
    .optional()
    .isIn(['pending', 'completed', 'cancelled'])
    .withMessage('Status must be pending, completed, or cancelled')
];

export const getTransaccionValidation = [
  param('id')
    .isUUID()
    .withMessage('Transaction ID must be a valid UUID')
];