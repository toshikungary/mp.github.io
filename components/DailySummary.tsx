import React from 'react';
import { DayRoster } from '../types';
import { getDayOfWeekChinese, isHoliday } from '../utils/dateUtils';

interface DailySummaryProps {
    roster: DayRoster[];
}

export const DailySummary: React.FC<DailySummaryProps> = ({ roster }) => (
    <div id="summarySection">
        <h2 className="text-xl font-bold text-indigo-700 mb-4 border-b pb-2">📊 報表 1: 每日人手摘要</h2>
        <div className="overflow-x-auto rounded-lg shadow-md">
            <table className="w-full table-fixed bg-white">
                <thead>
                    <tr className="bg-indigo-100 sticky top-0 z-10 text-xs sm:text-sm">
                        <th className="w-[70px] p-2 sm:p-3 text-center border-b border-gray-200">日期</th>
                        <th className="w-[80px] p-2 sm:p-3 text-center border-b border-gray-200">工作日</th>
                        <th className="w-[60px] p-2 sm:p-3 text-center border-b border-gray-200">站務人數</th>
                        <th className="w-[60px] p-2 sm:p-3 text-center border-b border-gray-200">補假人數</th>
                        <th className="w-[60px] p-2 sm:p-3 text-center border-b border-gray-200">辦公室人數</th>
                    </tr>
                </thead>
                <tbody>
                    {roster.map(dayRoster => {
                        const date = dayRoster.date;
                        const dayOfWeek = getDayOfWeekChinese(date);
                        const isHolidayDay = isHoliday(date);
                        const rowClass = isHolidayDay ? 'bg-yellow-50' : 'bg-white';
                        
                        return (
                            <tr key={dayRoster.dateKey} className={`${rowClass} hover:bg-gray-100 transition duration-150`}>
                                <td className="font-bold text-xs sm:text-sm p-2 text-center border-b border-gray-200">{date.getDate()} ({dayOfWeek})</td>
                                <td className="p-2 text-center border-b border-gray-200">
                                    <span className={`${dayRoster.isWorkingDay ? 'text-green-600' : 'text-red-500'} font-semibold text-xs sm:text-sm`}>
                                        {dayRoster.isWorkingDay ? '是' : '否'}
                                    </span>
                                </td>
                                <td className="p-2 text-center border-b border-gray-200 text-xs sm:text-sm">{dayRoster.stationStaffCount}</td>
                                <td className="text-blue-600 p-2 text-center border-b border-gray-200 text-xs sm:text-sm">{dayRoster.leaveStaffCount}</td>
                                <td className="text-gray-700 p-2 text-center border-b border-gray-200 text-xs sm:text-sm">{dayRoster.officeStaffCount}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    </div>
);