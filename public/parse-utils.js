/**
 * 食材解析ユーティリティ（PWA版）
 * 音声認識テキストから食材情報を抽出
 */

// カテゴリキーワード（サーバー版と同じロジック）
const CATEGORY_KEYWORDS = {
    '肉': ['鶏肉', '牛肉', '豚肉', 'ハム', 'ベーコン', 'ソーセージ', 'ウインナー', 'チキン', 'もも', 'むね', 'ささみ', 'ひき肉', 'ミンチ', 'ステーキ', 'ロース', 'バラ', 'サーロイン'],
    '乳製品': ['牛乳', 'ぎゅうにゅう', 'ミルク', 'チーズ', 'バター', 'ヨーグルト', '生クリーム', 'クリーム', 'マーガリン', 'アイス', 'アイスクリーム'],
    '野菜': ['トマト', 'きゅうり', 'にんじん', '人参', 'たまねぎ', '玉ねぎ', 'キャベツ', 'レタス', 'ほうれん草', 'ほうれんそう', '大根', 'かぼちゃ', 'ピーマン', 'なす', 'ナス', 'ブロッコリー', '白菜', 'もやし', 'じゃがいも', 'ジャガイモ', 'ゴボウ', 'ごぼう', 'レンコン', 'れんこん', 'さつまいも', 'サツマイモ'],
    'きのこ': ['しいたけ', 'まいたけ', 'えのき', 'しめじ', 'きのこ', 'マッシュルーム'],
    '穀物': ['米', 'ご飯', 'パン', 'パスタ', 'うどん', 'そば', 'ラーメン', '小麦粉', 'お好み焼き粉'],
    '調味料': ['醤油', '味噌', '塩', '砂糖', 'こしょう', '胡椒', '油', 'サラダ油', 'オリーブオイル', '酢', 'みりん'],
    '加工食品': ['豆腐', '納豆', 'こんにゃく', 'しらたき', 'わかめ', 'のり', '海苔', 'かつお節', 'だし', 'インスタント', 'カップ麺', 'レトルト'],
    'その他': []
};

// よくある食材名・商品名とカテゴリのマッピング（優先度最高）
const COMMON_FOOD_DICT = {
    // 野菜（確実に認識）
    '玉ねぎ': '野菜',
    'たまねぎ': '野菜',
    'ねぎ': '野菜',
    'にんじん': '野菜',
    '人参': '野菜',
    'じゃがいも': '野菜',
    'ジャガイモ': '野菜',
    'キャベツ': '野菜',
    'トマト': '野菜',
    'きゅうり': '野菜',
    'ピーマン': '野菜',
    'なす': '野菜',
    'ナス': '野菜',
    '白菜': '野菜',
    '大根': '野菜',
    'かぼちゃ': '野菜',
    'ブロッコリー': '野菜',
    'ほうれん草': '野菜',
    'ほうれんそう': '野菜',
    'レタス': '野菜',
    'もやし': '野菜',
    'ゴボウ': '野菜',
    'ごぼう': '野菜',
    'レンコン': '野菜',
    'れんこん': '野菜',
    'さつまいも': '野菜',
    'サツマイモ': '野菜',
    '里芋': '野菜',
    'さといも': '野菜',
    '長ねぎ': '野菜',
    '長ネギ': '野菜',
    'わけぎ': '野菜',
    
    // きのこ
    'しいたけ': 'きのこ',
    'まいたけ': 'きのこ',
    'えのき': 'きのこ',
    'しめじ': 'きのこ',
    'エリンギ': 'きのこ',
    'マッシュルーム': 'きのこ',
    
    // 商品名・加工食品
    'プチッと鍋': '加工食品',
    'プチっと鍋': '加工食品',
    'プチッと': '加工食品',
    'プチっと': '加工食品',
    'Puchitto Nabe': '加工食品',
    'チキンラーメン': '加工食品',
    'カップヌードル': '加工食品',
    'インスタントラーメン': '加工食品',
    
    // 肉・魚
    '鶏肉': '肉',
    '牛肉': '肉',
    '豚肉': '肉',
    'ハム': '肉',
    'ベーコン': '肉',
    'ソーセージ': '肉',
    'ウインナー': '肉',
    'チキン': '肉',
    
    // その他
    '豆腐': '加工食品',
    '納豆': '加工食品',
    'こんにゃく': '加工食品',
    'わかめ': '加工食品',
    'のり': '加工食品',
    '海苔': '加工食品'
};

