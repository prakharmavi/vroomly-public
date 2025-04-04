import * as React from "react";
import { Input } from "./input";

interface NumericInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  onChange: (value: number | null) => void;
  value: number | null;
  allowEmpty?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export function NumericInput({
  className,
  value,
  onChange,
  allowEmpty = true,
  min,
  max,
  step,
  ...props
}: NumericInputProps) {
  // Convert null to empty string for display
  const displayValue = value === null ? "" : value.toString();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Handle empty input
    if (inputValue === "") {
      if (allowEmpty) {
        onChange(null);
      } else {
        onChange(0);
      }
      return;
    }

    // Parse numeric value
    const numericValue = parseFloat(inputValue);
    
    // Validate numeric value
    if (!isNaN(numericValue)) {
      // Check min/max bounds if specified
      if (min !== undefined && numericValue < min) {
        onChange(min);
      } else if (max !== undefined && numericValue > max) {
        onChange(max);
      } else {
        onChange(numericValue);
      }
    }
  };

  return (
    <Input
      type="number"
      className={className}
      value={displayValue}
      onChange={handleChange}
      min={min}
      max={max}
      step={step}
      {...props}
    />
  );
}
