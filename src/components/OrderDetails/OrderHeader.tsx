import React from 'react';
import { ArrowLeft, Calendar, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OrderHeaderProps {
    invoiceCode: string;
    status: string;
    createdAt: string;
    onStatusChange: (newStatus: string) => void;
    onPrintInvoice: () => void;
    isUpdating: boolean;
}

export const OrderHeader: React.FC<OrderHeaderProps> = ({
    invoiceCode,
    status,
    createdAt,
    onStatusChange,
    onPrintInvoice,
    isUpdating
}) => {
    const navigate = useNavigate();

    const getStatusColor = (statusNum: number) => {
        switch (statusNum) {
            case 1: return 'bg-green-100 text-green-800';
            case 0: return 'bg-blue-100 text-blue-800';
            case 3: return 'bg-red-100 text-red-800';
            case 2: return 'bg-yellow-100 text-yellow-800';
            case 4: return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/orders')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-900"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            Order #{invoiceCode}
                            <select
                                value={status}
                                onChange={(e) => onStatusChange(e.target.value)}
                                disabled={isUpdating}
                                className={`appearance-none rounded-full px-3 py-1 text-sm font-medium border-0 focus:ring-2 focus:ring-primary-500 cursor-pointer ${getStatusColor(Number(status))}`}
                                style={{ paddingRight: '1.5rem' }}
                            >
                                <option value={0}>Processing</option>
                                <option value={1}>Completed</option>
                                <option value={2}>On Hold</option>
                                <option value={3}>Cancelled</option>
                                <option value={4}>Refunded</option>
                            </select>
                        </h1>
                        <button
                            onClick={onPrintInvoice}
                            className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                            title="Print Invoice"
                        >
                            <Printer className="h-4 w-4" />
                            Print Invoice
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4" />
                        {createdAt}
                    </p>
                </div>
            </div>
        </div>
    );
};
