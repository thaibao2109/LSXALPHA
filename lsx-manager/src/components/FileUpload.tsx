import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { clsx } from 'clsx';
import { parseODS } from '../utils/odsParser';
import type { LSXData } from '../types';

interface FileUploadProps {
    onDataLoaded: (data: LSXData) => void;
    className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, className }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const processFile = async (file: File) => {
        setLoading(true);
        setError(null);
        try {
            const data = await parseODS(file);
            onDataLoaded(data);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Lỗi khi đọc file");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    return (
        <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={clsx(
                "flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg transition-all cursor-pointer bg-gray-50",
                isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400",
                className
            )}
        >
            <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                {loading ? (
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4" />
                ) : (
                    <Upload className={clsx("w-16 h-16 mb-4", isDragging ? "text-blue-500" : "text-gray-400")} />
                )}
                <span className="text-xl font-medium text-gray-700">
                    {loading ? "Đang xử lý..." : "Kéo thả hoặc nhấn để tải lên file LSX"}
                </span>
                <span className="text-sm text-gray-500 mt-2">Hỗ trợ .ods, .xlsx</span>
                {error && <p className="text-red-500 mt-4 font-medium max-w-md text-center">{error}</p>}
                <input
                    type="file"
                    accept=".ods, .xlsx, .xls"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={loading}
                />
            </label>
        </div>
    );
};
