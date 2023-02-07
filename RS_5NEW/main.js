//babel库及文件模块导入
const fs = require('fs');
//babel库相关，解析，转换，构建，生产
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const types = require("@babel/types");
const generator = require("@babel/generator").default;
//读取文件
let encode_file = "./encode.js", decode_file = "./decode_result.js";
if (process.argv.length > 2) {
    encode_file = process.argv[2];
}

if (process.argv.length > 3) {
    decode_file = process.argv[3];
}

let jsCode = fs.readFileSync(encode_file, {encoding: "utf-8"});
//转换为ast树
let ast = parser.parse(jsCode);

//  表达式日志
const EXPRESSION_LOG = false;
//  if节点日志
const IF_LOG = false;

//  声明变量
const globalEval = eval;
let scope = ["main"];
let index;
let funcInfo = {};
let initCode;
let nextBody;

/**
 * 向上查询某类型的path
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
 * 计算表达式
 * @param node 表达式 node  type: Expression
 * @param name
 * @param value
 * @returns {any} 输出表达式code执行的结果
 */
function evaluationExpression(node, name, value) {
    let replaceList = [[name, value]];
    if (types.isExpressionStatement(node)) {
        //  处理赋值操作直接返回value
        if (node.expression.operator === "=") return node.expression.right.value;
        replaceList = replaceList.concat([["\\+=", "+"], ["\\-=", "-"]]);
    }
    let reg, code = generator(node).code;
    let _code = code;
    replaceList.forEach(item => {
        //  动态生成正则 需要注意$字符
        reg = new RegExp(`${item[0].replace(/\$/g, "\\$")}`, "g");
        //  获取testCode | 将替换标识符为value 例子 -> let v = 1 | test节点代码 v >= 1 | 替换后 1 >= 1
        code = code.replace(reg, item[1]);
    });
    !EXPRESSION_LOG || console.log(`${node.type} | ${_code} | ${code}`);
    return globalEval(code);
}

/**
 * 节点筛选器
 * @param list  [node/path...] 元素node或path都可
 * @param filter 类型 array [str...] 类型列表
 * @param filterMode 过滤器模式 默认false | false - 只输出配置的类型 true - 过滤（不输出）配置的类型
 * @param isCode 默认返回code false返回节点列表
 * @returns {string|array} code/itemList
 */
function nodeFilter(list, filter = [true], filterMode = false, isCode = true) {
    let code = "", itemList = [];
    let isPath = typeof list[0].isReturnStatement === "function";
    if (isPath) list = list.reverse();
    list.forEach(node => {
        if (isPath) node = node.node;
        if (filter[0] === true ||
            (!filterMode === filter.includes(node.type))) {
            isCode ? code += `\n${generator(node).code}` : itemList.push(node);
        }
    })
    return isCode ? code : itemList;
}

/***
 * 构造自执行节点
 * @param _arguments
 * @param bodyNode
 * @returns
 */
function constructSelfExecution(_arguments, bodyNode) {
    return {
        type: "ExpressionStatement",
        expression: {
            type: "CallExpression",
            callee: {
                type: "FunctionExpression",
                params: getScopeInfo("path").node.params,
                body: {
                    type: "BlockStatement",
                    body: getScopeInfo("initVariableDeclaration").concat(bodyNode)
                }
            },
            arguments: _arguments,
            operator: false
        }
    };
}


/***
 *  调用函数还原
 * @param path
 * @returns {*[]}
 */
function callRestore(path) {
    path.traverse({
        CallExpression(path) {
            let name = path.node.callee.name;
            if (Object.keys(funcInfo).includes(name)) {
                //  更新作用域
                scope.push(name);
                let list = getProcess(path.node.arguments[0].value);
                //  构造自执行函数node
                let newNode = constructSelfExecution(path.node.arguments, list)
                path.replaceInline(newNode)
            }
        }
    })
}

/**
 * 获取执行代码
 * 递归遍历if节点获取index下真正执行的code
 * @param path  IfStatement类型的path
 * @param index {number} 瑞数 5代新版的数组指针
 * @returns {*} node或 nodeList
 */
