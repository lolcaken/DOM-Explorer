// ==UserScript==
// @name         Explorer Like so (original)
// @namespace    http://tampermonkey.net/
// @version      13.0
// @description  Advanced DOM Explorer with themes, CSS editor, console, performance monitor, accessibility checker, responsive tester, and color picker
// @author       You
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @grant        GM_notification
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @connect      *
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // ======== CONFIGURATION & CONSTANTS ========
    const VERSION = '13.0';
    const SCRIPT_NAME = 'Enhanced DOM Explorer Pro';
    const DEBOUNCE_DELAY = 250;
    const VIRTUAL_SCROLL_BATCH_SIZE = 50;
    const MAX_RENDER_DEPTH = 10000000000000000000000000000000000000000000000000000000000000000000;
    const ERROR_LOG_MAX_SIZE = 50;

    // Element type icons
    const ELEMENT_ICONS = {
        div: "📦", img: "🖼️", a: "🔗", p: "📄",
        h1: "🔠", h2: "🔡", h3: "🔡", h4: "🔢", h5: "🔢", h6: "🔣",
        span: "✏️", ul: "📑", ol: "📋", li: "▪️",
        input: "⌨️", button: "🔘", form: "📝",
        table: "🔲", tr: "➖", td: "⬜", th: "⬛",
        style: "🎨", nav: "🧭",
        header: "🔝", footer: "🔻", section: "📂", article: "📰",
        video: "🎬", audio: "🔊", canvas: "🖼️", svg: "🎯",
        iframe: "🗂️", select: "🔽", option: "🔘",
        textarea: "📝", label: "🏷️", default: "🔹"
    };

    // Extended CSS Variables for theming
    const CSS_VARS = {
        dark: {
            '--primary': '#4f46e5',
            '--primary-dark': '#4338ca',
            '--secondary': '#6366f1',
            '--background': '#0f172a',
            '--surface': '#1e293b',
            '--surface-light': '#334155',
            '--text': '#e2e8f0',
            '--text-secondary': '#94a3b8',
            '--accent': '#818cf8',
            '--success': '#10b981',
            '--warning': '#f59e0b',
            '--danger': '#ef4444',
            '--border': '#334155',
            '--spacing-xs': '4px',
            '--spacing-sm': '8px',
            '--spacing-md': '12px',
            '--spacing-lg': '16px',
            '--glass-bg': 'rgba(30, 41, 59, 0.8)',
            '--glass-border': 'rgba(100, 116, 139, 0.3)'
        },
        light: {
            '--background': '#f8fafc',
            '--surface': '#ffffff',
            '--surface-light': '#f1f5f9',
            '--text': '#1e293b',
            '--text-secondary': '#64748b',
            '--border': '#e2e8f0',
            '--glass-bg': 'rgba(255, 255, 255, 0.8)',
            '--glass-border': 'rgba(226, 232, 240, 0.5)'
        },
        blue: {
            '--primary': '#0ea5e9',
            '--primary-dark': '#0284c7',
            '--secondary': '#38bdf8',
            '--background': '#082f49',
            '--surface': '#0c4a6e',
            '--surface-light': '#075985',
            '--text': '#e0f2fe',
            '--text-secondary': '#bae6fd',
            '--accent': '#7dd3fc',
            '--success': '#06b6d4',
            '--warning': '#eab308',
            '--danger': '#f43f5e',
            '--border': '#0e7490',
            '--spacing-xs': '4px',
            '--spacing-sm': '8px',
            '--spacing-md': '12px',
            '--spacing-lg': '16px',
            '--glass-bg': 'rgba(12, 74, 110, 0.8)',
            '--glass-border': 'rgba(14, 116, 144, 0.3)'
        },
        green: {
            '--primary': '#059669',
            '--primary-dark': '#047857',
            '--secondary': '#10b981',
            '--background': '#064e3b',
            '--surface': '#065f46',
            '--surface-light': '#047857',
            '--text': '#d1fae5',
            '--text-secondary': '#a7f3d0',
            '--accent': '#34d399',
            '--success': '#10b981',
            '--warning': '#f59e0b',
            '--danger': '#ef4444',
            '--border': '#047857',
            '--spacing-xs': '4px',
            '--spacing-sm': '8px',
            '--spacing-md': '12px',
            '--spacing-lg': '16px',
            '--glass-bg': 'rgba(6, 95, 70, 0.8)',
            '--glass-border': 'rgba(4, 120, 87, 0.3)'
        },
        purple: {
            '--primary': '#8b5cf6',
            '--primary-dark': '#7c3aed',
            '--secondary': '#a78bfa',
            '--background': '#3b0764',
            '--surface': '#4c1d95',
            '--surface-light': '#5b21b6',
            '--text': '#ede9fe',
            '--text-secondary': '#ddd6fe',
            '--accent': '#c4b5fd',
            '--success': '#10b981',
            '--warning': '#f59e0b',
            '--danger': '#ef4444',
            '--border': '#6d28d9',
            '--spacing-xs': '4px',
            '--spacing-sm': '8px',
            '--spacing-md': '12px',
            '--spacing-lg': '16px',
            '--glass-bg': 'rgba(76, 29, 149, 0.8)',
            '--glass-border': 'rgba(109, 40, 217, 0.3)'
        },
        highcontrast: {
            '--primary': '#ffffff',
            '--primary-dark': '#d1d5db',
            '--secondary': '#f3f4f6',
            '--background': '#000000',
            '--surface': '#111827',
            '--surface-light': '#1f2937',
            '--text': '#ffffff',
            '--text-secondary': '#d1d5db',
            '--accent': '#f3f4f6',
            '--success': '#34d399',
            '--warning': '#fbbf24',
            '--danger': '#f87171',
            '--border': '#4b5563',
            '--spacing-xs': '4px',
            '--spacing-sm': '8px',
            '--spacing-md': '12px',
            '--spacing-lg': '16px',
            '--glass-bg': 'rgba(17, 24, 39, 0.9)',
            '--glass-border': 'rgba(75, 85, 99, 0.5)'
        }
    };

    // ======== GLOBAL STATE ========
    const state = {
        selectedElement: null,
        pinnedElements: [],
        isResizingWidth: false,
        isResizingHeight: false,
        isDragging: false,
        isToolbarCollapsed: false,
        shadowDOMVisible: true,
        clickElementMode: false,
        currentSearchFilter: 'all',
        searchMatches: [],
        errorLog: [],
        domHistory: [],
        domHistoryIndex: -1,
        activeTab: 'basic',
        theme: 'dark',
        uiState: {
            sidebarWidth: 320,
            sidebarHeight: '40%',
            toolbarPosition: 'top',
            compactMode: false
        },
        networkRequests: [],
        snippets: [],
        cssEditorContent: '',
        consoleHistory: [],
        performanceData: {
            loadTime: 0,
            domNodes: 0,
            resources: 0,
            renderTime: 0
        },
        responsiveSizes: [
            { name: 'Mobile', width: 375, height: 667 },
            { name: 'Tablet', width: 768, height: 1024 },
            { name: 'Laptop', width: 1366, height: 768 },
            { name: 'Desktop', width: 1920, height: 1080 }
        ],
        currentResponsiveSize: null
    };

    // ======== UTILITIES & HELPERS ========
    /**
     * Safely query DOM elements with error handling
     * @param {string} selector - CSS selector
     * @param {Element} context - Context element (optional)
     * @returns {Element|null}
     */
    function safeQuerySelector(selector, context = document) {
        try {
            return context.querySelector(selector);
        } catch (e) {
            logError(`Error querying selector: ${selector}`, e);
            return null;
        }
    }

    /**
     * Safely query all DOM elements with error handling
     * @param {string} selector - CSS selector
     * @param {Element} context - Context element (optional)
     * @returns {Array}
     */
    function safeQuerySelectorAll(selector, context = document) {
        try {
            return Array.from(context.querySelectorAll(selector));
        } catch (e) {
            logError(`Error querying all selectors: ${selector}`, e);
            return [];
        }
    }

    /**
     * Debounce function to limit how often a function can be called
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function}
     */
    function debounce(func, wait = DEBOUNCE_DELAY) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    /**
     * Throttle function to limit how often a function can be called
     * @param {Function} func - Function to throttle
     * @param {number} limit - Limit in milliseconds
     * @returns {Function}
     */
    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Log errors to the error log and console
     * @param {string} message - Error message
     * @param {Error} error - Error object
     */
    function logError(message, error) {
        const errorEntry = {
            message,
            error: error.toString(),
            timestamp: new Date().toISOString(),
            stack: error.stack
        };
        state.errorLog.push(errorEntry);

        // Keep error log at a manageable size
        if (state.errorLog.length > ERROR_LOG_MAX_SIZE) {
            state.errorLog.shift();
        }

        console.error(`[DOM Explorer] ${message}`, error);
    }

    /**
     * Show a toast notification
     * @param {string} message - Message to display
     * @param {string} type - Toast type (success, error, info, warning)
     */
    function showToast(message, type = 'info') {
        try {
            // Remove existing toasts
            const existingToasts = safeQuerySelectorAll('.dex-toast');
            existingToasts.forEach(toast => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            });

            const toast = document.createElement('div');
            toast.className = `dex-toast ${type}`;
            const icon = type === 'success' ? '✅' :
                        type === 'error' ? '❌' :
                        type === 'warning' ? '⚠️' : 'ℹ️';
            toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
            toast.setAttribute('role', 'alert');
            toast.setAttribute('aria-live', 'polite');

            document.body.appendChild(toast);

            // Trigger animation
            setTimeout(() => {
                toast.classList.add('show');
            }, 10);

            // Auto-remove after delay
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    if (document.body.contains(toast)) {
                        document.body.removeChild(toast);
                    }
                }, 300);
            }, 3000);
        } catch (e) {
            logError('Error showing toast notification', e);
        }
    }

   /**
 * Get XPath for an element
 * @param {Element} element - DOM element
 * @returns {string} XPath string
 */
function getXPath(element) {
    try {
        if (!element || !element.tagName) return '';

        if (element.id) {
            return `//*[@id="${element.id}"]`;
        }

        const paths = [];
        const nodeName = element.nodeName.toLowerCase();

        // --- FIX: Safely access className for HTML and SVG elements ---
        let classes = [];
        if (typeof element.className === 'string') {
            classes = element.className.trim().split(/\s+/);
        } else if (element.className && typeof element.className.baseVal === 'string') {
            classes = element.className.baseVal.trim().split(/\s+/);
        }

        // Check if the element has a unique class name
        if (classes.length > 0) {
            const classSelector = `//*[@class="${classes.join(' ')}"]`;
            try {
                if (document.evaluate(classSelector, document, null, XPathResult.ANY_TYPE, null).iterateNext() === element) {
                    return classSelector;
                }
            } catch (e) {
                // Continue with normal XPath generation
            }
        }

        // Build XPath by traversing up the DOM
        for (; element && element.nodeType === Node.ELEMENT_NODE; element = element.parentNode) {
            let index = 0;
            for (let sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
                if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === element.nodeName) {
                    index++;
                }
            }

            const tagName = element.nodeName.toLowerCase();
            const pathIndex = index ? `[${index + 1}]` : '';
            paths.unshift(`${tagName}${pathIndex}`);
        }

        return paths.length ? '/' + paths.join('/') : '';
    } catch (e) {
        logError('Error generating XPath', e);
        return '';
    }
}
    /**
 * Get CSS Selector for an element
 * @param {Element} element - DOM element
 * @returns {string} CSS selector string
 */
function getCssSelector(element) {
    try {
        if (!element || !element.tagName) return '';

        if (element.id) {
            return `#${CSS.escape(element.id)}`;
        }

        const paths = [];
        const nodeName = element.nodeName.toLowerCase();

        // Check if the element has a unique class name
        // --- FIX: Safely access className for HTML and SVG elements ---
        let classes = [];
        if (typeof element.className === 'string') {
            classes = element.className.trim().split(/\s+/);
        } else if (element.className && typeof element.className.baseVal === 'string') {
            classes = element.className.baseVal.trim().split(/\s+/);
        }

        if (classes.length > 0) {
            const classSelector = `${nodeName}.${classes.map(c => CSS.escape(c)).join('.')}`;
            try {
                if (document.querySelectorAll(classSelector).length === 1) {
                    return classSelector;
                }
            } catch (e) {
                // Continue with normal selector generation
            }
        }

        // Build selector by traversing up the DOM
        for (; element && element.nodeType === Node.ELEMENT_NODE; element = element.parentNode) {
            let selector = element.nodeName.toLowerCase();

            if (element.id) {
                selector += `#${CSS.escape(element.id)}`;
                paths.unshift(selector);
                break;
            } else {
                // Safely get classes again for the parent element
                let parentClasses = [];
                if (typeof element.className === 'string') {
                    parentClasses = element.className.trim().split(/\s+/);
                } else if (element.className && typeof element.className.baseVal === 'string') {
                    parentClasses = element.className.baseVal.trim().split(/\s+/);
                }

                if (parentClasses.length > 0) {
                    selector += '.' + parentClasses.map(c => CSS.escape(c)).join('.');
                }

                let sibling = element;
                let nth = 1;
                while (sibling = sibling.previousElementSibling) {
                    if (sibling.nodeName.toLowerCase() === selector.split('.')[0]) {
                        nth++;
                    }
                }

                if (nth > 1) {
                    selector += `:nth-of-type(${nth})`;
                }
            }

            paths.unshift(selector);
        }

        return paths.join(' > ');
    } catch (e) {
        logError('Error generating CSS selector', e);
        return '';
    }
}

    /**
 * Get element path for search and selection
 * @param {Element} element - DOM element
 * @returns {string} A unique and valid CSS selector path
 */
