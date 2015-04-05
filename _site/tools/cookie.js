/* 
 * The MIT License
 *
 * Copyright 2015 Erich.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/*\
|*|
|*|  :: cookie.js ::
|*|
|*|  A complete cookies reader/writer framework with full unicode support.

|*|  Adapted from cookies.js from developoer.mozilla.org:
|*|  Revision #1 - September 4, 2014
|*|  https://developer.mozilla.org/en-US/docs/Web/API/document.cookie
|*|  https://developer.mozilla.org/User:fusionchess
|*|
|*|  Syntaxes:
|*|
|*|  get:    Cookie.item(name)
|*|  remove: Cookie.item(name, null)
|*|  set:    Cookie.item(name, value[, end[, path[, domain[, secure]]]])
|*|  names:  Cookie.itemNames
|*|
\*/

module.exports = Object.defineProperties( {}, {
    REMOVE: {
        value: null
    },
    item: { 
        value: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
            var cookies = document.cookie,
                result = decodeURIComponent(cookies.replace(new RegExp( "(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$" ), "$1")) || null,
                sExpires;
            if ( ! sKey ) return false;
            if ( arguments.length > 1 ) {
                if ( /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey) )
                    return false;
                sExpires = "";
                if ( sValue == null && arguments.length == 2 ) {
                    // if null remove if it exists
                    if ( result )
                        document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "");
                    
                } else {
                    if ( sValue == null && (sValue = result) == null )
                        return false;
                    if (vEnd) {
                        switch (vEnd.constructor) {
                          case Number:
                            sExpires = vEnd === Infinity ? "; expires=Tue, 19 Jan 2038 03:14:07 GMT" : "; max-age=" + vEnd;
                            break;
                          case String:
                            sExpires = "; expires=" + vEnd;
                            break;
                          case Date:
                            sExpires = "; expires=" + vEnd.toUTCString();
                            break;
                        }
                    }
                    document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
                }
            }
            return result
        }
    },
    itemNames: {
        get: function ( ) {
            var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/),
                nLen = aKeys.length,
                nIdx = -1;
            while ( nIdx++ < nLen ) {
                aKeys[nIdx] = decodeURIComponent(aKeys[nIdx])
            }
            return aKeys
        }
    }
} );
