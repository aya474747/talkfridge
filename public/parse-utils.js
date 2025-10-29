/**
 * 食材解析ユーティリティ（PWA版）
 * 音声認識テキストから食材情報を抽出
 */

// カテゴリキーワード（サーバー版と同じロジック）
const CATEGORY_KEYWORDS = {
    '肉': ['鶏肉', '牛肉', '豚肉', 'ハム', 'ベーコン', 'ソーセージ', 'ウインナー', 'チキン', 'もも', 'むね', 'ささみ', 'ひき肉', 'ミンチ', 'ステーキ', 'ロース', 'バラ', 'サーロイン'],
    '乳製品': ['牛乳', 'ぎゅうにゅう', 'ミルク', 'チーズ', 'バター', 'ヨーグルト', '生クリーム', 'クリーム', 'マーガリン', 'アイス', 'アイスクリーム'],
    '野菜': ['トマト', 'きゅうり', 'にんじん', 'たまねぎ', '玉ねぎ', 'キャベツ', 'レタス', 'ほうれん草', 'ほうれんそう', '大根', 'かぼちゃ', 'ピーマン', 'なす', 'ナス', 'ブロッコリー', '白菜', 'もやし'],
    'きのこ': ['しいたけ', 'まいたけ', 'えのき', 'しめじ', 'きのこ', 'マッシュルーム'],
    '穀物': ['米', 'ご飯', 'パン', 'パスタ', 'うどん', 'そば', 'ラーメン', '小麦粉', 'お好み焼き粉'],
    '調味料': ['醤油', '味噌', '塩', '砂糖', 'こしょう', '胡椒', '油', 'サラダ油', 'オリーブオイル', '酢', 'みりん'],
    '加工食品': ['豆腐', '納豆', 'こんにゃく', 'しらたき', 'わかめ', 'のり', '海苔', 'かつお節', 'だし', 'インスタント', 'カップ麺', 'レトルト'],
    'その他': []
};

// よくある食材名・商品名辞書（優先度高い）
const COMMON_FOOD_NAMES = [
    // 野菜
    '玉ねぎ', 'たまねぎ', 'ねぎ', 'にんじん', 'キャベツ', 'トマト', 'きゅうり', 'ピーマン', 
    'なす', 'ナス', '白菜', '大根', 'かぼちゃ', 'ブロッコリー', 'ほうれん草', 'ほうれんそう',
    'レタス', 'もやし', 'ゴボウ', 'ごぼう', 'レンコン', 'れんこん',
    
    // 商品名・加工食品
    'プチッと鍋', 'プチッと', 'プチっと鍋', 'プチっと', 'Puchitto Nabe',
    'チキンラーメン', 'カップヌードル', 'インスタントラーメン',
    
    // きのこ
    'しいたけ', 'まいたけ', 'えのき', 'しめじ', 'エリンギ', 'マッシュルーム',
    
    // 肉・魚
    '鶏肉', '牛肉', '豚肉', 'ハム', 'ベーコン', 'ソーセージ', 'ウインナー',
    
    // その他
    '豆腐', '納豆', 'こんにゃく', 'わかめ', 'のり', '海苔'
];

// 特別なマッチング（より具体的なキーワードを優先）
const SPECIAL_MATCHES = {
    '牛乳': '乳製品',
    'ぎゅうにゅう': '乳製品',
    'ミルク': '乳製品',
    'Puchitto Nabe': '加工食品',
    'プチッと鍋': '加工食品',
    'プチっと鍋': '加工食品',
    'プチッと': '加工食品',
    'プチっと': '加工食品'
};

// カテゴリを推測
function guessCategory(name) {
    // 特別なマッチングをチェック
    const lowerName = name.toLowerCase();
    for (const [keyword, category] of Object.entries(SPECIAL_MATCHES)) {
        if (lowerName.includes(keyword.toLowerCase())) {
            return category;
        }
    }
    
    // 通常のキーワードマッチング（長いキーワードを優先）
    const sortedCategories = Object.entries(CATEGORY_KEYWORDS).sort((a, b) => {
        // より多くのキーワードを持つカテゴリを優先
        return b[1].length - a[1].length;
    });
    
    for (const [category, keywords] of sortedCategories) {
        for (const keyword of keywords) {
            if (name.includes(keyword)) {
                return category;
            }
        }
    }
    
    return 'その他';
}

