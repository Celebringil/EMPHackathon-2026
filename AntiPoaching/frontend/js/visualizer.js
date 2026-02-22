/**
 * Visualizer module for rendering the map grid
 */

const Visualizer = {
    /**
     * Render the map grid
     * @param {Object} mapData - Map data containing risk, animal, terrain maps
     * @param {number} gridSize - Size of the grid
     */
    renderMap(mapData, gridSize) {
        const container = document.getElementById('mapGrid');
        container.innerHTML = '';
        container.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'map-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                // Apply terrain
                if (mapData.terrainMap[row][col] === 0) {
                    cell.classList.add('terrain');
                } else {
                    // Apply risk level
                    const risk = mapData.riskMap[row][col];
                    if (risk >= 0.7) {
                        cell.classList.add('risk-high');
                    } else if (risk >= 0.4) {
                        cell.classList.add('risk-medium');
                    } else {
                        cell.classList.add('risk-low');
                    }

                    // Apply animal marker
                    if (mapData.animalMap[row][col]) {
                        cell.classList.add('animal');
                    }
                }

                container.appendChild(cell);
            }
        }
    },

    /**
     * Render patrol routes on the map
     * @param {Array} routes - Array of route objects with rangerId and path
     */
    renderRoutes(routes) {
        // Clear previous routes
        document.querySelectorAll('.map-cell.patrol, .map-cell.ranger').forEach(cell => {
            cell.classList.remove('patrol', 'ranger');
            for (let i = 0; i < 5; i++) {
                cell.classList.remove(`route-${i}`);
            }
        });

        routes.forEach((route, index) => {
            route.path.forEach((point, stepIndex) => {
                const [row, col] = point;
                const cell = document.querySelector(
                    `.map-cell[data-row="${row}"][data-col="${col}"]`
                );

                if (cell) {
                    cell.classList.add('patrol', `route-${index % 5}`);

                    // Mark starting position as ranger
                    if (stepIndex === 0) {
                        cell.classList.add('ranger');
                    }
                }
            });
        });
    },

    /**
     * Update statistics display for optimized patrol
     * @param {Object} stats - Statistics object
     */
    updateStatsOptimized(stats) {
        document.getElementById('optBeforeRisk').textContent =
            (stats.beforeRisk * 100).toFixed(1) + '%';
        document.getElementById('optAfterRisk').textContent =
            (stats.afterRisk * 100).toFixed(1) + '%';
        document.getElementById('optRiskReduction').textContent =
            stats.riskReduction;
        document.getElementById('optCoverage').textContent =
            stats.highRiskCoverage;

        document.getElementById('optimizedRow').classList.remove('hidden');
        document.getElementById('results').classList.remove('hidden');
    },

    /**
     * Update statistics display for random patrol
     * @param {Object} stats - Statistics object
     */
    updateStatsRandom(stats) {
        document.getElementById('randBeforeRisk').textContent =
            (stats.beforeRisk * 100).toFixed(1) + '%';
        document.getElementById('randAfterRisk').textContent =
            (stats.afterRisk * 100).toFixed(1) + '%';
        document.getElementById('randRiskReduction').textContent =
            stats.riskReduction;
        document.getElementById('randCoverage').textContent =
            stats.highRiskCoverage;

        document.getElementById('randomRow').classList.remove('hidden');
        document.getElementById('results').classList.remove('hidden');
    },

    /**
     * Show loading state
     * @param {boolean} loading - Whether loading is active
     */
    setLoading(loading) {
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(btn => {
            btn.disabled = loading;
            if (loading) {
                btn.classList.add('loading');
            } else {
                btn.classList.remove('loading');
            }
        });
    },

    /**
     * Animate route visualization step by step
     * @param {Array} routes - Routes to animate
     * @param {number} delay - Delay between steps in ms
     */
    async animateRoutes(routes, delay = 100) {
        // Clear previous routes
        document.querySelectorAll('.map-cell.patrol, .map-cell.ranger').forEach(cell => {
            cell.classList.remove('patrol', 'ranger');
            for (let i = 0; i < 5; i++) {
                cell.classList.remove(`route-${i}`);
            }
        });

        // Find the longest route
        const maxSteps = Math.max(...routes.map(r => r.path.length));

        // Animate step by step
        for (let step = 0; step < maxSteps; step++) {
            routes.forEach((route, routeIndex) => {
                if (step < route.path.length) {
                    const [row, col] = route.path[step];
                    const cell = document.querySelector(
                        `.map-cell[data-row="${row}"][data-col="${col}"]`
                    );

                    if (cell) {
                        cell.classList.add('patrol', `route-${routeIndex % 5}`);

                        if (step === 0) {
                            cell.classList.add('ranger');
                        }
                    }
                }
            });

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};
