// Web Simulation Script
// Acts as a drop-in replacement for the Chrome Extension content script in the web demo.

// Helper for relative paths in the web structure
// web/script.js is in ROOT/web/
// Assets are in ROOT/assets/ -> ../assets/
// Data is in ROOT/data/ -> ../data/
// Sidebar is in ROOT/sidebar/ -> ../sidebar/
function getResourceURL(path) {
    return '../' + path;
}

// Initialize the logic
function initArticleAnalyst() {
    console.log('Article Analyst: Running in Web Simulation Mode');

    // 1. Data Loading
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');

    // Determine Article ID: URL param -> Filename -> Default 'article_1'
    let articleId = 'article_1'; // Default
    if (idParam) {
        articleId = 'article_' + idParam;
    }

    // Validate ID format (simple safety)
    if (!articleId.startsWith('article_')) articleId = 'article_1';

    let currentAnalysis = null;
    let hasHighlighted = false;

    // Fetch analysis data for highlighting
    fetch(getResourceURL('data/analysis_data.json'))
        .then(response => response.json())
        .then(data => {
            currentAnalysis = data[articleId];
            if (!currentAnalysis) console.warn('No analysis data found for ID:', articleId);
        })
        .catch(err => console.error('Error loading analysis data:', err));

    // 2. Inject Owl Trigger
    const trigger = document.createElement('div');
    trigger.id = 'article-analyst-owl-trigger';
    const icon = document.createElement('img');
    icon.src = getResourceURL('assets/owl_icon.png');
    trigger.appendChild(icon);
    document.body.appendChild(trigger);

    // Animate entrance after 500ms
    setTimeout(() => {
        trigger.classList.add('visible');
    }, 500);

    // 3. Create Sidebar Host
    const sidebarFrame = document.createElement('iframe');
    sidebarFrame.id = 'article-analyst-sidebar-host';

    // Pass the calculated articleId to the sidebar
    sidebarFrame.src = getResourceURL('sidebar/index.html') + '?id=' + articleId;
    sidebarFrame.style.border = 'none';
    document.body.appendChild(sidebarFrame);

    // 4. Create Resize Handle
    const resizeHandle = document.createElement('div');
    resizeHandle.id = 'article-analyst-resize-handle';
    document.body.appendChild(resizeHandle);

    initResizeLogic(resizeHandle, sidebarFrame);

    // 5. Toggle Logic
    let isOpen = false;
    trigger.addEventListener('click', () => {
        isOpen = !isOpen;
        if (isOpen) {
            sidebarFrame.classList.add('open');
            resizeHandle.classList.add('visible');

            // Mobile: Lock Background Scroll
            if (window.innerWidth <= 768) {
                document.body.style.overflow = 'hidden';
            }

            // Trigger highlighting only when opened for the first time
            if (!hasHighlighted && currentAnalysis && currentAnalysis.language) {
                if (currentAnalysis.language.rhetoric) {
                    highlightItems(currentAnalysis.language.rhetoric, 'rhetoric');
                }
                if (currentAnalysis.language.patterns) {
                    highlightItems(currentAnalysis.language.patterns, 'pattern');
                }
                hasHighlighted = true;
            }
        } else {
            sidebarFrame.classList.remove('open');
            resizeHandle.classList.remove('visible');
            // Remove Scroll Lock
            document.body.style.overflow = '';
        }
    });

    // Listen for close messages from the iframe
    window.addEventListener('message', (event) => {
        if (event.data.action === 'closeSidebar') {
            isOpen = false;
            sidebarFrame.classList.remove('open');
            resizeHandle.classList.remove('visible');
            // Remove Scroll Lock
            document.body.style.overflow = '';
        }
    });
}

