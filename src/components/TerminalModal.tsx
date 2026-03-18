import { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { Unicode11Addon } from '@xterm/addon-unicode11';
import { WebglAddon } from '@xterm/addon-webgl';
import type { SSHHost } from '@/types';
import { terminalApi } from '@/services/api';
import '@xterm/xterm/css/xterm.css';

interface TerminalModalProps {
  host: SSHHost;
  onClose: () => void;
}

// Idle timeout options (minutes)
const IDLE_TIMEOUT_OPTIONS = [
  { value: 10, label: '10m' },
  { value: 30, label: '30m' },
  { value: 60, label: '1h' },
  { value: 180, label: '3h' },
];

const TerminalModal = ({ host, onClose }: TerminalModalProps) => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [idleTimeout, setIdleTimeout] = useState(10);
  const [showTimeoutSelector, setShowTimeoutSelector] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef<boolean>(true);

  // Initialize WebSocket and xterm
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current) return;

    // Create xterm instance with optimized settings
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 13,
      fontWeight: 'normal',
      fontWeightBold: 'bold',
      // Optimized font stack for better CJK support
      fontFamily: '"SF Mono", "Monaco", "Menlo", "Consolas", "Liberation Mono", "Courier New", monospace',
      theme: {
        // macOS Terminal style
        background: '#1e1e1e',
        foreground: '#ffffff',
        cursor: '#28c840',
        cursorAccent: '#1e1e1e',
        selectionBackground: 'rgba(255, 255, 255, 0.3)',
        selectionForeground: '#000000',
        black: '#000000',
        red: '#ff3b30',
        green: '#28c840',
        yellow: '#ffcc00',
        blue: '#007aff',
        magenta: '#af52de',
        cyan: '#32ade6',
        white: '#ffffff',
        brightBlack: '#666666',
        brightRed: '#ff6961',
        brightGreen: '#5de67a',
        brightYellow: '#ffd60a',
        brightBlue: '#4da3ff',
        brightMagenta: '#c779e8',
        brightCyan: '#5ac8f5',
        brightWhite: '#ffffff',
      },
      scrollback: 5000,
      allowProposedApi: true,
      allowTransparency: true,
      convertEol: true,
      letterSpacing: 0,
      lineHeight: 1.15,
      drawBoldTextInBrightColors: true,
      minimumContrastRatio: 1,
    });
    
    // Load Fit addon
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    // Load Unicode11 addon for proper CJK support
    const unicode11Addon = new Unicode11Addon();
    term.loadAddon(unicode11Addon);
    term.unicode.activeVersion = '11';
    
    term.open(terminalRef.current);
    
    // Try to load WebGL addon for better performance
    try {
      const webglAddon = new WebglAddon();
      webglAddon.onContextLoss(() => {
        webglAddon.dispose();
      });
      term.loadAddon(webglAddon);
    } catch (e) {
      // WebGL not available, use canvas
    }
    
    const fitTerminal = () => {
      const element = terminalRef.current;
      if (!element) return;
      
      const rect = element.getBoundingClientRect();
      if (rect.width < 100 || rect.height < 50) {
        return;
      }
      
      try {
        fitAddon.fit();
        
        // Reserve bottom space to prevent text from being cut off
        const currentRows = term.rows;
        const currentCols = term.cols;
        if (currentRows > 1) {
          term.resize(currentCols, currentRows - 1);
        }
      } catch (e) {
        // Ignore fit errors
      }
    };
    
    // Initial fit
    setTimeout(() => fitTerminal(), 50);
    
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    term.focus();

    // Heartbeat function - keep connection alive
    const startHeartbeat = () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      heartbeatIntervalRef.current = setInterval(() => {
        const currentWs = wsRef.current;
        if (currentWs && currentWs.readyState === WebSocket.OPEN) {
          // Send ping to keep connection alive
          try {
            currentWs.send(JSON.stringify({ type: 'ping' }));
          } catch (e) {
            // Ignore send errors
          }
        }
      }, 30000); // 30 seconds
    };

    // Stop heartbeat
    const stopHeartbeat = () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };

    // Establish WebSocket connection
    const wsUrl = terminalApi.getWebSocketUrl(host.id);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) {
        ws.close();
        return;
      }
      
      setConnecting(false);
      setConnected(true);
      setError('');
      
      // Start heartbeat
      startHeartbeat();
      
      const currentRows = term.rows;
      const currentCols = term.cols;
      try {
        ws.send(JSON.stringify({ type: 'resize', cols: currentCols, rows: currentRows }));
      } catch (e) {
        // Ignore send errors
      }
      
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN && mountedRef.current) {
          try {
            ws.send(JSON.stringify({ type: 'data', data: '\r' }));
          } catch (e) {
            // Ignore send errors
          }
        }
        term.focus();
      }, 300);
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'pong') {
          // Heartbeat response, ignore
          return;
        } else if (message.type === 'connected') {
          term.writeln(`\r\n\x1b[32m✓ ${message.message}\x1b[0m\r\n`);
          term.focus();
        } else if (message.type === 'data') {
          term.write(message.data);
        } else if (message.error) {
          term.writeln(`\r\n\x1b[31m✗ Error: ${message.error}\x1b[0m\r\n`);
        }
      } catch (e) {
        term.write(event.data);
      }
    };

    ws.onerror = () => {
      if (!mountedRef.current) return;
      // Don't set error here, let onclose handle it
    };

    ws.onclose = (event) => {
      stopHeartbeat();
      
      if (!mountedRef.current) return;
      
      setConnected(false);
      
      if (event.code !== 1000) {
        setError('Connection closed unexpectedly');
        term.writeln(`\r\n\x1b[33m[Connection closed]\x1b[0m\r\n`);
      } else {
        term.writeln(`\r\n\x1b[33m[Connection closed]\x1b[0m\r\n`);
      }
    };

    term.onData((data) => {
      const currentWs = wsRef.current;
      if (currentWs && currentWs.readyState === WebSocket.OPEN) {
        try {
          currentWs.send(JSON.stringify({ type: 'data', data }));
        } catch (e) {
          // Ignore send errors
        }
      }
    });

    term.onResize(({ cols, rows }) => {
      const currentWs = wsRef.current;
      if (currentWs && currentWs.readyState === WebSocket.OPEN) {
        try {
          currentWs.send(JSON.stringify({ type: 'resize', cols, rows }));
        } catch (e) {
          // Ignore send errors
        }
      }
    });

    term.onSelectionChange(() => {
      const selection = term.getSelection();
      if (selection) {
        // Use modern Clipboard API or fallback method
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(selection).catch((err) => {
            console.warn('Clipboard API failed, using fallback:', err);
            // Fallback method: create temporary textarea
            const textarea = document.createElement('textarea');
            textarea.value = selection;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            try {
              document.execCommand('copy');
            } catch (e) {
              console.warn('Fallback copy failed:', e);
            }
            document.body.removeChild(textarea);
          });
        } else {
          // Fallback method: create temporary textarea
          const textarea = document.createElement('textarea');
          textarea.value = selection;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          try {
            document.execCommand('copy');
          } catch (e) {
            console.warn('Copy failed:', e);
          }
          document.body.removeChild(textarea);
        }
      }
    });

    // Debounced resize handler
    const debouncedResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      
      resizeTimeoutRef.current = setTimeout(() => {
        const element = terminalRef.current;
        if (!element) {
          try {
            fitAddon.fit();
          } catch (e) {}
          return;
        }
        
        const rect = element.getBoundingClientRect();
        if (rect.width < 100 || rect.height < 50) {
          return;
        }
        
        try {
          fitAddon.fit();
          
          // Reserve bottom space
          const currentRows = term.rows;
          const currentCols = term.cols;
          if (currentRows > 1) {
            term.resize(currentCols, currentRows - 1);
          }
        } catch (e) {}
      }, 100);
    };
    
    // Use ResizeObserver for precise resize detection
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          debouncedResize();
        }
      }
    });
    
    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
      resizeObserverRef.current = resizeObserver;
    }
    
    window.addEventListener('resize', debouncedResize);

    // Right-click context menu (copy/paste)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const selection = term.getSelection();
      if (selection) {
        navigator.clipboard.writeText(selection);
      } else {
        navigator.clipboard.readText().then((text) => {
          const currentWs = wsRef.current;
          if (text && currentWs && currentWs.readyState === WebSocket.OPEN) {
            try {
              currentWs.send(JSON.stringify({ type: 'data', data: text }));
            } catch (e) {
              // Ignore send errors
            }
          }
        }).catch(() => {});
      }
    };
    
    const terminalElement = terminalRef.current;
    terminalElement.addEventListener('contextmenu', handleContextMenu);

    // Cleanup function
    return () => {
      // Stop heartbeat
      stopHeartbeat();
      
      window.removeEventListener('resize', debouncedResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
        resizeTimeoutRef.current = null;
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      
      terminalElement.removeEventListener('contextmenu', handleContextMenu);
      
      // Close WebSocket
      const currentWs = wsRef.current;
      if (currentWs) {
        try {
          // Clear event handlers first
          currentWs.onopen = null;
          currentWs.onmessage = null;
          currentWs.onerror = null;
          currentWs.onclose = null;
          
          if (currentWs.readyState === WebSocket.OPEN || currentWs.readyState === WebSocket.CONNECTING) {
            currentWs.close(1000, 'Component unmounted');
          }
        } catch (e) {
          // Ignore close errors
        }
        wsRef.current = null;
      }
      
      // Dispose terminal
      try {
        term.dispose();
      } catch (e) {
        // Ignore dispose errors
      }
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, [host.id]);

  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      const idleTime = Date.now() - lastActivityRef.current;
      const timeoutMs = idleTimeout * 60 * 1000;
      if (idleTime >= timeoutMs) {
        if (xtermRef.current) {
          xtermRef.current.writeln(`\r\n\x1b[33m[Connection closed due to ${idleTimeout} min idle]\x1b[0m\r\n`);
        }
        if (wsRef.current) {
          wsRef.current.close();
        }
        setConnected(false);
        setError(`Connection closed due to ${idleTimeout} min idle`);
      }
    }, idleTimeout * 60 * 1000);
  }, [idleTimeout]);

  useEffect(() => {
    const handleActivity = () => {
      if (connected) {
        resetIdleTimer();
      }
    };

    window.addEventListener('keydown', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    
    return () => {
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [connected, resetIdleTimer]);

  useEffect(() => {
    if (connected) {
      resetIdleTimer();
    }
  }, [connected, resetIdleTimer]);

  const handleReconnect = () => {
    // Close current WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    // Reset state
    setConnecting(true);
    setConnected(false);
    setError('');
    // Force re-initialization by triggering a re-render
    window.location.reload();
  };

  const fitTerminalWithPadding = useCallback(() => {
    if (!fitAddonRef.current || !xtermRef.current || !terminalRef.current) return;
    
    try {
      fitAddonRef.current.fit();
      xtermRef.current.focus();
    } catch (e) {
      // Ignore errors
    }
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setTimeout(() => {
      fitTerminalWithPadding();
    }, 100);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (!isMinimized) {
      document.body.style.overflow = '';
    } else {
      setTimeout(() => {
        fitTerminalWithPadding();
      }, 100);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && isMinimized) {
        e.preventDefault();
        toggleMinimize();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMinimized]);

  const handleTerminalClick = () => {
    if (xtermRef.current) {
      xtermRef.current.focus();
    }
  };

  return (
    <>
      {/* Minimized floating button */}
      {isMinimized && (
        <div
          onClick={toggleMinimize}
          className="fixed bottom-6 right-6 z-[60] cursor-pointer group"
        >
          <div className="bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3 hover:bg-[#2a2a2a]/95 transition-all duration-300 hover:scale-105"
            style={{
              boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 10px 40px -10px rgba(0,0,0,0.5)'
            }}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <i className="fa-solid fa-server text-white text-sm" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-200">{host.username}@{host.name}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {connected ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[10px] text-gray-400">Connected · Click to restore</span>
                  </>
                ) : (
                  <span className="text-[10px] text-red-400">Disconnected</span>
                )}
              </div>
            </div>
            <div className="ml-2 text-[10px] text-gray-500 bg-white/5 px-2 py-1 rounded">
              Tab
            </div>
          </div>
        </div>
      )}

      {/* Terminal main window */}
      <div className={`fixed inset-0 z-50 transition-all duration-300 ${
        isMinimized
          ? 'pointer-events-none opacity-0 scale-95'
          : 'bg-black/40 backdrop-blur-md flex items-center justify-center animate-fade-in opacity-100'
      }`}>
        <div
          ref={modalRef}
          className={`bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-xl flex flex-col overflow-hidden animate-scale-in transition-all duration-300 ${
            isFullscreen
              ? 'fixed inset-4 w-auto h-auto max-w-none rounded-2xl'
              : 'w-full max-w-4xl h-[600px] rounded-xl'
          }`}
          style={{
            boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 25px 50px -12px rgba(0,0,0,0.5), 0 0 100px -20px rgba(0,0,0,0.3)'
          }}
        >
          {/* Terminal Header - macOS style */}
          <div className="bg-gradient-to-b from-[#3a3a3a] to-[#2a2a2a] px-4 py-2 border-b border-white/5 flex items-center justify-between select-none">
            <div className="flex items-center gap-3">
              {/* macOS window buttons */}
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="w-3 h-3 rounded-full bg-[#ff5f57] hover:bg-[#ff5f57]/80 transition-colors group flex items-center justify-center"
                  title="Close"
                >
                  <i className="fa-solid fa-xmark text-[10px] text-[#990000] opacity-0 group-hover:opacity-100" />
                </button>
                <button
                  onClick={toggleMinimize}
                  className="w-3 h-3 rounded-full bg-[#febc2e] hover:bg-[#febc2e]/80 transition-colors group flex items-center justify-center"
                  title="Minimize (Tab to restore)"
                >
                  <i className="fa-solid fa-minus text-[10px] text-[#985700] opacity-0 group-hover:opacity-100" />
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="w-3 h-3 rounded-full bg-[#28c840] hover:bg-[#28c840]/80 transition-colors group flex items-center justify-center"
                  title="Fullscreen"
                >
                  <i className="fa-solid fa-expand text-[10px] text-[#006500] opacity-0 group-hover:opacity-100" />
                </button>
              </div>
              {/* Connection info */}
              <div className="ml-3 flex items-center gap-2 text-sm">
                <i className="fa-solid fa-server text-blue-400 text-[14px]" />
                <span className="text-gray-300 text-xs">{host.username}@{host.name}</span>
                {connected ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Connected
                  </span>
                ) : connecting ? (
                  <span className="text-[10px] text-yellow-400">
                    Connecting...
                  </span>
                ) : (
                  <span className="text-[10px] text-red-400">
                    Disconnected
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Idle timeout selector */}
              <div className={`relative ${showTimeoutSelector ? 'z-40' : ''}`}>
                <button
                  onClick={() => setShowTimeoutSelector(!showTimeoutSelector)}
                  className="flex items-center gap-1.5 px-2.5 py-1 hover:bg-white/10 rounded-md text-gray-400 hover:text-gray-200 transition-colors text-xs"
                  title="Idle timeout"
                >
                  <i className="fa-solid fa-clock text-[14px]" />
                  <span>{IDLE_TIMEOUT_OPTIONS.find(o => o.value === idleTimeout)?.label}</span>
                </button>
                {showTimeoutSelector && (
                  <>
                    {/* Backdrop to close dropdown when clicking outside */}
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShowTimeoutSelector(false)}
                    />
                    <div className="absolute top-full right-0 mt-2 bg-[#2a2a2a] border border-white/10 rounded-xl shadow-2xl py-1 z-[60] backdrop-blur-xl">
                      <div className="px-3 py-1 text-[10px] text-gray-500 border-b border-white/5">
                        Timeout
                      </div>
                      {IDLE_TIMEOUT_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setIdleTimeout(option.value);
                            setShowTimeoutSelector(false);
                            resetIdleTimer();
                          }}
                          className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                            idleTimeout === option.value
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'text-gray-300 hover:bg-white/5'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              {error && (
                <button
                  onClick={handleReconnect}
                  className="px-3 py-1 bg-blue-500 hover:bg-blue-400 text-white rounded-md text-xs transition-colors"
                >
                  Reconnect
                </button>
              )}
            </div>
          </div>
          
          {/* Terminal Body */}
          <div className="flex-1 bg-[#1e1e1e] overflow-hidden relative" onClick={handleTerminalClick}>
            <div ref={terminalRef} className="w-full h-full p-2 pb-3 relative z-10" />
          </div>
        </div>
      </div>
    </>
  );
};

export default TerminalModal;
