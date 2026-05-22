import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const migrationsDirectory = path.resolve(scriptDirectory, '../src/migrations')
const migrationsIndexPath = path.join(migrationsDirectory, 'index.ts')

function migrationNameFromFile(filename) {
  return filename.replace(/\.ts$/, '')
}

async function main() {
  const entries = await readdir(migrationsDirectory)
  const migrationFiles = entries.filter((entry) => entry.endsWith('.ts') && entry !== 'index.ts')
  const indexSource = await readFile(migrationsIndexPath, 'utf8')
  const missing = migrationFiles.filter((file) => !indexSource.includes(`name: '${migrationNameFromFile(file)}'`))

  if (missing.length > 0) {
    console.error('Missing migration registrations in src/migrations/index.ts:')
    for (const file of missing) {
      console.error(`- ${file}`)
    }
    process.exit(1)
  }

  console.log(`Verified ${migrationFiles.length} migration file(s) are registered.`)
}

await main()
