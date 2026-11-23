export interface ValidationResult {
  valid: boolean;
  error?: string;
  normalized?: string;
}

export function validateQuarterHours(
  input: string | number,
  step = 0.25,
  maxDailyHours = 24.0
): ValidationResult {
  const str = String(input).trim();
  if (str === "") {
    return { valid: true, normalized: "0.00" };
  }

  const num = Number(str);
  if (isNaN(num)) {
    return { valid: false, error: "Must be a valid number" };
  }

  if (num < 0) {
    return { valid: false, error: "Hours cannot be negative" };
  }

  if (num > maxDailyHours) {
    return { valid: false, error: `Hours cannot exceed ${maxDailyHours}` };
  }

  const stepPrecision = 1000;
  const numRounded = Math.round(num * stepPrecision);
  const stepRounded = Math.round(step * stepPrecision);

  if (numRounded % stepRounded !== 0) {
    return {
      valid: false,
      error: `Hours must be in increments of ${step}`,
    };
  }

  return { valid: true, normalized: num.toFixed(2) };
}

export function parseClipboardHours(text: string): string[][] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
  return lines.map((line) => {
    if (line.includes("\t")) {
      return line.split("\t").map((cell) => cell.trim());
    }
    if (line.includes(",")) {
      return line.split(",").map((cell) => cell.trim());
    }
    return [line.trim()];
  });
}
