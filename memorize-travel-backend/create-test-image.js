const sharp = require('sharp');

// Create a simple test image
const svg = `
<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="400" fill="#87CEEB"/>
  <circle cx="200" cy="150" r="60" fill="yellow"/>
  <rect x="150" y="200" width="100" height="150" fill="brown"/>
  <polygon points="200,200 150,280 250,280" fill="green"/>
  <text x="200" y="380" text-anchor="middle" font-size="24" fill="black">Test Photo</text>
</svg>
`;

sharp(Buffer.from(svg))
  .jpeg()
  .toFile('test-photo.jpg')
  .then(() => {
    console.log('Test image created: test-photo.jpg');
  })
  .catch(err => {
    console.error('Error creating test image:', err);
  });