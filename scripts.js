fetch('cards.json')
  .then(response => response.json())
  .then(cards => {
    // Sort cards by date by default
    cards.sort((a, b) => {
      const dateA = new Date(a.lastModified?.replace(' ', 'T')).getTime() || 0
      const dateB = new Date(b.lastModified?.replace(' ', 'T')).getTime() || 0
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

    // Add click handlers
    tabs.addEventListener('click', e => {
      const tab = e.target.closest('.tab')
      if (tab) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
        tab.classList.add('active')
        const selectedTag = tab.dataset.tag

        document.querySelectorAll('.card').forEach(card => {
          if (selectedTag === 'all' || card.dataset.tags.includes(selectedTag)) {
            card.style.display = ''
          } else {
            card.style.display = 'none'
          }
        })
      }
    })

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

    // Add menu toggle functionality
    const gearIcon = document.querySelector('.gear-icon')
    const menu = document.querySelector('.menu')
    gearIcon.addEventListener('click', () => {
      menu.classList.toggle('show')
    })

    // Add image toggle functionality
    const imageToggle = document.getElementById('show-images')
    imageToggle.addEventListener('change', () => {
      document.body.classList.toggle('show-images', imageToggle.checked)
    })

    // Add sort handler
    const sortSelect = document.getElementById('sort')
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        const sortBy = sortSelect.value
        const container = document.getElementById('cards')
        const visibleCards = Array.from(container.querySelectorAll('.card'))

        visibleCards.sort((a, b) => {
          if (sortBy === 'date') {
            // Parse the full timestamps for proper comparison
            const dateA = new Date(a.dataset.lastModified.replace(' ', 'T')).getTime() || 0
            const dateB = new Date(b.dataset.lastModified.replace(' ', 'T')).getTime() || 0
            return dateB - dateA // Sort newest first
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

      a.dataset.lastModified = card.lastModified || ''
      a.innerHTML = `
                <img class="card-image" src="${card.image || defaultImage}" alt="">
                <h2>${card.title}</h2>
                ${card.description ? `<p>${card.description}</p>` : ''}
                <div class="links">
                    ${card.urls?.[0] ? `<div class="url">${card.urls[0]}</div>` : ''}
                    ${
                      card.repo
                        ? `<a href="https://github.com/${card.repo}" class="github" target="_blank"><i class="fab fa-github"></i> ${card.repo}</a>`
                        : ''
                    }
                </div>
                ${
                  card.tags?.length
                    ? `<div class="tags">${card.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>`
                    : ''
                }
            `

      container.appendChild(a)
    })
  })
