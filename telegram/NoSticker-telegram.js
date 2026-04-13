// ==UserScript==
// @name         Telegram Web K 表情包彻底抹除 (智能无误伤版)
// @namespace    http://tampermonkey.net/
// @version      8.0
// @description  只抹除纯表情包消息。如果消息中包含文字内容，则完整保留。
// @author       User
// @match        https://web.telegram.org/k/*
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // 逻辑升级：
    // 1. 利用 .bubble.is-sticker：这是 Web K 专门给“纯表情包消息”打的标签。
    // 2. 利用 :not(:has(.message))：确保气泡内没有文字正文区域。
    // 3. 这样可以完美保留 projectXtls 等频道中带有小表情的文字消息。
    GM_addStyle(`
        /* 屏蔽那些被官方标记为纯表情包的消息 */
        .bubble.is-sticker {
            display: none !important;
        }

        /* 兜底规则：如果气泡内含有表情包元素，且【不含有】文字正文区域(.message)，才屏蔽 */
        .bubble:not(:has(.message)):has(.sticker-fixed-size),
        .bubble:not(:has(.message)):has(.animated-sticker),
        .bubble:not(:has(.message)):has(video.media-sticker),
        .bubble:not(:has(.message)):has(img.media-sticker) {
            display: none !important;
        }

        /* 补丁：确保包含文字 (.message) 的消息气泡绝对显示 */
        .bubble:has(.message) {
            display: flex !important;
        }

        /* 补丁：确保图片消息绝对显示 */
        .bubble:has(.media-photo) {
            display: flex !important;
        }
    `);
})();
