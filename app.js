// 라인이 체크 페이지 — 로그인 없음, 체크한 날은 이 휴대폰(브라우저)에만 저장한다(개인정보를 모으지 않음).
// 언어: 처음 열면 언어를 고르게 하고(linei.lang에 저장), 고른 언어의 같은 페이지로 보낸다. 한국어 = /, 영어 /en/, 포르투갈어 /pt/, 인도네시아어 /id/
// 체크 기록은 언어와 상관없이 편마다 하나(linei.v1.epNN)라 언어를 바꿔도 이어진다.
// 프로그램 글(move·steps 등)은 만들 때 이미 HTML로 바꿔 둔 것이라 여기서 다시 바꾸지 않는다.
(function () {
	'use strict';
	var P = window.LINEI_PROGRAMS || [];
	var U = window.LINEI_UI || {};
	var LANGS = window.LINEI_LANGS || [];
	var EP = document.body.dataset.ep;
	var BASE = document.body.dataset.base || './';
	var LANG = document.body.dataset.lang || 'ko';
	var ROOT = BASE + (LANG === 'ko' ? '' : LANG + '/');
	var app = document.getElementById('app');
	var IG = 'https://www.instagram.com/linei.fit/';

	function t(k, v) { return String(U[k] == null ? k : U[k]).replace(/\{(\w+)\}/g, function (_, x) { return v && v[x] != null ? v[x] : ''; }); }
	function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
	function load(id) { try { return JSON.parse(ls('linei.v1.' + id)) || {done: {}, rec: {}}; } catch (e) { return {done: {}, rec: {}}; } }
	function save(id, st) { ls('linei.v1.' + id, JSON.stringify(st)); }
	function today() {
		var d = new Date();
		return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
	}
	function dayNo(start) { return Math.round((new Date(today() + 'T00:00:00') - new Date(start + 'T00:00:00')) / 864e5) + 1; }
	function doneCount(st) { return Object.keys(st.done || {}).length; }
	function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
	function link(p) { return ROOT + p.id + '/'; }
	function langUrl(l) { return BASE + (l === 'ko' ? '' : l + '/') + (EP ? EP + '/' : ''); }
	function freqOf(p) { return /주\s*\d|매일|하루|week|day|semana|dia|minggu|hari/i.test(p.dose) ? '' : p.freq; }
	function langName() { var m = LANGS.filter(function (x) { return x[0] === LANG; })[0]; return m ? m[1] : LANG; }

	// 언어 고르기(처음 열 때, 또는 위 🌐 버튼)
	function picker() {
		var box = document.createElement('div');
		box.className = 'picker';
		// 휴대폰 언어와 맞는 것을 맨 위에
		var nav = (navigator.language || '').slice(0, 2).toLowerCase();
		var list = LANGS.slice().sort(function (a, b) { return (b[0] === nav) - (a[0] === nav); });
		box.innerHTML = '<div class="sheet"><h2>🌐 ' + esc(t('pick')) + '</h2>' +
			'<p class="sub">Choose your language · Escolha seu idioma · Pilih bahasa</p>' +
			list.map(function (l) { return '<button class="btn ghost lang' + (l[0] === LANG ? ' cur' : '') + '" data-lang="' + l[0] + '">' + esc(l[1]) + '</button>'; }).join('') + '</div>';
		box.onclick = function (e) {
			var b = e.target.closest('[data-lang]');
			if (!b) return;
			ls('linei.lang', b.dataset.lang);
			if (b.dataset.lang === LANG) box.remove();
			else location.href = langUrl(b.dataset.lang);
		};
		document.body.appendChild(box);
	}

	function top() {
		return '<div class="top"><span><b>' + esc(t('brand')) + '</b> · ' + esc(t('free')) + '</span><span class="tr"><button class="lbtn" data-act="lang" aria-label="' + esc(langName()) + '">🌐 ' + LANG.toUpperCase() + '</button><a href="' + IG + '">@linei.fit</a></span></div>';
	}

	function item(p) {
		var st = load(p.id), n = doneCount(st);
		var prog = st.start ? (n >= p.total ? t('finished') : t('progress', {n: n, total: p.total, unit: p.unit})) : '';
		var f = freqOf(p);
		return '<a class="item" href="' + link(p) + '"><img src="' + BASE + 'img/' + p.thumb + '" alt="" loading="lazy"><div>' +
			'<div class="t">' + p.move + ' <span>' + esc(t('daysShort', {days: p.days})) + '</span></div>' +
			'<div class="d">' + p.dose + (f ? ' · ' + esc(f) : '') + '</div>' +
			(prog ? '<div class="p">' + esc(prog) + '</div>' : '') + '</div></a>';
	}

	function renderIndex() {
		var going = P.filter(function (p) { return load(p.id).start; });
		var rest = P.filter(function (p) { return !load(p.id).start; });
		app.innerHTML = top() +
			'<h1>' + t('indexTitle') + '</h1>' +
			'<p class="intro">' + esc(t('intro')) + '</p>' +
			(going.length ? '<div class="sec">' + esc(t('going')) + '</div><div class="list">' + going.map(item).join('') + '</div>' : '') +
			'<div class="sec">' + esc(going.length ? t('others') : t('all')) + '<span>' + esc(t('n', {n: rest.length})) + '</span></div><div class="list">' + rest.map(item).join('') + '</div>' +
			'<a class="btn ghost follow" href="' + IG + '">' + esc(t('follow')) + '</a>';
		app.onclick = function (e) { if (e.target.closest('[data-act="lang"]')) picker(); };
	}

	function renderProgram(p) {
		var st = load(p.id);
		var n = doneCount(st);
		var td = today();
		var doneToday = Object.keys(st.done).some(function (k) { return st.done[k] === td; });
		var finished = n >= p.total;
		var d = st.start ? dayNo(st.start) : 0;

		var todayBox;
		if (!st.start) {
			todayBox = '<div class="today"><div class="day">' + t('startIntro', {days: p.days, freq: esc(p.freq)}) + '</div>' +
				'<button class="btn" data-act="start">' + esc(t('startBtn')) + '</button>' +
				'<p class="hint">' + esc(t('startHint')) + '</p></div>';
		} else {
			todayBox = '<div class="today"><div class="day">' + (d <= p.days ? t('today', {d: d, days: p.days}) : t('over', {days: p.days})) + '</div>' +
				'<div class="bar"><i style="width:' + Math.round((n / p.total) * 100) + '%"></i></div>' +
				'<div class="count">' + t('count', {n: n, total: p.total, unit: p.unit}) + '</div>' +
				(finished ? '' : '<button class="btn" data-act="check"' + (doneToday ? ' disabled>' + esc(t('doneToday')) : '>' + esc(p.weekly ? t('btnWeekly') : t('btnDaily'))) + '</button>') +
				'</div>';
		}

		var grid = p.rows.map(function (r) {
			var dots = '';
			for (var k = 0; k < r.count; k++) {
				var num = r.from + k, on = st.done[num];
				dots += '<button class="dot' + (on ? ' on' : '') + '" data-dot="' + num + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + (on ? '✓' : num) + '</button>';
			}
			return '<div class="week"><div class="wk">' + esc(r.label) + '</div><div class="dots" style="grid-template-columns:repeat(' + Math.min(r.count, 7) + ',minmax(0,44px))">' + dots + '</div>' + (r.note ? '<div class="note">' + r.note + '</div>' : '') + '</div>';
		}).join('');

		var cards = '<div class="cards">' + p.cards.map(function (c) {
			return '<div class="card ' + c.kind + '"><img src="' + BASE + 'img/' + c.img + '" alt=""' + (c.pos ? ' style="object-position:' + c.pos + '"' : '') + ' loading="lazy"><span class="badge">' + c.badge + '</span><p class="cap">' + c.label + '</p></div>';
		}).join('') + '</div>';

		var how = '<div class="sec">' + esc(t('how')) + (p.subtitle ? '<span>' + p.subtitle + '</span>' : '') + '</div>' + cards +
			(p.warmup ? '<div class="warmup">' + p.warmup + '</div>' : '') +
			(p.steps.length ? '<ol class="steps">' + p.steps.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol>' : '') +
			(p.sets ? '<div class="sets">' + p.sets + '</div>' : '') +
			(p.mistakes.length ? '<div class="sec">' + esc(t('careful')) + '</div><ul class="mistakes">' + p.mistakes.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul>' : '');

		var rec = p.record ? '<div class="record"><h2>' + p.record.question + '</h2><div class="fields">' +
			'<label><span>' + esc(t('day1')) + '</span><input inputmode="decimal" data-rec="a" value="' + esc(st.rec.a || '') + '"><span>' + p.record.unit + '</span></label>' +
			'<label><span>' + esc(t('dayN', {days: p.days})) + '</span><input inputmode="decimal" data-rec="b" value="' + esc(st.rec.b || '') + '"><span>' + p.record.unit + '</span></label></div>' +
			'<p>' + esc(t('recHint', {days: p.days})) + '</p></div>' : '';

		var done = finished ? '<div class="donebox"><h2>' + esc(t('doneTitle', {days: p.days})) + '</h2><p>' + esc(p.record ? t('doneRec') : t('doneNoRec')) + '</p>' +
			'<a class="btn" href="' + IG + '">' + esc(t('toIG')) + '</a></div>' : '';

		var others = P.filter(function (q) { return q.id !== p.id; }).slice(0, 3);
		var next = '<div class="sec">' + esc(t('next')) + '<span>' + esc(t('nextSub')) + '</span></div><div class="list">' + others.map(item).join('') + '</div>' +
			'<a class="btn ghost" href="' + ROOT + '">' + esc(t('seeAll', {n: P.length})) + '</a>';

		app.innerHTML = top() +
			'<h1>' + p.move + '<br><span>' + esc(t('title', {days: p.days})) + '</span></h1>' +
			'<div class="dose">' + p.dose + ' <em>' + (p.doseNote ? '= ' + p.doseNote + ' · ' : '· ') + esc(p.freq) + '</em></div>' +
			done + todayBox +
			'<div class="sec">' + esc(p.weekly ? t('gridWeekly') : t('gridDaily')) + '<span>' + esc(t('gridTotal', {total: p.total, unit: p.unit})) + '</span></div>' + grid +
			rec + how + next +
			'<p class="foot">' + p.caution + (st.start ? ' · <a href="#" data-act="reset">' + esc(t('reset')) + '</a>' : '') + '</p>';

		app.onclick = function (e) {
			var b = e.target.closest('[data-act],[data-dot]');
			if (!b) return;
			if (b.dataset.act === 'lang') return picker();
			var s = load(p.id);
			if (b.dataset.dot) {
				var num = b.dataset.dot;
				if (s.done[num]) delete s.done[num];
				else { s.done[num] = today(); if (!s.start) s.start = today(); }
			} else if (b.dataset.act === 'start') {
				s.start = today();
			} else if (b.dataset.act === 'check') {
				if (!s.start) s.start = today();
				for (var i = 1; i <= p.total; i++) if (!s.done[i]) { s.done[i] = today(); break; }
			} else if (b.dataset.act === 'reset') {
				e.preventDefault();
				if (!confirm(t('resetAsk'))) return;
				s = {done: {}, rec: {}};
			}
			save(p.id, s);
			var y = window.scrollY;
			renderProgram(p);
			window.scrollTo(0, y);
		};
		app.oninput = function (e) {
			var f = e.target.dataset.rec;
			if (!f) return;
			var s = load(p.id);
			s.rec[f] = e.target.value;
			save(p.id, s);
		};
	}

	// 고른 언어가 이 페이지와 다르면 그 언어의 같은 페이지로
	var chosen = ls('linei.lang');
	if (chosen && chosen !== LANG && LANGS.some(function (l) { return l[0] === chosen; })) { location.replace(langUrl(chosen)); return; }
	var prog = EP && P.filter(function (p) { return p.id === EP; })[0];
	if (prog) renderProgram(prog);
	else renderIndex();
	if (!chosen) picker();
})();
