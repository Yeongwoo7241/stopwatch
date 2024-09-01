let startTime;
let updatedTime;
let difference;
let tInterval;
let running = false;
let totalMilliseconds = 0;
let currentParticipant = null;
let selectedParticipants = [];
let scores = {};  // 다중 선택에서 점수 저장을 위해 변경
let canStop = false;

const display = document.getElementById('display');
const mainBtn = document.getElementById('mainBtn');
const currentPlayer = document.getElementById('currentPlayer');
const coffeeMessage = document.getElementById('coffeeMessage');
const results = document.getElementById('results');
const resultDisplay = document.getElementById('resultDisplay'); // 추가
const participantButtons = document.querySelectorAll('.participantBtn');
const newParticipantName = document.getElementById('newParticipantName');
const addParticipantBtn = document.getElementById('addParticipantBtn');
const participantsDiv = document.getElementById('participants');
const gameStartBtn = document.getElementById('gameStartBtn');
const page1 = document.getElementById('page1');
const page2 = document.getElementById('page2');
const participantSelection = document.getElementById('participantSelection');

// 참가자 선택 이벤트 리스너 추가
function attachParticipantListeners() {
    const participantBtns = document.querySelectorAll('.participantBtn');
    participantBtns.forEach(button => {
        button.addEventListener('click', toggleParticipantSelection);
    });
}

// 초기 로드 시 버튼에 리스너 추가
attachParticipantListeners();

// 새로운 참가자 추가
addParticipantBtn.addEventListener('click', () => {
    const name = newParticipantName.value.trim();
    if (name) {
        // 참가자 버튼 생성
        const newButton = document.createElement('button');
        newButton.className = 'participantBtn';
        newButton.setAttribute('data-name', name);
        newButton.innerText = name;

        // 리스너 추가
        newButton.addEventListener('click', toggleParticipantSelection);

        // 참가자 목록에 추가
        participantsDiv.appendChild(newButton);

        // 입력 필드 초기화
        newParticipantName.value = '';

        // Game Start 버튼 활성화 여부 확인
        updateGameStartButton();
    }
});

newParticipantName.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        addParticipantBtn.click();
    }
});

function toggleParticipantSelection(event) {
    const button = event.target;
    const participantName = button.getAttribute('data-name');

    if (button.classList.contains('selected')) {
        button.classList.remove('selected');
        selectedParticipants = selectedParticipants.filter(name => name !== participantName);
    } else {
        button.classList.add('selected');
        selectedParticipants.push(participantName);
    }

    // Game Start 버튼 활성화 여부 확인
    updateGameStartButton();
}

function updateGameStartButton() {
    gameStartBtn.disabled = selectedParticipants.length === 0;
}

gameStartBtn.addEventListener('click', () => {
    if (selectedParticipants.length > 0) {
        // 첫 번째 페이지 숨기고 두 번째 페이지 표시
        page1.style.display = 'none';
        page2.style.display = 'flex';

        // 선택된 참가자 버튼 생성
        participantSelection.innerHTML = ''; // 기존 선택 초기화
        selectedParticipants.forEach(participantName => {
            const newButton = document.createElement('button');
            newButton.className = 'participantBtn';
            newButton.setAttribute('data-name', participantName);
            newButton.innerText = participantName;

            // 선택 이벤트 리스너 추가
            newButton.addEventListener('click', selectParticipant);

            // 선택 영역에 추가
            participantSelection.appendChild(newButton);
        });

        updateCoffeeMessage();  // 초기 커피 메시지 업데이트
    }
});

function selectParticipant(event) {
    currentParticipant = event.target.getAttribute('data-name');
    currentPlayer.innerText = `현재 플레이어: ${currentParticipant}`;
    mainBtn.disabled = false;  // 참가자를 선택하면 Start 버튼 활성화
    mainBtn.innerText = 'Start';
    display.innerText = '00:00:00';  // 초깃값을 분:초:밀리초로 설정
    display.style.color = 'black'; // 시간초 색상을 검은색으로 초기화
    resultDisplay.innerText = ''; // 이전 결과 초기화
    totalMilliseconds = 0;
    running = false;
    canStop = false;
    clearInterval(tInterval);

    updateLeadingCandidate();  // 유력 당첨후보 표시 업데이트
}

