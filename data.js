/* LOQTA data layer: Supabase REST when config.js is filled, otherwise local demo mode */
var LQ = (function () {
  var C = window.LOQTA_CONFIG || {}, live = !!(C.url && C.key), SK = 'loqta_session', ses = null;
  try { ses = JSON.parse(localStorage.getItem(SK)); } catch (e) {}
  var CATS = [['إكسسوارات موبايل', '📱', 10], ['أحذية', '👟', 15], ['إلكترونيات', '🎧', 12], ['موضة', '👜', 15], ['منزل ومطبخ', '🏠', 10], ['جمال وعناية', '💄', 10]]
    .map(function (c, i) { return { id: 'c' + (i + 1), name_ar: c[0], icon: c[1], commission: c[2], sort: i + 1 }; });

  function lsGet(t) { try { return JSON.parse(localStorage.getItem('loqta_demo_' + t)) || []; } catch (e) { return []; } }
  function lsSet(t, v) { localStorage.setItem('loqta_demo_' + t, JSON.stringify(v)); }
  function hdr(extra) {
    var h = { apikey: C.key, Authorization: 'Bearer ' + ((ses && ses.access_token) || C.key), 'Content-Type': 'application/json' };
    for (var k in extra) h[k] = extra[k];
    return h;
  }
  function api(path, opt) {
    return fetch(C.url + path, opt).then(function (r) {
      return r.text().then(function (t) {
        var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {}
        if (!r.ok) throw new Error((j && (j.message || j.msg || j.error_description)) || ('HTTP ' + r.status));
        return j;
      });
    });
  }
  function saveSes(j) {
    ses = { access_token: j.access_token, refresh_token: j.refresh_token, exp: Math.floor(Date.now() / 1000) + (j.expires_in || 3600), user: { id: j.user.id, email: j.user.email } };
    localStorage.setItem(SK, JSON.stringify(ses));
  }
  function logout() { ses = null; try { localStorage.removeItem(SK); } catch (e) {} }
  function refresh() {
    if (!live || !ses || ses.exp - 60 > Date.now() / 1000) return Promise.resolve();
    return api('/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: { apikey: C.key, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: ses.refresh_token }) })
      .then(saveSes).catch(logout);
  }
  function R(fn) { return refresh().then(fn); }
  function must(r) { if (!r || !r.length) throw new Error('مش مسموح لك بالتعديل، اتأكد إنك داخل بحساب الأدمن'); }

  function list(t, q) {
    if (!live) return Promise.resolve(t === 'categories' ? CATS : lsGet(t));
    return R(function () { return api('/rest/v1/' + t + '?' + (q || 'select=*'), { headers: hdr() }); });
  }
  function insert(t, row) {
    if (!live) {
      row.id = 'd' + Date.now(); row.created_at = new Date().toISOString();
      var a = lsGet(t); a.unshift(row);
      try { lsSet(t, a); } catch (e) { return Promise.reject(new Error('مساحة التخزين ممتلئة')); }
      return Promise.resolve(row);
    }
    return R(function () { return api('/rest/v1/' + t, { method: 'POST', headers: hdr({ Prefer: 'return=representation' }), body: JSON.stringify(row) }); })
      .then(function (r) { must(r); return r[0]; });
  }
  function update(t, id, patch) {
    if (!live) { var a = lsGet(t); a.forEach(function (x) { if (x.id == id) for (var k in patch) x[k] = patch[k]; }); lsSet(t, a); return Promise.resolve(); }
    return R(function () { return api('/rest/v1/' + t + '?id=eq.' + encodeURIComponent(id), { method: 'PATCH', headers: hdr({ Prefer: 'return=representation' }), body: JSON.stringify(patch) }); }).then(must);
  }
  function remove(t, id) {
    if (!live) { lsSet(t, lsGet(t).filter(function (x) { return x.id != id; })); return Promise.resolve(); }
    return R(function () { return api('/rest/v1/' + t + '?id=eq.' + encodeURIComponent(id), { method: 'DELETE', headers: hdr({ Prefer: 'return=representation' }) }); }).then(must);
  }
  function toBlob(d) {
    var p = d.split(','), m = p[0].match(/:(.*?);/)[1], b = atob(p[1]), a = new Uint8Array(b.length);
    for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
    return new Blob([a], { type: m });
  }
  function upload(dataUrl) {
    if (!live) return Promise.resolve(dataUrl);
    var blob = toBlob(dataUrl), name = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.jpg';
    return R(function () {
      return fetch(C.url + '/storage/v1/object/products/' + name, { method: 'POST', headers: { apikey: C.key, Authorization: 'Bearer ' + ses.access_token, 'Content-Type': blob.type }, body: blob })
        .then(function (r) { if (!r.ok) throw new Error('فشل رفع الصورة'); return C.url + '/storage/v1/object/public/products/' + name; });
    });
  }
  function login(email, pass) {
    if (!live) return Promise.resolve();
    return api('/auth/v1/token?grant_type=password', { method: 'POST', headers: { apikey: C.key, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email, password: pass }) })
      .then(saveSes).catch(function (e) { throw new Error(/invalid/i.test(e.message) ? 'الإيميل أو كلمة السر غلط' : e.message); });
  }
  function isAdmin() {
    if (!live) return Promise.resolve(true);
    if (!ses) return Promise.resolve(false);
    return list('profiles', 'select=role&id=eq.' + ses.user.id).then(function (r) { return !!(r && r[0] && r[0].role === 'admin'); });
  }
  return { live: live, list: list, insert: insert, update: update, remove: remove, upload: upload, login: login, logout: logout, refresh: refresh, isAdmin: isAdmin, user: function () { return live ? (ses && ses.user) : { id: 'demo' }; } };
})();
