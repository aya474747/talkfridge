/**
 * Firebase クラウドバックアップ機能
 * Firebase Authentication + Firestore を使用
 */

let firebaseApp = null;
let auth = null;
let firestoreDb = null;
let currentUser = null;

// Firebaseを初期化
async function initFirebase() {
    if (firebaseApp) {
        console.log('✅ Firebaseは既に初期化されています');
        return true;
    }
    
    try {
        // Firebase SDKが読み込まれているか確認
        if (typeof firebase === 'undefined') {
            console.error('❌ Firebase SDKが読み込まれていません');
            return false;
        }
        
        // 設定を確認
        if (!FIREBASE_CONFIG || FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY') {
            console.warn('⚠️ Firebase設定がまだです。firebase-config.jsを編集してください');
            return false;
        }
        
        // Firebase初期化
        firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
        auth = firebase.auth();
        firestoreDb = firebase.firestore();
        
        // 認証状態の監視
        auth.onAuthStateChanged((user) => {
            currentUser = user;
            if (user) {
                console.log('✅ Firebase認証成功:', user.email);
                updateAuthUI();
                // 自動的にクラウドからデータを復元
                syncFromFirestore();
            } else {
                console.log('ℹ️ ログアウトしました');
                updateAuthUI();
            }
        });
        
        console.log('✅ Firebase初期化成功');
        return true;
    } catch (error) {
        console.error('❌ Firebase初期化エラー:', error);
        return false;
    }
}

// Googleログイン
async function signInWithGoogle() {
    try {
        if (!auth) {
            const initialized = await initFirebase();
            if (!initialized) {
                alert('⚠️ Firebaseが初期化できませんでした。設定を確認してください。');
                return;
            }
        }
        
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        
        console.log('✅ Googleログイン成功:', result.user.email);
        return { success: true, user: result.user };
    } catch (error) {
        console.error('❌ Googleログインエラー:', error);
        alert('❌ ログインに失敗しました: ' + error.message);
        return { success: false, error: error.message };
    }
}

// ログアウト
async function signOut() {
    try {
        if (auth) {
            await auth.signOut();
            console.log('✅ ログアウト成功');
            return { success: true };
        }
    } catch (error) {
        console.error('❌ ログアウトエラー:', error);
        return { success: false, error: error.message };
    }
}

