#!/usr/bin/env node

const fs = require('fs').promises
const path = require('path')

const FILES_TO_MANAGE = [
  'index.html',
  'styles.css',
  'scripts.js',
  'README.md',
  '.prettierrc.js'
]

const HACKLIST_DIR = 'hacklist'

async function moveFiles(source, dest) {
  try {
    // Ensure destination directory exists
    await fs.mkdir(dest, { recursive: true })
    
    for (const file of FILES_TO_MANAGE) {
      const sourcePath = path.join(source, file)
      const destPath = path.join(dest, file)
      
      try {
        await fs.access(sourcePath)
        await fs.copyFile(sourcePath, destPath)
        console.log(`Copied ${file}`)
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.error(`Error copying ${file}:`, err)
        }
      }
    }
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  }
}

const command = process.argv[2]

if (command === 'bury') {
  moveFiles('.', HACKLIST_DIR)
} else if (command === 'dig') {
  moveFiles(HACKLIST_DIR, '.')
} else {
  console.log('Usage: node hacklist.js [bury|dig]')
  process.exit(1)
}
