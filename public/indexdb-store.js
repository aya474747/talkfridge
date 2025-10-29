/**
 * IndexedDB ストア（PWA版用）
 * ブラウザのローカルデータベースで食材データを保存
 */

// IndexedDBの設定
const DB_NAME = 'TalkFridgeDB';
const DB_VERSION = 1;
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

// 食材を追加
async function addIngredient(ingredient) {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_INGREDIENTS], 'readwrite');
        const store = transaction.objectStore(STORE_INGREDIENTS);
        
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
        
        const request = store.add(data);
        
        request.onsuccess = async () => {
            // 使用履歴に記録（エラーが発生しても続行）
            try {
                await addUsageHistory(data.name, 'add', data.quantity);
            } catch (historyError) {
                console.warn('使用履歴の記録でエラー:', historyError);
                // 履歴の記録に失敗しても、食材追加は成功とする
            }
            console.log('✅ 食材を追加:', data.name, data.quantity, data.unit);
            resolve({ success: true });
        };
        request.onerror = () => {
            console.error('❌ 食材追加エラー:', request.error);
            reject(request.error);
        };
    });
}

// 複数の食材を追加
async function addIngredients(ingredients) {
    if (!db) await initDB();
    
    console.log('📦 複数食材追加開始');
    console.log('📦 受け取った食材配列:', ingredients);
    console.log('📦 配列の長さ:', ingredients.length);
    console.log('📦 配列の内容:', JSON.stringify(ingredients, null, 2));
    
    // 配列が空または不正な場合はエラー
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
        console.error('❌ 不正な食材配列:', ingredients);
        return { success: false, added: 0, failed: 0, results: [], error: '不正な食材配列' };
    }
    
    // すべての食材を追加（エラーが発生しても可能な限り続行）
    const results = [];
    for (let i = 0; i < ingredients.length; i++) {
        const ing = ingredients[i];
        console.log(`📝 [${i + 1}/${ingredients.length}] 処理開始:`, ing);
        
        if (!ing || !ing.name) {
            console.error(`❌ [${i + 1}/${ingredients.length}] 不正な食材データ:`, ing);
            results.push({ success: false, ingredient: ing, error: '不正な食材データ' });
            continue;
        }
        
        try {
            console.log(`📝 [${i + 1}/${ingredients.length}] 追加中: ${ing.name} ${ing.quantity}${ing.unit}`);
            const result = await addIngredient(ing);
            console.log(`✅ [${i + 1}/${ingredients.length}] 追加成功: ${ing.name}`);
            results.push({ success: true, ingredient: ing, result });
        } catch (error) {
            console.error(`❌ [${i + 1}/${ingredients.length}] 追加失敗:`, ing.name, error);
            results.push({ success: false, ingredient: ing, error: error.message });
            // エラーが発生しても続行
        }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    console.log(`✅ 追加完了: 成功 ${successCount}個, 失敗 ${failCount}個`);
    console.log(`📊 結果詳細:`, results);
    
    return { 
        success: successCount > 0, 
        added: successCount,
        failed: failCount,
        results: results
    };
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

