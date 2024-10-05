import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const width = 50;
const height = 50;
const data = new Array(width * height);

function generateHeight(x, y) {
  // Base height increases from corner to opposite corner
  const baseHeight = (x + y) / (width + height) * 80;
  
  // Add some random variation
  const variation = Math.random() * 20;
  
  // Combine base height and variation, ensure it's between 0 and 100
  return Math.min(Math.max(baseHeight + variation, 0), 100);
}

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const index = y * width + x;
    data[index] = generateHeight(x, y);
  }
}

const sampleData = {
  width,
  height,
  data
};

// Write to sampleElevation.json
const outputPath = join(__dirname, '..', 'data', 'sampleElevation.json');

try {
  await writeFile(outputPath, JSON.stringify(sampleData, null, 2));
  console.log('Sample elevation data generated and saved to sampleElevation.json');
} catch (error) {
  console.error('Error writing sample data:', error);
}