// よくある食材名リスト（後方互換性のため）
const COMMON_FOOD_NAMES = Object.keys(COMMON_FOOD_DICT);

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

// カテゴリを推測（改善版：確実な認識を優先）
function guessCategory(name) {
    // 1. 最優先：COMMON_FOOD_DICTで完全一致（確実な認識）
    if (COMMON_FOOD_DICT[name]) {
        return COMMON_FOOD_DICT[name];
    }
    
    // 2. 特別なマッチングをチェック
    const lowerName = name.toLowerCase();
    for (const [keyword, category] of Object.entries(SPECIAL_MATCHES)) {
        if (lowerName === keyword.toLowerCase() || lowerName.includes(keyword.toLowerCase())) {
            return category;
        }
    }
    
    // 3. COMMON_FOOD_DICTで部分一致をチェック（完全一致がない場合）
    for (const [foodName, category] of Object.entries(COMMON_FOOD_DICT)) {
        if (name.includes(foodName) || foodName.includes(name)) {
            // 長い名前を優先
            if (foodName.length >= name.length) {
                return category;
            }
        }
    }
    
    // 4. 通常のキーワードマッチング（長いキーワードを優先）
    const sortedCategories = Object.entries(CATEGORY_KEYWORDS).sort((a, b) => {
        // より多くのキーワードを持つカテゴリを優先
        return b[1].length - a[1].length;
    });
    
    for (const [category, keywords] of sortedCategories) {
        // キーワードを長いものから順に並べ替え
        const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);
        for (const keyword of sortedKeywords) {
            if (name.includes(keyword)) {
                return category;
            }
        }
    }
    
    return 'その他';
}

// テキストから食材名を抽出（商品名辞書を使用、完全版）
function findFoodNameInText(text) {
    text = text.trim();
    if (!text) return null;
    
    // 商品名辞書で最長一致を探す（長いものから順に）
    // 特に「プチっと鍋」のような商品名を優先
    const sortedFoodNames = [...COMMON_FOOD_NAMES].sort((a, b) => b.length - a.length);
    
    for (const foodName of sortedFoodNames) {
        // 1. 完全一致（最優先）
        if (text === foodName || text.trim() === foodName) {
            return foodName;
        }
    }
    
    // 2. 部分一致をチェック（完全一致がない場合）
    for (const foodName of sortedFoodNames) {
        // テキストが食材名を含んでいるか
        const index = text.indexOf(foodName);
        if (index >= 0) {
            const before = index > 0 ? text[index - 1] : '';
            const after = index + foodName.length < text.length ? text[index + foodName.length] : '';
            
            // 区切り文字チェック関数
            const isDelimiter = (char) => {
                if (!char) return true;
                // 区切り文字：、とスペース、句読点、または非日本語文字
                return /[、，。，\s\t\n]/.test(char) || !/[あ-んア-ン一-龯]/.test(char);
            };
            
            // 前後が区切り文字の場合（単語境界として認識）
            if (isDelimiter(before) && isDelimiter(after)) {
                // ただし、テキスト全体が日本語のみで、かつ食材名自体が日本語の場合
                // 完全一致または単語境界での一致のみを許可
                if (/^[あ-んア-ン一-龯]+$/.test(text) && /^[あ-んア-ン一-龯]+$/.test(foodName)) {
                    // 日本語のみの場合は、完全一致、または始端/終端の一致のみ
                    if (text.startsWith(foodName) || text.endsWith(foodName)) {
                        return foodName;
                    }
                    // 途中に含まれる場合はスキップ（「プチ」が「プチっと鍋」から抽出されないように）
                    continue;
                }
                // 非日本語文字が含まれる場合は、部分一致を許可
                return foodName;
            }
        }
    }
    
    return null;
}

