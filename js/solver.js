
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

function solvePlanar() {
    var nodes = graph.nodes;
    var n = nodes.length;
    var d = new Array(n);
    for (var i = 0; i < n; i++) {
        d[i] = new Array(n);
        for (var j = 0; j < n; j++) {
            var dx = nodes.get(i).x - nodes.get(j).x;
            var dy = nodes.get(i).y - nodes.get(j).y;
            d[i][j] = Math.sqrt(dx * dx + dy * dy);
            //d[i][j] = randomInt(5,50);
        }
    }
    console.log(d);
    solve(n, d);
}

function reset() {
    tree.nodes.clear();
    tree.edges.clear();
    graph.edges.clear();
    info.innerHTML = '';
}

function solve(n, d) {
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
    //tree.nodes.add({id: initial.id});
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

treeNetwork.on('click', function (param) {
    if (param.nodes.length > 0) {
        var state = tree.nodes.get(param.nodes[0]).state;
        displayState(state);
    }
});

function displayState(state) {
    graph.edges.clear();
    var n = graph.nodes.length;
    for (var i = 0; i < n; i++) {
        graph.edges.add({from: state.path[i], to: state.path[(i + 1) % n]});
    }
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