function updateLeadingCandidate() {
    let lowestScore = Infinity;
    let leadingCandidate = null;

    for (const [participant, score] of Object.entries(scores)) {
        if (score < lowestScore && score !== 100) {  // 장땡(100점)은 제외
            lowestScore = score;
            leadingCandidate = participant;
        }
    }

    if (leadingCandidate) {
        const leadingCandidateDisplay = document.getElementById('leadingCandidate');
        if (!leadingCandidateDisplay) {
            // 요소가 없으면 새로 생성
            const newDisplay = document.createElement('div');
            newDisplay.id = 'leadingCandidate';
            newDisplay.style.fontSize = '1.5rem';
            newDisplay.style.marginTop = '10px';
            newDisplay.innerText = `유력 당첨후보: ${leadingCandidate}`;
            currentPlayer.insertAdjacentElement('afterend', newDisplay);
        } else {
            // 이미 요소가 있으면 업데이트
            leadingCandidateDisplay.innerText = `유력 당첨후보: ${leadingCandidate}`;
        }
    }
}


mainBtn.addEventListener('click', () => {
    if (!running && mainBtn.innerText === 'Start') {
        // Start 기능
        startTime = new Date().getTime();
        tInterval = setInterval(updateTime, 10);  // 10ms마다 업데이트
        mainBtn.innerText = 'Stop';
        running = true;
        canStop = false;

        // 3초 후에 스탑 버튼 활성화
        setTimeout(() => {
            canStop = true;
            display.style.color = 'green'; // 3초 후 초록색으로 변경
        }, 3000);
    } else if (running && mainBtn.innerText === 'Stop' && canStop) {
        // Stop 기능 (3초 후에만 동작)
        clearInterval(tInterval);
        totalMilliseconds += difference;

        // 밀리초 자릿수를 추출
        const milliseconds = Math.floor((totalMilliseconds % 1000) / 10);
        const tens = Math.floor(milliseconds / 10);  // 10의 자리
        const ones = milliseconds % 10;  // 1의 자리

        let scoreText;
        let numericScore;

        // 점수 계산 및 출력
        if (milliseconds === 0) {
            scoreText = "장땡✨";
            numericScore = 100;  // 장땡은 최상위 점수로 처리
        } else if (tens === ones) {
            scoreText = `${tens}땡🎉`;
            numericScore = milliseconds;
        } else {
            const sum = tens + ones;
            if (sum === 10) {
                scoreText = "망통💣";
                numericScore = 0;
            } else {
                const score = sum % 10;
                scoreText = `${score}끗`;  // 합의 일의 자리
                numericScore = score;
            }
        }

        resultDisplay.innerText = scoreText;  // 결과를 상단에 크게 표시

        // 점수판에 참가자의 이름과 점수 저장
        if (currentParticipant) {
            scores[currentParticipant] = numericScore;
            displayResults();  // 결과 표시
            processResults();  // 모든 점수가 입력되었는지 확인 및 처리
        }

        mainBtn.innerText = 'Reset';
        running = false;
    } else if (!running && mainBtn.innerText === 'Reset') {
        // Reset 기능
        clearInterval(tInterval);
        display.innerText = '00:00:00';  // 다시 분:초:밀리초 형식으로 리셋
        display.style.color = 'black'; // 색상 초기화
        resultDisplay.innerText = '';  // 결과 초기화
        mainBtn.innerText = 'Start';
        running = false;
        totalMilliseconds = 0;
    }
});

