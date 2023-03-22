这是一个瑞数5代解混淆的案例，这是我学习[ast解混淆](https://github.com/Alanhays/ast-decode) 的仓库，有兴趣的大佬可以来瞧瞧！本案例未考虑通用性，只是专项学习性的插件。这里只是解混淆了外层代码，并不是解混淆内部生成的代码。

先来看看效果：

[解混淆前的代码](https://raw.githubusercontent.com/Alanhays/ast-decode/master/RS5/encode.js) -> [解混淆后的代码](https://raw.githubusercontent.com/Alanhays/ast-decode/master/RS5/decode_result.js)
<a name="tNugV"></a>
### #If节点转Switch节点
<a name="lmhct"></a>
#### 例子 
这里是为switch合并做预处理，只针对最内层case，外层case并不在处理范围。
```javascript
if (_$nE < 4) {
    if (_$nE < 1) {
        _$hk = window,
            _$NB = String,
            _$OA = Array,
            _$Qd = document,
            _$uO = Date;
    } else if (_$nE < 2) {
        _$bx = _$hk['$_ts'] = {};
    } else if (_$nE < 3) {
        _$bx = _$hk['$_ts'];
    } else {
        _$_l = !_$bx;
    }
} else {
    if (_$nE < 5) {
        _$UX(0);
    } else if (_$nE < 6) {
        if (!_$_l)
            _$nI += 1;
    } else if (_$nE < 7) {
        _$bj = [4, 16, 64, 256, 1024, 4096, 16384, 65536];
    } else {
        return;
    }
}
----------------------------------------------
switch (_$nE) {
  case 3:
    switch (_$nE) {
      case 0:
        _$hk = window, _$NB = String, _$OA = Array, _$Qd = document, _$uO = Date;
      case 1:
        _$bx = _$hk['$_ts'] = {};
      case 2:
        _$bx = _$hk['$_ts'];
      case 3:
        _$_l = !_$bx;
    }
  case 4:
    switch (_$nE) {
      case 4:
        _$UX(0);
      case 5:
        if (!_$_l) _$nI += 1;
      case 6:
        _$bj = [4, 16, 64, 256, 1024, 4096, 16384, 65536];
      case 7:
        return;
    }
}
```
<a name="kEsDt"></a>
#### 插件
```javascript
function ifToSwitchNode(path, pathStr = "test.left") {
    function getNodes(path, list = []) {
        if (!path.isIfStatement()) {
            list.push({
                type: "SwitchCase",
                consequent: path.node.body,
                test: types.valueToNode(list[list.length - 2].right.value)
            })
            return list;
        }
        items.forEach(n => {
            let tmep = path.get(n);
            list.push(tmep.node);
        })
        return getNodes(path.get("alternate"), list);
    }

    function reductionTest(test) {
        switch (test.operator) {
            case "<":
                test = types.valueToNode(test.right.value - 1)
                break;
            case "===":
                test = types.valueToNode(test.right.value)
                break;
        }
        return test;
    }

    let items = ["test", "consequent"];
    let nodes = getNodes(path);
    let cases = [], count = Math.trunc(nodes.length / items.length);
    if (nodes.length % 2) cases.push(nodes.pop());
    for (let i = 0; i < count; i++) {
        cases.push({
            type: "SwitchCase",
            consequent: nodes.pop().body,
            test: reductionTest(nodes.pop())
        })
    }
    return {
        type: "SwitchStatement",
        discriminant: path.get(pathStr).node,
        cases: cases.reverse()
    }
}

const ifToSwitch = {
    IfStatement(path) {
        let {node} = path;
        let {alternate} = node;
        if (alternate === null) return;
        let newNode = ifToSwitchNode(path);
        path.replaceInline(newNode)
    }
}
```
<a name="N80wI"></a>
### 
<a name="Svjwf"></a>
### #switch合并
<a name="sSyfR"></a>
#### 例子
```javascript
switch (_$nE) {
  case 3:
    switch (_$nE) {
      case 0:
        _$hk = window, _$NB = String, _$OA = Array, _$Qd = document, _$uO = Date;
      case 1:
        _$bx = _$hk['$_ts'] = {};
      case 2:
        _$bx = _$hk['$_ts'];
      case 3:
        _$_l = !_$bx;
    }
  case 4:
    switch (_$nE) {
      case 4:
        _$UX(0);
      case 5:
        if (!_$_l) _$nI += 1;
      case 6:
        _$bj = [4, 16, 64, 256, 1024, 4096, 16384, 65536];
      case 7:
        return;
    }
}
----------------------------------------------
switch (_$nE) {
  case 0:
    _$hk = window, _$NB = String, _$OA = Array, _$Qd = document, _$uO = Date;
  case 1:
    _$bx = _$hk['$_ts'] = {};
  case 2:
    _$bx = _$hk['$_ts'];
  case 3:
    _$_l = !_$bx;
  case 4:
    _$UX(0);
  case 5:
    if (!_$_l) _$nI += 1;
  case 6:
    _$bj = [4, 16, 64, 256, 1024, 4096, 16384, 65536];
  case 7:
    return;
}
```
<a name="Y1y3k"></a>
#### 插件
```javascript
function getCaseAll(cases, caseAll = []) {
    if (!types.isSwitchStatement(cases[0].consequent[0])) return cases;
    for (let i = 0; i < cases.length; i++) {
        let caseNode = cases[i];
        if (!types.isSwitchStatement(caseNode.consequent[0])) {
            if (types.isSwitchStatement(cases[i - 1].consequent[0])) caseAll.push(caseNode);
            break;
        }
        caseAll = caseAll.concat(getCaseAll(caseNode.consequent[0].cases));
    }
    return caseAll;
}

const mergeSwitch = {
    SwitchStatement(path) {
        if (path.parentPath.isSwitchCase()) return;
        let nextPath = path.get("cases.0.consequent.0");
        if (!types.isSwitchStatement(nextPath)) return;
        path.node.cases = getCaseAll(path.node.cases);
    }
}
```


<a name="Zt262"></a>
### 
<a name="auZWJ"></a>
### #缓存关键数据
<a name="juaNo"></a>
#### 插件
这里是为方便后续操作做准备。
```javascript
/**
 * 向上查询某类型的ParentPath
 * @param path
 * @param type
 * @returns {null|*}
 */
function findParentPath(path, type) {
    while (!path.isProgram()) {
        path = path.parentPath;
        if (!path[`is${type}`]()) return path.parentPath;
    }
}
/**
 * 节点筛选器
 * @param list  [node/path...] 元素node或path都可
 * @param filter 类型 array [str...] 类型列表
 * @param filterMode 过滤器模式 默认false | false - 只输出配置的类型 true - 过滤（不输出）配置的类型
 * @param isCode 默认true返回代码 false返回节点列表
 * @returns {string|array} code/itemList
 */
function nodeFilter(list, filter = [true], filterMode = false, isCode = true) {
    let code = "", itemList = [];
    if (!list.length) return "";
    let isPath = typeof list[0].isReturnStatement === "function";
    if (isPath) list = list.reverse();
    list.forEach(node => {
        if (isPath) node = node.node;
        if (filter[0] === true ||
            (!filterMode === filter.includes(node.type))) {
            isCode ? code += `${generator(node).code}\n` : itemList.push(node);
        }
    })
    return isCode ? code : itemList;
}
/***
 * 获取需要用到的对象名和节点
 * @param path
 * @param resultPath
 */
function getFuncInfo(path, resultPath) {
    let info = Object();
    info["switchPath"] = path.get('body.body.1');
    let expressionNode = path.node.body.body[0];
    let arrayName = expressionNode.expression.right.object.name;
    let largeArrayInit = path.scope.getBinding(arrayName).path.node.init;
    let largeArrayName = largeArrayInit.object.name;
    let largeArrayIndex = largeArrayInit.property.value;
    info["array"] = eval(generator(path.scope.getBinding(largeArrayName).path.node.init).code)[largeArrayIndex];
    info["indexName"] = expressionNode.expression.right.property.argument.name;
    info["variable"] = nodeFilter(path.getAllPrevSiblings(), ['VariableDeclaration', 'FunctionDeclaration'], false, false);
    info["path"] = resultPath;
    return info;
}
let funcInfo = {};
/***
 * 缓存关键数据
 * @type {{WhileStatement(*): void}}
 */
const cacheCriticalData = {
    WhileStatement(path) {
        let resultPath = findParentPath(path, "FunctionDeclaration");
        if (!resultPath) return;
        let funcName = "main";
        if (!resultPath.isFunctionExpression()) {
            funcName = resultPath.node.id.name;
        }
        //  缓存path和关键变量名以便后续使用
        funcInfo[funcName] = getFuncInfo(path, resultPath);
    }
}
```

<a name="Hr3DI"></a>
### 
<a name="QCypp"></a>
### #合并调用信息前的准备
<a name="WSp0E"></a>
#### 插件
```javascript
let cache = {};
const mergeCallInfo = {
    CallExpression(path) {
        let name = path.node.callee.name;
        if (Object.keys(funcInfo).includes(name)) {
            let now = funcInfo[name];
            const {cases} = now.switchPath.node;
            let value = path.node.arguments[0].value;
            let replaceBody = [];
            let callCode = path.toString();
            if (Object.keys(cache).includes(callCode)) return;
            let constantViolations = (() => {
                let list = [];
                now.path.scope.getBinding(now.indexName).constantViolations.forEach(p => list.push(p.node.start))
                return list;
            })();
            for (let i = value; i < now.array.length; i++) {
                let index = now.array[i];
                let case_body = cases[index].consequent[0];
                if (types.isIfStatement(case_body)) case_body.start = case_body.consequent.start;
                if (case_body && constantViolations.includes(case_body.start)) {
                    if (types.isIfStatement(case_body)) {
                        let node = JSON.parse(JSON.stringify(path.node));
                        node.arguments[0].value = evaluationExpression(case_body.consequent, now.indexName, i);
                        case_body.consequent = node;
                    } else {
                        i = evaluationExpression(case_body, now.indexName, i);
                        case_body = null;
                    }
                }
                if (!case_body) continue;
                replaceBody.push(case_body);
                if (types.isReturnStatement(case_body)) break;
            }
            if (!replaceBody.length) return;
            replaceBody = now.variable.concat(replaceBody);
            cache[callCode] = {
                type: "ExpressionStatement",
                expression: {
                    type: "CallExpression",
                    callee: {
                        type: "FunctionExpression",
                        params: now.path.node.params,
                        body: {
                            type: "BlockStatement",
                            body: replaceBody
                        }
                    },
                    arguments: path.node.arguments
                }
            };
        }
    }
}
```
<a name="YAN1D"></a>
### 
<a name="MBzCm"></a>
### $#合并调用
<a name="pD9P7"></a>
#### 例子
```javascript
 switch (_$8w) {
        case 0:
          _$hk['$_ts'] = {};
        case 1:
          _$qA = _$vT.substr(_$yG, _$B_).split(_$NB.fromCharCode(255));
        case 2:
          var _$6U = _$UX(10);
        case 3:
          var _$B_ = _$z6();
        case 4:
          _$6U += "boDAnZapOCX8xJU2au447jYLkgwNztHO7AuauIp4P26lQTtdW5d$Q3e1G5F9IC3qE8ksXFTNV0jGl75dTsyxNioGl4Svu60uHKu3zrllyNPYY939zhkvUkumErxFngcRvZax5JQGjs3gejM9wARz_JsdQepMi5S6GKrhg3LvVtwUD70h1ZXQA3OjFPNF";
        case 5:
          _$pY = _$8_ === undefined || _$8_ === "";
        case 6:
          return 0;
        case 7:
          return _$UX(12, _$6U);
        case 8:
          var _$nE = _$z6();
        case 9:
          _$8_._$hk = 12;
        case 10:
          var _$dQ = _$z6();
----------------------------------------------
   _$8_._$DK = 7;
  _$8_._$hk = 12;
  _$8_._$6n = 4;
  _$8_._$Hn = "_$74";
  _$8_._$Li = "_$v5";
  _$8_._$gP = "_$pl";
  _$8_._$jq = "_$ez";
  _$8_._$u5 = "_$2X";
  _$8_._$Zu = "_$Gn";
  _$8_._$XK = "_$qK";
  _$8_._$jS = "_$Ui";
  _$8_._$pY = "_$qL";
  _$8_._$J6 = "_$nE";
  _$8_._$OA = "gabGed5GyIa";
  _$8_._$2t = "JTKWP2.d7Dq";
  _$8_._$uO = "Cr9JCX._VGtwUqL.MQKwjE";
  _$8_._$B2 = "8ew8MTOflwq";
  _$8_._$NB = _$KM;
  _$8_._$Lc = "hLBEA6IMPqBY1gfp_t9V1G";
  _$8_._$tQ = 57;
```
<a name="vkBCs"></a>
#### 插件
因为直接替换卡住了，所有返璞归真正则替换吧！
```javascript
function processCharacters(str) {
    return str.replace(/\$/g, "\\$").replace(/\[/g, "\\[")
        .replace(/\]/g, "\\]").replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/\+/g, "\\+");
}
function replaceMergeCall() {
    let cacheKeys = Object.keys(cache);
    let {code} = generator(ast);
    cacheKeys = [...new Set(cacheKeys)];
    cacheKeys = [...cacheKeys, ...cacheKeys, ...cacheKeys];
    cacheKeys.forEach(key => {
        let re = new RegExp(processCharacters(key), "g");
        let callCode = nodeFilter([cache[key]]);
        code = code.replace(re, callCode.replace(/\'/g, '"'));
    })
    ast = parser.parse(code.replace(/;\n;/g, ";"));
}
```
<a name="RltqZ"></a>
### 
<a name="U3916"></a>
### #拆分逗号表达式
<a name="ymebe"></a>
#### 插件
copy的蔡老板的插件，有现成何必动手。
```javascript
const decode_comma = {
    //破解逗号表达式，兼容之前的脚本
    ExpressionStatement(path) {
        let {expression} = path.node;
        if (!types.isSequenceExpression(expression)) return;
        let body = [];
        expression.expressions.forEach(express => {
            body.push(types.expressionStatement(express));
        })
        path.replaceInline(body);
    }
}
```
<a name="hEhaI"></a>
### 
<a name="JjqrZ"></a>
### #删除未引用
<a name="H1G53"></a>
#### 插件
```javascript
/***
 * 删除未引用
 * @type {{VariableDeclarator(*): void}}
 */
const unreferenced = {
    'VariableDeclarator|FunctionDeclaration'(path) {
        const func_name = path.node.id.name;
        const binding = path.scope.getBinding(func_name);
        // 如果变量没有被引用过，那么删除也没关系
        // 此处不能用有无修改过进行判断，因为没有被修改过并不意味着没用
        if (binding && !binding.referenced) path.remove();
    }
}
```
<a name="WXUZ5"></a>
### 
<a name="MtqCn"></a>
### #定制的删除未引用
<a name="vhFwA"></a>
#### 插件
ast学的不深就乱写了，本着能用就行。
```javascript
const forUnreferenced = {
    VariableDeclarator(path) {
        let _path = path.parentPath.parentPath.parentPath;
        if (!_path.isFunctionExpression() || !_path.node.params.length) return;
        let body = _path.node.body.body;
        let start = body[0].start;
        let end = body[body.length - 1].end;
        let name = path.node.id.name;
        const binding = path.scope.getBinding(name);
        if (!binding) return;
        let referencePaths = binding.referencePaths;
        let referenced = 0;
        for (let i = 0; i < binding.references; i++) {
            let rp = referencePaths[i];
            if (start < rp.node.start && rp.node.start < end) referenced++;
        }
        if (referenced) return;
        path.remove();
    }
}
```
<a name="mCJ4h"></a>
### 
<a name="TbdJa"></a>
### #替换值函数
只return数字的函数。
```javascript
const replaceValueFunc = {
    FunctionDeclaration(path) {
        let {body, id, params} = path.node;
        if (params.length || body.body.length !== 1) return;
        const binding = path.scope.getBinding(id.name);
        if (!binding) return;
        let referencePaths = path.scope.getBinding(id.name).referencePaths;
        referencePaths.forEach(rp => {
            rp.parentPath.replaceInline(body.body[0].argument)
        })
        path.remove();
    }
}
```
<a name="aPfvZ"></a>
### 
<a name="hz1XN"></a>
### #取反if
```javascript
const negateJudgment = {
    IfStatement(path) {
        let {test, consequent} = path.node;
        if (!types.isUnaryExpression(test)) return;
        if (!types.isCallExpression(consequent.expression)) return;
        path.node.consequent = consequent.expression.callee.body;
    }
}
```
<a name="gpXUu"></a>
### 
<a name="AI3Zw"></a>
### #解码控制流
到这里只有7个case了
```javascript
const decodeControlFlow = {
    WhileStatement(path) {
        let {body} = path.node;
        let switchNode = body.body[1];
        let {cases} = switchNode;
        let replace_body = [];
        funcInfo['main'].array.forEach(index => {
                let case_body = cases[index].consequent;
                if (types.isContinueStatement(case_body[case_body.length - 1])) {
                    case_body.pop();
                }
                replace_body = replace_body.concat(case_body);
            }
        );
        path.replaceInline(replace_body);
    }
}
```
<a name="CDOBF"></a>
### 
