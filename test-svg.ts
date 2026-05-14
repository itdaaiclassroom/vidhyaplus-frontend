import { generateArucoSvg } from './src/lib/arucoGenerator';
const raw = generateArucoSvg(10, 110);
console.log('RAW:');
console.log(raw.substring(0, 150));
const replaced = raw.replace('width="110" height="110"', 'width="100%" height="100%"');
console.log('REPLACED:');
console.log(replaced.substring(0, 150));
