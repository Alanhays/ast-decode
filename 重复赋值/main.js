//babel库及文件模块导入
const fs = require('fs');

//babel库相关，解析，转换，构建，生产
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const types = require("@babel/types");
const generator = require("@babel/generator").default;
//读取文件
let encode_file = "./encode.js", decode_file = "./decodeResult.js";
if (process.argv.length > 2) {
    encode_file = process.argv[2];
}
if (process.argv.length > 3) {
    decode_file = process.argv[3];
}

let jsCode = fs.readFileSync(encode_file, {encoding: "utf-8"});
//转换为ast树
let ast = parser.parse(jsCode);

const restoreAssignment = {
    VariableDeclarator(path) {
        let {id, init} = path.node;
        if (!init || !types.isIdentifier(init)) return;

        const binding = path.scope.getBinding(id.name);

        let referencePaths = binding.referencePaths;
        if (!binding || !referencePaths.length) return;

        referencePaths.forEach(rp => {
            rp.replaceInline(init)
        })
        path.remove()
    }
}


//some function code

//调用插件，处理源代码
traverse(ast, restoreAssignment);

//生成新的js code，并保存到文件中输出
let {code} = generator(ast, opts = {jsescOption: {"minimal": true}});

fs.writeFile(decode_file, code, (err) => {
});