(function () {
    var hero = document.querySelector('.custom-slider-container');
    if (!hero) return;

    var threshold = hero.offsetHeight - 70; // 滚过轮播底部(扣除导航高)后恢复底色
    var onScroll = function () {
        document.body.classList.toggle('hero-scrolled', window.scrollY > threshold);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
})();
