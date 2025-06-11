// @ts-nocheck
export function loadCredentials() {
  const fs = require('fs');
  const path = require('path');
  const credPath = path.join(__dirname, '..', 'credentials');
  try {
    const lines = fs.readFileSync(credPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*)\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2];
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  } catch {
    // credentials file is optional
  }
}
