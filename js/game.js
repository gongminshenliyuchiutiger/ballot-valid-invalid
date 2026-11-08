/**
 * 公職人員選舉票有效與無效之認定遊戲系統
 * 遊戲主邏輯模組 - 嚴格繁體中文標準 & 震撼視覺特效 & 沙盒多重無效事由完整檢驗
 */

document.addEventListener('DOMContentLoaded', () => {
  if (typeof BALLOT_QUESTIONS === 'undefined') {
    console.error('題庫載入失敗！');
    return;
  }

  // ========================================================
  // 1. 全域變數與狀態管理
  // ========================================================
  const state = {
    currentTab: 'challenge',
    challenge: {
      questions: [],
      currentIndex: 0,
      score: 0,
      correctCount: 0,
      wrongCount: 0,
      streak: 0,
      maxStreak: 0,
      answered: false,
      timer: null,
      timeLeft: 15,
      timerMax: 15
    },
    sorter: {
      questions: [],
      currentIndex: 0,
      score: 0,
      correctCount: 0,
      totalCount: 0
    },
    sandbox: {
      activeTool: 'official_stamp',
      hasSeal: true,
      isTorn: false,
      marks: []
    },
    encyclopedia: {
      filterCat: 'all',
      searchKeyword: ''
    }
  };

  // ========================================================
  // 2. DOM 元素快取
  // ========================================================
  const dom = {
    tabBtns: document.querySelectorAll('.tab-btn'),
    sections: {
      challenge: document.getElementById('sec-challenge'),
      sorter: document.getElementById('sec-sorter'),
      sandbox: document.getElementById('sec-sandbox'),
      encyclopedia: document.getElementById('sec-encyclopedia')
    },
    btnAudioToggle: document.getElementById('btn-audio-toggle'),
    btnFullscreen: document.getElementById('btn-fullscreen'),
    btnStampHistory: document.getElementById('btn-stamp-history'),

    // 震撼視覺特效層
    fxOverlay: document.getElementById('fx-overlay'),
    feedbackLayer: document.getElementById('floating-feedback-layer'),

    // 模式一：審查實戰
    scoreDisplay: document.getElementById('stat-score'),
    streakDisplay: document.getElementById('stat-streak'),
    progressDisplay: document.getElementById('stat-progress'),
    timerBar: document.getElementById('challenge-timer-bar'),
    ballotCardWrapper: document.querySelector('.ballot-card-wrapper'),
    ballotBox: document.getElementById('challenge-ballot-box'),
    ballotImg: document.getElementById('challenge-ballot-img'),
    magnifierLens: document.getElementById('magnifier-lens'),
    ballotTitle: document.getElementById('challenge-ballot-title'),
    ballotCat: document.getElementById('challenge-ballot-cat'),
    stampSeal: document.getElementById('stamp-seal'),
    btnValid: document.getElementById('btn-judge-valid'),
    btnInvalid: document.getElementById('btn-judge-invalid'),
    btnNext: document.getElementById('btn-challenge-next'),
    resultBox: document.getElementById('challenge-result-box'),
    resultTitle: document.getElementById('challenge-result-title'),
    resultExplanation: document.getElementById('challenge-result-explanation'),
    resultLaw: document.getElementById('challenge-result-law'),

    // 模式二：雙箱分類
    sorterCard: document.getElementById('sorter-ballot-card'),
    sorterImg: document.getElementById('sorter-ballot-img'),
    sorterTitle: document.getElementById('sorter-ballot-title'),
    binValid: document.getElementById('bin-valid'),
    binInvalid: document.getElementById('bin-invalid'),
    sorterScore: document.getElementById('sorter-stat-score'),
    sorterAccuracy: document.getElementById('sorter-stat-accuracy'),

    // 模式二專用：分類錯誤即時檢討面板
    sorterReviewOverlay: document.getElementById('sorter-review-overlay'),
    sorterReviewImg: document.getElementById('sorter-review-img'),
    sorterReviewQtitle: document.getElementById('sorter-review-qtitle'),
    sorterReviewUser: document.getElementById('sorter-review-user'),
    sorterReviewCorrect: document.getElementById('sorter-review-correct'),
    sorterReviewExplanation: document.getElementById('sorter-review-explanation'),
    sorterReviewLaw: document.getElementById('sorter-review-law'),
    btnSorterContinue: document.getElementById('btn-sorter-continue'),

    // 模式三：沙盒
    ballotPaper: document.getElementById('sandbox-ballot-paper'),
    sandboxMarksLayer: document.getElementById('sandbox-marks-layer'),
    officialSealBadge: document.getElementById('sandbox-official-seal'),
    tornCornerElem: document.getElementById('sandbox-torn-corner'),
    toolBtns: document.querySelectorAll('.tool-btn'),
    btnToggleSeal: document.getElementById('tool-toggle-seal'),
    btnToggleTorn: document.getElementById('tool-toggle-torn'),
    btnClearSandbox: document.getElementById('tool-clear-sandbox'),
    btnSandboxJudge: document.getElementById('btn-sandbox-judge'),
    sandboxResultBox: document.getElementById('sandbox-result-box'),

    // 模式四：百科圖鑑
    encyclopediaGrid: document.getElementById('encyclopedia-grid'),
    searchInput: document.getElementById('encyclopedia-search'),
    filterChips: document.querySelectorAll('.chip-btn'),

    // 吉祥物
    mascot: document.getElementById('mascot-guy'),

    // 圈選印章由來彈窗
    historyModalOverlay: document.getElementById('history-modal-overlay'),
    btnCloseHistory: document.getElementById('btn-close-history'),
    btnCloseHistoryBottom: document.getElementById('btn-close-history-bottom'),

    // 結算彈窗與紙屑
    modalOverlay: document.getElementById('modal-overlay'),
    modalGrade: document.getElementById('modal-grade'),
    modalScore: document.getElementById('modal-score'),
    modalAccuracy: document.getElementById('modal-accuracy'),
    modalMaxStreak: document.getElementById('modal-max-streak'),
    btnModalRestart: document.getElementById('btn-modal-restart'),
    confettiCanvas: document.getElementById('confetti-canvas')
  };

  // ========================================================
  // 3. 正確/錯誤震撼視覺特效引擎 (Visual FX Engine)
  // - 全螢幕霓虹邊緣脈衝 (Screen Edge Glow)
  // - 選票卡片彈力反彈 / 劇烈地震晃動 (Card Pop / Shake Hard)
  // - 浮動評價標籤與連擊標記 (Floating Badge)
  // ========================================================
  function triggerAnswerVisualEffect(isCorrect, customText = '') {
    // 1. 全螢幕光暈
    if (dom.fxOverlay) {
      dom.fxOverlay.className = 'fx-overlay';
      void dom.fxOverlay.offsetWidth; // 強制重繪
      dom.fxOverlay.classList.add(isCorrect ? 'flash-correct' : 'flash-wrong');
    }

    // 2. 選票卡片反饋
    const targetCard = (state.currentTab === 'challenge') 
      ? dom.ballotCardWrapper 
      : (state.currentTab === 'sorter' ? dom.sorterCard : dom.ballotPaper);

    if (targetCard) {
      targetCard.classList.remove('effect-correct', 'effect-wrong');
      void targetCard.offsetWidth;
      targetCard.classList.add(isCorrect ? 'effect-correct' : 'effect-wrong');
      setTimeout(() => {
        targetCard.classList.remove('effect-correct', 'effect-wrong');
      }, 500);
    }

    // 3. 浮動評價標籤
    if (dom.feedbackLayer) {
      const badge = document.createElement('div');
      badge.className = `floating-badge ${isCorrect ? 'correct' : 'wrong'}`;

      if (isCorrect) {
        const text = customText || (state.challenge.streak >= 3 ? `連擊 COMBO x${state.challenge.streak}！` : '判定正確！');
        badge.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${text}</span>`;
      } else {
        const text = customText || '判定失誤！';
        badge.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> <span>${text}</span>`;
      }

      dom.feedbackLayer.appendChild(badge);
      setTimeout(() => {
        badge.remove();
      }, 900);
    }
  }

  // ========================================================
  // 4. 程式精準繪製中央選舉委員會標準圈選印章 SVG
  // 外圓直徑貫穿垂直中線，圓心往左下角45度斜線
  // ========================================================
  function createBallotStampSVG(isFolded = false, size = 44) {
    const transform = isFolded ? 'transform="scale(-1, 1) translate(-1024, 0)"' : '';
    const opacity = isFolded ? '0.45' : '0.92';
    return `
      <svg viewBox="0 0 1024 1024" width="${size}" height="${size}" class="ballot-stamp-rendered ${isFolded ? 'folded' : ''}" style="opacity: ${opacity}; pointer-events: none;">
        <g ${transform}>
          <circle cx="512" cy="512" r="473" stroke="#ee1d23" stroke-width="78" fill="none" />
          <line x1="512" y1="39" x2="512" y2="985" stroke="#ee1d23" stroke-width="78" stroke-linecap="butt" />
          <line x1="512" y1="512" x2="178" y2="846" stroke="#ee1d23" stroke-width="78" stroke-linecap="butt" />
        </g>
      </svg>
    `;
  }

  // ========================================================
  // 5. 吉祥物 LiyuChillGuy.svg 拖曳運動控制
  // ========================================================
  let isDraggingMascot = false;
  let mascotStartX = 0;
  let mascotStartY = 0;
  let mascotInitialLeft = 0;
  let mascotInitialTop = 0;
  let hasMoved = false;

  function initMascot() {
    if (!dom.mascot) return;

    dom.mascot.addEventListener('mousedown', (e) => {
      startMascotDrag(e.clientX, e.clientY);
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDraggingMascot) return;
      moveMascotDrag(e.clientX, e.clientY);
    });

    window.addEventListener('mouseup', () => {
      endMascotDrag();
    });

    dom.mascot.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        startMascotDrag(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!isDraggingMascot || e.touches.length !== 1) return;
      moveMascotDrag(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    window.addEventListener('touchend', () => {
      endMascotDrag();
    });

    dom.mascot.addEventListener('dblclick', () => {
      dom.mascot.style.left = '24px';
      dom.mascot.style.bottom = '24px';
      dom.mascot.style.top = 'auto';
      dom.mascot.style.right = 'auto';
      window.soundEngine.playBoing();
    });
  }

  function startMascotDrag(clientX, clientY) {
    isDraggingMascot = true;
    hasMoved = false;
    mascotStartX = clientX;
    mascotStartY = clientY;

    const rect = dom.mascot.getBoundingClientRect();
    mascotInitialLeft = rect.left;
    mascotInitialTop = rect.top;

    dom.mascot.classList.add('is-dragging');
  }

  function moveMascotDrag(clientX, clientY) {
    const dx = clientX - mascotStartX;
    const dy = clientY - mascotStartY;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      hasMoved = true;
    }

    let newLeft = mascotInitialLeft + dx;
    let newTop = mascotInitialTop + dy;

    const maxX = window.innerWidth - dom.mascot.offsetWidth;
    const maxY = window.innerHeight - dom.mascot.offsetHeight;
    newLeft = Math.max(0, Math.min(newLeft, maxX));
    newTop = Math.max(0, Math.min(newTop, maxY));

    dom.mascot.style.left = `${newLeft}px`;
    dom.mascot.style.top = `${newTop}px`;
    dom.mascot.style.bottom = 'auto';
    dom.mascot.style.right = 'auto';
  }

  function endMascotDrag() {
    if (!isDraggingMascot) return;
    isDraggingMascot = false;
    dom.mascot.classList.remove('is-dragging');
  }

  // ========================================================
  // 6. 圈選印章由來彈窗
  // ========================================================
  function initStampHistoryModal() {
    if (!dom.btnStampHistory || !dom.historyModalOverlay) return;

    dom.btnStampHistory.addEventListener('click', () => {
      dom.historyModalOverlay.classList.add('show');
      window.soundEngine.playBoing();
    });

    if (dom.btnCloseHistory) {
      dom.btnCloseHistory.addEventListener('click', () => {
        dom.historyModalOverlay.classList.remove('show');
      });
    }

    if (dom.btnCloseHistoryBottom) {
      dom.btnCloseHistoryBottom.addEventListener('click', () => {
        dom.historyModalOverlay.classList.remove('show');
      });
    }

    dom.historyModalOverlay.addEventListener('click', (e) => {
      if (e.target === dom.historyModalOverlay) {
        dom.historyModalOverlay.classList.remove('show');
      }
    });
  }

  // ========================================================
  // 7. 模式一：審查實戰檢定邏輯
  // ========================================================
  function initChallenge() {
    state.challenge.questions = shuffleArray([...BALLOT_QUESTIONS]);
    state.challenge.currentIndex = 0;
    state.challenge.score = 0;
    state.challenge.correctCount = 0;
    state.challenge.wrongCount = 0;
    state.challenge.streak = 0;
    state.challenge.maxStreak = 0;

    loadChallengeQuestion();
  }

  function loadChallengeQuestion() {
    const q = state.challenge.questions[state.challenge.currentIndex];
    if (!q) {
      showSummaryModal();
      return;
    }

    state.challenge.answered = false;

    dom.progressDisplay.textContent = `${state.challenge.currentIndex + 1} / ${state.challenge.questions.length}`;
    // 審查前保持中立，不劇透答案
    dom.ballotTitle.innerHTML = `<i class="fa-solid fa-file-shield"></i> <span>待認定案件 第 ${state.challenge.currentIndex + 1} 案</span>`;
    dom.ballotCat.textContent = '票面爭議特徵檢定';
    dom.ballotImg.src = q.image;

    dom.stampSeal.className = 'stamp-seal';
    dom.resultBox.className = 'result-box';
    dom.resultTitle.textContent = '待審查中...';
    dom.resultExplanation.textContent = '請仔細檢視左側選票，若有需要可使用放大鏡觀察圈選印痕、邊緣及附加印記。';
    dom.resultLaw.textContent = '';
    dom.btnNext.style.display = 'none';

    dom.btnValid.disabled = false;
    dom.btnInvalid.disabled = false;

    startChallengeTimer();
  }

  function startChallengeTimer() {
    clearInterval(state.challenge.timer);
    state.challenge.timeLeft = state.challenge.timerMax;
    dom.timerBar.style.width = '100%';

    state.challenge.timer = setInterval(() => {
      state.challenge.timeLeft -= 0.1;
      const pct = Math.max(0, (state.challenge.timeLeft / state.challenge.timerMax) * 100);
      dom.timerBar.style.width = `${pct}%`;

      if (state.challenge.timeLeft <= 0) {
        clearInterval(state.challenge.timer);
        if (!state.challenge.answered) {
          judgeChallenge('timeout');
        }
      }
    }, 100);
  }

  function judgeChallenge(userChoice) {
    if (state.challenge.answered) return;
    state.challenge.answered = true;
    clearInterval(state.challenge.timer);

    const q = state.challenge.questions[state.challenge.currentIndex];
    const isCorrect = (userChoice === q.type);

    dom.btnValid.disabled = true;
    dom.btnInvalid.disabled = true;

    window.soundEngine.playStamp();

    if (q.type === 'valid') {
      dom.stampSeal.textContent = '有效票 VALID';
      dom.stampSeal.className = 'stamp-seal valid show';
    } else {
      dom.stampSeal.textContent = '無效票 VOID';
      dom.stampSeal.className = 'stamp-seal invalid show';
    }

    // 觸發震撼視覺特效！
    triggerAnswerVisualEffect(isCorrect);

    if (isCorrect) {
      window.soundEngine.playCorrect();
      state.challenge.correctCount++;
      state.challenge.streak++;
      if (state.challenge.streak > state.challenge.maxStreak) {
        state.challenge.maxStreak = state.challenge.streak;
      }
      const timeBonus = Math.floor(state.challenge.timeLeft * 8);
      const streakBonus = (state.challenge.streak - 1) * 20;
      const addedScore = 100 + timeBonus + streakBonus;
      state.challenge.score += addedScore;

      if (state.challenge.streak >= 3) {
        window.soundEngine.playCombo(state.challenge.streak);
      }

      dom.resultBox.className = 'result-box correct';
      dom.resultTitle.innerHTML = `<i class="fa-solid fa-circle-check"></i> 判定正確！(+${addedScore} 分)`;
    } else {
      window.soundEngine.playWrong();
      state.challenge.wrongCount++;
      state.challenge.streak = 0;

      dom.resultBox.className = 'result-box wrong';
      dom.resultTitle.innerHTML = userChoice === 'timeout' 
        ? '<i class="fa-solid fa-clock"></i> 審查超時！認定為判定錯誤' 
        : '<i class="fa-solid fa-circle-xmark"></i> 判定錯誤！';
    }

    dom.scoreDisplay.textContent = state.challenge.score;
    dom.streakDisplay.textContent = state.challenge.streak;

    // 作答後揭曉圖例名稱與類別
    dom.ballotTitle.innerHTML = `<i class="fa-solid fa-file-shield"></i> <span>${q.title}</span>`;
    dom.ballotCat.textContent = q.category;

    dom.resultExplanation.textContent = `【官方認定】${q.explanation}`;
    dom.resultLaw.textContent = `【法規依據】${q.law}`;
    dom.btnNext.style.display = 'flex';
  }

  function nextChallengeQuestion() {
    state.challenge.currentIndex++;
    loadChallengeQuestion();
  }

  function setupMagnifier() {
    const box = dom.ballotBox;
    const img = dom.ballotImg;
    const lens = dom.magnifierLens;

    box.addEventListener('mouseenter', () => {
      lens.style.display = 'block';
      lens.style.backgroundImage = `url("${img.src}")`;
    });

    box.addEventListener('mouseleave', () => {
      lens.style.display = 'none';
    });

    box.addEventListener('mousemove', (e) => {
      const rect = box.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const lensW = lens.offsetWidth;
      const lensH = lens.offsetHeight;

      let posX = x - lensW / 2;
      let posY = y - lensH / 2;

      lens.style.left = `${posX}px`;
      lens.style.top = `${posY}px`;

      const zoom = 2.5;
      lens.style.backgroundSize = `${rect.width * zoom}px ${rect.height * zoom}px`;
      lens.style.backgroundPosition = `-${x * zoom - lensW / 2}px -${y * zoom - lensH / 2}px`;
    });
  }

  // ========================================================
  // 8. 模式二：雙箱滑動分類賽 (Drag & Drop)
  // ========================================================
  function initSorter() {
    state.sorter.questions = shuffleArray([...BALLOT_QUESTIONS]);
    state.sorter.currentIndex = 0;
    state.sorter.score = 0;
    state.sorter.correctCount = 0;
    state.sorter.totalCount = 0;

    loadSorterCard();
    setupSorterDrag();
    setupSorterReviewEvents();
  }

  function loadSorterCard() {
    const q = state.sorter.questions[state.sorter.currentIndex];
    if (!q) {
      dom.sorterTitle.textContent = '恭喜完成全套分類審查！';
      dom.sorterImg.style.display = 'none';
      return;
    }

    dom.sorterImg.style.display = 'block';
    dom.sorterImg.src = q.image;
    // 徹底隱藏題目名稱與分類，絕不透露答案劇透
    dom.sorterTitle.textContent = '';
    dom.sorterTitle.style.display = 'none';

    dom.sorterCard.style.transform = 'translate(0px, 0px) rotate(0deg)';
  }

  function setupSorterDrag() {
    const card = dom.sorterCard;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let currentX = 0;

    function onStart(x, y) {
      isDragging = true;
      startX = x;
      startY = y;
      card.style.transition = 'none';
    }

    function onMove(x, y) {
      if (!isDragging) return;
      currentX = x - startX;
      const currentY = y - startY;
      const rotate = currentX * 0.08;

      card.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${rotate}deg)`;

      if (currentX < -80) {
        dom.binValid.classList.add('drag-over');
        dom.binInvalid.classList.remove('drag-over');
      } else if (currentX > 80) {
        dom.binInvalid.classList.add('drag-over');
        dom.binValid.classList.remove('drag-over');
      } else {
        dom.binValid.classList.remove('drag-over');
        dom.binInvalid.classList.remove('drag-over');
      }
    }

    function onEnd() {
      if (!isDragging) return;
      isDragging = false;
      card.style.transition = 'transform 0.3s ease';

      dom.binValid.classList.remove('drag-over');
      dom.binInvalid.classList.remove('drag-over');

      if (currentX < -120) {
        handleSorterDrop('valid');
      } else if (currentX > 120) {
        handleSorterDrop('invalid');
      } else {
        card.style.transform = 'translate(0px, 0px) rotate(0deg)';
      }
    }

    card.addEventListener('mousedown', (e) => onStart(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', onEnd);

    card.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) onStart(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) onMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    window.addEventListener('touchend', onEnd);
  }

  function handleSorterDrop(userDecision) {
    const q = state.sorter.questions[state.sorter.currentIndex];
    const isCorrect = (userDecision === q.type);

    state.sorter.totalCount++;
    window.soundEngine.playDrop();

    // 觸發視覺特效！
    triggerAnswerVisualEffect(isCorrect);

    if (isCorrect) {
      window.soundEngine.playCorrect();
      state.sorter.correctCount++;
      state.sorter.score += 100;

      dom.sorterScore.textContent = state.sorter.score;
      const acc = Math.round((state.sorter.correctCount / state.sorter.totalCount) * 100);
      dom.sorterAccuracy.textContent = `${acc}%`;

      dom.sorterCard.style.transform = userDecision === 'valid'
        ? 'translate(-400px, 100px) rotate(-30deg)'
        : 'translate(400px, 100px) rotate(30deg)';

      setTimeout(() => {
        state.sorter.currentIndex++;
        loadSorterCard();
      }, 280);
    } else {
      window.soundEngine.playWrong();

      dom.sorterScore.textContent = state.sorter.score;
      const acc = Math.round((state.sorter.correctCount / state.sorter.totalCount) * 100);
      dom.sorterAccuracy.textContent = `${acc}%`;

      // 卡片彈回中央，暫停跳轉，開啟詳細法規檢討面板！
      dom.sorterCard.style.transform = 'translate(0px, 0px) rotate(0deg)';

      if (dom.sorterReviewOverlay) {
        dom.sorterReviewImg.src = q.image;
        dom.sorterReviewQtitle.textContent = q.title;
        dom.sorterReviewUser.textContent = userDecision === 'valid' ? '有效票' : '無效票';
        dom.sorterReviewCorrect.textContent = q.typeName;
        dom.sorterReviewExplanation.textContent = q.explanation;
        dom.sorterReviewLaw.textContent = `法規依據：${q.law}`;

        dom.sorterReviewOverlay.classList.add('show');
      }
    }
  }

  // 模式二檢討面板繼續按鈕
  function setupSorterReviewEvents() {
    if (!dom.btnSorterContinue || !dom.sorterReviewOverlay) return;

    dom.btnSorterContinue.addEventListener('click', () => {
      closeSorterReviewAndNext();
    });
  }

  function closeSorterReviewAndNext() {
    if (dom.sorterReviewOverlay && dom.sorterReviewOverlay.classList.contains('show')) {
      dom.sorterReviewOverlay.classList.remove('show');
      state.sorter.currentIndex++;
      loadSorterCard();
    }
  }

  // ========================================================
  // 9. 模式三：自訂選票模擬器（互動圈選沙盒 Sandbox）
  // ★ 強大升級：全面排查並列出「所有」法定無效票原因！
  // ========================================================
  function initSandbox() {
    dom.toolBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        dom.toolBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.sandbox.activeTool = btn.dataset.tool;
      });
    });

    dom.btnToggleSeal.addEventListener('click', () => {
      state.sandbox.hasSeal = !state.sandbox.hasSeal;
      dom.officialSealBadge.style.display = state.sandbox.hasSeal ? 'flex' : 'none';
      dom.btnToggleSeal.innerHTML = state.sandbox.hasSeal 
        ? '<i class="fa-solid fa-landmark"></i> <span>撕下選委會關防</span>' 
        : '<i class="fa-solid fa-landmark"></i> <span>加蓋選委會關防</span>';
    });

    dom.btnToggleTorn.addEventListener('click', () => {
      state.sandbox.isTorn = !state.sandbox.isTorn;
      dom.tornCornerElem.style.display = state.sandbox.isTorn ? 'block' : 'none';
      dom.btnToggleTorn.innerHTML = state.sandbox.isTorn 
        ? '<i class="fa-solid fa-scissors"></i> <span>修復選票角落</span>' 
        : '<i class="fa-solid fa-scissors"></i> <span>撕毀選票角落</span>';
    });

    dom.btnClearSandbox.addEventListener('click', () => {
      state.sandbox.marks = [];
      dom.sandboxMarksLayer.innerHTML = '';
      dom.sandboxResultBox.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">選票已清空，請隨意蓋印後點擊審查。</p>';
    });

    dom.ballotPaper.addEventListener('click', (e) => {
      const rect = dom.ballotPaper.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      addSandboxMark(state.sandbox.activeTool, x, y);
      window.soundEngine.playStamp();
    });

    dom.btnSandboxJudge.addEventListener('click', judgeSandboxBallot);
  }

  function addSandboxMark(toolType, x, y) {
    const markData = {
      type: toolType,
      x: x,
      y: y,
      id: Date.now()
    };
    state.sandbox.marks.push(markData);

    const el = document.createElement('div');
    el.className = 'mark-element';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    switch (toolType) {
      case 'official_stamp':
        el.innerHTML = createBallotStampSVG(false, 46);
        break;
      case 'private_seal':
        el.innerHTML = '<div class="mark-private-seal">某印</div>';
        break;
      case 'fingerprint':
        el.innerHTML = '<div class="mark-fingerprint"></div>';
        break;
      case 'pen_text':
        el.innerHTML = '<div class="mark-pen">凍蒜</div>';
        break;
      case 'pen_cross':
        el.innerHTML = '<div class="mark-pen" style="font-size: 1.8rem; color: #dc2626;"><i class="fa-solid fa-xmark"></i></div>';
        break;
      case 'smudge':
        el.innerHTML = '<div style="width:25px; height:25px; background:radial-gradient(circle, rgba(220,38,38,0.7) 0%, transparent 70%); border-radius:50%;"></div>';
        break;
      case 'fold_mirror':
        el.innerHTML = createBallotStampSVG(true, 46);
        break;
    }

    dom.sandboxMarksLayer.appendChild(el);
  }

  function judgeSandboxBallot() {
    window.soundEngine.playStamp();
    const marks = state.sandbox.marks;
    const hasSeal = state.sandbox.hasSeal;
    const isTorn = state.sandbox.isTorn;

    // 收集所有無效票原因
    const invalidReasons = [];

    // 1. 檢驗關防印信
    if (!hasSeal) {
      invalidReasons.push({
        title: '【漏印主管選舉委員會關防】',
        desc: '選舉票未蓋主管選舉委員會印信或關防，非屬公職選罷法所定合法格式之選舉票。',
        law: '公職人員選舉罷免法第64條第1項第1款、無效票圖例第25例'
      });
    }

    // 2. 檢驗破損撕角
    if (isTorn) {
      invalidReasons.push({
        title: '【選舉票撕破致不完整】',
        desc: '將選舉票任何一角或部分撕破致殘缺不完整，已破壞法定選票之整體完整性。',
        law: '公職人員選舉罷免法第64條第1項第4款、無效票圖例第22例'
      });
    }

    // 3. 檢驗私人印章
    const privateSeals = marks.filter(m => m.type === 'private_seal');
    if (privateSeals.length > 0) {
      invalidReasons.push({
        title: `【加蓋私人印章（共 ${privateSeals.length} 處）】`,
        desc: '選票加蓋個人私章、便章或圖章，嚴重違反秘密投票與法定圈選工具規範。',
        law: '公職人員選舉罷免法第64條第1項第5款、無效票圖例第11、12例'
      });
    }

    // 4. 檢驗指印
    const fingerprints = marks.filter(m => m.type === 'fingerprint');
    if (fingerprints.length > 0) {
      invalidReasons.push({
        title: `【捺按指印（共 ${fingerprints.length} 處）】`,
        desc: '選票按捺指印者，因指紋具專屬暗記與身分識別特徵，依公職選罷法明文列為無效。',
        law: '公職人員選舉罷免法第64條第1項第5款、無效票圖例第13~18例'
      });
    }

    // 5. 檢驗手寫文字
    const penTexts = marks.filter(m => m.type === 'pen_text');
    if (penTexts.length > 0) {
      invalidReasons.push({
        title: `【記載任何文字（共 ${penTexts.length} 處）】`,
        desc: '圈選後或於選票上書寫任何中英文文字（如「凍蒜」等），構成暗記違規。',
        law: '公職人員選舉罷免法第64條第1項第6款、無效票圖例第19例'
      });
    }

    // 6. 檢驗符號與劃叉塗改
    const penCrosses = marks.filter(m => m.type === 'pen_cross');
    if (penCrosses.length > 0) {
      invalidReasons.push({
        title: `【劃寫符號或塗改（共 ${penCrosses.length} 處）】`,
        desc: '劃寫打叉、打勾或其他符號，或對圈印加以塗抹塗改，致選票無效。',
        law: '公職人員選舉罷免法第64條第1項第6款、無效票圖例第7、8、20、21例'
      });
    }

    // 7. 檢驗圈選專用章與圈選位置
    const stampMarks = marks.filter(m => m.type === 'official_stamp');
    if (stampMarks.length === 0) {
      invalidReasons.push({
        title: '【不加圈完全空白】',
        desc: '未見使用選舉委員會製備之圈選工具圈選任何候選人，屬完全空白票。',
        law: '公職人員選舉罷免法第64條第1項第2款、無效票圖例第2例'
      });
    } else {
      let countCol1 = 0;
      let countCol2 = 0;
      let countCenter = 0;

      const paperW = dom.ballotPaper.offsetWidth || 320;
      const midX = paperW / 2;

      stampMarks.forEach(m => {
        if (m.x >= midX - 12 && m.x <= midX + 12) {
          countCenter++;
        } else if (m.x < midX) {
          countCol1++;
        } else {
          countCol2++;
        }
      });

      if (countCol1 > 0 && countCol2 > 0) {
        invalidReasons.push({
          title: `【同時圈選二人以上（1號李虞 ${countCol1} 圈、2號秋姥琥 ${countCol2} 圈）】`,
          desc: '同時圈選二組或二個候選人以上，違反單記圈選原則，無法認定當選意向。',
          law: '公職人員選舉罷免法第64條第1項第3款、無效票圖例第3~5例'
        });
      } else if (countCenter > 0 && countCol1 === 0 && countCol2 === 0) {
        invalidReasons.push({
          title: '【圈選於相鄰共用隔線，不能辨別圈選何人】',
          desc: '圈印正中跨蓋於相鄰候選人共用隔線正中央，兩側均分，無法辨別選民投票意向。',
          law: '公職人員選舉罷免法第64條第1項第3款、無效票圖例第6例'
        });
      }
    }

    // 判定輸出與視覺特效
    if (invalidReasons.length > 0) {
      // 判定為無效票
      window.soundEngine.playWrong();
      triggerAnswerVisualEffect(false, `無效票（共${invalidReasons.length}項違規）`);

      const reasonsHTML = invalidReasons.map((r, idx) => `
        <div class="invalid-reason-item">
          <div class="invalid-reason-item-title">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>事由 ${idx + 1}：${r.title}</span>
          </div>
          <div class="invalid-reason-item-desc">${r.desc}</div>
          <div style="font-size: 0.75rem; color: #fca5a5; margin-top: 0.25rem;">依據：${r.law}</div>
        </div>
      `).join('');

      dom.sandboxResultBox.innerHTML = `
        <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-left: 5px solid #ef4444; padding: 1rem; border-radius: 10px;">
          <h4 style="color: #f87171; font-size: 1.15rem; margin-bottom: 0.35rem; display: flex; align-items: center; justify-content: space-between;">
            <span style="display: flex; align-items: center; gap: 0.4rem;">
              <i class="fa-solid fa-circle-xmark"></i> 判定：無效票 (VOID)
            </span>
            <span class="invalid-count-badge">檢出 ${invalidReasons.length} 項法定無效事由</span>
          </h4>
          <p style="font-size: 0.85rem; color: #fca5a5; margin-bottom: 0.5rem;">
            本票面因違反公職選罷法第64條多項規定，各項違規事由逐一分析如下：
          </p>
          <div class="invalid-reasons-list">
            ${reasonsHTML}
          </div>
        </div>
      `;
    } else {
      // 判定為有效票
      window.soundEngine.playCorrect();
      triggerAnswerVisualEffect(true, '判定有效！符合法定規範');

      const countCol1 = marks.filter(m => m.type === 'official_stamp' && m.x < ((dom.ballotPaper.offsetWidth || 320) / 2)).length;
      const candidateName = countCol1 > 0 ? '1 號候選人「李虞」' : '2 號候選人「秋姥琥」';
      const hasFold = marks.some(m => m.type === 'fold_mirror');
      const hasSmudge = marks.some(m => m.type === 'smudge');
      const totalStamps = marks.filter(m => m.type === 'official_stamp').length;

      let detailExplanation = `【圈選合規有效票】明確使用專用圈選工具圈選${candidateName}，符合法定規範，應屬有效票！（對應有效票圖例第1~7例）`;
      if (hasFold) {
        detailExplanation = `【疊折反印仍屬有效】圈選${candidateName}，雖因折票疊折產生反印（斜線呈現水平鏡射），能辨別係摺票疊印者，仍屬有效票！（對應有效票圖例第22例）`;
      } else if (hasSmudge) {
        detailExplanation = `【沾染印泥仍屬有效】圈選${candidateName}，雖有印泥微漬但非指印或符號，且圈選意向明確，應屬有效票！（對應有效票圖例第28例）`;
      } else if (totalStamps > 1) {
        detailExplanation = `【同一候選人圈二圈以上】圈選${candidateName}而圈蓋 ${totalStamps} 圈，能明確辨別圈選何人，應屬有效票！（對應有效票圖例第18~21例）`;
      }

      dom.sandboxResultBox.innerHTML = `
        <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); border-left: 5px solid #10b981; padding: 1rem; border-radius: 10px;">
          <h4 style="color: #34d399; font-size: 1.15rem; margin-bottom: 0.4rem; display: flex; align-items: center; gap: 0.4rem;">
            <i class="fa-solid fa-circle-check"></i> 判定：有效票 (VALID)
          </h4>
          <p style="font-size: 0.9rem; line-height: 1.6; color: #e2e8f0;">${detailExplanation}</p>
          <div style="font-size: 0.78rem; color: #86efac; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 0.5rem; margin-top: 0.5rem;">
            法規依據：公職人員選舉罷免法第64條第1項但書及中選會104年10月29日認定標準
          </div>
        </div>
      `;
    }
  }

  // ========================================================
  // 10. 模式四：全圖例百科圖鑑與查詢 (Encyclopedia)
  // ========================================================
  function initEncyclopedia() {
    renderEncyclopediaGrid();

    dom.searchInput.addEventListener('input', (e) => {
      state.encyclopedia.searchKeyword = e.target.value.trim().toLowerCase();
      renderEncyclopediaGrid();
    });

    dom.filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        dom.filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.encyclopedia.filterCat = chip.dataset.cat;
        renderEncyclopediaGrid();
      });
    });
  }

  function renderEncyclopediaGrid() {
    const list = BALLOT_QUESTIONS.filter(q => {
      if (state.encyclopedia.filterCat === 'valid' && q.type !== 'valid') return false;
      if (state.encyclopedia.filterCat === 'invalid' && q.type !== 'invalid') return false;
      if (state.encyclopedia.filterCat !== 'all' && state.encyclopedia.filterCat !== 'valid' && state.encyclopedia.filterCat !== 'invalid') {
        if (q.category !== state.encyclopedia.filterCat) return false;
      }

      if (state.encyclopedia.searchKeyword) {
        const kw = state.encyclopedia.searchKeyword;
        const text = `${q.title} ${q.category} ${q.explanation} ${q.typeName}`.toLowerCase();
        return text.includes(kw);
      }
      return true;
    });

    dom.encyclopediaGrid.innerHTML = '';

    list.forEach(item => {
      const card = document.createElement('div');
      card.className = 'ballot-card-item';
      const badgeIcon = item.type === 'valid' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark';

      card.innerHTML = `
        <div class="card-thumb-wrapper">
          <img src="${item.image}" alt="${item.title}" loading="lazy">
        </div>
        <div class="card-badge-row">
          <span class="badge-type ${item.type}">
            <i class="${badgeIcon}"></i>
            <span>${item.typeName}</span>
          </span>
          <span style="font-size: 0.75rem; color: #94a3b8;">${item.category}</span>
        </div>
        <div class="card-title">${item.title}</div>
        <div class="card-summary">${item.explanation}</div>
      `;

      card.addEventListener('click', () => {
        switchTab('challenge');
        const idx = state.challenge.questions.findIndex(q => q.id === item.id);
        if (idx !== -1) {
          state.challenge.currentIndex = idx;
          loadChallengeQuestion();
        }
      });

      dom.encyclopediaGrid.appendChild(card);
    });
  }

  // ========================================================
  // 11. 結算彈窗與紙屑慶祝
  // ========================================================
  function showSummaryModal() {
    window.soundEngine.playFanfare();
    fireConfetti();

    const total = state.challenge.questions.length;
    const correct = state.challenge.correctCount;
    const pct = Math.round((correct / total) * 100);

    let grade = 'B 級 合格監察員';
    if (pct >= 95) grade = 'S 級 神級選務主任委員';
    else if (pct >= 80) grade = 'A 級 資深投票所主任管理員';
    else if (pct >= 60) grade = 'B 級 合格監察管理員';
    else grade = 'C 級 建議重新受訓選務研習生';

    dom.modalGrade.textContent = grade;
    dom.modalScore.textContent = state.challenge.score;
    dom.modalAccuracy.textContent = `${pct}% (${correct}/${total})`;
    dom.modalMaxStreak.textContent = `${state.challenge.maxStreak} 連擊`;

    dom.modalOverlay.classList.add('show');
  }

  // ========================================================
  // 12. 頁面分頁切換與全螢幕/音效
  // ========================================================
  function switchTab(tabName) {
    state.currentTab = tabName;

    dom.tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    Object.keys(dom.sections).forEach(key => {
      dom.sections[key].classList.toggle('active', key === tabName);
    });

    if (tabName === 'sorter' && state.sorter.questions.length === 0) {
      initSorter();
    }
  }

  dom.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });

  dom.btnAudioToggle.addEventListener('click', () => {
    const isEnabled = window.soundEngine.toggle();
    dom.btnAudioToggle.innerHTML = isEnabled 
      ? '<i class="fa-solid fa-volume-high"></i> <span>音效：開</span>' 
      : '<i class="fa-solid fa-volume-xmark"></i> <span>音效：關</span>';
  });

  dom.btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      dom.btnFullscreen.innerHTML = '<i class="fa-solid fa-compress"></i> <span>視窗化</span>';
    } else {
      document.exitFullscreen().catch(() => {});
      dom.btnFullscreen.innerHTML = '<i class="fa-solid fa-expand"></i> <span>全螢幕</span>';
    }
  });

  dom.btnValid.addEventListener('click', () => judgeChallenge('valid'));
  dom.btnInvalid.addEventListener('click', () => judgeChallenge('invalid'));
  dom.btnNext.addEventListener('click', nextChallengeQuestion);
  dom.btnModalRestart.addEventListener('click', () => {
    dom.modalOverlay.classList.remove('show');
    initChallenge();
  });

  window.addEventListener('keydown', (e) => {
    // 模式二分類錯誤檢討彈窗時，按空白鍵或 Enter 關閉並審查下一張
    if (state.currentTab === 'sorter' && dom.sorterReviewOverlay && dom.sorterReviewOverlay.classList.contains('show')) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        closeSorterReviewAndNext();
      }
      return;
    }

    if (state.currentTab !== 'challenge') return;
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
      judgeChallenge('valid');
    } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
      judgeChallenge('invalid');
    } else if (e.key === ' ' || e.key === 'Enter') {
      if (dom.btnNext.style.display !== 'none') {
        e.preventDefault();
        nextChallengeQuestion();
      }
    }
  });

  // ========================================================
  // 13. 五彩紙屑引擎 (Canvas Confetti)
  // ========================================================
  function fireConfetti() {
    const canvas = dom.confettiCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        w: Math.random() * 10 + 6,
        h: Math.random() * 8 + 4,
        vx: (Math.random() - 0.5) * 18,
        vy: (Math.random() - 0.7) * 16,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rSpeed: (Math.random() - 0.5) * 10,
        gravity: 0.35,
        opacity: 1
      });
    }

    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.rSpeed;
        p.opacity -= 0.008;

        if (p.opacity > 0) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
      });

      if (alive) {
        requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    render();
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // ========================================================
  // 14. 初始化啟動
  // ========================================================
  initMascot();
  initStampHistoryModal();
  initChallenge();
  setupMagnifier();
  initSandbox();
  initEncyclopedia();
});
