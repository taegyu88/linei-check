// 라인이 체크 페이지 — 로그인 없음, 체크한 날은 이 휴대폰(브라우저)에만 저장한다(개인정보를 모으지 않음).
(function () {
	'use strict';
	var P = window.LINEI_PROGRAMS || [];
	var EP = document.body.dataset.ep;
	var BASE = document.body.dataset.base || './';
	var app = document.getElementById('app');
	var IG = 'https://www.instagram.com/linei.fit/';

	function key(id) { return 'linei.v1.' + id; }
	function load(id) {
		try { return JSON.parse(localStorage.getItem(key(id))) || {done: {}, rec: {}}; } catch (e) { return {done: {}, rec: {}}; }
	}
	function save(id, st) { try { localStorage.setItem(key(id), JSON.stringify(st)); } catch (e) {} }
	function today() {
		var d = new Date();
		return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
	}
	function dayNo(start) {
		var a = new Date(start + 'T00:00:00'), b = new Date(today() + 'T00:00:00');
		return Math.round((b - a) / 864e5) + 1;
	}
	function doneCount(st) { return Object.keys(st.done || {}).length; }
	function esc(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
	function freqOf(p) { return /주\s*\d|매일|하루/.test(p.dose) ? '' : p.freq; }
	function link(p) { return BASE + p.id + '/'; }

	function item(p) {
		var st = load(p.id), n = doneCount(st);
		var prog = st.start ? (n >= p.total ? '완주했어요 🎉' : n + '/' + p.total + p.unitWord + ' 체크 중') : '';
		return '<a class="item" href="' + link(p) + '"><img src="' + BASE + 'img/' + p.thumb + '" alt="" loading="lazy"><div>' +
			'<div class="t">' + esc(p.move) + ' <span>' + p.days + '일</span></div>' +
			'<div class="d">' + esc(p.dose) + (freqOf(p) ? ' · ' + esc(freqOf(p)) : '') + '</div>' +
			(prog ? '<div class="p">' + prog + '</div>' : '') + '</div></a>';
	}

	function renderIndex() {
		var going = P.filter(function (p) { return load(p.id).start; });
		var rest = P.filter(function (p) { return !load(p.id).start; });
		app.innerHTML =
			'<div class="top"><span><b>라인이</b> · 무료 체크표</span><a href="' + IG + '">@linei.fit</a></div>' +
			'<h1>라인이<br><span>체크표 모음</span></h1>' +
			'<p class="intro">영상 속 동작을 날마다 체크해요. 체크한 날은 이 휴대폰에만 저장돼요.</p>' +
			(going.length ? '<div class="sec">하고 있는 체크표</div><div class="list">' + going.map(item).join('') + '</div>' : '') +
			'<div class="sec">' + (going.length ? '다른 체크표' : '모든 체크표') + '<span>' + rest.length + '개</span></div><div class="list">' + rest.map(item).join('') + '</div>' +
			'<a class="btn ghost follow" href="' + IG + '">라인이 팔로우하고 새 체크표 받기</a>';
	}

	function renderProgram(p) {
		var st = load(p.id);
		var n = doneCount(st);
		var t = today();
		var doneToday = Object.keys(st.done).some(function (k) { return st.done[k] === t; });
		var finished = n >= p.total;
		var d = st.start ? dayNo(st.start) : 0;

		var todayBox;
		if (!st.start) {
			todayBox = '<div class="today"><div class="day"><b>' + p.days + '일</b> 동안 ' + esc(p.freq) + ' 해요</div>' +
				'<button class="btn" data-act="start">오늘부터 시작하기</button>' +
				'<p class="hint">시작하면 날마다 여기서 체크해요. 이 주소를 즐겨찾기나 홈 화면에 두면 편해요.</p></div>';
		} else {
			var label = p.unitWord === '칸' ? '이번 주 다 했어요 ✓' : '오늘 운동 했어요 ✓';
			todayBox = '<div class="today"><div class="day">' + (d <= p.days ? '오늘은 <b>' + d + '일차</b> / ' + p.days + '일' : '<b>' + p.days + '일</b>이 지났어요') + '</div>' +
				'<div class="bar"><i style="width:' + Math.round((n / p.total) * 100) + '%"></i></div>' +
				'<div class="count"><b>' + n + '</b> / ' + p.total + p.unitWord + ' 체크</div>' +
				(finished ? '' : '<button class="btn" data-act="check"' + (doneToday ? ' disabled>오늘 체크 완료! 내일 또 만나요' : '>' + label) + '</button>') +
				'</div>';
		}

		var grid = p.rows.map(function (r) {
			var dots = '';
			for (var k = 0; k < r.count; k++) {
				var num = r.from + k, on = st.done[num];
				dots += '<button class="dot' + (on ? ' on' : '') + '" data-dot="' + num + '" aria-label="' + num + '번' + (on ? ' 체크됨' : '') + '">' + (on ? '✓' : num) + '</button>';
			}
			return '<div class="week"><div class="wk">' + r.label + '</div><div class="dots">' + dots + '</div>' + (r.note ? '<div class="note">' + r.note + '</div>' : '') + '</div>';
		}).join('');

		var cards = '<div class="cards' + (p.cards.length === 2 ? ' two' : '') + '" style="grid-template-columns:repeat(2,1fr)">' + p.cards.map(function (c) {
			return '<div class="card ' + c.kind + '"><img src="' + BASE + 'img/' + c.img + '" alt=""' + (c.pos ? ' style="object-position:' + c.pos + '"' : '') + ' loading="lazy"><span class="badge">' + esc(c.badge) + '</span><p class="cap">' + c.label + '</p></div>';
		}).join('') + '</div>';

		var how = '<div class="sec">하는 법' + (p.subtitle ? '<span>' + esc(p.subtitle) + '</span>' : '') + '</div>' + cards +
			(p.warmup ? '<div class="warmup">' + p.warmup + '</div>' : '') +
			(p.steps.length ? '<ol class="steps">' + p.steps.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol>' : '') +
			(p.sets ? '<div class="sets">' + p.sets + '</div>' : '') +
			(p.mistakes.length ? '<div class="sec">이것만 조심</div><ul class="mistakes">' + p.mistakes.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul>' : '');

		var rec = p.record ? '<div class="record"><h2>' + esc(p.record.question) + '</h2><div class="fields"><label><span>1일차</span><input inputmode="decimal" data-rec="a" value="' + esc(st.rec.a || '') + '"><span>' + esc(p.record.unit) + '</span></label>' +
			'<label><span>' + p.days + '일차</span><input inputmode="decimal" data-rec="b" value="' + esc(st.rec.b || '') + '"><span>' + esc(p.record.unit) + '</span></label></div>' +
			'<p>' + p.days + '일 뒤, 영상 댓글에 두 숫자를 남겨 주세요.</p></div>' : '';

		var done = finished ? '<div class="donebox"><h2>🎉 ' + p.days + '일 체크표를 다 채웠어요!</h2><p>' + (p.record ? '처음과 지금 숫자를 영상 댓글로 알려 주세요.' : '해낸 소식을 영상 댓글로 알려 주세요.') + '</p>' +
			'<a class="btn" href="' + IG + '">라인이 인스타로 가기</a></div>' : '';

		var others = P.filter(function (q) { return q.id !== p.id; }).slice(0, 3);
		var next = '<div class="sec">다음 체크표<span>끝나면 이어서 해요</span></div><div class="list">' + others.map(item).join('') + '</div>' +
			'<a class="btn ghost" href="' + BASE + '">체크표 모두 보기 (' + P.length + '개)</a>';

		app.innerHTML =
			'<div class="top"><span><b>라인이</b> · 무료 체크표</span><a href="' + IG + '">@linei.fit</a></div>' +
			'<h1>' + esc(p.move) + '<br><span>' + p.days + '일 체크표</span></h1>' +
			'<div class="dose">' + esc(p.dose) + ' <em>' + (p.doseNote ? '= ' + esc(p.doseNote) + ' · ' : '· ') + esc(p.freq) + '</em></div>' +
			done + todayBox +
			'<div class="sec">' + p.gridTitle + '<span>모두 ' + p.total + p.unitWord + '</span></div>' + grid +
			rec + how + next +
			'<p class="foot">' + esc(p.caution) + (st.start ? ' · <a href="#" data-act="reset">처음부터 다시</a>' : '') + '</p>';

		app.onclick = function (e) {
			var b = e.target.closest('[data-act],[data-dot]');
			if (!b) return;
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
				if (!confirm('체크한 기록을 모두 지우고 처음부터 할까요?')) return;
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

	var prog = EP && P.filter(function (p) { return p.id === EP; })[0];
	if (prog) renderProgram(prog);
	else renderIndex();
})();
