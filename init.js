const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Get a list of all direct child folders in the current directory
const folders = fs.readdirSync('.').filter(item => fs.statSync(item).isDirectory())

folders.forEach(folder => {
  const gitDir = path.join(folder, '.git')

  // Check if the folder is a Git repo by verifying if `.git` exists
  if (fs.existsSync(gitDir)) {
    try {
      // Check if the repo has a remote
      const remotes = execSync(`git -C ${folder} remote -v`, { encoding: 'utf-8' })

      // Add as a submodule if not already added
      execSync(`git submodule add ./$(basename ${folder}) ${folder}`)
      console.log(`✅ Added '${folder}' as a submodule.`)
    } catch (error) {
      console.log(`❌ Failed to add '${folder}' as a submodule: ${error.message}`)
    }
  } else {
    console.log(`ℹ️ '${folder}' is not a Git repository.`)
  }
})
