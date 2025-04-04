/**
 * Utility functions for working with car data
 */

import fs from 'fs';
import path from 'path';

// Load car data from CSV file
let CAR_DATA = '';
try {
  // In Node.js environments
  if (typeof window === 'undefined') {
    CAR_DATA = fs.readFileSync(
      path.join(process.cwd(), 'src', 'dataset', 'car details simplified.csv'),
      'utf8'
    );
  } 
  // In browser environments where window.__CAR_DATA__ might be injected
  else if (window && window.__CAR_DATA__) {
    CAR_DATA = window.__CAR_DATA__;
  }
} catch (error) {
  console.error('Failed to load car data:', error);
  // Fallback to empty structure
  CAR_DATA = 'Make,Model\n';
}

/**
 * Parse car makes and models from the CSV data
 */
function parseCarData() {
  const lines = CAR_DATA.split('\n').filter(line => line.trim().length > 0);
  // Skip header
  const dataLines = lines.slice(1);
  
  const makes = new Set<string>();
  const modelsByMake: { [make: string]: Set<string> } = {};
  
  dataLines.forEach(line => {
    const [make, model] = line.split(',').map(s => s.trim());
    
    if (make && make.length > 0) {
      makes.add(make);
      
      if (!modelsByMake[make]) {
        modelsByMake[make] = new Set<string>();
      }
      
      if (model && model.length > 0) {
        modelsByMake[make].add(model);
      }
    }
  });
  
  return {
    makes: Array.from(makes).sort(),
    modelsByMake: Object.fromEntries(
      Object.entries(modelsByMake).map(([make, modelsSet]) => 
        [make, Array.from(modelsSet).sort()]
      )
    )
  };
}

// Parse car data once when the module is imported
const { makes, modelsByMake } = parseCarData();

/**
 * Get all car makes from the dataset
 */
export function getCarMakes(): string[] {
  return makes;
}

/**
 * Get car models for a specific make
 * @param make The car make to get models for
 */
export function getCarModels(make: string): string[] {
  return modelsByMake[make] || [];
}

/**
 * Transforms a car title to make and model or vice versa
 * @param title The car title (e.g. "Toyota Corolla 2022")
 * @returns An object with make and model extracted, or best guess
 */
export function extractMakeModelFromTitle(title: string): { make: string; model: string } {
  // Simple extraction logic - split by first space
  const parts = title.trim().split(' ');
  
  if (parts.length >= 2) {
    const potentialMake = parts[0];
    
    // Check if the first word is a recognized make
    if (makes.includes(potentialMake)) {
      return {
        make: potentialMake,
        model: parts.slice(1).join(' ').replace(/\d+/g, '').trim() // Remove any year numbers
      };
    }
    
    // Special case for Maruti Suzuki
    if (potentialMake === 'Maruti' && parts.length >= 3 && parts[1] === 'Suzuki') {
      return {
        make: 'Maruti Suzuki',
        model: parts.slice(2).join(' ').replace(/\d+/g, '').trim()
      };
    }
  }
  
  // Default fallback
  return {
    make: '',
    model: ''
  };
}

/**
 * Generate a title from make, model and year
 * @param make Car make
 * @param model Car model
 * @param year Car year
 * @returns Formatted title
 */
export function generateCarTitle(make: string, model: string, year: number): string {
  // Handle empty inputs
  if (!make && !model && (!year || year === 0)) {
    return "Untitled Car";
  }
  
  const makePart = make?.trim() || "";
  const modelPart = model?.trim() || "";
  const yearPart = year && year > 0 ? year.toString() : "";
  
  // Build the title with only the parts that have values
  let title = "";
  
  if (yearPart) {
    title += yearPart + " ";
  }
  
  if (makePart) {
    title += makePart + " ";
  }
  
  if (modelPart) {
    title += modelPart;
  }
  
  return title.trim() || "Untitled Car";
}

/**
 * Validates if the provided make exists in our database
 * @param make The car make to validate
 * @returns true if the make exists, false otherwise
 */
export function isValidCarMake(make: string): boolean {
  return makes.includes(make);
}

/**
 * Validates if the provided model exists for the given make
 * @param make The car make
 * @param model The car model to validate
 * @returns true if the model exists for the make, false otherwise
 */
export function isValidCarModel(make: string, model: string): boolean {
  const modelsForMake = getCarModels(make);
  return modelsForMake.includes(model);
}

// Export the CSV data so it can be used by the Firestore service
export { CAR_DATA };

// Add a global type declaration for window.__CAR_DATA__
declare global {
  interface Window {
    __CAR_DATA__?: string;
  }
}