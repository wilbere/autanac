autanac.define('mail.utils', function (require) {
"use strict";

var core = require('web.core');

var _t = core._t;

function parseAndTransform(htmlString, transformFunction) {
    var openToken = "OPEN" + Date.now();
    var string = htmlString.replace(/&lt;/g, openToken);
    var children;
    try {
        children = $('<div>').html(string).contents();
    } catch (e) {
        children = $('<div>').html('<pre>' + string + '</pre>').contents();
    }
    return _parseAndTransform(children, transformFunction)
                .replace(new RegExp(openToken, "g"), "&lt;");
}
/**
 * @param {Node[]} nodes
 * @param {function} transformFunction with:
 *   param node
 *   param function
 *   return string
 * @return {string}
 */
function _parseAndTransform(nodes, transformFunction) {
    return _.map(nodes, function (node) {
        return transformFunction(node, function () {
            return _parseAndTransform(node.childNodes, transformFunction);
        });
    }).join("");
}

// Suggested URL Javascript regex of http://stackoverflow.com/questions/3809401/what-is-a-good-regular-expression-to-match-a-url
// Adapted to make http(s):// not required if (and only if) www. is given. So `should.notmatch` does not match.
var urlRegexp = /\b(?:https?:\/\/\d{1,3}(?:\.\d{1,3}){3}|(?:https?:\/\/|(?:www\.))[-a-z0-9@:%._+~#=]{2,256}\.[a-z]{2,13})\b(?:[-a-z0-9@:%_+.~#?&'$//=;]*)/gi;
/**
 * @param {string} text
 * @param {Object} [attrs={}]
 * @return {string} linkified text
 */
function linkify(text, attrs) {
    attrs = attrs || {};
    if (attrs.target === undefined) {
        attrs.target = '_blank';
    }
    if (attrs.target === '_blank') {
      attrs.rel = 'noreferrer noopener';
    }
    attrs = _.map(attrs, function (value, key) {
        return key + '="' + _.escape(value) + '"';
    }).join(' ');
    return text.replace(urlRegexp, function (url) {
        var href = (!/^https?:\/\//i.test(url)) ? "http://" + url : url;
        return '<a ' + attrs + ' href="' + href + '">' + url + '</a>';
    });
}

function addLink(node, transformChildren) {
    if (node.nodeType === 3) {  // text node
        const linkified = linkify(node.data);
        if (linkified !== node.data) {
            const div = document.createElement('div');
            div.innerHTML = linkified;
            for (const childNode of [...div.childNodes]) {
                node.parentNode.insertBefore(childNode, node);
            }
            node.parentNode.removeChild(node);
            return linkified;
        }
        return node.textContent;
    }
    if (node.tagName === "A") return node.outerHTML;
    transformChildren();
    return node.outerHTML;
}

/**
 * @param {string} htmlString
 * @return {string}
 */
function htmlToTextContentInline(htmlString) {
    const fragment = document.createDocumentFragment();
    const div = document.createElement('div');
    fragment.appendChild(div);
    try {
        div.innerHTML = htmlString;
    } catch (e) {
        div.innerHTML = `<pre>${htmlString}</pre>`;
    }
    return div
        .textContent
        .trim()
        .replace(/[\n\r]/g, '')
        .replace(/\s\s+/g, ' ');
}

function stripHTML(node, transformChildren) {
    if (node.nodeType === 3) return node.data;  // text node
    if (node.tagName === "BR") return "\n";
    return transformChildren();
}

function inline(node, transform_children) {
    if (node.nodeType === 3) return node.data;
    if (node.nodeType === 8) return "";
    if (node.tagName === "BR") return " ";
    if (node.tagName.match(/^(A|P|DIV|PRE|BLOCKQUOTE)$/)) return transform_children();
    node.innerHTML = transform_children();
    return node.outerHTML;
}

// Parses text to find email: Tagada <address@mail.fr> -> [Tagada, address@mail.fr] or False
function parseEmail(text) {
    if (text){
        var result = text.match(/(.*)<(.*@.*)>/);
        if (result) {
            return [_.str.trim(result[1]), _.str.trim(result[2])];
        }
        result = text.match(/(.*@.*)/);
        if (result) {
            return [_.str.trim(result[1]), _.str.trim(result[1])];
        }
        return [text, false];
    }
}

// Replaces textarea text into html text (add <p>, <a>)
// TDE note : should be done server-side, in Python -> use mail.compose.message ?
function getTextToHTML(text) {
    return text
        .replace(/((?:https?|ftp):\/\/[\S]+)/g,'<a href="$1">$1</a> ')
        .replace(/[\n\r]/g,'<br/>');
}

function timeFromNow(date) {
    if (moment().diff(date, 'seconds') < 45) {
        return _t("now");
    }
    return date.fromNow();
}

function o_clearTimeout(id) {
    return clearTimeout(id);
}

function o_setTimeout(func, delay) {
    return setTimeout(func, delay);
}

return {
    addLink: addLink,
    getTextToHTML: getTextToHTML,
    htmlToTextContentInline,
    inline: inline,
    linkify: linkify,
    parseAndTransform: parseAndTransform,
    parseEmail: parseEmail,
    stripHTML: stripHTML,
    timeFromNow: timeFromNow,
    clearTimeout: o_clearTimeout,
    setTimeout: o_setTimeout,
};

});