function processResults() {
    if (Object.keys(scores).length === selectedParticipants.length) {
        // 모든 참가자가 경기를 마쳤는지 확인
        let lowestScore = Infinity;
        let lowestScorers = [];

        for (const [participant, score] of Object.entries(scores)) {
            if (score < lowestScore) {
                lowestScore = score;
                lowestScorers = [participant];
            } else if (score === lowestScore) {
                lowestScorers.push(participant);
            }
        }

        if (lowestScorers.length === 1) {
            // 꼴찌가 1명일 경우
            const winnerMessage = document.createElement('div');
            winnerMessage.className = 'highlight';
            winnerMessage.innerText = `오늘의 당첨자: ${lowestScorers[0]}`;
            resultDisplay.appendChild(winnerMessage);
        } else {
            // 꼴찌가 2명 이상일 경우
            const shootOffMessage = document.createElement('div');
            shootOffMessage.className = 'shoot-off';
            shootOffMessage.innerText = '슛오프🎯';
            document.body.insertBefore(shootOffMessage, document.body.firstChild.nextSibling);

            // 꼴찌들만 다시 경기하게 하기
            selectedParticipants = lowestScorers;
            participantSelection.innerHTML = ''; // 기존 선택 초기화

            selectedParticipants.forEach(participantName => {
                const newButton = document.createElement('button');
                newButton.className = 'participantBtn';
                newButton.setAttribute('data-name', participantName);
                newButton.innerText = participantName;

                // 선택 이벤트 리스너 추가
                newButton.addEventListener('click', selectParticipant);

                // 선택 영역에 추가
                participantSelection.appendChild(newButton);
            });

            // Reset 상태로 돌아가서 다시 경기를 시작하게 함
            mainBtn.innerText = 'Start';
            mainBtn.disabled = true;
        }

        // 유력 당첨후보 표시 제거
        const leadingCandidateDisplay = document.getElementById('leadingCandidate');
        if (leadingCandidateDisplay) {
            leadingCandidateDisplay.remove();
        }
    }
}

function updateTime() {
    updatedTime = new Date().getTime();
    difference = updatedTime - startTime;

    let minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((difference % (1000 * 60)) / 1000);
    let milliseconds = Math.floor((difference % 1000) / 10);

    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
    milliseconds = (milliseconds < 10) ? "0" + milliseconds : milliseconds;

    display.innerText = minutes + ':' + seconds + ':' + milliseconds;
}


function displayResults() {
    // 결과를 표시하기 전에 기존 내용을 지움
    results.innerHTML = '';

    // 현재 날짜 가져오기
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
    const dd = String(today.getDate()).padStart(2, '0');

    // 날짜 표시
    const dateHeading = document.createElement('h3');
    dateHeading.innerText = `${yyyy}년 ${mm}월 ${dd}일`;
    results.appendChild(dateHeading);

    // 결과 테이블 생성
    const table = document.createElement('table');
    const headerRow = document.createElement('tr');
    const headers = ['순위', '이름', '점수'];

    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.innerText = headerText;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    // 점수를 내림차순으로 정렬하고 모든 참가자를 출력
    const sortedScores = Object.entries(scores).sort(([, a], [, b]) => b - a);

    sortedScores.forEach(([participant, score], index) => {
        const row = document.createElement('tr');
        const rankCell = document.createElement('td');
        rankCell.innerText = `${index + 1}위`;
        const nameCell = document.createElement('td');
        nameCell.innerText = participant;
        const scoreCell = document.createElement('td');
        scoreCell.innerText = score;

        row.appendChild(rankCell);
        row.appendChild(nameCell);
        row.appendChild(scoreCell);
        table.appendChild(row);
    });

    results.appendChild(table);
}

function updateCoffeeMessage() {
    // 최저 점수 계산
    let lowestScore = Infinity;
    let lowestScorer = '';

    for (const [participant, score] of Object.entries(scores)) {
        if (score < lowestScore && score !== 100) {  // 장땡(100점)은 제외
            lowestScore = score;
            lowestScorer = participant;
        }
    }

    coffeeMessage.innerText = `오늘의 땡잡이 주인공은?`;
}

function saveScores(scores) {
    localStorage.setItem('stopwatchScores', JSON.stringify(scores));
}

function loadScores() {
    const savedScores = localStorage.getItem('stopwatchScores');
    return savedScores ? JSON.parse(savedScores) : {};
}

// 페이지 로드 시 초기화
updateCoffeeMessage();
