/**
 * IndexedDB ストア（PWA版用）
 * ブラウザのローカルデータベースで食材データを保存
 */

// IndexedDBの設定
const DB_NAME = 'TalkFridgeDB';
const DB_VERSION = 2; // バージョンを上げて既存のDBと互換性を保つ
const STORE_INGREDIENTS = 'ingredients';
const STORE_RECIPE_HISTORY = 'recipeHistory';
const STORE_USAGE_HISTORY = 'usageHistory';

let db = null;

// データベースを初期化
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            const oldVersion = event.oldVersion;
            
            // バージョン1から2への移行
            if (oldVersion < 1 || !db.objectStoreNames.contains(STORE_INGREDIENTS)) {
                // 食材テーブル
                if (!db.objectStoreNames.contains(STORE_INGREDIENTS)) {
                    const ingredientsStore = db.createObjectStore(STORE_INGREDIENTS, { keyPath: 'id', autoIncrement: true });
                    ingredientsStore.createIndex('name', 'name', { unique: false });
                    ingredientsStore.createIndex('category', 'category', { unique: false });
                }
                
                // レシピ履歴テーブル
                if (!db.objectStoreNames.contains(STORE_RECIPE_HISTORY)) {
                    db.createObjectStore(STORE_RECIPE_HISTORY, { keyPath: 'id', autoIncrement: true });
                }
                
                // 使用履歴テーブル
                if (!db.objectStoreNames.contains(STORE_USAGE_HISTORY)) {
                    db.createObjectStore(STORE_USAGE_HISTORY, { keyPath: 'id', autoIncrement: true });
                }
            }
            
            // 将来のバージョンアップ時の処理はここに追加
        };
        
        // バージョンエラーをキャッチ
        request.onblocked = () => {
            console.warn('IndexedDBのアップグレードがブロックされています。他のタブを閉じてください。');
        };
    });
}

// 食材を取得
async function getIngredients() {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_INGREDIENTS], 'readonly');
        const store = transaction.objectStore(STORE_INGREDIENTS);
        const request = store.getAll();
        
        request.onsuccess = () => {
            const ingredients = request.result.filter(ing => ing.quantity > 0);
            resolve({ success: true, ingredients: ingredients });
        };
        request.onerror = () => reject(request.error);
    });
}

// 食材を追加（既存の食材がある場合は数量を増やす）
async function addIngredient(ingredient) {
    if (!db) await initDB();
    
    const now = new Date().toISOString();
    const data = {
        name: ingredient.name,
        quantity: ingredient.quantity || 1,
        unit: ingredient.unit || '個',
        category: ingredient.category || 'その他',
        expiry_date: ingredient.expiry_date || null,
        notes: ingredient.notes || null,
        created_at: now,
        updated_at: now
    };
    
    // 既存の食材を検索（名前・単位・カテゴリが一致するもの）
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_INGREDIENTS], 'readwrite');
        const store = transaction.objectStore(STORE_INGREDIENTS);
        const request = store.getAll();
        
        request.onsuccess = async () => {
            const existingIngredients = request.result.filter(ing => 
                ing.name === data.name && 
                ing.unit === data.unit && 
                ing.category === data.category &&
                ing.quantity > 0  // 数量が0以上（使用済みでない）
            );
            
            if (existingIngredients.length > 0) {
                // 既存の食材が見つかった場合：数量を増やす
                const existing = existingIngredients[0];  // 最初に見つかった食材を使用
                const newQuantity = existing.quantity + data.quantity;
                
                console.log(`📝 既存食材を発見: ${existing.name} (現在: ${existing.quantity}${existing.unit})`);
                console.log(`➕ 数量を追加: ${data.quantity}${data.unit} → 合計: ${newQuantity}${data.unit}`);
                
                // 数量を更新
                const updateResult = await updateIngredient(existing.id, { 
                    quantity: newQuantity,
                    updated_at: now
                });
                
                if (updateResult.success) {
                    // 使用履歴に記録
                    try {
                        await addUsageHistory(data.name, 'add', data.quantity);
                    } catch (historyError) {
                        console.warn('使用履歴の記録でエラー:', historyError);
                    }
                    resolve({ success: true });
                } else {
                    reject(new Error('食材の更新に失敗しました'));
                }
            } else {
                // 既存の食材がない場合：新規追加
                console.log(`➕ 新規食材を追加: ${data.name} ${data.quantity}${data.unit}`);
                
                const addRequest = store.add(data);
                
                addRequest.onsuccess = () => {
                    // 使用履歴に記録
                    try {
                        addUsageHistory(data.name, 'add', data.quantity);
                    } catch (historyError) {
                        console.warn('使用履歴の記録でエラー:', historyError);
                    }
                    resolve({ success: true });
                };
                addRequest.onerror = () => reject(addRequest.error);
            }
        };
        
        request.onerror = () => reject(request.error);
    });
}

