"""
食材管理用データベース
おしゃべり冷蔵庫用の食材管理機能
"""

import sqlite3
import json
from datetime import datetime, date, timedelta
from pathlib import Path

class IngredientsDatabase:
    def __init__(self, db_path="oshaberi_reizoko.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """データベースとテーブルを初期化"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # 食材テーブル
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS ingredients (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    quantity REAL NOT NULL,
                    unit TEXT NOT NULL,
                    category TEXT,
                    expiry_date DATE,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # 使用履歴テーブル
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS usage_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ingredient_id INTEGER NOT NULL,
                    action TEXT NOT NULL,
                    quantity REAL NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    notes TEXT,
                    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
                )
            ''')
            
            # レシピ履歴テーブル（Geminiが提案したレシピ）
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS recipe_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    recipe_name TEXT NOT NULL,
                    ingredients_used TEXT,
                    recipe_content TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    liked INTEGER DEFAULT 0
                )
            ''')
            
            conn.commit()
    
    def add_ingredient(self, name, quantity, unit, category=None, expiry_date=None, notes=None):
        """食材を追加"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # 同じ食材が既にあるか確認
            cursor.execute('''
                SELECT id, quantity FROM ingredients 
                WHERE name = ? AND unit = ?
            ''', (name, unit))
            
            existing = cursor.fetchone()
            
            if existing:
                # 既存の食材に数量を追加
                ingredient_id, current_quantity = existing
                new_quantity = current_quantity + quantity
                
                cursor.execute('''
                    UPDATE ingredients 
                    SET quantity = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                ''', (new_quantity, ingredient_id))
                
                # 履歴に記録
                self._add_history(ingredient_id, 'add', quantity)
                
                return ingredient_id
            else:
                # 新規食材を追加
                cursor.execute('''
                    INSERT INTO ingredients 
                    (name, quantity, unit, category, expiry_date, notes)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (name, quantity, unit, category, expiry_date, notes))
                
                ingredient_id = cursor.lastrowid
                conn.commit()
                
                # 履歴に記録
                self._add_history(ingredient_id, 'add', quantity)
                
                return ingredient_id
    
    def get_ingredients(self, category=None, expiry_soon=None):
        """食材リストを取得"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            query = "SELECT * FROM ingredients WHERE 1=1"
            params = []
            
            if category:
                query += " AND category = ?"
                params.append(category)
            
            if expiry_soon:
                # 3日以内に賞味期限が来る食材
                query += " AND expiry_date <= DATE('now', '+3 days') AND expiry_date >= DATE('now')"
            
            query += " ORDER BY expiry_date ASC, name ASC"
            
            cursor.execute(query, params)
            columns = [description[0] for description in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]
    
    def use_ingredient(self, ingredient_id, quantity):
        """食材を使用（数量を減らす）"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # 現在の数量を取得
            cursor.execute('SELECT quantity FROM ingredients WHERE id = ?', (ingredient_id,))
            current = cursor.fetchone()
            
            if current:
                current_quantity = current[0]
                new_quantity = max(0, current_quantity - quantity)
                
                if new_quantity == 0:
                    # 数量が0になったら削除
                    cursor.execute('DELETE FROM ingredients WHERE id = ?', (ingredient_id,))
                else:
                    # 数量を更新
                    cursor.execute('''
                        UPDATE ingredients 
                        SET quantity = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    ''', (new_quantity, ingredient_id))
                
                conn.commit()
                
                # 履歴に記録
                self._add_history(ingredient_id, 'use', quantity)
                
                return True
            
            return False
    
    def delete_ingredient(self, ingredient_id):
        """食材を削除"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM ingredients WHERE id = ?', (ingredient_id,))
            conn.commit()
            return cursor.rowcount > 0
    
    def update_ingredient(self, ingredient_id, name=None, quantity=None, unit=None, 
                         category=None, expiry_date=None, notes=None):
        """食材情報を更新"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            updates = []
            params = []
            
            if name is not None:
                updates.append("name = ?")
                params.append(name)
            
            if quantity is not None:
                updates.append("quantity = ?")
                params.append(quantity)
            
            if unit is not None:
                updates.append("unit = ?")
                params.append(unit)
            
            if category is not None:
                updates.append("category = ?")
                params.append(category)
            
            if expiry_date is not None:
                updates.append("expiry_date = ?")
                params.append(expiry_date)
            
            if notes is not None:
                updates.append("notes = ?")
                params.append(notes)
            
            if updates:
                updates.append("updated_at = CURRENT_TIMESTAMP")
                params.append(ingredient_id)
                query = f"UPDATE ingredients SET {', '.join(updates)} WHERE id = ?"
                cursor.execute(query, params)
                conn.commit()
                return cursor.rowcount > 0
            
            return False
    
    def get_expiring_soon(self, days=3):
        """賞味期限が近い食材を取得"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM ingredients 
                WHERE expiry_date <= DATE('now', '+? days') 
                AND expiry_date >= DATE('now')
                ORDER BY expiry_date ASC
            ''', (days,))
            
            columns = [description[0] for description in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]
    
    def get_statistics(self):
        """統計情報を取得"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # 総食材数
            cursor.execute('SELECT COUNT(*) FROM ingredients')
            total_count = cursor.fetchone()[0]
            
            # カテゴリ別の食材数
            cursor.execute('''
                SELECT category, COUNT(*) as count 
                FROM ingredients 
                GROUP BY category
            ''')
            category_stats = dict(cursor.fetchall())
            
            # 賞味期限切れ間近
            cursor.execute('''
                SELECT COUNT(*) 
                FROM ingredients 
                WHERE expiry_date <= DATE('now', '+3 days') 
                AND expiry_date >= DATE('now')
            ''')
            expiring_soon = cursor.fetchone()[0]
            
            return {
                'total_count': total_count,
                'category_stats': category_stats,
                'expiring_soon': expiring_soon
            }
    
    def _add_history(self, ingredient_id, action, quantity):
        """使用履歴を追加"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO usage_history (ingredient_id, action, quantity)
                VALUES (?, ?, ?)
            ''', (ingredient_id, action, quantity))
            conn.commit()
    
    def add_recipe_history(self, recipe_name, ingredients_used, recipe_content):
        """レシピ履歴を追加"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO recipe_history (recipe_name, ingredients_used, recipe_content)
                VALUES (?, ?, ?)
            ''', (recipe_name, ingredients_used, recipe_content))
            conn.commit()
            return cursor.lastrowid
    
    def backup_database(self, backup_path=None):
        """データベースをバックアップ"""
        if backup_path is None:
            backup_path = f"oshaberi_reizoko_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
        
        import shutil
        shutil.copy2(self.db_path, backup_path)
        return backup_path

