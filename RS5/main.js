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
    replaceList.forEach(item => {
        //  动态生成正则 需要注意$字符
        reg = new RegExp(`${item[0].replace(/\$/g, "\\$")}`, "g");
        //  获取testCode | 将替换标识符为value 例子 -> let v = 1 | test节点代码 v >= 1 | 替换后 1 >= 1
        code = code.replace(reg, item[1]);
    });
    try {
        return eval(code);
    } catch (e) {
        console.error(e)
        debugger
    }
}

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

const negateJudgment = {
    IfStatement(path) {
        let {test, consequent} = path.node;
        if (!types.isUnaryExpression(test)) return;
        if (!types.isCallExpression(consequent.expression)) return;
        path.node.consequent = consequent.expression.callee.body;
    }
}

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

console.time("处理完毕，耗时")
traverse(ast, ifToSwitch)
traverse(ast, mergeSwitch)
traverse(ast, cacheCriticalData)
traverse(ast, mergeCallInfo)
replaceMergeCall()
traverse(ast, decode_comma)
traverse(ast, unreferenced)
traverse(ast, forUnreferenced)
traverse(ast, replaceValueFunc)
traverse(ast, negateJudgment)
traverse(ast, decodeControlFlow)
console.timeEnd("处理完毕，耗时")

//生成新的js code，并保存到文件中输出
let {code} = generator(ast, opts = {jsescOption: {"minimal": true}});

fs.writeFile(decode_file, code, (err) => {
});