var IframeHandler = require('../helper/iframe-handler');

function SilentAuthenticationHandler(options) {
  this.authenticationUrl = options.authenticationUrl;
  this.timeout = options.timeout || 60 * 1000;
  this.handler = null;
  this.postMessageDataType = options.postMessageDataType || false;
}

SilentAuthenticationHandler.create = function(options) {
  return new SilentAuthenticationHandler(options);
};

SilentAuthenticationHandler.prototype.login = function(usePostMessage, callback) {
  this.handler = new IframeHandler({
    auth0: this.auth0,
    url: this.authenticationUrl,
    eventListenerType: usePostMessage ? 'message' : 'load',
    callback: this.getCallbackHandler(callback, usePostMessage),
    timeout: this.timeout,
    eventValidator: this.getEventValidator(),
    timeoutCallback: function() {
      callback(null, '#error=timeout&error_description=Timeout+during+authentication+renew.');
    },
    usePostMessage: usePostMessage || false
  });

  this.handler.init();
};

SilentAuthenticationHandler.prototype.getEventValidator = function() {
  var _this = this;
  return {
    isValid: function(eventData) {
      switch (eventData.event.type) {
        case 'message':
          // Default behaviour, return all message events.
          if (_this.postMessageDataType === false) {
            return true;
          }

          return (
            eventData.event.data.type && eventData.event.data.type === _this.postMessageDataType
          );

        case 'load': // Fall through to default
        default:
          return true;
      }
    }
  };
};

SilentAuthenticationHandler.prototype.getCallbackHandler = function(callback, usePostMessage) {
  return function(eventData) {
    var callbackValue;
    if (!usePostMessage) {
      callbackValue = eventData.sourceObject.contentWindow.location.hash;
    } else if (typeof eventData.event.data === 'object' && eventData.event.data.hash) {
      callbackValue = eventData.event.data.hash;
    } else {
      callbackValue = eventData.event.data;
    }
    callback(null, callbackValue);
  };
};

module.exports = SilentAuthenticationHandler;
