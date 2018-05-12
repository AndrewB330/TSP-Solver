var nodes = graph.nodes;
var textArea = document.getElementById('editor');
var maxNodesNumber = 12;

function updateTextArea() {
    var size = nodes.length;
    var s = '' + size + '\n';
    nodes.forEach(function (node) {
        s += node.x + ' ' + node.y + '\n';
    });
    textArea.value = s;
}

function updateGraph() {
    var lines = textArea.value.split('\n');
    var size = Math.min(maxNodesNumber, parseInt(lines[0].split(' ')[0]));
    nodes.clear();
    for (var i = 0; i < size; i++) {
        var x = 0, y = 0;
        if (i + 1 < lines.length) {
            var numbers = lines[i + 1].split(' ').map(function (x) {
                return parseInt(x);
            });
            if (numbers.length >= 2) {
                x = numbers[0];
                y = numbers[1];
            }
        }
        nodes.add({
            id: i,
            label: ''+i,
            x: x,
            y: y
        })
    }
}

var timer = null;

$("#editor").keyup(function (e) {
    clearTimeout(timer);
    if (!parseInt(String.fromCharCode(e.which))) {
        updateGraph();
    } else {
        timer = setTimeout(function () {
            updateGraph();
        }, 1000);
    }
});

graphNetwork.on('dragEnd', function (params) {
    if (params.nodes.length > 0) {
        var node = nodes.get(params.nodes[0]);
        nodes.update({
            id: node.id,
            /*x: node.x + params.event.deltaX,
            y: node.y + params.event.deltaY,*/
            x: Math.trunc(params.pointer.canvas.x),
            y: Math.trunc(params.pointer.canvas.y)
        });
        updateTextArea();
    }
});

graphNetwork.on('doubleClick', function doubleClick(params) {
    if (params.nodes.length === 0 && params.edges.length === 0 && nodes.length < maxNodesNumber) {
        nodes.add({
            id: nodes.length,
            label: ''+nodes.length,
            x: Math.trunc(params.pointer.canvas.x),
            y: Math.trunc(params.pointer.canvas.y)
        });
        console.log(params);
    }
    updateTextArea();
},);

window.onload = function () {
};

function smallGraph() {
    textArea.value = '6\n' +
        '169 113\n' +
        '-156 77\n' +
        '-67 -149\n' +
        '45 21\n' +
        '132 -111\n' +
        '-88 -28\n';
    updateGraph();
}

function bigGraph() {
    textArea.value = '37\n' +
        '169 113\n' +
        '-156 77\n' +
        '-67 -149\n' +
        '45 21\n' +
        '132 -111\n' +
        '-88 -28\n' +
        '0 -37\n' +
        '-194 -91\n' +
        '-64 -208\n' +
        '40 -198\n' +
        '165 -193\n' +
        '253 -48\n' +
        '231 62\n' +
        '324 86\n' +
        '245 175\n' +
        '77 190\n' +
        '-89 111\n' +
        '91 -48\n' +
        '173 -26\n' +
        '-191 -1\n' +
        '-211 60\n' +
        '-176 170\n' +
        '195 -158\n' +
        '-131 -101\n' +
        '-243 -32\n' +
        '-276 -156\n' +
        '-167 -162\n' +
        '-335 -34\n' +
        '15 95\n' +
        '157 54\n' +
        '-291 87\n' +
        '314 -166\n' +
        '371 -55\n' +
        '92 94\n' +
        '1 -119\n' +
        '-380 -143\n' +
        '-392 38\n';
    updateGraph();
}