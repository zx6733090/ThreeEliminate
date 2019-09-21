//数字游戏。
////////////////////////////////////////////////////////////////////////////////////
//点击一次数字方块数字+1，且点击一次消耗1能量值				
//当相邻相同数字的方块数量大于3个（包含3个）时方块自动消除，并新生成一个消除方块数字+1的方块。								
//新生成方块显示位置：
//①消除的方块其中一个方块为玩家操作的则新生成的方块位置为操作方块位置，有多个操作方块则在最后操作方块的位置。
//②消除方块无有操作的方块新生成方块的位置最左最下的空位。（优先最左，左的位置一样选择最下）。
//③新生成的方块如果下的位置为空位，则向下掉落。
////////////////////////////////////////////////////////////////////////////////////
//生成新的数字游戏 
//@param {Number} rows 行数 
//@param {Number} cols 列数 
//@param {Array} weights 数字权重
//    例如:[0.35, 0.65, 0.85, 0.95, 1]表示1-5每个数字的生成概率为0.35,0.35,0.2,0.1,0.05
function DigitalGame(rows, cols, weights) {
    this.rows = rows
    this.cols = cols
    this.weights = weights
    this.numMap = []
    this.randMap()
}
DigitalGame.prototype = {
    randMap: function () {
        //按概率生成数字
        for (var i = 0; i < this.rows; i++) {
            this.numMap[i] = []
            for (var j = 0; j < this.cols; j++) {
                var rs = Math.random()
                this.numMap[i][j] = this.weights.findIndex(v => rs < v) + 1
            }
        }
        //能消除的元素 重新生成
        while (this.clearSameElement().bClear) {
            this.randFill()
        }
        return this.numMap
    },
    //操作3个或者以上的相邻且相同的元素
    clearSameElement: function () {
        var rs = {
            bClear: false,
            clears: []
        }
        //标记清除元素
        var markCell = (map, x, y, status) => {
            if (x < 0 || x > this.rows - 1 || y < 0 || y > this.cols - 1) {
                //越界的返回
                return
            }
            if (map[x][y] < 0 || status.nodes.find(v => v.x == x && v.y == y)) {
                //已经访问过的返回
                return
            }
            if (map[x][y] == status.value) {
                status.count += 1
                if (status.count >= 3) {
                    if (!status.bClear) {
                        status.bClear = true
                        rs.clears.push([])
                        status.nodes.forEach(v => {
                            map[v.x][v.y] *= -1
                            rs.clears[rs.clears.length - 1].push([v.x, v.y,status.value])
                        });
                    }
                    map[x][y] *= -1
                    rs.clears[rs.clears.length - 1].push([x, y,status.value])
                } else {
                    status.nodes.push({
                        x,
                        y
                    })
                }
                markCell(map, x - 1, y, status)
                markCell(map, x + 1, y, status)
                markCell(map, x, y - 1, status)
                markCell(map, x, y + 1, status)
            }
        }
        for (var i = 0; i < this.rows; i++) {
            for (var j = 0; j < this.cols; j++) {
                var status = {
                    value: this.numMap[i][j],
                    count: 0,
                    nodes: [],
                    bClear: false
                }
                markCell(this.numMap, i, j, status)
                if (status.bClear) {
                    rs.bClear = true
                }
            }
        }
        rs.map = this.numMap
        return rs
    },
    //填充函数---简单的随机填充
    randFill: function () {
        for (var i = 0; i < this.rows; i++) {
            for (var j = 0; j < this.cols; j++) {
                if (this.numMap[i][j] < 0) {
                    var rs = Math.random()
                    this.numMap[i][j] = this.weights.findIndex(v => rs < v) + 1
                }
            }
        }
        return {
            map: this.numMap,
            actions: []
        }
    },
    //填充函数---掉落填充，适用于消消乐
    dropFill: function () {
        var actions = []
        for (var j = 0; j < this.cols; j++) {
            var exIdx = -1
            for (var i = this.rows - 1; i >= 0; i--) {
                if (this.numMap[i][j] < 0) {
                    //往上寻找非0元素替换一下，相当于掉落
                    var bFind = false
                    for (var k = i - 1; k >= 0; k--) {
                        if (this.numMap[k][j] > 0) {
                            [this.numMap[i][j], this.numMap[k][j]] = [this.numMap[k][j], this.numMap[i][j]]
                            actions.push([k, j, i, j])
                            bFind = true
                            break
                        }
                    }
                    if (!bFind) {
                        //生成新的元素并掉落
                        var rs = Math.random()
                        this.numMap[i][j] = this.weights.findIndex(v => rs < v) + 1
                        //超出边界，表示新生成元素从边界外掉落
                        actions.push([exIdx, j, i, j, this.numMap[i][j]])
                        exIdx -= 1
                    }
                }
            }
        }
        return {
            map: this.numMap,
            actions: actions
        }
    },
    //填充函数---掉落填充，合成点数字加1
    mergeFill: function (refPoint, clears) {
        var pos = []
        var filters = []
        for (var j = 0; j < this.cols; j++) {
            for (var i = this.rows - 1; i > 0; i--) {
                if (this.numMap[i][j] < 0 && !filters.find(v => v[0] == i && v[1] == j)) {
                    for (var k = 0; k < clears.length; k++) {
                        if (clears[k].find(v => v[0] == i && v[1] == j)) {
                            filters.push(...clears[k])
                        }
                    }
                    var cur = [i, j]
                    if (refPoint) {
                        cur = [refPoint.x, refPoint.y]
                    }
                    var oldVal = this.numMap[cur[0]][cur[1]]
                    var newVal = 1 - oldVal
                    pos.push([...cur, -oldVal, newVal])
                    this.numMap[cur[0]][cur[1]] = newVal
                }
            }
        }
        var rs = this.dropFill()
        rs.mergePoints = pos
        return rs
    },
    check(refPoint) {
        var rs = this.clearSameElement()
        Object.assign(rs, this.mergeFill(refPoint, rs.clears))
        return rs
    }
}