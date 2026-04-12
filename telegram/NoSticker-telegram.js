// ==UserScript==
// @name         Telegram Web K 表情包消息彻底抹除
// @namespace    http://tampermonkey.net/
// @version      6.0
// @description  永久抹除所有包含表情包的消息气泡（官方+自制），不留位置，不占空间。
// @author       User
// @match        https://web.telegram.org/k/*
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // 使用 :has() 选择器匹配包含表情包容器的整条消息气泡 (.bubble)
    // display: none 会将整条消息从 DOM 流中移除，不留任何缝隙
    GM_addStyle(`
        /* 匹配包含官方动画表情、静态表情、自制表情、视频表情的整条气泡 */
        .bubble:has(.sticker-fixed-size),
        .bubble:has([class*="sticker"]),
        .bubble:has(video.media-sticker),
        .bubble:has(.animated-sticker) {
            display: none !important;
        }

        /* 排除掉那些虽然有 sticker 类名但其实是普通图片的特殊情况（如有） */
        .bubble:has(.media-photo) {
            display: flex !important;
        }
    `);
})();
