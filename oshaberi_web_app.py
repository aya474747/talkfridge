"""
おしゃべり冷蔵庫 - メインのWebアプリケーション
Gemini API と連携して食材管理とレシピ提案を行う
"""

import os
import re
from flask import Flask, render_template, request, jsonify
from datetime import datetime, date
import google.generativeai as genai
from ingredients_database import IngredientsDatabase
from dotenv import load_dotenv

# .envファイルを読み込む
load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'oshaberi-reizoko-secret-key')

# Gemini API の初期化
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    # 最新のFlashモデルを使用
    gemini_model = genai.GenerativeModel('models/gemini-2.0-flash')
else:
    gemini_model = None

# データベース初期化
db = IngredientsDatabase()

# カテゴリ推測のキーワード（詳細版）
CATEGORY_KEYWORDS = {
    '肉': ['牛肉', '鶏肉', '豚肉', '鶏胸肉', '鶏もも肉', 'ステーキ', 'ロース', 'ヒレ',
            'チキン', '豚バラ', 'ハム', 'ベーコン', 'ソーセージ', 'ウインナー',
            '鮭', 'サーモン', '鯖', 'サバ', 'マグロ', 'ウナギ', 'カツオ', 'さんま', 'イワシ', 'アジ', 'しらす', 'ツナ', '魚肉'],
    '野菜': ['もやし', '豆もやし', 'トマト', 'ニンジン', '人参', 'キャベツ', '玉ねぎ', '玉葱',
              'きゅうり', 'キュウリ', 'ピーマン', '白菜', '大根', 'だいこん', 'ごぼう',
              'レタス', 'ほうれん草', 'ほうれんそう', '小松菜', 'チンゲン菜', '水菜',
              'ブロッコリー', 'カリフラワー', 'さやいんげん', 'いんげん', 'ネギ', '長ネギ',
              'みょうが', '生姜', 'ニンニク', 'ジャガイモ', 'たまねぎ'],
    'きのこ': ['まいたけ', 'マイタケ', '舞茸', 'えのき', 'えのき茸', 'えのきたけ',
                'しいたけ', 'シイタケ', 'しめじ', 'シメジ', 'ぶなしめじ', 'ブナシメジ',
                'なめこ', 'ナメコ', 'マッシュルーム', 'きのこ',
                'エリンギ', 'エノキタケ', 'エノキ茸'],
    '乳製品': ['牛乳', 'ぎゅうにゅう', '乳製品', 'チーズ', 'ヨーグルト', 'バター', '生クリーム', 'クリーム',
                'マーガリン', 'プロセスチーズ', 'ミルク'],
    '穀物': ['米', 'ご飯', 'ごはん', 'パン', '食パン', 'フランスパン', 'クロワッサン',
              '麺', 'うどん', 'そば', 'スパゲッティ', 'パスタ', 'ラーメン',
              'そうめん', '冷やし中華', '中華麺'],
    '調味料': ['醤油', 'しょうゆ', '味噌', 'みそ', '塩', 'しお', '砂糖', 'さとう',
                '胡椒', 'こしょう', '油', 'サラダ油', 'オリーブ油', 'ごま油',
                '酢', 'マヨネーズ', 'ケチャップ', 'ソース', 'ウスターソース'],
    '加工食品': ['プチッと鍋', '即席麺', 'カップ麺', '冷凍食品', '鍋', 'なべ',
                  'じゃがりこ', 'ポテトチップス', 'スナック', '菓子'],
    'その他': []
}

def guess_category(name):
    """食材名からカテゴリを推測"""
    # 大文字小文字を区別しない
    name_lower = name.lower()
    
    # 特定のキーワードを優先的にチェック（短いキーワードで誤判定を防ぐ）
    # 「牛乳」は「乳製品」として判定されるように、「牛」単独よりも「牛乳」を優先
    special_matches = {
        '牛乳': '乳製品',
        'ぎゅうにゅう': '乳製品',
        'チーズ': '乳製品',
        'ヨーグルト': '乳製品',
        '牛肉': '肉',
        '鶏肉': '肉',
        '豚肉': '肉',
    }
    
    # 特殊なマッチを優先的にチェック
    for keyword, category in special_matches.items():
        if keyword.lower() in name_lower:
            print(f"🏷️ カテゴリ判定: {name} → {category} (特別キーワード: {keyword})")
            return category
    
    # 通常のキーワードを長い順にチェック
    for category, keywords in CATEGORY_KEYWORDS.items():
        # 長いキーワードから順にチェック
        sorted_keywords = sorted(keywords, key=len, reverse=True)
        for keyword in sorted_keywords:
            if keyword.lower() in name_lower:
                print(f"🏷️ カテゴリ判定: {name} → {category} (キーワード: {keyword})")
                return category
    
    print(f"🏷️ カテゴリ判定: {name} → その他")
    return 'その他'

@app.route('/')
def index():
    """メインページ"""
    return render_template('oshaberi.html')

