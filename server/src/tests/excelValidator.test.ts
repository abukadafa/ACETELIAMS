import { describe, it, expect } from 'vitest';
import excelValidator, { ValidationRule } from '../services/excelValidator';

describe('ExcelValidator', () => {
  const rules: ValidationRule[] = [
    { field: 'email', label: 'Email', required: true, type: 'email' },
    { field: 'age', label: 'Age', type: 'number' },
    { field: 'role', label: 'Role', enum: ['Admin', 'User'] }
  ];

  it('should validate correct data', () => {
    const data = [
      { Email: 'test@example.com', Age: 25, Role: 'Admin' },
      { Email: 'user@example.com', Age: '30', Role: 'User' }
    ];
    const { valid, errors } = excelValidator.validate(data, rules);
    expect(valid.length).toBe(2);
    expect(errors.length).toBe(0);
  });

  it('should catch missing required fields', () => {
    const data = [
      { Age: 25, Role: 'Admin' }
    ];
    const { valid, errors } = excelValidator.validate(data, rules);
    expect(valid.length).toBe(0);
    expect(errors.length).toBe(1);
    expect(errors[0].message).toBe('is required');
  });

  it('should catch invalid email formats', () => {
    const data = [
      { Email: 'invalid-email', Age: 25 }
    ];
    const { valid, errors } = excelValidator.validate(data, rules);
    expect(errors.length).toBe(1);
    expect(errors[0].message).toBe('must be a valid email');
  });

  it('should catch invalid enum values', () => {
    const data = [
      { Email: 'test@example.com', Role: 'Superuser' }
    ];
    const { valid, errors } = excelValidator.validate(data, rules);
    expect(errors.length).toBe(1);
    expect(errors[0].message).toContain('must be one of');
  });
});
