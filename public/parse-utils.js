/**
 * 食材解析ユーティリティ（PWA版）
 * 音声認識テキストから食材情報を抽出
 */

// 日本語の数量表現を数値に変換
function convertJapaneseNumber(text) {
    const numberMap = {
        // ひとつ、ふたつ、みっつ...
        'ひとつ': 1, '一つ': 1,
        'ふたつ': 2, '二つ': 2, 'ふた個': 2, '二個': 2,
        'みっつ': 3, '三つ': 3, 'み個': 3, '三個': 3,
        'よっつ': 4, '四つ': 4, 'よ個': 4, '四個': 4,
        'いつつ': 5, '五つ': 5, 'ご個': 5, '五個': 5,
        'むっつ': 6, '六つ': 6, 'ろっ個': 6, '六個': 6,
        'ななつ': 7, '七つ': 7, 'なな個': 7, '七個': 7,
        'やっつ': 8, '八つ': 8, 'はっ個': 8, '八個': 8,
        'ここのつ': 9, '九つ': 9, 'きゅう個': 9, '九個': 9,
        'とお': 10, '十': 10, 'じゅう個': 10, '十個': 10,
        // 一個、二個、三個...
        '一個': 1, '二個': 2, '三個': 3, '四個': 4, '五個': 5,
        '六個': 6, '七個': 7, '八個': 8, '九個': 9, '十個': 10,
        // 漢数字
        '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
        '六': 6, '七': 7, '八': 8, '九': 9, '十': 10
    };
    
    // 長いパターンから順にマッチ（例：「みっつ」を「み」より優先）
    const sortedKeys = Object.keys(numberMap).sort((a, b) => b.length - a.length);
    
    for (const key of sortedKeys) {
        if (text.includes(key)) {
            return { number: numberMap[key], matched: key, remaining: text.replace(key, '').trim() };
        }
    }
    
    return null;
}

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
    // 1. 優先：COMMON_FOOD_DICTで完全一致（確実な認識）
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

// テキストから食材名を抽出（商品名辞書を使用）
function findFoodNameInText(text) {
    text = text.trim();
    if (!text) return null;
    
    // 商品名辞書で最長一致を探す（長いものから順に）
    const sortedFoodNames = [...COMMON_FOOD_NAMES].sort((a, b) => b.length - a.length);
    
    for (const foodName of sortedFoodNames) {
        // 完全一致（最優先）
        if (text === foodName || text.trim() === foodName) {
            return foodName;
        }
    }
    
    // 部分一致をチェック
    for (const foodName of sortedFoodNames) {
        const index = text.indexOf(foodName);
        if (index >= 0) {
            const before = index > 0 ? text[index - 1] : '';
            const after = index + foodName.length < text.length ? text[index + foodName.length] : '';
            
            // 区切り文字チェック
            const isDelimiter = (char) => {
                if (!char) return true;
                return /[、，。，\s\t\n]/.test(char) || !/[あ-んア-ン一-龯]/.test(char);
            };
            
            if (isDelimiter(before) && isDelimiter(after)) {
                if (/^[あ-んア-ン一-龯]+$/.test(text) && /^[あ-んア-ン一-龯]+$/.test(foodName)) {
                    if (text.startsWith(foodName) || text.endsWith(foodName)) {
                        return foodName;
                    }
                    continue;
                }
                return foodName;
            }
        }
    }
    
    return null;
}

