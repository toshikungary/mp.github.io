import React from 'react';
import { StaffTotalData } from '../types';

interface StaffTotalProps {
    staffTotalData: StaffTotalData[];
}

export const StaffTotal: React.FC<StaffTotalProps> = ({ staffTotalData }) => (
    <div id="staffTotalSection" className="pt-8">
        <h2 className="text-xl font-bold text-indigo-700 mb-4 border-b pb-2">📈 報表 3: 員工每月當值總日數</h2>
        <div className="overflow-x-auto rounded-lg shadow-md max-h-96 overflow-y-auto">
            <table className="w-full table-auto bg-white">
                <thead>
                    <tr className="bg-indigo-100 sticky top-0 z-10 text-xs sm:text-sm">
                        <th className="w-1/2 p-2 sm:p-3 text-center border-b border-gray-200">員工編號</th>
                        <th className="w-1/2 p-2 sm:p-3 text-center border-b border-gray-200">服務站總日數</th>
                    </tr>
                </thead>
                <tbody>
                    {staffTotalData.map(item => (
                        <tr key={item.staffId} className="hover:bg-gray-100">
                            <td className="font-bold p-2 text-center border-b border-gray-200 text-xs sm:text-sm">{item.staffId}</td>
                            <td className="text-indigo-600 font-semibold p-2 text-center border-b border-gray-200 text-xs sm:text-sm">{item.count} 日</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);