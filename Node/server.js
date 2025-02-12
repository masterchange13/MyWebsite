import express from 'express';
import cors from 'cors';  
import fs from 'fs';
import path from 'path';

const app = express();
const port = 3000;

// 获取当前目录路径
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// 使用 CORS 中间件
app.use(cors());

// 解析 JSON 请求体
app.use(express.json());

// test and show hello world
app.get('/', (req, res) => {
    res.send('Hello World!');
})

// API: 保存数据到 src.json
app.post('/save-icon', (req, res) => {
    const newIcon = req.body;

    // 读取当前的 src.json 文件
    const srcFilePath = path.join(__dirname, 'website', 'src.json'); // 使用 __dirname
    fs.readFile(srcFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Failed to read src.json');
        }

        let icons = [];
        if (data) {
            icons = JSON.parse(data);
        }

        // 添加新的图标数据
        icons.push(newIcon);

        // 保存更新后的数据回 src.json 文件
        fs.writeFile(srcFilePath, JSON.stringify(icons, null, 2), 'utf8', (err) => {
            if (err) {
                return res.status(500).send('Failed to save src.json');
            }
            res.status(200).send('Icon saved successfully');
        });
    });
});

// 启动服务器
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
