import { Terminal } from '@xterm/xterm';
import { ClipboardAddon } from '@xterm/addon-clipboard';

export interface ClipboardHandlers {
  pasteText: (text: string) => void;
  copyToClipboard: (text: string) => void;
  readFromClipboard: () => Promise<string>;
}

export interface ClipboardSetupResult {
  clipboardAddon: ClipboardAddon | null;
  handlers: ClipboardHandlers;
}

export const setupTerminalClipboard = (
  term: Terminal,
  wsRef: React.MutableRefObject<WebSocket | null>,
  onCopy?: () => void
): ClipboardSetupResult => {
  const pasteText = (text: string) => {
    if (!text) return;
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ type: 'data', data: text }));
      } catch (e) {}
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
    onCopy?.();
  };

  const fallbackCopy = (text: string) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    } catch (e) {}
  };

  const readFromClipboard = async (): Promise<string> => {
    if (window.isSecureContext && navigator.clipboard?.readText) {
      try {
        return await navigator.clipboard.readText();
      } catch (e) {}
    }
    return '';
  };

  let lastSelection = '';
  const handleSelectionChange = () => {
    if (!term.hasSelection()) {
      lastSelection = '';
      return;
    }
    const selection = term.getSelection();
    if (selection && selection !== lastSelection && selection.trim()) {
      lastSelection = selection;
      copyToClipboard(selection);
    }
  };

  // Only create ClipboardAddon in secure contexts (HTTPS)
  let clipboardAddon: ClipboardAddon | null = null;
  
  if (window.isSecureContext && navigator.clipboard && 'readText' in navigator.clipboard) {
    try {
      clipboardAddon = new ClipboardAddon(undefined, {
        readText: async () => readFromClipboard(),
        writeText: async (_, text) => copyToClipboard(text),
      });
    } catch (e) {}
  }

  term.onSelectionChange(handleSelectionChange);

  return {
    clipboardAddon,
    handlers: { pasteText, copyToClipboard, readFromClipboard },
  };
};

export default setupTerminalClipboard;