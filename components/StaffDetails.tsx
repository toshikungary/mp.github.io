import React from 'react';
import { StaffTotalData } from '../types';

interface StaffDetailsProps {
    staffTotalData: StaffTotalData[];
}

export const StaffDetails: React.FC<StaffDetailsProps> = ({ staffTotalData }) => (
    <div id="staffDetailsSection" className="pt-8">
        <h2 className="text-xl font-bold text-indigo-700 mb-4 border-b pb-2">🗓️ 報表 4: 員工當值服務站詳情</h2>
        <div id="staffDetailsBody" className="space-y-6">
            {staffTotalData.map(item => {
                const details = item.details;
                
                // 將詳情分組，每組最多 8 個項目
                const chunkSize = 8;
                const detailChunks = [];
                for (let i = 0; i < details.length; i += chunkSize) {
                    detailChunks.push(details.slice(i, i + chunkSize));
                }

                return (
                    <div key={item.staffId} className="p-4 border border-gray-200 rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center mb-3 border-b pb-2">
                            <h4 className="font-bold text-lg text-gray-800">{item.staffId} ({item.count} 日)</h4>
                        </div>
                        {item.count === 0 ? (
                            <p className="text-gray-500 text-sm italic">本月無當值記錄。</p>
                        ) : (
                            detailChunks.map((chunk, index) => (
                                <div key={index} className="flex flex-wrap gap-2 text-sm mb-2">
                                    {chunk.map((d, dIndex) => (
                                        <span key={dIndex} className={`px-2 py-1 rounded-full text-xs font-medium border ${d.special ? 'bg-red-100 text-red-700 border-red-200' : 'bg-indigo-100 text-indigo-700 border-indigo-200'}`}>
                                            {d.date} {d.station} {d.shift}
                                        </span>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                );
            })}
        </div>
    </div>
);