import { CalendarEvent, SessionInfo } from '../types/f1';

const OPENF1_API_BASE = 'https://api.openf1.org/v1';

export const fetchYearCalendar = async (year: number): Promise<CalendarEvent[]> => {
    const response = await fetch(`${OPENF1_API_BASE}/meetings?year=${year}`);
    const data = await response.json();
    return data.map((meeting: any) => ({
        round_number: meeting.meeting_number,
        event_name: meeting.meeting_name,
        event_format: meeting.meeting_format,
        meeting_key: meeting.meeting_key
    }));
};

export const fetchGPSessions = async (year: number, grandPrix: string): Promise<SessionInfo[]> => {
    const response = await fetch(`${OPENF1_API_BASE}/sessions?year=${year}&meeting_key=${encodeURIComponent(grandPrix)}`);
    const data = await response.json();
    return data.map((session: any) => ({
        type: session.session_name,
        date: session.date_start,
        session_key: session.session_key
    }));
};

export const fetchSessionDrivers = async (grandPrix: string, session: string): Promise<Array<{fullName: string, nameAcronym: string}>> => {
    const response = await fetch(
        `${OPENF1_API_BASE}/drivers?meeting_key=${encodeURIComponent(grandPrix)}&session_key=${encodeURIComponent(session)}`
    );
    const data = await response.json();
    return data.map((driver: any) => ({
        fullName: `${driver.first_name} ${driver.last_name}`,
        nameAcronym: driver.name_acronym
    }));
};