@app.route('/api/parse-ingredients', methods=['POST'])
def parse_ingredients():
    """音声認識されたテキストから食材情報を抽出"""
    data = request.get_json()
    text = data.get('text', '')
    
    print(f"📝 受信したテキスト: {text}")  # デバッグ用
    
    ingredients = []
    
    # カンマで分割（「と」は数字の前のものだけ区切りとして使用）
    # 例: "プチッと鍋、トマト3個" → ["プチッと鍋", "トマト3個"]
    # 例: "鶏肉とトマト2個" → ["鶏肉", "トマト2個"]
    
    # まずカンマで分割
    comma_split = re.split(r'[、，]', text)
    items = []
    
    for item in comma_split:
        # 数字の前の「と」だけを区切りとして使用
        # 「〇〇と〇〇2個」→ 「〇〇」と「〇〇2個」に分割
        # 「プチッと」は数字がないので分割されない
        parts = re.split(r'と(?=\d+[枚個本mlgkgリットル片パック入りつヶ])', item)
        items.extend([p.strip() for p in parts if p.strip()])
    
    print(f"📦 分割したアイテム: {items}")  # デバッグ用
    
    for item in items:
        item = item.strip()
        if not item:
            continue
        
        # 「食材名 + 数量 + 単位」を抽出
        # 例: "プチッと鍋2つ" → name="プチッと鍋", quantity=2, unit="つ"
        # 例: "鶏肉2枚" → name="鶏肉", quantity=2, unit="枚"
        match = re.match(r'(.+?)(\d+\.?\d*)(枚|個|本|ml|g|kg|l|リットル|片|パック|入り|つ|ヶ)', item)
        
        if match:
            name = match.group(1).strip()
            quantity = float(match.group(2))
            unit = match.group(3)
            
            print(f"✅ 抽出成功: {name} {quantity}{unit}")  # デバッグ用
            
            # カテゴリを推測（商品名が特殊でもカテゴリ推測は試みる）
            category = guess_category(name)
            
            ingredients.append({
                'name': name,  # 商品名をそのまま保持
                'quantity': quantity,
                'unit': unit,
                'category': category
            })
        else:
            # 数値がない場合は1個として登録
            print(f"⚠️ 数量が見つからないので1個として登録: {item}")
            
            category = guess_category(item)
            
            ingredients.append({
                'name': item,  # 商品名をそのまま保持
                'quantity': 1,
                'unit': '個',
                'category': category
            })
    
    print(f"🍽️ 抽出された食材数: {len(ingredients)}")  # デバッグ用
    
    return jsonify({
        'success': True,
        'ingredients': ingredients,
        'debug': {
            'original_text': text,
            'parsed_items': items,
            'success_count': len(ingredients)
        }
    })

@app.route('/api/add-ingredients', methods=['POST'])
def add_ingredients():
    """食材を登録"""
    data = request.get_json()
    ingredients = data.get('ingredients', [])
    
    added_items = []
    
    for item in ingredients:
        ingredient_id = db.add_ingredient(
            name=item['name'],
            quantity=item['quantity'],
            unit=item['unit'],
            category=item.get('category', 'その他'),
            expiry_date=item.get('expiry_date'),
            notes=item.get('notes')
        )
        
        added_items.append({
            'id': ingredient_id,
            'name': item['name'],
            'quantity': item['quantity'],
            'unit': item['unit']
        })
    
    return jsonify({
        'success': True,
        'message': f'{len(added_items)}個の食材を追加しました',
        'items': added_items
    })

@app.route('/api/get-ingredients', methods=['GET'])
def get_ingredients():
    """食材リストを取得"""
    category = request.args.get('category')
    expiry_soon = request.args.get('expiry_soon') == 'true'
    
    ingredients = db.get_ingredients(category=category, expiry_soon=expiry_soon)
    
    # 数量が0より大きい食材のみ返す（在庫があるものだけ）
    ingredients = [ing for ing in ingredients if ing.get('quantity', 0) > 0]
    
    return jsonify({
        'success': True,
        'ingredients': ingredients
    })

@app.route('/api/use-ingredient', methods=['POST'])
def use_ingredient():
    """食材を使用"""
    data = request.get_json()
    ingredient_id = data.get('ingredient_id')
    quantity = data.get('quantity', 1)
    
    if not ingredient_id:
        return jsonify({'error': 'ingredient_id is required'})
    
    success = db.use_ingredient(ingredient_id, quantity)
    
    return jsonify({
        'success': success,
        'message': '食材を使用しました' if success else 'エラーが発生しました'
    })

@app.route('/api/update-ingredient', methods=['POST'])
def update_ingredient():
    """食材を更新"""
    data = request.get_json()
    ingredient_id = data.get('ingredient_id')
    name = data.get('name')
    quantity = data.get('quantity')
    unit = data.get('unit')
    category = data.get('category')
    expiry_date = data.get('expiry_date')
    
    if not ingredient_id:
        return jsonify({'error': 'ingredient_id is required'})
    
    success = db.update_ingredient(
        ingredient_id=ingredient_id,
        name=name,
        quantity=quantity,
        unit=unit,
        category=category,
        expiry_date=expiry_date
    )
    
    return jsonify({
        'success': success,
        'message': '食材を更新しました' if success else 'エラーが発生しました'
    })

