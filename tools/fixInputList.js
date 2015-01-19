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

function _getAbsoluteOffset ( element ) {
    var elt = element,
        left = 0,
        top = 0;
    do {
        left += elt.offsetLeft;
        top += elt.offsetTop;
    } while ( elt = elt.offsetParent );
    return { left: left, top: top, width: element.offsetWidth, height: element.offsetHeight }
}

function createStylesheet ( containerElement ) {
    var style = document.createElement( 'style' );
    style.textContent = [
        '.fix-input-list{position:absolute;display:inline-block;box-sizing:border-box;border:solid 1px darkgray;margin:0;padding:0;font-family:sans-serif;z-index:',fixInputList.zIndex,';overflow:auto;background-color:white;}',
        '.fix-input-list>div{box-sizing:border-box;padding:1px 5px;}',
        '.fix-input-list>div:hover{background-color:lightgray;cursor:pointer;}'
    ].join('');
    return (containerElement || document.head || document.body).appendChild( style )
}

function fixInputList ( inputElement ) {
    var listElement, listId,
        _fixList = document.createElement( 'div' ),
        _isOpen = false,
        _open = function ( ) {
            if ( _isOpen ) return;
            var abs = _getAbsoluteOffset( inputElement ),
                left = (abs.left + abs.width < window.innerWidth)
                        ? abs.left : abs.left + abs.width - _fixList.offsetWidth,
                top = (abs.top < window.innerHeight / 2)
                        ? abs.top + abs.height : abs.top - _fixList.offsetHeight,
                cb;
            _fixList.style.left = left + 'px';
            _fixList.style.top = top + 'px';
            _fixList.style.maxHeight = (window.innerHeight - abs.top - abs.height) + 'px';
            document.body.appendChild( _fixList );
            _isOpen = true
            inputElement.addEventListener( 'blur', cb = function ( evt ) {
                inputElement.removeEventListener( 'blur', cb );
                setTimeout( function( ) {
                    _close( evt );
                }.bind( this ), 200 )
            }, false );
        },
        _close = function ( evt ) {
            if ( ! _isOpen ) return;
//            console.log( evt );
            _isOpen = false;
            document.body.removeChild( _fixList )
        },
        _change = new MouseEvent('change', {
            'view': window,
            'bubbles': true,
            'cancelable': true
          } ),
        _select = function ( evt ) {
//            console.log( evt );
            inputElement.value = this.dataset.value;
            inputElement.dispatchEvent( _change );
            _close( evt )
        },
        _obconf = { attributes: true, childList: true, characterData: true },
        _observer = observer = new MutationObserver(function(mutations) {
            var t;
            mutations.forEach(function(mutation) {
                console.log( mutation );
                switch (mutation.type) {
                    case 'childList':
                        mutations.forEach.call( mutation.removedNodes, function ( elt ) {
//                            debugger;
                            if ( (t = _fixList.querySelector( ['div[data-value="', elt.value, '"]'].join('') )) )
                                _fixList.removeChild( t );
                        } )
                        mutations.forEach.call( mutation.addedNodes, function ( elt ) {
//                            debugger;
                            (t = document.createElement( 'div' )).dataset.value = elt.value;
                            t.textContent = elt.textContent;
                            _fixList.insertBefore( t, _fixList.firstElementChild );
                            t.addEventListener( 'click', _select, false );
                        } )
                }
            })
        }),
        c, cl, e, i, t;
    if ( inputElement.tagName.toUpperCase() !== 'INPUT' ) {
        console.error( 'element '
                + inputElement.tagName + ((t=inputElement.id)?'#'+t:'')
                + ((t=inputElement.className)?'.'+t.split(/\s+/).join('.'):'')
                + ' is not an input element');
        return false
    }
    if ( ! (listId = inputElement.getAttribute( 'list' )) ) {
        console.error( 'no list attribute for element '
                + inputElement.tagName + ((t=inputElement.id)?'#'+t:'')
                + ((t=inputElement.className)?'.'+t.split(/\s+/).join('.'):'') );
        return false
    }
    if ( ! (listElement = document.querySelector('datalist#' + listId )) ) {
        console.error( 'no list element(datalist#' + listId + ') for '
                + inputElement.tagName + ((t=inputElement.id)?'#'+t:'')
                + ((t=inputElement.className)?'.'+t.split(/\s+/).join('.'):'') );
        return false
    }
    
    inputElement.removeAttribute( 'list' );
    inputElement.setAttribute( 'autocomplete', 'off' );
    inputElement.setAttribute( 'fix-list', listId );
    
    cl = listElement.children;
    for (i = 0; i < cl.length; i++) {
        (e = document.createElement( 'div' )).textContent = (c=cl[i]).textContent || e.value;
        e.dataset.value = c.getAttribute( 'value' );
        _fixList.appendChild( e )
        e.addEventListener( 'click', _select, false );
    }
    _fixList.id = listId;
    _fixList.className = 'fix-input-list';
    inputElement.addEventListener( 'focus', _open, false );
    
    _observer.observe(listElement, _obconf);
}

Object.defineProperties ( fixInputList, {
    createStylesheet: { value: createStylesheet }
} );
fixInputList.zIndex = Number.MAX_SAFE_INTEGER;

module.exports = fixInputList