// Firestoreにデータを保存
async function saveToFirestore(data) {
    try {
        if (!currentUser) {
            throw new Error('ログインが必要です');
        }
        
        if (!db) {
            await initFirebase();
        }
        
        const userDocRef = firestoreDb.collection('users').doc(currentUser.uid);
        const dataToSave = {
            ingredients: data.ingredients || [],
            recipeHistory: data.recipeHistory || [],
            usageHistory: data.usageHistory || [],
            foodDictionary: data.foodDictionary || [],
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await userDocRef.set(dataToSave, { merge: true });
        console.log('✅ Firestoreに保存成功');
        return { success: true };
    } catch (error) {
        console.error('❌ Firestore保存エラー:', error);
        return { success: false, error: error.message };
    }
}

// Firestoreからデータを読み込み
async function loadFromFirestore() {
    try {
        if (!currentUser) {
            throw new Error('ログインが必要です');
        }
        
        if (!db) {
            await initFirebase();
        }
        
        const userDocRef = firestoreDb.collection('users').doc(currentUser.uid);
        const doc = await userDocRef.get();
        
        if (doc.exists) {
            const data = doc.data();
            console.log('✅ Firestoreから読み込み成功');
            return { success: true, data: data };
        } else {
            console.log('ℹ️ Firestoreにデータがありません');
            return { success: true, data: null };
        }
    } catch (error) {
        console.error('❌ Firestore読み込みエラー:', error);
        return { success: false, error: error.message };
    }
}

// FirestoreとIndexedDBを同期（Firestore優先）
async function syncFromFirestore() {
    try {
        const result = await loadFromFirestore();
        if (!result.success) {
            console.warn('⚠️ Firestoreから読み込み失敗');
            return;
        }
        
        if (result.data) {
            // IndexedDBにインポート
            if (typeof importDataToDB === 'function') {
                const importResult = await importDataToDB({
                    ingredients: result.data.ingredients || [],
                    recipeHistory: result.data.recipeHistory || [],
                    usageHistory: result.data.usageHistory || []
                });
                
                if (importResult.success) {
                    console.log('✅ FirestoreからIndexedDBに同期成功');
                    // UIを更新
                    if (typeof loadIngredients === 'function') {
                        loadIngredients();
                    }
                }
            } else {
                // importDataToDBが未定義の場合は、直接addIngredientsを呼ぶ
                if (result.data.ingredients && result.data.ingredients.length > 0) {
                    if (typeof addIngredients === 'function') {
                        await addIngredients(result.data.ingredients);
                        console.log('✅ FirestoreからIndexedDBに同期成功');
                        if (typeof loadIngredients === 'function') {
                            loadIngredients();
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('❌ 同期エラー:', error);
    }
}

// 自動バックアップ（Firestoreに保存）
async function autoBackupToFirestore() {
    try {
        if (!currentUser) {
            return { success: false, error: 'ログインが必要です' };
        }
        
        // IndexedDBから全データを取得
        const ingredientsResult = await getIngredients();
        const recipeHistoryResult = await getRecipeHistory();
        const usageHistoryResult = await getUsageHistory();
        const foodDictResult = await getAllFoodDictionary();
        
        const dataToSave = {
            ingredients: ingredientsResult.ingredients || [],
            recipeHistory: recipeHistoryResult || [],
            usageHistory: usageHistoryResult || [],
            foodDictionary: foodDictResult || []
        };
        
        const result = await saveToFirestore(dataToSave);
        
        if (result.success) {
            console.log('✅ 自動バックアップ成功');
        }
        
        return result;
    } catch (error) {
        console.error('❌ 自動バックアップエラー:', error);
        return { success: false, error: error.message };
    }
}

// 認証UIを更新
function updateAuthUI() {
    const authStatusDiv = document.getElementById('firebase-auth-status');
    if (!authStatusDiv) return;
    
    if (currentUser) {
        authStatusDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: #E8F5E9; border-radius: 6px;">
                <span style="font-size: 1.2em;">✅</span>
                <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 0.9em;">ログイン中: ${currentUser.email}</div>
                    <div style="font-size: 0.75em; color: #666;">データは自動的にクラウドに保存されます</div>
                </div>
                <button class="btn btn-sm" style="background: #F44336; color: white; border: none; padding: 6px 12px; font-size: 0.85em;" onclick="signOut()">
                    ログアウト
                </button>
            </div>
        `;
    } else {
        authStatusDiv.innerHTML = `
            <div style="padding: 10px; background: #FFF3E0; border-radius: 6px;">
                <div style="font-size: 0.85em; color: #666; margin-bottom: 10px;">
                    Googleアカウントでログインすると、データが自動的にクラウドに保存されます
                </div>
                <button class="btn btn-sm" style="background: #4285F4; color: white; border: none; padding: 8px 15px; font-size: 0.9em;" onclick="signInWithGoogle()">
                    🔐 Googleアカウントでログイン
                </button>
            </div>
        `;
    }
}

// 初期化（ページ読み込み時）
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', async () => {
        // Firebase SDKの読み込みを待つ
        setTimeout(async () => {
            const initialized = await initFirebase();
            // 初期化が成功したら、ログイン状態に関わらずUIを更新
            if (initialized) {
                updateAuthUI();
            } else {
                // 初期化に失敗した場合もUIを更新（エラー表示）
                const authStatusDiv = document.getElementById('firebase-auth-status');
                if (authStatusDiv) {
                    authStatusDiv.innerHTML = `
                        <div style="padding: 10px; background: #FFEBEE; border-radius: 6px;">
                            <div style="font-size: 0.85em; color: #C62828; margin-bottom: 10px;">
                                ⚠️ Firebase設定を確認してください（firebase-config.jsを確認）
                            </div>
                            <button class="btn btn-sm" style="background: #4285F4; color: white; border: none; padding: 8px 15px; font-size: 0.9em;" onclick="location.reload()">
                                🔄 ページを再読み込み
                            </button>
                        </div>
                    `;
                }
            }
        }, 1000);
    });
}

