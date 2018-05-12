var info = document.getElementById('info');

function approximate(path, n, d) {
    if (path.length === n) {
        return 0;
    }
    var from = [];
    var to = [];
    var approximation = 0;
    for (var i = 0; i < n; i++) if (path.indexOf(i) === -1) from.push(i);
    for (var j = 0; j < n; j++) if (path.indexOf(j) === -1) to.push(j);
    if (path.length > 0) from.push(path[path.length - 1]);
    if (path.length > 0) to.push(path[0]);
    var nearest = new Array(n);
    for (var a = 0; a < from.length; a++) {
        var minimal = Infinity;
        for (var b = 0; b < to.length; b++) {
            if (from[a] !== to[b]) {
                minimal = Math.min(minimal, d[from[a]][to[b]]);
            }
        }
        nearest[from[a]] = minimal;
        approximation += minimal;
    }
    for (var c = 0; c < to.length; c++) {
        var delta = Infinity;
        for (var e = 0; e < from.length; e++) {
            if (from[e] !== to[c]) {
                delta = Math.min(delta, d[from[e]][to[c]] - nearest[from[e]]);
            }
        }
        approximation += delta;
    }
    return approximation;
}

function nextState(state, next, n, d) {
    var nextState = {
        path: state.path.slice(),
        length: state.length
    };
    if (state.path.length > 0) {
        nextState.length += d[state.path[state.path.length - 1]][next];
    }
    nextState.path.push(next);
    if (nextState.path.length === n) {
        nextState.length += d[next][state.path[0]];
    }
    nextState.approximation = nextState.length + approximate(nextState.path, n, d);
    return nextState;
}

function solvePlanar(solver) {
    var nodes = graph.nodes;
    var n = nodes.length;
    var d = new Array(n);
    for (var i = 0; i < n; i++) {
        d[i] = new Array(n);
        for (var j = 0; j < n; j++) {
            var dx = nodes.get(i).x - nodes.get(j).x;
            var dy = nodes.get(i).y - nodes.get(j).y;
            d[i][j] = Math.sqrt(dx * dx + dy * dy);
        }
    }
    solver(n, d);
}

function reset() {
    tree.nodes.clear();
    tree.edges.clear();
    graph.edges.clear();
    info.innerHTML = '';
}

function solveBranchAndBound(n, d) {
    stopAnimation();
    reset();
    var queue = new TinyQueue([], function (a, b) {
        if (a.approximation < b.approximation) return -1;
        if (a.approximation > b.approximation) return +1;
        return 0;
    });
    var initial = {
        id: 0,
        prevId: 0,
        path: [0],
        length: 0,
        approximation: approximate([0], n, d)
    };
    var idCounter = 1;
    queue.push(initial);
    var result = {length: Infinity};
    var delay = 0;
    tree.nodes.add({
        id: initial.id,
        state: initial,
        x: 0,
        y: 0,
        distance: 80,
        color: treeRoot,
        label: '0'
    });
    var states = [initial];
    while (queue.length > 0) {
        var current = queue.peek();
        if (current.approximation >= result.length - 1e-9) break;
        queue.pop();
        current.used = true;
        if (current.id !== current.prevId) {
            setTimeout(function (state) {
                displayState(state);
                var dist = tree.nodes.get(state.prevId).distance;
                var position = treeNetwork.getPositions([state.prevId])[state.prevId];
                var x = position.x + randomInt(-dist, dist);
                var y = position.y + randomInt(-dist, dist);
                tree.nodes.add({
                    id: state.id,
                    state: state,
                    x: x,
                    y: y,
                    distance: dist * 0.8,
                    label: '' + state.path[state.path.length - 1]
                });
                tree.edges.add({from: state.id, to: state.prevId});
            }, delay, current);
            delay += 100;
        }
        if (current.path.length === n) {
            if (current.length < result.length) {
                setTimeout(
                    function (state) {
                        var start = state.id;
                        while (state.prevId !== state.id) {
                            tree.edges.update({
                                from: state.id,
                                to: state.prevId,
                                color: treeResultEdge
                            });
                            tree.nodes.update({id: state.id, color: treeResult});
                            state = states[state.prevId];
                        }
                        tree.nodes.update({id: start, color: treeResultTail});
                    },
                    delay,
                    current
                );
                result = current;
            }
            continue;
        }
        var unused = [];
        for (var i = 0; i < n; i++) if (current.path.indexOf(i) === -1) unused.push(i);
        for (var j = 0; j < unused.length; j++) {
            var next = unused[j];
            var state = nextState(current, next, n, d);
            state.id = idCounter++;
            state.prevId = current.id;
            queue.push(state);
            states.push(state);
            //tree.nodes.add({id: state.id});
            //tree.edges.add({from: current.id, to: state.prevId});
        }
    }
    setTimeout(displayState, delay, result);
    for (var i = 0; i < states.length; i++) {
        var state = states[i];
        if (state.used && state.id != result.id) {
            setTimeout(function (state) {
                var inEdges = tree.edges.get().filter(function (edge) {
                    return edge.to === state.id;
                });
                if (inEdges.length === 0) {
                    tree.nodes.update({id: state.id, color: treeBad});
                }
            }, delay, state);
        }
    }
}

