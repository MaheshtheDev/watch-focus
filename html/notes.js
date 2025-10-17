(function () {
	const textarea = document.getElementById('note');
	const addBtn = document.getElementById('add-note-btn');
	const historyToggleBtn = document.getElementById('history-toggle-btn');
	const historyDropdown = document.getElementById('history-dropdown');
	const historyList = document.getElementById('history-list');

	const storageKey = 'watchFocus:notes:global';
	const historyKey = 'watchFocus:notes:history';
	let currentEditingId = null; // timestamp of the history note being edited, if any
	let currentEditingOriginalContent = null; // content at the time of loading for change detection

	function getStorage(keys, cb) {
		if (window.chrome && chrome.storage && chrome.storage.local) {
			chrome.storage.local.get(keys, (items) => {
				if (chrome.runtime && chrome.runtime.lastError) {
					const result = {};
					keys.forEach((k) => (result[k] = localStorage.getItem(k)));
					cb(result);
					return;
				}
				cb(items);
			});
		} else {
			const result = {};
			keys.forEach((k) => (result[k] = localStorage.getItem(k)));
			cb(result);
		}
	}

	function setStorage(obj) {
		try {
			Object.keys(obj).forEach((k) => localStorage.setItem(k, typeof obj[k] === 'string' ? obj[k] : JSON.stringify(obj[k])));
		} catch (e) { console.error('setStorage error:', e); alert('Error saving note. Please check your browser storage settings.'); }
		if (window.chrome && chrome.storage && chrome.storage.local) {
			chrome.storage.local.set(obj, () => {});
		}
	}

	function loadCurrent() {
		getStorage([storageKey], (items) => {
			const val = items[storageKey];
			let text = '';
			try {
				text = typeof val === 'string' ? val : (val || '');
			} catch (e) { console.error('loadCurrent error:', e); alert('Error loading current note.'); }
			textarea.value = text || '';
		});
	}

	function loadHistory() {
		getStorage([historyKey], (items) => {
			let list = [];
			try {
				list = typeof items[historyKey] === 'string' ? JSON.parse(items[historyKey] || '[]') : (items[historyKey] || []);
			} catch (e) { list = []; console.error('loadHistory parse error:', e); }
			renderHistory(list);
		});
	}

	function renderHistory(list) {
		if (!Array.isArray(list) || list.length === 0) {
			historyList.innerHTML = '<div>No history yet</div>';
			return;
		}
		historyList.innerHTML = list
			.slice()
			.reverse()
			.map((item, idx) => {
				const date = new Date(item.timestamp);
				const day = String(date.getDate()).padStart(2, '0');
				const month = String(date.getMonth() + 1).padStart(2, '0');
				const year = date.getFullYear();
				const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
				const ts = `${day}/${month}/${year} ${timeString}`;
				// Only show the first line of the note as preview
				const preview = (item.content || '').split('\n')[0];
				return `<div data-idx="${list.length - 1 - idx}" data-id="${item.timestamp}" style="margin-bottom:8px; padding-bottom:6px; border-bottom: 1px solid rgba(0,0,0,0.1);">
				  <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
				    <div class="history-item-content" style="cursor:pointer;">
				      <div style="font-weight:bold;">${escapeHtml(preview)}</div>
				      <div style="font-weight:normal;">${ts}</div>
				    </div>
				    <button class="history-delete" title="Delete" aria-label="Delete" style="position:relative;width:16px;height:16px;min-width:16px;min-height:16px;display:flex;align-items:center;justify-content:center;background:none;border:none;color:#b00;cursor:pointer;padding:0;flex-shrink:0;">
				      <span style="position:absolute;left:0;right:0;top:7px;height:2px;width:14px;margin:auto;background:currentColor;transform:rotate(45deg);transform-origin:center;"></span>
				      <span style="position:absolute;left:0;right:0;top:7px;height:2px;width:14px;margin:auto;background:currentColor;transform:rotate(-45deg);transform-origin:center;"></span>
				    </button>
				  </div>
				</div>`;
			})
			.join('');

		Array.from(historyList.children).forEach((row) => {
			const contentArea = row.querySelector('.history-item-content');
			const delBtn = row.querySelector('.history-delete');
			const originalIndex = Number(row.getAttribute('data-idx'));
			const noteId = Number(row.getAttribute('data-id'));
			if (contentArea) {
				contentArea.addEventListener('click', () => {
					try { highlightHistoryRow(noteId); } catch (e) { console.error('highlightHistoryRow error:', e); }
					restoreFromHistoryById(noteId, { closeAfter: true });
				});
			}
			if (delBtn) {
				delBtn.addEventListener('click', (e) => {
					e.stopPropagation();
					deleteFromHistory(originalIndex);
				});
			}
		});
	}

	function highlightHistoryRow(timestampId) {
		if (!historyList) return;
		const row = historyList.querySelector(`[data-id="${timestampId}"]`);
		if (!row) return;
		row.style.transition = row.style.transition ? row.style.transition : 'background-color 300ms ease';
		row.style.backgroundColor = 'rgba(222, 184, 135, 0.25)'; // burlywood tint
		// smooth scroll into view within dropdown
		try { row.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) { console.error('scrollIntoView error:', e); }
		setTimeout(() => {
			row.style.backgroundColor = '';
		}, 900);
	}

	function restoreFromHistoryById(timestampId, opts = {}) {
		// Auto-save current note to history before restoring
		const currentContent = (textarea.value || '').trim();
		if (currentContent) {
			getStorage([historyKey], (items) => {
				let list = [];
				try {
					list = typeof items[historyKey] === 'string' ? JSON.parse(items[historyKey] || '[]') : (items[historyKey] || []);
				} catch (e) { list = []; console.error('restoreFromHistoryById parse error:', e); alert('Error restoring note from history.'); }
				const norm = currentContent;
				const existingIndex = list.findIndex(it => (it && (it.content || '').trim()) === norm);
				if (existingIndex === -1) {
					const now = Date.now();
					list.push({ content: currentContent, timestamp: now });
					setStorage({ [historyKey]: list });
				}
			});
		}
		getStorage([historyKey], (items) => {
			let list = [];
			try {
				list = typeof items[historyKey] === 'string' ? JSON.parse(items[historyKey] || '[]') : (items[historyKey] || []);
			} catch (e) { list = []; console.error('restoreFromHistoryById parse error:', e); alert('Error restoring note from history.'); }
			const note = list.find(n => n && n.timestamp === timestampId);
			if (note) {
				textarea.value = note.content || '';
				persistImmediate(note.content || '');
				currentEditingId = note.timestamp;
				currentEditingOriginalContent = note.content || '';
				if (opts && opts.closeAfter) closeDropdown();
			}
		});
	}

	function deleteFromHistory(originalIndex) {
		getStorage([historyKey], (items) => {
			let list = [];
			try {
				list = typeof items[historyKey] === 'string' ? JSON.parse(items[historyKey] || '[]') : (items[historyKey] || []);
			} catch (e) { list = []; console.error('deleteFromHistory parse error:', e); alert('Error deleting note from history.'); }
			if (originalIndex >= 0 && originalIndex < list.length) {
				list.splice(originalIndex, 1);
				setStorage({ [historyKey]: list });
				loadHistory();
			}
		});
	}

	function escapeHtml(str) {
		return (str || '')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	}

	function debounce(fn, delay) {
		let t;
		return function (...args) {
			clearTimeout(t);
			t = setTimeout(() => fn.apply(this, args), delay);
		};
	}

	function persistImmediate(value) {
		try { localStorage.setItem(storageKey, value); } catch (e) { console.error('persistImmediate localStorage error:', e); alert('Error saving note.'); }
		if (window.chrome && chrome.storage && chrome.storage.local) {
			chrome.storage.local.set({ [storageKey]: value }, () => {});
		}
	}

	const persistDebounced = debounce(persistImmediate, 300);

	textarea.addEventListener('input', (e) => {
		persistDebounced(e.target.value);
	});

	textarea.addEventListener('blur', (e) => persistImmediate(e.target.value));
	window.addEventListener('beforeunload', () => persistImmediate(textarea.value));

	addBtn.addEventListener('click', (e) => {
		e.preventDefault();
		const content = (textarea.value || '').trim();
		if (!content) return;
		getStorage([historyKey], (items) => {
			let list = [];
			try {
				list = typeof items[historyKey] === 'string' ? JSON.parse(items[historyKey] || '[]') : (items[historyKey] || []);
			} catch (e) { list = []; console.error('addBtn click parse error:', e); alert('Error saving note.'); }
			const now = Date.now();
			const isEditing = currentEditingId != null;
			const unchanged = isEditing && (content === (currentEditingOriginalContent || '').trim());
			if (unchanged) {
				currentEditingId = null;
				currentEditingOriginalContent = null;
				// do not modify history ordering; just clear current and exit
				textarea.value = '';
				persistImmediate('');
				if (historyDropdown && historyDropdown.style.visibility === 'visible') loadHistory();
				return;
			}
			if (isEditing) {
				// Replace the existing note with same timestamp (ID)
				const idx = list.findIndex(n => n && n.timestamp === currentEditingId);
				if (idx >= 0) {
					const updated = { content, timestamp: now };
					// remove old and push updated to end (most recent)
					list.splice(idx, 1);
					list.push(updated);
				} else {
					// fallback: if not found by ID, dedupe by content
					const norm = content;
					const existingIndex = list.findIndex(it => (it && (it.content || '').trim()) === norm);
					if (existingIndex >= 0) {
						const existing = list.splice(existingIndex, 1)[0];
						existing.timestamp = now;
						existing.content = content;
						list.push(existing);
					} else {
						list.push({ content, timestamp: now });
					}
				}
				currentEditingId = null;
				currentEditingOriginalContent = null;
			} else {
				// not editing: dedupe by exact content
				const norm = content;
				const existingIndex = list.findIndex(it => (it && (it.content || '').trim()) === norm);
				if (existingIndex >= 0) {
					const existing = list.splice(existingIndex, 1)[0];
					existing.timestamp = now;
					existing.content = content;
					list.push(existing);
				} else {
					list.push({ content, timestamp: now });
				}
			}
			setStorage({ [historyKey]: list });
			// clear current note after adding
			textarea.value = '';
			persistImmediate('');
			// refresh visible history if open
			if (historyDropdown && historyDropdown.style.visibility === 'visible') loadHistory();
		});
	});

	function openDropdown() {
		if (!historyDropdown) return;
		historyDropdown.style.visibility = 'visible';
		historyDropdown.style.opacity = '1';
		historyDropdown.style.transform = 'translateX(-50%) translateY(0)';
	}
	function closeDropdown() {
		if (!historyDropdown) return;
		historyDropdown.style.opacity = '0';
		historyDropdown.style.transform = 'translateX(-50%) translateY(6px)';
		setTimeout(() => { historyDropdown.style.visibility = 'hidden'; }, 200);
	}

	historyToggleBtn.addEventListener('click', (e) => {
		e.preventDefault();
		const isHidden = !historyDropdown || historyDropdown.style.visibility !== 'visible';
		if (isHidden) {
			loadHistory();
			openDropdown();
		} else {
			closeDropdown();
		}
	});

	window.addEventListener('mousedown', (e) => {
		if (!historyDropdown) return;
		let within = false;
		try {
			within = (e.target === historyToggleBtn) || (historyToggleBtn && historyToggleBtn.contains(e.target)) || (historyDropdown && historyDropdown.contains(e.target));
		} catch (err) { within = false; console.error('mousedown event error:', err); }
		if (!within) closeDropdown();
	});

	// Add enhanced interactive effects for better UX
	function addInteractiveEffects() {
		if (addBtn) {
			addBtn.addEventListener('mouseenter', () => {
				addBtn.style.backgroundColor = 'rgba(222, 184, 135, 0.15)';
				addBtn.style.transform = 'scale(1.05)';
				addBtn.style.boxShadow = '0 2px 6px rgba(222, 184, 135, 0.2)';
			});
			addBtn.addEventListener('mouseleave', () => {
				addBtn.style.backgroundColor = 'transparent';
				addBtn.style.transform = 'scale(1)';
				addBtn.style.boxShadow = '0 1px 3px rgba(222, 184, 135, 0.1)';
			});
		}
		if (historyToggleBtn) {
			historyToggleBtn.addEventListener('mouseenter', () => {
				historyToggleBtn.style.backgroundColor = 'rgba(222, 184, 135, 0.15)';
				historyToggleBtn.style.transform = 'scale(1.05)';
				historyToggleBtn.style.boxShadow = '0 2px 6px rgba(222, 184, 135, 0.2)';
			});
			historyToggleBtn.addEventListener('mouseleave', () => {
				historyToggleBtn.style.backgroundColor = 'transparent';
				historyToggleBtn.style.transform = 'scale(1)';
				historyToggleBtn.style.boxShadow = '0 1px 3px rgba(222, 184, 135, 0.1)';
			});
		}
	}

	// initial
	loadCurrent();
	addInteractiveEffects();
})();
