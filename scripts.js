fetch('cards.json')
    .then(response => response.json())
    .then(cards => {
        const container = document.getElementById('cards');
        const tabs = document.getElementById('tabs');
        const tags = new Set(['all']);
        
        // Collect unique tags
        cards.forEach(card => {
            if (card.tags) {
                card.tags.forEach(tag => tags.add(tag));
            }
        });
        
        // Create tag filters
        tags.forEach(tag => {
            if (tag !== 'all') {
                const button = document.createElement('button');
                button.className = 'tab';
                button.textContent = tag;
                button.dataset.tag = tag;
                tabs.appendChild(button);
            }
        });
        
        // Add click handlers
        tabs.addEventListener('click', e => {
            if (e.target.classList.contains('tab')) {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                const selectedTag = e.target.dataset.tag;
                
                document.querySelectorAll('.card').forEach(card => {
                    if (selectedTag === 'all' || card.dataset.tags.includes(selectedTag)) {
                        card.style.display = '';
                    } else {
                        card.style.display = 'none';
                    }
                });
            }
        });
        
        // Render cards
        cards.forEach(card => {
            if (!card.title) return;
            
            const a = document.createElement('a');
            a.className = 'card';
            a.href = card.path;
            a.dataset.tags = card.tags?.join(',') || '';
            
            a.innerHTML = `
                <img src="${card.image || ''}" alt="" />
                <h2>${card.title}</h2>
                ${card.description ? `<p>${card.description}</p>` : ''}
                ${card.tags?.length ? `<div class="tags">${card.tags.join(' · ')}</div>` : ''}
            `;
            
            container.appendChild(a);
        });
    });