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
    OPT_STAT    = 'nothing',
    OPT_UPDATE  = 'update',
    OPT_REVERT  = 'revert',
    OPT_REMOVE  = 'remove',
    _MAXCLONEDEPTH = 6,
    _cloneObject = function ( o, depth ) {
        var d = {},
            k, i;
        if ( (depth || (depth = 1)) > _MAXCLONEDEPTH ) {
            throw 'depth overflow at ' + depth;
            return null
        }
        for ( k in o ) {
            d[k] = ( (i = o[k]) instanceof Object && ! (i instanceof EventTarget) )
                    ? _cloneObject( i, depth + 1 )
                    : i;
        }
        return d
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
    _getChapterIndexFromRegionByName = function ( name ) {
        var i = this.length;
        name = name.toLowerCase();
        while ( i-- )
            if ( this.chapters[i].name.toLowerCase() === name )
                break;
        return i
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
                return null
            }
            this.regions.push( region = { region: chapter.region, count: 0, chapters: [] } );
        }
        region.count = region.chapters.push( chapter );
        return chapter
    },
    // this = new chapters object
    _createBuildListOptions = function ( list, options, reverse ) {
        var chapterList = _getChapters.call( list ),
            newChapters = (this instanceof Window) ? {} : this,
            ld = new Date( list['last-modified'] || null ),
            nd = Date.now(),
            c, o, cn, cd;
        newChapters || (newChapters = {});
        options || (options = {});
        if ( reverse ) {
            for ( cn in chapterList ) {
                if ( ! (o = options[cn]) ) {
                    c = chapterList[cn];
                    cd = new Date( c['last-modified'] || nd );
                    options[cn] = ( ld > cd ) ? OPT_REVERT : OPT_STAT;
                }
            }
        } else {
            for ( cn in chapterList ) {
                if ( ! (o = options[cn]) ) {
                    c = chapterList[cn];
                    cd = new Date( c['last-modified'] || nd );
                    options[cn] = ( ld < cd ) ? OPT_UPDATE : OPT_STAT;
                }
            }
        }
        
        return options
    },
    // this = new chapters object
    _buildList = function ( list, options, dest ) {
        var chapterList = _getChapters.call( list ),
            newChapters = (this instanceof Window) ? {} : this,
            ld = new Date( list['last-modified'] || 0 ),
            nd = Date.now(),
            ct = 0,
            rl, c, ci, r, nc, o, cn, cd, m;
        if ( ! options )
            options = _createBuildListOptions.call( list, {} )
        dest || (dest = { "total": 0 });
        dest.total = 0;
        dest["last-modified"] || (dest["last-modified"] = nd.toUTCString());
        rl = dest.regions || (dest.regions = []);
        for ( cn in chapterList ) {
            c = chapterList[cn];
            nc = newChapters[cn];
            switch ( m = options[cn] ) {
                case OPT_STAT:
                    if ( ! nc ) {
                        alert( ['cannot update "', cn, '" because it doesn\'t exist'].join('') );
                        return null
                    }
                    if ( ! nc.region ) {
                        alert( ['cannot update "', cn, '" because it has no region'].join('') );
                        return null
                    }
                    if ( ! (r = _getRegionByName.call( list, nc.region )) )
                        r = (dest.regions[dest.regions.length] = {"region": nc.region,"count": 0,"chapters":[]});
                    if ( (ci = _getChapterIndexFromRegionByName.call(r, nc.name)) < 0 ) {
                        r.count = r.chapters.push( _cloneObject( nc ) );
                    } else {
                        r.chapters[ci] = _cloneObject( nc );
                    }
                    ct++;
                    break;
                    
                case OPT_UPDATE:
                    if ( ! nc ) {
                        alert( ['cannot update "', cn, '" because it doesn\'t exist'].join('') );
                        return null
                    }
                    if ( ! nc.region ) {
                        alert( ['cannot update "', cn, '" because it has no region'].join('') );
                        return null
                    }
                    if ( ! (r = _getRegionByName.call( dest, nc.region )) )
                        r = (dest.regions[dest.regions.length] = {"region": nc.region,"count": 0,"chapters":[]});
                    if ( (ci = _getChapterIndexFromRegionByName.call(r, nc.name)) < 0 ) {
                        r.count = r.chapters.push( _cloneObject( nc ) );
                    } else {
                        r.chapters[ci] = _cloneObject( nc );
                    }
                    ct++;
                    break;
                    
                case OPT_REVERT:
                    if ( ! nc.region ) {
                        alert( ['cannot update "', cn, '" because it has no region'].join('') );
                        return null
                    }
                    newChapters[cn] = c;
                    if ( ! (r = _getRegionByName.call( dest, nc.region )) )
                        r = (dest.regions[dest.regions.length] = {"region": nc.region,"count": 0,"chapters":[]});
                    if ( (ci = _getChapterIndexFromRegionByName.call(r, nc.name)) < 0 ) {
                        r.count = r.chapters.push( _cloneObject( c ) );
                    } else {
                        r.chapters[ci] = _cloneObject( c );
                    }
                    ct++;
                    break;
                    
                case OPT_REMOVE:
                    break;
                    
                default:
                    throw 'bad build option ' + m;
                    return null
            }
        }
        dest.total = ct;
        return dest
    };

return Object.defineProperties( {}, {
    PullJSON: { value: PullJSON },
    PullHeaders: { value: PullHeaders },
    RegionFields: { value: _FIELDS },
    OptionTypes: { value: Object.freeze( {
        OPT_STAT:   OPT_STAT,
        OPT_UPDATE: OPT_UPDATE,
        OPT_REVERT: OPT_REVERT,
        OPT_REMOVE: OPT_REMOVE
    } ) },
    getRegions: { value: _getRegions },
    getChapters: { value: _getChapters },
    getOrganizers: { value: _getOrganizers },
    createChapter: { value: _createChapter },
    getRegionByName: { value: _getRegionByName },
    getChapterByName: { value: _getChapterByName },
    getChapterIndexFromRegionByName: { value: _getChapterIndexFromRegionByName },
    removeChapterByName: { value: _removeChapterByName },
    removeChapter: { value: _removeChapter },
    insertChapter: { value: _insertChapter },
    createBuildListOptions: { value: _createBuildListOptions },
    buildList: { value: _buildList }
} )