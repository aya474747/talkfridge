#!/usr/bin/env python3
"""Gemini APIで利用可能なモデルを確認する"""

import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

API_KEY = os.getenv('GEMINI_API_KEY')

if not API_KEY:
    print("❌ APIキーが見つかりません")
    exit(1)

genai.configure(api_key=API_KEY)

print("利用可能なモデルを確認中...\n")

# 利用可能なモデル一覧を取得
try:
    models = genai.list_models()
    print("✅ 利用可能なモデル:")
    for model in models:
        if 'generateContent' in model.supported_generation_methods:
            print(f"  - {model.name}")
except Exception as e:
    print(f"❌ エラー: {e}")

# gemini-proを試す
print("\n📝 gemini-proモデルをテスト中...")
try:
    model = genai.GenerativeModel('gemini-pro')
    response = model.generate_content("Hello")
    print("✅ gemini-pro: 使用可能")
except Exception as e:
    print(f"❌ gemini-pro: エラー - {e}")

# gemini-1.5-flashを試す
print("\n📝 gemini-1.5-flashモデルをテスト中...")
try:
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content("Hello")
    print("✅ gemini-1.5-flash: 使用可能")
except Exception as e:
    print(f"❌ gemini-1.5-flash: エラー - {e}")

# models/gemini-proを試す
print("\n📝 models/gemini-proモデルをテスト中...")
try:
    model = genai.GenerativeModel('models/gemini-pro')
    response = model.generate_content("Hello")
    print("✅ models/gemini-pro: 使用可能")
except Exception as e:
    print(f"❌ models/gemini-pro: エラー - {e}")




