import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface FormSelectProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  disabled?: boolean;
  required?: boolean;
  className?: string;
  error?: string;
}

export function FormSelect({
  id,
  name,
  label,
  value,
  onChange,
  options,
  disabled = false,
  required = false,
  className,
  error,
}: FormSelectProps) {
  const handleValueChange = (newValue: string) => {
    onChange(newValue);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      
      <Select 
        value={value} 
        onValueChange={handleValueChange}
        disabled={disabled}
        name={name}
      >
        <SelectTrigger 
          id={id}
          className={cn(
            "w-full p-2 text-base",
            error ? "border-destructive ring-destructive/10" : ""
          )}
        >
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {error && (
        <p className="text-destructive text-xs">{error}</p>
      )}
    </div>
  );
}
