import { generateProjectImage } from './images.js'

dayjs.extend(window.dayjs_plugin_relativeTime)

// Add helper function at the top
const getRelativeTime = date => dayjs(date.replace(' ', 'T')).fromNow()

// Add this at the start of the file, before the fetch
document.body.classList.add('loading')

// Add this near the top of the file, before the fetch
const ledeTexts = [
  'Here lies everything I’m hacking on locally.',
  'I want to make beautiful things, even if nobody cares.',
]

// Add this function after the ledeTexts array
function updateLedeText() {
  const ledeElement = document.querySelector('.lede')
  const randomIndex = Math.floor(Math.random() * 2) // Will give 0 or 1 with equal probability
  ledeElement.textContent = ledeTexts[randomIndex]
}

// Add this right after document.body.classList.add('loading')
updateLedeText()

// Add this near the top of the file, before the fetch
const dbName = 'imageCache'
const storeName = 'images'
let db

// Initialize IndexedDB
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = event => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName)
      }
    }
  })
}

// Helper function to get/set images from IndexedDB
const imageCache = {
  async get(key) {
    return new Promise(resolve => {
      const transaction = db.transaction(storeName, 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => resolve(null)
    })
  },

  async set(key, value) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(value, key)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  },
}

// Modify the fetch chain to initialize DB first
initDB()
  .then(() => fetch('cards.json'))
  .then(response => response.json())
  .then(cards => {
    // Initial sort by creation date
    cards.sort((a, b) => {
      const dateA = new Date(a.created?.replace(' ', 'T')).getTime() || 0
      const dateB = new Date(b.created?.replace(' ', 'T')).getTime() || 0
      return dateB - dateA // Newest first
    })
    const container = document.getElementById('cards')
    const tabs = document.getElementById('tabs')
    const tags = new Set(['all'])
    const totalCount = cards.filter(card => card.title).length
    document.querySelector('.tab[data-tag="all"]').innerHTML = `All<span>${totalCount}</span>`

    // Collect unique tags
    cards.forEach(card => {
      if (card.tags) {
        card.tags.forEach(tag => tags.add(tag))
      }
    })

    // Create tag filters
    tags.forEach(tag => {
      if (tag !== 'all') {
        const count = cards.filter(card => card.tags?.includes(tag)).length
        const button = document.createElement('button')
        button.className = 'tab'
        button.innerHTML = `${tag}<span>${count}</span>`
        button.dataset.tag = tag
        tabs.appendChild(button)
      }
    })

    // Load saved preferences
    const savedTag = localStorage.getItem('selectedTag') || 'all'
    const showImages = localStorage.getItem('showImages') === 'true'

    // Set initial active tag
    document.querySelector(`.tab[data-tag="${savedTag}"]`)?.classList.add('active')

    // Create gear icon and menu
    const menuContainer = document.createElement('div')
    menuContainer.className = 'menu-container'
    menuContainer.innerHTML = `
      <button class="gear-icon" aria-label="Settings">
        <i class="fas fa-cog"></i>
      </button>
      <div class="menu">
        <label class="menu-item">
          <input type="checkbox" id="show-images">
          Show Images
        </label>
      </div>
    `
    document.body.appendChild(menuContainer)

    // Set initial image toggle state after menu is created
    document.body.classList.toggle('show-images', showImages)
    document.getElementById('show-images').checked = showImages

    // Add menu toggle functionality
    const gearIcon = document.querySelector('.gear-icon')
    const menu = document.querySelector('.menu')
    gearIcon.addEventListener('click', () => {
      menu.classList.toggle('show')
    })

    // Add image toggle functionality
    const imageToggle = document.getElementById('show-images')
    imageToggle.addEventListener('change', () => {
      const showImages = imageToggle.checked
      document.body.classList.toggle('show-images', showImages)
      localStorage.setItem('showImages', showImages)
    })

    // Setup sort handler first
    const sortSelect = document.getElementById('sort')
    const sortCards = () => {
      const sortBy = sortSelect.value
      const container = document.getElementById('cards')
      const visibleCards = Array.from(container.querySelectorAll('.card:not([style*="display: none"])'))

      visibleCards.sort((a, b) => {
        if (sortBy === 'created') {
          const dateA = new Date(a.dataset.created.replace(' ', 'T')).getTime() || 0
          const dateB = new Date(b.dataset.created.replace(' ', 'T')).getTime() || 0
          return dateB - dateA
        } else if (sortBy === 'date') {
          const dateA = new Date(a.dataset.lastModified.replace(' ', 'T')).getTime() || 0
          const dateB = new Date(b.dataset.lastModified.replace(' ', 'T')).getTime() || 0
          return dateB - dateA
        } else if (sortBy === 'folder') {
          const pathA = a.getAttribute('href')?.toLowerCase() || ''
          const pathB = b.getAttribute('href')?.toLowerCase() || ''
          return pathA.localeCompare(pathB)
        } else {
          const titleA = a.querySelector('h2')?.textContent?.toLowerCase() || ''
          const titleB = b.querySelector('h2')?.textContent?.toLowerCase() || ''
          return titleA.localeCompare(titleB)
        }
      })

      visibleCards.forEach(card => container.appendChild(card))
    }

    // Set initial sort value and add event listener
    if (sortSelect) {
      sortSelect.value = 'date'
      sortSelect.addEventListener('change', sortCards)
    }

    // Render cards
    cards.forEach(async card => {
      if (!card.title) return

      const a = document.createElement('a')
      a.className = 'card'
      a.href = card.path
      a.dataset.tags = card.tags?.join(',') || ''

      // Generate image if none exists, with caching
      let imageElement
      if (card.image) {
        imageElement = `<img class="card-image" src="${card.image}" alt="">`
      } else {
        // Create a cache key based on the title
        const cacheKey = `generatedImage_${card.title}`
        let imageDataUrl = await imageCache.get(cacheKey)

        if (!imageDataUrl) {
          // Generate image only if not in cache
          const canvas = generateProjectImage(card.title)
          imageDataUrl = canvas.toDataURL('image/png')
          try {
            await imageCache.set(cacheKey, imageDataUrl)
          } catch (e) {
            console.error('Failed to cache image:', e)
          }
        }

        imageElement = `<img class="card-image" src="${imageDataUrl}" alt="">`
      }

      a.dataset.created = card.created || ''
      a.dataset.lastModified = card.lastModified || ''
      a.innerHTML = `
        ${imageElement}
        <h2>${card.title}</h2>
        ${card.description ? `<p>${card.description}</p>` : ''}
        <div class="links">
            ${card.urls?.[0] ? `<div class="url">${card.urls[0]}</div>` : ''}
            ${
              card.repo && card.repo !== 'mattborn/'
                ? `<a href="https://github.com/${card.repo}" class="github" target="_blank" title="${card.repo}"><i class="fab fa-github"></i></a>`
                : ''
            }
        </div>
        <div class="card-footer">
          ${
            card.tags?.length
              ? `<div class="tags">${card.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>`
              : '<div></div>'
          }
          <div class="timestamp">${getRelativeTime(card.lastModified)}</div>
        </div>
      `

      container.appendChild(a)
    })

    // After cards are rendered, apply initial sort and filter
    sortCards()

    // Apply initial filter
    document.querySelectorAll('.card').forEach(card => {
      if (savedTag === 'all' || card.dataset.tags.includes(savedTag)) {
        card.style.display = ''
      } else {
        card.style.display = 'none'
      }
    })

    // Add click handlers for tags
    tabs.addEventListener('click', e => {
      const tab = e.target.closest('.tab')
      if (tab) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
        tab.classList.add('active')
        const selectedTag = tab.dataset.tag

        // Save selected tag
        localStorage.setItem('selectedTag', selectedTag)

        document.querySelectorAll('.card').forEach(card => {
          if (selectedTag === 'all' || card.dataset.tags.includes(selectedTag)) {
            card.style.display = ''
          } else {
            card.style.display = 'none'
          }
        })
      }
    })

    // Move ScrollReveal here, after everything is rendered
    ScrollReveal().reveal('h1, .lede, .tab, .card', {
      cleanup: true,
      distance: '20%',
      interval: 30,
      origin: 'bottom',
      afterReveal: () => {
        // Remove loading state only after first reveal is complete
        document.body.classList.remove('loading')
      },
    })
  })
