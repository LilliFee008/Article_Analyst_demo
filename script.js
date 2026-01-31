document.addEventListener('DOMContentLoaded', async () => {

    // --- 1. UI Elements ---
    const contentArea = document.getElementById('content-area');
    const loadingEl = document.getElementById('loading');
    const tabs = document.querySelectorAll('.tab-btn');
    const closeBtn = document.getElementById('close-btn');

    // --- 2. State & Data Fetching ---
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');

    let analysisData = null;

    try {
        const response = await fetch('../data/analysis_data.json');
        const data = await response.json();
        analysisData = data[articleId];

        if (!analysisData) {
            throw new Error('Article data not found');
        }

        // Slight artificial delay to simulate "Processing"
        setTimeout(() => {
            renderTab('argumentation'); // Default tab
        }, 800);

    } catch (e) {
        loadingEl.innerHTML = `<p style="color:red">Error loading analysis data: ${e.message}</p>`;
    }

    // --- 3. Rendering Logic ---
    function renderTab(tabName) {
        // Clear previous content
        contentArea.innerHTML = '';

        // Update Tab UI
        tabs.forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Logic switch
        switch (tabName) {
            case 'argumentation':
                renderArgumentation();
                break;
            case 'language':
                renderLanguage();
                break;
            case 'citations':
                renderCitations();
                break;
            case 'context':
                renderContext();
                break;
        }
    }

    function renderArgumentation() {
        const tmpl = document.getElementById('tmpl-argumentation').content.cloneNode(true);
        const data = analysisData.argumentation;
        const meta = analysisData.metadata;

        // Populate Metadata
        if (meta) {
            tmpl.querySelector('.text-type-display').textContent = meta.textType;
            tmpl.querySelector('.topic-display').textContent = meta.topic;
        }

        tmpl.querySelector('.thesis-text').textContent = data.thesis;
        tmpl.querySelector('.conclusion-text').textContent = data.conclusion;

        const list = tmpl.querySelector('.arguments-list');
        data.arguments.forEach(arg => {
            const div = document.createElement('div');
            div.className = 'argument-item';
            div.innerHTML = `
                <div class="argument-strength strength-${arg.strength}" title="Strength: ${arg.strength}">
                    ${getStrengthIcon(arg.strength)}
                </div>
                <strong>${arg.type}:</strong> ${arg.content}
                ${arg.issue ? `<br><small style="color:var(--text-light)">⚠️ ${arg.issue}</small>` : ''}
            `;
            list.appendChild(div);
        });

        setupFeedback(tmpl, 'argumentation');
        contentArea.appendChild(tmpl);
    }

    // --- Helper: Strength Icons ---
    // --- Helper: Strength Icons ---
    // --- Helper: Strength Icons ---
    function getStrengthIcon(strength) {
        // Custom User Icon
        // Using distinct opacity to still convey some sense of "strength" if needed, 
        // or just static if preferred. Here preserving semantic distinction via class/opacity.
        let opacity = '1.0';
        if (strength === 'medium') opacity = '0.7';
        if (strength === 'low' || strength === 'issue') opacity = '0.4';

        return `<img src="../assets/argument_icon.png" class="strength-icon icon-${strength}" style="opacity: ${opacity};" alt="${strength} strength">`;
    }

    // Consistent Color Generation (same as Content)
    function getColorForType(type) {
        if (type === 'Dramatisierung') {
            return '#90ee90'; // Explicit green for Dramatisierung as requested
        }
        const colors = [
            '#FFDDC1', '#C1E1FF', '#D4FFC1', '#F0C1FF', '#FFFFC1', '#C1FFF4',
            '#FFC1C1', '#E1C1FF', '#C1F4FF', '#E8FFC1'
        ];
        let hash = 0;
        for (let i = 0; i < type.length; i++) {
            hash = type.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash % colors.length);
        return colors[index];
    }

    function renderLanguage() {
        const tmpl = document.getElementById('tmpl-language').content.cloneNode(true);
        const data = analysisData.language;

        const rhetoricList = tmpl.querySelector('.rhetoric-list');
        data.rhetoric.forEach(item => {
            const div = document.createElement('div');
            div.className = 'rhetoric-item';
            const color = getColorForType(item.type);
            div.style.borderLeft = `4px solid ${color}`; // Color indicator
            div.innerHTML = `<strong>${item.type}:</strong> "${item.text}"`;
            rhetoricList.appendChild(div);
        });

        const patternsList = tmpl.querySelector('.patterns-list');
        data.patterns.forEach(item => {
            const div = document.createElement('div');
            div.className = 'pattern-item';
            const color = getColorForType(item.name);
            div.style.borderLeft = `4px solid ${color}`; // Color indicator

            let examplesHtml = '';
            if (item.examples && item.examples.length > 0) {
                examplesHtml = `<div style="margin-top:8px; font-size:12px; color:var(--text-light)">
                    <em>Beispiele:</em><br>
                    ${item.examples.map(ex => `• "${ex}"`).join('<br>')}
                </div>`;
            }

            // Enhanced rendering for Effect ("Wirkung")
            let effectHtml = '';
            if (item.effect) {
                effectHtml = `<p style="margin:8px 0 4px 0"><strong>Wirkung:</strong> ${item.effect}</p>`;
            }

            div.innerHTML = `
                <strong>${item.name}</strong>
                <p style="margin:4px 0">${item.description}</p>
                ${effectHtml}
                ${examplesHtml}
            `;
            patternsList.appendChild(div);
        });

        // Glossary
        const glossarySection = tmpl.querySelector('.glossary-section');
        if (data.glossary && data.glossary.length > 0) {
            glossarySection.style.display = 'block';
            const glossaryList = tmpl.querySelector('.glossary-list');
            data.glossary.forEach(g => {
                const div = document.createElement('div');
                div.className = 'glossary-item';
                div.innerHTML = `<strong>${g.term}:</strong> ${g.definition}`;
                glossaryList.appendChild(div);
            });
        }

        setupFeedback(tmpl, 'language');
        contentArea.appendChild(tmpl);
    }

    function renderCitations() {
        const tmpl = document.getElementById('tmpl-citations').content.cloneNode(true);
        const data = analysisData.quotes;
        const list = tmpl.querySelector('.quotes-list');

        data.forEach(q => {
            const div = document.createElement('div');
            div.className = 'quote-item';
            div.innerHTML = `
                "${q.text}"
                <span class="quote-source">— ${q.source}</span>
                ${q.effect ? `<div style="margin-top:8px; font-size:13px; font-style:normal;"><strong>Wirkung:</strong> ${q.effect}</div>` : ''}
            `;
            list.appendChild(div);
        });

        setupFeedback(tmpl, 'citations');
        contentArea.appendChild(tmpl);
    }

    function renderContext() {
        const tmpl = document.getElementById('tmpl-context').content.cloneNode(true);
        const data = analysisData.context;

        tmpl.querySelector('.author-name').textContent = data.author.name;
        tmpl.querySelector('.author-bio').textContent = data.author.bio;

        tmpl.querySelector('.medium-name').textContent = data.medium.name;
        tmpl.querySelector('.medium-bias').textContent = data.medium.bias;

        // Bias Meter & Reasoning
        if (data.medium.bias_metrics) {
            const metrics = data.medium.bias_metrics;
            const container = document.createElement('div');
            container.innerHTML = `
                <div class="bias-meter-container">
                    <div class="bias-bar bias-bar-left" style="width: ${metrics.liberal}%"></div>
                    <div class="bias-bar bias-bar-right" style="width: ${metrics.conservative}%"></div>
                </div>
                <div class="bias-legend">
                    <span>Liberal ${metrics.liberal}%</span>
                    <span>Konservativ ${metrics.conservative}%</span>
                </div>
            `;
            tmpl.querySelector('.medium-block').appendChild(container);

            if (data.medium.bias_reasoning) {
                const details = document.createElement('details');
                details.innerHTML = `
                    <summary>Einordnung Details</summary>
                    <p>${data.medium.bias_reasoning}</p>
                 `;
                tmpl.querySelector('.medium-block').appendChild(details);
            }
        }

        const list = tmpl.querySelector('.related-list');
        data.related.forEach(r => {
            const div = document.createElement('div');
            div.className = 'related-item';
            div.innerHTML = `
                <a href="#" style="text-decoration:none; color:var(--primary); font-weight:bold">${r.title}</a>
                <div style="font-size:11px; margin-top:2px; color:var(--text-light)">
                    ${r.source} • <span style="font-style:italic">${r.bias}</span>
                </div>
            `;
            list.appendChild(div);
        });



        setupFeedback(tmpl, 'context');
        contentArea.appendChild(tmpl);
    }

    function setupFeedback(parentNode, section) {
        const btns = parentNode.querySelectorAll('.feedback-btn');
        const storageKey = `feedback-${articleId}-${section}`;
        const savedVote = localStorage.getItem(storageKey);

        btns.forEach(btn => {
            // Restore state
            if (savedVote && btn.dataset.type === savedVote) {
                btn.classList.add('active');
            }

            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;

                // Toggle off if clicking active
                if (e.currentTarget.classList.contains('active')) {
                    e.currentTarget.classList.remove('active');
                    localStorage.removeItem(storageKey);
                    console.log(`Feedback [${section}]: Removed`);
                    return;
                }

                // Reset siblings
                e.currentTarget.parentElement.querySelectorAll('.feedback-btn').forEach(b => b.classList.remove('active'));

                // Activate clicked
                e.currentTarget.classList.add('active');
                localStorage.setItem(storageKey, type);
                console.log(`Feedback [${section}]: ${type}`);
            });
        });
    }

    // --- 4. Event Listeners ---
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            renderTab(btn.dataset.tab);
        });
    });

    closeBtn.addEventListener('click', () => {
        // Send message to parent
        window.parent.postMessage({ action: 'closeSidebar' }, '*');
    });

});