// 食材名を抽出（商品名辞書を使用）
function extractFoodName(text) {
    // まず商品名辞書で完全一致をチェック
    for (const foodName of COMMON_FOOD_NAMES) {
        if (text.includes(foodName)) {
            // 商品名の前後を確認して、単語境界で区切られているかチェック
            const index = text.indexOf(foodName);
            const before = index > 0 ? text[index - 1] : '';
            const after = index + foodName.length < text.length ? text[index + foodName.length] : '';
            
            // 単語境界（空白、数字、記号など）で区切られている場合
            if (!/[あ-んア-ン一-龯]/.test(before) && !/[あ-んア-ン一-龯]/.test(after)) {
                return foodName;
            }
        }
    }
    
    return null;
}

// テキストから食材を細かく分割
function splitIntoFoodItems(text) {
    const items = [];
    
    // 1. まず「、」や「と」で大まかに分割
    let parts = text.split(/[、，]/);
    
    // 2. 各パートをさらに「と」で分割
    parts = parts.flatMap(part => part.split(/[と]/));
    
    // 3. よくある食材名を探して、さらに細かく分割
    const results = [];
    
    for (let part of parts) {
        part = part.trim();
        if (!part) continue;
        
        // 商品名辞書に完全一致するものがあれば、それを使う
        const matchedFood = extractFoodName(part);
        
        if (matchedFood) {
            // 商品名が見つかった場合、それを抽出し、残りも処理
            const index = part.indexOf(matchedFood);
            const before = part.substring(0, index).trim();
            const after = part.substring(index + matchedFood.length).trim();
            
            // 商品名を追加
            results.push(matchedFood);
            
            // 前に何かあれば処理
            if (before) {
                // 数量パターンを探す
                const beforeMatch = before.match(/(.+?)(\d+\.?\d*)(枚|個|本|ml|g|kg|l|リットル|片|パック|入り|つ|ヶ)$/);
                if (beforeMatch) {
                    results.push(beforeMatch[1].trim() + beforeMatch[2] + beforeMatch[3]);
                } else {
                    results.push(...splitIntoFoodItems(before));
                }
            }
            
            // 後ろに何かあれば処理
            if (after) {
                results.push(...splitIntoFoodItems(after));
            }
        } else {
            // 商品名が見つからない場合、元の処理（数量パターンを探す）
            results.push(part);
        }
    }
    
    return results;
}

// 音声認識テキストから食材情報を抽出
function parseIngredients(text) {
    console.log('📝 受信したテキスト:', text);
    
    const ingredients = [];
    
    // 改善された分割ロジック
    const items = splitIntoFoodItems(text);
    
    console.log('📦 分割したアイテム:', items);
    
    for (let item of items) {
        item = item.trim();
        if (!item) continue;
        
        // 「食材名 + 数量 + 単位」を抽出
        // 例: "鶏肉2枚" → name="鶏肉", quantity=2, unit="枚"
        const match = item.match(/^(.+?)(\d+\.?\d*)(枚|個|本|ml|g|kg|l|リットル|片|パック|入り|つ|ヶ)$/);
        
        if (match) {
            const name = match[1].trim();
            const quantity = parseFloat(match[2]);
            const unit = match[3];
            
            console.log(`✅ 抽出成功（数量あり）: ${name} ${quantity}${unit}`);
            
            // カテゴリを推測
            const category = guessCategory(name);
            
            ingredients.push({
                name: name,
                quantity: quantity,
                unit: unit,
                category: category
            });
        } else {
            // 数量が指定されていない場合
            // まず商品名辞書でチェック
            const matchedFood = extractFoodName(item);
            
            if (matchedFood) {
                // 商品名として認識
                console.log(`📌 商品名として登録: ${matchedFood}`);
                
                const category = guessCategory(matchedFood);
                
                ingredients.push({
                    name: matchedFood,
                    quantity: 1,
                    unit: '個',
                    category: category
                });
            } else {
                // 通常の食材名として処理
                console.log(`📌 数量なし - 食材名として登録: ${item}`);
                
                const category = guessCategory(item);
                
                ingredients.push({
                    name: item,  // 食材名をそのまま使用
                    quantity: 1,
                    unit: '個',
                    category: category
                });
            }
        }
    }
    
    console.log(`🍽️ 抽出された食材数: ${ingredients.length}`);
    
    return {
        success: true,
        ingredients: ingredients,
        debug: {
            original_text: text,
            parsed_items: items,
            success_count: ingredients.length
        }
    };
}