function getElementPath(element) {
    try {
        if (!element || element.nodeType !== Node.ELEMENT_NODE) {
            return '';
        }

        // If the element has a unique ID, that's the best path
        if (element.id) {
            // We still escape it for safety, in case it has weird characters
            return `#${CSS.escape(element.id)}`;
        }

        const path = [];
        let current = element;

        // Traverse up the DOM from the element to the body
        while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body) {
            let selector = current.nodeName.toLowerCase();

            // Add ID if it exists (we already checked for a unique one, but this helps with path generation)
            if (current.id) {
                selector += `#${CSS.escape(current.id)}`;
                path.unshift(selector);
                break; // An ID in the path is unique enough, we can stop here
            } else {
                // Add classes to make the selector more specific
                if (current.className && typeof current.className === 'string') {
                    const classes = current.className.trim().split(/\s+/);
                    if (classes.length > 0) {
                        selector += `.${classes.map(c => CSS.escape(c)).join('.')}`;
                    }
                }

                // Add nth-of-type to handle siblings with the same tag and classes
                let sibling = current;
                let nth = 1;
                while (sibling = sibling.previousElementSibling) {
                    if (sibling.nodeName.toLowerCase() === current.nodeName.toLowerCase()) {
                        nth++;
                    }
                }

                if (nth > 1) {
                    selector += `:nth-of-type(${nth})`;
                }
            }

            path.unshift(selector);
            current = current.parentElement;
        }

        return path.join(' > ');
    } catch (e) {
        logError('Error generating element path', e);
        return '';
    }
}
    /**
     * Save UI state to GM storage
     */
    function saveUIState() {
        try {
            GM_setValue('domExplorerUIState', state.uiState);
            GM_setValue('domExplorerTheme', state.theme);
            GM_setValue('domExplorerCSSContent', state.cssEditorContent);
        } catch (e) {
            logError('Error saving UI state', e);
        }
    }

    /**
     * Load UI state from GM storage
     */
    function loadUIState() {
        try {
            const savedUIState = GM_getValue('domExplorerUIState', null);
            if (savedUIState) {
                state.uiState = { ...state.uiState, ...savedUIState };
            }

            const savedTheme = GM_getValue('domExplorerTheme', 'dark');
            state.theme = savedTheme;

            const savedCSS = GM_getValue('domExplorerCSSContent', '');
            state.cssEditorContent = savedCSS;
        } catch (e) {
            logError('Error loading UI state', e);
        }
    }

    /**
     * Apply theme to the document
     * @param {string} theme - Theme name
     */
    function applyTheme(theme) {
        try {
            // Remove all theme classes
            document.body.classList.remove('dex-dark-theme', 'dex-light-theme', 'dex-blue-theme', 'dex-green-theme', 'dex-purple-theme', 'dex-highcontrast-theme');

            // Add the selected theme class
            document.body.classList.add(`dex-${theme}-theme`);

            state.theme = theme;
            saveUIState();
        } catch (e) {
            logError('Error applying theme', e);
        }
    }

    /**
     * Download a file from a URL
     * @param {string} url - File URL
     * @param {string} filename - Filename to save as
     */
    function downloadFile(url, filename) {
        try {
            // Try to use GM_download if available
            if (typeof GM_download !== 'undefined') {
                GM_download({
                    url: url,
                    name: filename,
                    saveAs: true,
                    onerror: (error) => {
                        showToast(`Download failed: ${error.error || 'Unknown error'}`, 'error');
                    },
                    onload: () => {
                        showToast('Download started successfully', 'success');
                    }
                });
            } else {
                // Fallback for browsers that don't support GM_download
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                showToast('Download started', 'success');
            }
        } catch (e) {
            logError(`Error downloading file: ${filename}`, e);
            showToast(`Download error: ${e.message}`, 'error');
        }
    }

    /**
     * Count nodes in an element subtree
     * @param {Element} element - Root element
     * @returns {number} Node count
     */
    function countNodes(element) {
        try {
            let count = 0;

            function traverse(node) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    count++;
                    for (let i = 0; i < node.childNodes.length; i++) {
                        traverse(node.childNodes[i]);
                    }
                }
            }

            traverse(element);
            return count;
        } catch (e) {
            logError('Error counting nodes', e);
            return 0;
        }
    }

    /**
     * Get maximum depth of an element subtree
     * @param {Element} element - Root element
     * @returns {number} Maximum depth
     */
    function getMaxDepth(element) {
        try {
            let maxDepth = 0;

            function traverse(node, depth) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    maxDepth = Math.max(maxDepth, depth);
                    for (let i = 0; i < node.childNodes.length; i++) {
                        traverse(node.childNodes[i], depth + 1);
                    }
                }
            }

            traverse(element, 1);
            return maxDepth;
        } catch (e) {
            logError('Error calculating max depth', e);
            return 0;
        }
    }

    /**
     * Calculate contrast ratio between two colors
     * @param {string} color1 - First color (RGB/HEX)
     * @param {string} color2 - Second color (RGB/HEX)
     * @returns {number} Contrast ratio
     */
    function calculateContrastRatio(color1, color2) {
        try {
            // Convert RGB to luminance
            const rgb1 = parseColor(color1);
            const rgb2 = parseColor(color2);

            const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
            const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

            // Calculate contrast ratio
            const lighter = Math.max(l1, l2);
            const darker = Math.min(l1, l2);

            return (lighter + 0.05) / (darker + 0.05);
        } catch (e) {
            logError('Error calculating contrast ratio', e);
            return 0;
        }
    }

    /**
     * Parse color string to RGB object
     * @param {string} color - Color string
     * @returns {Object} RGB object
     */
    function parseColor(color) {
        try {
            // Handle rgb/rgba format
            const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if (rgbMatch) {
                return {
                    r: parseInt(rgbMatch[1]),
                    g: parseInt(rgbMatch[2]),
                    b: parseInt(rgbMatch[3]),
                    a: rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1
                };
            }

            // Handle hex format
            const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
            if (hexMatch) {
                return {
                    r: parseInt(hexMatch[1], 16),
                    g: parseInt(hexMatch[2], 16),
                    b: parseInt(hexMatch[3], 16),
                    a: 1
                };
            }

            // Handle shorthand hex
            const shortHexMatch = color.match(/^#?([a-f\d])([a-f\d])([a-f\d])$/i);
            if (shortHexMatch) {
                return {
                    r: parseInt(shortHexMatch[1] + shortHexMatch[1], 16),
                    g: parseInt(shortHexMatch[2] + shortHexMatch[2], 16),
                    b: parseInt(shortHexMatch[3] + shortHexMatch[3], 16),
                    a: 1
                };
            }

            // Default to black
            return { r: 0, g: 0, b: 0, a: 1 };
        } catch (e) {
            logError('Error parsing color', e);
            return { r: 0, g: 0, b: 0, a: 1 };
        }
    }

    /**
     * Get luminance from RGB values
     * @param {number} r - Red value
     * @param {number} g - Green value
     * @param {number} b - Blue value
     * @returns {number} Luminance
     */
    function getLuminance(r, g, b) {
        try {
            const rsRGB = r / 255;
            const gsRGB = g / 255;
            const bsRGB = b / 255;

            const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
            const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
            const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

            return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
        } catch (e) {
            logError('Error calculating luminance', e);
            return 0;
        }
    }

    /**
     * Get event listeners for an element
     * @param {Element} element - DOM element
     * @returns {Array} Array of event listeners
     */
    function getElementEventListeners(element) {
        try {
            const events = [];

            // Check for property-based event listeners (onclick, onmouseover, etc.)
            const commonEvents = [
                'click', 'dblclick', 'mousedown', 'mouseup', 'mouseover', 'mouseout',
                'mousemove', 'keydown', 'keyup', 'keypress', 'change', 'focus', 'blur',
                'submit', 'reset', 'select', 'load', 'unload', 'resize', 'scroll'
            ];

            commonEvents.forEach(eventType => {
                const prop = `on${eventType}`;
                if (element[prop] && typeof element[prop] === 'function') {
                    events.push({
                        type: eventType,
                        listener: element[prop],
                        isProperty: true
                    });
                }
            });

            // Check for addEventListener-based listeners (limited support)
            if (element.eventListeners) {
                for (const eventType in element.eventListeners) {
                    element.eventListeners[eventType].forEach(listener => {
                        events.push({
                            type: eventType,
                            listener: listener,
                            isProperty: false
                        });
                    });
                }
            }

            return events;
        } catch (e) {
            logError('Error getting element event listeners', e);
            return [];
        }
    }

    /**
     * Highlight an element on the page
     * @param {Element} element - Element to highlight
     */
    function highlightElement(element) {
        try {
            // Remove previous highlights
            safeQuerySelectorAll('.dex-highlight').forEach(el => {
                el.classList.remove('dex-highlight');
            });

            // Add highlight to selected element
            if (element) {
                element.classList.add('dex-highlight');
            }
        } catch (e) {
            logError('Error highlighting element', e);
        }
    }

    /**
     * Find previous heading element
     * @param {Element} element - Current element
     * @returns {Element|null} Previous heading or null
     */
    function findPreviousHeading(element) {
        try {
            const siblings = Array.from(element.parentNode.children);
            const index = siblings.indexOf(element);

            for (let i = index - 1; i >= 0; i--) {
                if (siblings[i].tagName.match(/^H[1-6]$/)) {
                    return siblings[i];
                }
            }

            return null;
        } catch (e) {
            logError('Error finding previous heading', e);
            return null;
        }
    }

    // ======== STYLESHEET ========
    /**
     * Inject CSS styles into the document
     */
    function injectStyles() {
        try {
            const styles = `
                :root {
                    --primary: ${CSS_VARS.dark['--primary']};
                    --primary-dark: ${CSS_VARS.dark['--primary-dark']};
                    --secondary: ${CSS_VARS.dark['--secondary']};
                    --background: ${CSS_VARS.dark['--background']};
                    --surface: ${CSS_VARS.dark['--surface']};
                    --surface-light: ${CSS_VARS.dark['--surface-light']};
                    --text: ${CSS_VARS.dark['--text']};
                    --text-secondary: ${CSS_VARS.dark['--text-secondary']};
                    --accent: ${CSS_VARS.dark['--accent']};
                    --success: ${CSS_VARS.dark['--success']};
                    --warning: ${CSS_VARS.dark['--warning']};
                    --danger: ${CSS_VARS.dark['--danger']};
                    --border: ${CSS_VARS.dark['--border']};
                    --spacing-xs: ${CSS_VARS.dark['--spacing-xs']};
                    --spacing-sm: ${CSS_VARS.dark['--spacing-sm']};
                    --spacing-md: ${CSS_VARS.dark['--spacing-md']};
                    --spacing-lg: ${CSS_VARS.dark['--spacing-lg']};
                    --glass-bg: ${CSS_VARS.dark['--glass-bg']};
                    --glass-border: ${CSS_VARS.dark['--glass-border']};
                }

                /* Dark Theme */
                body.dex-dark-theme {
                    --primary: ${CSS_VARS.dark['--primary']};
                    --primary-dark: ${CSS_VARS.dark['--primary-dark']};
                    --secondary: ${CSS_VARS.dark['--secondary']};
                    --background: ${CSS_VARS.dark['--background']};
                    --surface: ${CSS_VARS.dark['--surface']};
                    --surface-light: ${CSS_VARS.dark['--surface-light']};
                    --text: ${CSS_VARS.dark['--text']};
                    --text-secondary: ${CSS_VARS.dark['--text-secondary']};
                    --accent: ${CSS_VARS.dark['--accent']};
                    --success: ${CSS_VARS.dark['--success']};
                    --warning: ${CSS_VARS.dark['--warning']};
                    --danger: ${CSS_VARS.dark['--danger']};
                    --border: ${CSS_VARS.dark['--border']};
                    --glass-bg: ${CSS_VARS.dark['--glass-bg']};
                    --glass-border: ${CSS_VARS.dark['--glass-border']};
                }

                /* Light Theme */
                body.dex-light-theme {
                    --background: ${CSS_VARS.light['--background']};
                    --surface: ${CSS_VARS.light['--surface']};
                    --surface-light: ${CSS_VARS.light['--surface-light']};
                    --text: ${CSS_VARS.light['--text']};
                    --text-secondary: ${CSS_VARS.light['--text-secondary']};
                    --border: ${CSS_VARS.light['--border']};
                    --glass-bg: ${CSS_VARS.light['--glass-bg']};
                    --glass-border: ${CSS_VARS.light['--glass-border']};
                }

                /* Blue Theme */
                body.dex-blue-theme {
                    --primary: ${CSS_VARS.blue['--primary']};
                    --primary-dark: ${CSS_VARS.blue['--primary-dark']};
                    --secondary: ${CSS_VARS.blue['--secondary']};
                    --background: ${CSS_VARS.blue['--background']};
                    --surface: ${CSS_VARS.blue['--surface']};
                    --surface-light: ${CSS_VARS.blue['--surface-light']};
                    --text: ${CSS_VARS.blue['--text']};
                    --text-secondary: ${CSS_VARS.blue['--text-secondary']};
                    --accent: ${CSS_VARS.blue['--accent']};
                    --success: ${CSS_VARS.blue['--success']};
                    --warning: ${CSS_VARS.blue['--warning']};
                    --danger: ${CSS_VARS.blue['--danger']};
                    --border: ${CSS_VARS.blue['--border']};
                    --glass-bg: ${CSS_VARS.blue['--glass-bg']};
                    --glass-border: ${CSS_VARS.blue['--glass-border']};
                }

                /* Green Theme */
                body.dex-green-theme {
                    --primary: ${CSS_VARS.green['--primary']};
                    --primary-dark: ${CSS_VARS.green['--primary-dark']};
                    --secondary: ${CSS_VARS.green['--secondary']};
                    --background: ${CSS_VARS.green['--background']};
                    --surface: ${CSS_VARS.green['--surface']};
                    --surface-light: ${CSS_VARS.green['--surface-light']};
                    --text: ${CSS_VARS.green['--text']};
                    --text-secondary: ${CSS_VARS.green['--text-secondary']};
                    --accent: ${CSS_VARS.green['--accent']};
                    --success: ${CSS_VARS.green['--success']};
                    --warning: ${CSS_VARS.green['--warning']};
                    --danger: ${CSS_VARS.green['--danger']};
                    --border: ${CSS_VARS.green['--border']};
                    --glass-bg: ${CSS_VARS.green['--glass-bg']};
                    --glass-border: ${CSS_VARS.green['--glass-border']};
                }

                /* Purple Theme */
                body.dex-purple-theme {
                    --primary: ${CSS_VARS.purple['--primary']};
                    --primary-dark: ${CSS_VARS.purple['--primary-dark']};
                    --secondary: ${CSS_VARS.purple['--secondary']};
                    --background: ${CSS_VARS.purple['--background']};
                    --surface: ${CSS_VARS.purple['--surface']};
                    --surface-light: ${CSS_VARS.purple['--surface-light']};
                    --text: ${CSS_VARS.purple['--text']};
                    --text-secondary: ${CSS_VARS.purple['--text-secondary']};
                    --accent: ${CSS_VARS.purple['--accent']};
                    --success: ${CSS_VARS.purple['--success']};
                    --warning: ${CSS_VARS.purple['--warning']};
                    --danger: ${CSS_VARS.purple['--danger']};
                    --border: ${CSS_VARS.purple['--border']};
                    --glass-bg: ${CSS_VARS.purple['--glass-bg']};
                    --glass-border: ${CSS_VARS.purple['--glass-border']};
                }

                /* High Contrast Theme */
                body.dex-highcontrast-theme {
                    --primary: ${CSS_VARS.highcontrast['--primary']};
                    --primary-dark: ${CSS_VARS.highcontrast['--primary-dark']};
                    --secondary: ${CSS_VARS.highcontrast['--secondary']};
                    --background: ${CSS_VARS.highcontrast['--background']};
                    --surface: ${CSS_VARS.highcontrast['--surface']};
                    --surface-light: ${CSS_VARS.highcontrast['--surface-light']};
                    --text: ${CSS_VARS.highcontrast['--text']};
                    --text-secondary: ${CSS_VARS.highcontrast['--text-secondary']};
                    --accent: ${CSS_VARS.highcontrast['--accent']};
                    --success: ${CSS_VARS.highcontrast['--success']};
                    --warning: ${CSS_VARS.highcontrast['--warning']};
                    --danger: ${CSS_VARS.highcontrast['--danger']};
                    --border: ${CSS_VARS.highcontrast['--border']};
                    --glass-bg: ${CSS_VARS.highcontrast['--glass-bg']};
                    --glass-border: ${CSS_VARS.highcontrast['--glass-border']};
                }

                /* Main Sidebar */
                #dexSidebar {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: ${state.uiState.sidebarWidth}px;
                    height: 100%;
                    background: var(--background);
                    color: var(--text);
                    overflow: hidden;
                    transform: translateX(-100%);
                    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    z-index: 999999;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    font-size: 13px;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
                    display: flex;
                    flex-direction: column;
                }

                #dexSidebar.open {
                    transform: translateX(0);
                }

                /* DOM Tools Toolbar */
                #domToolsBar {
                    position: fixed;
                    top: 10px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: var(--surface);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    padding: 8px 12px;
                    display: flex;
                    gap: 10px;
                    z-index: 10000000;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                    opacity: 0;
                    transition: opacity 0.3s ease, transform 0.3s ease;
                }

                #domToolsBar.visible {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }

                #domToolsBar.collapsed {
                    transform: translateX(-50%) translateY(-40px);
                }

                .dom-tool-btn {
                    background: var(--surface-light);
                    border: none;
                    color: var(--text);
                    border-radius: 8px;
                    padding: 8px 10px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    transition: all 0.2s ease;
                }

                .dom-tool-btn:hover {
                    background: var(--accent);
                    color: white;
                    transform: translateY(-2px);
                }

                .dom-tool-btn.active {
                    background: var(--primary);
                    color: white;
                }

                /* Toggle Buttons */
                .dex-toggle-btn {
                    position: fixed;
                    top: 15px;
                    background: var(--primary);
                    color: white;
                    padding: 8px 12px;
                    border-radius: 8px;
                    cursor: pointer;
                    z-index: 1000000;
                    font-size: 13px;
                    font-weight: 600;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.2s ease;
                }

                .dex-toggle-btn:hover {
                    background: var(--primary-dark);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
                }

                #dexToggle {
                    left: 15px;
                }

                /* Header Styles */
                .dex-header {
                    padding: var(--spacing-md);
                    background: var(--surface);
                    border-bottom: 1px solid var(--border);
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    flex-shrink: 0;
                }

                .dex-title {
                    font-size: 16px;
                    font-weight: 700;
                    margin-bottom: var(--spacing-sm);
                    color: var(--text);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .dex-logo {
                    width: 22px;
                    height: 22px;
                    background: var(--primary);
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 12px;
                }

                /* Theme Selector */
                .dex-theme-selector {
                    position: relative;
                    display: inline-block;
                }

                .dex-theme-toggle {
                    background: var(--surface-light);
                    border: 1px solid var(--border);
                    border-radius: 6px;
                    color: var(--text);
                    cursor: pointer;
                    padding: 4px 8px;
                    font-size: 11px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    transition: all 0.2s ease;
                }

                .dex-theme-toggle:hover {
                    background: var(--accent);
                    color: white;
                }

                .dex-theme-dropdown {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    background: var(--surface);
                    border: 1px solid var(--border);
                    border-radius: 6px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                    z-index: 100;
                    min-width: 150px;
                    display: none;
                    margin-top: 4px;
                }

                .dex-theme-dropdown.show {
                    display: block;
                }

                .dex-theme-option {
                    padding: 8px 12px;
                    cursor: pointer;
                    transition: background 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .dex-theme-option:hover {
                    background: var(--surface-light);
                }

                .dex-theme-option.active {
                    background: var(--primary);
                    color: white;
                }

                /* Search and Controls */
                #dexSearch {
                    width: 100%;
                    padding: 8px 10px;
                    background: var(--background);
                    border: 1px solid var(--border);
                    color: var(--text);
                    border-radius: 8px;
                    margin-bottom: var(--spacing-sm);
                    font-size: 13px;
                    transition: all 0.2s ease;
                }

                #dexSearch:focus {
                    outline: none;
                    border-color: var(--primary);
                    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
                }

                .dex-controls {
                    display: flex;
                    gap: var(--spacing-xs);
                    margin-bottom: var(--spacing-xs);
                }

                .dex-btn {
                    flex: 1;
                    padding: 6px 8px;
                    background: var(--surface-light);
                    border: none;
                    color: var(--text);
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .dex-btn:hover {
                    background: var(--accent);
                    color: white;
                }

                /* Tree Container */
                .dex-tree-container {
                    flex: 1;
                    overflow-y: auto;
                    position: relative;
                }

                .dex-node {
                    padding: 6px 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    position: relative;
                    transition: background 0.2s ease;
                    border-radius: 6px;
                    margin: 1px 4px;
                }

                .dex-node:hover {
                    background: rgba(129, 140, 248, 0.1);
                }

                .dex-node.selected {
                    background: rgba(79, 70, 229, 0.2);
                    border-left: 3px solid var(--primary);
                }

                .dex-icon {
                    width: 16px;
                    height: 16px;
                    margin-right: 6px;
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                }

                .dex-toggle {
                    width: 14px;
                    height: 14px;
                    margin-right: 2px;
                    cursor: pointer;
                    flex-shrink: 0;
                    opacity: 0.7;
                    transition: transform 0.2s ease;
                    font-size: 10px;
                }

                .dex-toggle:hover {
                    opacity: 1;
                }

                .dex-toggle.expanded {
                    transform: rotate(90deg);
                }

                .dex-children {
                    display: none;
                    margin-left: 8px;
                    border-left: 1px dashed var(--border);
                }

                .dex-children.expanded {
                    display: block;
                }

                /* Resize Handle */
                .dex-panel-resize {
                    height: 8px;
                    background: var(--surface-light);
                    cursor: ns-resize;
                    position: relative;
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .dex-panel-resize:hover {
                    background: var(--accent);
                }

                .dex-panel-resize::before {
                    content: '';
                    width: 30px;
                    height: 2px;
                    background: var(--text-secondary);
                    border-radius: 1px;
                }

                /* Properties Panel */
                .dex-properties-container {
                    height: ${state.uiState.sidebarHeight};
                    background: var(--surface);
                    border-top: 1px solid var(--border);
                    display: flex;
                    flex-direction: column;
                    flex-shrink: 0;
                }

                .dex-properties-header {
                    padding: var(--spacing-md);
                    border-bottom: 1px solid var(--border);
                    flex-shrink: 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .dex-properties-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--text);
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .dex-properties-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: var(--spacing-md);
                }

                /* Tabs */
                .dex-prop-tabs {
                    display: flex;
                    border-bottom: 1px solid var(--border);
                    margin-bottom: var(--spacing-sm);
                    gap: var(--spacing-xs);
                    flex-wrap: wrap;
                }

                .dex-prop-tab {
                    padding: 6px 10px;
                    cursor: pointer;
                    background: transparent;
                    border: none;
                    color: var(--text-secondary);
                    font-size: 12px;
                    font-weight: 500;
                    border-bottom: 2px solid transparent;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                    border-radius: 6px 6px 0 0;
                }

                .dex-prop-tab:hover {
                    background: rgba(129, 140, 248, 0.1);
                }

                .dex-prop-tab.active {
                    color: var(--primary);
                    border-bottom-color: var(--primary);
                    background: rgba(79, 70, 229, 0.1);
                }

                .dex-prop-content {
                    display: none;
                    animation: fadeIn 0.3s ease;
                }

                .dex-prop-content.active {
                    display: block;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* Highlight */
                .dex-highlight {
                    outline: 2px solid var(--primary) !important;
                    outline-offset: 2px !important;
                    background-color: rgba(79, 70, 229, 0.15) !important;
                }

                .dex-pinned-highlight {
                    outline: 2px solid var(--warning) !important;
                    outline-offset: 2px !important;
                    background-color: rgba(245, 158, 11, 0.15) !important;
                }

                .dex-search-highlight {
                    background-color: rgba(245, 158, 11, 0.2);
                    border-radius: 6px;
                }

                /* Resize Handle for Sidebar */
                #dexResize {
                    position: absolute;
                    top: 0;
                    right: 0;
                    width: 5px;
                    height: 100%;
                    cursor: ew-resize;
                    background: transparent;
                    z-index: 1000;
                }

                #dexResize:hover {
                    background: var(--accent);
                }

                /* Context Menu */
                .dex-context-menu {
                    position: fixed;
                    background: var(--surface);
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
                    z-index: 10000000;
                    padding: 6px;
                    min-width: 220px;
                    display: none;
                    font-size: 12px;
                }

                .dex-context-item {
                    padding: 8px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--text);
                    transition: all 0.2s ease;
                }

                .dex-context-item:hover {
                    background: rgba(129, 140, 248, 0.1);
                }

                .dex-context-item.danger {
                    color: var(--danger);
                }

                .dex-context-item.danger:hover {
                    background: rgba(239, 68, 68, 0.1);
                }

                .dex-context-divider {
                    height: 1px;
                    background: var(--border);
                    margin: 6px 0;
                }

                /* Toast Notification */
                .dex-toast {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: var(--surface);
                    color: var(--text);
                    padding: 12px 16px;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                    z-index: 10000000;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    transform: translateY(100px);
                    opacity: 0;
                    transition: all 0.3s ease;
                    max-width: 320px;
                }

                .dex-toast.show {
                    transform: translateY(0);
                    opacity: 1;
                }

                .dex-toast.success {
                    border-left: 4px solid var(--success);
                }

                .dex-toast.error {
                    border-left: 4px solid var(--danger);
                }

                .dex-toast.info {
                    border-left: 4px solid var(--primary);
                }

                /* Editable Properties */
                .dex-prop-group {
                    margin-bottom: var(--spacing-md);
                }

                .dex-prop-label {
                    display: block;
                    margin-bottom: 6px;
                    color: var(--text-secondary);
                    font-size: 11px;
                    font-weight: 500;
                }

                .dex-prop-input {
                    width: 100%;
                    padding: 8px 12px;
                    background: var(--background);
                    border: 1px solid var(--border);
                    color: var(--text);
                    border-radius: 6px;
                    font-size: 12px;
                    transition: all 0.2s ease;
                }

                .dex-prop-input:focus {
                    outline: none;
                    border-color: var(--primary);
                    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
                }

                .dex-prop-textarea {
                    width: 100%;
                    min-height: 80px;
                    padding: 8px 12px;
                    background: var(--background);
                    border: 1px solid var(--border);
                    color: var(--text);
                    border-radius: 6px;
                    font-size: 12px;
                    font-family: monospace;
                    resize: vertical;
                    transition: all 0.2s ease;
                }

                .dex-prop-textarea:focus {
                    outline: none;
                    border-color: var(--primary);
                    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
                }

                .dex-prop-select {
                    width: 100%;
                    padding: 8px 12px;
                    background: var(--background);
                    border: 1px solid var(--border);
                    color: var(--text);
                    border-radius: 6px;
                    font-size: 12px;
                    transition: all 0.2s ease;
                }

                .dex-prop-select:focus {
                    outline: none;
                    border-color: var(--primary);
                    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
                }

                /* Lists */
                .dex-attr-list, .dex-style-list {
                    margin-top: 8px;
                }

                .dex-attr-item, .dex-style-item {
                    display: flex;
                    align-items: center;
                    margin-bottom: 8px;
                    gap: 6px;
                }

                .dex-attr-name, .dex-style-name {
                    flex: 1;
                    padding: 6px 10px;
                    background: var(--background);
                    border: 1px solid var(--border);
                    color: var(--text);
                    border-radius: 4px;
                    font-size: 11px;
                    font-family: monospace;
                }

                .dex-attr-value, .dex-style-value {
                    flex: 2;
                    padding: 6px 10px;
                    background: var(--background);
                    border: 1px solid var(--border);
                    color: var(--text);
                    border-radius: 4px;
                    font-size: 11px;
                    font-family: monospace;
                }

                .dex-attr-remove, .dex-style-remove {
                    padding: 4px 8px;
                    background: var(--danger);
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 10px;
                }

                .dex-attr-add, .dex-style-add {
                    margin-top: 8px;
                    padding: 6px 12px;
                    background: var(--primary);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 500;
                }

                /* Edit Actions */
                .dex-edit-actions {
                    display: flex;
                    gap: var(--spacing-xs);
                    margin-top: var(--spacing-md);
                }

                .dex-edit-btn {
                    flex: 1;
                    padding: 8px 12px;
                    background: var(--surface-light);
                    border: none;
                    color: var(--text);
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                }

                .dex-edit-btn:hover {
                    background: var(--accent);
                    color: white;
                }

                .dex-edit-btn.save {
                    background: var(--success);
                    color: white;
                }

                .dex-edit-btn.cancel {
                    background: var(--danger);
                    color: white;
                }

                /* Events Panel */
                .dex-events {
                    margin-top: var(--spacing-md);
                }

                .dex-event-list {
                    margin-top: 8px;
                }

                .dex-event-item {
                    padding: 8px 12px;
                    background: var(--surface-light);
                    border-radius: 6px;
                    margin-bottom: 6px;
                    font-size: 11px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .dex-event-name {
                    font-family: monospace;
                    font-weight: 500;
                }

                .dex-event-remove {
                    padding: 4px 8px;
                    background: var(--danger);
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 10px;
                }

                /* Color Picker */
                .dex-color-input {
                    width: 32px;
                    height: 28px;
                    border: 1px solid var(--border);
                    border-radius: 4px;
                    cursor: pointer;
                }

                /* Empty State */
                .dex-empty-state {
                    text-align: center;
                    padding: 20px;
                    color: var(--text-secondary);
                }

                .dex-empty-icon {
                    font-size: 24px;
                    margin-bottom: 8px;
                    opacity: 0.7;
                }

                /* Info Panel */
                .dex-info-panel {
                    background: var(--surface-light);
                    border-radius: 6px;
                    padding: var(--spacing-sm);
                    margin-bottom: var(--spacing-md);
                    font-size: 11px;
                }

                .dex-info-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 6px;
                }

                .dex-info-label {
                    color: var(--text-secondary);
                }

                .dex-info-value {
                    font-family: monospace;
                    text-align: right;
                    word-break: break-all;
                }

                /* Search Filters */
                .search-filters {
                    display: flex;
                    gap: 6px;
                    margin-bottom: 8px;
                    flex-wrap: wrap;
                }

                .search-filter {
                    padding: 4px 8px;
                    background: var(--surface-light);
                    border: 1px solid var(--border);
                    border-radius: 4px;
                    color: var(--text);
                    font-size: 11px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .search-filter.active {
                    background: var(--primary);
                    color: white;
                    border-color: var(--primary);
                }

                /* Search Results Counter */
                .search-results {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                    font-size: 11px;
                    color: var(--text-secondary);
                }

                .download-all-btn {
                    padding: 4px 8px;
                    background: var(--primary);
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 10px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                }

                .download-all-btn:hover {
                    background: var(--primary-dark);
                }

                /* Media Viewer Modal */
                #mediaViewerModal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    display: none;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000001;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                #mediaViewerModal.show {
                    display: flex;
                    opacity: 1;
                }

                .media-viewer-container {
                    background: var(--surface);
                    border-radius: 12px;
                    width: 80%;
                    max-width: 900px;
                    height: 80%;
                    max-height: 700px;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
                    transform: scale(0.9);
                    transition: transform 0.3s ease;
                    overflow: hidden;
                }

                #mediaViewerModal.show .media-viewer-container {
                    transform: scale(1);
                }

                .media-viewer-header {
                    padding: 15px 20px;
                    border-bottom: 1px solid var(--border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: var(--surface-light);
                }

                .media-viewer-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: var(--text);
                }

                .media-viewer-close {
                    background: var(--danger);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 18px;
                    transition: all 0.2s ease;
                }

                .media-viewer-close:hover {
                    background: #dc2626;
                    transform: rotate(90deg);
                }

                .media-viewer-content {
                    flex: 1;
                    overflow: auto;
                    padding: 20px;
                }

                .media-item {
                    background: var(--background);
                    border-radius: 8px;
                    padding: 15px;
                    display: flex;
                    gap: 15px;
                    align-items: center;
                    margin-bottom: 15px;
                    transition: all 0.2s ease;
                }

                .media-item:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                }

                .media-preview {
                    width: 80px;
                    height: 80px;
                    border-radius: 8px;
                    object-fit: cover;
                    flex-shrink: 0;
                }

                .media-info {
                    flex: 1;
                }

                .media-title {
                    font-weight: 600;
                    margin-bottom: 6px;
                    color: var(--text);
                }

                .media-url {
                    font-size: 12px;
                    color: var(--text-secondary);
                    word-break: break-all;
                    margin-bottom: 10px;
                }

                .media-actions {
                    display: flex;
                    gap: 8px;
                }

                .media-btn {
                    padding: 6px 12px;
                    background: var(--primary);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                }

                .media-btn:hover {
                    background: var(--primary-dark);
                    transform: translateY(-1px);
                }

                .media-btn.secondary {
                    background: var(--surface-light);
                    color: var(--text);
                }

                .media-btn.secondary:hover {
                    background: var(--accent);
                    color: white;
                }

                /* Audio Player */
                .audio-player {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 300px;
                    background: var(--surface);
                    border-radius: 12px;
                    padding: 15px;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
                    z-index: 10000000;
                    display: none;
                    flex-direction: column;
                    gap: 10px;
                }

                .audio-player.show {
                    display: flex;
                }

                .audio-player-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 5px;
                }

                .audio-player-title {
                    font-weight: 600;
                    color: var(--text);
                }

                .audio-player-close {
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    font-size: 16px;
                    transition: all 0.2s ease;
                }

                .audio-player-close:hover {
                    color: var(--danger);
                    transform: rotate(90deg);
                }

                .audio-player-controls {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .audio-player-play {
                    background: var(--primary);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s ease;
                }

                .audio-player-play:hover {
                    background: var(--primary-dark);
                    transform: scale(1.1);
                }

                .audio-player-seek {
                    flex: 1;
                    height: 6px;
                    background: var(--surface-light);
                    border-radius: 3px;
                    cursor: pointer;
                    position: relative;
                }

                .audio-player-progress {
                    height: 100%;
                    background: var(--primary);
                    border-radius: 3px;
                    width: 0%;
                }

                .audio-player-time {
                    font-size: 11px;
                    color: var(--text-secondary);
                    min-width: 80px;
                    text-align: center;
                }

                .audio-player-volume {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }

                .audio-player-volume-slider {
                    width: 60px;
                    height: 4px;
                    background: var(--surface-light);
                    border-radius: 2px;
                    cursor: pointer;
                    position: relative;
                }

                .audio-player-volume-level {
                    height: 100%;
                    background: var(--primary);
                    border-radius: 2px;
                    width: 70%;
                }

                /* Storage Panel */
                .dex-storage-tabs {
                    display: flex;
                    margin-bottom: var(--spacing-md);
                }

                .dex-storage-tab {
                    flex: 1;
                    padding: 6px 10px;
                    background: var(--surface-light);
                    border: none;
                    color: var(--text);
                    border-radius: 6px 6px 0 0;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                }

                .dex-storage-tab.active {
                    background: var(--primary);
                    color: white;
                }

                .dex-storage-content {
                    background: var(--background);
                    border: 1px solid var(--border);
                    border-radius: 0 6px 6px 6px;
                    padding: 10px;
                    min-height: 100px;
                }

                .dex-storage-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 6px 0;
                    border-bottom: 1px solid var(--border);
                }

                .dex-storage-key {
                    font-family: monospace;
                    font-weight: 500;
                }

                .dex-storage-value {
                    font-family: monospace;
                    font-size: 10px;
                    max-width: 60%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .dex-storage-actions {
                    display: flex;
                    gap: 6px;
                }

                .dex-storage-btn {
                    padding: 3px 8px;
                    background: var(--surface-light);
                    border: none;
                    color: var(--text);
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 10px;
                }

                .dex-storage-btn:hover {
                    background: var(--accent);
                    color: white;
                }

                /* Shadow DOM Indicator */
                .dex-shadow-indicator {
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    background: var(--warning);
                    border-radius: 50%;
                    margin-left: 4px;
                }

                /* Iframe Indicator */
                .dex-iframe-indicator {
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    background: var(--success);
                    border-radius: 50%;
                    margin-left: 4px;
                }

                /* Performance Tab */
                .performance-metrics {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .metric-card {
                    background: var(--background);
                    border-radius: 8px;
                    padding: 15px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .metric-title {
                    font-weight: 600;
                    color: var(--text);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .metric-value {
                    font-size: 24px;
                    font-weight: 700;
                    color: var(--primary);
                }

                .metric-bar {
                    height: 8px;
                    background: var(--surface-light);
                    border-radius: 4px;
                    overflow: hidden;
                }

                .metric-fill {
                    height: 100%;
                    background: var(--primary);
                    border-radius: 4px;
                    transition: width 1s ease;
                }

                .metric-warning {
                    color: var(--warning);
                    font-size: 12px;
                    margin-top: 5px;
                }

                .performance-chart {
                    margin-top: 10px;
                    height: 100px;
                    background: var(--background);
                    border-radius: 8px;
                    padding: 10px;
                    display: flex;
                    align-items: flex-end;
                    gap: 5px;
                }

                .chart-bar {
                    flex: 1;
                    background: var(--primary);
                    border-radius: 3px 3px 0 0;
                    transition: height 1s ease;
                }

                /* Accessibility Tab */
                .accessibility-results {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .accessibility-item {
                    background: var(--background);
                    border-radius: 8px;
                    padding: 15px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .accessibility-status {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .accessibility-icon {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                }

                .accessibility-icon.pass {
                    background: var(--success);
                    color: white;
                }

                .accessibility-icon.fail {
                    background: var(--danger);
                    color: white;
                }

                .accessibility-icon.warning {
                    background: var(--warning);
                    color: white;
                }

                .accessibility-title {
                    font-weight: 600;
                    color: var(--text);
                }

                .accessibility-description {
                    font-size: 12px;
                    color: var(--text-secondary);
                }

                .accessibility-suggestion {
                    font-size: 12px;
                    color: var(--accent);
                    margin-top: 5px;
                }

                /* Ruler Tool */
                .ruler-tool {
                    position: fixed;
                    border: 2px dashed var(--warning);
                    background: rgba(245, 158, 11, 0.1);
                    pointer-events: none;
                    z-index: 9999999;
                    display: none;
                }

                .ruler-label {
                    position: absolute;
                    bottom: -25px;
                    left: 0;
                    background: var(--warning);
                    color: white;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 500;
                    white-space: nowrap;
                }

                /* Resize Handles */
                .resize-handle {
                    position: absolute;
                    background: transparent;
                    z-index: 10;
                }

                .resize-handle.nw {
                    top: 0;
                    left: 0;
                    width: 15px;
                    height: 15px;
                    cursor: nw-resize;
                }

                .resize-handle.ne {
                    top: 0;
                    right: 0;
                    width: 15px;
                    height: 15px;
                    cursor: ne-resize;
                }

                .resize-handle.sw {
                    bottom: 0;
                    left: 0;
                    width: 15px;
                    height: 15px;
                    cursor: sw-resize;
                }

                .resize-handle.se {
                    bottom: 0;
                    right: 0;
                    width: 15px;
                    height: 15px;
                    cursor: se-resize;
                }

                .resize-handle.n {
                    top: 0;
                    left: 15px;
                    right: 15px;
                    height: 10px;
                    cursor: n-resize;
                }

                .resize-handle.s {
                    bottom: 0;
                    left: 15px;
                    right: 15px;
                    height: 10px;
                    cursor: s-resize;
                }

                .resize-handle.w {
                    left: 0;
                    top: 15px;
                    bottom: 15px;
                    width: 10px;
                    cursor: w-resize;
                }

                .resize-handle.e {
                    right: 0;
                    top: 15px;
                    bottom: 15px;
                    width: 10px;
                    cursor: e-resize;
                }

                /* Draggable Handle */
                .draggable-handle {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 30px;
                    cursor: move;
                    z-index: 5;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .draggable-handle::after {
                    content: '⋮⋮';
                    color: var(--text-secondary);
                    font-size: 12px;
                }

                /* Export Button */
                .export-btn {
                    padding: 6px 10px;
                    background: var(--primary);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }

                .export-btn:hover {
                    background: var(--primary-dark);
                    transform: translateY(-1px);
                }

                /* Breadcrumb Navigation */
                .breadcrumb-nav {
                    padding: var(--spacing-sm);
                    background: var(--surface-light);
                    border-radius: 6px;
                    margin-bottom: var(--spacing-md);
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 4px;
                }

                .breadcrumb-item {
                    padding: 4px 8px;
                    background: var(--background);
                    border-radius: 4px;
                    font-size: 11px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .breadcrumb-item:hover {
                    background: var(--accent);
                    color: white;
                }

                .breadcrumb-separator {
                    color: var(--text-secondary);
                    font-size: 12px;
                }

                /* Pinned Elements Manager */
                .pinned-elements {
                    margin-top: var(--spacing-md);
                }

                .pinned-element-item {
                    background: var(--surface-light);
                    border-radius: 6px;
                    padding: 10px;
                    margin-bottom: 8px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .pinned-element-info {
                    flex: 1;
                    min-width: 0;
                }

                .pinned-element-name {
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .pinned-element-path {
                    font-size: 10px;
                    color: var(--text-secondary);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .pinned-element-actions {
                    display: flex;
                    gap: 4px;
                }

                .pinned-element-btn {
                    padding: 4px 8px;
                    background: var(--surface);
                    border: none;
                    border-radius: 4px;
                    color: var(--text);
                    cursor: pointer;
                    font-size: 10px;
                    transition: all 0.2s ease;
                }

                .pinned-element-btn:hover {
                    background: var(--accent);
                    color: white;
                }

                /* Snippet Runner */
                .snippet-runner {
                    margin-top: var(--spacing-md);
                }

                .snippet-editor {
                    background: var(--background);
                    border: 1px solid var(--border);
                    border-radius: 6px;
                    padding: 10px;
                    font-family: monospace;
                    font-size: 12px;
                    min-height: 100px;
                    width: 100%;
                    color: var(--text);
                    resize: vertical;
                    margin-bottom: 10px;
                }

                .snippet-actions {
                    display: flex;
                    gap: 8px;
                }

                .snippet-btn {
                    padding: 6px 12px;
                    background: var(--primary);
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                }

                .snippet-btn:hover {
                    background: var(--primary-dark);
                }

                .snippet-btn.secondary {
                    background: var(--surface-light);
                    color: var(--text);
                }

                .snippet-btn.secondary:hover {
                    background: var(--accent);
                    color: white;
                }

                /* Network Request Logger */
                .network-logger {
                    margin-top: var(--spacing-md);
                }

                .network-filters {
                    display: flex;
                    gap: 6px;
                    margin-bottom: 10px;
                    flex-wrap: wrap;
                }

                .network-filter {
                    padding: 4px 8px;
                    background: var(--surface-light);
                    border: 1px solid var(--border);
                    border-radius: 4px;
                    color: var(--text);
                    font-size: 11px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .network-filter.active {
                    background: var(--primary);
                    color: white;
                    border-color: var(--primary);
                }

                .network-request-list {
                    max-height: 300px;
                    overflow-y: auto;
                }

                .network-request-item {
                    background: var(--background);
                    border-radius: 6px;
                    padding: 8px;
                    margin-bottom: 6px;
                    font-size: 11px;
                }

                .network-request-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 4px;
                }

                .network-request-method {
                    font-weight: 600;
                    padding: 2px 6px;
                    border-radius: 3px;
                    color: white;
                    font-size: 10px;
                }

                .network-request-method.GET { background: var(--success); }
                .network-request-method.POST { background: var(--primary); }
                .network-request-method.PUT { background: var(--warning); }
                .network-request-method.DELETE { background: var(--danger); }

                .network-request-url {
                    font-family: monospace;
                    font-size: 10px;
                    color: var(--text-secondary);
                    word-break: break-all;
                }

                .network-request-status {
                    font-size: 10px;
                    padding: 2px 6px;
                    border-radius: 3px;
                    color: white;
                }

                .network-request-status.success { background: var(--success); }
                .network-request-status.error { background: var(--danger); }
                .network-request-status.pending { background: var(--warning); }

                .network-request-details {
                    margin-top: 6px;
                    font-size: 10px;
                    color: var(--text-secondary);
                }

                /* Screenshot Tool */
                .screenshot-tool {
                    margin-top: var(--spacing-md);
                }

                .screenshot-options {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 10px;
                }

                .screenshot-option {
                    flex: 1;
                    padding: 8px;
                    background: var(--surface-light);
                    border: 1px solid var(--border);
                    border-radius: 6px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .screenshot-option:hover {
                    background: var(--accent);
                    color: white;
                }

                .screenshot-option.active {
                    background: var(--primary);
                    color: white;
                    border-color: var(--primary);
                }

                .screenshot-preview {
                    background: var(--background);
                    border: 1px solid var(--border);
                    border-radius: 6px;
                    min-height: 150px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 10px;
                    overflow: hidden;
                }

                .screenshot-preview img {
                    max-width: 100%;
                    max-height: 300px;
                }

                /* Error Log Tab */
                .error-log {
                    margin-top: var(--spacing-md);
                }

                .error-log-list {
                    max-height: 300px;
                    overflow-y: auto;
                }

                .error-log-item {
                    background: var(--background);
                    border-radius: 6px;
                    padding: 8px;
                    margin-bottom: 6px;
                    font-size: 11px;
                }

                .error-log-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 4px;
                }

                .error-log-message {
                    font-weight: 500;
                    color: var(--danger);
                }

                .error-log-time {
                    font-size: 10px;
                    color: var(--text-secondary);
                }

                .error-log-details {
                    font-family: monospace;
                    font-size: 10px;
                    color: var(--text-secondary);
                    white-space: pre-wrap;
                    max-height: 100px;
                    overflow-y: auto;
                }

                /* CSS Grid/Flex Inspector */
                .grid-flex-inspector {
                    margin-top: var(--spacing-md);
                }

                .grid-flex-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 999998;
                }

                .grid-line {
                    position: absolute;
                    background: rgba(99, 102, 241, 0.7);
                }

                .grid-line.horizontal {
                    height: 1px;
                    width: 100%;
                }

                .grid-line.vertical {
                    width: 1px;
                    height: 100%;
                }

                .flex-line {
                    position: absolute;
                    background: rgba(245, 158, 11, 0.7);
                }

                .flex-line.horizontal {
                    height: 1px;
                    width: 100%;
                }

                .flex-line.vertical {
                    width: 1px;
                    height: 100%;
                }

                /* Global CSS Injection */
                .css-injection {
                    margin-top: var(--spacing-md);
                }

                .css-editor {
                    background: var(--background);
                    border: 1px solid var(--border);
                    border-radius: 6px;
                    padding: 10px;
                    font-family: monospace;
                    font-size: 12px;
                    min-height: 100px;
                    width: 100%;
                    color: var(--text);
                    resize: vertical;
                    margin-bottom: 10px;
                }

                .css-actions {
                    display: flex;
                    gap: 8px;
                }

                .css-btn {
                    padding: 6px 12px;
                    background: var(--primary);
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                }

                .css-btn:hover {
                    background: var(--primary-dark);
                }

                .css-btn.secondary {
                    background: var(--surface-light);
                    color: var(--text);
                }

                .css-btn.secondary:hover {
                    background: var(--accent);
                    color: white;
                }

                /* Export Options */
                .export-options {
                    margin-top: var(--spacing-md);
                }

                .export-format {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 10px;
                }

                .export-format-option {
                    flex: 1;
                    padding: 8px;
                    background: var(--surface-light);
                    border: 1px solid var(--border);
                    border-radius: 6px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .export-format-option:hover {
                    background: var(--accent);
                    color: white;
                }

                .export-format-option.active {
                    background: var(--primary);
                    color: white;
                    border-color: var(--primary);
                }

                /* Undo/Redo Controls */
                .undo-redo-controls {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 10px;
                }

                .undo-redo-btn {
                    padding: 6px 12px;
                    background: var(--surface-light);
                    border: none;
                    border-radius: 4px;
                    color: var(--text);
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .undo-redo-btn:hover:not(:disabled) {
                    background: var(--accent);
                    color: white;
                }

                .undo-redo-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                /* Batch Operations */
                .batch-operations {
                    margin-top: var(--spacing-md);
                }

                .batch-selection {
                    background: var(--surface-light);
                    border-radius: 6px;
                    padding: 10px;
                    margin-bottom: 10px;
                }

                .batch-selection-title {
                    font-weight: 500;
                    margin-bottom: 6px;
                }

                .batch-selection-count {
                    font-size: 11px;
                    color: var(--text-secondary);
                }

                .batch-actions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                }

                .batch-action-btn {
                    padding: 6px 10px;
                    background: var(--surface);
                    border: 1px solid var(--border);
                    border-radius: 4px;
                    color: var(--text);
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                }

                .batch-action-btn:hover {
                    background: var(--accent);
                    color: white;
                }

                /* Compact Mode */
                .compact-mode .dex-header {
                    padding: 6px;
                }

                .compact-mode .dex-title {
                    font-size: 14px;
                    margin-bottom: 4px;
                }

                .compact-mode .dex-controls {
                    gap: 2px;
                }

                .compact-mode .dex-btn {
                    padding: 4px 6px;
                    font-size: 10px;
                }

                .compact-mode .dex-node {
                    padding: 4px 6px;
                }

                .compact-mode .dex-prop-tabs {
                    gap: 2px;
                }

                .compact-mode .dex-prop-tab {
                    padding: 4px 8px;
                    font-size: 11px;
                }

                .compact-mode .dex-properties-content {
                    padding: 8px;
                }

                /* Console Panel */
                .console-panel {
                    margin-top: var(--spacing-md);
                    display: flex;
                    flex-direction: column;
                    height: 300px;
                }

                .console-output {
                    flex: 1;
                    background: var(--background);
                    border: 1px solid var(--border);
                    border-radius: 6px;
                    padding: 10px;
                    font-family: monospace;
                    font-size: 12px;
                    overflow-y: auto;
                    margin-bottom: 10px;
                    white-space: pre-wrap;
                }

                .console-input-container {
                    display: flex;
                    gap: 8px;
                }

                .console-input {
                    flex: 1;
                    background: var(--background);
                    border: 1px solid var(--border);
                    border-radius: 6px;
                    padding: 8px 12px;
                    font-family: monospace;
                    font-size: 12px;
                    color: var(--text);
                }

                .console-input:focus {
                    outline: none;
                    border-color: var(--primary);
                    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
                }

                .console-run {
                    padding: 8px 12px;
                    background: var(--primary);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                }

                .console-run:hover {
                    background: var(--primary-dark);
                }

                .console-message {
                    margin-bottom: 5px;
                    padding: 2px 0;
                }

                .console-message.error {
                    color: var(--danger);
                }

                .console-message.warning {
                    color: var(--warning);
                }

                .console-message.info {
                    color: var(--text-secondary);
                }

                .console-message.success {
                    color: var(--success);
                }

                /* Responsive Design Tester */
                .responsive-tester {
                    margin-top: var(--spacing-md);
                }

                .responsive-sizes {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 10px;
                    flex-wrap: wrap;
                }

                .responsive-size {
                    flex: 1;
                    min-width: 100px;
                    padding: 8px;
                    background: var(--surface-light);
                    border: 1px solid var(--border);
                    border-radius: 6px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .responsive-size:hover {
                    background: var(--accent);
                    color: white;
                }

                .responsive-size.active {
                    background: var(--primary);
                    color: white;
                    border-color: var(--primary);
                }

                .responsive-size-name {
                    font-weight: 500;
                    margin-bottom: 4px;
                }

                .responsive-size-dimensions {
                    font-size: 10px;
                    color: var(--text-secondary);
                }

                .responsive-size.active .responsive-size-dimensions {
                    color: rgba(255, 255, 255, 0.8);
                }

                .responsive-preview {
                    background: var(--background);
                    border: 1px solid var(--border);
                    border-radius: 6px;
                    padding: 10px;
                    margin-bottom: 10px;
                    text-align: center;
                }

                .responsive-iframe {
                    border: 1px solid var(--border);
                    border-radius: 4px;
                    max-width: 100%;
                }

                /* Color Picker Tool */
                .color-picker-tool {
                    margin-top: var(--spacing-md);
                }

                .color-picker-display {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 10px;
                }

                .color-picker-preview {
                    width: 50px;
                    height: 50px;
                    border: 1px solid var(--border);
                    border-radius: 6px;
                    cursor: crosshair;
                }

                .color-picker-info {
                    flex: 1;
                }

                .color-picker-value {
                    font-family: monospace;
                    font-size: 14px;
                    margin-bottom: 5px;
                }

                .color-picker-actions {
                    display: flex;
                    gap: 6px;
                }

                .color-picker-btn {
                    padding: 4px 8px;
                    background: var(--surface-light);
                    border: none;
                    border-radius: 4px;
                    color: var(--text);
                    cursor: pointer;
                    font-size: 10px;
                    transition: all 0.2s ease;
                }

                .color-picker-btn:hover {
                    background: var(--accent);
                    color: white;
                }

                .color-picker-history {
                    display: flex;
                    gap: 6px;
                    margin-top: 10px;
                    flex-wrap: wrap;
                }

                .color-history-item {
                    width: 30px;
                    height: 30px;
                    border: 1px solid var(--border);
                    border-radius: 4px;
                    cursor: pointer;
                }

                /* Mobile Responsiveness */
                @media (max-width: 768px) {
                    #dexSidebar {
                        width: 100% !important;
                        max-width: 100%;
                    }

                    .media-viewer-container {
                        width: 95% !important;
                        height: 90% !important;
                    }

                    .audio-player {
                        width: 90%;
                        right: 5%;
                    }
                }
            `;

            GM_addStyle(styles);
        } catch (e) {
            logError('Error injecting styles', e);
        }
    }

    // ======== DOM ELEMENT CREATION ========
    /**
     * Create main UI elements
     */
    function createUI() {
        try {
            // Create main sidebar
            const sidebar = document.createElement('div');
            sidebar.id = 'dexSidebar';
            sidebar.style.width = `${state.uiState.sidebarWidth}px`;
            document.body.appendChild(sidebar);

            // Create main toggle button
            const toggle = document.createElement('div');
            toggle.id = 'dexToggle';
            toggle.className = 'dex-toggle-btn';
            toggle.innerHTML = '<span>☰</span> <span>DOM Explorer</span>';
            toggle.setAttribute('aria-label', 'Toggle DOM Explorer');
            toggle.setAttribute('role', 'button');
            document.body.appendChild(toggle);

            // Build main sidebar header
            const header = document.createElement('div');
            header.className = 'dex-header';

            const title = document.createElement('div');
            title.className = 'dex-title';

            const logo = document.createElement('div');
            logo.className = 'dex-logo';
            logo.textContent = 'D';

            const titleText = document.createElement('span');
            titleText.textContent = 'DOM Explorer Pro';

            // Theme selector
            const themeSelector = document.createElement('div');
            themeSelector.className = 'dex-theme-selector';

            const themeToggle = document.createElement('button');
            themeToggle.className = 'dex-theme-toggle';

            // Set theme icon based on current theme
            let themeIcon = '🌙';
            if (state.theme === 'light') themeIcon = '☀️';
            else if (state.theme === 'blue') themeIcon = '💧';
            else if (state.theme === 'green') themeIcon = '🌿';
            else if (state.theme === 'purple') themeIcon = '🔮';
            else if (state.theme === 'highcontrast') themeIcon = '⚫';

            themeToggle.innerHTML = `<span>${themeIcon}</span> <span>${state.theme.charAt(0).toUpperCase() + state.theme.slice(1)}</span>`;
            themeToggle.setAttribute('aria-label', 'Select theme');

            // Theme dropdown
            const themeDropdown = document.createElement('div');
            themeDropdown.className = 'dex-theme-dropdown';

            const themes = [
                { id: 'dark', name: 'Dark', icon: '🌙' },
                { id: 'light', name: 'Light', icon: '☀️' },
                { id: 'blue', name: 'Blue', icon: '💧' },
                { id: 'green', name: 'Green', icon: '🌿' },
                { id: 'purple', name: 'Purple', icon: '🔮' },
                { id: 'highcontrast', name: 'High Contrast', icon: '⚫' }
            ];

            themes.forEach(theme => {
                const themeOption = document.createElement('div');
                themeOption.className = `dex-theme-option ${theme.id === state.theme ? 'active' : ''}`;
                themeOption.innerHTML = `<span>${theme.icon}</span> <span>${theme.name}</span>`;
                themeOption.setAttribute('data-theme', theme.id);
                themeOption.setAttribute('role', 'option');
                themeOption.setAttribute('aria-selected', theme.id === state.theme ? 'true' : 'false');
                themeDropdown.appendChild(themeOption);
            });

            themeSelector.appendChild(themeToggle);
            themeSelector.appendChild(themeDropdown);

            // Toggle theme dropdown
            themeToggle.addEventListener('click', () => {
                themeDropdown.classList.toggle('show');
            });

            // Handle theme selection
            themeDropdown.querySelectorAll('.dex-theme-option').forEach(option => {
                option.addEventListener('click', () => {
                    const theme = option.dataset.theme;
                    applyTheme(theme);

                    // Update theme toggle text
                    let themeIcon = '🌙';
                    if (theme === 'light') themeIcon = '☀️';
                    else if (theme === 'blue') themeIcon = '💧';
                    else if (theme === 'green') themeIcon = '🌿';
                    else if (theme === 'purple') themeIcon = '🔮';
                    else if (theme === 'highcontrast') themeIcon = '⚫';

                    themeToggle.innerHTML = `<span>${themeIcon}</span> <span>${theme.charAt(0).toUpperCase() + theme.slice(1)}</span>`;

                    // Update active state
                    themeDropdown.querySelectorAll('.dex-theme-option').forEach(opt => {
                        opt.classList.remove('active');
                        opt.setAttribute('aria-selected', 'false');
                    });
                    option.classList.add('active');
                    option.setAttribute('aria-selected', 'true');

                    // Close dropdown
                    themeDropdown.classList.remove('show');
                });
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!themeSelector.contains(e.target)) {
                    themeDropdown.classList.remove('show');
                }
            });

            title.appendChild(logo);
            title.appendChild(titleText);
            title.appendChild(themeSelector);

            const searchInput = document.createElement('input');
            searchInput.id = 'dexSearch';
            searchInput.placeholder = '🔍 Search DOM elements...';
            searchInput.setAttribute('aria-label', 'Search DOM elements');

            // Add search filters
            const searchFilters = document.createElement('div');
            searchFilters.className = 'search-filters';
            searchFilters.innerHTML = `
                <div class="search-filter active" data-filter="all" role="button" tabindex="0" aria-label="Show all elements">All</div>
                <div class="search-filter" data-filter="image" role="button" tabindex="0" aria-label="Show images only">Images</div>
                <div class="search-filter" data-filter="audio" role="button" tabindex="0" aria-label="Show audio only">Audio</div>
                <div class="search-filter" data-filter="video" role="button" tabindex="0" aria-label="Show videos only">Video</div>
            `;

            // Add search results counter
            const searchResults = document.createElement('div');
            searchResults.className = 'search-results';
            searchResults.innerHTML = `
                <span class="results-count" aria-live="polite">0 results</span>
                <button class="download-all-btn" style="display: none;" aria-label="Download all media">Download All</button>
            `;

            const controls = document.createElement('div');
            controls.className = 'dex-controls';

            const expandAllBtn = document.createElement('button');
            expandAllBtn.className = 'dex-btn';
            expandAllBtn.textContent = 'Expand All';
            expandAllBtn.setAttribute('aria-label', 'Expand all DOM nodes');
            expandAllBtn.addEventListener('click', expandAll);

            const collapseAllBtn = document.createElement('button');
            collapseAllBtn.className = 'dex-btn';
            collapseAllBtn.textContent = 'Collapse All';
            collapseAllBtn.setAttribute('aria-label', 'Collapse all DOM nodes');
            collapseAllBtn.addEventListener('click', collapseAll);

            const refreshBtn = document.createElement('button');
            refreshBtn.className = 'dex-btn';
            refreshBtn.textContent = 'Refresh Tree';
            refreshBtn.setAttribute('aria-label', 'Refresh DOM tree');
            refreshBtn.addEventListener('click', refreshDOM);

            controls.appendChild(expandAllBtn);
            controls.appendChild(collapseAllBtn);
            controls.appendChild(refreshBtn);

            header.appendChild(title);
            header.appendChild(searchInput);
            header.appendChild(searchFilters);
            header.appendChild(searchResults);
            header.appendChild(controls);
            sidebar.appendChild(header);

            // DOM tree container
            const treeContainer = document.createElement('div');
            treeContainer.className = 'dex-tree-container';
            treeContainer.id = 'dexTree';
            sidebar.appendChild(treeContainer);

            // Panel resize handle
            const panelResize = document.createElement('div');
            panelResize.className = 'dex-panel-resize';
            sidebar.appendChild(panelResize);

            // Properties container
            const propertiesContainer = document.createElement('div');
            propertiesContainer.className = 'dex-properties-container';
            propertiesContainer.style.height = state.uiState.sidebarHeight;

            const propertiesHeader = document.createElement('div');
            propertiesHeader.className = 'dex-properties-header';

            const propertiesTitle = document.createElement('div');
            propertiesTitle.className = 'dex-properties-title';
            propertiesTitle.innerHTML = '<span>📋</span> <span>Element Properties</span>';

            const exportBtn = document.createElement('button');
            exportBtn.className = 'export-btn';
            exportBtn.innerHTML = '<span>📤</span> <span>Export JSON</span>';
            exportBtn.setAttribute('aria-label', 'Export element data as JSON');
            exportBtn.addEventListener('click', exportElementData);

            propertiesHeader.appendChild(propertiesTitle);
            propertiesHeader.appendChild(exportBtn);
            propertiesContainer.appendChild(propertiesHeader);

            const propertiesContent = document.createElement('div');
            propertiesContent.className = 'dex-properties-content';

            const tabsContainer = document.createElement('div');
            tabsContainer.className = 'dex-prop-tabs';
            tabsContainer.setAttribute('role', 'tablist');

            const tabData = [
                { id: 'basic', icon: '📄', label: 'Basic Info' },
                { id: 'styles', icon: '🎨', label: 'Computed Styles' },
                { id: 'edit', icon: '✏️', label: 'Live Editor' },
                { id: 'events', icon: '⚡', label: 'Event Listeners' },
                { id: 'storage', icon: '💾', label: 'Storage' },
                { id: 'css-editor', icon: '🎨', label: 'CSS Editor' },
                { id: 'console', icon: '💻', label: 'Console' },
                { id: 'performance', icon: '📊', label: 'Performance' },
                { id: 'accessibility', icon: '♿', label: 'Accessibility' },
                { id: 'responsive', icon: '📱', label: 'Responsive' },
                { id: 'color-picker', icon: '🎨', label: 'Color Picker' },
                { id: 'errorlog', icon: '❗', label: 'Error Log' }
            ];

            tabData.forEach(tab => {
                const tabBtn = document.createElement('button');
                tabBtn.className = `dex-prop-tab ${tab.id === 'basic' ? 'active' : ''}`;
                tabBtn.textContent = `${tab.icon} ${tab.label}`;
                tabBtn.dataset.tab = tab.id;
                tabBtn.setAttribute('role', 'tab');
                tabBtn.setAttribute('aria-selected', tab.id === 'basic' ? 'true' : 'false');
                tabBtn.setAttribute('aria-controls', `dex${tab.id.charAt(0).toUpperCase() + tab.id.slice(1)}Props`);
                tabBtn.setAttribute('tabindex', tab.id === 'basic' ? '0' : '-1');
                tabsContainer.appendChild(tabBtn);
            });

            propertiesContent.appendChild(tabsContainer);

            // Create tab content panels
            const tabContentData = [
                { id: 'basic', content: '<div class="dex-empty-state"><div class="dex-empty-icon">👆</div>Select an element to view its properties</div>' },
                { id: 'styles', content: '' },
                { id: 'edit', content: '<div class="dex-empty-state"><div class="dex-empty-icon">✏️</div>Select an element to edit its properties</div>' },
                { id: 'events', content: '<div class="dex-empty-state"><div class="dex-empty-icon">⚡</div>Select an element to view its event listeners</div>' },
                { id: 'storage', content: '<div class="dex-empty-state"><div class="dex-empty-icon">💾</div>View and manage browser storage</div>' },
                { id: 'css-editor', content: buildCSSEditorContent() },
                { id: 'console', content: buildConsoleContent() },
                { id: 'performance', content: '<div class="dex-empty-state"><div class="dex-empty-icon">📊</div>Select an element to view performance metrics</div>' },
                { id: 'accessibility', content: '<div class="dex-empty-state"><div class="dex-empty-icon">♿</div>Select an element to check accessibility</div>' },
                { id: 'responsive', content: buildResponsiveContent() },
                { id: 'color-picker', content: buildColorPickerContent() },
                { id: 'errorlog', content: '<div class="dex-empty-state"><div class="dex-empty-icon">❗</div>No errors logged yet</div>' }
            ];

            tabContentData.forEach(tab => {
                const contentDiv = document.createElement('div');
                contentDiv.className = `dex-prop-content ${tab.id === 'basic' ? 'active' : ''}`;
                contentDiv.id = `dex${tab.id.charAt(0).toUpperCase() + tab.id.slice(1)}Props`;
                contentDiv.innerHTML = tab.content;
                contentDiv.setAttribute('role', 'tabpanel');
                contentDiv.setAttribute('aria-labelledby', `${tab.id}Tab`);
                propertiesContent.appendChild(contentDiv);
            });

            propertiesContainer.appendChild(propertiesContent);
            sidebar.appendChild(propertiesContainer);

            // Resize handle
            const resizeHandle = document.createElement('div');
            resizeHandle.id = 'dexResize';
            sidebar.appendChild(resizeHandle);

            // Create DOM Tools Bar
            const domToolsBar = document.createElement('div');
            domToolsBar.id = 'domToolsBar';
            domToolsBar.setAttribute('role', 'toolbar');
            domToolsBar.setAttribute('aria-label', 'DOM Tools');

            const toolButtons = [
                { id: 'clickElementTool', icon: '🔍', label: 'Click Element', title: 'Click on an element to inspect it' },
                { id: 'mediaDownloaderTool', icon: '📥', label: 'Media Downloader', title: 'Find and download media files' },
                { id: 'highlightImagesTool', icon: '🖼️', label: 'Highlight Images', title: 'Highlight all images on the page' },
                { id: 'toggleShadowDOMTool', icon: '🌑', label: 'Shadow DOM', title: 'Toggle Shadow DOM visibility' },
                { id: 'clearHighlightsTool', icon: '🧹', label: 'Clear Highlights', title: 'Clear all highlights' },
                { id: 'quickSearchTool', icon: '🔍', label: 'Quick Search', title: 'Open quick search' },
                { id: 'screenshotTool', icon: '📸', label: 'Screenshot', title: 'Take a screenshot' },
                { id: 'snippetRunnerTool', icon: '🔧', label: 'Snippet Runner', title: 'Run JavaScript snippets' },
                { id: 'networkLoggerTool', icon: '🌐', label: 'Network Logger', title: 'View network requests' },
                { id: 'toggleToolbarTool', icon: '⬍', label: '', title: 'Collapse/Expand toolbar' }
            ];

            toolButtons.forEach(tool => {
                const btn = document.createElement('button');
                btn.id = tool.id;
                btn.className = 'dom-tool-btn';
                btn.innerHTML = `<span>${tool.icon}</span> <span>${tool.label}</span>`;
                btn.setAttribute('title', tool.title);
                btn.setAttribute('aria-label', tool.title);
                btn.setAttribute('role', 'button');
                domToolsBar.appendChild(btn);
            });

            document.body.appendChild(domToolsBar);

            // Create Media Viewer Modal
            const mediaViewerModal = document.createElement('div');
            mediaViewerModal.id = 'mediaViewerModal';
            mediaViewerModal.setAttribute('role', 'dialog');
            mediaViewerModal.setAttribute('aria-modal', 'true');
            mediaViewerModal.setAttribute('aria-labelledby', 'mediaViewerTitle');
            mediaViewerModal.innerHTML = `
                <div class="media-viewer-container">
                    <div class="draggable-handle" role="button" tabindex="0" aria-label="Drag to move"></div>
                    <div class="resize-handle nw" role="button" tabindex="0" aria-label="Resize northwest"></div>
                    <div class="resize-handle ne" role="button" tabindex="0" aria-label="Resize northeast"></div>
                    <div class="resize-handle sw" role="button" tabindex="0" aria-label="Resize southwest"></div>
                    <div class="resize-handle se" role="button" tabindex="0" aria-label="Resize southeast"></div>
                    <div class="resize-handle n" role="button" tabindex="0" aria-label="Resize north"></div>
                    <div class="resize-handle s" role="button" tabindex="0" aria-label="Resize south"></div>
                    <div class="resize-handle w" role="button" tabindex="0" aria-label="Resize west"></div>
                    <div class="resize-handle e" role="button" tabindex="0" aria-label="Resize east"></div>
                    <div class="media-viewer-header">
                        <div class="media-viewer-title" id="mediaViewerTitle">Media Downloader</div>
                        <button class="media-viewer-close" aria-label="Close media viewer">×</button>
                    </div>
                    <div class="media-viewer-content" id="mediaViewerContent">
                        <div class="dex-empty-state">
                            <div class="dex-empty-icon">📥</div>
                            <p>Scanning for media files...</p>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(mediaViewerModal);

            // Create Audio Player
            const audioPlayer = document.createElement('div');
            audioPlayer.className = 'audio-player';
            audioPlayer.id = 'audioPlayer';
            audioPlayer.innerHTML = `
                <div class="audio-player-header">
                    <div class="audio-player-title">Audio Player</div>
                    <button class="audio-player-close" aria-label="Close audio player">×</button>
                </div>
                <audio id="audioPlayerElement"></audio>
                <div class="audio-player-controls">
                    <button class="audio-player-play" id="audioPlayerPlay" aria-label="Play/pause audio">▶</button>
                    <div class="audio-player-seek" id="audioPlayerSeek" role="slider" aria-label="Audio progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
                        <div class="audio-player-progress" id="audioPlayerProgress"></div>
                    </div>
                    <div class="audio-player-time" id="audioPlayerTime" aria-live="polite">0:00 / 0:00</div>
                    <div class="audio-player-volume">
                        <span>🔊</span>
                        <div class="audio-player-volume-slider" id="audioPlayerVolume" role="slider" aria-label="Audio volume" aria-valuemin="0" aria-valuemax="100" aria-valuenow="70">
                            <div class="audio-player-volume-level" id="audioPlayerVolumeLevel"></div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(audioPlayer);

            // Create Ruler Tool
            const rulerTool = document.createElement('div');
            rulerTool.className = 'ruler-tool';
            rulerTool.id = 'rulerTool';
            const rulerLabel = document.createElement('div');
            rulerLabel.className = 'ruler-label';
            rulerTool.appendChild(rulerLabel);
            document.body.appendChild(rulerTool);

            // Create Context Menu
            const contextMenu = document.createElement('div');
            contextMenu.className = 'dex-context-menu';
            contextMenu.setAttribute('role', 'menu');
            document.body.appendChild(contextMenu);

            // Create Grid/Flex Inspector Overlay
            const gridFlexOverlay = document.createElement('div');
            gridFlexOverlay.className = 'grid-flex-overlay';
            gridFlexOverlay.id = 'gridFlexOverlay';
            gridFlexOverlay.style.display = 'none';
            document.body.appendChild(gridFlexOverlay);

            // Return created elements for later reference
            return {
                sidebar,
                toggle,
                searchInput,
                treeContainer,
                panelResize,
                propertiesContainer,
                resizeHandle,
                domToolsBar,
                mediaViewerModal,
                audioPlayer,
                rulerTool,
                contextMenu,
                gridFlexOverlay
            };
        } catch (e) {
            logError('Error creating UI elements', e);
            return null;
        }
    }

    /**
     * Build CSS Editor content
     * @returns {string} HTML content for CSS Editor tab
     */
    function buildCSSEditorContent() {
        return `
            <div class="css-injection">
                <div class="dex-prop-label">Global CSS Editor</div>
                <textarea class="css-editor" id="globalCSSEditor" placeholder="/* Enter CSS rules to apply to the page */
body {
    background-color: #f0f0f0;
}" aria-label="CSS editor">${state.cssEditorContent}</textarea>
                <div class="css-actions">
                    <button class="css-btn" id="applyCssBtn">Apply CSS</button>
                    <button class="css-btn secondary" id="resetCssBtn">Reset</button>
                    <button class="css-btn secondary" id="saveCssBtn">Save</button>
                </div>
                <div id="cssStatus" style="margin-top: 8px; font-size: 11px; color: var(--text-secondary);"></div>
            </div>
        `;
    }

    /**
     * Build Console content
     * @returns {string} HTML content for Console tab
     * @returns {string} HTML content for Console tab
     */
    function buildConsoleContent() {
        return `
            <div class="console-panel">
                <div class="dex-prop-label">JavaScript Console</div>
                <div class="console-output" id="consoleOutput">// Console output will appear here...</div>
                <div class="console-input-container">
                    <input type="text" class="console-input" id="consoleInput" placeholder="Enter JavaScript code..." aria-label="JavaScript console input">
                    <button class="console-run" id="consoleRunBtn">Run</button>
                </div>
                <div class="dex-controls" style="margin-top: 8px;">
                    <button class="dex-btn" id="consoleClearBtn">Clear Console</button>
                </div>
            </div>
        `;
    }

    /**
     * Build Responsive Design Tester content
     * @returns {string} HTML content for Responsive tab
     */
    function buildResponsiveContent() {
        let sizesHtml = '';
        state.responsiveSizes.forEach((size, index) => {
            sizesHtml += `
                <div class="responsive-size ${index === 0 ? 'active' : ''}" data-index="${index}">
                    <div class="responsive-size-name">${size.name}</div>
                    <div class="responsive-size-dimensions">${size.width} × ${size.height}</div>
                </div>
            `;
        });

        return `
            <div class="responsive-tester">
                <div class="dex-prop-label">Responsive Design Tester</div>
                <div class="responsive-sizes">
                    ${sizesHtml}
                </div>
                <div class="responsive-preview">
                    <iframe id="responsiveIframe" class="responsive-iframe" src="${window.location.href}" style="width: 100%; height: 400px; border: none;"></iframe>
                </div>
                <div class="dex-controls" style="margin-top: 8px;">
                    <button class="dex-btn" id="refreshResponsiveBtn">Refresh</button>
                    <button class="dex-btn" id="openInNewTabBtn">Open in New Tab</button>
                </div>
            </div>
        `;
    }

    /**
     * Build Color Picker content
     * @returns {string} HTML content for Color Picker tab
     */
    function buildColorPickerContent() {
        return `
            <div class="color-picker-tool">
                <div class="dex-prop-label">Color Picker</div>
                <div class="color-picker-display">
                    <div class="color-picker-preview" id="colorPickerPreview" style="background-color: #4f46e5;"></div>
                    <div class="color-picker-info">
                        <div class="color-picker-value" id="colorPickerValue">#4f46e5</div>
                        <div class="color-picker-actions">
                            <button class="color-picker-btn" id="copyColorBtn">Copy</button>
                            <button class="color-picker-btn" id="applyColorBtn">Apply to Element</button>
                        </div>
                    </div>
                </div>
                <div class="dex-prop-label">Color History</div>
                <div class="color-picker-history" id="colorHistory">
                    <div class="color-history-item" style="background-color: #4f46e5;"></div>
                    <div class="color-history-item" style="background-color: #10b981;"></div>
                    <div class="color-history-item" style="background-color: #f59e0b;"></div>
                    <div class="color-history-item" style="background-color: #ef4444;"></div>
                    <div class="color-history-item" style="background-color: #8b5cf6;"></div>
                </div>
                <div class="dex-controls" style="margin-top: 8px;">
                    <button class="dex-btn" id="clearColorHistoryBtn">Clear History</button>
                </div>
            </div>
        `;
    }

    // ======== EVENT HANDLERS ========
    /**
     * Setup event listeners
     * @param {Object} elements - Created UI elements
     */
    function setupEventListeners(elements) {
        try {
            if (!elements) return;

            const {
                sidebar,
                toggle,
                searchInput,
                treeContainer,
                panelResize,
                propertiesContainer,
                resizeHandle,
                domToolsBar,
                mediaViewerModal,
                audioPlayer,
                rulerTool,
                contextMenu,
                gridFlexOverlay
            } = elements;

            // Toggle sidebar
            toggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });

            // Main sidebar width resize
            resizeHandle.addEventListener('mousedown', startWidthResize);

            // Panel height resizing
            panelResize.addEventListener('mousedown', startHeightResize);

            // Global mouse events for resizing
            document.addEventListener('mousemove', handleResize);
            document.addEventListener('mouseup', stopResize);

            // Global mouse events for dragging
            document.addEventListener('mousemove', handleDrag);
            document.addEventListener('mouseup', stopDrag);

            // Tab switching
            document.querySelectorAll('.dex-prop-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    const tabId = tab.dataset.tab;
                    switchTab(tabId);
                });

                // Keyboard navigation for tabs
                tab.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        const tabId = tab.dataset.tab;
                        switchTab(tabId);
                    }
                });
            });

            // Search functionality for DOM
            searchInput.addEventListener('input', debounce(handleSearch, DEBOUNCE_DELAY));

            // Handle filter clicks
            document.querySelectorAll('.search-filter').forEach(filter => {
                filter.addEventListener('click', () => {
                    document.querySelectorAll('.search-filter').forEach(f => f.classList.remove('active'));
                    filter.classList.add('active');
                    state.currentSearchFilter = filter.dataset.filter;
                    handleSearch();
                });

                // Keyboard navigation for filters
                filter.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        document.querySelectorAll('.search-filter').forEach(f => f.classList.remove('active'));
                        filter.classList.add('active');
                        state.currentSearchFilter = filter.dataset.filter;
                        handleSearch();
                    }
                });
            });

            // Download all button
            document.querySelector('.download-all-btn').addEventListener('click', downloadAllMedia);

            // Media Downloader Tool
            document.getElementById('mediaDownloaderTool').addEventListener('click', () => {
                mediaViewerModal.style.display = 'flex';
                setTimeout(() => {
                    mediaViewerModal.classList.add('show');
                    loadMediaFiles();
                }, 10);
            });

            // Highlight Images Tool
            document.getElementById('highlightImagesTool').addEventListener('click', function() {
                this.classList.toggle('active');
                if (this.classList.contains('active')) {
                    document.querySelectorAll('img').forEach(img => {
                        img.style.outline = '2px solid var(--warning)';
                        img.style.outlineOffset = '2px';
                    });
                    showToast('All images highlighted', 'success');
                } else {
                    document.querySelectorAll('img').forEach(img => {
                        img.style.outline = '';
                        img.style.outlineOffset = '';
                    });
                    showToast('Image highlights removed', 'info');
                }
            });

            // Toggle Shadow DOM Tool
            document.getElementById('toggleShadowDOMTool').addEventListener('click', function() {
                state.shadowDOMVisible = !state.shadowDOMVisible;
                this.classList.toggle('active');
                showToast(`Shadow DOM ${state.shadowDOMVisible ? 'shown' : 'hidden'}`, 'info');
                refreshDOM();
            });

            // Clear Highlights Tool
            document.getElementById('clearHighlightsTool').addEventListener('click', function() {
                // Remove all highlights
                document.querySelectorAll('.dex-highlight, .dex-pinned-highlight').forEach(el => {
                    el.classList.remove('dex-highlight', 'dex-pinned-highlight');
                });

                // Clear image highlights
                document.querySelectorAll('img').forEach(img => {
                    img.style.outline = '';
                    img.style.outlineOffset = '';
                });

                // Clear pinned elements
                state.pinnedElements = [];

                // Hide ruler
                rulerTool.style.display = 'none';

                // Hide grid/flex overlay
                gridFlexOverlay.style.display = 'none';

                showToast('All highlights cleared', 'success');
            });

            // Quick Search Tool
            document.getElementById('quickSearchTool').addEventListener('click', function() {
                // Open sidebar if not already open
                if (!sidebar.classList.contains('open')) {
                    sidebar.classList.add('open');
                }

                // Focus on search input
                setTimeout(() => {
                    searchInput.focus();
                }, 300);
            });

            // Toggle Toolbar Tool
            document.getElementById('toggleToolbarTool').addEventListener('click', function() {
                state.isToolbarCollapsed = !state.isToolbarCollapsed;
                domToolsBar.classList.toggle('collapsed');
                if (state.isToolbarCollapsed) {
                    showToast('Toolbar collapsed', 'info');
                } else {
                    showToast('Toolbar expanded', 'info');
                }
            });

            // Screenshot Tool
            document.getElementById('screenshotTool').addEventListener('click', function() {
                this.classList.toggle('active');
                if (this.classList.contains('active')) {
                    showToast('Screenshot mode activated. Click on an element to capture it.', 'info');
                    state.clickElementMode = true;
                    document.body.style.cursor = 'crosshair';
                } else {
                    state.clickElementMode = false;
                    document.body.style.cursor = '';
                }
            });

            // Snippet Runner Tool
            document.getElementById('snippetRunnerTool').addEventListener('click', function() {
                this.classList.toggle('active');
                if (this.classList.contains('active')) {
                    showSnippetRunner();
                }
            });

            // Network Logger Tool
            document.getElementById('networkLoggerTool').addEventListener('click', function() {
                this.classList.toggle('active');
                if (this.classList.contains('active')) {
                    showNetworkLogger();
                }
            });

            // Click Element Tool
            document.getElementById('clickElementTool').addEventListener('click', function() {
                state.clickElementMode = !state.clickElementMode;
                this.classList.toggle('active');
                if (state.clickElementMode) {
                    showToast('Click on an element to inspect it', 'info');
                    document.body.style.cursor = 'crosshair';
                } else {
                    document.body.style.cursor = '';
                }
            });

            // Handle element clicks when in click element mode
            document.addEventListener('click', handleElementClick);

            // Close modals
            mediaViewerModal.querySelector('.media-viewer-close').addEventListener('click', () => {
                mediaViewerModal.classList.remove('show');
                setTimeout(() => {
                    mediaViewerModal.style.display = 'none';
                }, 300);
            });

            // Audio player controls
            const audioPlayerElement = document.getElementById('audioPlayerElement');
            const audioPlayerPlay = document.getElementById('audioPlayerPlay');
            const audioPlayerProgress = document.getElementById('audioPlayerProgress');
            const audioPlayerSeek = document.getElementById('audioPlayerSeek');
            const audioPlayerTime = document.getElementById('audioPlayerTime');
            const audioPlayerVolume = document.getElementById('audioPlayerVolume');
            const audioPlayerVolumeLevel = document.getElementById('audioPlayerVolumeLevel');

            audioPlayerPlay.addEventListener('click', () => {
                if (audioPlayerElement.paused) {
                    audioPlayerElement.play();
                    audioPlayerPlay.textContent = '⏸';
                } else {
                    audioPlayerElement.pause();
                    audioPlayerPlay.textContent = '▶';
                }
            });

            audioPlayerSeek.addEventListener('click', (e) => {
                const rect = audioPlayerSeek.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                audioPlayerElement.currentTime = pos * audioPlayerElement.duration;
            });

            audioPlayerVolume.addEventListener('click', (e) => {
                const rect = audioPlayerVolume.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                audioPlayerElement.volume = pos;
                audioPlayerVolumeLevel.style.width = `${pos * 100}%`;
            });

            audioPlayerElement.addEventListener('volumechange', () => {
                audioPlayerVolumeLevel.style.width = `${audioPlayerElement.volume * 100}%`;
            });

            document.querySelector('.audio-player-close').addEventListener('click', () => {
                audioPlayer.classList.remove('show');
                audioPlayerElement.pause();
            });

            audioPlayerElement.addEventListener('timeupdate', () => {
                updateProgress();
                updateTimeDisplay();
            });

            // Make modals draggable
            makeDraggable(mediaViewerModal);

            // Make modals resizable
            makeResizable(mediaViewerModal);

            // Hide context menu when clicking elsewhere
            document.addEventListener('click', (e) => {
                if (!contextMenu.contains(e.target)) {
                    contextMenu.style.display = 'none';
                }
            });

            // Keyboard shortcuts
            document.addEventListener('keydown', handleKeyboardShortcuts);

            // Setup toolbar visibility on mouse movement
            setupToolbarVisibility();

            // Setup network request interception
            setupNetworkInterception();

            // Setup CSS Editor
            setupCSSEditor();

            // Setup Console
            setupConsole();

            // Setup Responsive Design Tester
            setupResponsiveTester();

            // Setup Color Picker
            setupColorPicker();
        } catch (e) {
            logError('Error setting up event listeners', e);
        }
    }

    /**
     * Setup CSS Editor
     */
    function setupCSSEditor() {
        try {
            const cssEditor = document.getElementById('globalCSSEditor');
            const applyCssBtn = document.getElementById('applyCssBtn');
            const resetCssBtn = document.getElementById('resetCssBtn');
            const saveCssBtn = document.getElementById('saveCssBtn');
            const cssStatus = document.getElementById('cssStatus');

            // Load saved CSS content
            cssEditor.value = state.cssEditorContent;

            // Apply CSS button
            applyCssBtn.addEventListener('click', () => {
                const css = cssEditor.value;
                if (!css.trim()) {
                    showToast('Please enter some CSS to apply', 'warning');
                    return;
                }

                // Create or update style element
                let styleElement = document.getElementById('domExplorerCustomCSS');
                if (!styleElement) {
                    styleElement = document.createElement('style');
                    styleElement.id = 'domExplorerCustomCSS';
                    document.head.appendChild(styleElement);
                }

                styleElement.textContent = css;
                state.cssEditorContent = css;
                saveUIState();

                cssStatus.textContent = 'CSS applied successfully';
                cssStatus.style.color = 'var(--success)';

                setTimeout(() => {
                    cssStatus.textContent = '';
                }, 3000);
            });

            // Reset CSS button
            resetCssBtn.addEventListener('click', () => {
                const styleElement = document.getElementById('domExplorerCustomCSS');
                if (styleElement) {
                    styleElement.remove();
                    cssStatus.textContent = 'CSS reset successfully';
                    cssStatus.style.color = 'var(--warning)';

                    setTimeout(() => {
                        cssStatus.textContent = '';
                    }, 3000);
                } else {
                    showToast('No custom CSS to reset', 'info');
                }
            });

            // Save CSS button
            saveCssBtn.addEventListener('click', () => {
                const css = cssEditor.value;
                if (!css.trim()) {
                    showToast('Please enter some CSS to save', 'warning');
                    return;
                }

                state.cssEditorContent = css;
                saveUIState();

                cssStatus.textContent = 'CSS saved successfully';
                cssStatus.style.color = 'var(--success)';

                setTimeout(() => {
                    cssStatus.textContent = '';
                }, 3000);
            });

            // Auto-save on change
            cssEditor.addEventListener('input', debounce(() => {
                state.cssEditorContent = cssEditor.value;
                saveUIState();
            }, 1000));
        } catch (e) {
            logError('Error setting up CSS Editor', e);
        }
    }

  /**
 * Setup Console
 */
