import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { clsx } from 'clsx';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message: string;
    isDelete?: boolean; // If true, show red danger styles. If false, show warning/neutral styles.
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Xác nhận xóa",
    message,
    isDelete = true
}) => {
    const confirmButtonRef = React.useRef<HTMLButtonElement>(null);

    React.useEffect(() => {
        if (isOpen) {
            // Small timeout to ensure the element is mounted and transition has started
            const timer = setTimeout(() => {
                confirmButtonRef.current?.focus();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={clsx(
                            "flex-shrink-0 p-3 rounded-full",
                            isDelete ? "bg-red-100" : "bg-orange-100"
                        )}>
                            <AlertTriangle className={clsx(
                                "w-6 h-6",
                                isDelete ? "text-red-600" : "text-orange-600"
                            )} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                                {title}
                            </h3>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                {message}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        ref={confirmButtonRef}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={clsx(
                            "px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors",
                            isDelete
                                ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                                : "bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
                        )}
                    >
                        {isDelete ? "Xóa ngay" : "Xác nhận"}
                    </button>
                </div>
            </div>
        </div>
    );
};
