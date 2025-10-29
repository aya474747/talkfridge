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
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        # 利用可能な最新のモデルを使用
        try:
            gemini_model = genai.GenerativeModel('gemini-2.0-flash-exp')
        except:
            try:
                gemini_model = genai.GenerativeModel('gemini-pro')
            except:
                gemini_model = genai.GenerativeModel('models/gemini-pro')
    except Exception as e:
        print(f"⚠️ Gemini API初期化エラー: {e}")
        gemini_model = None
else:
    gemini_model = None
    print("ℹ️ GEMINI_API_KEYが設定されていません。レシピ提案機能は使用できません。")

# データベース初期化（エラーハンドリング付き）
try:
    db = IngredientsDatabase()
    print(f"✅ データベース初期化成功: {db.db_path}")
except Exception as e:
    print(f"⚠️ データベース初期化エラー: {e}")
    import traceback
    traceback.print_exc()
    # エラーが発生してもアプリは起動させる（データベース機能は使えないが）
    db = None

# カテゴリ推測のキーワード
CATEGORY_KEYWORDS = {
    '肉': ['鶏', '肉', '豚', '牛', '魚', 'ハム', 'ベーコン', 'ソーセージ'],
    '野菜': ['トマト', 'ニンジン', 'キャベツ', '玉ねぎ', 'きゅうり', 'ピーマン', '白菜', '大根'],
    '乳製品': ['牛乳', 'チーズ', 'ヨーグルト', 'バター', '生クリーム'],
    '穀物': ['米', 'パン', '麺', 'うどん', 'そば', 'スパゲッティ'],
    '調味料': ['醤油', '味噌', '塩', '砂糖', '胡椒', '油'],
    'その他': []
}

def guess_category(name):
    """食材名からカテゴリを推測"""
    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in name:
                return category
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
    
    # 「、」や「と」で区切る
    items = re.split(r'[、，と]', text)
    
    print(f"📦 分割したアイテム: {items}")  # デバッグ用
    
    for item in items:
        item = item.strip()
        if not item:
            continue
        
        # 「食材名 + 数量 + 単位」を抽出
        # 例: "鶏肉2枚" → name="鶏肉", quantity=2, unit="枚"
        match = re.match(r'(.+?)(\d+\.?\d*)(枚|個|本|ml|g|kg|l|リットル|片|パック|入り|つ|ヶ)', item)
        
        if match:
            name = match.group(1).strip()
            quantity = float(match.group(2))
            unit = match.group(3)
            
            print(f"✅ 抽出成功: {name} {quantity}{unit}")  # デバッグ用
            
            # カテゴリを推測
            category = guess_category(name)
            
            ingredients.append({
                'name': name,
                'quantity': quantity,
                'unit': unit,
                'category': category
            })
        else:
            print(f"❌ 抽出失敗: {item}")  # デバッグ用
    
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

@app.route('/api/suggest-recipe', methods=['POST'])
def suggest_recipe():
    """Gemini API を使ってレシピ提案"""
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

@app.route('/api/get-expiring-soon', methods=['GET'])
def get_expiring_soon():
    """賞味期限が近い食材を取得"""
    days = int(request.args.get('days', 3))
    ingredients = db.get_expiring_soon(days)
    return jsonify({'ingredients': ingredients})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_ENV') != 'production'
    
    print("📱 おしゃべり冷蔵庫アプリを開始します...")
    print(f"📱 アクセス: http://localhost:{port}")
    print(f"🤖 Gemini API: {'有効' if gemini_model else '無効'}")
    print(f"💾 データベース: {db.db_path if db else '未初期化'}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)

