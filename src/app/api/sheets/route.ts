import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';

const SHEET_ID = process.env.SHEET_ID || '1sPgW_Rqr8utPR48qExEZiODLW8xfyMUEfWg45t2Jz3Y';
const SHEET_URL = 'https://script.google.com/macros/s/AKfycby-QlhA0WzYMyvT6-u9jVxdTdPiBqmszOJCXR807cjaQ65Pikau8wQzIfXiMkcwmK_7/exec';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action = 'update', value, row } = body;
        if (!value) {
            return NextResponse.json(null, { status: 400 });
        }
        const params = new URLSearchParams({
            sheetId: SHEET_ID,
            action,
            value: JSON.stringify(value)
        });
        if (row) {
            params.append('row', row);
        }
        const response = await axios.get(`${SHEET_URL}?${params}`);
        return NextResponse.json(response.data);
    } catch {
        return NextResponse.json({ error: 'lỗi proxy' }, { status: 500 });
    }
}
