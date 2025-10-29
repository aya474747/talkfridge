/**
 * IndexedDB ストア（PWA版用）
 * ブラウザのローカルデータベースで食材データを保存
 */

// IndexedDBの設定
const DB_NAME = 'TalkFridgeDB';
const DB_VERSION = 2;  // ユーザー辞書追加でバージョンアップ
const STORE_INGREDIENTS = 'ingredients';
const STORE_RECIPE_HISTORY = 'recipeHistory';
const STORE_USAGE_HISTORY = 'usageHistory';
const STORE_FOOD_DICT = 'foodDictionary';  // ユーザー追加の食材辞書

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
            
            // ユーザー辞書テーブル（食材名とカテゴリのマッピング）
            if (!db.objectStoreNames.contains(STORE_FOOD_DICT)) {
                const dictStore = db.createObjectStore(STORE_FOOD_DICT, { keyPath: 'id', autoIncrement: true });
                dictStore.createIndex('name', 'name', { unique: true });  // 食材名は重複不可
                dictStore.createIndex('category', 'category', { unique: false });
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
                    quantity: newQuantity 
                });
                
                if (updateResult.success) {
                    // 使用履歴に記録
                    try {
                        await addUsageHistory(data.name, 'add', data.quantity);
                    } catch (historyError) {
                        console.warn('使用履歴の記録でエラー:', historyError);
                    }
                    console.log(`✅ 既存食材の数量を更新: ${existing.name} ${newQuantity}${existing.unit}`);
                    resolve({ success: true, merged: true, existingId: existing.id });
                } else {
                    reject(new Error('既存食材の数量更新に失敗しました'));
                }
            } else {
                // 既存の食材がない場合：新しい食材として追加
                const addRequest = store.add(data);
                
                addRequest.onsuccess = async () => {
                    // 使用履歴に記録（エラーが発生しても続行）
                    try {
                        await addUsageHistory(data.name, 'add', data.quantity);
                    } catch (historyError) {
                        console.warn('使用履歴の記録でエラー:', historyError);
                    }
                    console.log('✅ 新しい食材を追加:', data.name, data.quantity, data.unit);
                    resolve({ success: true, merged: false });
                };
                addRequest.onerror = () => {
                    console.error('❌ 食材追加エラー:', addRequest.error);
                    reject(addRequest.error);
                };
            }
        };
        
        request.onerror = () => {
            console.error('❌ 食材検索エラー:', request.error);
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
            console.log(`📝 [${i + 1}/${ingredients.length}] 処理中: ${ing.name} ${ing.quantity}${ing.unit}`);
            const result = await addIngredient(ing);
            
            if (result.merged) {
                console.log(`🔄 [${i + 1}/${ingredients.length}] 既存食材に統合: ${ing.name}`);
            } else {
                console.log(`✅ [${i + 1}/${ingredients.length}] 新規食材を追加: ${ing.name}`);
            }
            
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

// ========== ユーザー辞書機能 ==========

// ユーザー辞書に食材を追加
async function addFoodToDictionary(name, category) {
    if (!db) await initDB();
    
    if (!name || !category) {
        return { success: false, error: '食材名とカテゴリを入力してください' };
    }
    
    return new Promise((resolve) => {
        const transaction = db.transaction([STORE_FOOD_DICT], 'readwrite');
        const store = transaction.objectStore(STORE_FOOD_DICT);
        
        // 既存の名前をチェック（重複防止）
        const index = store.index('name');
        const checkRequest = index.get(name);
        
        checkRequest.onsuccess = () => {
            if (checkRequest.result) {
                // 既に存在する場合は更新
                const existing = checkRequest.result;
                existing.category = category;
                const updateRequest = store.put(existing);
                updateRequest.onsuccess = () => resolve({ success: true, message: '辞書を更新しました' });
                updateRequest.onerror = () => resolve({ success: false, error: '更新に失敗しました' });
            } else {
                // 新規追加
                const newEntry = { name: name, category: category };
                const addRequest = store.add(newEntry);
                addRequest.onsuccess = () => resolve({ success: true, message: '辞書に追加しました' });
                addRequest.onerror = () => resolve({ success: false, error: '追加に失敗しました' });
            }
        };
        checkRequest.onerror = () => resolve({ success: false, error: 'チェックに失敗しました' });
    });
}

// ユーザー辞書から食材を削除
async function removeFoodFromDictionary(name) {
    if (!db) await initDB();
    
    return new Promise((resolve) => {
        const transaction = db.transaction([STORE_FOOD_DICT], 'readwrite');
        const store = transaction.objectStore(STORE_FOOD_DICT);
        const index = store.index('name');
        const request = index.get(name);
        
        request.onsuccess = () => {
            if (request.result) {
                const deleteRequest = store.delete(request.result.id);
                deleteRequest.onsuccess = () => resolve({ success: true, message: '辞書から削除しました' });
                deleteRequest.onerror = () => resolve({ success: false, error: '削除に失敗しました' });
            } else {
                resolve({ success: false, error: '見つかりませんでした' });
            }
        };
        request.onerror = () => resolve({ success: false, error: '検索に失敗しました' });
    });
}

// ユーザー辞書から食材名で検索（カテゴリ取得）
async function getFoodCategoryFromDictionary(name) {
    if (!db) await initDB();
    
    return new Promise((resolve) => {
        const transaction = db.transaction([STORE_FOOD_DICT], 'readonly');
        const store = transaction.objectStore(STORE_FOOD_DICT);
        const index = store.index('name');
        const request = index.get(name);
        
        request.onsuccess = () => {
            if (request.result) {
                resolve({ success: true, category: request.result.category });
            } else {
                resolve({ success: false });
            }
        };
        request.onerror = () => resolve({ success: false });
    });
}

// ユーザー辞書の全件取得
async function getAllFoodDictionary() {
    if (!db) await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_FOOD_DICT], 'readonly');
        const store = transaction.objectStore(STORE_FOOD_DICT);
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

