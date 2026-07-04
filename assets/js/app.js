// 语言 / 主题切换。初始值已由 head.html 的防闪烁脚本在首屏前设好，
// 这里只负责响应点击、持久化到 localStorage，并同步按钮高亮态。
(function () {
  var root = document.documentElement;

  /* ===== 语言 ===== */
  function syncLangButtons() {
    var cur = root.getAttribute('lang');
    document.querySelectorAll('[data-set-lang]').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-set-lang') === cur);
    });
  }
  function setLang(code) {
    root.setAttribute('lang', code);
    try { localStorage.setItem('lang', code); } catch (e) {}
    syncLangButtons();
  }
  document.querySelectorAll('[data-set-lang]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setLang(btn.getAttribute('data-set-lang'));
    });
  });
  syncLangButtons();

  /* ===== 主题 ===== */
  function setTheme(t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('theme', t); } catch (e) {}
  }
  // 轨道当前角度：初值取 CSS 静止值（含窄屏断点），每次切换 -180° → 日月恒逆时针半圈升落互换
  var orbitRot = parseFloat(getComputedStyle(root).getPropertyValue('--orbit-rot')) || 14;
  document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
      orbitRot -= 180;                                   // 角度递减 = 逆时针
      root.style.setProperty('--orbit-rot', orbitRot + 'deg');
    });
  });

  /* ===== 滚动入场动效 ===== */
  var revealables = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);   // 只触发一次
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    // 不支持 IntersectionObserver：直接全部显示，避免内容被永久隐藏
    revealables.forEach(function (el) { el.classList.add('in-view'); });
  }

  /* ===== 文章图片点击放大 ===== */
  var zoomImages = document.querySelectorAll('.work-cover img, .markdown img');
  if (zoomImages.length) {
    var lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.innerHTML = '<button class="lightbox-close" type="button" aria-label="Close image">&times;</button><img alt="">';
    document.body.appendChild(lightbox);

    var lightboxImg = lightbox.querySelector('img');
    var lightboxClose = lightbox.querySelector('.lightbox-close');

    function closeLightbox() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      lightboxImg.removeAttribute('src');
      lightboxImg.alt = '';
    }

    function openLightbox(img) {
      lightboxImg.src = img.currentSrc || img.src;
      lightboxImg.alt = img.alt || '';
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      lightboxClose.focus();
    }

    zoomImages.forEach(function (img) {
      img.setAttribute('tabindex', '0');
      img.addEventListener('click', function () { openLightbox(img); });
      img.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openLightbox(img);
        }
      });
    });

    lightbox.addEventListener('click', function (event) {
      if (event.target === lightbox || event.target === lightboxImg || event.target === lightboxClose) {
        closeLightbox();
      }
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && lightbox.classList.contains('is-open')) closeLightbox();
    });
  }

  /* ===== 真实月相（北半球朝向），纯装饰，缺元素则跳过 ===== */
  var moonLit = document.getElementById('moonLit');
  if (moonLit) {
    var SYN = 29.53058867;                         // 朔望月（天）
    var EPOCH = Date.UTC(2000, 0, 6, 18, 14, 0);   // 参考新月 2000-01-06 18:14 UTC
    var age = ((Date.now() - EPOCH) / 86400000) % SYN;
    if (age < 0) age += SYN;                        // 0..29.53，距上次新月的天数
    var phase = age / SYN;                          // 0新月 .25上弦 .5满月 .75下弦
    var f = (1 - Math.cos(2 * Math.PI * phase)) / 2;// 受照比例 0..1
    var waxing = phase < 0.5;                        // 渐盈 → 右侧亮（北半球）
    var R = 58, cx = 100, top = 100 - R, bot = 100 + R;
    var rx = R * Math.abs(2 * f - 1);               // 明暗界线椭圆水平半轴
    var limb = waxing ? 1 : 0;                       // 亮缘半圆：盈在右(=1)，亏在左(=0)
    var term = waxing ? (f < 0.5 ? 0 : 1)           // 终结线方向：蛾眉/凸月翻转
                      : (f < 0.5 ? 1 : 0);
    moonLit.setAttribute('d',
      'M' + cx + ',' + top +
      ' A' + R + ',' + R + ' 0 0 ' + limb + ' ' + cx + ',' + bot +
      ' A' + rx + ',' + R + ' 0 0 ' + term + ' ' + cx + ',' + top + ' Z');
  }
})();
