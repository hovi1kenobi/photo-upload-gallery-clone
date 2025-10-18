const fs = require('fs');
const path = require('path');

function injectConsoleCapture() {
  const buildDir = path.join(process.cwd(), '.next');
  
  if (!fs.existsSync(buildDir)) {
    console.log('Build directory not found. Skipping console capture injection.');
    return;
  }
  
  const scriptTag = '<script src="/dashboard-console-capture.js"></script>';
  
  function processHtmlFiles(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        processHtmlFiles(filePath);
      } else if (file.endsWith('.html')) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        if (!content.includes('/dashboard-console-capture.js')) {
          content = content.replace(
            '</head>',
            `  ${scriptTag}\n</head>`
          );
          
          fs.writeFileSync(filePath, content);
          console.log(`Injected console capture script into ${filePath}`);
        }
      }
    });
  }
  
  try {
    processHtmlFiles(buildDir);
    console.log('Console capture script injection complete.');
  } catch (error) {
    console.error('Error injecting console capture script:', error);
  }
}

injectConsoleCapture();