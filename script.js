// ==UserScript==
// @name         自动下单
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  自动下单
// @author       VPSLOG
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // 解析 hash 中的自定义格式参数，例如 #sleep:5|code:DISCOUNT123
    function getHashParameter(param) {
        var hash = window.location.hash.slice(1);  // 获取去掉 # 的部分
        var params = hash.split('_');  // 用 | 分隔参数
        for (var i = 0; i < params.length; i++) {
            var pair = params[i].split(':');  // 用 : 分隔键值对
            if (pair[0] === param) {
                return pair[1];  // 返回对应的值
            }
        }
        return null;  // 如果没有找到，返回 null
    }

    // 保存参数到 sessionStorage
    function saveToSessionStorage(param, value) {
        sessionStorage.setItem(param, value);
    }

    // 从 sessionStorage 获取参数
    function getFromSessionStorage(param) {
        return sessionStorage.getItem(param);
    }

    // 获取参数：优先从 hash 中获取，如果没有则从 sessionStorage 中获取
    function getParameter(param, defaultValue) {
        var valueFromHash = getHashParameter(param);
        if (valueFromHash !== null) {
            // 如果 hash 中有参数，则保存到 sessionStorage 并返回该参数
            saveToSessionStorage(param, valueFromHash);
            return valueFromHash;
        }
        // 如果 hash 中没有参数，则从 sessionStorage 中获取
        var valueFromSession = getFromSessionStorage(param);
        return valueFromSession !== null ? valueFromSession : defaultValue;  // 如果 sessionStorage 也没有，则返回默认值
    }

    // 初始化参数：优先从 hash 中获取，否则从 sessionStorage 中获取
    var sleep = getParameter('sleep', 5);  // 默认每隔 5 秒刷新一次
    var promoCode = getParameter('code', '');
    var noClick = getParameter('noclick', 'false');
    var checkInterval = getParameter('check', 100);  // 默认检查间隔为 500 毫秒

    // 如果 noclick 为 true，停止自动化操作
    if (noClick === 'false') {
        console.log('noclick=false, script will not auto-order.');
        return;
    }

    var urlParams = new URLSearchParams(window.location.search);
    var pageType = urlParams.get('a'); // 获取 'a' 参数

    // 开始自动化逻辑
    var sleepMS = parseInt(sleep) * 1000;
    var waitMS = parseInt(checkInterval);


    // Checkout：输入 promoCode 并点击 checkout 按钮
    function checkout(promoCode) {
        var promoCodeInput = document.querySelector('#inputPromotionCode');
        if (promoCodeInput) {
            promoCodeInput.value = promoCode;  // 输入优惠码
            document.querySelector('#checkout').click();  // 点击结账按钮
        } else {
            setTimeout(function () {
                checkout(promoCode);  // 等待后再次检查
            }, waitMS);
        }
    }

    // Complete：接受 TOS 并点击 complete 订单
    function complete() {
        var tosCheckbox = document.querySelector('#accepttos');
        if (tosCheckbox) {
            if (!tosCheckbox.checked) {
                tosCheckbox.click();  // 勾选复选框
            }
            document.querySelector('#btnCompleteOrder').click();  // 点击完成订单按钮
        } else {
            setTimeout(function () {
                complete();  // 等待后再次检查
            }, waitMS);
        }
    }

    // Configure：点击配置按钮
    function configure() {
        var configureButton = document.querySelector('#btnCompleteProductConfig');
        if (configureButton) {
            configureButton.click();  // 点击配置按钮
        } else {
            setTimeout(function () {
                configure();  // 等待后再次检查
            }, waitMS);
        }
    }

    // 根据 type 执行相应的函数，若不匹配则等待后重新加载页面

    if (pageType === 'confproduct') {
        configure();  // 执行 configure 操作
    } else if (pageType === 'view') {
        checkout(promoCode);  // 执行 checkout 操作
    } else if (pageType === 'checkout') {
        complete();  // 执行 complete 操作
    } else {
        setTimeout(function () {
            window.location.reload();  // 页面不匹配，等待后重新加载页面
        }, sleepMS);
    }

})();
