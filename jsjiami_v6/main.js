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

let jscode = fs.readFileSync(encode_file, {encoding: "utf-8"});
//转换为ast树
let ast = parser.parse(jscode);


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

//  获取大数组和偏移函数 怎么方便怎么来
let nodes = ast.program.body.splice(0, 3)
let init_code = nodeFilter(nodes)
// let arr_name = nodes[1].expression.arguments[0].name
let func_name = nodes[2].declarations[0].id.name
eval(init_code)
const visitor = {
    CallExpression(path) {
        let {callee} = path.node;
        if (callee.name !== func_name) return;
        let call_code = path.toString()
        let value = eval(call_code)
        // console.log(`${call_code} --> ${value}`)
        path.replaceInline(types.valueToNode(value))
    }
}

//调用插件，处理源代码
traverse(ast, visitor);

function isBaseLiteral(node) {
    if (types.isLiteral(node)) {
        return true;
    }
    if (types.isUnaryExpression(node, {operator: "-"}) ||
        types.isUnaryExpression(node, {operator: "+"})) {
        return isBaseLiteral(node.argument);
    }
    return false;
}


const decodeObject = {
    VariableDeclarator(path) {
        let {node, scope} = path;
        const {id, init} = node;
        if (!types.isObjectExpression(init)) return;
        let properties = init.properties;
        if (properties.length == 0 ||
            !properties.every(property => isBaseLiteral(property.value) || types.isFunctionExpression(property.value)))
            return;
        let binding = scope.getBinding(id.name);
        let {constant, referencePaths} = binding;
        if (!constant) return;

        let newMap = new Map();
        for (const property of properties) {
            let {key, value} = property;
            newMap.set(key.value, value);
        }
        let canBeRemoved = true;
        for (const referPath of referencePaths) {
            let {parentPath} = referPath;
            if (!parentPath.isMemberExpression()) {
                canBeRemoved = false;
                return;
            }
            let curKey = parentPath.node.property.value;
            if (!newMap.has(curKey)) {
                canBeRemoved = false;
                break;
            }
            let item = newMap.get(curKey)
            if (types.isFunctionExpression(item)) {
                item = types.expressionStatement(item)
            }
            // console.log(parentPath.toString() + "\n-->\n" + generator(item).code + "\n")
            parentPath.replaceInline(item);
        }
        canBeRemoved && path.remove();
        newMap.clear();
    },
}

//调用插件，处理源代码
traverse(ast, decodeObject);

const callRestore = {
    CallExpression(path) {
        let {callee, arguments} = path.node;
        if (!types.isFunctionExpression(callee)) return;
        if (!callee.body.body.length && !types.isReturnStatement(callee.body.body[0])) return;
        let {params} = callee
        let real = callee.body.body[0].argument
        if (types.isBinaryExpression(real)) {
            if (params.length !== 2) return;
            let left = real.left.name === params[0].name ? 0 : 1;
            let right = real.right.name === params[1].name ? 1 : 0;
            let new_node = {
                type: "BinaryExpression",
                operator: real.operator,
                left: arguments[left],
                right: arguments[right]
            }
            path.replaceInline(new_node)
        } else if (types.isCallExpression(real)) {
            if (params.length !== 2) return;
            let new_node;
            if (types.isFunctionExpression(real.callee)) {
                let _arguments0 = real.arguments[0].name === params[0].name ? 0 : 1;
                let _arguments1 = real.arguments[1].name === params[1].name ? 1 : 0;
                new_node = {
                    type: "CallExpression",
                    callee: real.callee,
                    arguments: [arguments[_arguments0], arguments[_arguments1]]
                }
            } else if (types.isIdentifier(real.callee)) {
                let _call = real.callee.name = params[0].name ? 0 : 1;
                let _arguments = real.arguments[0].name === params[1].name ? 1 : 0;
                new_node = {
                    type: "CallExpression",
                    callee: arguments[_call],
                    arguments: [arguments[_arguments]]
                }
            }
            path.replaceInline(new_node)
        }
    }
}
traverse(ast, callRestore);

const decode_while = {
    WhileStatement(path) {
        let {body} = path.node;
        let swithchNode = body.body[0];
        if (!types.isSwitchStatement(swithchNode)) return;
        let {discriminant, cases} = swithchNode;
        if (!types.isMemberExpression(discriminant) || !types.isUpdateExpression(discriminant.property)) return;
        let arrayName = discriminant.object.name;
        //获得所有上方的兄弟节点  这里获取到的是两个变量声明的节点
        let per_bro_node = path.getAllPrevSiblings()[0];
        let array = eval(per_bro_node.toString() + arrayName)
        per_bro_node.remove()
        let replace_body = [];
        array.forEach(index => {
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
traverse(ast, decode_while);

const restoreJudgment = {
    IfStatement(path) {
        const {test, consequent, alternate} = path.node;
        if (!types.isBinaryExpression(test)) return;
        const {left, right} = test;
        if (!types.isLiteral(left) || !types.isLiteral(right)) return;
        let code = generator(test).code
        let result = eval(code)
        let nodeList = result ? consequent.body : alternate.body;
        nodeList.forEach(n => {
            path.insertBefore(n)
        })
        path.remove()
    }
}

traverse(ast, restoreJudgment);

//生成新的js code，并保存到文件中输出
let {code} = generator(ast, opts = {jsescOption: {"minimal": true}});

fs.writeFile(decode_file, code, (err) => {
});