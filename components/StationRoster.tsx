import React from 'react';
import { DayRoster, StationHeaders, StationHeaderCol } from '../types';
import { getDayOfWeekChinese, isHoliday } from '../utils/dateUtils';

interface StationRosterProps {
    dailyRoster: DayRoster[];
    allStationColumns: StationHeaderCol[];
    stationHeaders: StationHeaders | null;
}

export const StationRoster: React.FC<StationRosterProps> = ({ dailyRoster, stationHeaders }) => {
    if (!stationHeaders) return null;

    return (
        <div id="stationRosterSection" className="pt-8">
            <h2 className="text-xl font-bold text-indigo-700 mb-4 border-b pb-2">📋 報表 2: 服務站每日詳情 (紅色為特別編配)</h2>
            <div className="overflow-x-auto rounded-lg shadow-md">
                <table className="w-full bg-white border-collapse" style={{ width: stationHeaders.tableWidth }}>
                    <thead>
                        {/* 第一行: 日期, 星期, 服務站ID */}
                        <tr className="bg-indigo-100 sticky top-0 z-10 text-xs" id="stationRosterHeaderRow1">
                            <th rowSpan={2} className="w-[60px] p-2 border-r border-gray-300 border-b border-gray-200 text-center sticky left-0 bg-indigo-100 z-20">日期</th>
                            <th rowSpan={2} className="w-[60px] p-2 border-r border-gray-300 border-b border-gray-200 text-center sticky left-[60px] bg-indigo-100 z-20">星期</th>
                            {stationHeaders.headerRow1.map((header, index) => (
                                <th key={index} colSpan={header.colspan} className={`${header.className} border-b border-gray-200 text-center`}>{header.stationId}</th>
                            ))}
                        </tr>
                        {/* 第二行: 班次 (早/晚) 及 員工位 (1/2) */}
                        <tr className="bg-indigo-200 sticky top-[33px] z-10 text-xs" id="stationRosterHeaderRow2">
                            {stationHeaders.headerRow2.map((header) => (
                                <th key={header.shiftKey} className={`${header.className} border-b border-gray-200 text-center`} style={header.style}>{header.text}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {dailyRoster.map(dayRoster => {
                            const date = dayRoster.date;
                            const dayOfWeek = getDayOfWeekChinese(date);
                            const isHolidayDay = isHoliday(date);
                            const rowClass = isHolidayDay ? 'bg-yellow-50' : 'bg-white';
                            
                            // 創建一個 Map 來快速查找當天的排班情況
                            const assignmentsMap = new Map();
                            dayRoster.stationAssignments.forEach(a => {
                                const key = `${a.stationId}-${a.shift}`;
                                if (!assignmentsMap.has(key)) assignmentsMap.set(key, []);
                                assignmentsMap.get(key).push(a);
                            });

                            return (
                                <tr key={dayRoster.dateKey} className={`${rowClass} hover:bg-gray-100 transition duration-150`}>
                                    <td className="font-bold p-2 text-center border-r border-b border-gray-200 text-xs sticky left-0 bg-inherit z-10">{date.getDate()}</td>
                                    <td className="p-2 text-center border-r border-b border-gray-200 text-xs sticky left-[60px] bg-inherit z-10">週{dayOfWeek}</td>
                                    {stationHeaders.headerRow2.map(header => {
                                        const [stationId, shiftCode, posStr] = header.shiftKey.split('-');
                                        
                                        // 找到該班次的全部人員
                                        const staff = assignmentsMap.get(`${stationId}-${shiftCode}`) || [];
                                        const positionIndex = parseInt(posStr) - 1; // 0 for (1), 1 for (2)
                                        const assignment = staff[positionIndex];
                                        
                                        const staffId = assignment?.staffId || '-';
                                        const cellClass = assignment?.special ? 'bg-red-200/50 font-bold text-red-700' : '';

                                        return (
                                            <td key={header.shiftKey} className={`${cellClass} p-1 border-l border-r border-b border-gray-200 text-center text-xs whitespace-nowrap`} style={header.style}>
                                                {staffId}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};