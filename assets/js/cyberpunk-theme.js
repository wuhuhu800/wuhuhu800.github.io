/**
 * 赛博朋克科技风主题 - Cyberpunk Tech Theme
 * Author: Claude
 * Version: 2.0.0 - Bug Fixed Edition
 */

(function() {
    'use strict';

    // ==================== 配置项 ====================
    const CONFIG = {
        storagePrefix: 'cyberpunk_',
        animationDuration: 300
    };

    // ==================== 工具函数 ====================
    const Utils = {
        // 防抖函数
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        // 节流函数
        throttle(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        // 本地存储
        storage: {
            get(key) {
                try {
                    return JSON.parse(localStorage.getItem(CONFIG.storagePrefix + key));
                } catch (e) {
                    return null;
                }
            },
            set(key, value) {
                try {
                    localStorage.setItem(CONFIG.storagePrefix + key, JSON.stringify(value));
                } catch (e) {
                    console.warn('Storage error:', e);
                }
            },
            remove(key) {
                try {
                    localStorage.removeItem(CONFIG.storagePrefix + key);
                } catch (e) {
                    console.warn('Storage error:', e);
                }
            }
        }
    };

    // ==================== 主题管理器 ====================
    const ThemeManager = {
        currentTheme: 'dark',

        init() {
            this.loadTheme();
            this.bindEvents();
        },

        loadTheme() {
            const savedTheme = Utils.storage.get('theme') || 'dark';
            this.setTheme(savedTheme);
        },

        setTheme(theme) {
            this.currentTheme = theme;
            document.documentElement.setAttribute('data-theme', theme);

            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
            }

            Utils.storage.set('theme', theme);
        },

        toggle() {
            const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
        },

        bindEvents() {
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                themeToggle.addEventListener('click', () => this.toggle());
            }
        }
    };

    // ==================== 阅读进度管理器 ====================
    const ReadingProgress = {
        progressBar: null,

        init() {
            this.progressBar = document.getElementById('readingProgress');
            if (!this.progressBar) return;

            this.bindEvents();
            this.update();
        },

        update() {
            if (!this.progressBar) return;

            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

            this.progressBar.style.width = Math.min(100, Math.max(0, progress)) + '%';
        },

        bindEvents() {
            window.addEventListener('scroll', Utils.throttle(() => this.update(), 50), { passive: true });
        }
    };

    // ==================== 返回顶部管理器 ====================
    const BackToTop = {
        btn: null,
        threshold: 300,

        init() {
            this.btn = document.getElementById('backToTop');
            if (!this.btn) return;

            this.bindEvents();
        },

        toggle() {
            if (!this.btn) return;

            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            if (scrollTop > this.threshold) {
                this.btn.classList.add('visible');
            } else {
                this.btn.classList.remove('visible');
            }
        },

        scrollToTop() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        },

        bindEvents() {
            window.addEventListener('scroll', Utils.throttle(() => this.toggle(), 100), { passive: true });

            if (this.btn) {
                this.btn.addEventListener('click', () => this.scrollToTop());
            }
        }
    };

    // ==================== 搜索管理器 ====================
    const SearchManager = {
        searchInput: null,

        init() {
            this.searchInput = document.getElementById('searchInput');
            if (!this.searchInput) return;

            this.bindEvents();
        },

        performSearch(query) {
            if (!query || query.trim().length < 2) return;

            // 跳转到搜索结果页面
            window.location.href = `/search/?q=${encodeURIComponent(query.trim())}`;
        },

        bindEvents() {
            if (!this.searchInput) return;

            // 回车搜索
            this.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(this.searchInput.value);
                }
            });

            // 失焦时如果为空则重置宽度
            this.searchInput.addEventListener('blur', () => {
                if (!this.searchInput.value.trim()) {
                    this.searchInput.value = '';
                }
            });
        }
    };

    // ==================== 互动按钮管理器 ====================
    const InteractionManager = {
        init() {
            this.bindEvents();
        },

        bindEvents() {
            // 点赞按钮
            document.querySelectorAll('.like-btn').forEach(btn => {
                btn.addEventListener('click', (e) => this.handleLike(e.currentTarget));
            });

            // 收藏按钮
            document.querySelectorAll('.bookmark-btn').forEach(btn => {
                btn.addEventListener('click', (e) => this.handleBookmark(e.currentTarget));
            });

            // 分享按钮
            document.querySelectorAll('.share-btn').forEach(btn => {
                btn.addEventListener('click', (e) => this.handleShare(e.currentTarget));
            });
        },

        handleLike(btn) {
            const postId = btn.dataset.postId;
            if (!postId) return;

            const likedPosts = Utils.storage.get('likedPosts') || [];
            const countEl = btn.querySelector('.count');

            if (likedPosts.includes(postId)) {
                // 取消点赞
                const index = likedPosts.indexOf(postId);
                likedPosts.splice(index, 1);
                btn.classList.remove('liked');
                if (countEl) {
                    const currentCount = parseInt(countEl.textContent) || 0;
                    countEl.textContent = Math.max(0, currentCount - 1);
                }
            } else {
                // 点赞
                likedPosts.push(postId);
                btn.classList.add('liked');
                if (countEl) {
                    const currentCount = parseInt(countEl.textContent) || 0;
                    countEl.textContent = currentCount + 1;
                }
            }

            Utils.storage.set('likedPosts', likedPosts);
        },

        handleBookmark(btn) {
            const postId = btn.dataset.postId;
            if (!postId) return;

            const bookmarkedPosts = Utils.storage.get('bookmarkedPosts') || [];

            if (bookmarkedPosts.includes(postId)) {
                const index = bookmarkedPosts.indexOf(postId);
                bookmarkedPosts.splice(index, 1);
                btn.classList.remove('bookmarked');
                this.showToast('已取消收藏');
            } else {
                bookmarkedPosts.push(postId);
                btn.classList.add('bookmarked');
                this.showToast('已收藏文章');
            }

            Utils.storage.set('bookmarkedPosts', bookmarkedPosts);
        },

        handleShare(btn) {
            const url = btn.dataset.url || window.location.href;

            if (navigator.share) {
                navigator.share({
                    title: document.title,
                    url: url
                }).catch(() => {});
            } else {
                // 复制到剪贴板
                navigator.clipboard.writeText(url).then(() => {
                    this.showToast('链接已复制到剪贴板');
                }).catch(() => {
                    this.showToast('复制失败，请手动复制');
                });
            }
        },

        showToast(message) {
            // 移除现有 toast
            const existingToast = document.querySelector('.toast-message');
            if (existingToast) {
                existingToast.remove();
            }

            // 创建新 toast
            const toast = document.createElement('div');
            toast.className = 'toast-message';
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed;
                bottom: 100px;
                left: 50%;
                transform: translateX(-50%);
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                padding: 12px 24px;
                border-radius: 25px;
                font-size: 14px;
                color: var(--text-primary);
                z-index: 10000;
                animation: fadeIn 0.3s ease;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            `;

            document.body.appendChild(toast);

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, 2000);
        }
    };

    // ==================== 设置面板管理器 ====================
    const SettingsManager = {
        panel: null,
        btn: null,

        init() {
            this.panel = document.getElementById('settingsPanel');
            this.btn = document.getElementById('settingsBtn');

            if (!this.panel || !this.btn) return;

            this.loadSettings();
            this.bindEvents();
        },

        loadSettings() {
            const settings = Utils.storage.get('readerSettings') || {
                fontSize: 'medium',
                lineWidth: 'medium',
                lineHeight: 'comfortable'
            };

            this.applySettings(settings);
            this.updateUI(settings);
        },

        applySettings(settings) {
            const articleContent = document.querySelector('.article-content');
            if (!articleContent) return;

            // 字体大小
            const fontSizeMap = {
                small: '14px',
                medium: '16px',
                large: '18px'
            };
            articleContent.style.fontSize = fontSizeMap[settings.fontSize] || '16px';

            // 行宽
            const lineWidthMap = {
                narrow: '600px',
                medium: 'none',
                wide: '900px'
            };
            articleContent.style.maxWidth = lineWidthMap[settings.lineWidth] || 'none';

            // 行高
            const lineHeightMap = {
                compact: '1.6',
                comfortable: '1.9',
                relaxed: '2.2'
            };
            articleContent.style.lineHeight = lineHeightMap[settings.lineHeight] || '1.9';
        },

        updateUI(settings) {
            document.querySelectorAll('.setting-btn').forEach(btn => {
                const setting = btn.dataset.setting;
                const value = btn.dataset.value;

                if (settings[setting] === value) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        },

        toggle() {
            if (!this.panel) return;
            this.panel.classList.toggle('visible');
        },

        close() {
            if (!this.panel) return;
            this.panel.classList.remove('visible');
        },

        handleSettingClick(btn) {
            const setting = btn.dataset.setting;
            const value = btn.dataset.value;

            if (!setting || !value) return;

            const settings = Utils.storage.get('readerSettings') || {
                fontSize: 'medium',
                lineWidth: 'medium',
                lineHeight: 'comfortable'
            };

            settings[setting] = value;
            Utils.storage.set('readerSettings', settings);

            this.applySettings(settings);
            this.updateUI(settings);
        },

        bindEvents() {
            // 打开/关闭设置面板
            if (this.btn) {
                this.btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggle();
                });
            }

            // 点击设置按钮
            document.querySelectorAll('.setting-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.handleSettingClick(btn);
                });
            });

            // 点击外部关闭
            document.addEventListener('click', (e) => {
                if (this.panel && this.panel.classList.contains('visible')) {
                    if (!this.panel.contains(e.target) && e.target !== this.btn) {
                        this.close();
                    }
                }
            });
        }
    };

    // ==================== TTS 管理器 ====================
    const TTSManager = {
        panel: null,
        synth: null,
        utterance: null,
        isPlaying: false,
        currentParagraph: 0,
        paragraphs: [],

        init() {
            if (!('speechSynthesis' in window)) {
                console.log('TTS not supported');
                return;
            }

            this.panel = document.getElementById('ttsPanel');
            this.synth = window.speechSynthesis;

            this.bindEvents();
        },

        toggle() {
            if (!this.panel) return;

            if (this.panel.classList.contains('visible')) {
                this.close();
            } else {
                this.open();
            }
        },

        open() {
            if (!this.panel) return;

            // 获取文章内容
            const articleContent = document.querySelector('.article-content');
            if (!articleContent) {
                this.showToast('当前页面无可朗读内容');
                return;
            }

            this.paragraphs = Array.from(articleContent.querySelectorAll('p, h1, h2, h3, h4, h5, h6'))
                .map(el => el.textContent.trim())
                .filter(text => text.length > 0);

            if (this.paragraphs.length === 0) {
                this.showToast('当前页面无可朗读内容');
                return;
            }

            this.panel.classList.add('visible');
            this.currentParagraph = 0;
        },

        close() {
            if (!this.panel) return;

            this.stop();
            this.panel.classList.remove('visible');
        },

        play() {
            if (this.isPlaying) {
                this.pause();
                return;
            }

            if (this.currentParagraph >= this.paragraphs.length) {
                this.currentParagraph = 0;
            }

            this.utterance = new SpeechSynthesisUtterance(this.paragraphs[this.currentParagraph]);
            this.utterance.lang = 'zh-CN';
            this.utterance.rate = 1;

            this.utterance.onend = () => {
                this.currentParagraph++;
                if (this.currentParagraph < this.paragraphs.length) {
                    this.updateProgress();
                    this.play();
                } else {
                    this.isPlaying = false;
                    this.updatePlayButton();
                }
            };

            this.synth.speak(this.utterance);
            this.isPlaying = true;
            this.updatePlayButton();
            this.updateProgress();
        },

        pause() {
            if (this.synth) {
                this.synth.cancel();
            }
            this.isPlaying = false;
            this.updatePlayButton();
        },

        stop() {
            if (this.synth) {
                this.synth.cancel();
            }
            this.isPlaying = false;
            this.currentParagraph = 0;
            this.updatePlayButton();
            this.updateProgress();
        },

        prev() {
            this.pause();
            this.currentParagraph = Math.max(0, this.currentParagraph - 1);
            this.updateProgress();
            if (this.isPlaying) {
                this.play();
            }
        },

        next() {
            this.pause();
            this.currentParagraph = Math.min(this.paragraphs.length - 1, this.currentParagraph + 1);
            this.updateProgress();
            if (this.isPlaying) {
                this.play();
            }
        },

        updatePlayButton() {
            const playBtn = document.getElementById('ttsPlay');
            if (playBtn) {
                playBtn.textContent = this.isPlaying ? '⏸' : '▶';
            }
        },

        updateProgress() {
            const progressBar = document.getElementById('ttsProgressBar');
            if (progressBar && this.paragraphs.length > 0) {
                const progress = ((this.currentParagraph + 1) / this.paragraphs.length) * 100;
                progressBar.style.width = progress + '%';
            }
        },

        showToast(message) {
            const toast = document.createElement('div');
            toast.className = 'toast-message';
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed;
                bottom: 100px;
                left: 50%;
                transform: translateX(-50%);
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                padding: 12px 24px;
                border-radius: 25px;
                font-size: 14px;
                color: var(--text-primary);
                z-index: 10000;
                animation: fadeIn 0.3s ease;
            `;

            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);
        },

        bindEvents() {
            const ttsToggleBtn = document.getElementById('ttsToggleBtn');
            const ttsPlay = document.getElementById('ttsPlay');
            const ttsPrev = document.getElementById('ttsPrev');
            const ttsNext = document.getElementById('ttsNext');
            const ttsClose = document.getElementById('ttsClose');

            if (ttsToggleBtn) {
                ttsToggleBtn.addEventListener('click', () => this.toggle());
            }

            if (ttsPlay) {
                ttsPlay.addEventListener('click', () => this.play());
            }

            if (ttsPrev) {
                ttsPrev.addEventListener('click', () => this.prev());
            }

            if (ttsNext) {
                ttsNext.addEventListener('click', () => this.next());
            }

            if (ttsClose) {
                ttsClose.addEventListener('click', () => this.close());
            }
        }
    };

    // ==================== 目录生成器 ====================
    const TOCGenerator = {
        init() {
            const tocList = document.getElementById('tocList');
            const articleContent = document.querySelector('.article-content');

            if (!tocList || !articleContent) return;

            this.generateTOC(tocList, articleContent);
        },

        generateTOC(tocList, articleContent) {
            const headings = articleContent.querySelectorAll('h2, h3');
            if (headings.length === 0) {
                tocList.innerHTML = '<li style="color: var(--text-muted);">暂无目录</li>';
                return;
            }

            let html = '';
            headings.forEach((heading, index) => {
                const id = heading.id || `heading-${index}`;
                heading.id = id;

                const level = heading.tagName === 'H2' ? 0 : 1;
                const padding = level * 16;

                html += `
                    <li style="padding-left: ${padding}px">
                        <a href="#${id}" data-target="${id}">${heading.textContent}</a>
                    </li>
                `;
            });

            tocList.innerHTML = html;

            // 添加点击事件
            tocList.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = link.dataset.target;
                    const target = document.getElementById(targetId);
                    if (target) {
                        const offset = 100;
                        const top = target.getBoundingClientRect().top + window.scrollY - offset;
                        window.scrollTo({ top, behavior: 'smooth' });
                    }
                });
            });

            // 高亮当前章节
            this.highlightCurrentSection(headings);
        },

        highlightCurrentSection(headings) {
            const tocLinks = document.querySelectorAll('#tocList a');

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const id = entry.target.id;
                        tocLinks.forEach(link => {
                            if (link.dataset.target === id) {
                                link.classList.add('active');
                            } else {
                                link.classList.remove('active');
                            }
                        });
                    }
                });
            }, { threshold: 0.5 });

            headings.forEach(heading => observer.observe(heading));
        }
    };

    // ==================== 代码块复制 ====================
    const CodeCopyManager = {
        init() {
            document.querySelectorAll('.code-block').forEach(block => {
                this.addCopyButton(block);
            });
        },

        addCopyButton(codeBlock) {
            const header = codeBlock.querySelector('.code-header');
            if (!header) return;

            const btn = document.createElement('button');
            btn.className = 'code-copy-btn';
            btn.innerHTML = '📋 复制';

            btn.addEventListener('click', () => {
                const code = codeBlock.querySelector('code');
                if (!code) return;

                navigator.clipboard.writeText(code.textContent).then(() => {
                    btn.innerHTML = '✅ 已复制';
                    btn.classList.add('copied');

                    setTimeout(() => {
                        btn.innerHTML = '📋 复制';
                        btn.classList.remove('copied');
                    }, 2000);
                });
            });

            const actions = header.querySelector('.code-actions');
            if (actions) {
                actions.appendChild(btn);
            } else {
                header.appendChild(btn);
            }
        }
    };

    // ==================== 图片灯箱 ====================
    const LightboxManager = {
        lightbox: null,

        init() {
            this.createLightbox();

            // 为文章内图片添加点击事件
            document.querySelectorAll('.article-content img').forEach(img => {
                img.addEventListener('click', () => this.open(img));
            });
        },

        createLightbox() {
            this.lightbox = document.createElement('div');
            this.lightbox.className = 'lightbox';
            this.lightbox.innerHTML = `
                <button class="lightbox-close">✕</button>
                <img src="" alt="">
                <div class="lightbox-caption"></div>
            `;
            document.body.appendChild(this.lightbox);

            // 关闭事件
            this.lightbox.querySelector('.lightbox-close').addEventListener('click', () => this.close());
            this.lightbox.addEventListener('click', (e) => {
                if (e.target === this.lightbox) this.close();
            });

            // ESC 关闭
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.lightbox.classList.contains('visible')) {
                    this.close();
                }
            });
        },

        open(img) {
            const lightboxImg = this.lightbox.querySelector('img');
            const caption = this.lightbox.querySelector('.lightbox-caption');

            lightboxImg.src = img.src;
            caption.textContent = img.alt || '';

            this.lightbox.classList.add('visible');
            document.body.style.overflow = 'hidden';
        },

        close() {
            this.lightbox.classList.remove('visible');
            document.body.style.overflow = '';
        }
    };

    // ==================== 文章统计 ====================
    const StatsManager = {
        init() {
            const articleContent = document.querySelector('.article-content');
            if (!articleContent) return;

            this.createStatsPanel();
            this.updateStats(articleContent);
        },

        createStatsPanel() {
            const panel = document.createElement('div');
            panel.className = 'stats-panel';
            panel.innerHTML = `
                <div class="stat-info">
                    <span>📝</span>
                    <span>字数: <span class="value" id="wordCount">0</span></span>
                </div>
                <div class="stat-info">
                    <span>📖</span>
                    <span>代码: <span class="value" id="codeCount">0</span></span>
                </div>
                <div class="stat-info">
                    <span>⏱️</span>
                    <span>预计: <span class="value" id="timeEstimate">0</span>分钟</span>
                </div>
            `;
            document.body.appendChild(panel);
        },

        updateStats(content) {
            const text = content.textContent || '';
            const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
            const wordCount = chineseChars.length + (text.match(/[a-zA-Z]+/g) || []).length;

            const codeBlocks = content.querySelectorAll('code');
            let codeLines = 0;
            codeBlocks.forEach(block => {
                codeLines += (block.textContent.match(/\n/g) || []).length + 1;
            });

            const minutes = Math.max(1, Math.ceil(wordCount / 300));

            document.getElementById('wordCount').textContent = wordCount.toLocaleString();
            document.getElementById('codeCount').textContent = codeLines;
            document.getElementById('timeEstimate').textContent = minutes;
        }
    };

    // ==================== 键盘快捷键 ====================
    const KeyboardManager = {
        init() {
            this.createShortcutsHelp();
            this.bindEvents();
        },

        createShortcutsHelp() {
            const overlay = document.createElement('div');
            overlay.className = 'shortcuts-overlay';

            const help = document.createElement('div');
            help.className = 'shortcuts-help';
            help.innerHTML = `
                <button class="shortcuts-close">✕</button>
                <h3>⌨️ 键盘快捷键</h3>
                <div class="shortcuts-list">
                    <div class="shortcut-item">
                        <span class="shortcut-desc">聚焦搜索</span>
                        <div class="shortcut-key"><span>/</span></div>
                    </div>
                    <div class="shortcut-item">
                        <span class="shortcut-desc">上一篇文章</span>
                        <div class="shortcut-key"><span>J</span></div>
                    </div>
                    <div class="shortcut-item">
                        <span class="shortcut-desc">下一篇文章</span>
                        <div class="shortcut-key"><span>K</span></div>
                    </div>
                    <div class="shortcut-item">
                        <span class="shortcut-desc">返回顶部</span>
                        <div class="shortcut-key"><span>G</span><span>G</span></div>
                    </div>
                    <div class="shortcut-item">
                        <span class="shortcut-desc">滚动到底部</span>
                        <div class="shortcut-key"><span>Shift</span><span>G</span></div>
                    </div>
                    <div class="shortcut-item">
                        <span class="shortcut-desc">关闭弹窗/灯箱</span>
                        <div class="shortcut-key"><span>Esc</span></div>
                    </div>
                    <div class="shortcut-item">
                        <span class="shortcut-desc">显示快捷键帮助</span>
                        <div class="shortcut-key"><span>Shift</span><span>?</span></div>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);
            document.body.appendChild(help);

            // 添加快捷键按钮
            const btn = document.createElement('button');
            btn.className = 'shortcuts-btn';
            btn.textContent = '?';
            btn.title = '快捷键 (Shift+?)';
            btn.addEventListener('click', () => this.showHelp());
            document.body.appendChild(btn);

            // 关闭事件
            overlay.addEventListener('click', () => this.hideHelp());
            help.querySelector('.shortcuts-close').addEventListener('click', () => this.hideHelp());
        },

        bindEvents() {
            let lastKey = null;

            document.addEventListener('keydown', (e) => {
                // 忽略输入框中的按键
                if (e.target.matches('input, textarea')) return;

                const key = e.key.toLowerCase();

                // 显示帮助
                if (e.shiftKey && key === '?') {
                    e.preventDefault();
                    this.showHelp();
                    return;
                }

                // 搜索
                if (key === '/' && !e.shiftKey) {
                    e.preventDefault();
                    const searchInput = document.getElementById('searchInput');
                    if (searchInput) {
                        searchInput.focus();
                    }
                    return;
                }

                // GG - 返回顶部
                if (key === 'g' && lastKey === 'g') {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                }

                // Shift+G - 滚动到底部
                if (key === 'g' && e.shiftKey) {
                    e.preventDefault();
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                    return;
                }

                lastKey = key;
                setTimeout(() => { lastKey = null; }, 500);
            });
        },

        showHelp() {
            document.querySelector('.shortcuts-help').classList.add('visible');
            document.querySelector('.shortcuts-overlay').classList.add('visible');
        },

        hideHelp() {
            document.querySelector('.shortcuts-help').classList.remove('visible');
            document.querySelector('.shortcuts-overlay').classList.remove('visible');
        }
    };

    // ==================== 庆祝动画 ====================
    const CelebrationManager = {
        celebrated: false,

        init() {
            const articleContent = document.querySelector('.article-content');
            if (!articleContent) return;

            this.bindEvents();
        },

        bindEvents() {
            window.addEventListener('scroll', Utils.throttle(() => {
                if (this.celebrated) return;

                const scrollTop = window.scrollY || document.documentElement.scrollTop;
                const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
                const progress = docHeight > 0 ? scrollTop / docHeight : 0;

                // 滚动到 95% 触发庆祝
                if (progress > 0.95) {
                    this.celebrate();
                    this.celebrated = true;
                }
            }, 200), { passive: true });
        },

        celebrate() {
            // 彩带动画
            this.createConfetti();

            // Toast 提示
            this.showToast();
        },

        createConfetti() {
            const container = document.createElement('div');
            container.className = 'confetti-container';

            const colors = ['#00f5ff', '#bf00ff', '#00ff88', '#ff8800', '#ff0055', '#ffee00'];

            for (let i = 0; i < 50; i++) {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.cssText = `
                    left: ${Math.random() * 100}%;
                    background: ${colors[Math.floor(Math.random() * colors.length)]};
                    animation-delay: ${Math.random() * 2}s;
                    animation-duration: ${2 + Math.random() * 2}s;
                `;
                container.appendChild(confetti);
            }

            document.body.appendChild(container);

            setTimeout(() => container.remove(), 5000);
        },

        showToast() {
            const toast = document.createElement('div');
            toast.className = 'reading-complete-toast';
            toast.innerHTML = `
                <div class="icon">🎉</div>
                <div class="text">阅读完成！</div>
            `;
            document.body.appendChild(toast);

            setTimeout(() => toast.remove(), 3000);
        }
    };

    // ==================== 图片懒加载 ====================
    const LazyLoadManager = {
        init() {
            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            this.loadImage(entry.target);
                            observer.unobserve(entry.target);
                        }
                    });
                }, {
                    rootMargin: '50px 0px'
                });

                document.querySelectorAll('img[data-src]').forEach(img => {
                    img.classList.add('lazy');
                    observer.observe(img);
                });
            } else {
                // 降级处理
                document.querySelectorAll('img[data-src]').forEach(img => {
                    this.loadImage(img);
                });
            }
        },

        loadImage(img) {
            const src = img.dataset.src;
            if (!src) return;

            img.src = src;
            img.onload = () => {
                img.classList.add('loaded');
                img.removeAttribute('data-src');
            };
        }
    };

    // ==================== 初始化 ====================
    function init() {
        // 等待 DOM 加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', doInit);
        } else {
            doInit();
        }
    }

    function doInit() {
        ThemeManager.init();
        ReadingProgress.init();
        BackToTop.init();
        SearchManager.init();
        InteractionManager.init();
        SettingsManager.init();
        TTSManager.init();
        TOCGenerator.init();

        // 新增功能
        CodeCopyManager.init();
        LightboxManager.init();
        StatsManager.init();
        KeyboardManager.init();
        CelebrationManager.init();
        LazyLoadManager.init();

        console.log('🎮 Cyberpunk Theme v2.1.0 loaded - 新功能已激活');
        console.log('⌨️ 按 Shift+? 查看快捷键');
    }

    // 启动
    init();
})();
