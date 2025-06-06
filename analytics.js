(function () {
    "use strict";
    window.RudderSnippetVersion = "3.0.60";
    var identifier = "rudderanalytics";
    if (!window[identifier]) {
        window[identifier] = [];
    }
    var rudderanalytics = window[identifier];
    if (Array.isArray(rudderanalytics)) {
        if (rudderanalytics.snippetExecuted === true && window.console && console.error) {
            console.error("RudderStack JavaScript SDK snippet included more than once.");
        } else {
            rudderanalytics.snippetExecuted = true;
            window.rudderAnalyticsBuildType = "legacy";
            var sdkBaseUrl = "https://cdn.rudderlabs.com";
            var sdkVersion = "v3";
            var sdkFileName = "rsa.min.js";
            var scriptLoadingMode = "async";
            var methods = ["setDefaultInstanceKey", "load", "ready", "page", "track", "identify", "alias", "group", "reset", "setAnonymousId", "startSession", "endSession", "consent"];
            for (var i = 0; i < methods.length; i++) {
                var method = methods[i];
                rudderanalytics[method] = function (methodName) {
                    return function () {
                        if (Array.isArray(window[identifier])) {
                            rudderanalytics.push([methodName].concat(Array.prototype.slice.call(arguments)));
                        } else {
                            var _methodName;
                            (_methodName = window[identifier][methodName]) === null || _methodName === undefined || _methodName.apply(window[identifier], arguments);
                        }
                    };
                }(method);
            }
            try {
                new Function('class Test{field=()=>{};test({prop=[]}={}){return prop?(prop?.property??[...prop]):import("");}}');
                window.rudderAnalyticsBuildType = "modern";
            } catch (e) {
            }
            var head = document.head || document.getElementsByTagName("head")[0];
            var body = document.body || document.getElementsByTagName("body")[0];
            window.rudderAnalyticsAddScript = function (url, extraAttributeKey, extraAttributeVal) {
                var scriptTag = document.createElement("script");
                scriptTag.src = url;
                scriptTag.setAttribute("data-loader", "RS_JS_SDK");
                if (extraAttributeKey && extraAttributeVal) {
                    scriptTag.setAttribute(extraAttributeKey, extraAttributeVal);
                }
                if (scriptLoadingMode === "async") {
                    scriptTag.async = true;
                } else if (scriptLoadingMode === "defer") {
                    scriptTag.defer = true;
                }
                if (head) {
                    head.insertBefore(scriptTag, head.firstChild);
                } else {
                    body.insertBefore(scriptTag, body.firstChild);
                }
            };
            window.rudderAnalyticsMount = function () {
                (function () {
                    if (typeof globalThis === "undefined") {
                        var getGlobal = function getGlobal() {
                            if (typeof self !== "undefined") {
                                return self;
                            }
                            if (typeof window !== "undefined") {
                                return window;
                            }
                            return null;
                        };
                        var global = getGlobal();
                        if (global) {
                            Object.defineProperty(global, "globalThis", {
                                value: global,
                                configurable: true
                            });
                        }
                    }
                })();
                window.rudderAnalyticsAddScript("".concat(sdkBaseUrl, "/").concat(sdkVersion, "/").concat(window.rudderAnalyticsBuildType, "/").concat(sdkFileName), "data-rsa-write-key", "1tLM5JN9u3GhRUidt5zjU0Uc5Qf");
            };
            if (typeof Promise === "undefined" || typeof globalThis === "undefined") {
                window.rudderAnalyticsAddScript("https://polyfill-fastly.io/v3/polyfill.min.js?version=3.111.0&features=Symbol%2CPromise&callback=rudderAnalyticsMount");
            } else {
                window.rudderAnalyticsMount();
            }
            var loadOptions = {};
            rudderanalytics.load("1tLM5JN9u3GhRUidt5zjU0Uc5Qf", "https://analytics.lightdash.com", loadOptions);
        }
    }

    // Store current URL
    let currentUrl = undefined;

    // Store the original pushState and replaceState functions
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    // Function to call RudderStack's page view
    function trackPageView() {
        // Double-check if the URL has changed
        if( currentUrl !== window.location.href) {
            currentUrl = window.location.href;
            window.rudderanalytics.page();
        }
    }

    // Override pushState to track page view
    history.pushState = function () {
        originalPushState.apply(this, arguments);
        trackPageView();
    };

    // Override replaceState to track page view
    history.replaceState = function () {
        originalReplaceState.apply(this, arguments);
        trackPageView();
    };

    // Listen for popstate event (browser back/forward buttons) to track page view
    window.addEventListener('popstate', trackPageView);
})();