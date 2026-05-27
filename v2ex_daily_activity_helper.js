// ==UserScript==
// @name         V2EX 每日活跃度助手
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  自动刷新页面增加每日活跃度，显示百分比进度（无按钮自动模式）
// @author       Helper
// @match        *://v2ex.com/*
// @match        *://www.v2ex.com/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // ==================== 配置 ====================
    const REFRESH_MIN_INTERVAL = 5000;   // 最小间隔 5秒
    const REFRESH_MAX_INTERVAL = 20000;  // 最大间隔 20秒
    const MAX_REFRESH_ATTEMPTS = 50;     // 最大刷新次数限制
    const BALANCE_PAGE = 'https://www.v2ex.com/balance';

    // ==================== 状态变量 ====================
    let isAutoRefreshing = false;
    let refreshCount = 0;
    let scriptStartTime = Date.now();
    let isActivityCompleted = false;
    let panelElement = null;

    // ==================== 工具函数 ====================
    function log(msg) {
        console.log(`[V2EX活跃度助手] ${msg}`);
    }

    function getTodayDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const date = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${date}`;
    }

    function isAfter8AM() {
        return new Date().getHours() >= 8;
    }

    function getActivityPercentage() {
        const activityBar = document.querySelector('.member-activity-bar');
        if (!activityBar) return null;

        const innerDiv = activityBar.querySelector('[class*="member-activity"]');
        if (!innerDiv) return null;

        const widthStr = window.getComputedStyle(innerDiv).width;
        const barWidth = window.getComputedStyle(activityBar).width;

        if (widthStr && barWidth) {
            const actualWidth = parseFloat(widthStr);
            const maxWidth = parseFloat(barWidth);
            const percentage = Math.round((actualWidth / maxWidth) * 100);
            return Math.min(100, percentage);
        }
        return null;
    }

    function updatePercentageDisplay() {
        const percentage = getActivityPercentage();
        if (percentage === null) return;

        const activityBar = document.querySelector('.member-activity-bar');
        if (!activityBar) return;

        let displayDiv = activityBar.querySelector('.activity-percentage-display');
        if (!displayDiv) {
            displayDiv = document.createElement('div');
            displayDiv.className = 'activity-percentage-display';
            activityBar.appendChild(displayDiv);
        }
        displayDiv.textContent = `${percentage}%`;
        displayDiv.style.cssText = `
            text-align: center;
            font-size: 12px;
            color: #666;
            font-weight: bold;
            margin-top: 5px;
        `;
        return percentage;
    }

    // 智能刷新间隔：进度越高，间隔越长
    function getAdaptiveInterval(percentage) {
        if (!percentage) percentage = 0;
        if (percentage >= 90) return 30000 + Math.random() * 20000;  // 30-50秒
        if (percentage >= 70) return 15000 + Math.random() * 15000;  // 15-30秒
        return REFRESH_MIN_INTERVAL + Math.random() * (REFRESH_MAX_INTERVAL - REFRESH_MIN_INTERVAL);
    }

    // ==================== 存储操作 ====================
    function isActivityCompletedToday() {
        const completedDate = GM_getValue('activity_completed_date', null);
        return completedDate === getTodayDate();
    }

    function markActivityAsCompleted() {
        GM_setValue('activity_completed_date', getTodayDate());
        isActivityCompleted = true;
    }

    function hasRunTodayBefore() {
        const lastRunDate = GM_getValue('last_run_date', null);
        return lastRunDate === getTodayDate();
    }

    function markTodayAsRun() {
        GM_setValue('last_run_date', getTodayDate());
    }

    // 保存刷新状态（用于页面刷新后恢复）
    function saveRefreshState() {
        GM_setValue('auto_refreshing', true);
        GM_setValue('refresh_count', refreshCount);
        GM_setValue('script_start_time', scriptStartTime);
    }

    function clearRefreshState() {
        GM_setValue('auto_refreshing', false);
        GM_setValue('refresh_count', 0);
        GM_setValue('script_start_time', 0);
    }

    function restoreRefreshState() {
        const saved = GM_getValue('auto_refreshing', false);
        if (saved) {
            isAutoRefreshing = true;
            refreshCount = GM_getValue('refresh_count', 0);
            scriptStartTime = GM_getValue('script_start_time', Date.now());
            log(`恢复刷新状态：已刷新 ${refreshCount} 次`);
            return true;
        }
        return false;
    }

    // ==================== 完成检测（使用 GM_xmlhttpRequest 避免 CORS） ====================
    function checkIfActivityComplete() {
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: BALANCE_PAGE,
                onload: function(response) {
                    const html = response.responseText;
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const todayDate = getTodayDate();

                    const notifications = doc.querySelectorAll('.notifications div, .notification, [class*="notification"]');
                    for (let notif of notifications) {
                        const text = notif.textContent || '';
                        if (text.includes('每日活跃度奖励') && text.includes(todayDate)) {
                            resolve(true);
                            return;
                        }
                    }

                    const pageText = doc.body.textContent;
                    resolve(pageText.includes('每日活跃度奖励') && pageText.includes(todayDate));
                },
                onerror: function(err) {
                    log(`检查余额页面出错: ${err.error}`);
                    resolve(false);
                }
            });
        });
    }

    // ==================== 面板控制 ====================
    function showPanel() {
        if (panelElement) return;

        panelElement = document.createElement('div');
        panelElement.id = 'activity-control-panel';
        panelElement.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: white;
            border: 2px solid #3366cc;
            border-radius: 8px;
            padding: 12px 15px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 999999;
            font-family: Arial, sans-serif;
            min-width: 260px;
            font-size: 12px;
        `;
        panelElement.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 8px; color: #3366cc;">
                🚀 V2EX 活跃度助手
            </div>
            <div style="margin-bottom: 5px;">刷新次数: <span id="refresh-count">0</span></div>
            <div style="margin-bottom: 5px;">当前活跃度: <span id="current-percentage">-</span>%</div>
            <div style="margin-bottom: 5px;">运行时间: <span id="run-time">0</span> 秒</div>
            <div>状态: <span id="status-text" style="color: green;">运行中</span></div>
        `;
        document.body.appendChild(panelElement);

        // 定期更新面板信息
        setInterval(() => {
            if (panelElement && document.getElementById('activity-control-panel')) {
                updatePanelInfo();
            }
        }, 1000);
    }

    function hidePanel() {
        if (panelElement) {
            panelElement.remove();
            panelElement = null;
        }
    }

    function updatePanelInfo() {
        if (!panelElement) return;

        const percentage = getActivityPercentage() || 0;
        const runTime = Math.floor((Date.now() - scriptStartTime) / 1000);

        const countSpan = document.getElementById('refresh-count');
        const percentSpan = document.getElementById('current-percentage');
        const timeSpan = document.getElementById('run-time');
        const statusSpan = document.getElementById('status-text');

        if (countSpan) countSpan.textContent = refreshCount;
        if (percentSpan) percentSpan.textContent = percentage;
        if (timeSpan) timeSpan.textContent = runTime;

        if (statusSpan) {
            if (isActivityCompleted) {
                statusSpan.textContent = '✅ 今日已完成';
                statusSpan.style.color = 'green';
            } else if (isAutoRefreshing) {
                statusSpan.textContent = '🟢 运行中';
                statusSpan.style.color = 'green';
            } else {
                statusSpan.textContent = '⚫ 已停止';
                statusSpan.style.color = 'red';
            }
        }
    }

    // ==================== 核心刷新逻辑 ====================
    async function autoRefresh() {
        if (!isAutoRefreshing) return;

        refreshCount++;
        const percentage = updatePercentageDisplay() || 0;
        log(`第 ${refreshCount} 次刷新, 当前活跃度: ${percentage}%`);

        // 检查是否达到 100%
        if (percentage >= 100) {
            log('进度条已达到 100%，检查奖励页面...');
            const isComplete = await checkIfActivityComplete();
            if (isComplete) {
                log('✅ 成功获得每日活跃度奖励！');
                markActivityAsCompleted();
                isAutoRefreshing = false;
                clearRefreshState();
                hidePanel();
                return;
            } else {
                log('进度条满但未收到奖励，继续刷新...');
            }
        }

        // 刷新次数限制
        if (refreshCount >= MAX_REFRESH_ATTEMPTS) {
            log(`已达到最大刷新次数 (${MAX_REFRESH_ATTEMPTS})，停止刷新`);
            isAutoRefreshing = false;
            clearRefreshState();
            hidePanel();
            return;
        }

        // 计算下次刷新间隔
        const nextInterval = getAdaptiveInterval(percentage);
        log(`将在 ${(nextInterval / 1000).toFixed(1)} 秒后进行第 ${refreshCount + 1} 次刷新...`);

        await new Promise(resolve => setTimeout(resolve, nextInterval));

        if (isAutoRefreshing) {
            // 保存状态并刷新页面
            saveRefreshState();
            location.reload();
        }
    }

    // 启动自动刷新（条件检查通过后调用）
    function startAutoRefresh() {
        if (isAutoRefreshing) {
            log('自动刷新已运行中');
            return;
        }

        // 最终条件检查
        if (isActivityCompletedToday()) {
            log('今日活跃已完成，不启动');
            return;
        }
        if (!isAfter8AM()) {
            log(`未到8点 (当前${new Date().getHours()}点)，不启动`);
            return;
        }
        if (getActivityPercentage() >= 100) {
            log('进度条已满，无需刷新');
            return;
        }

        isAutoRefreshing = true;
        markTodayAsRun();
        showPanel();
        log('开始自动刷新页面...');
        autoRefresh();
    }

    // ==================== 初始化 ====================
    function initScript() {
        // 添加样式
        GM_addStyle(`
            .activity-percentage-display {
                animation: pulse 1s infinite;
            }
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
        `);

        // 先显示百分比（如果存在）
        updatePercentageDisplay();

        // 检查今日是否已完成
        if (isActivityCompletedToday()) {
            log('今日活跃已完成，脚本退出');
            return;
        }

        // 尝试恢复之前未完成的刷新任务
        const hasPendingRefresh = restoreRefreshState();
        if (hasPendingRefresh) {
            // 检查进度是否已满或已完成
            if (getActivityPercentage() >= 100) {
                log('进度已满，无需继续刷新');
                clearRefreshState();
                return;
            }
            log('检测到未完成的刷新任务，继续执行');
            showPanel();
            autoRefresh();
            return;
        }

        // 全新运行：检查条件后启动
        if (!isAfter8AM()) {
            log(`当前时间 ${new Date().toLocaleTimeString()}，未到8点，脚本不启动`);
            return;
        }
        if (hasRunTodayBefore()) {
            log(`今天 (${getTodayDate()}) 已运行过，不再自动启动`);
            return;
        }
        if (getActivityPercentage() >= 100) {
            log('进度条已满，无需刷新');
            return;
        }

        // 满足条件，自动启动
        startAutoRefresh();
    }

    // 页面加载后执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initScript);
    } else {
        initScript();
    }
})();
