export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'email' | 'date';
  regex?: RegExp;
  enum?: string[];
  label?: string;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

class ExcelValidator {
  validate(data: any[], rules: ValidationRule[]): { valid: any[], errors: ValidationError[] } {
    const validData: any[] = [];
    const errors: ValidationError[] = [];

    data.forEach((row, index) => {
      let rowValid = true;
      const rowNum = index + 2; // +1 for 0-index, +1 for header row

      rules.forEach(rule => {
        const value = row[rule.label || rule.field];
        const isMissing = value === undefined || value === null || String(value).trim() === "";

        if (rule.required && isMissing) {
          errors.push({ row: rowNum, field: rule.label || rule.field, message: "is required" });
          rowValid = false;
        } else if (!isMissing) {
          if (rule.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
            errors.push({ row: rowNum, field: rule.label || rule.field, message: "must be a valid email" });
            rowValid = false;
          } else if (rule.type === 'number' && isNaN(Number(value))) {
            errors.push({ row: rowNum, field: rule.label || rule.field, message: "must be a number" });
            rowValid = false;
          } else if (rule.enum && !rule.enum.includes(String(value))) {
            errors.push({ row: rowNum, field: rule.label || rule.field, message: `must be one of: ${rule.enum.join(", ")}` });
            rowValid = false;
          } else if (rule.regex && !rule.regex.test(String(value))) {
            errors.push({ row: rowNum, field: rule.label || rule.field, message: "is in an invalid format" });
            rowValid = false;
          }
        }
      });

      if (rowValid) {
        validData.push(row);
      }
    });

    return { valid: validData, errors };
  }

  formatErrorReport(errors: ValidationError[]): string {
    if (errors.length === 0) return "No errors found.";
    return errors.map(e => `Row ${e.row}: ${e.field} ${e.message}`).join("; ");
  }
}

export default new ExcelValidator();
