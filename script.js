document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    
    const cells = document.querySelectorAll(".cell");
    const statusText = document.getElementById("status");
    const resetButton = document.getElementById("reset");
    const resetScoresButton = document.getElementById("reset-scores");
    const winModal = document.getElementById("win-modal");
    const modalMessage = document.getElementById("modal-message");
    const playAgainButton = document.getElementById("play-again");
    const themeToggle = document.getElementById("theme-toggle");
    const modeBtns = document.querySelectorAll(".mode-btn");
    const symbolBtns = document.querySelectorAll(".symbol-btn");
    const difficultyBtns = document.querySelectorAll(".difficulty-btn");
    const difficultySection = document.querySelector(".difficulty");
    const winLine = document.getElementById("win-line");
    const scoreX = document.getElementById("score-x");
    const scoreO = document.getElementById("score-o");
    const scoreDraw = document.getElementById("score-draw");
    const currentYearElement = document.getElementById("current-year");


    // Game state
    
    let board = ["", "", "", "", "", "", "", "", ""];
    let currentPlayer = "X";
    let running = true;
    let gameMode = "two-player"; // "two-player" or "ai"
    let playerSymbol = "X"; // Player's symbol when playing against AI
    let aiDifficulty = "easy"; // "easy", "medium", or "hard"
    let scores = {
        X: 0,
        O: 0,
        draw: 0
    };

    // Winning combinations
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]  // Diagonals
    ];

    // Sound effects (base64 encoded short sounds)
    const sounds = {
        click: createSound(500, 'sine', 0.2),
        win: createSound(800, 'square', 0.3),
        draw: createSound(300, 'sine', 0.2)
    };

    // Helper function to create simple sounds
    function createSound(freq, type, vol) {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.type = type;
            oscillator.frequency.value = freq;
            gainNode.gain.value = vol;
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.1);
            
            return { play: () => {
                const newCtx = new (window.AudioContext || window.webkitAudioContext)();
                const newOsc = newCtx.createOscillator();
                const newGain = newCtx.createGain();
                
                newOsc.type = type;
                newOsc.frequency.value = freq;
                newGain.gain.value = vol;
                
                newOsc.connect(newGain);
                newGain.connect(newCtx.destination);
                
                newOsc.start();
                newOsc.stop(newCtx.currentTime + 0.1);
            }};
        } catch (e) {
            return { play: () => {} }; // Fallback if Web Audio API not supported
        }
    }

    // Initialize the game
    function init() {
        updateScores();
        updateStatus();
        setCurrentYear();
        setupEventListeners();
    }

    function setCurrentYear() {
        if (currentYearElement) {
            currentYearElement.textContent = new Date().getFullYear();
        }
    }

    function setupEventListeners() {
        // Cell click handlers
        cells.forEach(cell => {
            cell.addEventListener("click", handleCellClick);
        });

        // Button handlers
        resetButton.addEventListener("click", resetGame);
        resetScoresButton.addEventListener("click", resetScores);
        playAgainButton.addEventListener("click", playAgain);
        themeToggle.addEventListener("click", toggleTheme);

        // Mode selection
        modeBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                gameMode = btn.dataset.mode;
                updateModeSelection();
                if (gameMode === "ai") {
                    difficultySection.style.display = "block";
                } else {
                    difficultySection.style.display = "none";
                }
                resetGame();
            });
        });

        // Symbol selection
        symbolBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                playerSymbol = btn.dataset.symbol;
                updateSymbolSelection();
                resetGame();
            });
        });

        // Difficulty selection
        difficultyBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                aiDifficulty = btn.dataset.difficulty;
                updateDifficultySelection();
                resetGame();
            });
        });
    }

    function updateModeSelection() {
        modeBtns.forEach(btn => {
            btn.classList.toggle("active", btn.dataset.mode === gameMode);
        });
    }

    function updateSymbolSelection() {
        symbolBtns.forEach(btn => {
            btn.classList.toggle("active", btn.dataset.symbol === playerSymbol);
        });
    }

    function updateDifficultySelection() {
        difficultyBtns.forEach(btn => {
            btn.classList.toggle("active", btn.dataset.difficulty === aiDifficulty);
        });
    }

    function handleCellClick(e) {
        const index = e.target.dataset.index;
        
        if (board[index] !== "" || !running) return;
        
        sounds.click.play();
        makeMove(index, currentPlayer);
        
        if (gameMode === "ai" && running && currentPlayer !== playerSymbol) {
            setTimeout(makeAiMove, 500); // Add slight delay for better UX
        }
    }

    function makeMove(index, player) {
        board[index] = player;
        cells[index].textContent = player;
        cells[index].classList.add(player.toLowerCase());
        
        checkGameResult();
    }

    function makeAiMove() {
        if (!running) return;
        
        let index;
        
        switch (aiDifficulty) {
            case "easy":
                index = getRandomMove();
                break;
            case "medium":
                index = Math.random() > 0.5 ? getWinningOrBlockingMove() : getRandomMove();
                break;
            case "hard":
                index = getBestMove();
                break;
            default:
                index = getRandomMove();
        }
        
        if (index !== -1) {
            sounds.click.play();
            makeMove(index, currentPlayer);
        }
    }

    function getRandomMove() {
        const emptyCells = board.map((cell, index) => cell === "" ? index : -1).filter(i => i !== -1);
        return emptyCells.length > 0 ? emptyCells[Math.floor(Math.random() * emptyCells.length)] : -1;
    }

    function getWinningOrBlockingMove() {
        const opponent = currentPlayer === "X" ? "O" : "X";
        
        // Check for winning move
        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (board[a] === currentPlayer && board[b] === currentPlayer && board[c] === "") return c;
            if (board[a] === currentPlayer && board[c] === currentPlayer && board[b] === "") return b;
            if (board[b] === currentPlayer && board[c] === currentPlayer && board[a] === "") return a;
        }
        
        // Check for blocking move
        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (board[a] === opponent && board[b] === opponent && board[c] === "") return c;
            if (board[a] === opponent && board[c] === opponent && board[b] === "") return b;
            if (board[b] === opponent && board[c] === opponent && board[a] === "") return a;
        }
        
        return getRandomMove();
    }

    function getBestMove() {
        // Simple minimax implementation for Tic-Tac-Toe
        const opponent = currentPlayer === "X" ? "O" : "X";
        
        // Check for immediate win
        for (let i = 0; i < board.length; i++) {
            if (board[i] === "") {
                board[i] = currentPlayer;
                if (checkWin(currentPlayer)) {
                    board[i] = "";
                    return i;
                }
                board[i] = "";
            }
        }
        
        // Check for immediate block
        for (let i = 0; i < board.length; i++) {
            if (board[i] === "") {
                board[i] = opponent;
                if (checkWin(opponent)) {
                    board[i] = "";
                    return i;
                }
                board[i] = "";
            }
        }
        
        // Try to take center
        if (board[4] === "") return 4;
        
        // Try to take a corner
        const corners = [0, 2, 6, 8];
        const emptyCorners = corners.filter(i => board[i] === "");
        if (emptyCorners.length > 0) {
            return emptyCorners[Math.floor(Math.random() * emptyCorners.length)];
        }
        
        // Take any available edge
        const edges = [1, 3, 5, 7];
        const emptyEdges = edges.filter(i => board[i] === "");
        if (emptyEdges.length > 0) {
            return emptyEdges[Math.floor(Math.random() * emptyEdges.length)];
        }
        
        return -1; // No moves left
    }

    function checkGameResult() {
        if (checkWin(currentPlayer)) {
            handleWin();
            return;
        }
        
        if (checkDraw()) {
            handleDraw();
            return;
        }
        
        switchPlayer();
        updateStatus();
    }

    function checkWin(player) {
        return winPatterns.some(pattern => {
            return pattern.every(index => board[index] === player);
        });
    }

    function checkDraw() {
        return board.every(cell => cell !== "");
    }

    function handleWin() {
        running = false;
        scores[currentPlayer]++;
        updateScores();
        
        // Find winning pattern
        const winningPattern = winPatterns.find(pattern => {
            return pattern.every(index => board[index] === currentPlayer);
        });
        
        // Show win line
        if (winningPattern && winLine) {
            const [a, b, c] = winningPattern;
            const cell1 = cells[a].getBoundingClientRect();
            const cell2 = cells[c].getBoundingClientRect();
            
            const length = Math.sqrt(
                Math.pow(cell2.left - cell1.left, 2) + 
                Math.pow(cell2.top - cell1.top, 2)
            );
            
            const angle = Math.atan2(
                cell2.top - cell1.top,
                cell2.left - cell1.left
            ) * 180 / Math.PI;
            
            const centerX = (cell1.left + cell2.left) / 2;
            const centerY = (cell1.top + cell2.top) / 2;
            
            winLine.style.width = `${length}px`;
            winLine.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
            winLine.style.left = `${centerX}px`;
            winLine.style.top = `${centerY}px`;
            winLine.style.opacity = "1";
        }
        
        sounds.win.play();
        showModal(`${currentPlayer} Wins!`);
    }

    function handleDraw() {
        running = false;
        scores.draw++;
        updateScores();
        
        sounds.draw.play();
        showModal("It's a Draw!");
    }

    function showModal(message) {
        if (winModal && modalMessage) {
            modalMessage.textContent = message;
            winModal.style.display = "flex";
        }
    }

    function hideModal() {
        if (winModal) {
            winModal.style.display = "none";
        }
        if (winLine) {
            winLine.style.opacity = "0";
        }
    }

    function switchPlayer() {
        currentPlayer = currentPlayer === "X" ? "O" : "X";
    }

    function updateStatus() {
        if (statusText) {
            if (gameMode === "ai" && currentPlayer !== playerSymbol) {
                statusText.textContent = "AI is thinking...";
            } else {
                statusText.textContent = `Player ${currentPlayer}'s Turn`;
            }
        }
    }

    function updateScores() {
        if (scoreX) scoreX.textContent = `X: ${scores.X}`;
        if (scoreO) scoreO.textContent = `O: ${scores.O}`;
        if (scoreDraw) scoreDraw.textContent = `Draws: ${scores.draw}`;
    }

    function resetGame() {
        board = ["", "", "", "", "", "", "", "", ""];
        currentPlayer = "X";
        running = true;
        
        cells.forEach(cell => {
            cell.textContent = "";
            cell.classList.remove("x", "o");
        });
        
        hideModal();
        updateStatus();
        
        // In AI mode, if AI goes first
        if (gameMode === "ai" && playerSymbol === "O") {
            setTimeout(makeAiMove, 500);
        }
    }
    

    function resetScores() {
        scores = { X: 0, O: 0, draw: 0 };
        updateScores();
        resetGame();
    }
    

    function playAgain() {
        hideModal();
        resetGame();
    }
    

    function toggleTheme() {
        document.body.classList.toggle("dark-theme");
        // You can add more theme toggling logic here
    }
    

    // Initialize the game
    
    init();
    
});