@app.route('/api/suggest-recipe', methods=['POST'])
def suggest_recipe():
    """Gemini API を使ってレシピ提案"""
    # API使用回数を記録
    _record_api_usage()
    
    if not gemini_model:
        return jsonify({
            'success': False,
            'error': 'Gemini API が設定されていません。.env ファイルに GEMINI_API_KEY を設定してください。',
            'recipe': '''⚠️ Gemini API が未設定です。
            
以下の手順で設定してください：
1. https://ai.google.dev/ で API キーを取得
2. .env ファイルに GEMINI_API_KEY=あなたのキー を追加

それまでは、食材を確認して好きなレシピを検索してみてください！'''
        })
    
    data = request.get_json()
    ingredients = data.get('ingredients', [])
    
    if not ingredients:
        return jsonify({'error': 'No ingredients provided'})
    
    # 食材リストをテキストに変換
    ingredient_text = ", ".join([
        f"{item.get('name', '')} {item.get('quantity', 0)}{item.get('unit', '')}" 
        for item in ingredients
    ])
    
    # Gemini にプロンプトを送信
    prompt = f"""
以下の食材を使って作れる料理を3つ提案してください。
また、各料理に必要な追加材料も教えてください。

食材: {ingredient_text}

以下の形式で回答してください：
1. 【料理名】
   - 必要な追加材料: ○○
   - 作り方の概要: ○○
   - 難易度: ★☆☆☆☆
"""
    
    try:
        response = gemini_model.generate_content(prompt)
        recipe_text = response.text
        
        # レシピ履歴を保存
        db.add_recipe_history(
            recipe_name="提案レシピ",
            ingredients_used=ingredient_text,
            recipe_content=recipe_text
        )
        
        return jsonify({
            'success': True,
            'recipe': recipe_text
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/api/get-statistics', methods=['GET'])
def get_statistics():
    """統計情報を取得"""
    stats = db.get_statistics()
    return jsonify(stats)

def _record_api_usage():
    """API使用回数を記録"""
    try:
        import json
        from datetime import datetime
        
        usage_file = 'api_usage.json'
        usage_data = {'today': [], 'this_month': []}
        
        if os.path.exists(usage_file):
            with open(usage_file, 'r') as f:
                usage_data = json.load(f)
        
        now = datetime.now()
        timestamp = now.strftime('%Y-%m-%d %H:%M:%S')
        
        # 今日の使用回数を追加
        usage_data['today'].append(timestamp)
        usage_data['this_month'].append(timestamp)
        
        # 今日以外の日付を削除
        usage_data['today'] = [
            ts for ts in usage_data['today']
            if ts.startswith(now.strftime('%Y-%m-%d'))
        ]
        
        # 今月以外のデータを削除
        usage_data['this_month'] = [
            ts for ts in usage_data['this_month']
            if ts.startswith(now.strftime('%Y-%m'))
        ]
        
        with open(usage_file, 'w') as f:
            json.dump(usage_data, f, indent=2)
    except:
        pass  # エラーは無視

@app.route('/api/get-expiring-soon', methods=['GET'])
def get_expiring_soon():
    """賞味期限が近い食材を取得"""
    days = int(request.args.get('days', 3))
    ingredients = db.get_expiring_soon(days)
    return jsonify({'ingredients': ingredients})

@app.route('/api/get-quota', methods=['GET'])
def get_quota():
    """API の残り使用量を取得"""
    if not gemini_model:
        return jsonify({
            'daily_remaining': 0,
            'monthly_remaining': 0,
            'message': 'Gemini API が設定されていません'
        })
    
    try:
        # 無料枠の情報
        daily_limit = 60  # 1日60リクエスト
        monthly_limit = 1500  # 月間1,500リクエスト
        
        # 実際の使用量は Gemini API から取得できないため、
        # アプリ内で使用回数をカウント
        usage_file = 'api_usage.json'
        usage_data = {'today': [], 'this_month': []}
        
        if os.path.exists(usage_file):
            with open(usage_file, 'r') as f:
                import json
                usage_data = json.load(f)
        
        today_count = len(usage_data.get('today', []))
        month_count = len(usage_data.get('this_month', []))
        
        daily_remaining = max(0, daily_limit - today_count)
        monthly_remaining = max(0, monthly_limit - month_count)
        
        return jsonify({
            'daily_remaining': daily_remaining,
            'monthly_remaining': monthly_remaining,
            'daily_limit': daily_limit,
            'monthly_limit': monthly_limit,
            'today_count': today_count,
            'month_count': month_count
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'daily_remaining': 60,
            'monthly_remaining': 1500
        })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_ENV') != 'production'
    
    print("📱 おしゃべり冷蔵庫アプリを開始します...")
    print(f"📱 アクセス: http://localhost:{port}")
    print(f"🤖 Gemini API: {'有効' if gemini_model else '無効'}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)

