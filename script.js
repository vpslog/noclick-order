// ==UserScript==
// @name         自动下单
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  自动下单
// @author       VPSLOG
// @match        *://*/*cart.php*
// @match        *://*/*index.php*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // 检查 localStorage 是否已有关闭状态
    if (localStorage.getItem('noclickClosed') === 'true') {
        console.log("UI has been closed previously. Exiting...");
        return;  // 如果已关闭过，跳过执行
    }

    function injectStyles() {
        var style = document.createElement('style');
        style.innerHTML = `
        #floatingInputContainer {
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 10px;  /* 减小 padding 使容器更紧凑 */
            background-color: #fff;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            z-index: 9999;
            border-radius: 8px;
            width: 250px;
            box-sizing: border-box;  /* 防止 padding 增加整体宽度 */
        }

        /* label 到 input 之间的距离 */
        #floatingInputContainer label {
            font-size: 14px;
            margin-bottom: 2px;  /* 减小 label 的下边距 */
            display: block;  /* 确保 label 是块级元素 */
        }

        #floatingInputContainer input, #floatingInputContainer button {
            width: 100%;
            padding: 8px;  /* 减小 padding 使输入框和按钮更紧凑 */
            margin-bottom: 4px;  /* 减小 margin，减少垂直间距 */
            border-radius: 4px;
            border: 1px solid #ccc;
            box-sizing: border-box;  /* 保证 padding 不会超出容器 */
            line-height: 1.2;  /* 缩小行高，减少输入框中的间距 */
        }

            /* 关闭按钮样式 */
            #closeButton {
                background-color: gray;
            }

        #executeButton {
                background-color: #007bff;;
            }

        #floatingInputContainer button {
            margin-top: 8px;  /* 减小 margin，减少垂直间距 */
            color: white;
            border: none;
        }

            /* 使按钮和关闭按钮在同一行 */
            #floatingInputContainer .button-container {
                display: flex;
                justify-content: space-between;
                gap: 10px;
            }


    `;
        document.head.appendChild(style);
    }

    // 2. 注入 HTML 创建浮动输入框，包括 Coupon Code 输入框
    function injectInputForm() {
        var formHTML = `
        <div id="floatingInputContainer">
            <label for="inputUsername">邮箱:</label>
            <input type="text" id="inputUsername" placeholder="Enter username">
            <label for="inputPassword">密码:</label>
            <input type="password" id="inputPassword" placeholder="Enter password">
            <label for="inputCouponCode">优惠码:</label>
            <input type="text" id="inputCouponCode" placeholder="Enter coupon code">
            <div class="button-container">
                <button id="executeButton">执行脚本</button>
                <button id="closeButton">关闭</button>
            </div>
        </div>
    `;
        document.body.insertAdjacentHTML('beforeend', formHTML);

        // 绑定关闭按钮事件
        document.querySelector('#closeButton').addEventListener('click', function () {
            //            localStorage.setItem('noclickClosed', 'true');  // 将关闭状态保存到 localStorage
            document.querySelector('#floatingInputContainer').style.display = 'none';  // 隐藏控件
        });

        // 给按钮绑定点击事件
        document.getElementById('executeButton').addEventListener('click', function () {
            var email = document.getElementById('inputUsername').value;
            var pass = document.getElementById('inputPassword').value;
            var promoCode = document.getElementById('inputCouponCode').value || '';
            
            // 保存到 sessionStorage
            saveToSessionStorage('email', email);
            saveToSessionStorage('pass', pass);
            saveToSessionStorage('code', promoCode);
            
            saveToSessionStorage('noclick',true)
            noclickRun()
            // if (username && password && couponCode) {
            //     console.log('Username:', username);
            //     console.log('Password:', password);
            //     console.log('Coupon Code:', couponCode);
            //     executeScript(username, password, couponCode); // 执行脚本
            // } else {
            //     alert('Please enter username, password, and coupon code!');
            // }
        });
    }

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

    // 自动登录
    function autoLogin() {
        var alreadyRegisteredButton = document.querySelector('#btnAlreadyRegistered');
        if (alreadyRegisteredButton) {
            alreadyRegisteredButton.click();  // 点击 "Already Registered" 按钮
        }
        // 1. 检查是否存在登录表单
        var loginContainer = document.querySelector('#containerExistingUserSignin');
        if (loginContainer) {
            // 2. 检查是否存在电子邮件和密码输入框
            var emailInput = document.querySelector('#inputLoginEmail');
            var passInput = document.querySelector('#inputLoginPassword');
            if (emailInput && passInput) {
                // 填写电子邮件和密码
                emailInput.value = email;
                passInput.value = pass;

                // 点击登录按钮
                document.querySelector('#btnExistingLogin').click();
                console.log('Attempting auto-login with email:', email);
            } else {
                console.log('No email and pass, abort');
            }
        }
    }

    // Complete：接受 TOS 并点击 complete 订单
    function complete() {
        var CompleteOrderButton = document.querySelector('#btnCompleteOrder')
        if (CompleteOrderButton) {
            // 1. 检查是否存在 "account active" 元素
            // 2. 如果 "account active" 元素存在，则执行接下来的操作
            var accountActive = document.querySelector('.account.active');
            if (accountActive) {
                var tosCheckbox = document.querySelector('#accepttos');
                if (!tosCheckbox.checked) {
                    tosCheckbox.checked = true;  // 直接修改 checked 属性
                }
                CompleteOrderButton.click();  // 点击完成订单按钮
            } else {
                // 如果没有找到 "account active" 元素，则不尝试自动登录
                console.log('Account information not available. Waiting for account...');
                autoLogin()
                // setTimeout(function() {
                //     complete();  // 等待后再次检查
                // }, 20000);
            }
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
            setTimeout(function () {
                configureButton.click();  // 延迟 200ms 后点击配置按钮
            }, 200);  // 等待 200 毫秒后点
        } else {
            setTimeout(function () {
                configure();  // 等待后再次检查
            }, waitMS);
        }
    }



    // 初始化参数：优先从 hash 中获取，否则从 sessionStorage 中获取
    var sleep = getParameter('sleep', 5);  // 默认每隔 5 秒刷新一次
    var promoCode = getParameter('code', '');
    var noClick = getParameter('noclick', 'false');
    var checkInterval = getParameter('check', 100);  // 默认检查间隔为 500 毫秒
    var CreateAccount = getParameter('create', 'false');  // 默认检查间隔为 500 毫秒
    var email = getParameter('email', null);  // 默认空字符串
    var pass = getParameter('pass', null);    // 默认空字符串

    var urlParams = new URLSearchParams(window.location.search);
    var pageType = urlParams.get('a'); // 获取 'a' 参数

    // 开始自动化逻辑
    var sleepMS = parseInt(sleep) * 1000;
    var waitMS = parseInt(checkInterval);

    injectStyles(); // 注入样式
    injectInputForm(); // 注入浮动输入框

    // 如果 noclick 为 true，停止自动化操作
    if (noClick === 'false') {
        console.log('noclick=false, script will not auto-order.');
        return;
    } else {
        noclickRun()
    }

    function noclickRun() {
        // 根据 type 执行相应的函数，若不匹配则等待后重新加载页面
        if (pageType === 'confproduct') {
            configure();  // 执行 configure 操作
        } else if (pageType === 'viewinvoice') {
            //pass
            console.log('Congratulations! This is the invoice view page.');
        } else if (pageType === 'view') {
            checkout(promoCode);  // 执行 checkout 操作
        } else if (pageType === 'checkout') {
            complete();  // 执行 complete 操作
        } else {
            setTimeout(function () {
                window.location.reload();  // 页面不匹配，等待后重新加载页面
            }, sleepMS);
        }
    }
})();
