#!/usr/bin/env node
/**
 * デプロイ時にコミット情報をindex.htmlに自動埋め込むスクリプト
 */

const fs = require('fs');
const { execSync } = require('child_process');

// コミット情報を取得
const commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
const commitMessage = execSync('git log -1 --format="%s"', { encoding: 'utf8' }).trim();
const commitDate = execSync('git log -1 --format="%ad" --date=short', { encoding: 'utf8' }).trim();

// index.htmlを読み込み
const indexPath = './public/index.html';
let html = fs.readFileSync(indexPath, 'utf8');

// コミット情報を置換
html = html.replace(
    /hash: ['"]([^'"]+)['"]/,
    `hash: '${commitHash}'`
);
html = html.replace(
    /message: ['"]([^'"]+)['"]/,
    `message: '${commitMessage}'`
);
html = html.replace(
    /date: ['"]([^'"]+)['"]/,
    `date: '${commitDate}'`
);

// HTML内の初期値も更新
html = html.replace(
    /<span id="commit-hash">[^<]+<\/span>/,
    `<span id="commit-hash">${commitHash}</span>`
);
html = html.replace(
    /<span id="commit-message">[^<]+<\/span>/,
    `<span id="commit-message">${commitMessage}</span>`
);

// 保存
fs.writeFileSync(indexPath, html, 'utf8');

console.log(`✅ コミット情報を更新しました: ${commitHash} - ${commitMessage}`);

