import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validatedRepository } from './content.mjs';

export { loadRepository, validateData, validatedRepository, shanghaiDate } from './content.mjs';

/** Validate the source archives for the CLI; return a nonzero status on failure. */
function main() {
  try {
    const data = validatedRepository();
    console.log(`Content valid: ${data.technologies.length} technologies, ${data.reports.length} reports.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
