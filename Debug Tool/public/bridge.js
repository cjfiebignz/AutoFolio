// AutoFolio Debug Bridge v1.4
// This script is meant to be run in the AutoFolio application's context.
(function() {
    // 0. Prevent duplicate bridge initialization
    if (window.__AutoFolioBridgeActive) {
        console.log("%c [AutoFolio Bridge] Already active. Skipping re-init. ", "background: #f59e0b; color: #000; font-weight: bold;");
        return;
    }
    window.__AutoFolioBridgeActive = true;

    const DEBUG_TOOL_ORIGIN = 'http://localhost:3005';
    const LOG_URL = `${DEBUG_TOOL_ORIGIN}/api/log`;
    
    console.log("%c [AutoFolio Bridge] Initializing v1.4... ", "background: #3b82f6; color: #fff; font-weight: bold;");

    const log = (type, data) => {
        const rawFetch = window.__originalFetch || window.fetch;
        rawFetch(LOG_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, data })
        }).catch(() => {});
    };

    if (!window.__originalFetch) {
        window.__originalFetch = window.fetch;
    }

    // Noise filter patterns
    const NOISE_PATTERNS = [
        /\[Fast Refresh\]/,
        /building\.\.\./,
        /rebuilding\.\.\./,
        /Download the React DevTools/,
        /Waiting for valid credentials/,
        /\[HMR\]/
    ];

    const isNoise = (args) => {
        if (!args || args.length === 0) return false;
        const str = String(args[0]);
        return NOISE_PATTERNS.some(pattern => pattern.test(str));
    };

    // Robust Fetch Interception
    window.fetch = async (...args) => {
        const input = args[0];
        const options = args[1] || {};
        
        let url = typeof input === 'string' ? input : (input instanceof Request ? input.url : String(input));

        if (url.includes(DEBUG_TOOL_ORIGIN)) {
            return window.__originalFetch(...args);
        }

        const startTime = Date.now();
        const method = options.method || (input instanceof Request ? input.method : 'GET');

        try {
            const response = await window.__originalFetch(...args);
            const duration = Date.now() - startTime;
            
            log('request', { 
                url, 
                method, 
                status: response.status, 
                duration: `${duration}ms`
            });
            
            return response;
        } catch (err) {
            log('request_error', { url, method, error: err.message });
            throw err;
        }
    };

    // Console Capture
    const captureConsole = (method) => {
        const original = console[method];
        console[method] = (...args) => {
            original.apply(console, args);
            
            // Apply noise filter
            if (isNoise(args)) return;

            log(method, args.map(arg => {
                try {
                    return (typeof arg === 'object' && arg !== null) ? JSON.parse(JSON.stringify(arg)) : String(arg);
                } catch (e) {
                    return `[Unserializable ${typeof arg}]`;
                }
            }));
        };
    };

    ['log', 'warn', 'error'].forEach(captureConsole);

    // Global Error Capture
    window.addEventListener('error', (event) => {
        log('exception', { 
            message: event.message, 
            source: event.filename, 
            lineno: event.lineno, 
            colno: event.colno 
        });
    });

    window.addEventListener('unhandledrejection', (event) => {
        log('promise_rejection', { reason: String(event.reason?.message || event.reason) });
    });

    // Route Change Capture
    let lastPath = location.pathname;
    const checkRoute = () => {
        if (location.pathname !== lastPath) {
            const oldPath = lastPath;
            lastPath = location.pathname;
            log('route', { path: lastPath, from: oldPath, title: document.title });
        }
    };
    
    const _pushState = history.pushState;
    window.history.pushState = function(...args) {
        _pushState.apply(history, args);
        checkRoute();
    };

    const _replaceState = history.replaceState;
    window.history.replaceState = function(...args) {
        _replaceState.apply(history, args);
        checkRoute();
    };
    
    setInterval(checkRoute, 1000);

    log('bridge_init', { 
        url: location.href, 
        title: document.title,
        userAgent: navigator.userAgent,
        version: '1.4'
    });

    console.log("%c [AutoFolio Bridge] ACTIVE v1.4 ", "background: #22c55e; color: #000; font-weight: bold;");
})();
