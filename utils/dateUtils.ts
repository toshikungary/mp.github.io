import { PUBLIC_HOLIDAYS_MOCK } from './constants';

/** 格式化日期為 YYYY-MM-DD */
export const formatDate = (date: Date): string => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

/** 檢查日期是否為工作日 (週一至週五，且非公眾假期) */
export const isWorkingDay = (date: Date): boolean => {
    const dayOfWeek = date.getDay(); // 0=日, 6=六
    if (dayOfWeek === 0 || dayOfWeek === 6) return false;
    const dateString = formatDate(date);
    return !PUBLIC_HOLIDAYS_MOCK.includes(dateString);
};

/** 檢查日期是否為廣義的假日 (週六/週日/公眾假期) */
export const isHoliday = (date: Date): boolean => {
    const dayOfWeek = date.getDay(); // 0=日, 6=六
    const dateString = formatDate(date);
    return dayOfWeek === 0 || dayOfWeek === 6 || PUBLIC_HOLIDAYS_MOCK.includes(dateString);
};

/** 獲取星期幾的中文名稱 */
export const getDayOfWeekChinese = (date: Date): string => {
    return ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
};

/** 查找從指定日期開始的第 N 個工作日 (不包含 startSearchDate 當天) */
export const findNthWorkingDayAfter = (startDate: Date, n: number): Date => {
    let date = new Date(startDate);
    let count = 0;
    date.setDate(date.getDate() + 1); // 從下一天開始搜尋
    
    let safetyCounter = 0;
    while (count < n && safetyCounter < 365) { 
        if (isWorkingDay(date)) {
            count++;
        }
        if (count < n) {
            date.setDate(date.getDate() + 1);
        }
        safetyCounter++;
    }
    return date;
};