// テキストから食材を細かく分割
function splitIntoFoodItems(text) {
    text = text.trim();
    if (!text) return [];
    
    console.log('🔍 分割開始:', text);
    
    // 完全一致する商品名をチェック
    const sortedFoodNames = [...COMMON_FOOD_NAMES].sort((a, b) => b.length - a.length);
    for (const foodName of sortedFoodNames) {
        if (text === foodName || text === foodName.trim()) {
            console.log('✅ 完全一致の商品名:', foodName);
            return [foodName];
        }
    }
    
    // 「、」「，」「と」「とか」「スペース」で分割
    let normalizedText = text.replace(/とか/g, '、');
    const allDelimiters = /[、，と\s]+/;
    let parts = normalizedText.split(allDelimiters);
    
    // 空のパートを除外してトリム
    parts = parts.map(p => p.trim()).filter(p => p && p.length > 0);
    
    console.log('🔍 最初の分割結果:', parts);
    
    // 分割されない場合、スペースで再分割
    if (parts.length === 1) {
        const singlePart = parts[0];
        const spaceSplitParts = singlePart.split(/\s+/).map(p => p.trim()).filter(p => p && p.length > 0);
        if (spaceSplitParts.length > 1) {
            console.log('📌 スペースで再分割:', spaceSplitParts);
            parts = spaceSplitParts;
        } else {
            // 区切り文字がない場合、食材名辞書を使って分割
            console.log('🔍 区切り文字なし - 食材名辞書で分割を試行:', singlePart);
            const foodItems = [];
            let remaining = singlePart;
            
            const sortedFoodNamesForSplit = [...COMMON_FOOD_NAMES].sort((a, b) => b.length - a.length);
            
            while (remaining.length > 0) {
                let found = false;
                for (const foodName of sortedFoodNamesForSplit) {
                    if (remaining.startsWith(foodName)) {
                        foodItems.push(foodName);
                        remaining = remaining.substring(foodName.length).trim();
                        console.log(`✅ 食材名を発見: ${foodName}, 残り: ${remaining}`);
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    if (remaining.length > 0) {
                        foodItems.push(remaining);
                        console.log(`⚠️ 食材名辞書にないためそのまま追加: ${remaining}`);
                    }
                    break;
                }
            }
            
            if (foodItems.length > 1) {
                console.log('✅ 食材名辞書による分割成功:', foodItems);
                parts = foodItems;
            }
        }
    }
    
    // 各パートを処理
    const results = [];
    
    for (let part of parts) {
        part = part.trim();
        if (!part) continue;
        
        // 数量パターンをチェック
        const quantityMatch = part.match(/^(.+?)(\d+\.?\d*)(枚|個|本|ml|g|kg|l|リットル|片|パック|入り|つ|ヶ)$/);
        
        if (quantityMatch) {
            const namePart = quantityMatch[1].trim();
            const quantity = quantityMatch[2];
            const unit = quantityMatch[3];
            
            // 食材名を抽出
            const foodName = findFoodNameInText(namePart);
            
            if (foodName) {
                results.push(`${foodName}${quantity}${unit}`);
            } else {
                results.push(part);
            }
        } else {
            // 数量がない場合
            const foodName = findFoodNameInText(part);
            
            if (foodName) {
                results.push(foodName);
            } else {
                results.push(part);
            }
        }
    }
    
    console.log('✅ 最終分割結果:', results);
    return results;
}

// 音声認識テキストから食材情報を抽出（改善版）
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
        let match = item.match(/^(.+?)(\d+\.?\d*)(枚|個|本|ml|g|kg|l|リットル|片|パック|入り|つ|ヶ)$/);
        
        let name, quantity, unit;
        let japaneseNumber = null;
        
        if (match) {
            // 数字パターンでマッチ
            name = match[1].trim();
            quantity = parseFloat(match[2]);
            unit = match[3];
            console.log(`✅ 抽出成功（数字の数量）: ${name} ${quantity}${unit}`);
        } else {
            // 日本語の数量表現をチェック
            japaneseNumber = convertJapaneseNumber(item);
            
            if (japaneseNumber) {
                // 日本語の数量表現が見つかった場合
                const escapedMatch = japaneseNumber.matched.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const jpMatch = item.match(new RegExp(`^(.+?)${escapedMatch}(つ|個|枚|本|片)?$`));
                
                if (jpMatch && jpMatch[1].trim()) {
                    name = jpMatch[1].trim();
                    quantity = japaneseNumber.number;
                    unit = jpMatch[2] || '個';
                    console.log(`✅ 抽出成功（日本語数量）: ${name} ${quantity}${unit} (${japaneseNumber.matched} → ${quantity})`);
                } else {
                    const parts = item.split(/\s+/);
                    if (parts.length >= 2) {
                        const lastPart = parts[parts.length - 1];
                        const lastNumber = convertJapaneseNumber(lastPart);
                        if (lastNumber && parts.length > 1) {
                            name = parts.slice(0, -1).join(' ').trim();
                            quantity = lastNumber.number;
                            unit = '個';
                            console.log(`✅ 抽出成功（スペース区切り日本語数量）: ${name} ${quantity}${unit}`);
                        } else {
                            name = japaneseNumber.remaining || item.replace(japaneseNumber.matched, '').trim() || '食材';
                            quantity = japaneseNumber.number;
                            unit = '個';
                        }
                    } else {
                        name = japaneseNumber.remaining || '食材';
                        quantity = japaneseNumber.number;
                        unit = '個';
                    }
                }
            }
        }
        
        if (match || japaneseNumber) {
            // カテゴリを推測
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
            const matchedFood = findFoodNameInText(item);
            
            if (matchedFood) {
                console.log(`📌 商品名として登録: ${matchedFood}`);
                
                const directCategory = COMMON_FOOD_DICT[matchedFood];
                const category = directCategory || guessCategory(matchedFood);
                
                ingredients.push({
                    name: matchedFood,
                    quantity: 1,
                    unit: '個',
                    category: category
                });
            } else {
                console.log(`📌 数量なし - 食材名として登録: ${item}`);
                
                const directCategory = COMMON_FOOD_DICT[item];
                const category = directCategory || guessCategory(item);
                
                ingredients.push({
                    name: item,
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
