/**
 * Convert legacy markdown content into rich HTML for NoteEditor (Word / Canva style).
 * If content is already HTML, it returns it directly.
 */
export const markdownToHtml = (content: string): string => {
  if (!content) return '';

  // If already contains HTML tags like <p>, <table>, <b>, <div>, return as is
  if (/<(p|div|table|h1|h2|h3|ul|ol|hr|b|i|strong|em)[\s>]/i.test(content)) {
    return content;
  }

  const lines = content.split('\n');
  const result: string[] = [];
  let inTable = false;
  let tableHeaderCols: string[] = [];
  let tableRows: string[][] = [];

  const inlineFormat = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/\*(.*?)\*/g, '<i>$1</i>')
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>');
  };

  const flushTable = () => {
    if (!inTable) return;
    let html = '<table class="w-full border-collapse border border-slate-300 my-3 rounded-lg overflow-hidden">';
    if (tableHeaderCols.length > 0) {
      html += '<thead><tr class="bg-slate-100">';
      for (const col of tableHeaderCols) {
        html += `<th class="border border-slate-300 p-2 text-left font-semibold text-slate-700 text-sm">${inlineFormat(col)}</th>`;
      }
      html += '</tr></thead>';
    }
    if (tableRows.length > 0) {
      html += '<tbody>';
      for (const row of tableRows) {
        html += '<tr>';
        for (const cell of row) {
          html += `<td class="border border-slate-300 p-2 text-sm text-slate-700">${inlineFormat(cell)}</td>`;
        }
        html += '</tr>';
      }
      html += '</tbody>';
    }
    html += '</table>';
    result.push(html);
    inTable = false;
    tableHeaderCols = [];
    tableRows = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Markdown Table Detection
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());

      // Check if separator line | --- | --- |
      if (cells.every((c) => /^:?-+:?$/.test(c))) {
        continue;
      }

      if (!inTable) {
        inTable = true;
        tableHeaderCols = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (line === '---' || line === '***') {
      result.push('<hr class="my-4 border-t border-slate-300" />');
    } else if (line.startsWith('# ')) {
      result.push(`<h1>${inlineFormat(line.slice(2))}</h1>`);
    } else if (line.startsWith('## ')) {
      result.push(`<h2>${inlineFormat(line.slice(3))}</h2>`);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      result.push(`<ul><li>${inlineFormat(line.slice(2))}</li></ul>`);
    } else if (/^\d+\.\s+/.test(line)) {
      const match = line.match(/^\d+\.\s+(.*)$/);
      result.push(`<ol><li>${inlineFormat(match ? match[1] : line)}</li></ol>`);
    } else if (line.length === 0) {
      result.push('<p><br></p>');
    } else {
      result.push(`<p>${inlineFormat(line)}</p>`);
    }
  }

  if (inTable) {
    flushTable();
  }

  return result.join('');
};

/**
 * Extract plain text from HTML or markdown for word count, search, and compact card previews.
 */
export const htmlToPlainText = (htmlOrMarkdown?: string): string => {
  if (!htmlOrMarkdown) return '';

  // If contains HTML tags, parse text content
  if (/<[a-z][\s\S]*>/i.test(htmlOrMarkdown)) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlOrMarkdown, 'text/html');
    return doc.body.textContent || '';
  }

  // Strip markdown markers
  return htmlOrMarkdown
    .replace(/[*#_~`|]/g, ' ')
    .replace(/-{3,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};
