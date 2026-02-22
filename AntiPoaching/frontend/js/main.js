/**
 * Main application logic - Local optimization algorithm
 */

// Current map state
let currentMap = {
    gridSize: 10,
    riskMap: [],
    animalMap: [],
    terrainMap: []
};

/**
 * Generate a random map
 */
function generateRandomMap() {
    const gridSize = parseInt(document.getElementById('gridSize').value);
    currentMap.gridSize = gridSize;
    currentMap.riskMap = [];
    currentMap.animalMap = [];
    currentMap.terrainMap = [];

    for (let row = 0; row < gridSize; row++) {
        const riskRow = [];
        const animalRow = [];
        const terrainRow = [];

        for (let col = 0; col < gridSize; col++) {
            // Generate terrain (90% passable, 10% impassable)
            const isPassable = Math.random() > 0.1 ? 1 : 0;
            terrainRow.push(isPassable);

            if (isPassable) {
                // Generate risk (higher near edges for realism)
                const edgeFactor = Math.min(row, col, gridSize - 1 - row, gridSize - 1 - col) / (gridSize / 2);
                const baseRisk = Math.random();
                const risk = Math.max(0, Math.min(1, baseRisk * (1 - edgeFactor * 0.5)));
                riskRow.push(Math.round(risk * 100) / 100);

                // Generate animals (20% chance, prefer center areas)
                const hasAnimal = Math.random() < 0.2 * (1 - edgeFactor * 0.3);
                animalRow.push(hasAnimal);
            } else {
                riskRow.push(0);
                animalRow.push(false);
            }
        }

        currentMap.riskMap.push(riskRow);
        currentMap.animalMap.push(animalRow);
        currentMap.terrainMap.push(terrainRow);
    }

    Visualizer.renderMap(currentMap, gridSize);
    document.getElementById('results').classList.add('hidden');
}

/**
 * Run the optimization algorithm
 */
async function runOptimization() {
    const rangerCount = parseInt(document.getElementById('rangerCount').value);
    const maxSteps = parseInt(document.getElementById('maxSteps').value);

    if (currentMap.riskMap.length === 0) {
        alert('Please generate a map first!');
        return;
    }

    Visualizer.setLoading(true);

    try {
        const params = {
            gridSize: currentMap.gridSize,
            rangerCount: rangerCount,
            maxSteps: maxSteps,
            riskMap: currentMap.riskMap,
            animalMap: currentMap.animalMap,
            terrainMap: currentMap.terrainMap
        };

        const result = await runLocalOptimization(params);

        // Animate the routes
        await Visualizer.animateRoutes(result.routes, 50);

        // Update statistics
        Visualizer.updateStats(result.stats);

    } catch (error) {
        alert('Optimization failed: ' + error.message);
        console.error(error);
    } finally {
        Visualizer.setLoading(false);
    }
}

/**
 * Local optimization algorithm using greedy strategy
 */
async function runLocalOptimization(params) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const routes = [];
    const coverage = Array(params.gridSize).fill(null)
        .map(() => Array(params.gridSize).fill(0));

    // Simple greedy algorithm for demo
    for (let r = 0; r < params.rangerCount; r++) {
        const path = [];

        // Find starting position (passable cell)
        let startRow, startCol;
        do {
            startRow = Math.floor(Math.random() * params.gridSize);
            startCol = Math.floor(Math.random() * params.gridSize);
        } while (params.terrainMap[startRow][startCol] === 0);

        let currentRow = startRow;
        let currentCol = startCol;
        path.push([currentRow, currentCol]);
        coverage[currentRow][currentCol]++;

        // Greedy walk
        for (let step = 1; step < params.maxSteps; step++) {
            const neighbors = getNeighbors(currentRow, currentCol, params);
            if (neighbors.length === 0) break;

            // Score each neighbor
            let bestNeighbor = neighbors[0];
            let bestScore = -Infinity;

            for (const [nr, nc] of neighbors) {
                const risk = params.riskMap[nr][nc];
                const animal = params.animalMap[nr][nc] ? 1 : 0;
                const visited = coverage[nr][nc];
                const score = (risk * 2 + animal) / (visited + 1);

                if (score > bestScore) {
                    bestScore = score;
                    bestNeighbor = [nr, nc];
                }
            }

            currentRow = bestNeighbor[0];
            currentCol = bestNeighbor[1];
            path.push([currentRow, currentCol]);
            coverage[currentRow][currentCol]++;
        }

        routes.push({ rangerId: r, path: path });
    }

    // Calculate statistics
    let totalRisk = 0;
    let coveredRisk = 0;
    let highRiskCells = 0;
    let coveredHighRisk = 0;

    for (let row = 0; row < params.gridSize; row++) {
        for (let col = 0; col < params.gridSize; col++) {
            if (params.terrainMap[row][col] === 1) {
                const risk = params.riskMap[row][col];
                totalRisk += risk;

                if (risk >= 0.7) {
                    highRiskCells++;
                    if (coverage[row][col] > 0) {
                        coveredHighRisk++;
                    }
                }

                if (coverage[row][col] > 0) {
                    coveredRisk += risk * 0.2; // 80% reduction
                } else {
                    coveredRisk += risk;
                }
            }
        }
    }

    const beforeRisk = totalRisk / (params.gridSize * params.gridSize);
    const afterRisk = coveredRisk / (params.gridSize * params.gridSize);
    const reduction = ((beforeRisk - afterRisk) / beforeRisk * 100).toFixed(0);
    const highCoverage = highRiskCells > 0
        ? ((coveredHighRisk / highRiskCells) * 100).toFixed(0)
        : 100;

    return {
        routes: routes,
        coverage: coverage,
        stats: {
            beforeRisk: beforeRisk,
            afterRisk: afterRisk,
            riskReduction: reduction + '%',
            highRiskCoverage: highCoverage + '%'
        }
    };
}

/**
 * Get valid neighboring cells
 */
function getNeighbors(row, col, params) {
    const neighbors = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (const [dr, dc] of directions) {
        const nr = row + dr;
        const nc = col + dc;

        if (nr >= 0 && nr < params.gridSize &&
            nc >= 0 && nc < params.gridSize &&
            params.terrainMap[nr][nc] === 1) {
            neighbors.push([nr, nc]);
        }
    }

    return neighbors;
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('generateBtn').addEventListener('click', generateRandomMap);
    document.getElementById('optimizeBtn').addEventListener('click', runOptimization);

    // Generate initial map
    generateRandomMap();
});
