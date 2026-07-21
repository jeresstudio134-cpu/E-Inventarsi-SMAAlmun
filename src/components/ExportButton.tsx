import { FileSpreadsheet } from 'lucide-react';

interface ExportButtonProps {
  data: any[];
  columns: { key: string; label: string; format?: (val: any) => string }[];
  filename: string;
}

export default function ExportButton({ data, columns, filename }: ExportButtonProps) {
  const handleExport = () => {
    if (data.length === 0) {
      alert('Tidak ada data untuk diekspor!');
      return;
    }

    // Prepare CSV rows
    const headers = ['"No."', ...columns.map(col => `"${col.label.replace(/"/g, '""')}"`)].join(',');
    
    const rows = data.map((item, index) => {
      const serialNum = `"${index + 1}"`;
      const rowValues = columns.map(col => {
        let value = item[col.key];
        
        // Apply custom formatter if present
        if (col.format) {
          value = col.format(value);
        }

        // Handle null/undefined
        if (value === null || value === undefined) {
          value = '';
        }

        // Escape double quotes and wrap in quotes
        const stringVal = String(value).replace(/"/g, '""');
        return `"${stringVal}"`;
      });
      return [serialNum, ...rowValues].join(',');
    });

    const csvContent = '\ufeffsep=,\n' + [headers, ...rows].join('\n'); // Prepend UTF-8 BOM and sep=, for Excel compatibility

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      id={`btn-export-${filename}`}
      onClick={handleExport}
      className="inline-flex items-center gap-2 px-4 py-2 border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all rounded-lg text-sm font-medium shadow-sm hover:shadow"
    >
      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
      <span>Ekspor Excel (.csv)</span>
    </button>
  );
}
