import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { DataService } from '../utils/api';

export default function ImportModal({ isOpen, onClose, onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selectedFile = e.dataTransfer.files[0];
      if (selectedFile.name.toLowerCase().endsWith('.csv')) {
        setFile(selectedFile);
        setError(null);
        setResult(null);
      } else {
        setError('Please drop a valid .csv file.');
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.toLowerCase().endsWith('.csv')) {
        setFile(selectedFile);
        setError(null);
        setResult(null);
      } else {
        setError('Please select a valid .csv file.');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a CSV file to import.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await DataService.importCsv(formData);
      setResult(res.data);
      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to import CSV. Please verify file format.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg glass-card rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-dark-surface">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-emerald-500" />
              Import Transactions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Upload bank statements or expense sheets in CSV format
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Import Completed Successfully!</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-white/60 dark:bg-dark-card/60">
                  <span className="text-slate-500 dark:text-slate-400 block">Imported Records</span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {result.imported}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-white/60 dark:bg-dark-card/60">
                  <span className="text-slate-500 dark:text-slate-400 block">Skipped / Duplicates</span>
                  <span className="text-lg font-bold text-slate-600 dark:text-slate-400">
                    {result.skipped}
                  </span>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="btn-secondary text-xs w-full mt-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Import Another File</span>
              </button>
            </div>
          ) : (
            <>
              {/* Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10'
                    : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 bg-slate-50/50 dark:bg-dark-card/40'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".csv"
                  className="hidden"
                />
                <UploadCloud className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-500 mb-2" />
                {file ? (
                  <div>
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {(file.size / 1024).toFixed(1)} KB • Click to change file
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Click to browse or drag & drop your CSV file here
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Compatible with bank statement exports & expense templates
                    </p>
                  </div>
                )}
              </div>

              {/* Supported Columns Guide */}
              <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs">
                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Supported CSV Header Names:
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-600 dark:text-slate-400">
                  <div><span className="font-medium text-slate-800 dark:text-slate-200">Date:</span> Date, Transaction Date, Txn Date</div>
                  <div><span className="font-medium text-slate-800 dark:text-slate-200">Amount:</span> Amount, Debit, Spent, Cost</div>
                  <div><span className="font-medium text-slate-800 dark:text-slate-200">Category:</span> Category, Type (Auto-created if new)</div>
                  <div><span className="font-medium text-slate-800 dark:text-slate-200">Description:</span> Description, Narrative, Details, Merchant</div>
                </div>
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs"
            >
              {result ? 'Done' : 'Cancel'}
            </button>
            {!result && (
              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="btn-primary text-xs"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Process & Import</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