function setupConsole() {
    try {
        const consoleInput = document.getElementById('consoleInput');
        const consoleRunBtn = document.getElementById('consoleRunBtn');
        const consoleOutput = document.getElementById('consoleOutput');
        const consoleClearBtn = document.getElementById('consoleClearBtn');

        // Add message to console output
        function addToConsole(type, message) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `console-message ${type}`;
            messageDiv.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
            consoleOutput.appendChild(messageDiv);
            consoleOutput.scrollTop = consoleOutput.scrollHeight;

            // Add to history
            state.consoleHistory.push({ type, message, timestamp: new Date() });

            // Keep history at a manageable size
            if (state.consoleHistory.length > 100) {
                state.consoleHistory.shift();
            }
        }

        // Override console methods using a different approach
        // Create a proxy that intercepts console calls without overriding read-only properties
        const originalConsole = {
            log: console.log.bind(console),
            error: console.error.bind(console),
            warn: console.warn.bind(console),
            info: console.info.bind(console)
        };

        // Create interceptor functions
        function createConsoleInterceptor(method, originalMethod) {
            return function(...args) {
                // Call the original method first
                originalMethod.apply(console, args);

                // Then add to our console output
                addToConsole(method, args.map(arg => {
                    if (typeof arg === 'object') {
                        try {
                            return JSON.stringify(arg, null, 2);
                        } catch (e) {
                            return String(arg);
                        }
                    }
                    return String(arg);
                }).join(' '));
            };
        }

        // Try to intercept console calls (this might fail in some environments)
        try {
            console.log = createConsoleInterceptor('info', originalConsole.log);
            console.error = createConsoleInterceptor('error', originalConsole.error);
            console.warn = createConsoleInterceptor('warning', originalConsole.warn);
            console.info = createConsoleInterceptor('info', originalConsole.info);
        } catch (e) {
            console.warn('Could not intercept console methods:', e.message);
        }

        // Run button
        consoleRunBtn.addEventListener('click', runConsoleCode);

        // Enter key to run
        consoleInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                runConsoleCode();
            }
        });

        // Clear button
        consoleClearBtn.addEventListener('click', () => {
            consoleOutput.innerHTML = '// Console cleared';
        });

        // Run console code
        function runConsoleCode() {
            const code = consoleInput.value.trim();
            if (!code) return;

            addToConsole('info', `> ${code}`);

            try {
                // Create a new function to run the code
                const result = new Function(code)();
                if (result !== undefined) {
                    addToConsole('success', String(result));
                }
            } catch (error) {
                addToConsole('error', error.message);
            }

            // Clear input
            consoleInput.value = '';
        }

        // Initial message
        addToConsole('info', 'Console initialized. Enter JavaScript code to execute.');

        // Add a message about console interception status
        if (console.log !== originalConsole.log) {
            addToConsole('success', 'Console interception enabled - all console output will appear here.');
        } else {
            addToConsole('warning', 'Console interception disabled - only manual code execution results will appear here.');
        }

        // Store reference to restore original console on cleanup
        window.addEventListener('beforeunload', () => {
            try {
                console.log = originalConsole.log;
                console.error = originalConsole.error;
                console.warn = originalConsole.warn;
                console.info = originalConsole.info;
            } catch (e) {
                // Ignore errors during cleanup
            }
        });
    } catch (e) {
        logError('Error setting up Console', e);

        // Fallback if console setup fails
        try {
            const consoleOutput = document.getElementById('consoleOutput');
            if (consoleOutput) {
                consoleOutput.innerHTML = `
                    <div class="console-message error">Console setup failed.</div>
                    <div class="console-message info">You can still execute JavaScript code using the input below.</div>
                `;
            }
        } catch (innerError) {
            console.error('Failed to set up console fallback:', innerError);
        }
    }
}

    /**
     * Setup Color Picker
     */
    function setupColorPicker() {
        try {
            const colorPickerPreview = document.getElementById('colorPickerPreview');
            const colorPickerValue = document.getElementById('colorPickerValue');
            const copyColorBtn = document.getElementById('copyColorBtn');
            const applyColorBtn = document.getElementById('applyColorBtn');
            const colorHistory = document.getElementById('colorHistory');
            const clearColorHistoryBtn = document.getElementById('clearColorHistoryBtn');

            // Current color
            let currentColor = '#4f46e5';

            // Update color display
            function updateColorDisplay(color) {
                colorPickerPreview.style.backgroundColor = color;
                colorPickerValue.textContent = color.toUpperCase();
                currentColor = color;
            }

            // Handle color preview click (eye dropper)
            colorPickerPreview.addEventListener('click', () => {
                showToast('Click on any element to pick its color', 'info');
                document.body.style.cursor = 'crosshair';

                // Temporary click handler
                const tempClickHandler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    // Get computed style of the clicked element
                    const computedStyle = window.getComputedStyle(e.target);
                    const bgColor = computedStyle.backgroundColor;

                    // Convert RGB to hex if needed
                    let hexColor = currentColor;
                    if (bgColor.startsWith('rgb')) {
                        const rgbValues = bgColor.match(/\d+/g);
                        if (rgbValues && rgbValues.length >= 3) {
                            const r = parseInt(rgbValues[0]);
                            const g = parseInt(rgbValues[1]);
                            const b = parseInt(rgbValues[2]);
                            hexColor = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
                        }
                    }

                    // Update color display
                    updateColorDisplay(hexColor);

                    // Add to history
                    addToColorHistory(hexColor);

                    // Reset cursor
                    document.body.style.cursor = '';

                    // Remove temporary handler
                    document.removeEventListener('click', tempClickHandler);

                    showToast(`Color picked: ${hexColor.toUpperCase()}`, 'success');
                };

                // Add temporary click handler
                document.addEventListener('click', tempClickHandler);
            });

            // Copy color button
            copyColorBtn.addEventListener('click', () => {
                GM_setClipboard(currentColor);
                showToast('Color copied to clipboard', 'success');
            });

            // Apply color to element button
            applyColorBtn.addEventListener('click', () => {
                if (!state.selectedElement) {
                    showToast('No element selected', 'warning');
                    return;
                }

                // Apply color to selected element's background
                state.selectedElement.style.backgroundColor = currentColor;
                showToast('Color applied to selected element', 'success');
            });

            // Add color to history
            function addToColorHistory(color) {
                // Check if color already exists in history
                const existingColors = Array.from(colorHistory.children).map(item =>
                    window.getComputedStyle(item).backgroundColor
                );

                // Convert current color to RGB for comparison
                const tempDiv = document.createElement('div');
                tempDiv.style.color = color;
                document.body.appendChild(tempDiv);
                const rgbColor = window.getComputedStyle(tempDiv).color;
                document.body.removeChild(tempDiv);

                if (!existingColors.includes(rgbColor)) {
                    // Create new history item
                    const historyItem = document.createElement('div');
                    historyItem.className = 'color-history-item';
                    historyItem.style.backgroundColor = color;
                    historyItem.title = color.toUpperCase();

                    // Add click handler to select color
                    historyItem.addEventListener('click', () => {
                        updateColorDisplay(color);
                    });

                    // Add to beginning of history
                    colorHistory.insertBefore(historyItem, colorHistory.firstChild);

                    // Limit history size
                    if (colorHistory.children.length > 10) {
                        colorHistory.removeChild(colorHistory.lastChild);
                    }
                }
            }

            // Clear history button
            clearColorHistoryBtn.addEventListener('click', () => {
                colorHistory.innerHTML = '';
                showToast('Color history cleared', 'info');
            });

            // Initialize color history with default colors
            const defaultColors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
            defaultColors.forEach(color => {
                addToColorHistory(color);
            });
        } catch (e) {
            logError('Error setting up Color Picker', e);
        }
    }

    /**
     * Start width resize
     * @param {Event} e - Mouse event
     */
    function startWidthResize(e) {
        try {
            state.isResizingWidth = true;
            state.startX = e.clientX;
            state.startWidth = document.getElementById('dexSidebar').offsetWidth;
            e.preventDefault();
        } catch (error) {
            logError('Error starting width resize', error);
        }
    }

    /**
     * Start height resize
     * @param {Event} e - Mouse event
     */
    function startHeightResize(e) {
        try {
            state.isResizingHeight = true;
            state.startY = e.clientY;
            state.startHeight = document.querySelector('.dex-properties-container').offsetHeight;
            e.preventDefault();
        } catch (error) {
            logError('Error starting height resize', error);
        }
    }

    /**
     * Handle resize
     * @param {Event} e - Mouse event
     */
    function handleResize(e) {
        try {
            if (state.isResizingWidth) {
                const sidebar = document.getElementById('dexSidebar');
                const newWidth = state.startWidth + (e.clientX - state.startX);
                if (newWidth > 200 && newWidth < 800) {
                    sidebar.style.width = `${newWidth}px`;
                    state.uiState.sidebarWidth = newWidth;
                    saveUIState();
                }
            } else if (state.isResizingHeight) {
                const propertiesContainer = document.querySelector('.dex-properties-container');
                const deltaY = state.startY - e.clientY;
                const newHeight = state.startHeight + deltaY;
                const sidebar = document.getElementById('dexSidebar');
                const sidebarHeight = sidebar.offsetHeight;
                const headerHeight = document.querySelector('.dex-header').offsetHeight;
                const panelResizeHeight = document.querySelector('.dex-panel-resize').offsetHeight;

                // Calculate min and max heights for properties panel
                const minHeight = 100;
                const maxHeight = sidebarHeight - headerHeight - panelResizeHeight - 100;

                if (newHeight >= minHeight && newHeight <= maxHeight) {
                    propertiesContainer.style.height = `${newHeight}px`;
                    state.uiState.sidebarHeight = `${newHeight}px`;
                    saveUIState();
                }
            }
        } catch (error) {
            logError('Error handling resize', error);
        }
    }

    /**
     * Stop resize
     */
    function stopResize() {
        state.isResizingWidth = false;
        state.isResizingHeight = false;
    }

    /**
     * Make modal draggable
     * @param {Element} modal - Modal element
     */
    function makeDraggable(modal) {
        try {
            const container = modal.querySelector('.media-viewer-container');
            const handle = modal.querySelector('.draggable-handle');

            if (!handle || !container) return;

            handle.addEventListener('mousedown', (e) => {
                state.isDragging = true;
                state.dragElement = container;
                state.dragStartX = e.clientX;
                state.dragStartY = e.clientY;

                const rect = container.getBoundingClientRect();
                state.dragStartLeft = rect.left;
                state.dragStartTop = rect.top;

                container.style.position = 'fixed';
                container.style.left = `${state.dragStartLeft}px`;
                container.style.top = `${state.dragStartTop}px`;
                container.style.transform = 'none';
                container.style.margin = '0';

                e.preventDefault();
            });

            // Handle touch events for mobile
            handle.addEventListener('touchstart', (e) => {
                state.isDragging = true;
                state.dragElement = container;
                state.dragStartX = e.touches[0].clientX;
                state.dragStartY = e.touches[0].clientY;

                const rect = container.getBoundingClientRect();
                state.dragStartLeft = rect.left;
                state.dragStartTop = rect.top;

                container.style.position = 'fixed';
                container.style.left = `${state.dragStartLeft}px`;
                container.style.top = `${state.dragStartTop}px`;
                container.style.transform = 'none';
                container.style.margin = '0';

                e.preventDefault();
            });
        } catch (e) {
            logError('Error making modal draggable', e);
        }
    }

    /**
     * Make modal resizable
     * @param {Element} modal - Modal element
     */
    function makeResizable(modal) {
        try {
            const container = modal.querySelector('.media-viewer-container');
            const handles = modal.querySelectorAll('.resize-handle');

            if (!container || handles.length === 0) return;

            handles.forEach(handle => {
                handle.addEventListener('mousedown', (e) => {
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const startWidth = container.offsetWidth;
                    const startHeight = container.offsetHeight;
                    const startLeft = container.offsetLeft;
                    const startTop = container.offsetTop;

                    function doResize(e) {
                        const dx = e.clientX - startX;
                        const dy = e.clientY - startY;

                        if (handle.classList.contains('e') || handle.classList.contains('ne') || handle.classList.contains('se')) {
                            container.style.width = `${startWidth + dx}px`;
                        }

                        if (handle.classList.contains('s') || handle.classList.contains('sw') || handle.classList.contains('se')) {
                            container.style.height = `${startHeight + dy}px`;
                        }

                        if (handle.classList.contains('w') || handle.classList.contains('nw') || handle.classList.contains('sw')) {
                            container.style.width = `${startWidth - dx}px`;
                            container.style.left = `${startLeft + dx}px`;
                        }

                        if (handle.classList.contains('n') || handle.classList.contains('nw') || handle.classList.contains('ne')) {
                            container.style.height = `${startHeight - dy}px`;
                            container.style.top = `${startTop + dy}px`;
                        }
                    }

                    function stopResize() {
                        document.removeEventListener('mousemove', doResize);
                        document.removeEventListener('mouseup', stopResize);
                    }

                    document.addEventListener('mousemove', doResize);
                    document.addEventListener('mouseup', stopResize);

                    e.preventDefault();
                });

                // Handle touch events for mobile
                handle.addEventListener('touchstart', (e) => {
                    const touch = e.touches[0];
                    const startX = touch.clientX;
                    const startY = touch.clientY;
                    const startWidth = container.offsetWidth;
                    const startHeight = container.offsetHeight;
                    const startLeft = container.offsetLeft;
                    const startTop = container.offsetTop;

                    function doResize(e) {
                        const touch = e.touches[0];
                        const dx = touch.clientX - startX;
                        const dy = touch.clientY - startY;

                        if (handle.classList.contains('e') || handle.classList.contains('ne') || handle.classList.contains('se')) {
                            container.style.width = `${startWidth + dx}px`;
                        }

                        if (handle.classList.contains('s') || handle.classList.contains('sw') || handle.classList.contains('se')) {
                            container.style.height = `${startHeight + dy}px`;
                        }

                        if (handle.classList.contains('w') || handle.classList.contains('nw') || handle.classList.contains('sw')) {
                            container.style.width = `${startWidth - dx}px`;
                            container.style.left = `${startLeft + dx}px`;
                        }

                        if (handle.classList.contains('n') || handle.classList.contains('nw') || handle.classList.contains('ne')) {
                            container.style.height = `${startHeight - dy}px`;
                            container.style.top = `${startTop + dy}px`;
                        }
                    }

                    function stopResize() {
                        document.removeEventListener('touchmove', doResize);
                        document.removeEventListener('touchend', stopResize);
                    }

                    document.addEventListener('touchmove', doResize);
                    document.addEventListener('touchend', stopResize);

                    e.preventDefault();
                });
            });
        } catch (e) {
            logError('Error making modal resizable', e);
        }
    }

    /**
     * Handle drag
     * @param {Event} e - Mouse event
     */
    function handleDrag(e) {
        try {
            if (state.isDragging && state.dragElement) {
                const dx = e.clientX - state.dragStartX;
                const dy = e.clientY - state.dragStartY;

                state.dragElement.style.left = `${state.dragStartLeft + dx}px`;
                state.dragElement.style.top = `${state.dragStartTop + dy}px`;
            }
        } catch (error) {
            logError('Error handling drag', error);
        }
    }

    /**
     * Stop drag
     */
    function stopDrag() {
        state.isDragging = false;
        state.dragElement = null;
    }

    /**
     * Switch tab
     * @param {string} tabId - Tab ID
     */
    function switchTab(tabId) {
        try {
            // Update tab buttons
            document.querySelectorAll('.dex-prop-tab').forEach(tab => {
                tab.classList.remove('active');
                tab.setAttribute('aria-selected', 'false');
                tab.setAttribute('tabindex', '-1');

                if (tab.dataset.tab === tabId) {
                    tab.classList.add('active');
                    tab.setAttribute('aria-selected', 'true');
                    tab.setAttribute('tabindex', '0');
                }
            });

            // Update tab content
            document.querySelectorAll('.dex-prop-content').forEach(content => {
                content.classList.remove('active');
            });

            const contentId = `dex${tabId.charAt(0).toUpperCase() + tabId.slice(1)}Props`;
            const contentElement = document.getElementById(contentId);

            if (contentElement) {
                contentElement.classList.add('active');

                // Special handling for specific tabs
                if (tabId === 'performance' && state.selectedElement) {
                    buildPerformancePanel(state.selectedElement);
                } else if (tabId === 'accessibility' && state.selectedElement) {
                    buildAccessibilityPanel(state.selectedElement);
                } else if (tabId === 'errorlog') {
                    buildErrorLogPanel();
                }
            }

            state.activeTab = tabId;
        } catch (e) {
            logError('Error switching tab', e);
        }
    }

    /**
     * Handle search
     */
    function handleSearch() {
        try {
            const searchInput = document.getElementById('dexSearch');
            const searchTerm = searchInput.value.toLowerCase();
            state.searchMatches = [];

            // Clear previous highlights
            document.querySelectorAll('.dex-search-highlight').forEach(el => {
                el.classList.remove('dex-search-highlight');
            });

            // Update results counter
            const resultsCount = document.querySelector('.results-count');
            const downloadAllBtn = document.querySelector('.download-all-btn');

            if (!searchTerm && state.currentSearchFilter === 'all') {
                resultsCount.textContent = '0 results';
                downloadAllBtn.style.display = 'none';
                return;
            }

            // Search through nodes
            document.querySelectorAll('.dex-node').forEach(node => {
                const text = node.textContent.toLowerCase();
                const elementPath = node.dataset.elementPath;
                let shouldHighlight = false;

                if (state.currentSearchFilter === 'all') {
                    shouldHighlight = text.includes(searchTerm);
                } else {
                    // Check if node matches the filter type
                    if (elementPath) {
                        const element = document.querySelector(elementPath);
                        if (element) {
                            const tagName = element.tagName.toLowerCase();

                            if (state.currentSearchFilter === 'image' && tagName === 'img') {
                                shouldHighlight = true;
                                state.searchMatches.push({type: 'image', element, node});
                            } else if (state.currentSearchFilter === 'audio' && tagName === 'audio') {
                                shouldHighlight = true;
                                state.searchMatches.push({type: 'audio', element, node});
                            } else if (state.currentSearchFilter === 'video' && tagName === 'video') {
                                shouldHighlight = true;
                                state.searchMatches.push({type: 'video', element, node});
                            } else if (searchTerm) {
                                shouldHighlight = text.includes(searchTerm);
                            }
                        }
                    }
                }

                if (shouldHighlight) {
                    node.classList.add('dex-search-highlight');

                    // Expand parent nodes to show the match
                    let parent = node.parentElement;
                    while (parent && parent !== document.getElementById('dexTree')) {
                        if (parent.classList.contains('dex-children')) {
                            parent.classList.add('expanded');
                            const toggleBtn = parent.previousElementSibling.querySelector('.dex-toggle');
                            if (toggleBtn) toggleBtn.classList.add('expanded');
                        }
                        parent = parent.parentElement;
                    }
                }
            });

            // Update results counter
            resultsCount.textContent = `${state.searchMatches.length} ${state.currentSearchFilter}${state.searchMatches.length !== 1 ? 's' : ''} found`;

            // Show/hide download all button
            if (state.currentSearchFilter === 'image' || state.currentSearchFilter === 'audio' || state.currentSearchFilter === 'video') {
                downloadAllBtn.style.display = state.searchMatches.length > 0 ? 'block' : 'none';
            } else {
                downloadAllBtn.style.display = 'none';
            }

            // Scroll to first match
            if (state.searchMatches.length > 0) {
                const firstMatch = state.searchMatches[0].node;
                firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } catch (e) {
            logError('Error handling search', e);
        }
    }

    /**
     * Download all media
     */
    function downloadAllMedia() {
        try {
            if (state.searchMatches.length === 0) return;

            const type = state.currentSearchFilter;
            let count = 0;

            state.searchMatches.forEach(match => {
                try {
                    if (type === 'image') {
                        downloadImage(match.element);
                        count++;
                    } else if (type === 'audio') {
                        downloadAudio(match.element);
                        count++;
                    } else if (type === 'video') {
                        downloadVideo(match.element);
                        count++;
                    }
                } catch (e) {
                    console.error(`Error downloading ${type}:`, e);
                }
            });

            showToast(`Downloading ${count} ${type}${count !== 1 ? 's' : ''}...`, 'info');
        } catch (e) {
            logError('Error downloading all media', e);
        }
    }

    /**
     * Handle element click
     * @param {Event} e - Click event
     */
    function handleElementClick(e) {
        try {
            if (!state.clickElementMode) return;

            e.preventDefault();
            e.stopPropagation();

            const element = e.target;

            // Check if screenshot tool is active
            const screenshotTool = document.getElementById('screenshotTool');
            if (screenshotTool.classList.contains('active')) {
                captureElementScreenshot(element);
                return;
            }

            // Open sidebar if not already open
            const sidebar = document.getElementById('dexSidebar');
            if (!sidebar.classList.contains('open')) {
                sidebar.classList.add('open');
            }

            // Find and select the element in the DOM tree
            const elementPath = getElementPath(element);
            const node = document.querySelector(`.dex-node[data-element-path="${elementPath}"]`);

            if (node) {
                // Remove previous selection
                document.querySelectorAll('.dex-node.selected').forEach(n => {
                    n.classList.remove('selected');
                });

                // Add selection to current node
                node.classList.add('selected');

                // Show properties and highlight element
                showProps(element);
                highlightElement(element);
                state.selectedElement = element;

                // Expand parent nodes to show the selected element
                let parent = node.parentElement;
                while (parent && parent !== document.getElementById('dexTree')) {
                    if (parent.classList.contains('dex-children')) {
                        parent.classList.add('expanded');
                        const toggleBtn = parent.previousElementSibling.querySelector('.dex-toggle');
                        if (toggleBtn) toggleBtn.classList.add('expanded');
                    }
                    parent = parent.parentElement;
                }

                // Scroll to the node
                node.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            // Exit click element mode
            state.clickElementMode = false;
            document.getElementById('clickElementTool').classList.remove('active');
            document.body.style.cursor = '';
        } catch (error) {
            logError('Error handling element click', error);
        }
    }

    /**
     * Update audio progress
     */
    function updateProgress() {
        try {
            const audioPlayerElement = document.getElementById('audioPlayerElement');
            const audioPlayerProgress = document.getElementById('audioPlayerProgress');

            if (audioPlayerElement.duration) {
                const progress = (audioPlayerElement.currentTime / audioPlayerElement.duration) * 100;
                audioPlayerProgress.style.width = `${progress}%`;
            }
        } catch (e) {
            logError('Error updating audio progress', e);
        }
    }

    /**
     * Update time display
     */
    function updateTimeDisplay() {
        try {
            const audioPlayerElement = document.getElementById('audioPlayerElement');
            const audioPlayerTime = document.getElementById('audioPlayerTime');

            if (audioPlayerElement.duration) {
                const currentMinutes = Math.floor(audioPlayerElement.currentTime / 60);
                const currentSeconds = Math.floor(audioPlayerElement.currentTime % 60);
                const durationMinutes = Math.floor(audioPlayerElement.duration / 60);
                const durationSeconds = Math.floor(audioPlayerElement.duration % 60);

                audioPlayerTime.textContent = `${currentMinutes}:${currentSeconds < 10 ? '0' : ''}${currentSeconds} / ${durationMinutes}:${durationSeconds < 10 ? '0' : ''}${durationSeconds}`;
            }
        } catch (e) {
            logError('Error updating time display', e);
        }
    }

    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} e - Keyboard event
     */
    function handleKeyboardShortcuts(e) {
        try {
            // Only process shortcuts when not in an input field
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                return;
            }

            // Toggle sidebar with Ctrl/Cmd + Shift + E
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
                e.preventDefault();
                const sidebar = document.getElementById('dexSidebar');
                sidebar.classList.toggle('open');
            }

            // Toggle toolbar with Ctrl/Cmd + Shift + T
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                const domToolsBar = document.getElementById('domToolsBar');
                domToolsBar.classList.toggle('visible');
            }

            // Focus search with Ctrl/Cmd + Shift + F
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
                e.preventDefault();
                const sidebar = document.getElementById('dexSidebar');
                if (!sidebar.classList.contains('open')) {
                    sidebar.classList.add('open');
                }
                setTimeout(() => {
                    const searchInput = document.getElementById('dexSearch');
                    searchInput.focus();
                }, 300);
            }

            // Escape key to close modals and exit modes
            if (e.key === 'Escape') {
                // Close media viewer modal
                const mediaViewerModal = document.getElementById('mediaViewerModal');
                if (mediaViewerModal.classList.contains('show')) {
                    mediaViewerModal.classList.remove('show');
                    setTimeout(() => {
                        mediaViewerModal.style.display = 'none';
                    }, 300);
                }

                // Close audio player
                const audioPlayer = document.getElementById('audioPlayer');
                if (audioPlayer.classList.contains('show')) {
                    audioPlayer.classList.remove('show');
                    const audioPlayerElement = document.getElementById('audioPlayerElement');
                    audioPlayerElement.pause();
                }

                // Exit click element mode
                if (state.clickElementMode) {
                    state.clickElementMode = false;
                    document.getElementById('clickElementTool').classList.remove('active');
                    document.body.style.cursor = '';
                }

                // Exit screenshot mode
                const screenshotTool = document.getElementById('screenshotTool');
                if (screenshotTool.classList.contains('active')) {
                    screenshotTool.classList.remove('active');
                    state.clickElementMode = false;
                    document.body.style.cursor = '';
                }
            }

            // Navigate DOM tree with arrow keys
            if (state.selectedElement) {
                const selectedNode = document.querySelector('.dex-node.selected');
                if (selectedNode) {
                    // Up arrow - select parent
                    if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        const parent = selectedNode.parentElement?.previousElementSibling;
                        if (parent && parent.classList.contains('dex-node')) {
                            parent.click();
                        }
                    }

                    // Down arrow - select first child
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        const childrenContainer = selectedNode.nextElementSibling;
                        if (childrenContainer && childrenContainer.classList.contains('dex-children')) {
                            const firstChild = childrenContainer.querySelector('.dex-node');
                            if (firstChild) {
                                firstChild.click();
                            }
                        }
                    }

                    // Left arrow - collapse/previous sibling
                    if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        const childrenContainer = selectedNode.nextElementSibling;
                        if (childrenContainer && childrenContainer.classList.contains('dex-children.expanded')) {
                            // Collapse children
                            toggleChildren(selectedNode);
                        } else {
                            // Select previous sibling
                            const previousSibling = selectedNode.previousElementSibling;
                            if (previousSibling && previousSibling.classList.contains('dex-node')) {
                                previousSibling.click();
                            }
                        }
                    }

                    // Right arrow - expand/next sibling
                    if (e.key === 'ArrowRight') {
                        e.preventDefault();
                        const childrenContainer = selectedNode.nextElementSibling;
                        if (childrenContainer && childrenContainer.classList.contains('dex-children') && !childrenContainer.classList.contains('expanded')) {
                            // Expand children
                            toggleChildren(selectedNode);
                        } else {
                            // Select next sibling
                            const nextSibling = selectedNode.nextElementSibling;
                            if (nextSibling && nextSibling.classList.contains('dex-node')) {
                                nextSibling.click();
                            }
                        }
                    }

                    // Enter key - expand/collapse
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        toggleChildren(selectedNode);
                    }
                }
            }
        } catch (e) {
            logError('Error handling keyboard shortcuts', e);
        }
    }

    /**
     * Setup toolbar visibility
     */
    function setupToolbarVisibility() {
        try {
            let toolsBarTimeout;
            const domToolsBar = document.getElementById('domToolsBar');

            document.addEventListener('mousemove', (e) => {
                if (e.clientY < 50) {
                    clearTimeout(toolsBarTimeout);
                    domToolsBar.classList.add('visible');
                } else {
                    toolsBarTimeout = setTimeout(() => {
                        if (!state.isToolbarCollapsed) {
                            domToolsBar.classList.remove('visible');
                        }
                    }, 1000);
                }
            });
        } catch (e) {
            logError('Error setting up toolbar visibility', e);
        }
    }

    /**
     * Setup network interception
     */
    function setupNetworkInterception() {
        try {
            // Store original XHR open and send methods
            const originalXHROpen = XMLHttpRequest.prototype.open;
            const originalXHRSend = XMLHttpRequest.prototype.send;

            // Override XHR open
            XMLHttpRequest.prototype.open = function(method, url) {
                this._method = method;
                this._url = url;
                this._startTime = new Date();
                return originalXHROpen.apply(this, arguments);
            };

            // Override XHR send
            XMLHttpRequest.prototype.send = function(data) {
                const xhr = this;

                // Add event listeners
                xhr.addEventListener('load', function() {
                    const endTime = new Date();
                    const duration = endTime - xhr._startTime;

                    state.networkRequests.push({
                        method: xhr._method,
                        url: xhr._url,
                        status: xhr.status,
                        duration: duration,
                        timestamp: endTime,
                        type: 'xhr'
                    });

                    // Keep only the last 100 requests
                    if (state.networkRequests.length > 100) {
                        state.networkRequests.shift();
                    }
                });

                xhr.addEventListener('error', function() {
                    const endTime = new Date();
                    const duration = endTime - xhr._startTime;

                    state.networkRequests.push({
                        method: xhr._method,
                        url: xhr._url,
                        status: 0,
                        duration: duration,
                        timestamp: endTime,
                        type: 'xhr',
                        error: true
                    });

                    // Keep only the last 100 requests
                    if (state.networkRequests.length > 100) {
                        state.networkRequests.shift();
                    }
                });

                return originalXHRSend.apply(this, arguments);
            };

            // Store original fetch
            const originalFetch = window.fetch;

            // Override fetch
            window.fetch = function(input, init) {
                const url = typeof input === 'string' ? input : input.url;
                const method = (init && init.method) || 'GET';
                const startTime = new Date();

                return originalFetch.apply(this, arguments)
                    .then(response => {
                        const endTime = new Date();
                        const duration = endTime - startTime;

                        state.networkRequests.push({
                            method: method,
                            url: url,
                            status: response.status,
                            duration: duration,
                            timestamp: endTime,
                            type: 'fetch'
                        });

                        // Keep only the last 100 requests
                        if (state.networkRequests.length > 100) {
                            state.networkRequests.shift();
                        }

                        return response;
                    })
                    .catch(error => {
                        const endTime = new Date();
                        const duration = endTime - startTime;

                        state.networkRequests.push({
                            method: method,
                            url: url,
                            status: 0,
                            duration: duration,
                            timestamp: endTime,
                            type: 'fetch',
                            error: true
                        });

                        // Keep only the last 100 requests
                        if (state.networkRequests.length > 100) {
                            state.networkRequests.shift();
                        }

                        throw error;
                    });
            };
        } catch (e) {
            logError('Error setting up network interception', e);
        }
    }

