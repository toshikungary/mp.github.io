import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RosterInputs, RosterResults, StationHeaderCol, StaffDetail } from './types';
import { formatDate, isWorkingDay, isHoliday, findNthWorkingDayAfter } from './utils/dateUtils';
import { DailySummary } from './components/DailySummary';
import { StationRoster } from './components/StationRoster';
import { StaffTotal } from './components/StaffTotal';
import { StaffDetails } from './components/StaffDetails';

const App = () => {
    // --- 狀態定義 ---
    const today = useMemo(() => new Date(), []);
    const defaultMonth = useMemo(() => formatDate(today).substring(0, 7), [today]);

    const [inputs, setInputs] = useState<RosterInputs>({
        yearMonth: defaultMonth,
        staffCount: 100,
        stationCount: 10,
        startStaff: 'S50',
        singleShiftStations: 'A1, A5',
        specialRequests: '',
    });
    
    const [rosterResults, setRosterResults] = useState<RosterResults | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- 初始化和輸入處理 ---
    
    // 生成可選月份列表
    const monthOptions = useMemo(() => {
        const options = [];
        for (let i = -3; i <= 3; i++) {
            const date = new Date();
            date.setMonth(today.getMonth() + i);
            const year = date.getFullYear();
            const month = date.getMonth() + 1; 
            const value = `${year}-${String(month).padStart(2, '0')}`;
            const text = `${year} 年 ${month} 月`;
            options.push({ value, text });
        }
        return options;
    }, [today]);

    // 生成員工 ID 列表 (S1, S2, ...)
    const staffIdOptions = useMemo(() => {
        const count = inputs.staffCount;
        return Array.from({ length: count }, (_, i) => `S${i + 1}`);
    }, [inputs.staffCount]);

    useEffect(() => {
        // 確保起始員工在範圍內
        if (staffIdOptions.length > 0 && !staffIdOptions.includes(inputs.startStaff)) {
            const defaultIndex = Math.floor(staffIdOptions.length / 2);
            setInputs(prev => ({ ...prev, startStaff: staffIdOptions[defaultIndex] || 'S1' }));
        } else if (staffIdOptions.length === 0) {
            setInputs(prev => ({ ...prev, startStaff: '' }));
        }
    }, [staffIdOptions, inputs.startStaff]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setInputs(prev => ({ ...prev, [id]: id === 'staffCount' || id === 'stationCount' ? parseInt(value) || 0 : value }));
    };

    // --- 數據解析函數 (作為內部 helpers) ---

    const parseSpecialRequests = (rawRequests: string) => {
        const requestsMap = new Map<string, any[]>();
        const validShifts = ['早', '晚']; 
        const lines = rawRequests.trim().split('\n').filter(line => line.trim() !== '');

        lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            if (parts.length === 4) {
                const [staffId, dateString, stationId, shiftCode] = parts;
                const dateKey = dateString; 
                
                if (validShifts.includes(shiftCode) && stationId.match(/^A\d+$/) && staffId.match(/^S\d+$/) && dateKey.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    if (!requestsMap.has(dateKey)) requestsMap.set(dateKey, []);
                    requestsMap.get(dateKey)!.push({ staffId, stationId, shift: shiftCode, sourceLine: line.trim() });
                } else {
                    console.warn(`[編更] 特別編配要求格式無效或班次代碼錯誤: ${line.trim()}`);
                }
            } else if (line.trim() !== '') {
                console.warn(`[編更] 特別編配要求格式錯誤: ${line.trim()}`);
            }
        });
        return requestsMap;
    };

    const parseSingleShiftStations = (rawStations: string) => {
        const stationsSet = new Set<string>();
        rawStations.split(',').forEach(s => {
            const stationId = s.trim().toUpperCase();
            if (stationId.match(/^A\d+$/)) {
                stationsSet.add(stationId);
            }
        });
        return stationsSet;
    };

    // --- 核心排班邏輯 (useCallback 包裹以保持穩定) ---

    const generateRoster = useCallback(async () => {
        setLoading(true);
        setError(null);
        setRosterResults(null);
        
        // 延遲模擬計算時間
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            const [yearStr, monthStr] = inputs.yearMonth.split('-');
            const year = parseInt(yearStr);
            const month = parseInt(monthStr); 
            const totalStaff = inputs.staffCount;
            const totalStations = inputs.stationCount;
            const startStaffId = inputs.startStaff; 

            if (totalStaff === 0 || totalStations === 0) {
                throw new Error("員工或服務站總數不能為零。");
            }
            
            const singleShiftStations = parseSingleShiftStations(inputs.singleShiftStations);
            const specialRequests = parseSpecialRequests(inputs.specialRequests);

            // --- 預計算假期塊和補假日 ---
            let holidayBlockMap = new Map<string, { indexInBlock: number; assignedLieuDayKey: string }>();
            const calculateHolidayBlocks = () => {
                holidayBlockMap.clear();
                const startDate = new Date(year, month - 1, 1);
                const scanLimitDate = new Date(year, month + 1, 15); 
                let currentDate = new Date(startDate);

                while (currentDate <= scanLimitDate) {
                    const dateKey = formatDate(currentDate);

                    if (isHoliday(currentDate) && !holidayBlockMap.has(dateKey)) {
                        let blockDates = [];
                        let tempDate = new Date(currentDate);
                        while (isHoliday(tempDate)) {
                            blockDates.push(new Date(tempDate));
                            tempDate.setDate(tempDate.getDate() + 1);
                        }
                        
                        const blockEndDate = blockDates[blockDates.length - 1];
                        const lieuDay1Key = formatDate(findNthWorkingDayAfter(blockEndDate, 1));
                        const lieuDay2Key = formatDate(findNthWorkingDayAfter(blockEndDate, 2));
                        
                        blockDates.forEach((date, index) => {
                            const key = formatDate(date);
                            const indexInBlock = index + 1; 

                            const assignedLieuDayKey = indexInBlock <= 2 ? lieuDay1Key : lieuDay2Key;
                            
                            holidayBlockMap.set(key, {
                                indexInBlock: indexInBlock,
                                assignedLieuDayKey: assignedLieuDayKey
                            });
                        });

                        currentDate = new Date(blockEndDate);
                        currentDate.setDate(currentDate.getDate() + 1);
                        
                    } else {
                        currentDate.setDate(currentDate.getDate() + 1);
                    }
                }
            };
            calculateHolidayBlocks();
            
            // --- 初始化數據結構 ---
            const staffIds = staffIdOptions; // 已在 state 中計算
            const staffIndex = staffIds.findIndex(id => id === startStaffId);

            let allShifts = [];
            for (let i = 1; i <= totalStations; i++) {
                const stationId = `A${i}`;
                allShifts.push({ stationId, shift: '早' });
                if (!singleShiftStations.has(stationId)) {
                    allShifts.push({ stationId, shift: '晚' });
                }
            }
            
            const roster = []; 
            const staffDutyCounts = new Map<string, number>();
            const staffDutyDetails = new Map<string, StaffDetail[]>();
            const compensationLeaveAccrual = new Map<string, { sourceDateKey: string; lieuDayKey: string }[]>();

            staffIds.forEach(id => {
                staffDutyCounts.set(id, 0);
                staffDutyDetails.set(id, []);
                compensationLeaveAccrual.set(id, []);
            });
            
            const lastDay = new Date(year, month, 0).getDate();
            let staffRotationIndex = staffIndex; 

            // --- 階段 1: 按日迭代排班 ---
            for (let day = 1; day <= lastDay; day++) {
                const currentDate = new Date(year, month - 1, day);
                const dateKey = formatDate(currentDate);
                const isTodayWorkingDay = isWorkingDay(currentDate);

                // 1. 補假安排
                const confirmedLeaveStaffToday = new Set();
                staffIds.forEach(staffId => {
                    const accruals = compensationLeaveAccrual.get(staffId) || [];
                    const leavesToTakeToday = accruals.filter((acc) => acc.lieuDayKey === dateKey);

                    if (leavesToTakeToday.length > 0 && isTodayWorkingDay) {
                        confirmedLeaveStaffToday.add(staffId);
                        const remainingAccruals = accruals.filter((acc) => acc.lieuDayKey !== dateKey);
                        compensationLeaveAccrual.set(staffId, remainingAccruals);
                    }
                });

                // 2. 特別編配
                const daySpecialRequests = specialRequests.get(dateKey) || [];
                const staffInSpecialRequest = new Set();
                const assignedShifts = new Map<string, string[]>(); 

                daySpecialRequests.forEach((req: any) => {
                    const shiftKey = `${req.stationId}-${req.shift}`;
                    const shiftExists = allShifts.some(s => s.stationId === req.stationId && s.shift === req.shift);
                    const isStaffValid = staffIds.includes(req.staffId);
                    const isStaffOnLeave = confirmedLeaveStaffToday.has(req.staffId);

                    if (shiftExists && isStaffValid && !isStaffOnLeave) {
                        if (!assignedShifts.has(shiftKey)) assignedShifts.set(shiftKey, []);
                        if (assignedShifts.get(shiftKey)!.length < 2) {
                            assignedShifts.get(shiftKey)!.push(req.staffId);
                            staffInSpecialRequest.add(req.staffId);
                        }
                    }
                });

                // 3. 輪更排班 (最低日數優先)
                const dayAssignments: any[] = [];
                let usedStaffOnDay = new Set(staffInSpecialRequest); 

                // 3a. 整合特別編配
                assignedShifts.forEach((staffList: string[], shiftKey: string) => {
                    const [stationId, shift] = shiftKey.split('-');
                    staffList.forEach(staffId => {
                        dayAssignments.push({ staffId, stationId, shift, special: true });
                    });
                });

                // 3b. 識別剩餘班次
                const remainingShiftsToFill = [];
                for (const { stationId, shift } of allShifts) {
                    const shiftKey = `${stationId}-${shift}`;
                    const staffAlreadyAssigned = (assignedShifts.get(shiftKey) || []).length;
                    const staffNeeded = 2 - staffAlreadyAssigned;
                    for (let i = 0; i < staffNeeded; i++) {
                        remainingShiftsToFill.push({ stationId, shift });
                    }
                }

                // 3c. 填補班次
                remainingShiftsToFill.forEach(({ stationId, shift }) => {
                    
                    let candidates = staffIds
                        .filter(id => !confirmedLeaveStaffToday.has(id))
                        .filter(id => !usedStaffOnDay.has(id));

                    if (candidates.length === 0) return; 

                    candidates.sort((idA, idB) => {
                        const countA = staffDutyCounts.get(idA) || 0;
                        const countB = staffDutyCounts.get(idB) || 0;
                        
                        if (countA !== countB) return countA - countB;
                        
                        const indexA = staffIds.findIndex(id => id === idA);
                        const indexB = staffIds.findIndex(id => id === idB);
                        const distA = (indexA - staffRotationIndex + totalStaff) % totalStaff;
                        const distB = (indexB - staffRotationIndex + totalStaff) % totalStaff;

                        return distA - distB; 
                    });
                    
                    const selectedStaffId = candidates[0];
                    dayAssignments.push({ staffId: selectedStaffId, stationId, shift, special: false });
                    usedStaffOnDay.add(selectedStaffId);
                    staffRotationIndex = (staffIds.findIndex(id => id === selectedStaffId) + 1) % totalStaff;
                });

                // 4. 統計、補假累積和報表 4 數據收集
                let stationDutyStaff = new Set(dayAssignments.map(a => a.staffId));

                dayAssignments.forEach(duty => {
                    const staffId = duty.staffId;
                    staffDutyCounts.set(staffId, (staffDutyCounts.get(staffId) || 0) + 1);

                    const currentDetails = staffDutyDetails.get(staffId) || [];
                    currentDetails.push({ 
                        date: dateKey.substring(5),
                        station: duty.stationId, 
                        shift: duty.shift, 
                        special: duty.special
                    });
                    staffDutyDetails.set(staffId, currentDetails);

                    const dutyDayInfo = holidayBlockMap.get(dateKey);
                    if (dutyDayInfo && isHoliday(currentDate) && stationDutyStaff.has(staffId)) {
                         const currentAccrual = compensationLeaveAccrual.get(staffId) || [];
                         currentAccrual.push({ sourceDateKey: dateKey, lieuDayKey: dutyDayInfo.assignedLieuDayKey });
                         compensationLeaveAccrual.set(staffId, currentAccrual);
                    }
                });
                
                // 5. 彙總當日數據 (報表 1)
                const staffOnOfficeDuty = staffIds.filter(id => 
                    !stationDutyStaff.has(id) && 
                    !confirmedLeaveStaffToday.has(id) && 
                    isTodayWorkingDay 
                );

                roster.push({
                    date: currentDate,
                    dateKey: dateKey,
                    isWorkingDay: isTodayWorkingDay,
                    stationAssignments: dayAssignments,
                    stationStaffCount: stationDutyStaff.size,
                    leaveStaffCount: confirmedLeaveStaffToday.size,
                    officeStaffCount: staffOnOfficeDuty.length,
                });
            }

            // --- 階段 2: 整理最終結果數據結構 ---
            const staffTotalData = Array.from(staffDutyCounts.entries()).map(([staffId, count]) => ({
                staffId,
                count,
                details: (staffDutyDetails.get(staffId) || []).sort((a: any, b: any) => a.date.localeCompare(b.date))
            })).sort((a, b) => {
                const numA = parseInt(a.staffId.substring(1));
                const numB = parseInt(b.staffId.substring(1));
                return numA - numB;
            });

            setRosterResults({
                dailyRoster: roster,
                allShifts,
                staffTotalData,
            });

        } catch (err: any) {
            console.error("生成更表時發生錯誤:", err);
            setError(`錯誤: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [inputs, staffIdOptions]);

    // --- 報表 2: 表頭結構 (使用 useMemo 確保性能) ---
    const { stationHeaders, allStationColumns } = useMemo(() => {
        if (!rosterResults) return { stationHeaders: null, allStationColumns: [], totalAssignmentColumns: 0 };
        
        const singleShiftStations = parseSingleShiftStations(inputs.singleShiftStations);
        const allStationIds = Array.from({ length: inputs.stationCount }, (_, i) => `A${i + 1}`);

        const headerRow1 = [];
        const headerRow2 = [];
        const allColumns: StationHeaderCol[] = [];
        let totalCols = 0;
        const columnWidth = 50; 

        for (const stationId of allStationIds) {
            const isSingleShift = singleShiftStations.has(stationId);
            const stationColspan = isSingleShift ? 2 : 4;
            const backgroundColor = isSingleShift ? 'bg-yellow-200/50' : 'bg-indigo-100/70';

            // Row 1: Station ID
            headerRow1.push({
                stationId,
                colspan: stationColspan,
                className: `${backgroundColor} border-r border-gray-300 font-semibold p-2`,
            });

            // Row 2: Shifts & Staff
            const shifts = [{ code: '早', staffPos: [1, 2] }];
            if (!isSingleShift) {
                shifts.push({ code: '晚', staffPos: [1, 2] });
            }

            shifts.forEach(({ code, staffPos }) => {
                staffPos.forEach(pos => {
                    const shiftKey = `${stationId}-${code}-${pos}`;
                    headerRow2.push({
                        shiftKey,
                        text: `${code}(${pos})`,
                        className: 'p-1 border-r border-gray-300 bg-indigo-200 font-medium text-[10px]',
                        style: { width: `${columnWidth}px` }
                    });
                    allColumns.push({ stationId, shift: code, position: pos });
                    totalCols++;
                });
            });
        }
        
        const tableWidth = `calc(120px + ${totalCols * columnWidth}px)`;

        return { 
            stationHeaders: { headerRow1, headerRow2, tableWidth }, 
            allStationColumns: allColumns,
            totalAssignmentColumns: totalCols 
        };

    }, [rosterResults, inputs.singleShiftStations, inputs.stationCount]);


    // --- 主渲染 ---
    return (
        <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
            <div id="app" className="max-w-6xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-2xl">
                <h1 className="text-3xl font-bold text-center mb-6 text-indigo-700">🗓️ 自動人手更表生成器</h1>
                <p className="text-center text-gray-500 mb-8 text-sm">請輸入排班所需參數。公眾假期數據為模擬值。</p>

                {/* 輸入參數區 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8 p-4 bg-indigo-50 rounded-xl shadow-inner border border-indigo-100">
                    {/* 選擇月份 */}
                    <div className="col-span-1">
                        <label htmlFor="yearMonth" className="block text-sm font-medium text-gray-700 mb-1">選擇月份</label>
                        <select 
                            id="yearMonth" 
                            value={inputs.yearMonth} 
                            onChange={handleChange} 
                            className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 text-center text-base font-semibold leading-6 transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                        >
                            {monthOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.text}</option>)}
                        </select>
                    </div>

                    {/* 總員工數 */}
                    <div className="col-span-1">
                        <label htmlFor="staffCount" className="block text-sm font-medium text-gray-700 mb-1">總員工數 (S1-S250)</label>
                        <input type="range" id="staffCount" min="1" max="250" value={inputs.staffCount} onChange={handleChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                        <div className="text-center text-lg font-semibold text-indigo-600 mt-2">S{inputs.staffCount}</div>
                    </div>

                    {/* 服務站總數 */}
                    <div className="col-span-1">
                        <label htmlFor="stationCount" className="block text-sm font-medium text-gray-700 mb-1">服務站總數 (A1-A15)</label>
                        <input type="range" id="stationCount" min="1" max="15" value={inputs.stationCount} onChange={handleChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                        <div className="text-center text-lg font-semibold text-indigo-600 mt-2">A{inputs.stationCount}</div>
                    </div>

                    {/* 起始員工 */}
                    <div className="col-span-1">
                        <label htmlFor="startStaff" className="block text-sm font-medium text-gray-700 mb-1">本月起始員工 (公平性平局參考)</label>
                        <select 
                            id="startStaff" 
                            value={inputs.startStaff} 
                            onChange={handleChange} 
                            className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 text-center text-base font-semibold leading-6 transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20"
                        >
                            {staffIdOptions.map(id => <option key={id} value={id}>{id}</option>)}
                        </select>
                    </div>
                    
                    {/* 單更服務站 */}
                    <div className="col-span-full sm:col-span-2">
                        <label htmlFor="singleShiftStations" className="block text-sm font-medium text-gray-700 mb-1">單更服務站 (用逗號分隔，例: A3,A7)</label>
                        <input 
                            type="text" 
                            id="singleShiftStations" 
                            value={inputs.singleShiftStations} 
                            onChange={handleChange} 
                            className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 text-center text-base font-semibold leading-6 transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" 
                            placeholder="A1, A5 (這些站只營運[早]更)"
                        />
                    </div>

                    {/* 特別編配要求 */}
                    <div className="col-span-full">
                        <label htmlFor="specialRequests" className="block text-sm font-medium text-gray-700 mb-1">特別編配要求 (每行一項，格式: S5 2025-12-24 A5 早)</label>
                        <textarea 
                            id="specialRequests" 
                            rows={3} 
                            value={inputs.specialRequests} 
                            onChange={handleChange} 
                            className="w-full p-3 border border-gray-300 rounded-lg resize-y font-mono text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" 
                            placeholder="S5 2025-12-24 A5 早 (S5 在 12/24 早班，A5站)&#10;S10 2025-12-25 A1 晚 (S10 在 12/25 晚班，A1站)"
                        ></textarea>
                        <p className="text-xs text-gray-500 mt-1">注意：班次代碼只能是 '早' 或 '晚'。若有補假或班次已滿，編配將被忽略。</p>
                    </div>
                    
                    <div className="col-span-full text-center mt-4">
                        <button 
                            onClick={generateRoster} 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-8 rounded-xl font-bold shadow-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto min-w-[200px]" 
                            disabled={loading}
                        >
                            {loading ? '正在生成...' : '生成更表'}
                        </button>
                    </div>
                </div>

                {/* 載入中/錯誤訊息 */}
                {loading && (
                    <div id="loading" className="text-center p-8 text-indigo-600 bg-indigo-50 rounded-lg">
                        <div className="animate-spin inline-block w-8 h-8 border-4 border-t-4 border-indigo-600 rounded-full border-t-transparent"></div>
                        <p className="mt-4 text-sm font-medium">正在計算並生成更表，請稍候...</p>
                    </div>
                )}
                {error && (
                    <div id="errorMessage" className="p-4 mt-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm font-medium" role="alert">{error}</div>
                )}


                {/* 結果展示區 */}
                {rosterResults && !loading && (
                    <div id="results" className="space-y-12 animate-fade-in">
                        <DailySummary roster={rosterResults.dailyRoster} />
                        <StationRoster 
                            dailyRoster={rosterResults.dailyRoster} 
                            allStationColumns={allStationColumns}
                            stationHeaders={stationHeaders} 
                        />
                        <StaffTotal staffTotalData={rosterResults.staffTotalData} />
                        <StaffDetails staffTotalData={rosterResults.staffTotalData} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;