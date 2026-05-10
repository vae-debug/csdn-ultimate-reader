// ==UserScript==
// @name         CSDN Ultimate Reader
// @namespace    local.csdn.ultimate.reader
// @version      5.0
// @description  极简阅读增强插件
// @author       liulipei
//
// @match        *://blog.csdn.net/*/article/details/*
//
// @downloadURL  https://raw.githubusercontent.com/vae-debug/csdn-ultimate-reader/main/csdn-ultimate-reader.user.js
// @updateURL    https://raw.githubusercontent.com/vae-debug/csdn-ultimate-reader/main/csdn-ultimate-reader.user.js
// @homepageURL  https://github.com/vae-debug/csdn-ultimate-reader
// @supportURL   https://github.com/vae-debug/csdn-ultimate-reader/issues
//
// @grant        GM_setClipboard
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function () {

    'use strict';

    //--------------------------------------------------
    // 全局状态
    //--------------------------------------------------

    let currentFontSize = parseInt(
        localStorage.getItem('csdn_font_size') || '18'
    );

    let darkMode = localStorage.getItem(
        'csdn_dark_mode'
    ) === '1';

    //--------------------------------------------------
    // 获取正文
    //--------------------------------------------------

    function getArticle() {

        return (
            document.querySelector('.htmledit_views')
            || document.querySelector('#content_views')
            || document.querySelector('.blog-content-box')
        );

    }

    //--------------------------------------------------
    // 获取标题
    //--------------------------------------------------

    function getTitle() {

        const h1 = document.querySelector('h1');

        return h1
            ? h1.innerText
            : document.title;

    }

    //--------------------------------------------------
    // 创建阅读模式
    //--------------------------------------------------

    function createReaderMode() {

        const article = getArticle();

        if (!article) {
            console.log('未找到正文');
            return;
        }

        const content = article.innerHTML;
        const title = getTitle();

        document.body.innerHTML = '';

        //--------------------------------------------------
        // Body
        //--------------------------------------------------

        document.body.style.margin = '0';
        document.body.style.transition = 'all .3s';
        document.body.style.fontFamily = `
            "PingFang SC",
            "Microsoft YaHei",
            sans-serif
        `;

        //--------------------------------------------------
        // 主容器
        //--------------------------------------------------

        const container = document.createElement('div');

        container.id = 'reader-container';

        container.style.maxWidth = '960px';
        container.style.margin = '40px auto';
        container.style.padding = '60px';
        container.style.borderRadius = '14px';
        container.style.boxSizing = 'border-box';
        container.style.transition = 'all .3s';

        //--------------------------------------------------
        // 标题
        //--------------------------------------------------

        const titleEl = document.createElement('h1');

        titleEl.innerText = title;

        titleEl.style.fontSize = '42px';
        titleEl.style.lineHeight = '1.4';
        titleEl.style.marginBottom = '50px';

        //--------------------------------------------------
        // 正文
        //--------------------------------------------------

        const articleEl = document.createElement('div');

        articleEl.id = 'reader-content';

        articleEl.innerHTML = content;

        articleEl.style.fontSize = currentFontSize + 'px';
        articleEl.style.lineHeight = '2';
        articleEl.style.wordBreak = 'break-word';

        //--------------------------------------------------
        // 页面样式
        //--------------------------------------------------

        const style = document.createElement('style');

        style.innerHTML = `

            #reader-content img {
                display:block;
                max-width:100% !important;
                height:auto !important;
                margin:30px auto;
                border-radius:10px;
            }

            #reader-content pre {
                overflow-x:auto;
                padding:18px;
                border-radius:10px;
                background:#1e1e1e;
                color:#fff;
                position:relative;
            }

            #reader-content code {
                font-family:Consolas, monospace;
            }

            #reader-content table {
                width:100%;
                border-collapse:collapse;
                overflow:auto;
                display:block;
            }

            #reader-content p {
                margin:1.2em 0;
            }

            #reader-content h1,
            #reader-content h2,
            #reader-content h3,
            #reader-content h4 {
                margin-top:1.8em;
                margin-bottom:.8em;
            }

            #reader-content blockquote {
                margin:20px 0;
                padding:10px 20px;
                border-left:4px solid #888;
            }

            .copy-btn {
                position:absolute;
                right:10px;
                top:10px;
                border:none;
                border-radius:6px;
                padding:4px 10px;
                cursor:pointer;
            }

            #progress-bar {
                position:fixed;
                top:0;
                left:0;
                height:4px;
                width:0;
                z-index:99999999;
                transition:width .1s;
            }

            #toc {
                position:fixed;
                left:20px;
                top:100px;
                width:260px;
                max-height:70vh;
                overflow:auto;
                padding:15px;
                border-radius:12px;
                font-size:14px;
                z-index:999999;
            }

            #toc ul {
                list-style:none;
                padding-left:10px;
            }

            #toc li {
                margin:8px 0;
                line-height:1.5;
            }

            #toc a {
                text-decoration:none;
            }

            .reader-toolbar {
                position:fixed;
                right:20px;
                top:100px;
                z-index:999999;
                display:flex;
                flex-direction:column;
                gap:10px;
                padding:14px;
                border-radius:12px;
            }

            .reader-toolbar button {
                border:none;
                border-radius:8px;
                padding:8px 12px;
                cursor:pointer;
                font-size:14px;
            }

        `;

        document.head.appendChild(style);

        //--------------------------------------------------
        // 插入页面
        //--------------------------------------------------

        container.appendChild(titleEl);
        container.appendChild(articleEl);

        document.body.appendChild(container);

        //--------------------------------------------------
        // 进度条
        //--------------------------------------------------

        createProgressBar();

        //--------------------------------------------------
        // 工具栏
        //--------------------------------------------------

        createToolbar();

        //--------------------------------------------------
        // 自动目录
        //--------------------------------------------------

        createTOC();

        //--------------------------------------------------
        // 代码复制按钮
        //--------------------------------------------------

        addCopyButtons();

        //--------------------------------------------------
        // 数学公式优化
        //--------------------------------------------------

        optimizeMath();

        //--------------------------------------------------
        // 夜间模式
        //--------------------------------------------------

        applyTheme();

        //--------------------------------------------------
        // Vim 快捷键
        //--------------------------------------------------

        setupVimKeys();

    }

    //--------------------------------------------------
    // 主题
    //--------------------------------------------------

    function applyTheme() {

        const container = document.querySelector('#reader-container');
        const toc = document.querySelector('#toc');
        const toolbar = document.querySelector('.reader-toolbar');
        const progress = document.querySelector('#progress-bar');

        if (darkMode) {

            document.body.style.background = '#111';

            container.style.background = '#1b1b1b';
            container.style.color = '#ddd';
            container.style.boxShadow = '0 0 20px rgba(0,0,0,.5)';

            if (toc) {
                toc.style.background = '#222';
                toc.style.color = '#ddd';
            }

            if (toolbar) {
                toolbar.style.background = '#222';
            }

            if (progress) {
                progress.style.background = '#4caf50';
            }

        } else {

            document.body.style.background = '#f5f5f5';

            container.style.background = '#fff';
            container.style.color = '#222';
            container.style.boxShadow = '0 2px 14px rgba(0,0,0,.08)';

            if (toc) {
                toc.style.background = '#fff';
                toc.style.color = '#222';
            }

            if (toolbar) {
                toolbar.style.background = '#fff';
            }

            if (progress) {
                progress.style.background = '#1976d2';
            }

        }

    }

    //--------------------------------------------------
    // 工具栏
    //--------------------------------------------------

    function createToolbar() {

        const toolbar = document.createElement('div');

        toolbar.className = 'reader-toolbar';

        toolbar.innerHTML = `

            <button id="font-dec">A-</button>
            <button id="font-inc">A+</button>
            <button id="toggle-dark">夜间模式</button>
            <button id="export-md">导出MD</button>
            <button id="export-pdf">导出PDF</button>
            <button id="ai-summary">AI总结</button>

        `;

        document.body.appendChild(toolbar);

        toolbar.querySelector('#font-inc').onclick = () => {
            currentFontSize++;
            updateFont();
        };

        toolbar.querySelector('#font-dec').onclick = () => {
            currentFontSize = Math.max(12, currentFontSize - 1);
            updateFont();
        };

        toolbar.querySelector('#toggle-dark').onclick = () => {
            darkMode = !darkMode;
            localStorage.setItem(
                'csdn_dark_mode',
                darkMode ? '1' : '0'
            );
            applyTheme();
        };

        toolbar.querySelector('#export-md').onclick = exportMarkdown;

        toolbar.querySelector('#export-pdf').onclick = () => {
            window.print();
        };

        toolbar.querySelector('#ai-summary').onclick = aiSummary;

    }

    //--------------------------------------------------
    // 更新字体
    //--------------------------------------------------

    function updateFont() {

        const content = document.querySelector('#reader-content');

        content.style.fontSize = currentFontSize + 'px';

        localStorage.setItem(
            'csdn_font_size',
            currentFontSize
        );

    }

    //--------------------------------------------------
    // 阅读进度条
    //--------------------------------------------------

    function createProgressBar() {

        const bar = document.createElement('div');

        bar.id = 'progress-bar';

        document.body.appendChild(bar);

        window.addEventListener('scroll', () => {

            const scrollTop = document.documentElement.scrollTop;

            const height =
                document.documentElement.scrollHeight
                - document.documentElement.clientHeight;

            const percent =
                (scrollTop / height) * 100;

            bar.style.width = percent + '%';

        });

    }

    //--------------------------------------------------
    // 自动目录
    //--------------------------------------------------

    function createTOC() {

        const headings = document.querySelectorAll(
            '#reader-content h1,#reader-content h2,#reader-content h3'
        );

        if (!headings.length) return;

        const toc = document.createElement('div');

        toc.id = 'toc';

        const ul = document.createElement('ul');

        headings.forEach((h, i) => {

            const id = 'toc-heading-' + i;

            h.id = id;

            const li = document.createElement('li');

            li.style.marginLeft =
                (parseInt(h.tagName[1]) - 1) * 12 + 'px';

            const a = document.createElement('a');

            a.href = '#' + id;
            a.innerText = h.innerText;

            li.appendChild(a);

            ul.appendChild(li);

        });

        toc.appendChild(ul);

        document.body.appendChild(toc);

    }

    //--------------------------------------------------
    // Markdown 导出
    //--------------------------------------------------

    function exportMarkdown() {

        const text = document.querySelector(
            '#reader-content'
        ).innerText;

        const blob = new Blob([text], {
            type: 'text/markdown'
        });

        const a = document.createElement('a');

        a.href = URL.createObjectURL(blob);

        a.download = getTitle() + '.md';

        a.click();

    }

    //--------------------------------------------------
    // 代码复制按钮
    //--------------------------------------------------

    function addCopyButtons() {

        const blocks = document.querySelectorAll('pre');

        blocks.forEach(pre => {

            const btn = document.createElement('button');

            btn.className = 'copy-btn';

            btn.innerText = '复制';

            btn.onclick = () => {

                navigator.clipboard.writeText(
                    pre.innerText
                );

                btn.innerText = '已复制';

                setTimeout(() => {
                    btn.innerText = '复制';
                }, 1500);

            };

            pre.appendChild(btn);

        });

    }

    //--------------------------------------------------
    // 数学公式优化
    //--------------------------------------------------

    function optimizeMath() {

        const math = document.querySelectorAll(
            '.MathJax, .katex'
        );

        math.forEach(el => {
            el.style.overflowX = 'auto';
            el.style.padding = '8px 0';
        });

    }

    //--------------------------------------------------
    // AI 总结（占位版本）
    //--------------------------------------------------

    function aiSummary() {

        const content = document.querySelector(
            '#reader-content'
        ).innerText;

        const shortText = content.slice(0, 1500);

        alert(
            'AI总结（演示版）:\n\n'
            + shortText.slice(0, 300)
            + '...'
        );

        //--------------------------------------------------
        // 如果你有 OpenAI API Key
        // 可在这里接真实 AI 接口
        //--------------------------------------------------

    }

    //--------------------------------------------------
    // Vim 快捷键
    //--------------------------------------------------

    function setupVimKeys() {

        document.addEventListener('keydown', e => {

            if (
                e.target.tagName === 'INPUT'
                || e.target.tagName === 'TEXTAREA'
            ) {
                return;
            }

            switch (e.key) {

                case 'j':
                    window.scrollBy(0, 120);
                    break;

                case 'k':
                    window.scrollBy(0, -120);
                    break;

                case 'g':
                    window.scrollTo(0, 0);
                    break;

                case 'G':
                    window.scrollTo(
                        0,
                        document.body.scrollHeight
                    );
                    break;

                case 'd':
                    darkMode = !darkMode;
                    applyTheme();
                    break;

                case '+':
                    currentFontSize++;
                    updateFont();
                    break;

                case '-':
                    currentFontSize--;
                    updateFont();
                    break;

            }

        });

    }

    //--------------------------------------------------
    // 启动
    //--------------------------------------------------

    window.addEventListener('load', () => {

        setTimeout(
            createReaderMode,
            1200
        );

    });

})();