// ======== DOM TREE FUNCTIONS ========
/**
 * Build DOM tree
 * @param {Element} rootElement - Root element to build tree from
 * @param {Element} container - Container to build tree in
 * @param {number} depth - Current depth in tree
 * @param {string} parentPath - Parent element path
 */
function buildTree(rootElement, container, depth = 0, parentPath = '') {
    try {
        // Exit if the node is not an Element
        if (!rootElement || rootElement.nodeType !== Node.ELEMENT_NODE) {
            return;
        }

        // --- FIX: Use comprehensive check to exclude all DOM Explorer elements ---
        if (isDOMExplorerElement(rootElement)) {
            return;
        }

        // Clear container if it's the root call
        if (depth === 0) {
            container.innerHTML = '';
        }

        const node = document.createElement('div');
        node.className = 'dex-node';
        node.dataset.elementPath = getElementPath(rootElement);
        node.style.paddingLeft = `${depth * 14}px`;

        const tag = rootElement.tagName ? rootElement.tagName.toLowerCase() : "text";
        const icon = ELEMENT_ICONS[tag] || ELEMENT_ICONS.default;

        // Add toggle button if element has children
        const hasChildren = rootElement.children && rootElement.children.length > 0;
        const toggleBtn = document.createElement('span');
        toggleBtn.className = 'dex-toggle';
        toggleBtn.innerHTML = hasChildren ? '▶' : '';

        const iconSpan = document.createElement('span');
        iconSpan.className = 'dex-icon';
        iconSpan.textContent = icon;

        const tagSpan = document.createElement('span');
        tagSpan.innerHTML = `<${tag}>`;

        // Add indicators for special elements
        if (rootElement.shadowRoot) {
            tagSpan.innerHTML += '<span class="dex-shadow-indicator"></span>';
        }

        if (tag === 'iframe') {
            tagSpan.innerHTML += '<span class="dex-iframe-indicator"></span>';
        }

        if (rootElement.id) {
            tagSpan.innerHTML += `#${rootElement.id}`;
        }

        // Safely access the className property
        let classes = [];
        if (typeof rootElement.className === 'string') {
            classes = rootElement.className.split(' ').filter(c => c.trim());
        } else if (rootElement.className && typeof rootElement.className.baseVal === 'string') {
            classes = rootElement.className.baseVal.split(' ').filter(c => c.trim());
        }

        if (classes.length > 0) {
            tagSpan.innerHTML += `.${classes.join('.')}`;
        }

        node.appendChild(toggleBtn);
        node.appendChild(iconSpan);
        node.appendChild(tagSpan);

        // Left-click to select and show properties
        node.addEventListener("click", (e) => {
            e.stopPropagation();

            // Remove previous selection
            document.querySelectorAll('.dex-node.selected').forEach(n => {
                n.classList.remove('selected');
            });

            // Add selection to current node
            node.classList.add('selected');

            // Show properties and highlight element
            showProps(rootElement);
            highlightElement(rootElement);
            state.selectedElement = rootElement;

            // Update breadcrumb navigation
            updateBreadcrumb(rootElement);
        });

        // Right-click to show context menu
        node.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Select the element
            document.querySelectorAll('.dex-node.selected').forEach(n => {
                n.classList.remove('selected');
            });

            node.classList.add('selected');

            // Show context menu
            state.selectedElement = rootElement;
            buildContextMenu(rootElement);

            const contextMenu = document.querySelector('.dex-context-menu');
            contextMenu.style.display = 'block';

            // Position context menu
            let x = e.pageX;
            let y = e.pageY;

            // Adjust position if menu goes off-screen
            const menuWidth = 250;
            const menuHeight = contextMenu.offsetHeight;

            if (x + menuWidth > window.innerWidth) {
                x = window.innerWidth - menuWidth - 10;
            }

            if (y + menuHeight > window.innerHeight) {
                y = window.innerHeight - menuHeight - 10;
            }

            contextMenu.style.left = `${x}px`;
            contextMenu.style.top = `${y}px`;
        });

        // Add toggle functionality
        if (hasChildren) {
            toggleBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                toggleChildren(node);
            });
        }

        container.appendChild(node);

        // Process children with improved rendering
        if (hasChildren && depth < MAX_RENDER_DEPTH) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'dex-children';

            // Process all children immediately for better visibility
            const children = Array.from(rootElement.children);

            children.forEach(child => {
                buildTree(child, childrenContainer, depth + 1);
            });

            container.appendChild(childrenContainer);
        }

        // Process shadow DOM if present and visible
        if (rootElement.shadowRoot && state.shadowDOMVisible) {
            const shadowContainer = document.createElement('div');
            shadowContainer.className = 'dex-children';
            shadowContainer.style.borderLeftColor = 'var(--warning)';

            const shadowLabel = document.createElement('div');
            shadowLabel.className = 'dex-node';
            shadowLabel.style.paddingLeft = `${(depth + 1) * 14}px`;
            shadowLabel.innerHTML = '<span class="dex-icon">🌑</span><span>#shadow-root</span>';
            shadowLabel.style.fontStyle = 'italic';
            shadowLabel.style.color = 'var(--warning)';

            shadowContainer.appendChild(shadowLabel);

            const shadowChildren = Array.from(rootElement.shadowRoot.children);

            shadowChildren.forEach(child => {
                buildTree(child, shadowContainer, depth + 2);
            });

            container.appendChild(shadowContainer);
        }
    } catch (error) {
        logError('Error building DOM tree node', error);

        // Show error message in the tree
        const errorNode = document.createElement('div');
        errorNode.className = 'dex-node';
        errorNode.style.color = 'var(--danger)';
        errorNode.textContent = `Error: ${error.message}`;
        container.appendChild(errorNode);
    }
}