function getBody(path, index) {
    if (path === undefined) return;
    //  es6语法 等价于 const node = path;
    const {node} = path;
    const {consequent, alternate, test} = node;

    //  当修改了指针的时候
    if (path.isExpressionStatement() &&
        types.isAssignmentExpression(node.expression) &&
        node.expression.left.name === getScopeInfo("indexName")) {
        return evaluationExpression(node, getScopeInfo("indexName"), ++index);
    }

    //  return节点和不是if节点直接返回
    if (!path.isIfStatement() || path.isReturnStatement()) {
        nextBody.forEach(n => {
        if (types.isExpressionStatement(n) &&
            types.isCallExpression(n.expression) &&
            n.expression.callee.name === "_$3m") {
            console.log(`${n.expression.callee.name}-----------------------------------------`)
            nextBody[nextBody.indexOf(n)] = coreCallRestore(n);
        }
    })
        callRestore(path)
        return nextBody.length > 1 ? nextBody : node;
    }

    //  读取表达式中变量的值
    let value = globalEval(getScopeInfo("arrayName"))[index];
    let expressionResult;
    //  test节点为call类型 无法计算test节点结果 还原调用后计算其结果
    if (types.isCallExpression(test)) {
        callRestore(path)
        expressionResult = eval(generator(types.expressionStatement(node.test)).code);
    } else {
        if (path.isUnaryExpression()) {
            /** 专项处理特殊代码 -> if (!_$2L) {_$ex += 2;}
             * 开始尝试获取_$2L的值，然后发现行不通。
             *  虽然不知道表达式的值 但是能知道if代码块需要执行的代码
             *  _$ex也就是指针 更新指针然后继续递归拿到code 然后替换这个if的consequent不就行了
             */
            let _index = evaluationExpression(consequent.body[0], getScopeInfo("indexName"), index);
            //  替换consequent.body
            node.consequent.body = getProcess(_index);
            return node;
        }
        //  计算表达式的值
        expressionResult = evaluationExpression(test, getScopeInfo("expressionVariableName"), value);
    }

    //  根据结果选择节点向下遍历直到拿到node（选择左右节点）
    nextBody = expressionResult ? consequent.body : alternate.body;
    let nodeStr = expressionResult ? 'consequent' : 'alternate';
    !IF_LOG || console.log(generator(nextBody[0]).code);
    let endIndex = nextBody.length - 1;
    if (nextBody[endIndex] === null) return;
    let result = getBody(path.get(`${nodeStr}.body.${endIndex}`), index);
    //  专项处理大数组偏移
    if (scope.length === 1 && result === 0 && nextBody.length > 1) {

        //  执行数组偏移代码
        //
        console.log(index, result);
    }
    //  处理核心函数调用 _$NM(2, _$fL)|_$rJ(7, _$Cl)|_$3m(0)|_$3d(0);
    nextBody.forEach(n => {
        if (types.isExpressionStatement(n) &&
            types.isCallExpression(n.expression) &&
            Object.keys(funcInfo).includes(n.expression.callee.name)) {
            console.log(`${n.expression.callee.name}-----------------------------------------`)
            nextBody[nextBody.indexOf(n)] = coreCallRestore(n);
        }
    })
    //  继续深度遍历
    return result;
}

/**
 * 核心调用还原
 * @param node 瑞数 5代新版的更新指针的调用入口 nod
 */
function coreCallRestore(node) {
    let calleeIdentifier = node.expression.callee.name;
    scope.push(calleeIdentifier);
    let _index = node.expression.arguments[0].value;
    initCode = nodeFilter(getScopeInfo('initVariableDeclaration'), ['VariableDeclaration']);
    let paramName = getScopeInfo('path').node.params[0].name;
    globalEval(initCode.replace(new RegExp(paramName.replace(/\$/g, '\\$'), 'g'), index));
    let process = getProcess(_index);
    scope.push(calleeIdentifier);
    let newNode = constructSelfExecution(node.expression.arguments, process);
    let code = nodeFilter([newNode], ['ReturnStatement'], true);
    console.log(code)
    if (calleeIdentifier === "_$3d") globalEval(code);
    if (scope.length > 1) scope.pop();
    return newNode;
}

/***
 * 获取执行流程code
 * 模拟while循环遍历if节点，并且返回被执行的nodeList
 * @param index
 * @returns {*[]}
 */
