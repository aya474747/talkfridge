/**
 * クラウドバックアップ機能
 * Google Sheets / Notion などへの自動バックアップ
 */

// Google Sheets API を使ってデータを自動バックアップ
async function backupToGoogleSheets(data, apiKey, spreadsheetId) {
    try {
        // データをシンプルな形式に変換
        const rows = [];
        rows.push(['食材名', '数量', '単位', 'カテゴリ', '登録日']);
        
        data.ingredients.forEach(ing => {
            rows.push([
                ing.name,
                ing.quantity,
                ing.unit,
                ing.category || 'その他',
                ing.created_at || new Date().toISOString()
            ]);
        });
        
        // Google Sheets APIを使用（簡易版）
        // 注：実際の実装ではOAuth認証が必要
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=RAW&key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                values: rows
            })
        });
        
        if (!response.ok) {
            throw new Error(`Google Sheets API エラー: ${response.statusText}`);
        }
        
        return { success: true, message: 'Googleスプレッドシートにバックアップしました' };
    } catch (error) {
        console.error('Google Sheets バックアップエラー:', error);
        return { success: false, error: error.message };
    }
}

// Notion API を使ってデータをバックアップ
async function backupToNotion(data, apiKey, databaseId) {
    try {
        // Notion APIを使用（簡易版）
        // 注：実際の実装では適切なNotionインテグレーションが必要
        const url = 'https://api.notion.com/v1/pages';
        
        const promises = data.ingredients.map(async (ing) => {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Notion-Version': '2022-06-28'
                },
                body: JSON.stringify({
                    parent: { database_id: databaseId },
                    properties: {
                        '食材名': {
                            title: [{ text: { content: ing.name } }]
                        },
                        '数量': {
                            number: ing.quantity
                        },
                        '単位': {
                            rich_text: [{ text: { content: ing.unit } }]
                        },
                        'カテゴリ': {
                            select: { name: ing.category || 'その他' }
                        }
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error(`Notion API エラー: ${response.statusText}`);
            }
            
            return response.json();
        });
        
        await Promise.all(promises);
        
        return { success: true, message: 'Notionにバックアップしました' };
    } catch (error) {
        console.error('Notion バックアップエラー:', error);
        return { success: false, error: error.message };
    }
}

// クラウドバックアップ設定を保存
function saveCloudBackupSettings(settings) {
    localStorage.setItem('CLOUD_BACKUP_SETTINGS', JSON.stringify(settings));
}

// クラウドバックアップ設定を取得
function getCloudBackupSettings() {
    const stored = localStorage.getItem('CLOUD_BACKUP_SETTINGS');
    return stored ? JSON.parse(stored) : null;
}

