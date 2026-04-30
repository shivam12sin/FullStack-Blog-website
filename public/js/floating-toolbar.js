/**
 * Floating Bubble Toolbar for EasyMDE / CodeMirror
 * Shows a contextual formatting toolbar when text is selected in the editor.
 * Similar to Medium, Notion, and MS Word's mini toolbar.
 *
 * Usage: call `initFloatingToolbar(easyMDE)` after creating the EasyMDE instance.
 */

function initFloatingToolbar(easyMDE) {
  const cm = easyMDE.codemirror;

  // ── Build the toolbar DOM ──
  const toolbar = document.createElement('div');
  toolbar.className = 'bubble-toolbar';
  toolbar.id = 'bubble-toolbar';
  toolbar.innerHTML = `
    <button type="button" data-action="bold" title="Bold (Ctrl+B)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>
    </button>
    <button type="button" data-action="italic" title="Italic (Ctrl+I)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
    </button>
    <button type="button" data-action="strikethrough" title="Strikethrough">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4H9a3 3 0 0 0-3 3v0a3 3 0 0 0 3 3h6a3 3 0 0 1 3 3v0a3 3 0 0 1-3 3H8"/><line x1="4" y1="12" x2="20" y2="12"/></svg>
    </button>
    <span class="bubble-toolbar__sep"></span>
    <button type="button" data-action="heading" title="Heading">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4v16"/><path d="M18 4v16"/><path d="M6 12h12"/></svg>
    </button>
    <button type="button" data-action="quote" title="Blockquote">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10 8c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h2v2H9.5a.5.5 0 0 0 0 1H12c1.1 0 2-.9 2-2v-5c0-1.1-.9-2-2-2h-2zM5 8c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h2v2H4.5a.5.5 0 0 0 0 1H7c1.1 0 2-.9 2-2v-5c0-1.1-.9-2-2-2H5z"/></svg>
    </button>
    <button type="button" data-action="code" title="Inline Code">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
    </button>
    <span class="bubble-toolbar__sep"></span>
    <button type="button" data-action="link" title="Insert Link (Ctrl+K)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
    </button>
    <button type="button" data-action="unordered-list" title="Bullet List">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>
    </button>
  `;

  // Small arrow/caret at the bottom
  const arrow = document.createElement('div');
  arrow.className = 'bubble-toolbar__arrow';
  toolbar.appendChild(arrow);

  document.body.appendChild(toolbar);

  // ── Action map ──
  const actions = {
    'bold':             () => easyMDE.toggleBold(),
    'italic':           () => easyMDE.toggleItalic(),
    'strikethrough':    () => easyMDE.toggleStrikethrough(),
    'heading':          () => easyMDE.toggleHeadingSmaller(),
    'quote':            () => easyMDE.toggleBlockquote(),
    'code':             () => easyMDE.toggleCodeBlock(),
    'link':             () => easyMDE.drawLink(),
    'unordered-list':   () => easyMDE.toggleUnorderedList(),
  };

  // ── Wire up buttons ──
  toolbar.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault(); // prevent losing the selection
      e.stopPropagation();
      const action = btn.getAttribute('data-action');
      if (actions[action]) {
        actions[action]();
      }
      // Re-focus editor after action
      cm.focus();
    });
  });

  // ── Positioning logic ──
  let hideTimeout = null;

  function showToolbar() {
    const sel = cm.getSelection();
    if (!sel || sel.length === 0) {
      hideToolbar();
      return;
    }

    const from = cm.getCursor('from');
    const to = cm.getCursor('to');

    // Get coordinates at the start of the selection
    const fromCoords = cm.cursorCoords(from, 'page');
    const toCoords = cm.cursorCoords(to, 'page');

    // Position toolbar above the middle of the selection
    const midX = (fromCoords.left + toCoords.left) / 2;
    const topY = Math.min(fromCoords.top, toCoords.top);

    const tbRect = toolbar.getBoundingClientRect();
    const tbWidth = tbRect.width || 320;
    const tbHeight = tbRect.height || 44;

    // Calculate position (centered above selection)
    let left = midX - (tbWidth / 2);
    let top = topY - tbHeight - 12; // 12px gap above text

    // Keep within viewport
    const vw = window.innerWidth;
    if (left < 8) left = 8;
    if (left + tbWidth > vw - 8) left = vw - tbWidth - 8;
    if (top < 8) top = topY + 28; // flip below if too high

    // Apply position
    toolbar.style.left = left + 'px';
    toolbar.style.top = top + window.scrollY + 'px';

    // Position the arrow to point at selection center
    const arrowLeft = midX - left;
    arrow.style.left = Math.max(12, Math.min(arrowLeft, tbWidth - 12)) + 'px';

    // Show
    clearTimeout(hideTimeout);
    toolbar.classList.add('is-visible');
  }

  function hideToolbar() {
    hideTimeout = setTimeout(() => {
      toolbar.classList.remove('is-visible');
    }, 100);
  }

  // ── Events ──
  cm.on('cursorActivity', () => {
    const sel = cm.getSelection();
    if (sel && sel.length > 0) {
      // Small delay so the selection is fully resolved
      requestAnimationFrame(showToolbar);
    } else {
      hideToolbar();
    }
  });

  // Hide on blur (but not when clicking toolbar buttons)
  cm.on('blur', () => {
    setTimeout(() => {
      if (!toolbar.matches(':hover')) {
        hideToolbar();
      }
    }, 200);
  });

  // Hide on scroll (reposition)
  cm.on('scroll', () => {
    const sel = cm.getSelection();
    if (sel && sel.length > 0) {
      requestAnimationFrame(showToolbar);
    }
  });

  // Also hide when pressing Escape
  cm.on('keydown', (cm, e) => {
    if (e.key === 'Escape') {
      hideToolbar();
    }
  });

  // Keep toolbar visible when hovering over it
  toolbar.addEventListener('mouseenter', () => {
    clearTimeout(hideTimeout);
  });

  toolbar.addEventListener('mouseleave', () => {
    const sel = cm.getSelection();
    if (!sel || sel.length === 0) {
      hideToolbar();
    }
  });
}
