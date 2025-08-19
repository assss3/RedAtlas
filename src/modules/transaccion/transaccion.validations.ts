import { body, param, query } from 'express-validator';
import { TransactionStatus } from './transaccion.interfaces';

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
    .withMessage('Amount must be greater than 0')
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
    .withMessage('Amount must be greater than 0')
];

export const getTransaccionValidation = [
  param('id')
    .isUUID()
    .withMessage('Transaction ID must be a valid UUID')
];

export const cancelTransaccionValidation = [
  param('id')
    .isUUID()
    .withMessage('Transaction ID must be a valid UUID')
];

export const completeTransaccionValidation = [
  param('id')
    .isUUID()
    .withMessage('Transaction ID must be a valid UUID')
];

export const searchTransaccionValidation = [
  query('cursor')
    .optional()
    .isString()
    .withMessage('Cursor must be a string'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('status')
    .optional()
    .isIn(['pendiente', 'completada', 'cancelada'])
    .withMessage('Status must be pendiente, completada, or cancelada'),
  query('userId')
    .optional()
    .isUUID()
    .withMessage('User ID must be a valid UUID'),
  query('anuncioId')
    .optional()
    .isUUID()
    .withMessage('Anuncio ID must be a valid UUID'),
  query('minAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Min amount must be a positive number')
    .toFloat(),
  query('maxAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max amount must be a positive number')
    .toFloat()
];