import React from 'react';

export interface RosterInputs {
  yearMonth: string;
  staffCount: number;
  stationCount: number;
  startStaff: string;
  singleShiftStations: string;
  specialRequests: string;
}

export interface Assignment {
  staffId: string;
  stationId: string;
  shift: string;
  special: boolean;
}

export interface DayRoster {
  date: Date;
  dateKey: string;
  isWorkingDay: boolean;
  stationAssignments: Assignment[];
  stationStaffCount: number;
  leaveStaffCount: number;
  officeStaffCount: number;
}

export interface StaffDetail {
  date: string;
  station: string;
  shift: string;
  special: boolean;
}

export interface StaffTotalData {
  staffId: string;
  count: number;
  details: StaffDetail[];
}

export interface ShiftDefinition {
  stationId: string;
  shift: string;
}

export interface RosterResults {
  dailyRoster: DayRoster[];
  allShifts: ShiftDefinition[];
  staffTotalData: StaffTotalData[];
}

export interface MonthOption {
  value: string;
  text: string;
}

export interface StationHeaderCol {
    stationId: string; 
    shift: string; 
    position: number;
}

export interface StationHeaderRow1 {
    stationId: string;
    colspan: number;
    className: string;
}

export interface StationHeaderRow2 {
    shiftKey: string;
    text: string;
    className: string;
    style: React.CSSProperties;
}

export interface StationHeaders {
    headerRow1: StationHeaderRow1[];
    headerRow2: StationHeaderRow2[];
    tableWidth: string;
}