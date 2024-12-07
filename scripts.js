dayjs.extend(window.dayjs_plugin_relativeTime)

// Add helper function at the top
const getRelativeTime = date => dayjs(date.replace(' ', 'T')).fromNow()

fetch('cards.json')
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

    // Add sort handler
    const sortSelect = document.getElementById('sort')
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        const sortBy = sortSelect.value
        const container = document.getElementById('cards')
        const visibleCards = Array.from(container.querySelectorAll('.card'))

        visibleCards.sort((a, b) => {
          if (sortBy === 'created') {
            // Sort by creation date
            const dateA = new Date(a.dataset.created.replace(' ', 'T')).getTime() || 0
            const dateB = new Date(b.dataset.created.replace(' ', 'T')).getTime() || 0
            return dateB - dateA // Newest first
          } else if (sortBy === 'date') {
            // Sort by last modified
            const dateA = new Date(a.dataset.lastModified.replace(' ', 'T')).getTime() || 0
            const dateB = new Date(b.dataset.lastModified.replace(' ', 'T')).getTime() || 0
            return dateB - dateA // Most recent first
          } else if (sortBy === 'folder') {
            // Sort by path/folder name
            const pathA = a.getAttribute('href')?.toLowerCase() || ''
            const pathB = b.getAttribute('href')?.toLowerCase() || ''
            return pathA.localeCompare(pathB)
          } else {
            // Sort by title
            const titleA = a.querySelector('h2')?.textContent?.toLowerCase() || ''
            const titleB = b.querySelector('h2')?.textContent?.toLowerCase() || ''
            return titleA.localeCompare(titleB)
          }
        })

        // Remove all cards and append them in the new order
        visibleCards.forEach(card => {
          card.remove()
          container.appendChild(card)
        })
      })
    }

    // Render cards
    cards.forEach(card => {
      if (!card.title) return

      const a = document.createElement('a')
      a.className = 'card'
      a.href = card.path
      a.dataset.tags = card.tags?.join(',') || ''

      const defaultImage = 'data:image/gif;base64,R0lGODlhAQABAAAAACw='

      a.dataset.created = card.created || ''
      a.dataset.lastModified = card.lastModified || ''
      a.innerHTML = `
        <img class="card-image" src="${card.image || defaultImage}" alt="">
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

    // Apply initial filter after cards are rendered
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
  })
