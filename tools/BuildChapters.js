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

var PullJSON = function (file) {
        var xhr = new XMLHttpRequest, r;
        xhr.open('get', file, false);
        xhr.send(null);
        return (r = xhr.responseText) ? JSON.parse(r) : null
    },
    PullHeaders = function (file) {
        var xhr = new XMLHttpRequest, r;
        xhr.open('head', file, false);
        xhr.send(null);
        return (r = xhr.getAllResponseHeaders()) ? r : null
    },
    _FIELDS = {
        "name": true,
        "location": true,
        "country": true,
        "region": true,
        "organizers": true,
        "website": false,
        "twitter": false,
        "facebook": false,
        "repo": true
    },
    _getRegions = function ( ) {
        var l = this.regions,
            r = {},
            i = 0,
            t, c;
        while( (t = l[++i]) ) {
            if ( r[t.region] && confirm( ['duplicate region "', t.region, '". skip?'].join('') ) )
                continue;
            r[t.region] = t;
        }
        c = {};
        l = Object.keys( r );
        l.sort();
        i = -1;
        while ( (t = l[++i]) )
            c[t] = r[t];
        return c
    },
    _getChapters = function ( ) {
        var l = this.regions,
            r = {},
            i = -1,
            c, j, q, s, t, u;
        while( (t = l[++i]) ) {
            u  = t.region;
            q = t.chapters;
            j = -1;
            while ( (c = q[++j]) ) {
                if ( r[c.name] && confirm( ['duplicate chapter "', c.name, '". skip?'].join('') ) ) {
                    continue;
                } else if ( c.region !== u && alert( ['chapter "', c.name, '" region is "', c.region, '", but listed within the "', u, '" region, fix the region?'].join('') )) {
                    c.region = u;
                }
                r[c.name] = c
            }
        }
        c = {};
        l = Object.keys( r );
        if ( this.total !== l.length )
            alert( 'total(', this.total, ') mismatch, found ', l.length, ' chaptera' );
        l.sort();
        i = -1;
        while ( (t = l[++i]) )
            c[t] = r[t];
        return c
    },
    _getOrganizers = function ( ) {
        var l = this.regions,
            r = {},
            i = -1,
            c, j, k, q, s, t, u, v, w;
        while( (t = l[++i]) ) {
            u  = t.region;
            q = t.chapters;
            j = -1;
            while ( (c = q[++j]) ) {
                if ( r[c.name] && confirm( ['duplicate chapter "', c.name, '". skip?'].join('') ) ) {
                    continue;
                } else if ( c.region !== u && alert( ['chapter "', c.name, '" region is "', c.region, '", but listed within the "', u, '" region, fix the region?'].join('') ) ) {
                    c.region = u;
                } else if ( ( ! (v = c.organizers) || ! v.length ) && confirm( ['no organizer for ', c.name, ', use anonymous?'].join('') ) ) {
                    v = ['anonymous']
                }
                k = -1;
                while ( (w = v[++k]) != null ) {
                    if( r[w] instanceof Array )
                        r[w].push( c );
                    else
                        r[w] = [c];
                }
            }
        }
        c = {};
        l = Object.keys( r );
        l.sort();
        i = -1;
        while ( (t = l[++i]) )
            c[t] = r[t];
        return c
    },
    _createChapter = function ( o, r ) {
        var k;
        if ( ! (r instanceof Object) )
            r = {};
        for ( k in _FIELDS ) {
            if ( _FIELDS[k] ) {
                if ( ! o[k] || ! o[k].length ) {
                    alert( 'missing ' + k + 'field' );
                    return null
                }
            }
            if ( ! o[k] && _FIELDS[k] ) {
                alert( 'missing ' + k + 'field' );
                return null
            }
            if ( k === 'organizers' ) {
                r[k] = o[k] || [];
            } else {
                r[k] = o[k] || '';
            }
        }
        return r
    },
    _getRegionByName = function ( name ) {
        var regions = this.regions,
            i = -1,
            r;
        name = name.toLowerCase();
        while ( (r = regions[++i]) ) {
            if ( r.region.toLowerCase() === name )
                return r
        }
        return null
    },
    _getChapterByName = function ( name, regionName ) {
        var regions = this.regions,
            i = -1,
            regions, list, c, r;
        name = name.toLowerCase();
        if ( regionName ) {
            if ( (r = _getRegionByName.call( this, regionName )) && (list = r.chapters) ) {
                while ( (c = list[++i]) ) {
                    if ( c.name.toLowerCase() === name )
                        return c;
                }
            }
        } else {
            while ( (r = regions[++i]) ) {
                if ( (list = r.chapters) ) {
                    while ( (c = list[++i]) ) {
                        if ( c.name.toLowerCase() === name )
                            return c;
                    }
                }
            }
        }
        return null
    },
    _removeChapterByName = function ( name, regionName ) {
        var regions = this.regions,
            i = -1,
            regions, list, c, r;
        name = name.toLowerCase();
        if ( regionName ) {
            if ( (r = _getRegionByName.call( this, regionName )) && (list = r.chapters) ) {
                while ( (c = list[++i]) ) {
                    if ( c.name.toLowerCase() === name )
                        return c;
                }
            }
        } else {
            while ( (r = regions[++i]) ) {
                if ( (list = r.chapters) ) {
                    while ( (c = list[++i]) ) {
                        if ( c.name.toLowerCase() === name ) {
                            list.splice( i, 1 );
                            r.count = list.length;
                            this.total -= 1;
                            return c;
                        }
                    }
                }
            }
        }
        return null
    },
    _removeChapter = function ( chapter ) {
        return _removeChapterByName.call( this, chapter.name, chapter.region )
    },
    _insertChapter = function ( chapter, allowNewRegion ) {
        var r = this.regions[chapter.region],
            i = -1,
            a, c, d, region;

        if ( (region = _getRegionByName.call( this, chapter.region )) ) {
            if ( ! allowNewRegion ) {
                alert( ['no such region "', chapter.region, '" in chapter "', chapter.name, '"'].join('') );
                return null;
            }
            this.regions.push( region = { region: chapter.region, count: 0, chapters: [] } );
        }
        region.count = region.chapters.push( chapter );
        return chapter
    };

return Object.defineProperties( {}, {
    PullJSON: { value: PullJSON },
    PullHeaders: { value: PullHeaders },
    RegionFields: { value: _FIELDS },
    getRegions: { value: _getRegions },
    getChapters: { value: _getChapters },
    getOrganizers: { value: _getOrganizers },
    createChapter: { value: _createChapter },
    getRegionByName: { value: _getRegionByName },
    getChapterByName: { value: _getChapterByName },
    removeChapterByName: { value: _removeChapterByName },
    removeChapter: { value: _removeChapter },
    insertChapter: { value: _insertChapter }
} )