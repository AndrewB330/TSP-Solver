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
    textArea.value =
        '6\n' +
        '169 113\n' +
        '-156 77\n' +
        '-67 -149\n' +
        '45 21\n' +
        '132 -111\n' +
        '-88 -28\n';
    updateGraph();
};