function initResizeLogic(handle, sidebar) {
    let isResizing = false;

    // Mouse/Touch Down
    const startResize = (e) => {
        if (e.button !== 0 && e.type === 'mousedown') return; // Only left click
        e.preventDefault(); // Prevent text selection
        isResizing = true;

        handle.classList.add('resizing');
        sidebar.classList.add('resizing');
        document.body.style.userSelect = 'none'; // Disable selection globally

        // Add listeners to WINDOW with capture to ensure we catch everything
        window.addEventListener('mousemove', doResize, { capture: true, passive: false });
        window.addEventListener('mouseup', stopResize, { capture: true });
        window.addEventListener('mouseleave', stopResize, { capture: true }); // Window leave

        window.addEventListener('touchmove', doResize, { capture: true, passive: false });
        window.addEventListener('touchend', stopResize, { capture: true });
        window.addEventListener('touchcancel', stopResize, { capture: true });
    };

    handle.addEventListener('mousedown', startResize);
    handle.addEventListener('touchstart', startResize, { passive: false });

    // Drag Logic
    const doResize = (e) => {
        if (!isResizing) return;

        // CRITICAL FAIL-SAFE:
        if (e.type === 'mousemove' && (e.buttons & 1) !== 1) {
            stopResize();
            return;
        }

        e.preventDefault();

        // Check if Mobile (<= 768px matches CSS defined in content.css)
        const isMobile = window.innerWidth <= 768;

        // Unify touch and mouse coordinates
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        if (isMobile) {
            // Mobile: Resize Height (from bottom)
            let newHeight = window.innerHeight - clientY;

            // Constraints
            const minHeight = window.innerHeight * 0.3; // 30vh
            const maxHeight = window.innerHeight * 0.9; // 90vh

            newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));

            sidebar.style.height = `${newHeight}px`;
            handle.style.bottom = `${newHeight}px`;
            // Reset potential desktop styles
            sidebar.style.width = '';
            handle.style.right = '';

        } else {
            // Desktop: Resize Width (from right)
            let newWidth = window.innerWidth - clientX;

            // Constraints: 250px (min) to 400px (max)
            const minWidth = 250;
            const maxWidth = 400;

            newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));

            sidebar.style.width = `${newWidth}px`;
            handle.style.right = `${newWidth}px`;
            // Reset potential mobile styles
            sidebar.style.height = '';
            handle.style.bottom = '';
        }
    };

    // Stop Resize
    const stopResize = () => {
        if (!isResizing) return;
        isResizing = false;

        handle.classList.remove('resizing');
        sidebar.classList.remove('resizing');
        document.body.style.userSelect = '';

        window.removeEventListener('mousemove', doResize, { capture: true, passive: false });
        window.removeEventListener('mouseup', stopResize, { capture: true });
        window.removeEventListener('mouseleave', stopResize, { capture: true });

        window.removeEventListener('touchmove', doResize, { capture: true, passive: false });
        window.removeEventListener('touchend', stopResize, { capture: true });
        window.removeEventListener('touchcancel', stopResize, { capture: true });
    };
}


// Consistent Color Generation (same as Sidebar)
function getColorForType(type) {
    if (type === 'Dramatisierung') {
        return '#90ee90'; // Explicit green for Dramatisierung
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

function highlightItems(items, category) {
    items.forEach(item => {
        let label = '';
        let textsToHighlight = [];

        if (category === 'rhetoric') {
            label = item.type;
            if (item.text) textsToHighlight.push(item.text);
            if (item.text2) textsToHighlight.push(item.text2);
        } else if (category === 'pattern') {
            label = item.name;
            if (item.examples && Array.isArray(item.examples)) {
                textsToHighlight = item.examples;
            }
        }

        const color = getColorForType(label);

        textsToHighlight.forEach(text => {
            highlightText(document.body, text, label, color);
        });
    });
}

function highlightText(node, text, type, color) {
    if (node.nodeType === 3) { // Text node
        if (node.nodeValue.includes('\n')) {
            node.nodeValue = node.nodeValue.replace(/\s+/g, ' ');
        }
        const value = node.nodeValue;
        const idx = value.indexOf(text);

        if (idx >= 0) {
            const span = document.createElement('span');
            span.className = 'analyst-highlight';
            span.style.backgroundColor = color;
            span.setAttribute('data-tooltip', `Pattern: ${type}`);
            span.textContent = text;

            const after = node.splitText(idx);
            after.nodeValue = after.nodeValue.substring(text.length);
            node.parentNode.insertBefore(span, after);

            highlightText(after, text, type, color); // Recursively search remaining
            return true;
        }
    } else if (node.nodeType === 1 && node.childNodes &&
        !['SCRIPT', 'STYLE', 'IFRAME', 'NOSCRIPT'].includes(node.tagName) &&
        !node.classList.contains('analyst-highlight')) {

        const childNodes = Array.from(node.childNodes);
        for (let i = 0; i < childNodes.length; i++) {
            highlightText(childNodes[i], text, type, color);
        }
    }
    return false;
}

// Run initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initArticleAnalyst);
} else {
    initArticleAnalyst();
}
