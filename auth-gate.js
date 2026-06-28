/**
 * โหลดก่อน student-basic-data.js (ไฟล์ใหญ่) — ให้หน้า Welcome คลิกได้ทันที
 */
(function (w) {
  if (w.__shAuthGate) return;

  var ROLES = {
    nurse: { name: 'เจ้าหน้าที่อนามัย / พยาบาล' },
    teacher: { name: 'ครู / อาจารย์ที่ปรึกษา' },
    student: { name: 'นักเรียน / ผู้ปกครอง' },
    admin: { name: 'ผู้บริหารโรงเรียน' }
  };

  function openModal(id) {
    var m = document.getElementById(id);
    if (m) m.classList.add('open');
  }
  function closeModal(id) {
    var m = document.getElementById(id);
    if (m) m.classList.remove('open');
  }

  w.openStaffLogin = function (roleKey) {
    if (w.__shMainReady && w._openStaffLoginImpl) return w._openStaffLoginImpl(roleKey);
    if (!ROLES[roleKey] || roleKey === 'student') return;
    w.__pendingStaffRoleEarly = roleKey;
    var sub = document.getElementById('staffLoginSub');
    var err = document.getElementById('staffLoginError');
    var u = document.getElementById('staffLoginUser');
    var p = document.getElementById('staffLoginPass');
    if (u) u.value = '';
    if (p) p.value = '';
    if (err) { err.style.display = 'none'; err.textContent = ''; }
    if (sub) sub.textContent = ROLES[roleKey].name;
    openModal('staffLoginModal');
    if (u) u.focus();
  };

  w.openStudentLogin = function () {
    if (w.__shMainReady && w._openStudentLoginImpl) return w._openStudentLoginImpl();
    var err = document.getElementById('studentLoginError');
    var u = document.getElementById('studentLoginUser');
    var p = document.getElementById('studentLoginPass');
    if (u) u.value = '';
    if (p) p.value = '';
    if (err) { err.style.display = 'none'; err.textContent = ''; }
    openModal('studentLoginModal');
    if (u) u.focus();
  };

  w.closeStaffLogin = function () {
    if (w.__shMainReady && w._closeStaffLoginImpl) return w._closeStaffLoginImpl();
    closeModal('staffLoginModal');
    w.__pendingStaffRoleEarly = '';
  };

  w.closeStudentLogin = function () {
    if (w.__shMainReady && w._closeStudentLoginImpl) return w._closeStudentLoginImpl();
    closeModal('studentLoginModal');
  };

  w.enterGuestAccess = function (mode) {
    if (w.__shMainReady && w._enterGuestAccessImpl) return w._enterGuestAccessImpl(mode);
    mode = (mode === 'public') ? 'public' : 'info';
    try {
      sessionStorage.setItem('sh-session', JSON.stringify({ kind: 'guest', guestMode: mode }));
    } catch (e) {}
    var screen = document.getElementById('role-screen');
    if (screen) screen.classList.add('role-screen-hidden');
    var badge = document.getElementById('roleBadge');
    if (badge) {
      badge.style.display = '';
      badge.textContent = mode === 'info' ? 'สารสนเทศ' : 'บุคคลทั่วไป';
    }
    document.querySelectorAll('.section-panel').forEach(function (p) { p.classList.remove('active'); });
    document.querySelectorAll('.nav-item').forEach(function (n) { n.classList.remove('active'); });
    var sid = mode === 'info' ? 'gshps' : 'public';
    var panel = document.getElementById('section-' + sid);
    if (panel) panel.classList.add('active');
    document.querySelectorAll('[data-staff-only]').forEach(function (el) { el.style.display = 'none'; });
    var main = document.querySelector('.main');
    if (main) main.scrollTop = 0;
  };

  w.submitStaffLogin = function () {
    if (w.__shMainReady && w._submitStaffLoginImpl) return w._submitStaffLoginImpl();
    alert('ระบบกำลังโหลดข้อมูล กรุณารอสักครู่แล้วลองใหม่');
  };

  w.submitStudentLogin = function () {
    if (w.__shMainReady && w._submitStudentLoginImpl) return w._submitStudentLoginImpl();
    alert('ระบบกำลังโหลดข้อมูลนักเรียน กรุณารอสักครู่แล้วลองใหม่');
  };

  w.__shAuthGate = true;
})(window);
