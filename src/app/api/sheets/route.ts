import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';

const SHEET_ID = process.env.SHEET_ID || '1XutCsA1h4lkk5UaOWpUxB0398GPz3TZDsowy3en5ewM';
const SHEET_URL = 'https://script.google.com/macros/s/AKfycby5P2zKgYGcMioqi_cTawjQ3w5ZR3dBuQ0zrzc_jDeg-dKgi0CTCjrvJIPuCNOmEHzYDQ/exec';

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
