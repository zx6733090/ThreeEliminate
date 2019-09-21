--[[数字游戏--]]
local DigitalGame ={
    rows=5,
    cols=5,
    weights={0.35, 0.65, 0.85, 0.95, 1},
    numMap={}
 }
 function DigitalGame:randMap()
     --按概率生成数字
     for i=1,self.rows do
         self.numMap[i] = {}
         for j=1,self.cols do
             local rs = math.random()
             for k=1,#self.weights do
                 if rs<self.weights[k] then
                     self.numMap[i][j] = k
                     break
                 end
             end
         end
     end
     --能消除的元素 重新生成
     while  self:clearSameElement().bClear do
         self:randFill()
     end
     return self.numMap
 end
 --操作3个或者以上的相邻且相同的元素
 function  DigitalGame:clearSameElement()
     local rs = {
             bClear= false,
             clears= {}
         }
         --标记清除元素
         local function markCell(map, x, y, status)
             if x < 1 or x > self.rows  or y < 1  or y > self.cols  then
                 --越界的返回
                 return
             end
             if map[x][y] < 0 then
                 --已经访问过的返回
                 return
             end
             for i=1,#status.nodes do
                 local v = status.nodes[i]
                 if v.x == x and v.y==y then
                     --已经访问过的返回
                     return
                 end
             end
             if map[x][y] == status.value then
                 status.count = status.count+1
                 if status.count >= 3 then
                     if not status.bClear then
                         status.bClear = true
                         table.insert(rs.clears,{})
                         for i=1,#status.nodes do
                             local v = status.nodes[i]
                             map[v.x][v.y] = -map[v.x][v.y]
                             table.insert(rs.clears[#rs.clears],{v.x, v.y,status.value})
                         end
                     end
                     map[x][y] = -map[x][y]
                     table.insert(rs.clears[#rs.clears],{x, y,status.value})
                 else
                     table.insert(status.nodes,{x=x,y=y})
                 end
                 markCell(map, x - 1, y, status)
                 markCell(map, x + 1, y, status)
                 markCell(map, x, y - 1, status)
                 markCell(map, x, y + 1, status)
             end
         end
         for i=1,self.rows do
             for j=1,self.cols do
                 local status = {
                     value= self.numMap[i][j],
                     count= 0,
                     nodes= {},
                     bClear= false
                 }
                 markCell(self.numMap, i, j, status)
                 if status.bClear then
                     rs.bClear = true
                 end
             end
         end
         rs.map = self.numMap
         return rs
 end
 --填充函数---简单的随机填充
 function DigitalGame:randFill()
     for i=1,self.rows do
         for j=1,self.cols do
             if self.numMap[i][j] < 0 then
                 local rs = math.random()
                 for k=1,#self.weights do
                     if rs<self.weights[k] then
                         self.numMap[i][j] = k
                         break
                     end
                 end
             end
         end
     end
     return {
         map = self.numMap,
         actions = {}
     }
 end
 --填充函数---掉落填充，适用于消消乐
 function DigitalGame:dropFill()
         local actions = {}
         for j=1,self.cols do
             local exIdx = 0
             for i=self.rows,1,-1 do
                 if self.numMap[i][j] < 0 then
                     --往上寻找非0元素替换一下，相当于掉落
                     local bFind = false
                     for k=i-1,1,-1 do
                         if self.numMap[k][j] > 0 then
                             self.numMap[i][j], self.numMap[k][j] = self.numMap[k][j], self.numMap[i][j]
                             table.insert(actions,{k, j, i, j})
                             bFind = true
                             break
                         end
                     end
                     if not bFind then
                         --生成新的元素并掉落
                         local rs = math.random()
                         for k=1,#self.weights do
                             if rs<self.weights[k] then
                                 self.numMap[i][j] = k
                                 break
                             end
                         end
                         --超出边界，表示新生成元素从边界外掉落
                         table.insert(actions,{exIdx, j, i, j, self.numMap[i][j]})
                         exIdx = exIdx-1
                     end
                 end
             end
         end
         return {
             map= self.numMap,
             actions= actions
         }
 end
 --填充函数---掉落填充，合成点数字加1
 function DigitalGame:mergeFill(refPoint, clears)
         local pos = {}
         local filters = {}
         for j=1,self.cols do
             for i=self.rows,1,-1 do
                 if self.numMap[i][j] < 0 then
                     local bFind =false
                     for k=1,#filters do
                        local v=filters[k]
                        if v[1] == i and v[2] == j then
                             bFind=true
                             break
                        end
                     end
                     if not bFind then
                         for m=1,#clears do
                             local bFind =false
                             for n=1,#clears[m] do
                                 local v= clears[m][n]
                                 if v[1] == i and v[2] == j then
                                     bFind=true
                                 end
                             end
                             if bFind then
                                 for n=1,#clears[m] do
                                    table.insert(filters,clears[m][n])
                                 end
                             end
                         end
                         local cur = {i, j}
                         if refPoint then
                             cur = {refPoint.x, refPoint.y}
                         end
                         local oldVal = self.numMap[cur[1]][cur[2]]
                         local newVal = 1 - oldVal
                         table.insert(pos,{cur[1],cur[2],-oldVal,newVal})
                         self.numMap[cur[1]][cur[2]] = newVal
                     end
                 end
             end
         end
         local rs = self:dropFill()
         rs.mergePoints = pos
         return rs
 end
 function DigitalGame:check(refPoint)
     local rs = self:clearSameElement()
     local merges = self:mergeFill(refPoint,rs.clears)
     for k,v in pairs(merges) do
         rs[k]=v
     end
     return rs
 end