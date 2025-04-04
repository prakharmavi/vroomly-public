import { readFile, writeFile } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the original CSV file
const inputFile = join(__dirname, '../dataset/car details v4.csv');
// Path to the output CSV file
const outputFile = join(__dirname, '../dataset/car details simplified.csv');

// Read the input file
readFile(inputFile, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Split the data into lines
  const lines = data.split('\n');
  const modifiedLines = [];

  // Add header if the first line is a header
  if (lines.length > 0) {
    modifiedLines.push(lines[0]);
  }

  // Process each line (skip header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue; // Skip empty lines
    
    const columns = line.split(',');
    if (columns.length < 2) continue; // Skip lines with insufficient columns
    
    // Extract the make and model - simplify by taking only the first part of model
    const make = columns[0];
    let model = columns[1].split(' ')[0]; // Take just the first word of the model
    
    // Create a new line with make and simplified model
    const newColumns = [make, model];
    modifiedLines.push(newColumns.join(','));
  }

  // Write the modified data to the output file
  writeFile(outputFile, modifiedLines.join('\n'), 'utf8', (err) => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
    console.log(`Simplified car models saved to ${outputFile}`);
  });
});
