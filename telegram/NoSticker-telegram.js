// ==UserScript==
// @name         Telegram Web K 表情包彻底抹除 (修正版)
// @namespace    http://tampermonkey.net/
// @version      7.0
// @description  修正悬停隐藏问题。只抹除作为消息发送的表情包，不干扰文字回应按钮。
// @author       User
// @match        https://web.telegram.org/k/*
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // 弃用模糊匹配 [class*="sticker"]
    // 改用 Web K 核心表情容器类名：
    // .sticker-fixed-size: 官方和大多数自制表情
    // .animated-sticker: 动态表情专用
    // video.media-sticker: 视频表情专用
    GM_addStyle(`
        /* 1. 核心屏蔽逻辑 */
        .bubble:has(.sticker-fixed-size),
        .bubble:has(.animated-sticker),
        .bubble:has(video.media-sticker),
        .bubble:has(img.media-sticker) {
            display: none !important;
        }

        /* 2. 补丁：防止某些混合消息被误删（可选） */
        /* 如果一条消息既有文字又有表情包，通常 TG 会拆分成两条气泡，所以这里很安全 */
        
        /* 3. 确保图片消息绝对显示 */
        .bubble:has(.media-photo) {
            display: flex !important;
        }
    `);
})();