// 複数の食材を追加
async function addIngredients(ingredients) {
    if (!db) await initDB();
    
    const promises = ingredients.map(ing => addIngredient(ing));
    await Promise.all(promises);
    return { success: true };
}

// 食材を使用（数量を減らす）
async function useIngredientDB(ingredientId, quantity) {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_INGREDIENTS], 'readwrite');
        const store = transaction.objectStore(STORE_INGREDIENTS);
        const getRequest = store.get(ingredientId);
        
        getRequest.onsuccess = () => {
            const ingredient = getRequest.result;
            if (!ingredient) {
                reject(new Error('食材が見つかりません'));
                return;
            }
            
            ingredient.quantity -= quantity;
            ingredient.updated_at = new Date().toISOString();
            
            if (ingredient.quantity <= 0) {
                // 数量が0以下になったら削除
                const deleteRequest = store.delete(ingredientId);
                deleteRequest.onsuccess = () => {
                    addUsageHistory(ingredient.name, 'use', quantity);
                    resolve({ success: true });
                };
                deleteRequest.onerror = () => reject(deleteRequest.error);
            } else {
                // 更新
                const updateRequest = store.put(ingredient);
                updateRequest.onsuccess = () => {
                    addUsageHistory(ingredient.name, 'use', quantity);
                    resolve({ success: true });
                };
                updateRequest.onerror = () => reject(updateRequest.error);
            }
        };
        getRequest.onerror = () => reject(getRequest.error);
    });
}

// 食材を更新
async function updateIngredient(ingredientId, updates) {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_INGREDIENTS], 'readwrite');
        const store = transaction.objectStore(STORE_INGREDIENTS);
        const getRequest = store.get(ingredientId);
        
        getRequest.onsuccess = () => {
            const ingredient = getRequest.result;
            if (!ingredient) {
                reject(new Error('食材が見つかりません'));
                return;
            }
            
            Object.assign(ingredient, updates);
            ingredient.updated_at = new Date().toISOString();
            
            const updateRequest = store.put(ingredient);
            updateRequest.onsuccess = () => resolve({ success: true });
            updateRequest.onerror = () => reject(updateRequest.error);
        };
        getRequest.onerror = () => reject(getRequest.error);
    });
}

// 使用履歴を追加
async function addUsageHistory(ingredientName, action, quantity) {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_USAGE_HISTORY], 'readwrite');
        const store = transaction.objectStore(STORE_USAGE_HISTORY);
        
        const data = {
            ingredient_name: ingredientName,
            action: action,
            quantity: quantity,
            timestamp: new Date().toISOString()
        };
        
        const request = store.add(data);
        request.onsuccess = () => resolve({ success: true });
        request.onerror = () => reject(request.error);
    });
}

// レシピ履歴を追加
async function addRecipeHistory(recipeText, ingredients) {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_RECIPE_HISTORY], 'readwrite');
        const store = transaction.objectStore(STORE_RECIPE_HISTORY);
        
        const data = {
            recipe: recipeText,
            ingredients: ingredients.map(ing => ing.name),
            created_at: new Date().toISOString()
        };
        
        const request = store.add(data);
        request.onsuccess = () => resolve({ success: true });
        request.onerror = () => reject(request.error);
    });
}

// 全データをエクスポート
async function exportAllData() {
    if (!db) await initDB();
    
    const ingredients = await getIngredients();
    const recipeHistory = await getRecipeHistory();
    const usageHistory = await getUsageHistory();
    
    return {
        version: '1.0',
        exportDate: new Date().toISOString(),
        ingredients: ingredients.ingredients || [],
        recipeHistory: recipeHistory || [],
        usageHistory: usageHistory || []
    };
}

// レシピ履歴を取得
async function getRecipeHistory() {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_RECIPE_HISTORY], 'readonly');
        const store = transaction.objectStore(STORE_RECIPE_HISTORY);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// 使用履歴を取得
async function getUsageHistory() {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_USAGE_HISTORY], 'readonly');
        const store = transaction.objectStore(STORE_USAGE_HISTORY);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// データをインポート
async function importData(data) {
    if (!db) await initDB();
    
    try {
        // データを検証
        if (!data.ingredients) {
            throw new Error('無効なバックアップファイルです');
        }
        
        // 既存のデータをクリア（オプション）
        // const transaction = db.transaction([STORE_INGREDIENTS], 'readwrite');
        // await transaction.objectStore(STORE_INGREDIENTS).clear();
        
        // 食材を復元
        if (data.ingredients && data.ingredients.length > 0) {
            await addIngredients(data.ingredients);
        }
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// 初期化
initDB().catch(err => console.error('IndexedDB初期化エラー:', err));