// テキストから食材を細かく分割（完全版）
function splitIntoFoodItems(text) {
    text = text.trim();
    if (!text) return [];
    
    console.log('🔍 分割開始:', text);
    
    // 0. まず完全一致する商品名（長いもの）をチェック（分割前に保護）
    const sortedFoodNames = [...COMMON_FOOD_NAMES].sort((a, b) => b.length - a.length);
    for (const foodName of sortedFoodNames) {
        if (text === foodName || text === foodName.trim()) {
            console.log('✅ 完全一致の商品名:', foodName);
            // 完全一致する場合はそのまま返す（分割しない）
            return [foodName];
        }
    }
    
    // 1. 「、」「，」「と」「スペース」で分割（正規表現で一括処理）
    // 音声認識では「、」「と」「スペース」が混在する可能性がある
    // スペースは連続している場合は1つとして扱う
    const allDelimiters = /[、，と\s]+/;
    let parts = text.split(allDelimiters);
    
    // 2. 空のパートを除外してトリム
    parts = parts.map(p => p.trim()).filter(p => p && p.length > 0);
    
    console.log('🔍 最初の分割結果:', parts);
    console.log('🔍 分割パート数:', parts.length);
    
    // もし分割されない場合（区切り文字がない）、スペースで再度分割を試みる
    if (parts.length === 1) {
        const singlePart = parts[0];
        
        // スペースで再度分割を試みる（音声認識が区切り文字を使わない場合）
        const spaceSplitParts = singlePart.split(/\s+/).map(p => p.trim()).filter(p => p && p.length > 0);
        if (spaceSplitParts.length > 1) {
            console.log('📌 スペースで再分割:', spaceSplitParts);
            parts = spaceSplitParts;
        } else {
            // 商品名辞書に完全一致するものがあるか
            const matchedFood = findFoodNameInText(singlePart);
            if (matchedFood && matchedFood !== singlePart) {
                // 商品名が見つかったが、完全一致ではない場合は分割が必要
                console.log('📌 単一パート、商品名部分一致:', matchedFood);
            } else if (matchedFood === singlePart) {
                // 完全一致
                console.log('✅ 完全一致の商品名:', matchedFood);
                return [singlePart];
            }
        }
    }
    
    // 3. 各パートを処理
    const results = [];
    
    for (let part of parts) {
        part = part.trim();
        if (!part) continue;
        
        // 数量パターンをチェック
        const quantityMatch = part.match(/^(.+?)(\d+\.?\d*)(枚|個|本|ml|g|kg|l|リットル|片|パック|入り|つ|ヶ)$/);
        
        if (quantityMatch) {
            // 数量がある場合
            const namePart = quantityMatch[1].trim();
            const quantity = quantityMatch[2];
            const unit = quantityMatch[3];
            
            // 食材名を抽出（商品名辞書を優先）
            const foodName = findFoodNameInText(namePart);
            
            if (foodName) {
                results.push(`${foodName}${quantity}${unit}`);
            } else {
                // 食材名が見つからない場合、そのまま使用
                results.push(part);
            }
        } else {
            // 数量がない場合
            // まず商品名辞書で完全一致または部分一致をチェック
            const foodName = findFoodNameInText(part);
            
            if (foodName) {
                // 商品名が見つかった場合、それを使用
                results.push(foodName);
            } else {
                // 商品名が見つからない場合、パート全体を食材名として使用
                results.push(part);
            }
        }
    }
    
    console.log('✅ 最終分割結果:', results);
    return results;
}

// 音声認識テキストから食材情報を抽出
function parseIngredients(text) {
    console.log('📝 受信したテキスト:', text);
    
    const ingredients = [];
    
    // 改善された分割ロジック
    const items = splitIntoFoodItems(text);
    
    console.log('📦 分割したアイテム:', items);
    console.log('📊 アイテム数:', items.length);
    
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
            
            // カテゴリを推測（COMMON_FOOD_DICTを優先）
            const directCategory = COMMON_FOOD_DICT[name];
            const category = directCategory || guessCategory(name);
            
            console.log(`📊 カテゴリ: ${name} → ${category}${directCategory ? ' (辞書直接)' : ' (推測)'}`);
            
            ingredients.push({
                name: name,
                quantity: quantity,
                unit: unit,
                category: category
            });
        } else {
            // 数量が指定されていない場合
            // 商品名辞書でチェック
            const matchedFood = findFoodNameInText(item);
            
            if (matchedFood) {
                // 商品名として認識
                console.log(`📌 商品名として登録: ${matchedFood}`);
                
                // COMMON_FOOD_DICTから直接カテゴリを取得（確実）
                const category = COMMON_FOOD_DICT[matchedFood] || guessCategory(matchedFood);
                
                ingredients.push({
                    name: matchedFood,
                    quantity: 1,
                    unit: '個',
                    category: category
                });
            } else {
                // 通常の食材名として処理
                console.log(`📌 数量なし - 食材名として登録: ${item}`);
                
                // まずCOMMON_FOOD_DICTでチェック（確実な認識）
                const directCategory = COMMON_FOOD_DICT[item];
                const category = directCategory || guessCategory(item);
                
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