/**
 * Handle search
 */
function handleSearch() {
    try {
        const searchInput = document.getElementById('dexSearch');
        const searchTerm = searchInput.value.toLowerCase().trim();
        state.searchMatches = [];

        // Clear previous highlights
        document.querySelectorAll('.dex-search-highlight').forEach(el => {
            el.classList.remove('dex-search-highlight');
        });

        // Update results counter
        const resultsCount = document.querySelector('.results-count');
        const downloadAllBtn = document.querySelector('.download-all-btn');

        if (!searchTerm && state.currentSearchFilter === 'all') {
            resultsCount.textContent = '0 results';
            downloadAllBtn.style.display = 'none';
            return;
        }

        // --- FIX: Improve search functionality ---
        // Get all nodes in the tree
        const allNodes = document.querySelectorAll('.dex-node');

        // Search through nodes
        allNodes.forEach(node => {
            const text = node.textContent.toLowerCase();
            const elementPath = node.dataset.elementPath;
            let shouldHighlight = false;
            let matchType = 'text';

            if (state.currentSearchFilter === 'all') {
                shouldHighlight = text.includes(searchTerm);
            } else {
                // Check if node matches the filter type
                if (elementPath) {
                    try {
                        const element = document.querySelector(elementPath);
                        if (element) {
                            const tagName = element.tagName.toLowerCase();

                            if (state.currentSearchFilter === 'image' && tagName === 'img') {
                                shouldHighlight = true;
                                matchType = 'image';
                                state.searchMatches.push({type: 'image', element, node});
                            } else if (state.currentSearchFilter === 'audio' && tagName === 'audio') {
                                shouldHighlight = true;
                                matchType = 'audio';
                                state.searchMatches.push({type: 'audio', element, node});
                            } else if (state.currentSearchFilter === 'video' && tagName === 'video') {
                                shouldHighlight = true;
                                matchType = 'video';
                                state.searchMatches.push({type: 'video', element, node});
                            } else if (searchTerm) {
                                shouldHighlight = text.includes(searchTerm);
                            }
                        }
                    } catch (e) {
                        // Skip invalid selectors
                        console.warn('Invalid selector:', elementPath, e);
                    }
                }
            }

            if (shouldHighlight) {
                node.classList.add('dex-search-highlight');

                // Expand parent nodes to show the match
                let parent = node.parentElement;
                while (parent && parent !== document.getElementById('dexTree')) {
                    if (parent.classList.contains('dex-children')) {
                        parent.classList.add('expanded');
                        const toggleBtn = parent.previousElementSibling.querySelector('.dex-toggle');
                        if (toggleBtn) toggleBtn.classList.add('expanded');
                    }
                    parent = parent.parentElement;
                }
            }
        });

        // Update results counter with more descriptive text
        let resultsText = '';
        if (state.currentSearchFilter === 'all') {
            const highlightedNodes = document.querySelectorAll('.dex-search-highlight').length;
            resultsText = `${highlightedNodes} result${highlightedNodes !== 1 ? 's' : ''}`;
        } else {
            resultsText = `${state.searchMatches.length} ${state.currentSearchFilter}${state.searchMatches.length !== 1 ? 's' : ''} found`;
        }

        resultsCount.textContent = resultsText;

        // Show/hide download all button
        if (state.currentSearchFilter === 'image' || state.currentSearchFilter === 'audio' || state.currentSearchFilter === 'video') {
            downloadAllBtn.style.display = state.searchMatches.length > 0 ? 'block' : 'none';
        } else {
            downloadAllBtn.style.display = 'none';
        }

        // Scroll to first match
        if (state.searchMatches.length > 0) {
            const firstMatch = state.searchMatches[0].node;
            firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (state.currentSearchFilter === 'all' && searchTerm) {
            // For text search, find the first highlighted node
            const firstHighlighted = document.querySelector('.dex-search-highlight');
            if (firstHighlighted) {
                firstHighlighted.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    } catch (e) {
        logError('Error handling search', e);
    }
}

/**
 * Refresh DOM tree
 */
function refreshDOM() {
    try {
        const treeContainer = document.getElementById('dexTree');

        // Add a small delay to ensure the DOM is stable before rebuilding
        setTimeout(() => {
            buildTree(document.documentElement, treeContainer);
            showToast('DOM tree refreshed successfully', 'success');
        }, 100); // A shorter delay is usually fine for a manual refresh

    } catch (e) {
        logError('Error refreshing DOM tree', e);
        showToast('Error refreshing DOM tree', 'error');
    }
}
    /**
     * Toggle children visibility
     * @param {Element} node - Parent node
     */
    function toggleChildren(node) {
        try {
            const nextSibling = node.nextElementSibling;

            if (nextSibling && nextSibling.classList.contains('dex-children')) {
                nextSibling.classList.toggle('expanded');

                const toggleBtn = node.querySelector('.dex-toggle');
                if (toggleBtn) {
                    toggleBtn.classList.toggle('expanded');
                }
            }
        } catch (e) {
            logError('Error toggling children', e);
        }
    }

    /**
     * Expand all nodes
     */
    function expandAll() {
        try {
            document.querySelectorAll('.dex-children').forEach(child => {
                child.classList.add('expanded');

                const node = child.previousElementSibling;
                const toggleBtn = node.querySelector('.dex-toggle');
                if (toggleBtn) {
                    toggleBtn.classList.add('expanded');
                }
            });

            showToast('All nodes expanded', 'success');
        } catch (e) {
            logError('Error expanding all nodes', e);
        }
    }

    /**a
     * Collapse all nodes
     */
    function collapseAll() {
        try {
            document.querySelectorAll('.dex-children').forEach(child => {
                child.classList.remove('expanded');

                const node = child.previousElementSibling;
                const toggleBtn = node.querySelector('.dex-toggle');
                if (toggleBtn) {
                    toggleBtn.classList.remove('expanded');
                }
            });

            showToast('All nodes collapsed', 'success');
        } catch (e) {
            logError('Error collapsing all nodes', e);
        }
    }

    /**
 * Refresh DOM tree
 */
function refreshDOM() {
    try {
        const treeContainer = document.getElementById('dexTree');

        // Add a small delay to ensure the DOM is stable before rebuilding
        setTimeout(() => {
            buildTree(document.documentElement, treeContainer);
            showToast('DOM tree refreshed successfully', 'success');
        }, 100); // A shorter delay is usually fine for a manual refresh

    } catch (e) {
        logError('Error refreshing DOM tree', e);
        showToast('Error refreshing DOM tree', 'error');
    }
}

    // ======== PROPERTIES PANEL FUNCTIONS ========
    /**
     * Show element properties
     * @param {Element} element - Element to show properties for
     */
    function showProps(element) {
        try {
            // Save current state to history for undo/redo
            saveToHistory(element);

            // Basic properties
            let basicInfo = `Element Type: ${element.tagName}\n`;

            if (element.id) {
                basicInfo += `ID: ${element.id}\n`;
            }

            if (element.className) {
                basicInfo += `Class: ${element.className}\n`;
            }

            // Attributes
            if (element.attributes.length > 0) {
                basicInfo += '\nAttributes:\n';
                for (let attr of element.attributes) {
                    basicInfo += `  ${attr.name}="${attr.value}"\n`;
                }
            }

            // Text
            if (element.innerText && element.innerText.trim()) {
                basicInfo += `\nText Content: ${element.innerText.slice(0, 100)}${element.innerText.length > 100 ? '...' : ''}\n`;
            }

            // XPath
            basicInfo += `\nXPath: ${getXPath(element)}\n`;

            // CSS Selector
            basicInfo += `CSS Selector: ${getCssSelector(element)}\n`;

            document.getElementById('dexBasicProps').textContent = basicInfo;

            // Styles
            let stylesInfo = '';
            const computedStyle = window.getComputedStyle(element);

            for (let i = 0; i < computedStyle.length; i++) {
                const prop = computedStyle[i];
                const value = computedStyle.getPropertyValue(prop);
                stylesInfo += `${prop}: ${value}\n`;
            }

            document.getElementById('dexStylesProps').textContent = stylesInfo;

            // Build events panel
            buildEventsPanel(element);

            // Build storage panel
            buildStoragePanel();

            // Build performance panel if active
            if (state.activeTab === 'performance') {
                buildPerformancePanel(element);
            }

            // Build accessibility panel if active
            if (state.activeTab === 'accessibility') {
                buildAccessibilityPanel(element);
            }

            // Build breadcrumb navigation
            updateBreadcrumb(element);

            // Show grid/flex overlay if element is grid or flex
            showGridFlexOverlay(element);
        } catch (e) {
            logError('Error showing element properties', e);
        }
    }

    /**
 * Update breadcrumb navigation
 * @param {Element} element - Selected element
 */
function updateBreadcrumb(element) {
    try {
        const breadcrumbContainer = document.createElement('div');
        breadcrumbContainer.className = 'breadcrumb-nav';

        const path = [];
        let current = element;

        // Build path from element to root
        while (current && current.nodeType === Node.ELEMENT_NODE) {
            path.unshift(current);
            current = current.parentElement;
        }

        // Create breadcrumb items
        path.forEach((node, index) => {
            if (index > 0) {
                const separator = document.createElement('span');
                separator.className = 'breadcrumb-separator';
                separator.textContent = '>';
                breadcrumbContainer.appendChild(separator);
            }

            const item = document.createElement('div');
            item.className = 'breadcrumb-item';

            const tagName = node.tagName.toLowerCase();
            let label = tagName;

            if (node.id) {
                label += `#${node.id}`;
            } else {
                // --- FIX: Safely access className for HTML and SVG elements ---
                let classes = [];
                if (typeof node.className === 'string') {
                    classes = node.className.trim().split(/\s+/);
                } else if (node.className && typeof node.className.baseVal === 'string') {
                    classes = node.className.baseVal.trim().split(/\s+/);
                }

                if (classes.length > 0) {
                    label += `.${classes[0]}`; // Use only the first class for brevity
                }
            }

            item.textContent = label;
            item.title = label;

            // Add click handler to scroll to element
            item.addEventListener('click', () => {
                highlightElement(node);
                node.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });

            breadcrumbContainer.appendChild(item);
        });

        // Replace existing breadcrumb
        const basicProps = document.getElementById('dexBasicProps');
        const existingBreadcrumb = basicProps.querySelector('.breadcrumb-nav');

        if (existingBreadcrumb) {
            basicProps.replaceChild(breadcrumbContainer, existingBreadcrumb);
        } else {
            basicProps.insertBefore(breadcrumbContainer, basicProps.firstChild);
        }
    } catch (e) {
        logError('Error updating breadcrumb navigation', e);
    }
}

    /**
     * Build events panel
     * @param {Element} element - Element to build events panel for
     */
    function buildEventsPanel(element) {
        try {
            const eventsProps = document.getElementById('dexEventsProps');
            eventsProps.innerHTML = '';

            const eventsTitle = document.createElement('div');
            eventsTitle.className = 'dex-history-title';
            eventsTitle.innerHTML = '<span>⚡ Event Listeners</span>';
            eventsProps.appendChild(eventsTitle);

            const eventsList = document.createElement('div');
            eventsList.className = 'dex-event-list';

            // Get event listeners
            const events = getElementEventListeners(element);

            if (events.length === 0) {
                const emptyState = document.createElement('div');
                emptyState.className = 'dex-empty-state';
                emptyState.innerHTML = '<div class="dex-empty-icon">⚡</div>No event listeners found on this element';
                eventsList.appendChild(emptyState);
            } else {
                events.forEach(event => {
                    const eventItem = document.createElement('div');
                    eventItem.className = 'dex-event-item';

                    const eventName = document.createElement('span');
                    eventName.className = 'dex-event-name';
                    eventName.textContent = event.type;

                    const eventRemove = document.createElement('button');
                    eventRemove.className = 'dex-event-remove';
                    eventRemove.textContent = 'Remove';
                    eventRemove.title = 'Remove event listener';
                    eventRemove.setAttribute('aria-label', `Remove ${event.type} event listener`);

                    eventRemove.addEventListener('click', (e) => {
                        e.stopPropagation();

                        if (event.isProperty) {
                            // Remove property-based event listener
                            element[`on${event.type}`] = null;
                        } else {
                            // Remove addEventListener-based event listener
                            element.removeEventListener(event.type, event.listener);
                        }

                        buildEventsPanel(element);
                        showToast(`${event.type} listener removed`, 'info');
                    });

                    eventItem.appendChild(eventName);
                    eventItem.appendChild(eventRemove);
                    eventsList.appendChild(eventItem);
                });
            }

            eventsProps.appendChild(eventsList);

            // Add custom event listener
            const addEventGroup = document.createElement('div');
            addEventGroup.className = 'dex-prop-group';

            const addEventLabel = document.createElement('label');
            addEventLabel.className = 'dex-prop-label';
            addEventLabel.textContent = 'Add New Event Listener';

            const addEventControls = document.createElement('div');
            addEventControls.style.display = 'flex';
            addEventControls.gap = 'var(--spacing-xs)';

            const eventTypeInput = document.createElement('input');
            eventTypeInput.className = 'dex-prop-input';
            eventTypeInput.placeholder = 'Event type (e.g. click, mouseover)';
            eventTypeInput.style.flex = '1';
            eventTypeInput.setAttribute('aria-label', 'Event type');

            const addEventBtn = document.createElement('button');
            addEventBtn.className = 'dex-btn';
            addEventBtn.textContent = 'Add';
            addEventBtn.style.flex = '0';
            addEventBtn.setAttribute('aria-label', 'Add event listener');

            addEventControls.appendChild(eventTypeInput);
            addEventControls.appendChild(addEventBtn);
            addEventGroup.appendChild(addEventLabel);
            addEventGroup.appendChild(addEventControls);
            eventsProps.appendChild(addEventGroup);

            addEventBtn.addEventListener('click', () => {
                const eventType = eventTypeInput.value.trim();

                if (eventType) {
                    // Create a simple event handler
                    const eventHandler = function(e) {
                        console.log(`Event triggered: ${eventType}`, e);
                        showToast(`Event "${eventType}" triggered on element!`, 'info');
                    };

                    // Add event listener
                    element.addEventListener(eventType, eventHandler);

                    // Rebuild events panel
                    buildEventsPanel(element);

                    showToast(`${eventType} listener added successfully`, 'success');
                    eventTypeInput.value = '';
                }
            });
        } catch (e) {
            logError('Error building events panel', e);
        }
    }

// ======== HELPER FUNCTION ========
/**
 * Check if an element is part of the DOM Explorer UI
 * @param {Element} element - Element to check
 * @returns {boolean} True if element is part of DOM Explorer
 */
function isDOMExplorerElement(element) {
    if (!element) return false;

    // Check if element has ID starting with 'dex'
    if (element.id && element.id.startsWith('dex')) {
        return true;
    }

    // Check if element has DOM Explorer specific classes
    const dexClasses = [
        'dex-toggle-btn', 'dex-header', 'dex-title', 'dex-logo',
        'dex-theme-selector', 'dex-theme-toggle', 'dex-theme-dropdown',
        'dex-theme-option', 'dex-tree-container', 'dex-node',
        'dex-icon', 'dex-toggle', 'dex-children', 'dex-highlight',
        'dex-pinned-highlight', 'dex-search-highlight', 'dex-panel-resize',
        'dex-properties-container', 'dex-properties-header', 'dex-properties-title',
        'dex-properties-content', 'dex-prop-tabs', 'dex-prop-tab',
        'dex-prop-content', 'dex-context-menu', 'dex-context-item',
        'dex-context-divider', 'dex-toast', 'dex-prop-group',
        'dex-prop-label', 'dex-prop-input', 'dex-prop-textarea',
        'dex-prop-select', 'dex-attr-list', 'dex-attr-item',
        'dex-attr-name', 'dex-attr-value', 'dex-attr-remove',
        'dex-attr-add', 'dex-style-list', 'dex-style-item',
        'dex-style-name', 'dex-style-value', 'dex-style-remove',
        'dex-style-add', 'dex-edit-actions', 'dex-edit-btn',
        'dex-events', 'dex-event-list', 'dex-event-item',
        'dex-event-name', 'dex-event-remove', 'dex-color-input',
        'dex-empty-state', 'dex-empty-icon', 'dex-info-panel',
        'dex-info-row', 'dex-info-label', 'dex-info-value',
        'dex-shadow-indicator', 'dex-iframe-indicator',
        'dom-tool-btn', 'media-viewer-container', 'media-viewer-header',
        'media-viewer-title', 'media-viewer-content', 'media-item',
        'media-preview', 'media-info', 'media-title', 'media-url',
        'media-actions', 'media-btn', 'audio-player', 'audio-player-header',
        'audio-player-title', 'audio-player-close', 'audio-player-controls',
        'audio-player-play', 'audio-player-seek', 'audio-player-progress',
        'audio-player-time', 'audio-player-volume', 'audio-player-volume-slider',
        'audio-player-volume-level', 'ruler-tool', 'ruler-label',
        'grid-flex-overlay', 'grid-line', 'flex-line', 'resize-handle',
        'draggable-handle', 'breadcrumb-nav', 'breadcrumb-item',
        'breadcrumb-separator', 'pinned-elements', 'pinned-element-item',
        'pinned-element-info', 'pinned-element-name', 'pinned-element-path',
        'pinned-element-actions', 'pinned-element-btn', 'snippet-runner',
        'snippet-editor', 'snippet-actions', 'snippet-btn', 'snippet-output',
        'network-logger', 'network-filters', 'network-filter',
        'network-request-list', 'network-request-item', 'network-request-header',
        'network-request-method', 'network-request-url', 'network-request-status',
        'network-request-details', 'network-actions', 'css-injection',
        'css-editor', 'css-actions', 'css-btn', 'console-panel',
        'console-output', 'console-input-container', 'console-input',
        'console-run', 'console-message', 'performance-metrics',
        'metric-card', 'metric-title', 'metric-value', 'metric-bar',
        'metric-fill', 'metric-warning', 'performance-chart',
        'chart-bar', 'accessibility-results', 'accessibility-item',
        'accessibility-status', 'accessibility-icon', 'accessibility-title',
        'accessibility-description', 'accessibility-suggestion',
        'responsive-tester', 'responsive-sizes', 'responsive-size',
        'responsive-size-name', 'responsive-size-dimensions',
        'responsive-preview', 'responsive-iframe', 'color-picker-tool',
        'color-picker-display', 'color-picker-preview', 'color-picker-info',
        'color-picker-value', 'color-picker-actions', 'color-picker-btn',
        'color-picker-history', 'color-history-item', 'error-log',
        'error-log-list', 'error-log-item', 'error-log-header',
        'error-log-message', 'error-log-time', 'error-log-details',
        'export-options', 'export-format', 'export-format-option',
        'undo-redo-controls', 'undo-redo-btn', 'batch-operations',
        'batch-selection', 'batch-selection-title', 'batch-selection-count',
        'batch-actions', 'batch-action-btn', 'search-filters',
        'search-filter', 'search-results', 'results-count', 'download-all-btn'
    ];

    if (element.classList) {
        for (let cls of dexClasses) {
            if (element.classList.contains(cls)) {
                return true;
            }
        }
    }

    // Check if element is inside any DOM Explorer container
    const dexContainers = ['#dexSidebar', '#domToolsBar', '#mediaViewerModal',
                          '#audioPlayer', '#rulerTool', '#gridFlexOverlay',
                          '.dex-context-menu'];

    for (let selector of dexContainers) {
        const container = document.querySelector(selector);
        if (container && container.contains(element)) {
            return true;
        }
    }

    // Check if element is inside any element with ID starting with 'dex'
    let parent = element.parentElement;
    while (parent) {
        if (parent.id && parent.id.startsWith('dex')) {
            return true;
        }
        parent = parent.parentElement;
    }

    return false;
}
    /**
     * Build storage panel
     */
    function buildStoragePanel() {
        try {
            const storageProps = document.getElementById('dexStorageProps');
            storageProps.innerHTML = '';

            const storageTabs = document.createElement('div');
            storageTabs.className = 'dex-storage-tabs';
            storageTabs.setAttribute('role', 'tablist');

            const localStorageTab = document.createElement('button');
            localStorageTab.className = 'dex-storage-tab active';
            localStorageTab.textContent = 'Local Storage';
            localStorageTab.dataset.storage = 'local';
            localStorageTab.setAttribute('role', 'tab');
            localStorageTab.setAttribute('aria-selected', 'true');
            localStorageTab.setAttribute('tabindex', '0');

            const sessionStorageTab = document.createElement('button');
            sessionStorageTab.className = 'dex-storage-tab';
            sessionStorageTab.textContent = 'Session Storage';
            sessionStorageTab.dataset.storage = 'session';
            sessionStorageTab.setAttribute('role', 'tab');
            sessionStorageTab.setAttribute('aria-selected', 'false');
            sessionStorageTab.setAttribute('tabindex', '-1');

            storageTabs.appendChild(localStorageTab);
            storageTabs.appendChild(sessionStorageTab);
            storageProps.appendChild(storageTabs);

            const storageContent = document.createElement('div');
            storageContent.className = 'dex-storage-content';
            storageContent.id = 'dexStorageContent';
            storageProps.appendChild(storageContent);

            // Show local storage by default
            showStorageItems('local');

            // Tab switching
            storageTabs.querySelectorAll('.dex-storage-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    storageTabs.querySelectorAll('.dex-storage-tab').forEach(t => {
                        t.classList.remove('active');
                        t.setAttribute('aria-selected', 'false');
                        t.setAttribute('tabindex', '-1');
                    });

                    tab.classList.add('active');
                    tab.setAttribute('aria-selected', 'true');
                    tab.setAttribute('tabindex', '0');

                    showStorageItems(tab.dataset.storage);
                });

                // Keyboard navigation
                tab.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();

                        storageTabs.querySelectorAll('.dex-storage-tab').forEach(t => {
                            t.classList.remove('active');
                            t.setAttribute('aria-selected', 'false');
                            t.setAttribute('tabindex', '-1');
                        });

                        tab.classList.add('active');
                        tab.setAttribute('aria-selected', 'true');
                        tab.setAttribute('tabindex', '0');

                        showStorageItems(tab.dataset.storage);
                    }
                });
            });
        } catch (e) {
            logError('Error building storage panel', e);
        }
    }

    /**
     * Show storage items
     * @param {string} type - Storage type (local or session)
     */
    function showStorageItems(type) {
        try {
            const storageContent = document.getElementById('dexStorageContent');
            storageContent.innerHTML = '';

            const storage = type === 'local' ? localStorage : sessionStorage;
            const items = [];

            for (let i = 0; i < storage.length; i++) {
                const key = storage.key(i);
                const value = storage.getItem(key);
                items.push({ key, value });
            }

            if (items.length === 0) {
                const emptyState = document.createElement('div');
                emptyState.className = 'dex-empty-state';
                emptyState.innerHTML = `<div class="dex-empty-icon">💾</div>No items in ${type} storage`;
                storageContent.appendChild(emptyState);
            } else {
                items.forEach(item => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'dex-storage-item';

                    const keySpan = document.createElement('span');
                    keySpan.className = 'dex-storage-key';
                    keySpan.textContent = item.key;

                    const valueSpan = document.createElement('span');
                    valueSpan.className = 'dex-storage-value';
                    valueSpan.textContent = item.value;
                    valueSpan.title = item.value;

                    const actionsDiv = document.createElement('div');
                    actionsDiv.className = 'dex-storage-actions';

                    const copyBtn = document.createElement('button');
                    copyBtn.className = 'dex-storage-btn';
                    copyBtn.textContent = 'Copy';
                    copyBtn.setAttribute('aria-label', `Copy ${item.key}`);

                    copyBtn.addEventListener('click', () => {
                        GM_setClipboard(item.value);
                        showToast('Value copied to clipboard', 'success');
                    });

                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'dex-storage-btn';
                    deleteBtn.textContent = 'Delete';
                    deleteBtn.setAttribute('aria-label', `Delete ${item.key}`);

                    deleteBtn.addEventListener('click', () => {
                        storage.removeItem(item.key);
                        showStorageItems(type);
                        showToast('Item deleted', 'info');
                    });

                    actionsDiv.appendChild(copyBtn);
                    actionsDiv.appendChild(deleteBtn);

                    itemDiv.appendChild(keySpan);
                    itemDiv.appendChild(valueSpan);
                    itemDiv.appendChild(actionsDiv);

                    storageContent.appendChild(itemDiv);
                });
            }

            // Add new item form
            const addForm = document.createElement('div');
            addForm.style.marginTop = '12px';
            addForm.style.paddingTop = '12px';
            addForm.style.borderTop = '1px solid var(--border)';

            const keyInput = document.createElement('input');
            keyInput.className = 'dex-prop-input';
            keyInput.placeholder = 'Key';
            keyInput.style.marginBottom = '6px';
            keyInput.setAttribute('aria-label', 'Storage key');

            const valueInput = document.createElement('input');
            valueInput.className = 'dex-prop-input';
            valueInput.placeholder = 'Value';
            valueInput.style.marginBottom = '6px';
            valueInput.setAttribute('aria-label', 'Storage value');

            const addBtn = document.createElement('button');
            addBtn.className = 'dex-btn';
            addBtn.textContent = 'Add Item';
            addBtn.style.width = '100%';
            addBtn.setAttribute('aria-label', 'Add storage item');

            addBtn.addEventListener('click', () => {
                const key = keyInput.value.trim();
                const value = valueInput.value.trim();

                if (key) {
                    storage.setItem(key, value);
                    showStorageItems(type);
                    showToast('Item added', 'success');

                    keyInput.value = '';
                    valueInput.value = '';
                }
            });

            addForm.appendChild(keyInput);
            addForm.appendChild(valueInput);
            addForm.appendChild(addBtn);

            storageContent.appendChild(addForm);
        } catch (e) {
            logError('Error showing storage items', e);
        }
    }

    /**
     * Build performance panel
     * @param {Element} element - Element to build performance panel for
     */
    function buildPerformancePanel(element) {
        try {
            const performanceProps = document.getElementById('dexPerformanceProps');
            performanceProps.innerHTML = '';

            const performanceMetrics = document.createElement('div');
            performanceMetrics.className = 'performance-metrics';

            // Node count metric
            const nodeCountMetric = document.createElement('div');
            nodeCountMetric.className = 'metric-card';

            const nodeCountTitle = document.createElement('div');
            nodeCountTitle.className = 'metric-title';
            nodeCountTitle.innerHTML = '<span>📊</span> <span>Node Count</span>';

            const nodeCountValue = document.createElement('div');
            nodeCountValue.className = 'metric-value';
            const nodeCount = countNodes(element);
            nodeCountValue.textContent = nodeCount;

            const nodeCountBar = document.createElement('div');
            nodeCountBar.className = 'metric-bar';

            const nodeCountFill = document.createElement('div');
            nodeCountFill.className = 'metric-fill';
            const nodeCountPercentage = Math.min(100, (nodeCount / 1000) * 100);
            nodeCountFill.style.width = '0%';

            setTimeout(() => {
                nodeCountFill.style.width = `${nodeCountPercentage}%`;
            }, 100);

            nodeCountBar.appendChild(nodeCountFill);

            let nodeCountWarning = '';
            if (nodeCount > 5000) {
                nodeCountWarning = '<div class="metric-warning">⚠️ Large DOM tree detected (>5000 nodes)</div>';
            }

            nodeCountMetric.appendChild(nodeCountTitle);
            nodeCountMetric.appendChild(nodeCountValue);
            nodeCountMetric.appendChild(nodeCountBar);

            if (nodeCountWarning) {
                nodeCountMetric.innerHTML += nodeCountWarning;
            }

            // Max depth metric
            const maxDepthMetric = document.createElement('div');
            maxDepthMetric.className = 'metric-card';

            const maxDepthTitle = document.createElement('div');
            maxDepthTitle.className = 'metric-title';
            maxDepthTitle.innerHTML = '<span>🔽</span> <span>Max Depth</span>';

            const maxDepthValue = document.createElement('div');
            maxDepthValue.className = 'metric-value';
            const maxDepth = getMaxDepth(element);
            maxDepthValue.textContent = maxDepth;

            const maxDepthBar = document.createElement('div');
            maxDepthBar.className = 'metric-bar';

            const maxDepthFill = document.createElement('div');
            maxDepthFill.className = 'metric-fill';
            const maxDepthPercentage = Math.min(100, (maxDepth / 20) * 100);
            maxDepthFill.style.width = '0%';

            setTimeout(() => {
                maxDepthFill.style.width = `${maxDepthPercentage}%`;
            }, 100);

            maxDepthBar.appendChild(maxDepthFill);

            let maxDepthWarning = '';
            if (maxDepth > 15) {
                maxDepthWarning = '<div class="metric-warning">⚠️ Deep nesting detected (>15 levels)</div>';
            }

            maxDepthMetric.appendChild(maxDepthTitle);
            maxDepthMetric.appendChild(maxDepthValue);
            maxDepthMetric.appendChild(maxDepthBar);

            if (maxDepthWarning) {
                maxDepthMetric.innerHTML += maxDepthWarning;
            }

            // Performance chart
            const performanceChart = document.createElement('div');
            performanceChart.className = 'performance-chart';

            // Generate random data for the chart
            for (let i = 0; i < 10; i++) {
                const chartBar = document.createElement('div');
                chartBar.className = 'chart-bar';
                const height = Math.random() * 80 + 20;
                chartBar.style.height = '0%';

                setTimeout(() => {
                    chartBar.style.height = `${height}%`;
                }, 100 + i * 50);

                performanceChart.appendChild(chartBar);
            }

            // Suggestions
            const suggestions = document.createElement('div');
            suggestions.className = 'metric-card';
            suggestions.innerHTML = `
                <div class="metric-title"><span>💡</span> <span>Performance Suggestions</span></div>
                <div class="accessibility-description">
                    ${nodeCount > 5000 ? '• Consider virtual scrolling for large lists<br>' : ''}
                    ${maxDepth > 15 ? '• Reduce nested elements to improve performance<br>' : ''}
                    ${nodeCount > 1000 ? '• Use event delegation instead of individual event listeners<br>' : ''}
                    ${nodeCount > 2000 ? '• Implement lazy loading for off-screen content<br>' : ''}
                    ${nodeCount > 3000 ? '• Consider code splitting to reduce initial load time<br>' : ''}
                </div>
            `;

            performanceMetrics.appendChild(nodeCountMetric);
            performanceMetrics.appendChild(maxDepthMetric);
            performanceMetrics.appendChild(performanceChart);
            performanceMetrics.appendChild(suggestions);

            performanceProps.appendChild(performanceMetrics);
        } catch (e) {
            logError('Error building performance panel', e);
        }
    }

    /**
     * Build accessibility panel
     * @param {Element} element - Element to build accessibility panel for
     */
    function buildAccessibilityPanel(element) {
        try {
            const accessibilityProps = document.getElementById('dexAccessibilityProps');
            accessibilityProps.innerHTML = '';

            const accessibilityResults = document.createElement('div');
            accessibilityResults.className = 'accessibility-results';

            // Check for alt text on images
            if (element.tagName === 'IMG') {
                const altCheck = document.createElement('div');
                altCheck.className = 'accessibility-item';

                const altStatus = document.createElement('div');
                altStatus.className = 'accessibility-status';

                const altIcon = document.createElement('div');
                altIcon.className = 'accessibility-icon';

                const altTitle = document.createElement('div');
                altTitle.className = 'accessibility-title';

                const altDescription = document.createElement('div');
                altDescription.className = 'accessibility-description';

                const altSuggestion = document.createElement('div');
                altSuggestion.className = 'accessibility-suggestion';

                if (element.alt) {
                    altIcon.classList.add('pass');
                    altIcon.textContent = '✓';
                    altTitle.textContent = 'Image has alt text';
                    altDescription.textContent = `Alt text: "${element.alt}"`;
                } else {
                    altIcon.classList.add('fail');
                    altIcon.textContent = '✗';
                    altTitle.textContent = 'Missing alt text';
                    altDescription.textContent = 'Images should have descriptive alt text for screen readers';
                    altSuggestion.textContent = 'Add alt="description" to the img element';
                }

                altStatus.appendChild(altIcon);
                altStatus.appendChild(altTitle);
                altCheck.appendChild(altStatus);
                altCheck.appendChild(altDescription);

                if (altSuggestion.textContent) {
                    altCheck.appendChild(altSuggestion);
                }

                accessibilityResults.appendChild(altCheck);
            }

            // Check for form labels
            if (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(element.tagName)) {
                const labelCheck = document.createElement('div');
                labelCheck.className = 'accessibility-item';

                const labelStatus = document.createElement('div');
                labelStatus.className = 'accessibility-status';

                const labelIcon = document.createElement('div');
                labelIcon.className = 'accessibility-icon';

                const labelTitle = document.createElement('div');
                labelTitle.className = 'accessibility-title';

                const labelDescription = document.createElement('div');
                labelDescription.className = 'accessibility-description';

                const labelSuggestion = document.createElement('div');
                labelSuggestion.className = 'accessibility-suggestion';

                const id = element.id;
                const hasLabel = id && document.querySelector(`label[for="${id}"]`);
                const hasAriaLabel = element.getAttribute('aria-label');
                const hasAriaLabelledby = element.getAttribute('aria-labelledby');

                if (hasLabel || hasAriaLabel || hasAriaLabelledby) {
                    labelIcon.classList.add('pass');
                    labelIcon.textContent = '✓';
                    labelTitle.textContent = 'Form element has label';
                    labelDescription.textContent = hasLabel ?
                        `Label found: ${document.querySelector(`label[for="${id}"]`).textContent}` :
                        hasAriaLabel ?
                        `ARIA label: ${hasAriaLabel}` :
                        `ARIA labelledby: ${hasAriaLabelledby}`;
                } else {
                    labelIcon.classList.add('fail');
                    labelIcon.textContent = '✗';
                    labelTitle.textContent = 'Missing label';
                    labelDescription.textContent = 'Form elements should have associated labels';
                    labelSuggestion.textContent = id ?
                        `Add <label for="${id}">Label text</label>` :
                        'Add aria-label="Description" to the element';
                }

                labelStatus.appendChild(labelIcon);
                labelStatus.appendChild(labelTitle);
                labelCheck.appendChild(labelStatus);
                labelCheck.appendChild(labelDescription);

                if (labelSuggestion.textContent) {
                    labelCheck.appendChild(labelSuggestion);
                }

                accessibilityResults.appendChild(labelCheck);
            }

            // Check color contrast
            const computedStyle = window.getComputedStyle(element);
            const textColor = computedStyle.color;
            const backgroundColor = computedStyle.backgroundColor;

            if (textColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
                const contrastCheck = document.createElement('div');
                contrastCheck.className = 'accessibility-item';

                const contrastStatus = document.createElement('div');
                contrastStatus.className = 'accessibility-status';

                const contrastIcon = document.createElement('div');
                contrastIcon.className = 'accessibility-icon';

                const contrastTitle = document.createElement('div');
                contrastTitle.className = 'accessibility-title';

                const contrastDescription = document.createElement('div');
                contrastDescription.className = 'accessibility-description';

                const contrastSuggestion = document.createElement('div');
                contrastSuggestion.className = 'accessibility-suggestion';

                const contrastRatio = calculateContrastRatio(textColor, backgroundColor);

                if (contrastRatio >= 4.5) {
                    contrastIcon.classList.add('pass');
                    contrastIcon.textContent = '✓';
                    contrastTitle.textContent = 'Color contrast is sufficient';
                    contrastDescription.textContent = `Contrast ratio: ${contrastRatio.toFixed(2)}:1 (WCAG AA compliant)`;
                } else if (contrastRatio >= 3) {
                    contrastIcon.classList.add('warning');
                    contrastIcon.textContent = '⚠';
                    contrastTitle.textContent = 'Color contrast is low';
                    contrastDescription.textContent = `Contrast ratio: ${contrastRatio.toFixed(2)}:1 (below WCAG AA standard)`;
                    contrastSuggestion.textContent = 'Increase contrast between text and background colors';
                } else {
                    contrastIcon.classList.add('fail');
                    contrastIcon.textContent = '✗';
                    contrastTitle.textContent = 'Color contrast is insufficient';
                    contrastDescription.textContent = `Contrast ratio: ${contrastRatio.toFixed(2)}:1 (well below WCAG AA standard)`;
                    contrastSuggestion.textContent = 'Significantly increase contrast between text and background colors';
                }

                contrastStatus.appendChild(contrastIcon);
                contrastStatus.appendChild(contrastTitle);
                contrastCheck.appendChild(contrastStatus);
                contrastCheck.appendChild(contrastDescription);

                if (contrastSuggestion.textContent) {
                    contrastCheck.appendChild(contrastSuggestion);
                }

                accessibilityResults.appendChild(contrastCheck);
            }

            // Check for heading structure
            if (element.tagName.match(/^H[1-6]$/)) {
                const headingCheck = document.createElement('div');
                headingCheck.className = 'accessibility-item';

                const headingStatus = document.createElement('div');
                headingStatus.className = 'accessibility-status';

                const headingIcon = document.createElement('div');
                headingIcon.className = 'accessibility-icon';

                const headingTitle = document.createElement('div');
                headingTitle.className = 'accessibility-title';

                const headingDescription = document.createElement('div');
                headingDescription.className = 'accessibility-description';

                const headingSuggestion = document.createElement('div');
                headingSuggestion.className = 'accessibility-suggestion';

                const headingLevel = parseInt(element.tagName.substring(1));
                const previousHeading = findPreviousHeading(element);

                if (!previousHeading || parseInt(previousHeading.tagName.substring(1)) <= headingLevel) {
                    headingIcon.classList.add('pass');
                    headingIcon.textContent = '✓';
                    headingTitle.textContent = 'Heading structure is correct';
                    headingDescription.textContent = `Heading level ${headingLevel} follows proper hierarchy`;
                } else {
                    headingIcon.classList.add('warning');
                    headingIcon.textContent = '⚠';
                    headingTitle.textContent = 'Heading structure may be incorrect';
                    headingDescription.textContent = `Heading level ${headingLevel} follows heading level ${parseInt(previousHeading.tagName.substring(1))}`;
                    headingSuggestion.textContent = 'Consider adjusting heading levels to follow a proper hierarchy (H1 > H2 > H3, etc.)';
                }

                headingStatus.appendChild(headingIcon);
                headingStatus.appendChild(headingTitle);
                headingCheck.appendChild(headingStatus);
                headingCheck.appendChild(headingDescription);

                if (headingSuggestion.textContent) {
                    headingCheck.appendChild(headingSuggestion);
                }

                accessibilityResults.appendChild(headingCheck);
            }

            if (accessibilityResults.children.length === 0) {
                const emptyState = document.createElement('div');
                emptyState.className = 'dex-empty-state';
                emptyState.innerHTML = '<div class="dex-empty-icon">♿</div>No accessibility checks available for this element type';
                accessibilityResults.appendChild(emptyState);
            }

            accessibilityProps.appendChild(accessibilityResults);
        } catch (e) {
            logError('Error building accessibility panel', e);
        }
    }

    /**
     * Build error log panel
     */
    function buildErrorLogPanel() {
        try {
            const errorLogProps = document.getElementById('dexErrorlogProps');
            errorLogProps.innerHTML = '';

            const errorLogHeader = document.createElement('div');
            errorLogHeader.className = 'dex-prop-group';
            errorLogHeader.innerHTML = `
                <div class="dex-prop-label">Error Log</div>
                <div class="dex-info-row">
                    <span class="dex-info-label">Total Errors:</span>
                    <span class="dex-info-value">${state.errorLog.length}</span>
                </div>
            `;
            errorLogProps.appendChild(errorLogHeader);

            const errorLogList = document.createElement('div');
            errorLogList.className = 'error-log-list';

            if (state.errorLog.length === 0) {
                const emptyState = document.createElement('div');
                emptyState.className = 'dex-empty-state';
                emptyState.innerHTML = '<div class="dex-empty-icon">✅</div>No errors logged yet';
                errorLogList.appendChild(emptyState);
            } else {
                // Show errors in reverse chronological order (newest first)
                [...state.errorLog].reverse().forEach(error => {
                    const errorItem = document.createElement('div');
                    errorItem.className = 'error-log-item';

                    const errorHeader = document.createElement('div');
                    errorHeader.className = 'error-log-header';

                    const errorMessage = document.createElement('div');
                    errorMessage.className = 'error-log-message';
                    errorMessage.textContent = error.message;

                    const errorTime = document.createElement('div');
                    errorTime.className = 'error-log-time';
                    errorTime.textContent = new Date(error.timestamp).toLocaleTimeString();

                    const errorDetails = document.createElement('div');
                    errorDetails.className = 'error-log-details';
                    errorDetails.textContent = error.error;

                    if (error.stack) {
                        errorDetails.textContent += '\n\n' + error.stack;
                    }

                    errorHeader.appendChild(errorMessage);
                    errorHeader.appendChild(errorTime);
                    errorItem.appendChild(errorHeader);
                    errorItem.appendChild(errorDetails);
                    errorLogList.appendChild(errorItem);
                });
            }

            errorLogProps.appendChild(errorLogList);

            // Add clear button
            const clearBtn = document.createElement('button');
            clearBtn.className = 'dex-btn';
            clearBtn.textContent = 'Clear Error Log';
            clearBtn.style.marginTop = '10px';
            clearBtn.setAttribute('aria-label', 'Clear error log');

            clearBtn.addEventListener('click', () => {
                state.errorLog = [];
                buildErrorLogPanel();
                showToast('Error log cleared', 'info');
            });

            errorLogProps.appendChild(clearBtn);
        } catch (e) {
            logError('Error building error log panel', e);
        }
    }

    // ======== CONTEXT MENU FUNCTIONS ========
    /**
     * Build context menu
     * @param {Element} element - Element to build context menu for
     */
    function buildContextMenu(element) {
        try {
            const contextMenu = document.querySelector('.dex-context-menu');
            contextMenu.innerHTML = '';

            const tagName = element.tagName.toLowerCase();

            const contextItems = [
                { icon: '📋', text: 'Copy XPath', action: copyXPath },
                { icon: '🔗', text: 'Copy CSS Selector', action: copySelector },
                { icon: '📄', text: 'Copy HTML Code', action: copyHTML },
                { icon: '🎨', text: 'Copy All Styles', action: copyStyles },
                { icon: '👁️', text: 'Scroll to Element', action: scrollIntoView },
                { icon: '🔍', text: 'Inspect in DevTools', action: inspectInDevTools },
                { divider: true },
                { icon: '🔍', text: 'View Shadow DOM', action: viewShadowDOM },
                { icon: '🗂️', text: 'View Iframe Content', action: viewIframeContent },
                { divider: true },
                { icon: '📥', text: 'Download Image', action: downloadImage, elementTypes: ['img'] },
                { icon: '🎵', text: 'Download Audio', action: downloadAudio, elementTypes: ['audio'] },
                { icon: '🎬', text: 'Download Video', action: downloadVideo, elementTypes: ['video'] },
                { icon: '🎵', text: 'Play Audio', action: playAudio, elementTypes: ['audio'] },
                { icon: '📌', text: 'Pin Highlight', action: pinHighlight },
                { divider: true },
                { icon: '✏️', text: 'Edit Element', action: editElement },
                { icon: '👻', text: 'Hide Element', action: hideElement },
                { icon: '🗑️', text: 'Delete Element', action: deleteElement, class: 'danger' }
            ];

            contextItems.forEach(item => {
                if (item.divider) {
                    const divider = document.createElement('div');
                    divider.className = 'dex-context-divider';
                    contextMenu.appendChild(divider);
                } else if (!item.elementTypes || item.elementTypes.includes(tagName)) {
                    const menuItem = document.createElement('div');
                    menuItem.className = `dex-context-item ${item.class || ''}`;
                    menuItem.innerHTML = `<span>${item.icon}</span><span>${item.text}</span>`;
                    menuItem.setAttribute('role', 'menuitem');

                    menuItem.addEventListener('click', (e) => {
                        e.stopPropagation();
                        item.action(element);
                        contextMenu.style.display = 'none';
                    });

                    contextMenu.appendChild(menuItem);
                }
            });
        } catch (e) {
            logError('Error building context menu', e);
        }
    }

    /**
     * Copy XPath to clipboard
     * @param {Element} element - Element to copy XPath for
     */
    function copyXPath(element) {
        try {
            const xpath = getXPath(element);
            GM_setClipboard(xpath);
            showToast('XPath copied to clipboard!', 'success');
        } catch (e) {
            logError('Error copying XPath', e);
            showToast('Error copying XPath', 'error');
        }
    }

    /**
     * Copy CSS selector to clipboard
     * @param {Element} element - Element to copy CSS selector for
     */
    function copySelector(element) {
        try {
            const selector = getCssSelector(element);
            GM_setClipboard(selector);
            showToast('CSS Selector copied to clipboard!', 'success');
        } catch (e) {
            logError('Error copying CSS selector', e);
            showToast('Error copying CSS selector', 'error');
        }
    }

    /**
     * Copy HTML to clipboard
     * @param {Element} element - Element to copy HTML for
     */
    function copyHTML(element) {
        try {
            const html = element.outerHTML;
            GM_setClipboard(html);
            showToast('HTML code copied to clipboard!', 'success');
        } catch (e) {
            logError('Error copying HTML', e);
            showToast('Error copying HTML', 'error');
        }
    }

    /**
     * Copy styles to clipboard
     * @param {Element} element - Element to copy styles for
     */
    function copyStyles(element) {
        try {
            const computedStyle = window.getComputedStyle(element);
            let styles = '';

            for (let i = 0; i < computedStyle.length; i++) {
                const prop = computedStyle[i];
                const value = computedStyle.getPropertyValue(prop);
                styles += `${prop}: ${value};\n`;
            }

            GM_setClipboard(styles);
            showToast('All styles copied to clipboard!', 'success');
        } catch (e) {
            logError('Error copying styles', e);
            showToast('Error copying styles', 'error');
        }
    }

    /**
     * Scroll element into view
     * @param {Element} element - Element to scroll to
     */
    function scrollIntoView(element) {
        try {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            highlightElement(element);
            showToast('Element scrolled into view', 'info');
        } catch (e) {
            logError('Error scrolling element into view', e);
            showToast('Error scrolling element into view', 'error');
        }
    }

    /**
     * Inspect element in DevTools
     * @param {Element} element - Element to inspect
     */
    function inspectInDevTools(element) {
        try {
            console.log(element);

            if (typeof inspect === 'function') {
                inspect(element);
            } else if (window.devtools && window.devtools.inspectedWindow) {
                window.devtools.inspectedWindow.eval(`inspect($0)`);
            } else {
                showToast('DevTools not available', 'error');
            }
        } catch (e) {
            logError('Error inspecting element in DevTools', e);
            showToast('Error inspecting element', 'error');
        }
    }

    /**
     * View Shadow DOM
     * @param {Element} element - Element to view Shadow DOM for
     */
    function viewShadowDOM(element) {
        try {
            if (element.shadowRoot) {
                showToast('Shadow DOM detected!', 'info');
                highlightElement(element);
            } else {
                showToast('No Shadow DOM found on this element', 'info');
            }
        } catch (e) {
            logError('Error viewing Shadow DOM', e);
            showToast('Error viewing Shadow DOM', 'error');
        }
    }

    /**
     * View iframe content
     * @param {Element} element - Iframe element to view content for
     */
    function viewIframeContent(element) {
        try {
            if (element.tagName === 'IFRAME') {
                try {
                    const iframeDoc = element.contentDocument || element.contentWindow.document;
                    showToast('Iframe content accessible', 'success');
                    highlightElement(element);
                } catch (e) {
                    showToast('Cannot access iframe content (cross-origin restriction)', 'error');
                }
            } else {
                showToast('Selected element is not an iframe', 'info');
            }
        } catch (e) {
            logError('Error viewing iframe content', e);
            showToast('Error viewing iframe content', 'error');
        }
    }

    /**
     * Download image
     * @param {Element} element - Image element to download
     */
    function downloadImage(element) {
        try {
            if (element.tagName === 'IMG') {
                const src = element.src;
                const timestamp = new Date().getTime();
                const extension = src.split('.').pop().split('?')[0] || 'jpg';
                const filename = `image_${timestamp}.${extension}`;
                downloadFile(src, filename);
            }
        } catch (e) {
            logError('Error downloading image', e);
            showToast('Error downloading image', 'error');
        }
    }

    /**
     * Download audio
     * @param {Element} element - Audio element to download
     */
    function downloadAudio(element) {
        try {
            if (element.tagName === 'AUDIO') {
                let src = element.src;

                // If no src attribute, check for source elements
                if (!src) {
                    const source = element.querySelector('source');
                    if (source) {
                        src = source.src;
                    }
                }

                if (src) {
                    const timestamp = new Date().getTime();
                    const extension = src.split('.').pop().split('?')[0] || 'mp3';
                    const filename = `audio_${timestamp}.${extension}`;
                    downloadFile(src, filename);
                } else {
                    showToast('No audio source found', 'error');
                }
            }
        } catch (e) {
            logError('Error downloading audio', e);
            showToast('Error downloading audio', 'error');
        }
    }

    /**
     * Download video
     * @param {Element} element - Video element to download
     */
    function downloadVideo(element) {
        try {
            if (element.tagName === 'VIDEO') {
                let src = element.src;

                // If no src attribute, check for source elements
                if (!src) {
                    const source = element.querySelector('source');
                    if (source) {
                        src = source.src;
                    }
                }

                if (src) {
                    const timestamp = new Date().getTime();
                    const extension = src.split('.').pop().split('?')[0] || 'mp4';
                    const filename = `video_${timestamp}.${extension}`;
                    downloadFile(src, filename);
                } else {
                    showToast('No video source found', 'error');
                }
            }
        } catch (e) {
            logError('Error downloading video', e);
            showToast('Error downloading video', 'error');
        }
    }

    /**
     * Play audio
     * @param {Element} element - Audio element to play
     */
    function playAudio(element) {
        try {
            if (element.tagName === 'AUDIO') {
                let src = element.src;

                // If no src attribute, check for source elements
                if (!src) {
                    const source = element.querySelector('source');
                    if (source) {
                        src = source.src;
                    }
                }

                if (src) {
                    const audioPlayerElement = document.getElementById('audioPlayerElement');
                    const audioPlayer = document.getElementById('audioPlayer');
                    const audioPlayerPlay = document.getElementById('audioPlayerPlay');
                    const audioPlayerProgress = document.getElementById('audioPlayerProgress');

                    audioPlayerElement.src = src;
                    audioPlayer.classList.add('show');
                    audioPlayerPlay.textContent = '▶';
                    audioPlayerProgress.style.width = '0%';

                    // Set up event listeners
                    audioPlayerElement.onloadedmetadata = () => {
                        updateTimeDisplay();
                    };

                    audioPlayerElement.ontimeupdate = () => {
                        updateProgress();
                        updateTimeDisplay();
                    };

                    audioPlayerElement.onended = () => {
                        audioPlayerPlay.textContent = '▶';
                        audioPlayerProgress.style.width = '0%';
                    };

                    showToast('Audio player opened', 'success');
                } else {
                    showToast('No audio source found', 'error');
                }
            }
        } catch (e) {
            logError('Error playing audio', e);
            showToast('Error playing audio', 'error');
        }
    }

    /**
     * Pin highlight
     * @param {Element} element - Element to pin highlight for
     */
    function pinHighlight(element) {
        try {
            if (!state.pinnedElements.includes(element)) {
                state.pinnedElements.push(element);
                element.classList.add('dex-pinned-highlight');
                showToast('Element highlight pinned', 'success');
            } else {
                const index = state.pinnedElements.indexOf(element);
                if (index > -1) {
                    state.pinnedElements.splice(index, 1);
                    element.classList.remove('dex-pinned-highlight');
                    showToast('Element highlight unpinned', 'info');
                }
            }

            // Update pinned elements manager if visible
            const pinnedElementsPanel = document.getElementById('pinnedElementsPanel');
            if (pinnedElementsPanel && pinnedElementsPanel.style.display !== 'none') {
                showPinnedElementsManager();
            }
        } catch (e) {
            logError('Error pinning highlight', e);
            showToast('Error pinning highlight', 'error');
        }
    }

    /**
     * Edit element
     * @param {Element} element - Element to edit
     */
    function editElement(element) {
        try {
            // Switch to edit tab
            switchTab('edit');

            // Build edit form
            buildEditForm(element);
        } catch (e) {
            logError('Error editing element', e);
            showToast('Error editing element', 'error');
        }
    }

    /**
     * Hide element
     * @param {Element} element - Element to hide
     */
    function hideElement(element) {
        try {
            element.style.visibility = 'hidden';
            showToast('Element hidden from view', 'info');
        } catch (e) {
            logError('Error hiding element', e);
            showToast('Error hiding element', 'error');
        }
    }

    /**
     * Delete element
     * @param {Element} element - Element to delete
     */
    function deleteElement(element) {
        try {
            element.remove();
            showToast('Element deleted from DOM', 'info');
            refreshDOM();
        } catch (e) {
            logError('Error deleting element', e);
            showToast('Error deleting element', 'error');
        }
    }

    // ======== EDIT FORM FUNCTIONS ========
    /**
     * Build edit form for element
     * @param {Element} element - Element to build edit form for
     */
    function buildEditForm(element) {
        try {
            const editProps = document.getElementById('dexEditProps');
            editProps.innerHTML = '';

            // Element info panel
            const infoPanel = document.createElement('div');
            infoPanel.className = 'dex-info-panel';

            const tagName = document.createElement('div');
            tagName.className = 'dex-info-row';
            tagName.innerHTML = `<span class="dex-info-label">Element Type:</span><span class="dex-info-value">${element.tagName.toLowerCase()}</span>`;

            const elementPath = document.createElement('div');
            elementPath.className = 'dex-info-row';
            elementPath.innerHTML = `<span class="dex-info-label">DOM Path:</span><span class="dex-info-value">${getElementPath(element)}</span>`;

            // Check for shadow DOM
            if (element.shadowRoot) {
                const shadowInfo = document.createElement('div');
                shadowInfo.className = 'dex-info-row';
                shadowInfo.innerHTML = `<span class="dex-info-label">Shadow DOM:</span><span class="dex-info-value">Yes <span class="dex-shadow-indicator"></span></span>`;
                infoPanel.appendChild(shadowInfo);
            }

            // Check if iframe
            if (element.tagName === 'IFRAME') {
                const iframeInfo = document.createElement('div');
                iframeInfo.className = 'dex-info-row';
                iframeInfo.innerHTML = `<span class="dex-info-label">Iframe:</span><span class="dex-info-value">Yes <span class="dex-iframe-indicator"></span></span>`;
                infoPanel.appendChild(iframeInfo);
            }

            infoPanel.appendChild(tagName);
            infoPanel.appendChild(elementPath);
            editProps.appendChild(infoPanel);

            // ID editor
            const idGroup = document.createElement('div');
            idGroup.className = 'dex-prop-group';

            const idLabel = document.createElement('label');
            idLabel.className = 'dex-prop-label';
            idLabel.textContent = 'Element ID';
            idLabel.setAttribute('for', 'elementId');

            const idInput = document.createElement('input');
            idInput.className = 'dex-prop-input';
            idInput.type = 'text';
            idInput.value = element.id || '';
            idInput.placeholder = 'Enter element ID';
            idInput.id = 'elementId';
            idInput.dataset.prop = 'id';

            idGroup.appendChild(idLabel);
            idGroup.appendChild(idInput);
            editProps.appendChild(idGroup);

            // Class editor
            const classGroup = document.createElement('div');
            classGroup.className = 'dex-prop-group';

            const classLabel = document.createElement('label');
            classLabel.className = 'dex-prop-label';
            classLabel.textContent = 'CSS Classes';
            classLabel.setAttribute('for', 'elementClass');

            const classInput = document.createElement('input');
            classInput.className = 'dex-prop-input';
            classInput.type = 'text';
            classInput.value = element.className || '';
            classInput.placeholder = 'Enter CSS classes (space separated)';
            classInput.id = 'elementClass';
            classInput.dataset.prop = 'class';

            classGroup.appendChild(classLabel);
            classGroup.appendChild(classInput);
            editProps.appendChild(classGroup);

            // Text content editor (for text elements)
            let textInput = null;

            if (!['input', 'textarea', 'select', 'img', 'br', 'hr'].includes(element.tagName.toLowerCase())) {
                const textGroup = document.createElement('div');
                textGroup.className = 'dex-prop-group';

                const textLabel = document.createElement('label');
                textLabel.className = 'dex-prop-label';
                textLabel.textContent = 'Text Content';
                textLabel.setAttribute('for', 'elementText');

                textInput = document.createElement('textarea');
                textInput.className = 'dex-prop-textarea';
                textInput.value = element.innerText || element.textContent || '';
                textInput.placeholder = 'Enter text content';
                textInput.id = 'elementText';
                textInput.dataset.prop = 'text';

                textGroup.appendChild(textLabel);
                textGroup.appendChild(textInput);
                editProps.appendChild(textGroup);
            }

            // Attributes editor
            const attrGroup = document.createElement('div');
            attrGroup.className = 'dex-prop-group';

            const attrLabel = document.createElement('label');
            attrLabel.className = 'dex-prop-label';
            attrLabel.textContent = 'HTML Attributes';

            const attrList = document.createElement('div');
            attrList.className = 'dex-attr-list';

            // Add existing attributes (except id and class)
            for (let i = 0; i < element.attributes.length; i++) {
                const attr = element.attributes[i];
                if (attr.name === 'id' || attr.name === 'class') continue;

                const attrItem = document.createElement('div');
                attrItem.className = 'dex-attr-item';

                const attrName = document.createElement('input');
                attrName.className = 'dex-attr-name';
                attrName.type = 'text';
                attrName.value = attr.name;
                attrName.placeholder = 'Attribute name';
                attrName.dataset.attrName = attr.name;

                const attrValue = document.createElement('input');
                attrValue.className = 'dex-attr-value';
                attrValue.type = 'text';
                attrValue.value = attr.value;
                attrValue.placeholder = 'Attribute value';

                // Special handling for color attributes
                if (attr.name === 'color' || attr.name === 'bgcolor' || attr.name === 'style') {
                    const colorMatch = attr.value.match(/#[0-9a-f]{6}|#[0-9a-f]{3}/i);
                    if (colorMatch) {
                        const colorInput = document.createElement('input');
                        colorInput.type = 'color';
                        colorInput.className = 'dex-color-input';
                        colorInput.value = colorMatch[0];

                        colorInput.addEventListener('input', (e) => {
                            attrValue.value = attrValue.value.replace(colorMatch[0], e.target.value);
                            updateElementAttribute(element, attr.name, attr.name, attrValue.value);
                        });

                        attrItem.appendChild(colorInput);
                    }
                }

                const attrRemove = document.createElement('button');
                attrRemove.className = 'dex-attr-remove';
                attrRemove.textContent = '−';
                attrRemove.title = 'Remove attribute';
                attrRemove.setAttribute('aria-label', `Remove ${attr.name} attribute`);
                attrRemove.dataset.attrName = attr.name;

                attrItem.appendChild(attrName);
                attrItem.appendChild(attrValue);
                attrItem.appendChild(attrRemove);
                attrList.appendChild(attrItem);
            }

            const attrAdd = document.createElement('button');
            attrAdd.className = 'dex-attr-add';
            attrAdd.textContent = '+ Add New Attribute';
            attrAdd.setAttribute('aria-label', 'Add new attribute');

            attrGroup.appendChild(attrLabel);
            attrGroup.appendChild(attrList);
            attrGroup.appendChild(attrAdd);
            editProps.appendChild(attrGroup);

            // Styles editor
            const styleGroup = document.createElement('div');
            styleGroup.className = 'dex-prop-group';

            const styleLabel = document.createElement('label');
            styleLabel.className = 'dex-prop-label';
            styleLabel.textContent = 'Inline CSS Styles';

            const styleList = document.createElement('div');
            styleList.className = 'dex-style-list';

            // Add existing inline styles
            const inlineStyles = element.style;

            for (let i = 0; i < inlineStyles.length; i++) {
                const prop = inlineStyles[i];
                const value = inlineStyles.getPropertyValue(prop);

                const styleItem = document.createElement('div');
                styleItem.className = 'dex-style-item';

                const styleName = document.createElement('input');
                styleName.className = 'dex-style-name';
                styleName.type = 'text';
                styleName.value = prop;
                styleName.placeholder = 'Property name';
                styleName.dataset.styleName = prop;

                const styleValue = document.createElement('input');
                styleValue.className = 'dex-style-value';
                styleValue.type = 'text';
                styleValue.value = value;
                styleValue.placeholder = 'Property value';

                // Special handling for color properties
                if (prop.includes('color') || prop.includes('background') || prop.includes('border')) {
                    const colorMatch = value.match(/#[0-9a-f]{6}|#[0-9a-f]{3}|rgb\([^)]+\)/i);
                    if (colorMatch) {
                        const colorInput = document.createElement('input');
                        colorInput.type = 'color';
                        colorInput.className = 'dex-color-input';

                        // Convert rgb to hex if needed
                        let hexColor = colorMatch[0];
                        if (hexColor.startsWith('rgb')) {
                            const rgbValues = hexColor.match(/\d+/g);
                            if (rgbValues) {
                                const r = parseInt(rgbValues[0]);
                                const g = parseInt(rgbValues[1]);
                                const b = parseInt(rgbValues[2]);
                                hexColor = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
                            }
                        }

                        colorInput.value = hexColor;

                        colorInput.addEventListener('input', (e) => {
                            styleValue.value = styleValue.value.replace(colorMatch[0], e.target.value);
                            updateElementStyle(element, prop, prop, styleValue.value);
                        });

                        styleItem.appendChild(colorInput);
                    }
                }

                const styleRemove = document.createElement('button');
                styleRemove.className = 'dex-style-remove';
                styleRemove.textContent = '−';
                styleRemove.title = 'Remove style';
                styleRemove.setAttribute('aria-label', `Remove ${prop} style`);
                styleRemove.dataset.styleName = prop;

                styleItem.appendChild(styleName);
                styleItem.appendChild(styleValue);
                styleItem.appendChild(styleRemove);
                styleList.appendChild(styleItem);
            }

            const styleAdd = document.createElement('button');
            styleAdd.className = 'dex-style-add';
            styleAdd.textContent = '+ Add New Style';
            styleAdd.setAttribute('aria-label', 'Add new style');

            styleGroup.appendChild(styleLabel);
            styleGroup.appendChild(styleList);
            styleGroup.appendChild(styleAdd);
            editProps.appendChild(styleGroup);

            // Measure button
            const measureBtn = document.createElement('button');
            measureBtn.className = 'dex-btn';
            measureBtn.textContent = '📏 Measure Element';
            measureBtn.style.marginTop = '10px';
            measureBtn.setAttribute('aria-label', 'Measure element dimensions');

            measureBtn.addEventListener('click', () => {
                measureElement(element);
            });

            editProps.appendChild(measureBtn);

            // Action buttons
            const actionsGroup = document.createElement('div');
            actionsGroup.className = 'dex-edit-actions';

            const saveBtn = document.createElement('button');
            saveBtn.className = 'dex-edit-btn save';
            saveBtn.textContent = '💾 Save Changes';
            saveBtn.setAttribute('aria-label', 'Save changes');

            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'dex-edit-btn cancel';
            cancelBtn.textContent = '❌ Cancel';
            cancelBtn.setAttribute('aria-label', 'Cancel changes');

            actionsGroup.appendChild(saveBtn);
            actionsGroup.appendChild(cancelBtn);
            editProps.appendChild(actionsGroup);

            // Add event listeners
            idInput.addEventListener('input', () => {
                updateElementProperty(element, 'id', idInput.value);
            });

            classInput.addEventListener('input', () => {
                updateElementProperty(element, 'class', classInput.value);
            });

            if (textInput) {
                textInput.addEventListener('input', () => {
                    updateElementProperty(element, 'text', textInput.value);
                });
            }

            // Attribute event listeners
            attrList.querySelectorAll('.dex-attr-name').forEach(input => {
                input.addEventListener('input', (e) => {
                    const oldName = e.target.dataset.attrName;
                    const newName = e.target.value;
                    const valueInput = e.target.nextElementSibling;
                    updateElementAttribute(element, oldName, newName, valueInput.value);
                    e.target.dataset.attrName = newName;
                });
            });

            attrList.querySelectorAll('.dex-attr-value').forEach(input => {
                input.addEventListener('input', (e) => {
                    const nameInput = e.target.previousElementSibling;
                    updateElementAttribute(element, nameInput.value, nameInput.value, e.target.value);
                });
            });

            attrList.querySelectorAll('.dex-attr-remove').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const attrName = e.target.dataset.attrName;
                    element.removeAttribute(attrName);
                    buildEditForm(element);
                    showToast(`Attribute "${attrName}" removed`, 'info');
                });
            });

            attrAdd.addEventListener('click', () => {
                const name = prompt('Enter attribute name:');
                if (name) {
                    element.setAttribute(name, '');
                    buildEditForm(element);
                    showToast(`Attribute "${name}" added`, 'success');
                }
            });

            // Style event listeners
            styleList.querySelectorAll('.dex-style-name').forEach(input => {
                input.addEventListener('input', (e) => {
                    const oldName = e.target.dataset.styleName;
                    const newName = e.target.value;
                    const valueInput = e.target.nextElementSibling;
                    updateElementStyle(element, oldName, newName, valueInput.value);
                    e.target.dataset.styleName = newName;
                });
            });

            styleList.querySelectorAll('.dex-style-value').forEach(input => {
                input.addEventListener('input', (e) => {
                    const nameInput = e.target.previousElementSibling;
                    updateElementStyle(element, nameInput.value, nameInput.value, e.target.value);
                });
            });

            styleList.querySelectorAll('.dex-style-remove').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const styleName = e.target.dataset.styleName;
                    element.style.removeProperty(styleName);
                    buildEditForm(element);
                    showToast(`Style "${styleName}" removed`, 'info');
                });
            });

            styleAdd.addEventListener('click', () => {
                const name = prompt('Enter style property name:');
                if (name) {
                    element.style.setProperty(name, '');
                    buildEditForm(element);
                    showToast(`Style "${name}" added`, 'success');
                }
            });

            saveBtn.addEventListener('click', () => {
                showToast('All changes saved successfully!', 'success');
                highlightElement(element);
            });

            cancelBtn.addEventListener('click', () => {
                buildEditForm(element);
            });
        } catch (e) {
            logError('Error building edit form', e);
        }
    }

    /**
     * Measure element
     * @param {Element} element - Element to measure
     */
    function measureElement(element) {
        try {
            const rulerTool = document.getElementById('rulerTool');
            const rect = element.getBoundingClientRect();

            rulerTool.style.width = `${rect.width}px`;
            rulerTool.style.height = `${rect.height}px`;
            rulerTool.style.left = `${rect.left + window.scrollX}px`;
            rulerTool.style.top = `${rect.top + window.scrollY}px`;
            rulerTool.style.display = 'block';

            const rulerLabel = rulerTool.querySelector('.ruler-label');
            rulerLabel.textContent = `${Math.round(rect.width)}×${Math.round(rect.height)}px`;

            // Auto-hide after 5 seconds
            setTimeout(() => {
                rulerTool.style.display = 'none';
            }, 5000);

            showToast('Element measurement displayed', 'info');
        } catch (e) {
            logError('Error measuring element', e);
            showToast('Error measuring element', 'error');
        }
    }

    /**
     * Update element property
     * @param {Element} element - Element to update
     * @param {string} prop - Property name
     * @param {string} value - Property value
     */
    function updateElementProperty(element, prop, value) {
        try {
            if (prop === 'id') {
                element.id = value;
            } else if (prop === 'class') {
                element.className = value;
            } else if (prop === 'text') {
                element.innerText = value;
            }
        } catch (e) {
            logError('Error updating element property', e);
        }
    }

    /**
     * Update element attribute
     * @param {Element} element - Element to update
     * @param {string} oldName - Old attribute name
     * @param {string} newName - New attribute name
     * @param {string} value - Attribute value
     */
    function updateElementAttribute(element, oldName, newName, value) {
        try {
            if (oldName !== newName) {
                element.removeAttribute(oldName);
            }

            element.setAttribute(newName, value);
        } catch (e) {
            logError('Error updating element attribute', e);
        }
    }

    /**
     * Update element style
     * @param {Element} element - Element to update
     * @param {string} oldName - Old style name
     * @param {string} newName - New style name
     * @param {string} value - Style value
     */
    function updateElementStyle(element, oldName, newName, value) {
        try {
            if (oldName !== newName) {
                element.style.removeProperty(oldName);
            }

            element.style.setProperty(newName, value);
        } catch (e) {
            logError('Error updating element style', e);
        }
    }

    // ======== EXPORT FUNCTIONS ========
    /**
     * Export element data as JSON
     */
    function exportElementData() {
        try {
            if (!state.selectedElement) {
                showToast('No element selected', 'error');
                return;
            }

            const element = state.selectedElement;
            const elementData = {
                tagName: element.tagName,
                id: element.id,
                className: element.className,
                attributes: {},
                styles: {},
                events: [],
                innerHTML: element.innerHTML,
                outerHTML: element.outerHTML,
                rect: element.getBoundingClientRect()
            };

            // Get attributes
            for (let i = 0; i < element.attributes.length; i++) {
                const attr = element.attributes[i];
                elementData.attributes[attr.name] = attr.value;
            }

            // Get computed styles
            const computedStyle = window.getComputedStyle(element);

            for (let i = 0; i < computedStyle.length; i++) {
                const prop = computedStyle[i];
                elementData.styles[prop] = computedStyle.getPropertyValue(prop);
            }

            // Get event listeners
            const events = getElementEventListeners(element);

            events.forEach(event => {
                elementData.events.push({
                    type: event.type,
                    isProperty: event.isProperty
                });
            });

            // Convert to JSON
            const jsonData = JSON.stringify(elementData, null, 2);

            // Create download link
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `element_${element.tagName.toLowerCase()}_${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast('Element data exported', 'success');
        } catch (e) {
            logError('Error exporting element data', e);
            showToast('Error exporting element data', 'error');
        }
    }

    // ======== MEDIA FUNCTIONS ========
    /**
     * Load media files
     */
    function loadMediaFiles() {
        try {
            const mediaContent = document.getElementById('mediaViewerContent');
            mediaContent.innerHTML = '<div class="dex-empty-state"><div class="dex-empty-icon">📥</div><p>Scanning for media files...</p></div>';

            const mediaFiles = [];

            // Find images
            document.querySelectorAll('img').forEach(img => {
                if (img.src) {
                    mediaFiles.push({
                        type: 'image',
                        url: img.src,
                        title: img.alt || 'Image',
                        element: img
                    });
                }
            });

            // Find audio
            document.querySelectorAll('audio').forEach(audio => {
                if (audio.src) {
                    mediaFiles.push({
                        type: 'audio',
                        url: audio.src,
                        title: audio.title || 'Audio',
                        element: audio
                    });
                }

                // Check for source elements
                audio.querySelectorAll('source').forEach(source => {
                    if (source.src) {
                        mediaFiles.push({
                            type: 'audio',
                            url: source.src,
                            title: source.title || audio.title || 'Audio',
                            element: audio
                        });
                    }
                });
            });

            // Find video
            document.querySelectorAll('video').forEach(video => {
                if (video.src) {
                    mediaFiles.push({
                        type: 'video',
                        url: video.src,
                        title: video.title || 'Video',
                        element: video
                    });
                }

                // Check for source elements
                video.querySelectorAll('source').forEach(source => {
                    if (source.src) {
                        mediaFiles.push({
                            type: 'video',
                            url: source.src,
                            title: source.title || video.title || 'Video',
                            element: video
                        });
                    }
                });
            });

            // Display media files
            if (mediaFiles.length === 0) {
                mediaContent.innerHTML = '<div class="dex-empty-state"><div class="dex-empty-icon">📭</div><p>No media files found on this page</p></div>';
                return;
            }

            mediaContent.innerHTML = '';

            mediaFiles.forEach((media, index) => {
                const mediaItem = document.createElement('div');
                mediaItem.className = 'media-item';

                let preview = '';

                if (media.type === 'image') {
                    preview = `<img src="${media.url}" alt="${media.title}" class="media-preview">`;
                } else if (media.type === 'audio') {
                    preview = `<div class="media-preview" style="background: var(--primary); display: flex; align-items: center; justify-content: center; color: white;">🎵</div>`;
                } else if (media.type === 'video') {
                    preview = `<div class="media-preview" style="background: var(--secondary); display: flex; align-items: center; justify-content: center; color: white;">🎬</div>`;
                }

                mediaItem.innerHTML = `
                    ${preview}
                    <div class="media-info">
                        <div class="media-title">${media.title} (${media.type})</div>
                        <div class="media-url">${media.url}</div>
                        <div class="media-actions">
                            <button class="media-btn" data-index="${index}" data-action="download" aria-label="Download ${media.type}">Download</button>
                            <button class="media-btn secondary" data-index="${index}" data-action="view" aria-label="View ${media.type}">View</button>
                        </div>
                    </div>
                `;

                mediaContent.appendChild(mediaItem);
            });

            // Add event listeners to buttons
            document.querySelectorAll('[data-action="download"]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    const media = mediaFiles[index];

                    if (media.type === 'image') {
                        downloadImage(media.element);
                    } else if (media.type === 'audio') {
                        downloadAudio(media.element);
                    } else if (media.type === 'video') {
                        downloadVideo(media.element);
                    }
                });
            });

            document.querySelectorAll('[data-action="view"]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    const media = mediaFiles[index];

                    if (media.type === 'image') {
                        window.open(media.url, '_blank');
                    } else if (media.type === 'audio') {
                        playAudio(media.element);
                    } else if (media.type === 'video') {
                        window.open(media.url, '_blank');
                    }
                });
            });
        } catch (e) {
            logError('Error loading media files', e);
        }
    }

    // ======== NEW FEATURES FUNCTIONS ========
    /**
     * Capture element screenshot
     * @param {Element} element - Element to capture
     */
    function captureElementScreenshot(element) {
        try {
            // Check if html2canvas is available
            if (typeof html2canvas === 'undefined') {
                // Load html2canvas from CDN
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
                script.onload = () => {
                    captureElementScreenshot(element);
                };
                document.head.appendChild(script);
                return;
            }

            showToast('Capturing screenshot...', 'info');

            html2canvas(element).then(canvas => {
                // Convert canvas to blob
                canvas.toBlob(blob => {
                    // Create download link
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `screenshot_${element.tagName.toLowerCase()}_${Date.now()}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    showToast('Screenshot captured and downloaded', 'success');

                    // Exit screenshot mode
                    state.clickElementMode = false;
                    document.getElementById('screenshotTool').classList.remove('active');
                    document.body.style.cursor = '';
                });
            }).catch(error => {
                logError('Error capturing screenshot', error);
                showToast('Error capturing screenshot', 'error');
            });
        } catch (e) {
            logError('Error in captureElementScreenshot', e);
            showToast('Error capturing screenshot', 'error');
        }
    }

    /**
     * Show snippet runner
     */
    function showSnippetRunner() {
        try {
            // Create snippet runner modal if it doesn't exist
            let snippetModal = document.getElementById('snippetRunnerModal');

            if (!snippetModal) {
                snippetModal = document.createElement('div');
                snippetModal.id = 'snippetRunnerModal';
                snippetModal.className = 'media-viewer-container';
                snippetModal.style.position = 'fixed';
                snippetModal.style.top = '50%';
                snippetModal.style.left = '50%';
                snippetModal.style.transform = 'translate(-50%, -50%)';
                snippetModal.style.width = '80%';
                snippetModal.style.maxWidth = '800px';
                snippetModal.style.height = '70%';
                snippetModal.style.maxHeight = '600px';
                snippetModal.style.zIndex = '10000002';
                snippetModal.style.display = 'flex';
                snippetModal.style.flexDirection = 'column';

                snippetModal.innerHTML = `
                    <div class="media-viewer-header">
                        <div class="media-viewer-title">Snippet Runner</div>
                        <button class="media-viewer-close" aria-label="Close snippet runner">×</button>
                    </div>
                    <div class="media-viewer-content" style="padding: 20px; display: flex; flex-direction: column; height: 100%;">
                        <div class="snippet-runner" style="flex: 1; display: flex; flex-direction: column;">
                            <div class="snippet-info" style="margin-bottom: 10px;">
                                <p>Run JavaScript code snippets on the current page. Use <code>document</code> to access the DOM.</p>
                            </div>
                            <textarea class="snippet-editor" placeholder="// Enter your JavaScript code here...
console.log('Hello, world!');
document.body.style.backgroundColor = 'lightblue';" aria-label="JavaScript code editor"></textarea>
                            <div class="snippet-actions">
                                <button class="snippet-btn" id="runSnippetBtn">Run Snippet</button>
                                <button class="snippet-btn secondary" id="clearSnippetBtn">Clear</button>
                                <button class="snippet-btn secondary" id="saveSnippetBtn">Save Snippet</button>
                            </div>
                            <div class="snippet-output" style="margin-top: 15px; flex: 1; overflow: auto; background: var(--background); border: 1px solid var(--border); border-radius: 6px; padding: 10px; font-family: monospace; font-size: 12px; white-space: pre-wrap; min-height: 100px;" aria-live="polite" aria-label="Snippet output">// Output will appear here...</div>
                        </div>
                    </div>
                `;

                document.body.appendChild(snippetModal);

                // Add event listeners
                const runBtn = snippetModal.querySelector('#runSnippetBtn');
                const clearBtn = snippetModal.querySelector('#clearSnippetBtn');
                const saveBtn = snippetModal.querySelector('#saveSnippetBtn');
                const closeBtn = snippetModal.querySelector('.media-viewer-close');
                const snippetEditor = snippetModal.querySelector('.snippet-editor');
                const snippetOutput = snippetModal.querySelector('.snippet-output');

                runBtn.addEventListener('click', () => {
                    const code = snippetEditor.value;

                    if (!code.trim()) {
                        showToast('Please enter some code to run', 'warning');
                        return;
                    }

                    snippetOutput.textContent = 'Running...';

                    try {
                        // Create a new function to run the code
                        const result = new Function(code)();

                        if (result !== undefined) {
                            snippetOutput.textContent = typeof result === 'object' ?
                                JSON.stringify(result, null, 2) :
                                String(result);
                        } else {
                            snippetOutput.textContent = 'Code executed successfully (no return value)';
                        }
                    } catch (error) {
                        snippetOutput.textContent = `Error: ${error.message}`;
                        logError('Error running snippet', error);
                    }
                });

                clearBtn.addEventListener('click', () => {
                    snippetEditor.value = '';
                    snippetOutput.textContent = '// Output will appear here...';
                });

                saveBtn.addEventListener('click', () => {
                    const code = snippetEditor.value;

                    if (!code.trim()) {
                        showToast('Please enter some code to save', 'warning');
                        return;
                    }

                    const name = prompt('Enter a name for this snippet:');
                    if (name) {
                        state.snippets.push({
                            name,
                            code,
                            timestamp: new Date().toISOString()
                        });

                        showToast(`Snippet "${name}" saved`, 'success');
                    }
                });

                closeBtn.addEventListener('click', () => {
                    snippetModal.style.display = 'none';
                    document.getElementById('snippetRunnerTool').classList.remove('active');
                });
            } else {
                snippetModal.style.display = 'flex';
            }
        } catch (e) {
            logError('Error showing snippet runner', e);
            showToast('Error showing snippet runner', 'error');
        }
    }

    /**
     * Show network logger
     */
    function showNetworkLogger() {
        try {
            // Create network logger modal if it doesn't exist
            let networkModal = document.getElementById('networkLoggerModal');

            if (!networkModal) {
                networkModal = document.createElement('div');
                networkModal.id = 'networkLoggerModal';
                networkModal.className = 'media-viewer-container';
                networkModal.style.position = 'fixed';
                networkModal.style.top = '50%';
                networkModal.style.left = '50%';
                networkModal.style.transform = 'translate(-50%, -50%)';
                networkModal.style.width = '80%';
                networkModal.style.maxWidth = '900px';
                networkModal.style.height = '70%';
                networkModal.style.maxHeight = '700px';
                networkModal.style.zIndex = '10000002';
                networkModal.style.display = 'flex';
                networkModal.style.flexDirection = 'column';

                networkModal.innerHTML = `
                    <div class="media-viewer-header">
                        <div class="media-viewer-title">Network Request Logger</div>
                        <button class="media-viewer-close" aria-label="Close network logger">×</button>
                    </div>
                    <div class="media-viewer-content" style="padding: 20px; display: flex; flex-direction: column; height: 100%;">
                        <div class="network-logger" style="flex: 1; display: flex; flex-direction: column;">
                            <div class="network-filters">
                                <div class="network-filter active" data-filter="all">All</div>
                                <div class="network-filter" data-filter="xhr">XHR</div>
                                <div class="network-filter" data-filter="fetch">Fetch</div>
                                <div class="network-filter" data-filter="success">Success</div>
                                <div class="network-filter" data-filter="error">Error</div>
                            </div>
                            <div class="network-request-list" style="flex: 1; overflow: auto; margin-top: 10px;">
                                <!-- Network requests will be added here -->
                            </div>
                            <div class="network-actions" style="margin-top: 10px; display: flex; justify-content: space-between;">
                                <button class="snippet-btn secondary" id="clearNetworkBtn">Clear Log</button>
                                <button class="snippet-btn secondary" id="exportNetworkBtn">Export as CSV</button>
                            </div>
                        </div>
                    </div>
                `;

                document.body.appendChild(networkModal);

                // Add event listeners
                const closeBtn = networkModal.querySelector('.media-viewer-close');
                const clearBtn = networkModal.querySelector('#clearNetworkBtn');
                const exportBtn = networkModal.querySelector('#exportNetworkBtn');
                const requestList = networkModal.querySelector('.network-request-list');

                closeBtn.addEventListener('click', () => {
                    networkModal.style.display = 'none';
                    document.getElementById('networkLoggerTool').classList.remove('active');
                });

                clearBtn.addEventListener('click', () => {
                    state.networkRequests = [];
                    updateNetworkRequestList(requestList);
                });

                exportBtn.addEventListener('click', () => {
                    exportNetworkRequestsAsCSV();
                });

                // Filter buttons
                const filterButtons = networkModal.querySelectorAll('.network-filter');

                filterButtons.forEach(btn => {
                    btn.addEventListener('click', () => {
                        filterButtons.forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        updateNetworkRequestList(requestList, btn.dataset.filter);
                    });
                });

                // Initial update
                updateNetworkRequestList(requestList);
            } else {
                networkModal.style.display = 'flex';

                // Update the request list
                const requestList = networkModal.querySelector('.network-request-list');
                updateNetworkRequestList(requestList);
            }
        } catch (e) {
            logError('Error showing network logger', e);
            showToast('Error showing network logger', 'error');
        }
    }

    /**
     * Update network request list
     * @param {Element} requestList - Request list element
     * @param {string} filter - Filter to apply
     */
    function updateNetworkRequestList(requestList, filter = 'all') {
        try {
            requestList.innerHTML = '';

            let filteredRequests = [...state.networkRequests];

            // Apply filter
            if (filter !== 'all') {
                if (filter === 'xhr') {
                    filteredRequests = filteredRequests.filter(req => req.type === 'xhr');
                } else if (filter === 'fetch') {
                    filteredRequests = filteredRequests.filter(req => req.type === 'fetch');
                } else if (filter === 'success') {
                    filteredRequests = filteredRequests.filter(req => req.status >= 200 && req.status < 300);
                } else if (filter === 'error') {
                    filteredRequests = filteredRequests.filter(req => req.status === 0 || req.status >= 400 || req.error);
                }
            }

            // Sort by timestamp (newest first)
            filteredRequests.sort((a, b) => b.timestamp - a.timestamp);

            if (filteredRequests.length === 0) {
                requestList.innerHTML = '<div class="dex-empty-state"><div class="dex-empty-icon">🌐</div>No network requests found</div>';
                return;
            }

            filteredRequests.forEach(request => {
                const requestItem = document.createElement('div');
                requestItem.className = 'network-request-item';

                const statusClass = request.error ? 'error' :
                                    (request.status >= 200 && request.status < 300) ? 'success' :
                                    'pending';

                requestItem.innerHTML = `
                    <div class="network-request-header">
                        <div class="network-request-method ${request.method}">${request.method}</div>
                        <div class="network-request-status ${statusClass}">${request.status || (request.error ? 'ERR' : 'PENDING')}</div>
                    </div>
                    <div class="network-request-url">${request.url}</div>
                    <div class="network-request-details">
                        Duration: ${request.duration}ms | Type: ${request.type} | Time: ${new Date(request.timestamp).toLocaleTimeString()}
                    </div>
                `;

                requestList.appendChild(requestItem);
            });
        } catch (e) {
            logError('Error updating network request list', e);
        }
    }

    /**
     * Export network requests as CSV
     */
    function exportNetworkRequestsAsCSV() {
        try {
            if (state.networkRequests.length === 0) {
                showToast('No network requests to export', 'warning');
                return;
            }

            // Create CSV content
            let csvContent = 'Method,URL,Status,Duration,Type,Timestamp\n';

            state.networkRequests.forEach(request => {
                csvContent += `"${request.method}","${request.url}",${request.status || (request.error ? 'ERROR' : 'PENDING')},${request.duration},"${request.type}","${new Date(request.timestamp).toISOString()}"\n`;
            });

            // Create download link
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `network_requests_${Date.now()}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast('Network requests exported as CSV', 'success');
        } catch (e) {
            logError('Error exporting network requests', e);
            showToast('Error exporting network requests', 'error');
        }
    }

    /**
     * Show pinned elements manager
     */
    function showPinnedElementsManager() {
        try {
            // Create pinned elements modal if it doesn't exist
            let pinnedModal = document.getElementById('pinnedElementsModal');

            if (!pinnedModal) {
                pinnedModal = document.createElement('div');
                pinnedModal.id = 'pinnedElementsModal';
                pinnedModal.className = 'media-viewer-container';
                pinnedModal.style.position = 'fixed';
                pinnedModal.style.top = '50%';
                pinnedModal.style.left = '50%';
                pinnedModal.style.transform = 'translate(-50%, -50%)';
                pinnedModal.style.width = '70%';
                pinnedModal.style.maxWidth = '700px';
                pinnedModal.style.height = '60%';
                pinnedModal.style.maxHeight = '500px';
                pinnedModal.style.zIndex = '10000002';
                pinnedModal.style.display = 'flex';
                pinnedModal.style.flexDirection = 'column';

                pinnedModal.innerHTML = `
                    <div class="media-viewer-header">
                        <div class="media-viewer-title">Pinned Elements Manager</div>
                        <button class="media-viewer-close" aria-label="Close pinned elements manager">×</button>
                    </div>
                    <div class="media-viewer-content" style="padding: 20px; display: flex; flex-direction: column; height: 100%;">
                        <div class="pinned-elements" style="flex: 1; overflow: auto;">
                            <!-- Pinned elements will be added here -->
                        </div>
                        <div class="pinned-actions" style="margin-top: 10px; display: flex; justify-content: space-between;">
                            <button class="snippet-btn secondary" id="clearAllPinnedBtn">Clear All</button>
                            <button class="snippet-btn" id="exportPinnedBtn">Export as JSON</button>
                        </div>
                    </div>
                `;

                document.body.appendChild(pinnedModal);

                // Add event listeners
                const closeBtn = pinnedModal.querySelector('.media-viewer-close');
                const clearAllBtn = pinnedModal.querySelector('#clearAllPinnedBtn');
                const exportBtn = pinnedModal.querySelector('#exportPinnedBtn');
                const pinnedContainer = pinnedModal.querySelector('.pinned-elements');

                closeBtn.addEventListener('click', () => {
                    pinnedModal.style.display = 'none';
                });

                clearAllBtn.addEventListener('click', () => {
                    // Remove all pinned highlights
                    state.pinnedElements.forEach(element => {
                        element.classList.remove('dex-pinned-highlight');
                    });

                    // Clear pinned elements array
                    state.pinnedElements = [];

                    // Update UI
                    updatePinnedElementsList(pinnedContainer);

                    showToast('All pinned elements cleared', 'info');
                });

                exportBtn.addEventListener('click', () => {
                    exportPinnedElementsAsJSON();
                });

                // Initial update
                updatePinnedElementsList(pinnedContainer);
            } else {
                pinnedModal.style.display = 'flex';

                // Update the pinned elements list
                const pinnedContainer = pinnedModal.querySelector('.pinned-elements');
                updatePinnedElementsList(pinnedContainer);
            }
        } catch (e) {
            logError('Error showing pinned elements manager', e);
            showToast('Error showing pinned elements manager', 'error');
        }
    }

    /**
     * Update pinned elements list
     * @param {Element} pinnedContainer - Pinned elements container
     */
    function updatePinnedElementsList(pinnedContainer) {
        try {
            pinnedContainer.innerHTML = '';

            if (state.pinnedElements.length === 0) {
                pinnedContainer.innerHTML = '<div class="dex-empty-state"><div class="dex-empty-icon">📌</div>No pinned elements</div>';
                return;
            }

            state.pinnedElements.forEach((element, index) => {
                const pinnedItem = document.createElement('div');
                pinnedItem.className = 'pinned-element-item';

                const tagName = element.tagName.toLowerCase();
                let elementName = tagName;

                if (element.id) {
                    elementName += `#${element.id}`;
                } else if (element.className && element.className !== '') {
                    const classes = element.className.split(' ')[0];
                    elementName += `.${classes}`;
                }

                pinnedItem.innerHTML = `
                    <div class="pinned-element-info">
                        <div class="pinned-element-name">${elementName}</div>
                        <div class="pinned-element-path">${getElementPath(element)}</div>
                    </div>
                    <div class="pinned-element-actions">
                        <button class="pinned-element-btn scroll-to" data-index="${index}" aria-label="Scroll to element">Scroll To</button>
                        <button class="pinned-element-btn unpin" data-index="${index}" aria-label="Unpin element">Unpin</button>
                    </div>
                `;

                pinnedContainer.appendChild(pinnedItem);
            });

            // Add event listeners
            pinnedContainer.querySelectorAll('.scroll-to').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    const element = state.pinnedElements[index];

                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        highlightElement(element);
                    }
                });
            });

            pinnedContainer.querySelectorAll('.unpin').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    const element = state.pinnedElements[index];

                    if (element) {
                        element.classList.remove('dex-pinned-highlight');
                        state.pinnedElements.splice(index, 1);
                        updatePinnedElementsList(pinnedContainer);
                        showToast('Element unpinned', 'info');
                    }
                });
            });
        } catch (e) {
            logError('Error updating pinned elements list', e);
        }
    }

    /**
     * Export pinned elements as JSON
     */
    function exportPinnedElementsAsJSON() {
        try {
            if (state.pinnedElements.length === 0) {
                showToast('No pinned elements to export', 'warning');
                return;
            }

            const pinnedData = state.pinnedElements.map(element => {
                return {
                    tagName: element.tagName,
                    id: element.id,
                    className: element.className,
                    xpath: getXPath(element),
                    cssSelector: getCssSelector(element),
                    path: getElementPath(element)
                };
            });

            const jsonData = JSON.stringify(pinnedData, null, 2);

            // Create download link
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pinned_elements_${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast('Pinned elements exported as JSON', 'success');
        } catch (e) {
            logError('Error exporting pinned elements', e);
            showToast('Error exporting pinned elements', 'error');
        }
    }

    /**
     * Show grid/flex overlay
     * @param {Element} element - Element to show overlay for
     */
    function showGridFlexOverlay(element) {
        try {
            const gridFlexOverlay = document.getElementById('gridFlexOverlay');

            // Clear existing overlay
            gridFlexOverlay.innerHTML = '';

            // Check if element is grid or flex
            const computedStyle = window.getComputedStyle(element);
            const display = computedStyle.getPropertyValue('display');

            if (display.includes('grid')) {
                showGridOverlay(element, gridFlexOverlay);
            } else if (display.includes('flex')) {
                showFlexOverlay(element, gridFlexOverlay);
            } else {
                gridFlexOverlay.style.display = 'none';
            }
        } catch (e) {
            logError('Error showing grid/flex overlay', e);
        }
    }

    /**
     * Show grid overlay
     * @param {Element} element - Grid element
     * @param {Element} overlay - Overlay container
     */
    function showGridOverlay(element, overlay) {
        try {
            overlay.style.display = 'block';

            const rect = element.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(element);

            // Get grid template columns and rows
            const gridTemplateColumns = computedStyle.getPropertyValue('grid-template-columns');
            const gridTemplateRows = computedStyle.getPropertyValue('grid-template-rows');

            // Parse grid template columns
            const columns = gridTemplateColumns.split(' ').filter(col => col.trim() !== '');
            const rows = gridTemplateRows.split(' ').filter(row => row.trim() !== '');

            // Calculate column and row positions
            let columnPosition = 0;

            columns.forEach((column, index) => {
                const columnWidth = parseFloat(column) || 0;

                if (columnWidth > 0 && index < columns.length - 1) {
                    const line = document.createElement('div');
                    line.className = 'grid-line vertical';
                    line.style.left = `${columnPosition}%`;
                    line.style.height = '100%';
                    overlay.appendChild(line);
                }

                columnPosition += columnWidth;
            });

            // Calculate row positions
            let rowPosition = 0;

            rows.forEach((row, index) => {
                const rowHeight = parseFloat(row) || 0;

                if (rowHeight > 0 && index < rows.length - 1) {
                    const line = document.createElement('div');
                    line.className = 'grid-line horizontal';
                    line.style.top = `${rowPosition}%`;
                    line.style.width = '100%';
                    overlay.appendChild(line);
                }

                rowPosition += rowHeight;
            });

            // Position overlay to match element
            overlay.style.left = `${rect.left + window.scrollX}px`;
            overlay.style.top = `${rect.top + window.scrollY}px`;
            overlay.style.width = `${rect.width}px`;
            overlay.style.height = `${rect.height}px`;
        } catch (e) {
            logError('Error showing grid overlay', e);
        }
    }

    /**
     * Show flex overlay
     * @param {Element} element - Flex element
     * @param {Element} overlay - Overlay container
     */
    function showFlexOverlay(element, overlay) {
        try {
            overlay.style.display = 'block';

            const rect = element.getBoundingClientRect();
            const children = Array.from(element.children);

            // Show flex direction
            const computedStyle = window.getComputedStyle(element);
            const flexDirection = computedStyle.getPropertyValue('flex-direction');

            // Draw a line to show flex direction
            const directionLine = document.createElement('div');
            directionLine.className = 'flex-line';

            if (flexDirection.includes('column')) {
                directionLine.className += ' vertical';
                directionLine.style.left = '50%';
                directionLine.style.width = '2px';
                directionLine.style.height = '100%';
            } else {
                directionLine.className += ' horizontal';
                directionLine.style.top = '50%';
                directionLine.style.height = '2px';
                directionLine.style.width = '100%';
            }

            overlay.appendChild(directionLine);

            // Position overlay to match element
            overlay.style.left = `${rect.left + window.scrollX}px`;
            overlay.style.top = `${rect.top + window.scrollY}px`;
            overlay.style.width = `${rect.width}px`;
            overlay.style.height = `${rect.height}px`;
        } catch (e) {
            logError('Error showing flex overlay', e);
        }
    }

    /**
     * Save to history for undo/redo
     * @param {Element} element - Element to save
     */
    function saveToHistory(element) {
        try {
            // Create a snapshot of the current state
            const snapshot = {
                element: element,
                outerHTML: element.outerHTML,
                innerHTML: element.innerHTML,
                attributes: {}
            };

            // Save attributes
            for (let i = 0; i < element.attributes.length; i++) {
                const attr = element.attributes[i];
                snapshot.attributes[attr.name] = attr.value;
            }

            // Add to history
            state.domHistory.push(snapshot);

            // Limit history size
            if (state.domHistory.length > 50) {
                state.domHistory.shift();
            }

            // Update history index
            state.domHistoryIndex = state.domHistory.length - 1;

            // Update undo/redo buttons
            updateUndoRedoButtons();
        } catch (e) {
            logError('Error saving to history', e);
        }
    }

    /**
     * Update undo/redo buttons
     */
    function updateUndoRedoButtons() {
        try {
            const undoBtn = document.getElementById('undoBtn');
            const redoBtn = document.getElementById('redoBtn');

            if (undoBtn) {
                undoBtn.disabled = state.domHistoryIndex <= 0;
            }

            if (redoBtn) {
                redoBtn.disabled = state.domHistoryIndex >= state.domHistory.length - 1;
            }
        } catch (e) {
            logError('Error updating undo/redo buttons', e);
        }
    }

    /**
     * Undo last action
     */
    function undo() {
        try {
            if (state.domHistoryIndex <= 0) {
                showToast('Nothing to undo', 'info');
                return;
            }

            state.domHistoryIndex--;
            const snapshot = state.domHistory[state.domHistoryIndex];

            if (snapshot.element && snapshot.element.parentNode) {
                snapshot.element.outerHTML = snapshot.outerHTML;
                showToast('Action undone', 'success');

                // Update buttons
                updateUndoRedoButtons();
            }
        } catch (e) {
            logError('Error undoing action', e);
            showToast('Error undoing action', 'error');
        }
    }

    /**
     * Redo last undone action
     */
    function redo() {
        try {
            if (state.domHistoryIndex >= state.domHistory.length - 1) {
                showToast('Nothing to redo', 'info');
                return;
            }

            state.domHistoryIndex++;
            const snapshot = state.domHistory[state.domHistoryIndex];

            if (snapshot.element && snapshot.element.parentNode) {
                snapshot.element.outerHTML = snapshot.outerHTML;
                showToast('Action redone', 'success');

                // Update buttons
                updateUndoRedoButtons();
            }
        } catch (e) {
            logError('Error redoing action', e);
            showToast('Error redoing action', 'error');
        }
    }

    // ======== THEME FUNCTIONS ========
    /**
     * Toggle theme
     */
    function toggleTheme() {
        try {
            const themes = ['dark', 'light', 'blue', 'green', 'purple', 'highcontrast'];
            const currentIndex = themes.indexOf(state.theme);
            const nextIndex = (currentIndex + 1) % themes.length;
            const nextTheme = themes[nextIndex];

            applyTheme(nextTheme);

            // Update theme toggle text
            const themeToggle = document.querySelector('.dex-theme-toggle');
            let themeIcon = '🌙';
            if (nextTheme === 'light') themeIcon = '☀️';
            else if (nextTheme === 'blue') themeIcon = '💧';
            else if (nextTheme === 'green') themeIcon = '🌿';
            else if (nextTheme === 'purple') themeIcon = '🔮';
            else if (nextTheme === 'highcontrast') themeIcon = '⚫';

            themeToggle.innerHTML = `<span>${themeIcon}</span> <span>${nextTheme.charAt(0).toUpperCase() + nextTheme.slice(1)}</span>`;
        } catch (e) {
            logError('Error toggling theme', e);
        }
    }

   /**
 * Initialize the script
 */
function init() {
    try {
        // Ensure script runs only in top frame
        if (window.self !== window.top) return;

        // Load saved UI state
        loadUIState();

        // Apply theme
        applyTheme(state.theme);

        // Inject styles
        injectStyles();

        // Create UI elements
        const elements = createUI();

        if (!elements) {
            showToast('Error initializing DOM Explorer', 'error');
            return;
        }

        // Setup event listeners
        setupEventListeners(elements);

        // --- FIX: Add a small delay before building the initial DOM tree ---
        // This allows dynamically loaded content on the page to appear first.
        setTimeout(() => {
            buildTree(document.documentElement, elements.treeContainer);
        }, 500); // 500ms delay, adjust if needed

        // Show toolbar after a short delay
        setTimeout(() => {
            const domToolsBar = document.getElementById('domToolsBar');
            domToolsBar.classList.add('visible');
        }, 1000);

        // Show welcome message for first-time users
        if (!GM_getValue('domExplorerWelcomeShown', false)) {
            setTimeout(() => {
                showToast('Welcome to DOM Explorer Pro! Press Ctrl+Shift+E to toggle the sidebar.', 'success');
                GM_setValue('domExplorerWelcomeShown', true);
            }, 1500);
        }


            // Add undo/redo buttons to edit tab
            const editProps = document.getElementById('dexEditProps');
            const undoRedoControls = document.createElement('div');
            undoRedoControls.className = 'undo-redo-controls';
            undoRedoControls.innerHTML = `
                <button class="undo-redo-btn" id="undoBtn" disabled>
                    <span>↶</span> <span>Undo</span>
                </button>
                <button class="undo-redo-btn" id="redoBtn" disabled>
                    <span>↷</span> <span>Redo</span>
                </button>
            `;

            editProps.insertBefore(undoRedoControls, editProps.firstChild);

            // Add event listeners for undo/redo
            document.getElementById('undoBtn').addEventListener('click', undo);
            document.getElementById('redoBtn').addEventListener('click', redo);

            // Add pinned elements manager button
            const pinnedBtn = document.createElement('button');
            pinnedBtn.className = 'dex-btn';
            pinnedBtn.textContent = '📌 Pinned Elements';
            pinnedBtn.style.marginTop = '10px';
            pinnedBtn.setAttribute('aria-label', 'Manage pinned elements');

            pinnedBtn.addEventListener('click', showPinnedElementsManager);
            editProps.appendChild(pinnedBtn);

            // Add export options panel
            const exportOptionsPanel = document.createElement('div');
            exportOptionsPanel.className = 'export-options';
            exportOptionsPanel.innerHTML = `
                <div class="dex-prop-label">Export Options</div>
                <div class="export-format">
                    <div class="export-format-option active" data-format="json">JSON</div>
                    <div class="export-format-option" data-format="html">HTML</div>
                    <div class="export-format-option" data-format="pdf">PDF</div>
                </div>
                <button class="dex-btn" id="exportBtn" style="margin-top: 10px; width: 100%;">Export Element</button>
            `;

            editProps.appendChild(exportOptionsPanel);

            // Add event listeners for export options
            const exportBtn = document.getElementById('exportBtn');
            const formatOptions = exportOptionsPanel.querySelectorAll('.export-format-option');
            let selectedFormat = 'json';

            formatOptions.forEach(option => {
                option.addEventListener('click', () => {
                    formatOptions.forEach(opt => opt.classList.remove('active'));
                    option.classList.add('active');
                    selectedFormat = option.dataset.format;
                });
            });

            exportBtn.addEventListener('click', () => {
                if (!state.selectedElement) {
                    showToast('No element selected', 'error');
                    return;
                }

                if (selectedFormat === 'json') {
                    exportElementData();
                } else if (selectedFormat === 'html') {
                    const html = state.selectedElement.outerHTML;
                    const blob = new Blob([html], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `element_${state.selectedElement.tagName.toLowerCase()}_${Date.now()}.html`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    showToast('Element exported as HTML', 'success');
                } else if (selectedFormat === 'pdf') {
                    showToast('PDF export requires additional libraries. Please use JSON or HTML export.', 'info');
                }
            });

            // Add batch operations panel
            const batchOpsPanel = document.createElement('div');
            batchOpsPanel.className = 'batch-operations';
            batchOpsPanel.innerHTML = `
                <div class="dex-prop-label">Batch Operations</div>
                <div class="batch-selection">
                    <div class="batch-selection-title">Selected Elements</div>
                    <div class="batch-selection-count">0 elements selected</div>
                </div>
                <div class="batch-actions">
                    <button class="batch-action-btn" data-action="hide">Hide</button>
                    <button class="batch-action-btn" data-action="show">Show</button>
                    <button class="batch-action-btn" data-action="delete">Delete</button>
                    <button class="batch-action-btn" data-action="highlight">Highlight</button>
                </div>
            `;

            editProps.appendChild(batchOpsPanel);

            // Add event listeners for batch operations
            const batchActionBtns = batchOpsPanel.querySelectorAll('.batch-action-btn');
            const selectionCount = batchOpsPanel.querySelector('.batch-selection-count');
            let selectedElements = [];

            // Function to update selection count
            function updateSelectionCount() {
                selectionCount.textContent = `${selectedElements.length} element${selectedElements.length !== 1 ? 's' : ''} selected`;
            }

            // Add event listeners for batch actions
            batchActionBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.dataset.action;

                    if (selectedElements.length === 0) {
                        showToast('No elements selected', 'warning');
                        return;
                    }

                    switch (action) {
                        case 'hide':
                            selectedElements.forEach(el => {
                                el.style.visibility = 'hidden';
                            });
                            showToast(`Hidden ${selectedElements.length} elements`, 'success');
                            break;
                        case 'show':
                            selectedElements.forEach(el => {
                                el.style.visibility = '';
                            });
                            showToast(`Shown ${selectedElements.length} elements`, 'success');
                            break;
                        case 'delete':
                            selectedElements.forEach(el => {
                                if (el.parentNode) {
                                    el.parentNode.removeChild(el);
                                }
                            });
                            showToast(`Deleted ${selectedElements.length} elements`, 'success');
                            refreshDOM();
                            break;
                        case 'highlight':
                            selectedElements.forEach(el => {
                                el.classList.add('dex-highlight');
                            });
                            showToast(`Highlighted ${selectedElements.length} elements`, 'success');
                            break;
                    }

                    // Clear selection
                    selectedElements = [];
                    updateSelectionCount();
                });
            });

            // Add event listener for Ctrl+Click to select multiple elements
            document.addEventListener('click', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    const element = e.target;

                    if (element.tagName) {
                        if (selectedElements.includes(element)) {
                            // Remove from selection
                            selectedElements = selectedElements.filter(el => el !== element);
                            element.classList.remove('dex-highlight');
                        } else {
                            // Add to selection
                            selectedElements.push(element);
                            element.classList.add('dex-highlight');
                        }

                        updateSelectionCount();
                    }
                }
            });

            // Add compact mode toggle
            const compactModeToggle = document.createElement('button');
            compactModeToggle.className = 'dex-btn';
            compactModeToggle.textContent = '📱 Toggle Compact Mode';
            compactModeToggle.style.marginTop = '10px';
            compactModeToggle.setAttribute('aria-label', 'Toggle compact mode');

            compactModeToggle.addEventListener('click', () => {
                state.uiState.compactMode = !state.uiState.compactMode;

                if (state.uiState.compactMode) {
                    document.body.classList.add('compact-mode');
                    showToast('Compact mode enabled', 'info');
                } else {
                    document.body.classList.remove('compact-mode');
                    showToast('Compact mode disabled', 'info');
                }

                saveUIState();
            });

            editProps.appendChild(compactModeToggle);

            // Add toolbar position selector
            const toolbarPositionPanel = document.createElement('div');
            toolbarPositionPanel.className = 'dex-prop-group';
            toolbarPositionPanel.innerHTML = `
                <div class="dex-prop-label">Toolbar Position</div>
                <select class="dex-prop-select" id="toolbarPositionSelect">
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                </select>
            `;

            editProps.appendChild(toolbarPositionPanel);

            // Add event listener for toolbar position
            const toolbarPositionSelect = document.getElementById('toolbarPositionSelect');
            toolbarPositionSelect.value = state.uiState.toolbarPosition;

            toolbarPositionSelect.addEventListener('change', () => {
                state.uiState.toolbarPosition = toolbarPositionSelect.value;
                const domToolsBar = document.getElementById('domToolsBar');

                // Reset position classes
                domToolsBar.classList.remove('position-top', 'position-bottom', 'position-left', 'position-right');

                // Apply new position
                domToolsBar.classList.add(`position-${state.uiState.toolbarPosition}`);

                // Update styles based on position
                switch (state.uiState.toolbarPosition) {
                    case 'top':
                        domToolsBar.style.top = '10px';
                        domToolsBar.style.bottom = '';
                        domToolsBar.style.left = '50%';
                        domToolsBar.style.right = '';
                        domToolsBar.style.transform = 'translateX(-50%)';
                        break;
                    case 'bottom':
                        domToolsBar.style.top = '';
                        domToolsBar.style.bottom = '10px';
                        domToolsBar.style.left = '50%';
                        domToolsBar.style.right = '';
                        domToolsBar.style.transform = 'translateX(-50%)';
                        break;
                    case 'left':
                        domToolsBar.style.top = '50%';
                        domToolsBar.style.bottom = '';
                        domToolsBar.style.left = '10px';
                        domToolsBar.style.right = '';
                        domToolsBar.style.transform = 'translateY(-50%)';
                        domToolsBar.style.flexDirection = 'column';
                        break;
                    case 'right':
                        domToolsBar.style.top = '50%';
                        domToolsBar.style.bottom = '';
                        domToolsBar.style.left = '';
                        domToolsBar.style.right = '10px';
                        domToolsBar.style.transform = 'translateY(-50%)';
                        domToolsBar.style.flexDirection = 'column';
                        break;
                }

                saveUIState();
                showToast(`Toolbar position set to ${state.uiState.toolbarPosition}`, 'success');
            });

            // Add cleanup on page unload
            window.addEventListener('beforeunload', () => {
                try {
                    // Remove all highlights
                    document.querySelectorAll('.dex-highlight, .dex-pinned-highlight').forEach(el => {
                        el.classList.remove('dex-highlight', 'dex-pinned-highlight');
                    });

                    // Remove custom CSS
                    const customCSS = document.getElementById('domExplorerCustomCSS');
                    if (customCSS) {
                        customCSS.remove();
                    }

                    // Remove grid/flex overlay
                    const gridFlexOverlay = document.getElementById('gridFlexOverlay');
                    if (gridFlexOverlay) {
                        gridFlexOverlay.style.display = 'none';
                    }
                } catch (e) {
                    logError('Error during cleanup', e);
                }
            });

            // Add keyboard shortcut info
            const shortcutsInfo = document.createElement('div');
            shortcutsInfo.className = 'dex-info-panel';
            shortcutsInfo.style.marginTop = '10px';
            shortcutsInfo.innerHTML = `
                <div class="dex-info-label">Keyboard Shortcuts</div>
                <div class="dex-info-row">
                    <span class="dex-info-label">Toggle Sidebar:</span>
                    <span class="dex-info-value">Ctrl+Shift+E</span>
                </div>
                <div class="dex-info-row">
                    <span class="dex-info-label">Toggle Toolbar:</span>
                    <span class="dex-info-value">Ctrl+Shift+T</span>
                </div>
                <div class="dex-info-row">
                    <span class="dex-info-label">Focus Search:</span>
                    <span class="dex-info-value">Ctrl+Shift+F</span>
                </div>
                <div class="dex-info-row">
                    <span class="dex-info-label">Close Modals:</span>
                    <span class="dex-info-value">Esc</span>
                </div>
                <div class="dex-info-row">
                    <span class="dex-info-label">Navigate Tree:</span>
                    <span class="dex-info-value">Arrow Keys</span>
                </div>
                <div class="dex-info-row">
                    <span class="dex-info-label">Expand/Collapse:</span>
                    <span class="dex-info-value">Enter</span>
                </div>
            `;

            editProps.appendChild(shortcutsInfo);

            // Add version info
            const versionInfo = document.createElement('div');
            versionInfo.className = 'dex-info-panel';
            versionInfo.style.marginTop = '10px';
            versionInfo.innerHTML = `
                <div class="dex-info-row">
                    <span class="dex-info-label">Version:</span>
                    <span class="dex-info-value">${VERSION}</span>
                </div>
            `;

            editProps.appendChild(versionInfo);

            // Add donation link (optional)
            const donationInfo = document.createElement('div');
            donationInfo.className = 'dex-info-panel';
            donationInfo.style.marginTop = '10px';
            donationInfo.style.textAlign = 'center';
            donationInfo.innerHTML = `
                <div style="font-size: 11px; color: var(--text-secondary);">
                    Enjoying DOM Explorer Pro?
                    <a href="#" style="color: var(--primary);">Consider supporting development</a>
                </div>
            `;

            editProps.appendChild(donationInfo);

            // Log successful initialization
            console.log(`[DOM Explorer Pro v${VERSION}] Initialized successfully`);
        } catch (e) {
            logError('Error initializing script', e);
            showToast('Error initializing DOM Explorer', 'error');
        }
    }

    // Initialize the script when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();