import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageName = 'brave-real-puppeteer-core';
const outputFile = path.join(process.cwd(), '.latest-version');

console.log(`Checking latest version for ${packageName}...`);

exec(`npm view ${packageName} version`, (error, stdout, stderr) => {
    if (error) {
        console.error(`Error checking version: ${error.message}`);
        console.log('Version check skipped');
        return;
    }

    const version = stdout.trim();
    if (version) {
        console.log(`Latest version found: ${version}`);
        try {
            fs.writeFileSync(outputFile, version);
            console.log(`Saved to ${outputFile}`);
        } catch (err) {
            console.error(`Failed to write .latest-version: ${err.message}`);
        }
    } else {
        console.log('Version check returned empty. Skipped.');
    }
});
