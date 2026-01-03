import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Save } from 'lucide-react';
import { endpoints } from '../config';

interface OrderInfo {
    inside_dhaka: string;
    outside_dhaka: string;
    vat: string;
    bkash_changed: string;
}

interface OrderInfoInput {
    inside_dhaka: number;
    outside_dhaka: number;
    vat: number;
    bkash_changed: number;
}

export const Settings: React.FC = () => {
    const queryClient = useQueryClient();
    const token = localStorage.getItem('token');
    const { register, handleSubmit, setValue, formState: { errors } } = useForm<OrderInfoInput>();

    const { data: orderInfo, isLoading, error } = useQuery({
        queryKey: ['orderInfo'],
        queryFn: async () => {
            const response = await fetch(endpoints.orderInfo.get, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });
            if (!response.ok) throw new Error('Failed to fetch order info');
            const result = await response.json();
            return result.data as OrderInfo;
        },
    });

    // Set form values when data is loaded
    useEffect(() => {
        if (orderInfo) {
            setValue('inside_dhaka', Number(orderInfo.inside_dhaka));
            setValue('outside_dhaka', Number(orderInfo.outside_dhaka));
            setValue('vat', Number(orderInfo.vat));
            setValue('bkash_changed', Number(orderInfo.bkash_changed));
        }
    }, [orderInfo, setValue]);

    const mutation = useMutation({
        mutationFn: async (data: OrderInfoInput) => {
            const response = await fetch(endpoints.orderInfo.update, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Failed to update settings');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orderInfo'] });
            alert('Settings updated successfully!');
        },
        onError: (error) => {
            alert(`Error updating settings: ${error.message}`);
        },
    });

    const onSubmit = (data: OrderInfoInput) => {
        mutation.mutate(data);
    };

    if (isLoading) return <div className="p-6">Loading settings...</div>;
    if (error) return <div className="p-6 text-red-600">Error loading settings.</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
            </div>

            <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Delivery & Order Configuration</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Inside Dhaka Delivery (Tk)
                            </label>
                            <div className="mt-1">
                                <input
                                    type="number"
                                    {...register('inside_dhaka', { required: 'This field is required', min: 0 })}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                                />
                                {errors.inside_dhaka && (
                                    <p className="mt-1 text-sm text-red-600">{errors.inside_dhaka.message}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Outside Dhaka Delivery (Tk)
                            </label>
                            <div className="mt-1">
                                <input
                                    type="number"
                                    {...register('outside_dhaka', { required: 'This field is required', min: 0 })}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                                />
                                {errors.outside_dhaka && (
                                    <p className="mt-1 text-sm text-red-600">{errors.outside_dhaka.message}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                VAT (%)
                            </label>
                            <div className="mt-1">
                                <input
                                    type="number"
                                    step="0.01"
                                    {...register('vat', { required: 'This field is required', min: 0 })}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                                />
                                {errors.vat && (
                                    <p className="mt-1 text-sm text-red-600">{errors.vat.message}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                bKash Charge (%)
                            </label>
                            <div className="mt-1">
                                <input
                                    type="number"
                                    step="0.01"
                                    {...register('bkash_changed', { required: 'This field is required', min: 0 })}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                                />
                                {errors.bkash_changed && (
                                    <p className="mt-1 text-sm text-red-600">{errors.bkash_changed.message}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                        >
                            {mutation.isPending ? (
                                <>Saving...</>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