function getProcess(index) {
    let path = getScopeInfo('startPath');
    let bodyList = [], result;
    //  模拟while循环
    while (1) {
        //  递归获取真正执行的代码块
        result = getBody(path, index);
        //  更新指针
        if (typeof result === "number") {
            index = result;
            continue;
        }
        if (Array.isArray(result)) {
            bodyList = bodyList.concat(result);
        } else {
            if (result instanceof Object) {
                bodyList.push(result);
            }
        }
        //  返回node为return或If类型则结束循环
        if (types.isReturnStatement(result) || types.isIfStatement(result)) break;
        index++;
    }
    //  退出当前作用域
    if (scope.length > 1) scope.pop();
    return bodyList;
}

/***
 * 获取作用域信息
 * @param key
 * @returns {*}
 */
function getScopeInfo(key) {
    return funcInfo[scope[scope.length - 1]][key];
}

/***
 * 获取需要用到的对象名和节点
 * @param path
 * @param resultPath
 */
function getFuncInfo(path, resultPath) {
    let info = {};
    info["startPath"] = path.get('body.body.1');
    let expressionNode = path.node.body.body[0];
    info["expressionVariableName"] = expressionNode.expression.left.name;
    info["arrayName"] = expressionNode.expression.right.object.name;
    info["indexName"] = expressionNode.expression.right.property.argument.name;
    info["originalArrayName"] = path.scope.getBinding(info["arrayName"]).path.node.init.object.name;
    info["whilePath"] = path;
    info["path"] = resultPath;
    info["initVariableDeclaration"] = nodeFilter(path.getAllPrevSiblings(), ['VariableDeclaration'], false, false);
    return info;
}

/***
 * 缓存关键数据
 * @type {{WhileStatement(*): void}}
 */
const cacheCriticalData = {
    WhileStatement(path) {
        let resultPath = findParentPath(path, "FunctionDeclaration");
        if (!resultPath) return;
        let funcName = scope[0];
        if (!resultPath.isFunctionExpression()) {
            funcName = resultPath.node.id.name;
        }
        //  缓存path和关键变量名以便后续使用
        funcInfo[funcName] = getFuncInfo(path, resultPath);
    }
}

/***
 * 控制流平坦化
 * @type {{WhileStatement(*): void}}
 */
const controlFlowFlattening = {
    WhileStatement(path) {
        let resultPath = findParentPath(path, "FunctionDeclaration");
        if (!resultPath) return;
        if (resultPath.isFunctionExpression()) {
            let codeNode = getProcess(globalEval(getScopeInfo("indexName")));
            let code = nodeFilter(codeNode, ['ReturnStatement', 'CallExpression'], true)
            console.log(code)
            codeNode.forEach(n => {
                path.insertBefore(n)
            })
            path.remove()
        }
    }
}

/***
 * 规范 if节点
 * 可以理解为将if节点变成了一颗二叉树
 * @type {{IfStatement(*): void}}
 */
const specificationIfElse = {
    IfStatement(path) {
        ["alternate", "consequent"].forEach((nodeName) => {
            //  获取子节点
            const nodePath = path.get(nodeName)
            // 过滤类型是BlockStatement的节点
            if (nodePath.isBlockStatement()) return;
            //  原始方式构造节点
            const newNode = {
                type: "BlockStatement",
                body: [nodePath.node]
            }
            //  替换节点
            nodePath.replaceWith(newNode)
        })
    }
}

/***
 * 删除未引用
 * @type {{VariableDeclarator(*): void}}
 */
const unreferenced = {
    VariableDeclarator(path) {
        const func_name = path.node.id.name;
        const binding = path.scope.getBinding(func_name);
        // 如果变量没有被引用过，那么删除也没关系
        // 此处不能用有无修改过进行判断，因为没有被修改过并不意味着没用
        if (binding && !binding.referenced) {
            path.remove();
        }
    }
}

console.time("处理完毕，耗时");
console.log("删除未引用变量...")
traverse(ast, unreferenced)
console.log("规范if else节点...")
traverse(ast, specificationIfElse);
console.log("缓存关键数据...")
traverse(ast, cacheCriticalData)
console.log("初始化变量...")
let mainVariableCode = nodeFilter(getScopeInfo("initVariableDeclaration"), ['VariableDeclaration']);
globalEval(mainVariableCode)
console.log("控制流平坦化...")
traverse(ast, controlFlowFlattening);
console.timeEnd("处理完毕，耗时");

//生成新的js code，并保存到文件中输出
let {code} = generator(ast, opts = {jsescOption: {"minimal": true}});

fs.writeFile(decode_file, code, (err) => {
});