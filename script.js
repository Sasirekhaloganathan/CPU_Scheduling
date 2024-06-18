let processCount = 0;
const processes = [];

function addProcess() {
    processCount++;
    const table = document.getElementById('process-table');
    const row = table.insertRow();
    row.insertCell(0).innerText = `P${processCount}`;
    row.insertCell(1).innerHTML = `<input type="number" id="arrival${processCount}" min="0" required>`;
    row.insertCell(2).innerHTML = `<input type="number" id="burst${processCount}" min="1" required>`;
    row.insertCell(3).innerHTML = `<input type="number" id="priority${processCount}" min="0">`;
}

function simulate() {
    const algorithm = document.getElementById('algorithm').value;
    const timeQuantum = document.getElementById('time-quantum').value;
    processes.length = 0;

    for (let i = 1; i <= processCount; i++) {
        const arrivalTime = parseInt(document.getElementById(`arrival${i}`).value);
        const burstTime = parseInt(document.getElementById(`burst${i}`).value);
        const priority = parseInt(document.getElementById(`priority${i}`).value) || 0;
        processes.push({ pid: `P${i}`, arrivalTime, burstTime, priority, remainingTime: burstTime, startTime: 0, completionTime: 0, waitingTime: 0, turnaroundTime: 0 });
    }

    switch (algorithm) {
        case 'fcfs':
            fcfs(processes);
            break;
        case 'sjf':
            sjf(processes);
            break;
        case 'srtf':
            srtf(processes);
            break;
        case 'priority':
            priorityScheduling(processes);
            break;
        case 'rr':
            rr(processes, parseInt(timeQuantum));
            break;
    }

    displayResults(processes);
}

function fcfs(processes) {
    processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
    let currentTime = 0;
    processes.forEach(process => {
        if (currentTime < process.arrivalTime) {
            currentTime = process.arrivalTime;
        }
        process.startTime = currentTime;
        process.completionTime = process.startTime + process.burstTime;
        currentTime = process.completionTime;
        process.turnaroundTime = process.completionTime - process.arrivalTime;
        process.waitingTime = process.turnaroundTime - process.burstTime;
    });
}

function sjf(processes) {
    processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
    const n = processes.length;
    let currentTime = 0;
    let completed = 0;
    const isCompleted = new Array(n).fill(false);

    while (completed !== n) {
        let idx = -1;
        let minBurst = Infinity;
        for (let i = 0; i < n; i++) {
            if (processes[i].arrivalTime <= currentTime && !isCompleted[i] && processes[i].burstTime < minBurst) {
                minBurst = processes[i].burstTime;
                idx = i;
            }
        }

        if (idx !== -1) {
            processes[idx].startTime = currentTime;
            processes[idx].completionTime = currentTime + processes[idx].burstTime;
            processes[idx].turnaroundTime = processes[idx].completionTime - processes[idx].arrivalTime;
            processes[idx].waitingTime = processes[idx].turnaroundTime - processes[idx].burstTime;
            currentTime = processes[idx].completionTime;
            isCompleted[idx] = true;
            completed++;
        } else {
            currentTime++;
        }
    }
}

function srtf(processes) {
    processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
    const n = processes.length;
    let currentTime = 0;
    let completed = 0;
    const isCompleted = new Array(n).fill(false);
    const remainingTime = processes.map(p => p.burstTime);

    while (completed !== n) {
        let idx = -1;
        let minRemaining = Infinity;
        for (let i = 0; i < n; i++) {
            if (processes[i].arrivalTime <= currentTime && !isCompleted[i] && remainingTime[i] < minRemaining) {
                minRemaining = remainingTime[i];
                idx = i;
            }
        }

        if (idx !== -1) {
            remainingTime[idx]--;
            currentTime++;
            if (remainingTime[idx] === 0) {
                processes[idx].completionTime = currentTime;
                processes[idx].turnaroundTime = processes[idx].completionTime - processes[idx].arrivalTime;
                processes[idx].waitingTime = processes[idx].turnaroundTime - processes[idx].burstTime;
                isCompleted[idx] = true;
                completed++;
            }
        } else {
            currentTime++;
        }
    }
}

function priorityScheduling(processes) {
    processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
    let currentTime = 0;
    let completed = 0;
    const n = processes.length;
    const isCompleted = new Array(n).fill(false);

    while (completed !== n) {
        let idx = -1;
        let highestPriority = Infinity;
        for (let i = 0; i < n; i++) {
            if (processes[i].arrivalTime <= currentTime && !isCompleted[i] && processes[i].priority < highestPriority) {
                highestPriority = processes[i].priority;
                idx = i;
            }
        }

        if (idx !== -1) {
            processes[idx].startTime = currentTime;
            processes[idx].completionTime = currentTime + processes[idx].burstTime;
            processes[idx].turnaroundTime = processes[idx].completionTime - processes[idx].arrivalTime;
            processes[idx].waitingTime = processes[idx].turnaroundTime - processes[idx].burstTime;
            currentTime = processes[idx].completionTime;
            isCompleted[idx] = true;
            completed++;
        } else {
            currentTime++;
        }
    }
}

function rr(processes, timeQuantum) {
    processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
    const n = processes.length;
    let currentTime = 0;
    const queue = [];
    const isCompleted = new Array(n).fill(false);
    let completed = 0;
    let i = 0;

    while (completed !== n) {
        while (i < n && processes[i].arrivalTime <= currentTime) {
            queue.push(i);
            i++;
        }

        if (queue.length > 0) {
            const idx = queue.shift();
            if (processes[idx].remainingTime > timeQuantum) {
                currentTime += timeQuantum;
                processes[idx].remainingTime -= timeQuantum;
                while (i < n && processes[i].arrivalTime <= currentTime) {
                    queue.push(i);
                    i++;
                }
                queue.push(idx);
            } else {
                currentTime += processes[idx].remainingTime;
                processes[idx].completionTime = currentTime;
                processes[idx].turnaroundTime = processes[idx].completionTime - processes[idx].arrivalTime;
                processes[idx].waitingTime = processes[idx].turnaroundTime - processes[idx].burstTime;
                processes[idx].remainingTime = 0;
                isCompleted[idx] = true;
                completed++;
            }
        } else {
            currentTime++;
        }
    }
}

function displayResults(processes) {
    const ganttChart = document.getElementById('gantt-chart');
    ganttChart.innerHTML = '<h3>Gantt Chart</h3>';

    processes.forEach(process => {
        const div = document.createElement('div');
        div.innerText = process.pid;
        div.style.width = `${process.burstTime * 20}px`;
        ganttChart.appendChild(div);
    });

    const avgWaitingTime = processes.reduce((sum, p) => sum + p.waitingTime, 0) / processes.length;
    const avgTurnaroundTime = processes.reduce((sum, p) => sum + p.turnaroundTime, 0) / processes.length;

    const averages = document.getElementById('averages');
    averages.innerHTML = `<p>Average Waiting Time: ${avgWaitingTime.toFixed(2)}</p><p>Average Turnaround Time: ${avgTurnaroundTime.toFixed(2)}</p>`;
}

document.getElementById('algorithm').addEventListener('change', function () {
    const timeQuantumInput = document.getElementById('time-quantum');
    if (this.value === 'rr') {
        timeQuantumInput.style.display = 'block';
    } else {
        timeQuantumInput.style.display = 'none';
    }
});
