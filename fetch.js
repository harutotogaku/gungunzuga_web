const { google } = require('googleapis');
const fs = require('fs');

// 1. ダウンロードした鍵のファイル名
const KEYFILEPATH = './credentials.json';
// 2. Googleドライブの読み取り権限
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

// 3. さっきコピーしたフォルダIDをここに貼り付けます
const FOLDER_ID = '1aM2C1mpaEFKdV3n_4NYnWhlPY6uJS8wd';

async function fetchImages() {
    // 鍵を使ってGoogleのシステムにログイン
    const auth = new google.auth.GoogleAuth({
        keyFile: KEYFILEPATH,
        scopes: SCOPES,
    });
    const drive = google.drive({ version: 'v3', auth });

    try {
        console.log('Googleドライブにアクセスしています...');
        
        // 指定したフォルダ内にある「画像ファイル」だけを探す
        const response = await drive.files.list({
            q: `'${FOLDER_ID}' in parents and mimeType contains 'image/' and trashed = false`,
            fields: 'files(id, name)',
        });

        const files = response.data.files;

        if (files.length === 0) {
            console.log('画像が見つかりませんでした。ドライブに画像をアップロードしてみてください。');
            return;
        }

        // フロントエンド（表側）で使いやすい形にデータを整える
        const imageData = files.map(file => ({
            id: file.id,
            name: file.name,
            // HTMLの<img>タグで表示するための特殊なリンクURL
            url: `https://drive.google.com/thumbnail?id=${file.id}&sz=w800`
        }));

        // data.jsonという名前で保存
        fs.writeFileSync('data.json', JSON.stringify(imageData, null, 2));
        console.log(`🎉 成功！ ${files.length}件の画像を data.json に保存しました！`);

    } catch (error) {
        console.error('エラーが発生しました:', error.message);
    }
}

fetchImages();