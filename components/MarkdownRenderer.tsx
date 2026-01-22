
import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const processText = (text: string) => {
    const lines = text.split('\n');
    const processed: React.ReactNode[] = [];
    let currentTable: string[][] = [];
    let inTable = false;

    const pushTable = (tableData: string[][], keySuffix: string | number) => {
      if (tableData.length === 0) return;
      const tableKey = `table-${keySuffix}`;
      processed.push(
        <div key={tableKey} className="my-6 overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm bg-white dark:bg-zinc-950">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                {tableData[0].map((header, idx) => (
                  <th key={idx} className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    {formatInline(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {tableData.slice(1).map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/20 transition-colors">
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className="px-5 py-4 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                      {formatInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Table Detection
      if (line.startsWith('|') && line.includes('|')) {
        // Skip separator lines like |---|---|
        if (line.includes('---')) {
          inTable = true;
          continue;
        }
        
        const cells = line.split('|')
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
          .map(c => c.trim());
        
        if (cells.length > 0) {
          currentTable.push(cells);
          inTable = true;
          continue;
        }
      }

      // If we were in a table and the line ended, render the table
      if (inTable && (!line.startsWith('|') || i === lines.length - 1)) {
        pushTable(currentTable, i);
        currentTable = [];
        inTable = false;
        if (!line.startsWith('|')) {
            // fall through
        } else {
            continue;
        }
      }

      if (inTable) continue;

      // Headers
      if (line.startsWith('### ')) {
        processed.push(<h3 key={i} className="text-lg font-bold mt-6 mb-3 text-zinc-900 dark:text-white flex items-center gap-2">{formatInline(line.replace('### ', ''))}</h3>);
        continue;
      }
      if (line.startsWith('## ')) {
        processed.push(<h2 key={i} className="text-xl font-bold mt-8 mb-4 text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2">{formatInline(line.replace('## ', ''))}</h2>);
        continue;
      }
      if (line.startsWith('# ')) {
        processed.push(<h1 key={i} className="text-2xl font-bold mt-10 mb-5 text-zinc-900 dark:text-white">{formatInline(line.replace('# ', ''))}</h1>);
        continue;
      }

      // Bullet points
      if (line.startsWith('- ') || line.startsWith('* ')) {
        processed.push(
          <li key={i} className="ml-5 list-disc text-zinc-700 dark:text-zinc-300 mb-2 marker:text-indigo-500">
             {formatInline(line.replace(/^[-*]\s+/, ''))}
          </li>
        );
        continue;
      }

      // Numbered lists
      if (/^\d+\.\s/.test(line)) {
        processed.push(
          <div key={i} className="ml-1 flex gap-3 text-zinc-700 dark:text-zinc-300 mb-2">
            <span className="font-bold text-indigo-500 min-w-[1.5rem]">{line.match(/^\d+\./)?.[0]}</span>
            <span>{formatInline(line.replace(/^\d+\.\s/, ''))}</span>
          </div>
        );
        continue;
      }

      // Empty lines
      if (line === '') {
        processed.push(<div key={i} className="h-4"></div>);
        continue;
      }

      // Default paragraph
      processed.push(<p key={i} className="text-zinc-700 dark:text-zinc-300 mb-3 leading-relaxed">{formatInline(line)}</p>);
    }

    if (currentTable.length > 0) {
      pushTable(currentTable, 'end');
    }

    return processed;
  };

  const formatInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-zinc-900 dark:text-white font-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return <div className="markdown-content text-sm md:text-base">{processText(content)}</div>;
};

export default MarkdownRenderer;
