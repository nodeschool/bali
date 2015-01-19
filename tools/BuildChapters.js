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
    _EXCLUDE_CHAPTERNAMES = [
        'list',
    ],
    PullChapter = function ( chapterName ) {
        return ( _EXCLUDE_CHAPTERNAMES.indexOf( chapterName ) < 0 )
            ? Pull.JSON
            : null
    },
    PullHeaders = function (file) {
        var xhr = new XMLHttpRequest, r;
        xhr.open('head', file, false);
        xhr.send(null);
        return (r = xhr.getAllResponseHeaders()) ? r : null
    },
    _FIELDS_REQUIRE = {
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
    _FIELDS_VALID = {
        "name":     [/^[\w\-]+$/,       'alpha numerics and punctuation'],
        "location": [/^[\w\-\.\x20']+$/,'alpha numerics and punctuation'],
        "country":  [/^[A-Z]$/,         '2 uppercase letters'],
        "region":   [/^[\w\-\.\x20']+$/,'alpha numerics and punctuation'],
        "organizers":[/^[\w\-]+$/,      'comma seperated alpha numerics'],
        "website":  [/^http:\/\//,       'web address'],
        "twitter":  [/^[\w\-]+$/,       'alpha numerics and punctuation'],
        "facebook": [/^[\w\-]+$/,       'alpha numerics and punctuation'],
        "repo":     [/^http:\/\//,       'web address']
    },
    OPT_STAT    = 'nothing',
    OPT_UPDATE  = 'update',
    OPT_REVERT  = 'revert',
    OPT_REMOVE  = 'remove',
    _MAXCLONEDEPTH = 6,
    _cloneObject = function ( o, depth ) {
        var d, k, i;
        if ( (depth || (depth = 1)) > _MAXCLONEDEPTH ) {
            throw 'depth overflow at ' + depth;
            return null
        }
        if ( o instanceof Array ) {
            d = o.slice( )
        } else if ( o instanceof Object ) {
            d = {};
            for ( k in o ) {
                d[k] = ( (i = o[k]) instanceof Object && ! (i instanceof EventTarget) )
                        ? _cloneObject( i, depth + 1 )
                        : i;
            }
        } else
            d = o;
        return d
    },
    _extractHeader = function ( allHeaders, headerName ) {
        var p = allHeaders.match( new RegExp( '^' + headerName + ':\s*(.+)$', 'mi' ) );
        return p && p.length >= 2 && p[1]
    },
    _getStatistics = function ( ) {
        var chaptersList = {},
            regionsList = {},
            countriesList = {},
            locationsList = {},
            organizersList = {},
            messages = [],
            regions = this.regions, r, rn, ri = -1, rl = regions.length,
            chapters, c, cn, ci, cl,
            t, o, n, i, l;
        while ( ++ri < rl ) {
            if ( (r = regions[ri]) ) {
                if ( ! (rn = r.region) ) {
                    rn = '<no region>';
                    messages.push( ['region has no name, using "', rn, '"'].join('') );
                }
                if ( regionsList[rn] ) {
                    messages.push( ['duplicate region "', rn, '"(by name), combining'].join('') );
                } else {
                    regionsList[rn] = {};
                }
                cl = (chapters = r.chapters).length;
                for ( ci = 0; ci < cl; ci++ ) {
                    if ( (c = chapters[ci]) ) {
                        // add chapter to chapter list
                        if ( ! (cn = c.name) ) {
                            t = 1;
                            while ( chaptersList[n = '<no name#' + t + '>'] )
                                t++;
                            messages.push( ['chapter has no name, using "', n, '"'].join('') );
                            cn = n;
                        } else if ( chaptersList[cn] ) {
                            t = 1;
                            while ( chaptersList[n = cn + '<dup#' + t + '>'] )
                                t++;
                            messages.push( ['duplicate chapter "', cn, '"(by name), using "', n, '"'].join('') );
                            cn = n;
                        }
                        chaptersList[cn] = c;
                        
                        // add chapter to region list
                        if ( rn !== c.region ) {
                            if ( c.region && regionsList[c.region] ) {
                                messages.push( ['chapter "', cn, '"\'s region "', c.region, '" doesn\'t match parent region "', rn, '"(by name), using chapters region'].join('') );
                                regionsList[c.region][cn] = c
                            } else {
                                messages.push( ['chapter "', cn, '"\'s region(non-existant) "', c.region, '" doesn\'t match parent region "', rn, '"(by name), using list region'].join('') );
                                regionsList[rn][cn] = c
                            }
                        } else {
                            regionsList[rn][cn] = c
                        }
                        
                        // add chapter to country list
                        if ( ! (n = c.country) ) {
                            n = '<no country>';
                            messages.push( ['chapter "', cn, '" has no country, using "', n, '"'].join('') );
                        }
                        if ( ! countriesList[n] )
                            countriesList[n] = {};
                        countriesList[n][cn] = c;
                        
                        // add chapter to location list
                        if ( ! (n = c.location) ) {
                            n = '<no location>';
                            messages.push( ['chapter "', cn, '" has no location, using "', n, '"'].join('') );
                        }
                        if ( ! locationsList[n] )
                            locationsList[n] = {};
                        locationsList[n][cn] = c;
                        
                        // add chapter to organizers list
                        if ( ! (o = c.organizers) || ! (l = o.length) ) {
                            o = ['<no organizer>'];
                            messages.push( ['chapter "', cn, '" has no organizer, using ', JSON.stringify( o )].join('') );
                        }
                        for ( i = 0; i < l; i++ ) {
                            if ( ! organizersList[n = o[i]] )
                                organizersList[n] = {};
                            organizersList[n][cn] = c;
                        }
                        
                    }
                }
                
                // checking the regions chapter count
                if ( r.count !== (t = Object.keys(regionsList[rn]).length) )
                    messages.push( ['region "', rn, '" count(', r.count, ') does not match the number of chapters it contains(', t, ')'].join('') );
            }
        }
        
        // checking the total chapter count
        if ( this.total !== (t = Object.keys(chaptersList).length) )
            messages.push( ['the main "list" total(', this.total, ') does not match the number of chapters it contains(', t, ')'].join('') );
        
        return {
            chaptersList:   chaptersList,
            regionsList:    regionsList,
            countriesList:  countriesList,
            locationsList:  locationsList,
            organizersList: organizersList,
            chaptersTotal:  Object.keys( chaptersList ).length,
            regionTotal:    Object.keys( regionsList ).length,
            countryTotal:   Object.keys( countriesList ).length,
            locationTotal:  Object.keys( locationsList ).length,
            organizerTotal: Object.keys( organizersList ).length,
            messages:       messages
        }
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
    _createChapter = function ( o, dest ) {
        var errors = {},
            errcount = 0,
            k;
        if ( ! (dest instanceof Object) )
            dest = {};
        for ( k in _FIELDS_REQUIRE ) {
            if ( _FIELDS_REQUIRE[k] && ( ! o[k] || ! o[k].length ) ) {
                errcount++;
                errors[k] = k + ' required';
            }
            if ( k === 'organizers' ) {
                dest[k] = o[k] || [];
            } else {
                dest[k] = o[k] || '';
            }
        }
        return errcount ? errors : null
    },
    _getChapterIndexFromRegionByName = function ( name ) {
        var i = this.chapters.length;
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
    _createBuildListOptions = function ( lastModified, newChapters, options, reverse ) {
        var list = this,
            chapterList = _getChapters.call( list ),
            names = Object.keys( chapterList ),
            nd = Date.now(),
            c, o, ci, cn, cd;
        newChapters || (newChapters = {});
        options || (options = {});
        for ( cn in newChapters )
            if ( names.indexOf( cn ) < 0 )
                names.push( cn );
        if ( reverse ) {
            for ( ci = 0; (cn = names[ci]); ci++ ) {
                if ( ! (o = options[cn]) ) {
                    c = newChapters[cn];
                    cd = new Date( (c && c['last-modified']) || nd );
                    options[cn] = ( lastModified > cd ) ? OPT_REVERT : OPT_STAT;
                }
            }
        } else {
            for ( ci = 0; (cn = names[ci]); ci++ ) {
                if ( ! (o = options[cn]) ) {
                    c = newChapters[cn];
                    cd = new Date( (c && c['last-modified']) || nd );
                    options[cn] = ( lastModified < cd ) ? OPT_UPDATE : OPT_STAT;
                }
            }
        }
        
        return options
    },
    // this = new chapters object
    _buildList = function ( lastModified, newChapters, options, dest ) {
        var list = this,
            chapterList = _getChapters.call( list ),
            ld = new Date( list['last-modified'] || 0 ),
            nd = new Date( Date.now() ),
            ct = 0,
            rl, c, ci, r, oc, nc, o, cn, cd, m;
        if ( ! options )
            options = _createBuildListOptions.call( list, lastModified, newChapters, options )
        dest || (dest = { });
        dest.total = 0;
//        dest["last-modified"] || (dest["last-modified"] = nd.toUTCString());
        rl = dest.regions || (dest.regions = []);
        for ( cn in options ) {
            oc = chapterList[cn];
            nc = newChapters[cn];
            switch ( m = options[cn] ) {
                case OPT_STAT:
                    if ( ! (c = oc || nc).region ) {
                        alert( ['cannot update "', c.name, '" because it has no region'].join('') );
                        continue
                    }
                    if ( ! (r = _getRegionByName.call( dest, c.region )) )
                        r = (dest.regions[dest.regions.length] = {"region": c.region,"count": 0,"chapters":[]});
                    if ( (ci = _getChapterIndexFromRegionByName.call(r, c.name)) < 0 ) {
                        r.count = r.chapters.push( _cloneObject( c ) );
                    } else {
                        r.chapters[ci] = _cloneObject( c );
                        r.count = r.chapters.length;
                    }
                    ct++;
                    break;
                    
                case OPT_UPDATE:
                    if ( ! (c = oc || nc).region ) {
                        alert( ['cannot update "', c.name, '" because it has no region'].join('') );
                        continue
                    }
                    if ( ! (r = _getRegionByName.call( dest, c.region )) )
                        r = (dest.regions[dest.regions.length] = {"region": c.region,"count": 0,"chapters":[]});
                    if ( (ci = _getChapterIndexFromRegionByName.call(r, c.name)) < 0 ) {
                        r.count = r.chapters.push( _cloneObject( c ) );
                    } else {
                        r.chapters[ci] = _cloneObject( c );
                        r.count = r.chapters.length;
                    }
                    ct++;
                    break;
                    
                case OPT_REVERT:
                    if ( ! (c = oc || nc).region ) {
                        alert( ['cannot update "', c.name, '" because it has no region'].join('') );
                        continue
                    }
                    if ( ! (r = _getRegionByName.call( dest, c.region )) )
                        r = (dest.regions[dest.regions.length] = {"region": c.region,"count": 0,"chapters":[]});
                    if ( (ci = _getChapterIndexFromRegionByName.call(r, c.name)) < 0 ) {
                        r.count = r.chapters.push( _cloneObject( c ) );
                    } else {
                        r.chapters[ci] = _cloneObject( c );
                        r.count = r.chapters.length;
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

module.exports = Object.defineProperties( {}, {
    PullJSON: { value: PullJSON },
    PullHeaders: { value: PullHeaders },
    RegionFields: { value: Object.keys( _FIELDS_REQUIRE ) },
    ExcludeJSONs: { value: _EXCLUDE_CHAPTERNAMES },
    OptionTypes: { value: Object.freeze( {
        OPT_STAT:   OPT_STAT,
        OPT_UPDATE: OPT_UPDATE,
        OPT_REVERT: OPT_REVERT,
        OPT_REMOVE: OPT_REMOVE
    } ) },
    cloneObject: { value: _cloneObject },
    extractHeader: { value: _extractHeader },
    getChapters: { value: _getChapters },
    getStatistics: { value: _getStatistics },
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