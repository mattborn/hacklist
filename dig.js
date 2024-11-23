#!/usr/bin/env node

const fs = require('fs').promises
const path = require('path')
const FILES_TO_MANAGE = ['index.html', 'README.md', '.prettierrc.js']

const HACKLIST_DIR = 'hacklist'

async function copyFiles() {
  try {
    for (const file of FILES_TO_MANAGE) {
      const sourcePath = path.join(HACKLIST_DIR, file)
      const destPath = path.join('.', file)

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

copyFiles()
