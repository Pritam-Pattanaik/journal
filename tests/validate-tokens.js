import fs from 'fs';
import path from 'path';

const INDEX_CSS_PATH = path.resolve('src/index.css');
const TAILWIND_CONFIG_PATH = path.resolve('tailwind.config.js');

function validate() {
  console.log('--- Design Token Validator (Challenger 2) ---');
  
  if (!fs.existsSync(INDEX_CSS_PATH)) {
    console.error(`Error: File not found at ${INDEX_CSS_PATH}`);
    process.exit(1);
  }
  if (!fs.existsSync(TAILWIND_CONFIG_PATH)) {
    console.error(`Error: File not found at ${TAILWIND_CONFIG_PATH}`);
    process.exit(1);
  }

  const cssContent = fs.readFileSync(INDEX_CSS_PATH, 'utf-8');
  const tailwindContent = fs.readFileSync(TAILWIND_CONFIG_PATH, 'utf-8');

  // Parse CSS variables from root and light themes
  const parseCssVars = (css) => {
    const vars = { root: {}, light: {} };
    
    // Simple block extraction
    const rootBlockMatch = css.match(/:root\s*\{([\s\S]*?)\}/);
    const lightBlockMatch = css.match(/\.light\s*\{([\s\S]*?)\}/);
    
    const varRegex = /(--[\w.-]+)\s*:\s*([^;]+);/g;
    
    if (rootBlockMatch) {
      let match;
      const content = rootBlockMatch[1];
      while ((match = varRegex.exec(content)) !== null) {
        vars.root[match[1]] = match[2].trim();
      }
    }
    
    if (lightBlockMatch) {
      let match;
      const content = lightBlockMatch[1];
      while ((match = varRegex.exec(content)) !== null) {
        vars.light[match[1]] = match[2].trim();
      }
    }
    
    return vars;
  };

  const cssVars = parseCssVars(cssContent);
  const definedVars = new Set([...Object.keys(cssVars.root), ...Object.keys(cssVars.light)]);

  console.log(`Parsed ${Object.keys(cssVars.root).length} variables from :root`);
  console.log(`Parsed ${Object.keys(cssVars.light).length} overrides from .light`);

  // Resolution helper
  const resolveVariable = (varName, selector = 'root') => {
    const val = cssVars[selector][varName] || cssVars['root'][varName];
    if (!val) return null;
    
    const refMatch = val.match(/var\((--[\w.-]+)\)/);
    if (refMatch) {
      return resolveVariable(refMatch[1], selector);
    }
    return val;
  };

  let hasErrors = false;

  // 1. Check for missing variables referenced in tailwind.config.js
  console.log('\n--- Checking tailwind.config.js for unresolved variable references ---');
  const configVarRegex = /var\(((?:--)[a-zA-Z0-9_.-]+)\)/g;
  const referencedVarsInConfig = new Set();
  let match;
  while ((match = configVarRegex.exec(tailwindContent)) !== null) {
    referencedVarsInConfig.add(match[1]);
  }

  referencedVarsInConfig.forEach(v => {
    if (!definedVars.has(v)) {
      console.error(`❌ Unresolved variable: "${v}" is referenced in tailwind.config.js but not defined in index.css!`);
      hasErrors = true;
    }
  });

  // 2. Check for invalid rgba(var(--var), alpha) structures
  console.log('\n--- Checking for invalid space/comma mixing in rgba/rgb definitions ---');
  
  // In index.css
  const invalidRgbaRegex = /rgba?\(\s*var\((--[\w.-]+)\)\s*,\s*([^)]+)\)/g;
  const cssLines = cssContent.split('\n');
  cssLines.forEach((line, idx) => {
    let match;
    while ((match = invalidRgbaRegex.exec(line)) !== null) {
      const varName = match[1];
      const resolvedRoot = resolveVariable(varName, 'root');
      
      // If the resolved variable contains spaces (indicating an RGB triplet),
      // then using it inside rgba(var(--var), alpha) with a comma is syntax error.
      if (resolvedRoot && resolvedRoot.split(/\s+/).length === 3) {
        console.error(`❌ index.css [Line ${idx + 1}]: Invalid mixing of space-separated triplet in comma rgba: "${match[0].trim()}"`);
        console.error(`   (--${varName} resolves to space-separated "${resolvedRoot}")`);
        hasErrors = true;
      }
    }
  });

  // In tailwind.config.js
  const configLines = tailwindContent.split('\n');
  configLines.forEach((line, idx) => {
    let match;
    while ((match = invalidRgbaRegex.exec(line)) !== null) {
      const varName = match[1];
      const resolvedRoot = resolveVariable(varName, 'root');
      
      if (resolvedRoot && resolvedRoot.split(/\s+/).length === 3) {
        console.error(`❌ tailwind.config.js [Line ${idx + 1}]: Invalid mixing of space-separated triplet in comma rgba: "${match[0].trim()}"`);
        console.error(`   (--${varName} resolves to space-separated "${resolvedRoot}")`);
        hasErrors = true;
      }
    }
  });

  // 3. Check for empty variables in index.css definitions
  console.log('\n--- Checking for empty variable definitions ---');
  cssLines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('--')) {
      const parts = trimmed.split(':');
      if (parts.length >= 2) {
        const val = parts.slice(1).join(':').replace(';', '').trim();
        if (!val) {
          console.error(`❌ index.css [Line ${idx + 1}]: Variable "${parts[0].trim()}" is empty!`);
          hasErrors = true;
        }
      }
    }
  });

  console.log('\n--- Validation Result ---');
  if (hasErrors) {
    console.error('❌ Validation FAILED. Issues were found.');
    process.exit(1);
  } else {
    console.log('✅ Validation PASSED. All design tokens are valid and resolved.');
    process.exit(0);
  }
}

validate();

