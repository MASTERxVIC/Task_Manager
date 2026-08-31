// get-tree.js
import fs from 'fs';
import path from 'path';

const IGNORE = ['node_modules', '.git', '.next', 'dist', 'build', '.DS_Store'];

function printTree(dir, prefix = '') {
  const files = fs.readdirSync(dir);
  files.forEach((file, index) => {
    if (IGNORE.includes(file)) return;
    const isLast = index === files.length - 1;
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    
    console.log(`${prefix}${isLast ? '└── ' : '├── '}${file}`);
    
    if (stats.isDirectory()) {
      printTree(filePath, `${prefix}${isLast ? '    ' : '│   '}`);
    }
  });
}

console.log('Project Structure:\n');
printTree('.');