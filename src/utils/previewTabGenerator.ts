import { MemoryItem } from '../types';

/**
 * Generates a standalone Blob URL suitable for opening in a new browser tab.
 * For PDFs and Images, opens the raw file with native browser viewing.
 * For Office files (PPTX, DOCX, XLSX) and notes, generates a standalone executive viewer.
 */
export function generateNewTabPreviewUrl(memory: MemoryItem): string {
  const lowerName = (memory.fileName || memory.title || '').toLowerCase();
  const isPdf = memory.type === 'pdf' || lowerName.endsWith('.pdf');
  const isImage =
    memory.type === 'screenshot' ||
    memory.type === 'photo' ||
    Boolean(lowerName.match(/\.(png|jpg|jpeg|webp|gif|svg)$/)) ||
    Boolean(memory.imageBase64);

  // 1. PDF: Native PDF viewer in new tab
  if (isPdf && memory.fileDataUrl) {
    try {
      const clean = memory.fileDataUrl.replace(/^data:[^;]+;base64,/, '');
      const binary = atob(clean);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (e) {
      console.warn('PDF blob generation error:', e);
    }
  }

  // 2. Images: Direct full-screen image in new tab
  if (isImage) {
    const rawData = memory.imageBase64 || memory.fileDataUrl;
    if (rawData && rawData.startsWith('data:')) {
      try {
        const parts = rawData.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
        const binary = atob(parts[1]);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: mime });
        return URL.createObjectURL(blob);
      } catch (e) {
        return rawData;
      }
    }
    if (rawData) return rawData;
  }

  // 3. Standalone Viewer HTML for PPTX, DOCX, XLSX, Notes
  const title = memory.fileName || memory.title;
  const content = memory.originalText || memory.extractedDetails?.text || memory.description || 'No content preview available';
  const dates = (memory.extractedDetails?.dates || []).join(', ');
  const deadlines = (memory.extractedDetails?.deadlines || []).join(', ');
  const dateFormatted = new Date(memory.createdAt).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Check if we have table data or slides
  const previewData = memory.previewData;
  let customBody = '';

  if (memory.type === 'presentation' && previewData?.slides && previewData.slides.length > 0) {
    const slidesHtml = previewData.slides
      .map(
        (s: any, idx: number) => `
        <div class="slide-card">
          <div class="slide-num">Slide ${idx + 1}</div>
          <h2>${escapeHtml(s.title || `Slide ${idx + 1}`)}</h2>
          <div class="slide-content">${escapeHtml(s.fullText || '')}</div>
        </div>
      `
      )
      .join('\n');

    customBody = `
      <div class="slides-container">
        <h3 class="section-title">Presentation Slides (${previewData.slides.length})</h3>
        ${slidesHtml}
      </div>
    `;
  } else if (memory.type === 'spreadsheet' && previewData?.tableData && previewData.tableData.length > 0) {
    const tableRows = previewData.tableData
      .map(
        (row: string[], rIdx: number) => `
        <tr>
          <td class="row-num">${rIdx + 1}</td>
          ${row.map((cell) => `<td>${escapeHtml(String(cell ?? ''))}</td>`).join('')}
        </tr>
      `
      )
      .join('\n');

    customBody = `
      <div class="table-container">
        <h3 class="section-title">Spreadsheet Preview</h3>
        <table class="data-table">
          ${tableRows}
        </table>
      </div>
    `;
  } else {
    customBody = `
      <div class="doc-body">
        <pre class="content-text">${escapeHtml(content)}</pre>
      </div>
    `;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} — Brain Cache Preview</title>
  <style>
    :root {
      --bg: #090e17;
      --card: #0f172a;
      --border: #1e293b;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --accent: #14b8a6;
      --accent-soft: rgba(20, 184, 166, 0.15);
    }
    @media (prefers-color-scheme: light) {
      :root {
        --bg: #f8fafc;
        --card: #ffffff;
        --border: #e2e8f0;
        --text: #0f172a;
        --text-muted: #64748b;
        --accent: #0d9488;
        --accent-soft: rgba(13, 148, 136, 0.1);
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 2rem 1rem;
    }
    .wrapper {
      max-width: 900px;
      margin: 0 auto;
    }
    .header {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 1.5rem 2rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--accent);
      margin-bottom: 0.5rem;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 0.5rem;
      word-break: break-word;
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      font-size: 0.8125rem;
      color: var(--text-muted);
    }
    .badge {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      border-radius: 0.375rem;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.6875rem;
      background: var(--accent-soft);
      color: var(--accent);
    }
    .content-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .content-text {
      white-space: pre-wrap;
      word-break: break-word;
      font-family: inherit;
      font-size: 0.9375rem;
      line-height: 1.7;
    }
    .slide-card {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin-bottom: 1.25rem;
    }
    .slide-num {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--accent);
      text-transform: uppercase;
      margin-bottom: 0.5rem;
    }
    .slide-card h2 {
      font-size: 1.125rem;
      margin-bottom: 0.75rem;
    }
    .slide-content {
      font-size: 0.875rem;
      color: var(--text-muted);
      white-space: pre-wrap;
    }
    .table-container {
      overflow-x: auto;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
      text-align: left;
    }
    .data-table th, .data-table td {
      border: 1px solid var(--border);
      padding: 0.5rem 0.75rem;
    }
    .row-num {
      background: var(--bg);
      font-family: monospace;
      color: var(--text-muted);
      width: 40px;
      text-align: center;
    }
    .section-title {
      font-size: 1rem;
      font-weight: 700;
      margin-bottom: 1rem;
      color: var(--text);
    }
    .actions-bar {
      margin-top: 1.5rem;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      border: 1px solid var(--border);
      background: var(--card);
      color: var(--text);
    }
    .btn-primary {
      background: var(--accent);
      color: #ffffff;
      border-color: transparent;
    }
    .btn:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="brand">
        <span>⚡ Brain Cache</span>
        <span class="badge">${escapeHtml(memory.type)}</span>
      </div>
      <h1>${escapeHtml(title)}</h1>
      <div class="meta">
        <span>Preserved: ${dateFormatted}</span>
        ${memory.fileSize ? `<span>Size: ${escapeHtml(memory.fileSize)}</span>` : ''}
        ${deadlines ? `<span>Deadlines: ${escapeHtml(deadlines)}</span>` : ''}
        ${dates ? `<span>Dates: ${escapeHtml(dates)}</span>` : ''}
      </div>
    </div>

    <div class="content-card">
      ${customBody}
      <div class="actions-bar">
        <button class="btn" onclick="window.print()">Print Document</button>
        <button class="btn btn-primary" onclick="navigator.clipboard.writeText(document.body.innerText).then(() => alert('Content copied!'))">Copy Text</button>
      </div>
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  return URL.createObjectURL(blob);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