function getPath(start, next) {
    var path = [];
    var v = start;
    do {
        path.push(v);
        v = next[v];
    }while(v !== start);
    return path;
}

function reverse(start, finish, next) {
    var p = next[start];
    var prev = start;
    do {
        var ne = next[p];
        next[p] = prev;
        prev = p;
        p = ne;
    }while(prev !== finish);
}

function solveAnnealing(n, d) {
    var path = [];
    var length = 0;
    var next = new Array(n);
    var used = new Array(n);
    var v = 0;
    for (var i = 1; i < n; i++) {
        var nearest = -1;
        used[v] = true;
        for (var j = 0; j < n; j++) {
            if (!used[j] && (nearest === -1 || d[v][j] < d[v][nearest])) {
                nearest = j;
            }
        }
        length += d[v][nearest];
        next[v] = nearest;
        v = nearest;
    }
    console.log(v);
    next[v] = 0;
    length += d[v][0];
    path = getPath(0, next);
    displayPath(path);
    var temperature = length / (1.5 * n);
    var fadeFactor = 0.999;
    var iterationsNumber = 5000;
    var delay = 0;
    if (path.length > 3) {
        for (var iteration = 0; iteration < iterationsNumber;) {
            var a = randomInt(0, n);
            var b = randomInt(0, n);
            var ca = (a + 1) % n;
            var cb = (b - 1 + n) % n;
            if (a === b || b === ca || a === cb || ca === cb) continue;
            var newLength = length
                - d[path[a]][path[ca]]
                - d[path[b]][path[cb]]
                + d[path[a]][path[cb]]
                + d[path[b]][path[ca]];
            var delta = newLength - length;
            var p = Math.exp(-delta / temperature);
            if (Math.random() < p) {
                console.log(newLength);
                length = newLength;
                reverse(path[ca],path[cb],next);
                next[path[a]] = path[cb];
                next[path[ca]] = path[b];
                path = getPath(0, next);
                setTimeout(displayPath, delay, path);
                setTimeout(function(iteration, temperature, length){
                    info.innerHTML = '<b>Iteration: </b>' + iteration + '<br>' +
                        '<b>Temperature: </b>' + temperature.toFixed(3) + '<br>' +
                        '<b>Length: </b>' + length.toFixed(3);
                }, delay, iteration, temperature, length);
                delay += 100;
            }

            iteration++;
            temperature *= fadeFactor;
        }
    }
}

treeNetwork.on('click', function (param) {
    if (param.nodes.length > 0) {
        var state = tree.nodes.get(param.nodes[0]).state;
        displayState(state);
    }
});

function displayPath(path) {
    graph.edges.clear();
    var n = graph.nodes.length;
    for (var i = 0; i < n; i++) {
        graph.edges.add({from: path[i], to: path[(i + 1) % n]});
    }
}

function displayState(state) {
    displayPath(state.path);
    info.innerHTML = '<b>Length:</b> ' + state.length.toFixed(3) + '<br>' +
        '<b>Approximation:</b> ' + state.approximation.toFixed(3) + '<br>' +
        '<b>Path:</b> ' + state.path.join(' > ');
}

function stopAnimation() {
    var timeout = setTimeout(function () {
    }, 0);
    while (timeout >= 0) {
        clearTimeout(timeout);
        timeout--;
    }
}