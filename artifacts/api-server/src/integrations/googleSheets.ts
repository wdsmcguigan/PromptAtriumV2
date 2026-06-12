import { google } from 'googleapis';

// Read-only Sheets access via standard Google credentials:
// - GOOGLE_SHEETS_API_KEY for public sheets, or
// - a service account (GOOGLE_SERVICE_ACCOUNT_KEY / Application Default
//   Credentials) — share the sheet with the service account's client_email.
export async function getGoogleSheetClient() {
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  if (apiKey) {
    return google.sheets({ version: 'v4', auth: apiKey });
  }

  const inlineKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    ...(inlineKey ? { credentials: JSON.parse(inlineKey) } : {}),
  });

  return google.sheets({ version: 'v4', auth });
}

export interface AIService {
  name: string;
  description: string;
  category: string;
  subcategory: string;
  website: string;
  pricing: string;
  is_featured: boolean;
  features: string;
}

export async function fetchAIServices(): Promise<AIService[]> {
  try {
    const sheets = await getGoogleSheetClient();
    const spreadsheetId = '1tfOk1b_ygQfKJlLCXOS2VYH1Y8AiAAodhvvMHmDIMtg';
    
    // Get spreadsheet metadata to find the first sheet's name
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId,
    });
    
    const firstSheet = metadata.data.sheets?.[0];
    if (!firstSheet?.properties?.title) {
      throw new Error('No sheets found in spreadsheet');
    }
    
    const sheetName = firstSheet.properties.title;
    console.log(`Using sheet: ${sheetName}`);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A2:H`,
    });

    const rows = response.data.values || [];
    console.log(`Fetched ${rows.length} AI services from Google Sheets`);
    
    const services = rows.map(row => ({
      name: row[1] || '',
      description: row[3] || '',
      category: row[0] || '',
      website: row[2] || '',
      pricing: row[4] || '',
      subcategory: row[5] || '', // Column F is subcategory
      is_featured: row[6]?.toLowerCase() === 'yes' || row[6]?.toLowerCase() === 'true', // Column G is is_featured
      features: row[7] || '', // Column H is features
    }));
    
    // Log sample to debug subcategories and featured status
    console.log('Sample services:', services.slice(0, 3).map(s => ({ 
      name: s.name, 
      category: s.category, 
      subcategory: s.subcategory,
      is_featured: s.is_featured 
    })));
    
    // Count and log featured services
    const featuredCount = services.filter(s => s.is_featured).length;
    console.log(`Found ${featuredCount} featured services out of ${services.length} total`);
    
    return services;
  } catch (error) {
    console.error('Error fetching AI services from Google Sheets:', error);
    throw error;
  }
}
